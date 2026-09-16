import type { CanonicalActivityRecord } from '../../engine/learnerState'
import type { Attempt } from '../../types'
import { projectWaseShibuAttemptActivity } from './activityCompatibility'

const ATTEMPT_KEY = 'waseshibu-math-attempts'
const META_KEY = 'waseshibu-math-sync-meta'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuActivityShadowIssue = {
  key: string
  message: string
}

export type WaseShibuActivityShadow = {
  activityRecords: CanonicalActivityRecord[]
  issues: WaseShibuActivityShadowIssue[]
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function readJson(storage: ReadOnlyStorage, key: string, fallback: unknown, issues: WaseShibuActivityShadowIssue[]) {
  const raw = storage.getItem(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    issues.push({ key, message: 'invalid JSON; activity shadow used a safe empty/default value' })
    return fallback
  }
}

function attemptsResetVersion(storage: ReadOnlyStorage, issues: WaseShibuActivityShadowIssue[]) {
  const raw = asRecord(readJson(storage, META_KEY, {}, issues))
  return Number.isInteger(raw.attemptsResetVersion) ? Number(raw.attemptsResetVersion) : 0
}

/** Mirror the current private storage.migrateAttempt semantics without writing. */
function normalizeLegacyAttempt(raw: unknown, resetVersion: number): Attempt | null {
  const item = asRecord(raw)
  if (!item.id || !item.questionId || !item.at) return null

  const approach = item.approach === 'immediate' || item.approach === 'thought' || item.approach === 'none'
    ? item.approach
    : undefined
  const diagnosis = item.diagnosis === 'correct' || item.diagnosis === 'recoverable' || item.diagnosis === 'difficult' || item.diagnosis === 'time'
    ? item.diagnosis
    : undefined
  const status = item.status === 'correct' || item.status === 'wrong' || item.status === 'deferred'
    ? item.status
    : item.correct === true ? 'correct' : 'wrong'

  return {
    id: String(item.id),
    deviceId: String(item.deviceId || 'legacy-device'),
    resetVersion: Number.isInteger(item.resetVersion) ? Number(item.resetVersion) : resetVersion,
    questionId: String(item.questionId),
    mode: item.mode === 'multi' ? 'multi' : 'q1',
    topic: String(item.topic || '旧データ'),
    status,
    mistakeTag: item.mistakeTag as string | undefined,
    approach,
    diagnosis,
    answer: typeof item.answer === 'string' ? item.answer : undefined,
    flagged: typeof item.flagged === 'boolean' ? item.flagged : undefined,
    seconds: typeof item.seconds === 'number' ? item.seconds : undefined,
    at: String(item.at)
  }
}

/**
 * Read the current WaseShibu attempts container as canonical activity records.
 *
 * This is deliberately separate from the aggregate learner-state shadow until
 * attempt/event semantics have their own parity gate. No storage key is written,
 * renamed or removed.
 */
export function readWaseShibuCanonicalActivityShadow(storage: ReadOnlyStorage): WaseShibuActivityShadow {
  const issues: WaseShibuActivityShadowIssue[] = []
  const resetVersion = attemptsResetVersion(storage, issues)
  const raw = readJson(storage, ATTEMPT_KEY, [], issues)
  if (!Array.isArray(raw)) {
    issues.push({ key: ATTEMPT_KEY, message: 'attempt state is not an array' })
    return { activityRecords: [], issues }
  }

  const activityRecords: CanonicalActivityRecord[] = []
  raw.forEach((value, index) => {
    const attempt = normalizeLegacyAttempt(value, resetVersion)
    if (!attempt) {
      issues.push({ key: ATTEMPT_KEY, message: `record ${index} is filtered by the current WaseShibu attempt reader because id/questionId/timestamp is missing` })
      return
    }
    try {
      activityRecords.push(projectWaseShibuAttemptActivity(attempt))
    } catch (error) {
      issues.push({ key: ATTEMPT_KEY, message: `record ${index} cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}` })
    }
  })

  return { activityRecords, issues }
}
