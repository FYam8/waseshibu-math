import type {
  CanonicalLearnerStateMigrationCandidate,
  CanonicalScheduledTaskPlan
} from '../../engine/learnerState'
import { DATA_VERSION_KEY } from '../../dataMigration'
import { WASESHIBU_APP_PROFILE } from './appProfile'
import { WASESHIBU_EXAM_CATALOG } from './legacyCompatibility'
import { auditWaseShibuDualRead } from './dualReadAudit'
import { auditWaseShibuActivities } from './activityAudit'
import { auditWaseShibuDailyPractice } from './dailyAudit'
import { auditWaseShibuPlannerReaderParity } from './plannerAudit'
import { auditWaseShibuPrepState } from './prepAudit'
import { auditWaseShibuGuidedState } from './guidedAudit'
import {
  LEGACY_DAILY_REQUIRED_PLAN_KEY,
  LEGACY_STUDY_AHEAD_PLAN_KEY
} from './plannerLegacyReader'
import { WASESHIBU_PREP_ITEM_COUNT, WASESHIBU_PREP_KEY } from './prepCompatibility'
import {
  LEGACY_GUIDED_PROGRESS_KEY,
  LEGACY_GUIDED_REVIEW_KEY
} from './guidedCompatibility'

const ATTEMPT_KEY = 'waseshibu-math-attempts'
const DAILY_KEY = 'waseshibu-math-daily'
const PREF_KEY = 'waseshibu-math-preferences'
const EXAM_KEY = 'waseshibu-math-exam-scores'
const DRAFT_KEY = 'waseshibu-math-exam-drafts-v2'
const ROUTE_KEY = 'waseshibu-math-learning-route-v1'
const META_KEY = 'waseshibu-math-sync-meta'

/**
 * Exact legacy source bytes covered by the current rehearsal.
 *
 * Both guided keys are included because v2 is the active mastery timeline while
 * v1 is still compatibility/final-answer-fallback evidence. Rollback must
 * restore both exactly even though only one generic mastery map is canonical.
 * Remediation/Level2 and later state families remain outside this rehearsal.
 */
export const WASESHIBU_REHEARSAL_SOURCE_KEYS = [
  ATTEMPT_KEY,
  DAILY_KEY,
  LEGACY_DAILY_REQUIRED_PLAN_KEY,
  LEGACY_STUDY_AHEAD_PLAN_KEY,
  WASESHIBU_PREP_KEY,
  LEGACY_GUIDED_REVIEW_KEY,
  LEGACY_GUIDED_PROGRESS_KEY,
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
  rehearsalContractVersion: 5
  scope: readonly [
    'preferences',
    'examResults',
    'drafts',
    'route',
    'activityRecords',
    'dailyPractice',
    'todayRequiredPlan',
    'studyAheadPlan',
    'preparationCheck',
    'guidedLearning'
  ]
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

function validatePlannerPlan(
  surface: 'todayRequiredPlan' | 'studyAheadPlan',
  plan: CanonicalScheduledTaskPlan | null,
  expectedKind: CanonicalScheduledTaskPlan['planKind'],
  knownTargetIds: Set<string>,
  issues: WaseShibuMigrationRehearsalIssue[]
) {
  if (!plan) return
  if (plan.planKind !== expectedKind) {
    issues.push({ surface, message: `planner kind mismatch: expected ${expectedKind}, got ${plan.planKind}` })
  }
  if (!knownTargetIds.has(plan.targetId)) {
    issues.push({ surface, message: `unknown canonical targetId: ${plan.targetId}` })
  }
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

  validatePlannerPlan('todayRequiredPlan', state.todayRequiredPlan, 'today-required', knownTargetIds, issues)
  validatePlannerPlan('studyAheadPlan', state.studyAheadPlan, 'study-ahead', knownTargetIds, issues)

  if (state.preparationCheck !== null) {
    if (
      !Number.isInteger(state.preparationCheck.currentItemIndex) ||
      state.preparationCheck.currentItemIndex < 0 ||
      state.preparationCheck.currentItemIndex >= WASESHIBU_PREP_ITEM_COUNT
    ) {
      issues.push({
        surface: 'preparationCheck',
        message: `prep cursor is outside the current WaseShibu item range: ${state.preparationCheck.currentItemIndex}`
      })
    }
    for (const [itemId, tries] of Object.entries(state.preparationCheck.triesByItemId)) {
      if (!Number.isInteger(tries) || tries < 0) {
        issues.push({ surface: 'preparationCheck', message: `invalid prep try count for ${itemId}: ${tries}` })
      }
    }
  }

  for (const [problemId, progress] of Object.entries(state.guidedLearning.progressByProblemId)) {
    if (progress.problemId !== problemId) {
      issues.push({
        surface: 'guidedLearning',
        message: `guided progress identity mismatch: ${problemId} / ${progress.problemId}`
      })
    }
    for (const [stepId, step] of Object.entries(progress.stepsById)) {
      if (step.stepId !== stepId) {
        issues.push({
          surface: 'guidedLearning',
          message: `guided step identity mismatch: ${problemId}/${stepId} / ${step.stepId}`
        })
      }
    }
  }

  return issues
}

/**
 * Rehearse the currently-audited learner-state conversion entirely in memory.
 *
 * The active legacy readers remain authoritative. This function:
 * 1. captures exact legacy strings needed for rollback evidence;
 * 2. requires legacy-vs-canonical parity for exam/route/activity/daily/prep;
 * 3. requires persisted planner parity without invoking reconciliation writes;
 * 4. requires guided v1 compatibility and v2 active-progress parity separately;
 * 5. adds only one generic guided mastery timeline to the candidate;
 * 6. validates combined canonical identities;
 * 7. verifies that the rehearsal itself changed no persisted source string.
 *
 * It never writes, removes, renames or migrates a localStorage key. A later
 * production migration must still use the app's backup/restore-point safety
 * framework and cover the remaining learner-state surfaces first.
 */
export function rehearseWaseShibuCanonicalMigration(): WaseShibuMigrationRehearsalReport {
  const before = captureRawSnapshot()
  const dualRead = auditWaseShibuDualRead()
  const activityAudit = auditWaseShibuActivities()
  const dailyAudit = auditWaseShibuDailyPractice()
  const plannerAudit = auditWaseShibuPlannerReaderParity()
  const prepAudit = auditWaseShibuPrepState()
  const guidedAudit = auditWaseShibuGuidedState()

  const issues: WaseShibuMigrationRehearsalIssue[] = dualRead.mismatches.map(mismatch => ({
    surface: mismatch.surface,
    message: mismatch.message
  }))
  issues.push(...activityAudit.mismatches.map(mismatch => ({
    surface: mismatch.surface === 'activityRecords' ? 'activityRecords' : `activity:${mismatch.surface}`,
    message: mismatch.message
  })))
  issues.push(...dailyAudit.mismatches.map(mismatch => ({
    surface: mismatch.surface === 'dailyPractice' ? 'dailyPractice' : `daily:${mismatch.surface}`,
    message: mismatch.message
  })))
  issues.push(...plannerAudit.mismatches.map(mismatch => ({
    surface: mismatch.surface === 'todayRequiredPlan' || mismatch.surface === 'studyAheadPlan'
      ? mismatch.surface
      : `planner:${mismatch.surface}`,
    message: mismatch.message
  })))
  issues.push(...prepAudit.mismatches.map(mismatch => ({
    surface: mismatch.surface === 'preparationCheck' ? 'preparationCheck' : `prep:${mismatch.surface}`,
    message: mismatch.message
  })))
  issues.push(...guidedAudit.mismatches.map(mismatch => ({
    surface: mismatch.surface === 'guidedProgress' || mismatch.surface === 'legacyReview'
      ? 'guidedLearning'
      : `guided:${mismatch.surface}`,
    message: mismatch.message
  })))

  const canonicalCandidate: CanonicalLearnerStateMigrationCandidate = {
    ...dualRead.canonicalShadow,
    activityRecords: activityAudit.canonicalShadow,
    dailyPractice: dailyAudit.canonicalShadow,
    todayRequiredPlan: plannerAudit.canonicalShadow.todayRequiredPlan,
    studyAheadPlan: plannerAudit.canonicalShadow.studyAheadPlan,
    preparationCheck: prepAudit.canonicalShadow,
    guidedLearning: guidedAudit.canonicalShadow.guidedLearning
  }
  issues.push(...validateCanonicalCandidate(canonicalCandidate))

  const after = captureRawSnapshot()
  if (!sameRawSnapshot(before, after)) {
    issues.push({ surface: 'storage', message: 'migration rehearsal changed one or more persisted source strings' })
  }

  return {
    ready: issues.length === 0,
    rehearsalContractVersion: 5,
    scope: [
      'preferences',
      'examResults',
      'drafts',
      'route',
      'activityRecords',
      'dailyPractice',
      'todayRequiredPlan',
      'studyAheadPlan',
      'preparationCheck',
      'guidedLearning'
    ],
    sourceSnapshot: before,
    canonicalCandidate,
    issues
  }
}
