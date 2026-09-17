import { assertCanonicalExamResult, type CanonicalExamResult } from '../../engine/examContract'
import type {
  CanonicalLearnerStateShadow,
  CanonicalLearningRouteState,
  CanonicalReinforcementState
} from '../../engine/learnerState'
import { WASESHIBU_APP_PROFILE } from './appProfile'
import {
  examIdForLegacyYear,
  mapLegacyCompletionByTarget,
  mapLegacyYearKeyedRecord,
  targetIdForLegacyTarget
} from './legacyCompatibility'

const PREF_KEY = 'waseshibu-math-preferences'
const EXAM_KEY = 'waseshibu-math-exam-scores'
const DRAFT_KEY = 'waseshibu-math-exam-drafts-v2'
const ROUTE_KEY = 'waseshibu-math-learning-route-v1'
const META_KEY = 'waseshibu-math-sync-meta'
const REQUIRED_MAIN_YEARS = [2024, 2023, 2022, 2025, 2026] as const
const REQUIRED_MAIN_EXAM_IDS = new Set(REQUIRED_MAIN_YEARS.map(examIdForLegacyYear))
const EPOCH = '1970-01-01T00:00:00.000Z'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

type ShadowSyncMeta = {
  attemptsResetVersion: number
  examScoresResetVersion: number
  lastSyncAt?: string
}

export type WaseShibuShadowIssue = {
  key: string
  message: string
}

export type WaseShibuCanonicalShadow = {
  state: CanonicalLearnerStateShadow
  issues: WaseShibuShadowIssue[]
}

function readJson(storage: ReadOnlyStorage, key: string, fallback: unknown, issues: WaseShibuShadowIssue[]) {
  const raw = storage.getItem(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    issues.push({ key, message: 'invalid JSON; shadow view used a safe empty/default value' })
    return fallback
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function readSyncMeta(storage: ReadOnlyStorage, issues: WaseShibuShadowIssue[]): ShadowSyncMeta {
  const raw = asRecord(readJson(storage, META_KEY, {}, issues))
  return {
    attemptsResetVersion: Number.isInteger(raw.attemptsResetVersion) ? Number(raw.attemptsResetVersion) : 0,
    examScoresResetVersion: Number.isInteger(raw.examScoresResetVersion) ? Number(raw.examScoresResetVersion) : 0,
    lastSyncAt: typeof raw.lastSyncAt === 'string' ? raw.lastSyncAt : undefined
  }
}

function readPreferences(storage: ReadOnlyStorage, issues: WaseShibuShadowIssue[]) {
  const raw = asRecord(readJson(storage, PREF_KEY, {}, issues))
  const legacyTarget = raw.target === 60 || raw.target === 75 ? raw.target : 70
  return {
    targetId: targetIdForLegacyTarget(legacyTarget),
    name: typeof raw.name === 'string' ? raw.name : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : EPOCH
  }
}

function schoolEvidenceForLegacyResult(item: Record<string, unknown>) {
  const evidence: Record<string, unknown> = {}
  for (const key of ['reproducibleScore', 'recoverableScore', 'timeCandidateScore'] as const) {
    if (typeof item[key] === 'number') evidence[key] = item[key]
  }
  if (item.attemptKind === 'first' || item.attemptKind === 'retake') evidence.attemptKind = item.attemptKind
  if (item.scoreValidity === 'first-look' || item.scoreValidity === 'reference') evidence.scoreValidity = item.scoreValidity
  if (Array.isArray(item.weakFields)) evidence.weakFields = item.weakFields.map(String)
  return Object.keys(evidence).length ? evidence : undefined
}

function readExamResults(
  storage: ReadOnlyStorage,
  issues: WaseShibuShadowIssue[],
  syncMeta: ShadowSyncMeta
): CanonicalExamResult[] {
  const raw = readJson(storage, EXAM_KEY, [], issues)
  if (!Array.isArray(raw)) {
    issues.push({ key: EXAM_KEY, message: 'exam score state is not an array' })
    return []
  }

  const results: CanonicalExamResult[] = []
  raw.forEach((value, index) => {
    const item = asRecord(value)
    const year = item.year
    const score = item.score
    if (!Number.isInteger(year) || Number(year) < 2019 || Number(year) > 2026 || typeof score !== 'number' || score < 0 || score > 100) {
      issues.push({ key: EXAM_KEY, message: `record ${index} is outside the current WaseShibu score contract` })
      return
    }
    if (!item.id || typeof item.at !== 'string') {
      issues.push({ key: EXAM_KEY, message: `record ${index} lacks id/timestamp required for canonical shadow` })
      return
    }

    try {
      results.push(assertCanonicalExamResult({
        id: String(item.id),
        examId: examIdForLegacyYear(Number(year)),
        completed: item.completed !== false,
        at: item.at,
        score,
        maxScore: 100,
        scoreAuthority: 'school-modelled',
        correctCount: typeof item.correctCount === 'number' ? item.correctCount : undefined,
        wrongCount: typeof item.wrongCount === 'number' ? item.wrongCount : undefined,
        unansweredCount: typeof item.unansweredCount === 'number' ? item.unansweredCount : undefined,
        deviceId: String(item.deviceId || 'legacy-device'),
        resetVersion: Number.isInteger(item.resetVersion) ? Number(item.resetVersion) : syncMeta.examScoresResetVersion,
        schoolEvidence: schoolEvidenceForLegacyResult(item)
      }))
    } catch (error) {
      issues.push({ key: EXAM_KEY, message: `record ${index} cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}` })
    }
  })
  return results
}

function readDrafts(storage: ReadOnlyStorage, issues: WaseShibuShadowIssue[]) {
  const raw = readJson(storage, DRAFT_KEY, {}, issues)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    issues.push({ key: DRAFT_KEY, message: 'draft state is not a year-keyed object' })
    return {}
  }
  try {
    return mapLegacyYearKeyedRecord(raw as Record<string, unknown>)
  } catch (error) {
    issues.push({ key: DRAFT_KEY, message: `draft state cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}` })
    return {}
  }
}

function normalizeCompletionLocks(source: Record<string, string[]>) {
  const result: Record<string, string[]> = {}
  for (const [targetId, examIds] of Object.entries(source)) {
    result[targetId] = [...new Set(examIds.filter(examId => REQUIRED_MAIN_EXAM_IDS.has(examId)))]
  }

  const orderedTargets = [...WASESHIBU_APP_PROFILE.targets].sort((a, b) => a.rank - b.rank)
  for (let highIndex = orderedTargets.length - 1; highIndex >= 0; highIndex--) {
    const highId = orderedTargets[highIndex].id
    for (const examId of result[highId] || []) {
      for (let lowerIndex = 0; lowerIndex < highIndex; lowerIndex++) {
        const lowerId = orderedTargets[lowerIndex].id
        result[lowerId] = [...new Set([...(result[lowerId] || []), examId])]
      }
    }
  }
  return result
}

function readRoute(storage: ReadOnlyStorage, issues: WaseShibuShadowIssue[]): CanonicalLearningRouteState {
  const raw = asRecord(readJson(storage, ROUTE_KEY, {}, issues))

  const solvedExamIds: string[] = []
  for (const value of Array.isArray(raw.solvedYears) ? raw.solvedYears : []) {
    if (!Number.isInteger(value)) {
      issues.push({ key: ROUTE_KEY, message: `invalid solved year: ${String(value)}` })
      continue
    }
    try {
      solvedExamIds.push(examIdForLegacyYear(Number(value)))
    } catch (error) {
      issues.push({ key: ROUTE_KEY, message: error instanceof Error ? error.message : 'invalid solved year' })
    }
  }

  let completedExamIdsByTarget: Record<string, string[]> = {}
  try {
    completedExamIdsByTarget = normalizeCompletionLocks(mapLegacyCompletionByTarget(asRecord(raw.completedCoreByTarget)))
  } catch (error) {
    issues.push({ key: ROUTE_KEY, message: `completion locks cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}` })
  }

  const reinforcementByExamId: Record<string, CanonicalReinforcementState> = {}
  const reinforcement = asRecord(raw.reinforcement)
  for (const [legacyYear, rawPlanValue] of Object.entries(reinforcement)) {
    const rawPlan = asRecord(rawPlanValue)
    try {
      const year = Number(legacyYear)
      if (!Number.isInteger(year) || String(year) !== legacyYear) throw new Error(`invalid reinforcement year key: ${legacyYear}`)
      const sourceExamId = examIdForLegacyYear(year)
      const fields = Object.fromEntries(Object.entries(asRecord(rawPlan.fields)).map(([field, ids]) => [
        field,
        Array.isArray(ids) ? ids.map(String) : []
      ]))
      const targetId = rawPlan.target === undefined ? undefined : targetIdForLegacyTarget(String(rawPlan.target))
      reinforcementByExamId[sourceExamId] = {
        sourceExamId,
        sourceResultId: typeof rawPlan.examId === 'string' ? rawPlan.examId : undefined,
        targetId,
        fields,
        completedProblemIds: Array.isArray(rawPlan.completedQuestionIds) ? rawPlan.completedQuestionIds.map(String) : [],
        createdAt: typeof rawPlan.createdAt === 'string' ? rawPlan.createdAt : undefined,
        requiresSourceReview: typeof rawPlan.requiresSourceReview === 'boolean' ? rawPlan.requiresSourceReview : undefined
      }
    } catch (error) {
      issues.push({ key: ROUTE_KEY, message: `reinforcement ${legacyYear} cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}` })
    }
  }

  return {
    solvedExamIds: [...new Set(solvedExamIds)],
    usedProblemIds: Array.isArray(raw.usedOldQuestionIds) ? raw.usedOldQuestionIds.map(String) : [],
    completedExamIdsByTarget,
    reinforcementByExamId,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : EPOCH
  }
}

/**
 * Read current WaseShibu learner state as canonical values without writing,
 * migrating, deleting or renaming any persisted record.
 *
 * This is a shadow view only. Runtime continues using the legacy storage model
 * until explicit parity and migration gates are complete.
 */
export function readWaseShibuCanonicalShadow(storage: ReadOnlyStorage): WaseShibuCanonicalShadow {
  const issues: WaseShibuShadowIssue[] = []
  const syncMeta = readSyncMeta(storage, issues)
  return {
    state: {
      preferences: readPreferences(storage, issues),
      examResults: readExamResults(storage, issues, syncMeta),
      draftsByExamId: readDrafts(storage, issues),
      route: readRoute(storage, issues)
    },
    issues
  }
}
