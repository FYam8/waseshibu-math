import {
  LEGACY_REMEDIATION_PROGRESS_KEY,
  type WaseShibuLegacyRemediationProgressRecord
} from './remediationCompatibility'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.floor(Number.isFinite(n) ? n : min)))

/**
 * Read-only mirror of `loadRemediationProgressState()`.
 *
 * It intentionally reproduces today's forgiving parse, coercion, re-keying and
 * overwrite semantics but exposes no writer. The canonical audit separately
 * flags raw records that would be silently dropped or collided during migration.
 */
export function readLegacyRemediationProgressForAudit(
  storage: ReadOnlyStorage = localStorage
): Record<string, WaseShibuLegacyRemediationProgressRecord> {
  try {
    const raw = JSON.parse(storage.getItem(LEGACY_REMEDIATION_PROGRESS_KEY) || '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out: Record<string, WaseShibuLegacyRemediationProgressRecord> = {}
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue
      const v = value as Record<string, unknown>
      const sourceQuestionId = String(v.sourceQuestionId || key)
      const rank = v.rank === 'B' || v.rank === 'C' ? v.rank : 'A'
      const streak = clamp(Number(v.streak || 0), 0, 4)
      out[sourceQuestionId] = {
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
    return out
  } catch {
    return {}
  }
}
