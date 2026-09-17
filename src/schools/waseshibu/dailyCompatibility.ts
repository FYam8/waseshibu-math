import type { CanonicalDailyPracticeSession } from '../../engine/learnerState'

const KNOWN_DAILY_KEYS = new Set([
  'date',
  'questionIds',
  'completed',
  'queue',
  'deferredOnce',
  'settled',
  'correctCount',
  'wrongCount',
  'deferredCount',
  'sessionElapsed',
  'updatedAt'
])

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new Error(`${field} must be a string array`)
  }
  return [...value]
}

function optionalStringArray(value: unknown, field: string): string[] | undefined {
  return value === undefined ? undefined : stringArray(value, field)
}

function optionalFiniteNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`)
  }
  return value
}

/**
 * Pure WaseShibu compatibility projection for the legacy 8-question daily
 * practice session. This is deliberately separate from the home-screen
 * required-task scheduler and next-day study-ahead planner.
 *
 * Unknown fields fail closed instead of being silently discarded during a
 * future migration. Problem IDs remain opaque and retain order/duplicates.
 */
export function projectWaseShibuDailyPracticeState(value: unknown): CanonicalDailyPracticeSession | null {
  if (value === null || value === undefined) return null
  const raw = asRecord(value)
  if (!raw) throw new Error('daily practice state must be an object or null')

  const unknownKeys = Object.keys(raw).filter(key => !KNOWN_DAILY_KEYS.has(key))
  if (unknownKeys.length) {
    throw new Error(`daily practice state has unsupported fields: ${unknownKeys.join(', ')}`)
  }

  if (typeof raw.date !== 'string' || !raw.date) throw new Error('date must be a non-empty string')
  if (typeof raw.completed !== 'boolean') throw new Error('completed must be boolean')
  const problemIds = stringArray(raw.questionIds, 'questionIds')
  const updatedAt = raw.updatedAt === undefined
    ? undefined
    : typeof raw.updatedAt === 'string'
      ? raw.updatedAt
      : (() => { throw new Error('updatedAt must be a string') })()

  return {
    date: raw.date,
    problemIds,
    completed: raw.completed,
    queueProblemIds: optionalStringArray(raw.queue, 'queue'),
    deferredOnceProblemIds: optionalStringArray(raw.deferredOnce, 'deferredOnce'),
    settledCount: optionalFiniteNumber(raw.settled, 'settled'),
    correctCount: optionalFiniteNumber(raw.correctCount, 'correctCount'),
    wrongCount: optionalFiniteNumber(raw.wrongCount, 'wrongCount'),
    deferredCount: optionalFiniteNumber(raw.deferredCount, 'deferredCount'),
    elapsedSeconds: optionalFiniteNumber(raw.sessionElapsed, 'sessionElapsed'),
    updatedAt
  }
}
