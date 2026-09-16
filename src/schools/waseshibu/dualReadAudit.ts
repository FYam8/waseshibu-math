import type { CanonicalExamResult } from '../../engine/examContract'
import type {
  CanonicalLearnerStateShadow,
  CanonicalLearningRouteState,
  CanonicalReinforcementState
} from '../../engine/learnerState'
import { loadExamScores, loadPreferences } from '../../storage'
import { loadLearningRoute, type LearningRouteState, type ReinforcementPlan } from '../../learningRoute'
import {
  examIdForLegacyYear,
  mapLegacyCompletionByTarget,
  mapLegacyYearKeyedRecord,
  targetIdForLegacyTarget
} from './legacyCompatibility'
import { readWaseShibuCanonicalShadow, type WaseShibuShadowIssue } from './shadowState'

const PREF_KEY = 'waseshibu-math-preferences'
const EXAM_KEY = 'waseshibu-math-exam-scores'
const DRAFT_KEY = 'waseshibu-math-exam-drafts-v2'
const ROUTE_KEY = 'waseshibu-math-learning-route-v1'
const META_KEY = 'waseshibu-math-sync-meta'
const AUDITED_KEYS = [PREF_KEY, EXAM_KEY, DRAFT_KEY, ROUTE_KEY, META_KEY] as const

type DualReadSurface = 'preferences' | 'examResults' | 'drafts' | 'route' | 'storage' | 'shadow'

export type WaseShibuDualReadMismatch = {
  surface: DualReadSurface
  message: string
}

export type WaseShibuDualReadReport = {
  ok: boolean
  mismatches: WaseShibuDualReadMismatch[]
  shadowIssues: WaseShibuShadowIssue[]
  legacyProjection: CanonicalLearnerStateShadow
  canonicalShadow: CanonicalLearnerStateShadow
}

function schoolEvidenceForLegacyResult(score: ReturnType<typeof loadExamScores>[number]) {
  const evidence: Record<string, unknown> = {}
  if (typeof score.reproducibleScore === 'number') evidence.reproducibleScore = score.reproducibleScore
  if (typeof score.recoverableScore === 'number') evidence.recoverableScore = score.recoverableScore
  if (typeof score.timeCandidateScore === 'number') evidence.timeCandidateScore = score.timeCandidateScore
  if (score.attemptKind === 'first' || score.attemptKind === 'retake') evidence.attemptKind = score.attemptKind
  if (score.scoreValidity === 'first-look' || score.scoreValidity === 'reference') evidence.scoreValidity = score.scoreValidity
  if (Array.isArray(score.weakFields)) evidence.weakFields = score.weakFields.map(String)
  return Object.keys(evidence).length ? evidence : undefined
}

function projectLegacyExamResults(): CanonicalExamResult[] {
  return loadExamScores().map(score => ({
    id: score.id,
    examId: examIdForLegacyYear(score.year),
    completed: score.completed !== false,
    at: score.at,
    score: score.score,
    maxScore: 100,
    scoreAuthority: 'school-modelled',
    correctCount: score.correctCount,
    wrongCount: score.wrongCount,
    unansweredCount: score.unansweredCount,
    deviceId: score.deviceId,
    resetVersion: score.resetVersion,
    schoolEvidence: schoolEvidenceForLegacyResult(score)
  }))
}

function projectLegacyReinforcement(plan: ReinforcementPlan, sourceExamId: string): CanonicalReinforcementState {
  return {
    sourceExamId,
    sourceResultId: plan.examId,
    targetId: plan.target === undefined ? undefined : targetIdForLegacyTarget(plan.target),
    fields: Object.fromEntries(Object.entries(plan.fields).map(([field, ids]) => [field, ids.map(String)])),
    completedProblemIds: plan.completedQuestionIds.map(String),
    createdAt: plan.createdAt,
    requiresSourceReview: plan.requiresSourceReview
  }
}

function projectLegacyRoute(route: LearningRouteState, mismatches: WaseShibuDualReadMismatch[]): CanonicalLearningRouteState {
  const solvedExamIds: string[] = []
  for (const year of route.solvedYears) {
    try {
      solvedExamIds.push(examIdForLegacyYear(year))
    } catch (error) {
      mismatches.push({
        surface: 'route',
        message: `legacy solved year cannot map to canonical examId: ${year} (${error instanceof Error ? error.message : 'unknown error'})`
      })
    }
  }

  let completedExamIdsByTarget: Record<string, string[]> = {}
  try {
    completedExamIdsByTarget = mapLegacyCompletionByTarget(route.completedCoreByTarget as Record<string, unknown>)
  } catch (error) {
    mismatches.push({
      surface: 'route',
      message: `legacy completion locks cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}`
    })
  }

  const reinforcementByExamId: Record<string, CanonicalReinforcementState> = {}
  for (const [legacyYear, plan] of Object.entries(route.reinforcement)) {
    try {
      const year = Number(legacyYear)
      if (!Number.isInteger(year) || String(year) !== legacyYear) throw new Error(`invalid legacy reinforcement key: ${legacyYear}`)
      const sourceExamId = examIdForLegacyYear(year)
      reinforcementByExamId[sourceExamId] = projectLegacyReinforcement(plan, sourceExamId)
    } catch (error) {
      mismatches.push({
        surface: 'route',
        message: `legacy reinforcement cannot map canonically: ${legacyYear} (${error instanceof Error ? error.message : 'unknown error'})`
      })
    }
  }

  return {
    solvedExamIds: [...new Set(solvedExamIds)],
    usedProblemIds: route.usedOldQuestionIds.map(String),
    completedExamIdsByTarget,
    reinforcementByExamId,
    updatedAt: route.updatedAt
  }
}

function readLegacyDrafts(mismatches: WaseShibuDualReadMismatch[]) {
  try {
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      mismatches.push({ surface: 'drafts', message: 'legacy draft container is not a year-keyed object' })
      return {}
    }
    return mapLegacyYearKeyedRecord(raw as Record<string, unknown>)
  } catch (error) {
    mismatches.push({
      surface: 'drafts',
      message: `legacy drafts cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}`
    })
    return {}
  }
}

function projectLegacyState(mismatches: WaseShibuDualReadMismatch[]): CanonicalLearnerStateShadow {
  const preferences = loadPreferences()
  const route = loadLearningRoute()
  return {
    preferences: {
      targetId: targetIdForLegacyTarget(preferences.target),
      name: preferences.name,
      updatedAt: preferences.updatedAt
    },
    examResults: projectLegacyExamResults(),
    draftsByExamId: readLegacyDrafts(mismatches),
    route: projectLegacyRoute(route, mismatches)
  }
}

function normalized(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalized)
  if (!value || typeof value !== 'object') return value
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    const entry = (value as Record<string, unknown>)[key]
    if (entry !== undefined) result[key] = normalized(entry)
  }
  return result
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right))
}

function compareSurface(
  surface: DualReadSurface,
  legacyValue: unknown,
  canonicalValue: unknown,
  mismatches: WaseShibuDualReadMismatch[]
) {
  if (!sameValue(legacyValue, canonicalValue)) {
    mismatches.push({ surface, message: 'legacy runtime read and canonical shadow read are not equivalent' })
  }
}

function storageSnapshot() {
  return Object.fromEntries(AUDITED_KEYS.map(key => [key, localStorage.getItem(key)]))
}

/**
 * Dual-read safety audit.
 *
 * The current production readers remain authoritative. This function reads the
 * same persisted state through both the active legacy runtime and the canonical
 * shadow model, then compares their semantic projections. It performs no
 * persistence writes and is not part of the learner path yet.
 */
export function auditWaseShibuDualRead(): WaseShibuDualReadReport {
  const before = storageSnapshot()
  const mismatches: WaseShibuDualReadMismatch[] = []
  const legacyProjection = projectLegacyState(mismatches)
  const shadow = readWaseShibuCanonicalShadow(localStorage)

  compareSurface('preferences', legacyProjection.preferences, shadow.state.preferences, mismatches)
  compareSurface('examResults', legacyProjection.examResults, shadow.state.examResults, mismatches)
  compareSurface('drafts', legacyProjection.draftsByExamId, shadow.state.draftsByExamId, mismatches)
  compareSurface('route', legacyProjection.route, shadow.state.route, mismatches)

  for (const issue of shadow.issues) {
    mismatches.push({ surface: 'shadow', message: `${issue.key}: ${issue.message}` })
  }

  const after = storageSnapshot()
  if (!sameValue(before, after)) {
    mismatches.push({ surface: 'storage', message: 'dual-read audit changed persisted WaseShibu state' })
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    shadowIssues: shadow.issues,
    legacyProjection,
    canonicalShadow: shadow.state
  }
}
