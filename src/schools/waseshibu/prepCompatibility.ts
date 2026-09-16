import type { CanonicalPreparationCheckState } from '../../engine/learnerState'

export const WASESHIBU_PREP_KEY = 'waseshibu-math-prep-check-v1'
export const WASESHIBU_PREP_VERSION = 1
export const WASESHIBU_PREP_ITEM_COUNT = 5

const EPOCH = '1970-01-01T00:00:00.000Z'
const KNOWN_PREP_KEYS = new Set([
  'version',
  'index',
  'answers',
  'tries',
  'completed',
  'skipped',
  'updatedAt'
])

type LegacyPrepRuntimeState = {
  version: number
  index: number
  answers: Record<string, string>
  tries: Record<string, number>
  completed: boolean
  skipped: boolean
  updatedAt: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function assertKnownFields(raw: Record<string, unknown>) {
  const unknown = Object.keys(raw).filter(key => !KNOWN_PREP_KEYS.has(key))
  if (unknown.length) throw new Error(`prep state has unsupported fields: ${unknown.join(', ')}`)
}

function normalizeAnswers(value: unknown): Record<string, string> {
  if (value === undefined) return {}
  const raw = asRecord(value)
  if (!raw) throw new Error('prep answers must be an object when present')
  const result: Record<string, string> = {}
  for (const [itemId, answer] of Object.entries(raw)) {
    if (typeof answer !== 'string' && typeof answer !== 'number') {
      throw new Error(`prep answer for ${itemId} would be filtered by the current normalizer`)
    }
    result[itemId] = String(answer)
  }
  return result
}

function normalizeTries(value: unknown): Record<string, number> {
  if (value === undefined) return {}
  const raw = asRecord(value)
  if (!raw) throw new Error('prep tries must be an object when present')
  const result: Record<string, number> = {}
  for (const [itemId, count] of Object.entries(raw)) {
    const number = Number(count)
    if (!Number.isFinite(number)) {
      throw new Error(`prep tries for ${itemId} would be filtered by the current normalizer`)
    }
    result[itemId] = Math.max(0, Math.floor(number))
  }
  return result
}

/**
 * Independent mirror of the current `normalizePrepRecord()` + `loadPrepState()`
 * semantics for one persisted record. It is intentionally stricter only where
 * the current runtime would silently discard information: unknown fields,
 * future prep versions and malformed present fields block migration.
 */
export function normalizeWaseShibuPrepRawForAudit(value: unknown): LegacyPrepRuntimeState {
  if (value === null) {
    return {
      version: WASESHIBU_PREP_VERSION,
      index: 0,
      answers: {},
      tries: {},
      completed: false,
      skipped: false,
      updatedAt: EPOCH
    }
  }

  const raw = asRecord(value)
  if (!raw) throw new Error('persisted prep state must be an object or null')
  assertKnownFields(raw)

  if (raw.version !== undefined && Number(raw.version) !== WASESHIBU_PREP_VERSION) {
    throw new Error(`unsupported persisted prep version: ${String(raw.version)}`)
  }
  if (raw.completed !== undefined && typeof raw.completed !== 'boolean') {
    throw new Error('prep completed must be boolean when present')
  }
  if (raw.skipped !== undefined && typeof raw.skipped !== 'boolean') {
    throw new Error('prep skipped must be boolean when present')
  }
  if (raw.updatedAt !== undefined && typeof raw.updatedAt !== 'string') {
    throw new Error('prep updatedAt must be a string when present')
  }

  const numericIndex = Number(raw.index)
  const normalizedIndex = Number.isFinite(numericIndex) ? Math.max(0, numericIndex) : 0
  const clampedIndex = Math.max(0, Math.min(WASESHIBU_PREP_ITEM_COUNT - 1, normalizedIndex))

  if (!Number.isInteger(clampedIndex)) {
    throw new Error(`prep index is fractional after current normalization: ${clampedIndex}`)
  }

  return {
    version: WASESHIBU_PREP_VERSION,
    index: clampedIndex,
    answers: normalizeAnswers(raw.answers),
    tries: normalizeTries(raw.tries),
    completed: raw.completed === true,
    skipped: raw.skipped === true,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : EPOCH
  }
}

/** Strict projection of the active WaseShibu prep reader result. */
export function projectWaseShibuPrepRuntimeState(value: unknown): CanonicalPreparationCheckState {
  const raw = asRecord(value)
  if (!raw) throw new Error('active prep state must be an object')
  assertKnownFields(raw)

  if (raw.version !== WASESHIBU_PREP_VERSION) throw new Error('active prep version is not 1')
  if (!Number.isInteger(raw.index) || Number(raw.index) < 0 || Number(raw.index) >= WASESHIBU_PREP_ITEM_COUNT) {
    throw new Error(`active prep index is outside the current five-item contract: ${String(raw.index)}`)
  }

  const answers = asRecord(raw.answers)
  if (!answers || Object.values(answers).some(answer => typeof answer !== 'string')) {
    throw new Error('active prep answers are not a string record')
  }
  const tries = asRecord(raw.tries)
  if (!tries || Object.values(tries).some(count => typeof count !== 'number' || !Number.isInteger(count) || count < 0)) {
    throw new Error('active prep tries are not a non-negative integer record')
  }
  if (typeof raw.completed !== 'boolean' || typeof raw.skipped !== 'boolean') {
    throw new Error('active prep completion flags are invalid')
  }
  if (typeof raw.updatedAt !== 'string') throw new Error('active prep updatedAt is invalid')

  return {
    currentItemIndex: Number(raw.index),
    answersByItemId: Object.fromEntries(Object.entries(answers).map(([key, answer]) => [key, String(answer)])),
    triesByItemId: Object.fromEntries(Object.entries(tries).map(([key, count]) => [key, Number(count)])),
    completed: raw.completed,
    skipped: raw.skipped,
    updatedAt: raw.updatedAt,
    schoolEvidence: { legacyVersion: WASESHIBU_PREP_VERSION }
  }
}

export function projectWaseShibuPrepRawState(value: unknown): CanonicalPreparationCheckState {
  return projectWaseShibuPrepRuntimeState(normalizeWaseShibuPrepRawForAudit(value))
}
