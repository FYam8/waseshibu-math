import type {
  CanonicalLearnerStateMigrationCandidate,
  CanonicalScheduledTaskPlan
} from '../../engine/learnerState'
import type { CanonicalRemediationState } from '../../engine/remediationContract'
import type { CanonicalPracticeHistory } from '../../engine/practiceHistoryContract'
import { DATA_VERSION_KEY } from '../../dataMigration'
import { WASESHIBU_APP_PROFILE } from './appProfile'
import { WASESHIBU_EXAM_CATALOG } from './legacyCompatibility'
import { auditWaseShibuDualRead } from './dualReadAudit'
import { auditWaseShibuActivities } from './activityAudit'
import { auditWaseShibuDailyPractice } from './dailyAudit'
import { auditWaseShibuPlannerReaderParity } from './plannerAudit'
import { auditWaseShibuPrepState } from './prepAudit'
import { auditWaseShibuGuidedState } from './guidedAudit'
import { auditWaseShibuRemediationState } from './remediationAudit'
import { auditWaseShibuLevel2State } from './level2Audit'
import {
  LEGACY_DAILY_REQUIRED_PLAN_KEY,
  LEGACY_STUDY_AHEAD_PLAN_KEY
} from './plannerLegacyReader'
import { WASESHIBU_PREP_ITEM_COUNT, WASESHIBU_PREP_KEY } from './prepCompatibility'
import {
  LEGACY_GUIDED_PROGRESS_KEY,
  LEGACY_GUIDED_REVIEW_KEY
} from './guidedCompatibility'
import { LEGACY_REMEDIATION_PROGRESS_KEY } from './remediationCompatibility'
import { LEGACY_LEVEL2_HISTORY_KEY } from './level2Compatibility'

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
 * Guided v2 is the active mastery timeline while v1 remains compatibility
 * evidence. Remediation and Level2/practice history keep their school-specific
 * normalized evidence in the candidate and their exact source bytes here for
 * rollback. Backup/import and cloud/IndexedDB projections remain later gates.
 */
export const WASESHIBU_REHEARSAL_SOURCE_KEYS = [
  ATTEMPT_KEY,
  DAILY_KEY,
  LEGACY_DAILY_REQUIRED_PLAN_KEY,
  LEGACY_STUDY_AHEAD_PLAN_KEY,
  WASESHIBU_PREP_KEY,
  LEGACY_GUIDED_REVIEW_KEY,
  LEGACY_GUIDED_PROGRESS_KEY,
  LEGACY_REMEDIATION_PROGRESS_KEY,
  LEGACY_LEVEL2_HISTORY_KEY,
  PREF_KEY,
  EXAM_KEY,
  DRAFT_KEY,
  ROUTE_KEY,
  META_KEY,
  DATA_VERSION_KEY
] as const

export type WaseShibuRehearsalSourceKey = (typeof WASESHIBU_REHEARSAL_SOURCE_KEYS)[number]
export type WaseShibuRawSnapshot = Record<WaseShibuRehearsalSourceKey, string | null>
export type WaseShibuCanonicalMigrationCandidate = CanonicalLearnerStateMigrationCandidate & {
  remediation: CanonicalRemediationState
  practiceHistory: CanonicalPracticeHistory
}

export type WaseShibuMigrationRehearsalIssue = {
  surface: string
  message: string
}

export type WaseShibuMigrationRehearsalReport = {
  /** Ready only for the next migration-engine step for the audited scope. */
  ready: boolean
  /** This is a rehearsal/read-model contract marker, not the app data version. */
  rehearsalContractVersion: 7
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
    'guidedLearning',
    'remediation',
    'practiceHistory'
  ]
  sourceSnapshot: WaseShibuRawSnapshot
  canonicalCandidate: WaseShibuCanonicalMigrationCandidate
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

function validatePracticeHistory(
  practiceHistory: CanonicalPracticeHistory,
  issues: WaseShibuMigrationRehearsalIssue[]
) {
  if (practiceHistory.schoolEvidence?.legacySchemaVersion !== 1) {
    issues.push({ surface: 'practiceHistory', message: 'WaseShibu practice history must retain legacy schemaVersion 1 evidence' })
  }

  const attemptIds = new Set<string>()
  for (const attempt of practiceHistory.attempts) {
    if (attemptIds.has(attempt.id)) {
      issues.push({ surface: 'practiceHistory', message: `duplicate practice attempt id requires an explicit migration policy: ${attempt.id}` })
    }
    attemptIds.add(attempt.id)
    const legacyRecord = attempt.schoolEvidence?.legacyRecord
    if (!legacyRecord || typeof legacyRecord !== 'object' || Array.isArray(legacyRecord)) {
      issues.push({ surface: 'practiceHistory', message: `WaseShibu practice attempt legacy evidence is missing: ${attempt.id}` })
    }
  }

  for (const [problemId, stats] of Object.entries(practiceHistory.problemStatsByProblemId)) {
    const legacyRecord = stats.schoolEvidence?.legacyRecord
    if (!legacyRecord || typeof legacyRecord !== 'object' || Array.isArray(legacyRecord)) {
      issues.push({ surface: 'practiceHistory', message: `WaseShibu problem-stat legacy evidence is missing: ${problemId}` })
    }
  }

  const sessionIds = new Set<string>()
  for (const [storageKey, session] of Object.entries(practiceHistory.sessionsByKey)) {
    if (!storageKey) {
      issues.push({ surface: 'practiceHistory', message: 'practice session storage key must not be empty' })
    }
    if (sessionIds.has(session.id)) {
      issues.push({ surface: 'practiceHistory', message: `duplicate practice session id requires an explicit migration policy: ${session.id}` })
    }
    sessionIds.add(session.id)
    if (!Number.isInteger(session.requiredCount) || session.requiredCount < 1 || session.requiredCount > 4) {
      issues.push({ surface: 'practiceHistory', message: `invalid WaseShibu practice requiredCount for ${storageKey}: ${session.requiredCount}` })
    }
    if (session.schoolEvidence?.legacyStorageKey !== storageKey) {
      issues.push({ surface: 'practiceHistory', message: `practice session storage identity mismatch: ${storageKey}` })
    }
    const legacyRecord = session.schoolEvidence?.legacyRecord
    if (!legacyRecord || typeof legacyRecord !== 'object' || Array.isArray(legacyRecord)) {
      issues.push({ surface: 'practiceHistory', message: `WaseShibu practice session legacy evidence is missing: ${storageKey}` })
    }
  }

  for (let index = 0; index < practiceHistory.masteryEvents.length; index++) {
    const legacyRecord = practiceHistory.masteryEvents[index].schoolEvidence?.legacyRecord
    if (!legacyRecord || typeof legacyRecord !== 'object' || Array.isArray(legacyRecord)) {
      issues.push({ surface: 'practiceHistory', message: `WaseShibu practice mastery-event legacy evidence is missing at index ${index}` })
    }
  }
}

function validateCanonicalCandidate(state: WaseShibuCanonicalMigrationCandidate) {
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

  for (const [sourceProblemId, progress] of Object.entries(state.remediation.progressBySourceProblemId)) {
    if (progress.sourceProblemId !== sourceProblemId) {
      issues.push({
        surface: 'remediation',
        message: `remediation source identity mismatch: ${sourceProblemId} / ${progress.sourceProblemId}`
      })
    }
    if (!Number.isInteger(progress.streak) || progress.streak < 0 || progress.streak > 4) {
      issues.push({ surface: 'remediation', message: `invalid remediation streak for ${sourceProblemId}: ${progress.streak}` })
    }
    if (!Number.isInteger(progress.attemptCount) || progress.attemptCount < 0) {
      issues.push({ surface: 'remediation', message: `invalid remediation attempt count for ${sourceProblemId}: ${progress.attemptCount}` })
    }
    if (progress.status === 'in-progress' && progress.streak >= 4) {
      issues.push({ surface: 'remediation', message: `in-progress remediation cannot have a four-problem streak: ${sourceProblemId}` })
    }
    const legacyRecord = progress.schoolEvidence?.legacyRecord
    if (!legacyRecord || typeof legacyRecord !== 'object' || Array.isArray(legacyRecord)) {
      issues.push({ surface: 'remediation', message: `WaseShibu remediation legacy evidence is missing: ${sourceProblemId}` })
    }
  }

  validatePracticeHistory(state.practiceHistory, issues)
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
 * 5. requires remediation runtime-normalization parity and no-loss blockers;
 * 6. requires both Level2 durable-history and independent summary-reader parity;
 * 7. adds one generic guided timeline, remediation and practice-history state;
 * 8. validates combined canonical identities;
 * 9. verifies that the rehearsal itself changed no persisted source string.
 *
 * It never writes, removes, renames or migrates a localStorage key. A later
 * production migration must still use the app's backup/restore-point safety
 * framework and cover backup/import and sync projections first.
 */
export function rehearseWaseShibuCanonicalMigration(): WaseShibuMigrationRehearsalReport {
  const before = captureRawSnapshot()
  const dualRead = auditWaseShibuDualRead()
  const activityAudit = auditWaseShibuActivities()
  const dailyAudit = auditWaseShibuDailyPractice()
  const plannerAudit = auditWaseShibuPlannerReaderParity()
  const prepAudit = auditWaseShibuPrepState()
  const guidedAudit = auditWaseShibuGuidedState()
  const remediationAudit = auditWaseShibuRemediationState()
  const level2Audit = auditWaseShibuLevel2State()

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
  issues.push(...remediationAudit.mismatches.map(mismatch => ({
    surface: mismatch.surface === 'remediation' ? 'remediation' : `remediation:${mismatch.surface}`,
    message: mismatch.message
  })))
  issues.push(...level2Audit.mismatches.map(mismatch => ({
    surface: mismatch.surface === 'practiceHistory' || mismatch.surface === 'sessionSummaries'
      ? 'practiceHistory'
      : `level2:${mismatch.surface}`,
    message: mismatch.message
  })))

  const canonicalCandidate: WaseShibuCanonicalMigrationCandidate = {
    ...dualRead.canonicalShadow,
    activityRecords: activityAudit.canonicalShadow,
    dailyPractice: dailyAudit.canonicalShadow,
    todayRequiredPlan: plannerAudit.canonicalShadow.todayRequiredPlan,
    studyAheadPlan: plannerAudit.canonicalShadow.studyAheadPlan,
    preparationCheck: prepAudit.canonicalShadow,
    guidedLearning: guidedAudit.canonicalShadow.guidedLearning,
    remediation: remediationAudit.canonicalShadow,
    practiceHistory: level2Audit.canonicalShadow
  }
  issues.push(...validateCanonicalCandidate(canonicalCandidate))

  const after = captureRawSnapshot()
  if (!sameRawSnapshot(before, after)) {
    issues.push({ surface: 'storage', message: 'migration rehearsal changed one or more persisted source strings' })
  }

  return {
    ready: issues.length === 0,
    rehearsalContractVersion: 7,
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
      'guidedLearning',
      'remediation',
      'practiceHistory'
    ],
    sourceSnapshot: before,
    canonicalCandidate,
    issues
  }
}
