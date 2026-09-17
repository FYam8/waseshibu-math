import { requiredPracticeCount } from '../../practiceLoad'
import {
  LEGACY_LEVEL2_HISTORY_KEY,
  normalizeWaseShibuLevel2Session,
  type WaseShibuLegacyLevel2History,
  type WaseShibuLevel2SessionSummary
} from './level2Compatibility'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

const blank = (): WaseShibuLegacyLevel2History => ({
  schemaVersion: 1,
  attempts: [],
  questionStats: {},
  sessions: {},
  masteryEvents: []
})

/**
 * Read-only mirror of the active `loadLevel2History()` reader.
 * It intentionally preserves today's forgiving root/array behavior and the
 * all-or-blank catch boundary, but exposes no writer.
 */
export function readLegacyLevel2HistoryForAudit(
  storage: ReadOnlyStorage = localStorage
): WaseShibuLegacyLevel2History {
  try {
    const raw = JSON.parse(storage.getItem(LEGACY_LEVEL2_HISTORY_KEY) || 'null')
    if (!raw || typeof raw !== 'object') return blank()
    const record = raw as Record<string, unknown>
    const sessions: WaseShibuLegacyLevel2History['sessions'] = {}
    if (record.sessions && typeof record.sessions === 'object' && !Array.isArray(record.sessions)) {
      for (const [key, value] of Object.entries(record.sessions as Record<string, unknown>)) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) continue
        sessions[key] = normalizeWaseShibuLevel2Session(value as Record<string, unknown>)
      }
    }
    return {
      schemaVersion: 1,
      attempts: Array.isArray(record.attempts) ? record.attempts : [],
      questionStats: record.questionStats && typeof record.questionStats === 'object'
        ? record.questionStats as Record<string, unknown> | unknown[]
        : {},
      sessions,
      masteryEvents: Array.isArray(record.masteryEvents) ? record.masteryEvents : []
    }
  } catch {
    return blank()
  }
}

/** Read-only mirror of `loadLevel2SessionSummaries()`. */
export function readLegacyLevel2SessionSummariesForAudit(
  storage: ReadOnlyStorage = localStorage
): WaseShibuLevel2SessionSummary[] {
  try {
    const raw = JSON.parse(storage.getItem(LEGACY_LEVEL2_HISTORY_KEY) || 'null') as Record<string, unknown> | null
    const sessions = raw?.sessions
    if (!sessions || typeof sessions !== 'object') return []
    return Object.values(sessions as Record<string, unknown>).flatMap(value => {
      if (!value || typeof value !== 'object') return []
      const session = value as Record<string, unknown>
      const completed = [...new Set(
        Array.isArray(session.completedQuestionIds)
          ? session.completedQuestionIds.map(String)
          : Array.isArray(session.currentStreakQuestionIds)
            ? session.currentStreakQuestionIds.map(String)
            : []
      )]
      const triggerSourceQuestionId = typeof session.triggerSourceQuestionId === 'string'
        ? session.triggerSourceQuestionId
        : null
      const fieldIdAtSessionStart = typeof session.fieldIdAtSessionStart === 'string'
        ? session.fieldIdAtSessionStart
        : ''
      return [{
        triggerSourceQuestionId,
        ...(typeof session.sourceAttemptAt === 'string' ? { sourceAttemptAt: session.sourceAttemptAt } : {}),
        requiredCount: Math.max(
          1,
          Math.min(
            4,
            Number(session.requiredCount) || requiredPracticeCount(triggerSourceQuestionId, fieldIdAtSessionStart)
          )
        ),
        completedQuestionIds: completed,
        status: session.status === 'completed' ? 'completed' as const : 'active' as const,
        updatedAt: typeof session.updatedAt === 'string' ? session.updatedAt : new Date(0).toISOString()
      }]
    })
  } catch {
    return []
  }
}
