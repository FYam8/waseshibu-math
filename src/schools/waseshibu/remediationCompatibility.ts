import type {
  CanonicalRemediationProgress,
  CanonicalRemediationState
} from '../../engine/remediationContract'

export const LEGACY_REMEDIATION_PROGRESS_KEY = 'waseshibu-math-remediation-progress-v1'

export type WaseShibuLegacyRemediationProgressRecord = Record<string, unknown> & {
  sourceQuestionId: string
  field: string
  rank: 'A' | 'B' | 'C'
  currentIndex: number
  streak: number
  attemptCount: number
  correctQuestionIdsInCurrentStreak: string[]
  sourceAttemptAt?: string
  status: 'in-progress' | 'completed'
  updatedAt: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.floor(Number.isFinite(n) ? n : min)))

/**
 * Pure mirror of the per-record normalization performed by
 * `loadRemediationProgressState()` in the current WaseShibu runtime.
 *
 * Keeping this separate from the generic projection lets parity tests compare
 * the active legacy reader against the canonical shadow without changing the
 * runtime reader or writer.
 */
export function normalizeWaseShibuRemediationRecord(
  entryKey: string,
  value: unknown
): WaseShibuLegacyRemediationProgressRecord {
  if (!isObject(value)) throw new Error(`remediation ${entryKey} must be an object`)
  const v = value as Record<string, unknown>
  const sourceQuestionId = String(v.sourceQuestionId || entryKey)
  const rank = v.rank === 'B' || v.rank === 'C' ? v.rank : 'A'
  const streak = clamp(Number(v.streak || 0), 0, 4)
  return {
    ...v,
    sourceQuestionId,
    field: String(v.field || ''),
    rank,
    currentIndex: Math.max(0, Math.floor(Number(v.currentIndex) || 0)),
    streak,
    attemptCount: Math.max(0, Math.floor(Number(v.attemptCount) || 0)),
    correctQuestionIdsInCurrentStreak: Array.isArray(v.correctQuestionIdsInCurrentStreak)
      ? v.correctQuestionIdsInCurrentStreak.map(String).slice(-4)
      : [],
    sourceAttemptAt: typeof v.sourceAttemptAt === 'string' ? v.sourceAttemptAt : undefined,
    status: v.status === 'completed' || streak >= 4 ? 'completed' : 'in-progress',
    updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : new Date(0).toISOString()
  }
}

function requireFiniteInteger(value: number, label: string) {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must normalize to a non-negative finite integer`)
  }
  return value
}

function requireTimestamp(value: string, label: string) {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} must be a valid timestamp`)
  return value
}

/**
 * Convert one runtime-normalized WaseShibu record into generic remediation
 * semantics while preserving every normalized legacy field as school evidence.
 */
export function projectWaseShibuRemediationRecord(
  record: WaseShibuLegacyRemediationProgressRecord
): CanonicalRemediationProgress {
  if (!record.sourceQuestionId) throw new Error('remediation sourceQuestionId must not be empty')
  const streak = requireFiniteInteger(record.streak, `remediation ${record.sourceQuestionId}.streak`)
  if (streak > 4) throw new Error(`remediation ${record.sourceQuestionId}.streak must be 0..4`)
  requireFiniteInteger(record.currentIndex, `remediation ${record.sourceQuestionId}.currentIndex`)
  const attemptCount = requireFiniteInteger(record.attemptCount, `remediation ${record.sourceQuestionId}.attemptCount`)
  const updatedAt = requireTimestamp(record.updatedAt, `remediation ${record.sourceQuestionId}.updatedAt`)
  const sourceActivityAt = record.sourceAttemptAt === undefined
    ? undefined
    : requireTimestamp(record.sourceAttemptAt, `remediation ${record.sourceQuestionId}.sourceAttemptAt`)

  return {
    sourceProblemId: record.sourceQuestionId,
    ...(sourceActivityAt === undefined ? {} : { sourceActivityAt }),
    status: record.status,
    streak,
    attemptCount,
    correctProblemIdsInCurrentStreak: [...record.correctQuestionIdsInCurrentStreak],
    updatedAt,
    schoolEvidence: {
      legacyRecord: { ...record }
    }
  }
}

export function combineWaseShibuRemediationState(
  progressBySourceProblemId: Record<string, CanonicalRemediationProgress>
): CanonicalRemediationState {
  return { progressBySourceProblemId }
}
