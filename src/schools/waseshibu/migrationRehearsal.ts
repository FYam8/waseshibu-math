import type { CanonicalLearnerStateMigrationCandidate } from '../../engine/learnerState'
import { DATA_VERSION_KEY } from '../../dataMigration'
import { WASESHIBU_APP_PROFILE } from './appProfile'
import { WASESHIBU_EXAM_CATALOG } from './legacyCompatibility'
import { auditWaseShibuDualRead } from './dualReadAudit'
import { auditWaseShibuActivities } from './activityAudit'

const ATTEMPT_KEY = 'waseshibu-math-attempts'
const PREF_KEY = 'waseshibu-math-preferences'
const EXAM_KEY = 'waseshibu-math-exam-scores'
const DRAFT_KEY = 'waseshibu-math-exam-drafts-v2'
const ROUTE_KEY = 'waseshibu-math-learning-route-v1'
const META_KEY = 'waseshibu-math-sync-meta'

/**
 * Exact legacy source bytes covered by the current rehearsal.
 *
 * The scope now includes the legacy attempts container after it passed its own
 * independent activity shadow/parity gate. Daily/guided/remediation/Level2 and
 * other state families are still intentionally outside this rehearsal.
 */
export const WASESHIBU_REHEARSAL_SOURCE_KEYS = [
  ATTEMPT_KEY,
  PREF_KEY,
  EXAM_KEY,
  DRAFT_KEY,
  ROUTE_KEY,
  META_KEY,
  DATA_VERSION_KEY
] as const

export type WaseShibuRehearsalSourceKey = (typeof WASESHIBU_REHEARSAL_SOURCE_KEYS)[number]
export type WaseShibuRawSnapshot = Record<WaseShibuRehearsalSourceKey, string | null>

export type WaseShibuMigrationRehearsalIssue = {
  surface: string
  message: string
}

export type WaseShibuMigrationRehearsalReport = {
  /** Ready only for the next migration-engine step for the audited scope. */
  ready: boolean
  /** This is a rehearsal/read-model contract marker, not the app data version. */
  rehearsalContractVersion: 2
  scope: readonly ['preferences', 'examResults', 'drafts', 'route', 'activityRecords']
  sourceSnapshot: WaseShibuRawSnapshot
  canonicalCandidate: CanonicalLearnerStateMigrationCandidate
  issues: WaseShibuMigrationRehearsalIssue[]
}

function captureRawSnapshot(storage: Pick<Storage, 'getItem'> = localStorage): WaseShibuRawSnapshot {
  return Object.fromEntries(
    WASESHIBU_REHEARSAL_SOURCE_KEYS.map(key => [key, storage.getItem(key)])
  ) as WaseShibuRawSnapshot
}

function sameRawSnapshot(left: WaseShibuRawSnapshot, right: WaseShibuRawSnapshot) {
  return WASESHIBU_REHEARSAL_SOURCE_KEYS.every(key => left[key] === right[key])
}

function validateCanonicalCandidate(state: CanonicalLearnerStateMigrationCandidate) {
  const issues: WaseShibuMigrationRehearsalIssue[] = []
  const knownExamIds = new Set<string>(WASESHIBU_EXAM_CATALOG.map(exam => exam.examId))
  const knownTargetIds = new Set<string>(WASESHIBU_APP_PROFILE.targets.map(target => target.id))

  if (!knownTargetIds.has(state.preferences.targetId)) {
    issues.push({ surface: 'preferences', message: `unknown canonical targetId: ${state.preferences.targetId}` })
  }

  const resultIds = new Set<string>()
  for (const result of state.examResults) {
    if (!knownExamIds.has(result.examId)) {
      issues.push({ surface: 'examResults', message: `unknown canonical examId: ${result.examId}` })
    }
    if (resultIds.has(result.id)) {
      issues.push({ surface: 'examResults', message: `duplicate result id requires an explicit migration policy: ${result.id}` })
    }
    resultIds.add(result.id)
  }

  for (const examId of Object.keys(state.draftsByExamId)) {
    if (!knownExamIds.has(examId)) {
      issues.push({ surface: 'drafts', message: `unknown canonical draft examId: ${examId}` })
    }
  }

  for (const examId of state.route.solvedExamIds) {
    if (!knownExamIds.has(examId)) {
      issues.push({ surface: 'route', message: `unknown solved examId: ${examId}` })
    }
  }

  for (const [targetId, examIds] of Object.entries(state.route.completedExamIdsByTarget)) {
    if (!knownTargetIds.has(targetId)) {
      issues.push({ surface: 'route', message: `unknown completion targetId: ${targetId}` })
    }
    for (const examId of examIds) {
      if (!knownExamIds.has(examId)) {
        issues.push({ surface: 'route', message: `unknown completed examId: ${examId}` })
      }
    }
  }

  for (const [examId, plan] of Object.entries(state.route.reinforcementByExamId)) {
    if (!knownExamIds.has(examId) || plan.sourceExamId !== examId) {
      issues.push({ surface: 'route', message: `reinforcement exam identity mismatch: ${examId} / ${plan.sourceExamId}` })
    }
    if (plan.targetId !== undefined && !knownTargetIds.has(plan.targetId)) {
      issues.push({ surface: 'route', message: `unknown reinforcement targetId: ${plan.targetId}` })
    }
  }

  const activityIds = new Set<string>()
  for (const activity of state.activityRecords) {
    if (activityIds.has(activity.id)) {
      issues.push({ surface: 'activityRecords', message: `duplicate activity id requires an explicit migration policy: ${activity.id}` })
    }
    activityIds.add(activity.id)

    if (activity.kind === 'exam-exposure' && !knownExamIds.has(activity.examId)) {
      issues.push({ surface: 'activityRecords', message: `unknown exposure examId: ${activity.examId}` })
    }
    if (activity.kind === 'problem-attempt' && activity.examId !== undefined && !knownExamIds.has(activity.examId)) {
      issues.push({ surface: 'activityRecords', message: `unknown problem-attempt examId: ${activity.examId}` })
    }
  }

  return issues
}

/**
 * Rehearse the currently-audited learner-state conversion entirely in memory.
 *
 * The active legacy readers remain authoritative. This function:
 * 1. captures the exact legacy source strings needed for rollback evidence;
 * 2. requires legacy-vs-canonical dual-read parity for exam/route state;
 * 3. requires independent legacy-attempt vs canonical-activity parity;
 * 4. validates the combined canonical candidate against known identities;
 * 5. verifies that the rehearsal itself changed no persisted source string.
 *
 * It never writes, removes, renames or migrates a localStorage key. A later
 * production migration must still use the app's backup/restore-point safety
 * framework and must cover the remaining learner-state surfaces first.
 */
export function rehearseWaseShibuCanonicalMigration(): WaseShibuMigrationRehearsalReport {
  const before = captureRawSnapshot()
  const dualRead = auditWaseShibuDualRead()
  const activityAudit = auditWaseShibuActivities()
  const issues: WaseShibuMigrationRehearsalIssue[] = dualRead.mismatches.map(mismatch => ({
    surface: mismatch.surface,
    message: mismatch.message
  }))
  issues.push(...activityAudit.mismatches.map(mismatch => ({
    surface: mismatch.surface === 'activityRecords' ? 'activityRecords' : `activity:${mismatch.surface}`,
    message: mismatch.message
  })))

  const canonicalCandidate: CanonicalLearnerStateMigrationCandidate = {
    ...dualRead.canonicalShadow,
    activityRecords: activityAudit.canonicalShadow
  }
  issues.push(...validateCanonicalCandidate(canonicalCandidate))

  const after = captureRawSnapshot()
  if (!sameRawSnapshot(before, after)) {
    issues.push({ surface: 'storage', message: 'migration rehearsal changed one or more persisted source strings' })
  }

  return {
    ready: issues.length === 0,
    rehearsalContractVersion: 2,
    scope: ['preferences', 'examResults', 'drafts', 'route', 'activityRecords'],
    sourceSnapshot: before,
    canonicalCandidate,
    issues
  }
}
