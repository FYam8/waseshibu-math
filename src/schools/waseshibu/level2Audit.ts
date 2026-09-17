import type { CanonicalPracticeHistory } from '../../engine/practiceHistoryContract'
import { emptyCanonicalPracticeHistory } from '../../engine/practiceHistoryContract'
import {
  LEGACY_LEVEL2_HISTORY_KEY,
  canonicalLevel2SessionSummaries,
  projectWaseShibuLevel2History
} from './level2Compatibility'
import {
  readLegacyLevel2HistoryForAudit,
  readLegacyLevel2SessionSummariesForAudit
} from './level2LegacyReader'
import { readWaseShibuCanonicalLevel2Shadow } from './level2Shadow'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuLevel2AuditMismatch = {
  surface: 'practiceHistory' | 'sessionSummaries' | 'legacyReader' | 'storage' | 'shadow'
  message: string
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

/**
 * Read-only parity audit for the complete Level2 durable history surface plus
 * the independent session-summary reader used by progress/route UI.
 */
export function auditWaseShibuLevel2State(
  storage: ReadOnlyStorage = localStorage
) {
  const before = storage.getItem(LEGACY_LEVEL2_HISTORY_KEY)
  const mismatches: WaseShibuLevel2AuditMismatch[] = []
  const shadow = readWaseShibuCanonicalLevel2Shadow(storage)

  for (const shadowIssue of shadow.issues) {
    mismatches.push({
      surface: 'shadow',
      message: `${shadowIssue.path || LEGACY_LEVEL2_HISTORY_KEY}: ${shadowIssue.message}`
    })
  }

  let legacyProjection: CanonicalPracticeHistory = emptyCanonicalPracticeHistory()
  try {
    legacyProjection = projectWaseShibuLevel2History(readLegacyLevel2HistoryForAudit(storage))
    if (!sameValue(legacyProjection, shadow.practiceHistory)) {
      mismatches.push({
        surface: 'practiceHistory',
        message: 'read-only legacy Level2 projection and canonical shadow are not equivalent'
      })
    }
  } catch (error) {
    mismatches.push({
      surface: 'legacyReader',
      message: `legacy Level2 reader cannot project canonically: ${error instanceof Error ? error.message : 'unknown error'}`
    })
  }

  const legacySummaries = readLegacyLevel2SessionSummariesForAudit(storage)
  const canonicalSummaries = canonicalLevel2SessionSummaries(shadow.practiceHistory)
  if (!sameValue(legacySummaries, canonicalSummaries)) {
    mismatches.push({
      surface: 'sessionSummaries',
      message: 'Level2 progress-summary reader and canonical session summaries are not equivalent'
    })
  }

  const after = storage.getItem(LEGACY_LEVEL2_HISTORY_KEY)
  if (before !== after) {
    mismatches.push({ surface: 'storage', message: 'Level2 audit changed persisted WaseShibu state' })
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    legacyProjection,
    canonicalShadow: shadow.practiceHistory,
    legacySummaries,
    canonicalSummaries
  }
}
