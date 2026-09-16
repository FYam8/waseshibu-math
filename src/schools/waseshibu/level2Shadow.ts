import type { CanonicalPracticeHistory } from '../../engine/practiceHistoryContract'
import { emptyCanonicalPracticeHistory } from '../../engine/practiceHistoryContract'
import {
  LEGACY_LEVEL2_HISTORY_KEY,
  normalizeWaseShibuLevel2Session,
  projectWaseShibuLevel2Attempt,
  projectWaseShibuLevel2MasteryEvent,
  projectWaseShibuLevel2ProblemStats,
  projectWaseShibuLevel2Session
} from './level2Compatibility'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuLevel2ShadowIssue = {
  key: typeof LEGACY_LEVEL2_HISTORY_KEY
  path?: string
  message: string
}

export type WaseShibuLevel2Shadow = {
  practiceHistory: CanonicalPracticeHistory
  present: boolean
  issues: WaseShibuLevel2ShadowIssue[]
}

function blankRuntimePracticeHistory() {
  const history = emptyCanonicalPracticeHistory()
  // `loadLevel2History()` materializes schemaVersion 1 even when the key is
  // absent/corrupt. `present` separately preserves whether source bytes existed.
  history.schoolEvidence = { legacySchemaVersion: 1 }
  return history
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function issue(
  issues: WaseShibuLevel2ShadowIssue[],
  message: string,
  path?: string
) {
  issues.push({ key: LEGACY_LEVEL2_HISTORY_KEY, ...(path ? { path } : {}), message })
}

function auditNormalizedIdArray(
  issues: WaseShibuLevel2ShadowIssue[],
  record: Record<string, unknown>,
  field: string,
  path: string
) {
  if (!Object.prototype.hasOwnProperty.call(record, field)) return
  const value = record[field]
  if (!Array.isArray(value)) {
    issue(issues, 'runtime normalization would replace a present non-array value', `${path}.${field}`)
    return
  }
  if (value.some(item => typeof item !== 'string')) {
    issue(issues, 'runtime normalization would silently drop or reinterpret non-string problem IDs', `${path}.${field}`)
  }
  const strings = value.filter((item): item is string => typeof item === 'string')
  if (new Set(strings).size !== strings.length) {
    issue(issues, 'runtime normalization would silently deduplicate persisted problem IDs', `${path}.${field}`)
  }
}

function auditSessionRawLoss(
  issues: WaseShibuLevel2ShadowIssue[],
  record: Record<string, unknown>,
  path: string
) {
  for (const field of [
    'currentStreakQuestionIds',
    'lastPresentedIds',
    'bagRemaining',
    'fixedQuestionIds',
    'completedQuestionIds',
    'retryQuestionIds'
  ]) auditNormalizedIdArray(issues, record, field, path)

  if (Object.prototype.hasOwnProperty.call(record, 'requiredCount')) {
    const number = Number(record.requiredCount)
    if (!Number.isFinite(number) || !Number.isInteger(number) || number < 1 || number > 4) {
      issue(issues, 'present requiredCount would be clamped or replaced by WaseShibu fallback policy', `${path}.requiredCount`)
    }
  }

  if (Object.prototype.hasOwnProperty.call(record, 'pendingAssistance') && record.pendingAssistance !== null) {
    const pending = record.pendingAssistance
    if (!isObject(pending) || typeof pending.questionId !== 'string' || pending.questionId.length === 0) {
      issue(issues, 'runtime normalization would replace malformed pending assistance with null', `${path}.pendingAssistance`)
    } else {
      for (const flag of ['usedHint', 'usedExplanation', 'revealedAnswer']) {
        if (Object.prototype.hasOwnProperty.call(pending, flag) && typeof pending[flag] !== 'boolean') {
          issue(issues, 'runtime normalization would coerce a present assistance flag to false', `${path}.pendingAssistance.${flag}`)
        }
      }
      const extra = Object.keys(pending).filter(key => !['questionId', 'usedHint', 'usedExplanation', 'revealedAnswer'].includes(key))
      if (extra.length) {
        issue(issues, `runtime normalization would discard pending-assistance fields: ${extra.join(', ')}`, `${path}.pendingAssistance`)
      }
    }
  }
}

/**
 * Strict migration shadow for the WaseShibu Level2 history surface.
 *
 * Effective values mirror the current forgiving reader. Any raw value that the
 * reader would silently filter, deduplicate, clamp, downgrade or overwrite is
 * reported so a future write migration cannot claim lossless parity.
 */
export function readWaseShibuCanonicalLevel2Shadow(
  storage: ReadOnlyStorage = localStorage
): WaseShibuLevel2Shadow {
  const issues: WaseShibuLevel2ShadowIssue[] = []
  const rawText = storage.getItem(LEGACY_LEVEL2_HISTORY_KEY)
  if (rawText === null) return { practiceHistory: blankRuntimePracticeHistory(), present: false, issues }

  let raw: unknown
  try {
    raw = JSON.parse(rawText)
  } catch {
    issue(issues, 'persisted Level2 history is not valid JSON')
    return { practiceHistory: blankRuntimePracticeHistory(), present: true, issues }
  }
  if (!isObject(raw)) {
    issue(issues, 'persisted Level2 history must be a JSON object')
    return { practiceHistory: blankRuntimePracticeHistory(), present: true, issues }
  }

  const allowedRootKeys = new Set(['schemaVersion', 'attempts', 'questionStats', 'sessions', 'masteryEvents'])
  const unknownRootKeys = Object.keys(raw).filter(key => !allowedRootKeys.has(key))
  if (unknownRootKeys.length) {
    issue(issues, `active Level2 reader would discard unknown root fields: ${unknownRootKeys.join(', ')}`)
  }
  if (Object.prototype.hasOwnProperty.call(raw, 'schemaVersion') && raw.schemaVersion !== 1) {
    issue(issues, 'active reader would silently report schemaVersion 1 for a different persisted version', 'schemaVersion')
  }

  const practiceHistory = blankRuntimePracticeHistory()

  const attempts = raw.attempts
  if (attempts !== undefined && !Array.isArray(attempts)) {
    issue(issues, 'active reader would silently replace a present non-array attempts value with []', 'attempts')
  } else if (Array.isArray(attempts)) {
    const ids = new Set<string>()
    for (let index = 0; index < attempts.length; index++) {
      try {
        const projected = projectWaseShibuLevel2Attempt(attempts[index], index)
        if (ids.has(projected.id)) issue(issues, 'duplicate Level2 attempt identity requires an explicit no-loss policy', `attempts[${index}].attemptId`)
        ids.add(projected.id)
        practiceHistory.attempts.push(projected)
      } catch (error) {
        issue(issues, error instanceof Error ? error.message : 'Level2 attempt cannot map canonically', `attempts[${index}]`)
      }
    }
  }

  const stats = raw.questionStats
  if (stats !== undefined && (!stats || typeof stats !== 'object' || Array.isArray(stats))) {
    issue(
      issues,
      Array.isArray(stats)
        ? 'active reader accepts an array as questionStats; canonical migration requires a keyed object'
        : 'active reader would silently replace malformed questionStats with {}',
      'questionStats'
    )
  } else if (isObject(stats)) {
    for (const [problemId, value] of Object.entries(stats)) {
      try {
        practiceHistory.problemStatsByProblemId[problemId] = projectWaseShibuLevel2ProblemStats(problemId, value)
      } catch (error) {
        issue(issues, error instanceof Error ? error.message : 'Level2 questionStats entry cannot map canonically', `questionStats.${problemId}`)
      }
    }
  }

  const sessions = raw.sessions
  if (sessions !== undefined && (!sessions || typeof sessions !== 'object' || Array.isArray(sessions))) {
    issue(
      issues,
      Array.isArray(sessions)
        ? 'history reader drops an array sessions root while the progress-summary reader would still traverse it'
        : 'active reader would silently ignore malformed sessions state',
      'sessions'
    )
  } else if (isObject(sessions)) {
    const sessionIds = new Set<string>()
    for (const [storageKey, value] of Object.entries(sessions)) {
      const path = `sessions.${storageKey}`
      if (!isObject(value)) {
        issue(issues, 'active reader would silently skip a non-object session entry', path)
        continue
      }
      auditSessionRawLoss(issues, value, path)
      try {
        const normalized = normalizeWaseShibuLevel2Session(value)
        const projected = projectWaseShibuLevel2Session(storageKey, normalized)
        if (sessionIds.has(projected.id)) {
          issue(issues, 'multiple session map entries share one sessionId and require an explicit identity policy', `${path}.sessionId`)
        }
        sessionIds.add(projected.id)
        practiceHistory.sessionsByKey[storageKey] = projected
      } catch (error) {
        issue(issues, error instanceof Error ? error.message : 'Level2 session cannot map canonically', path)
        // A normalization throw is inside the active reader's outer try/catch and
        // therefore blanks the entire Level2 history at runtime. Do not pretend a
        // partial canonical candidate is equivalent to that reader.
        if (error instanceof TypeError) {
          return { practiceHistory: blankRuntimePracticeHistory(), present: true, issues }
        }
      }
    }
  }

  const masteryEvents = raw.masteryEvents
  if (masteryEvents !== undefined && !Array.isArray(masteryEvents)) {
    issue(issues, 'active reader would silently replace a present non-array masteryEvents value with []', 'masteryEvents')
  } else if (Array.isArray(masteryEvents)) {
    for (let index = 0; index < masteryEvents.length; index++) {
      const event = masteryEvents[index]
      if (isObject(event) && Array.isArray(event.questionIds)) {
        if (event.questionIds.some(item => typeof item !== 'string')) {
          issue(issues, 'mastery event contains a non-string problem ID', `masteryEvents[${index}].questionIds`)
        }
        const strings = event.questionIds.filter((item): item is string => typeof item === 'string')
        if (new Set(strings).size !== strings.length) {
          issue(issues, 'mastery event contains duplicate problem IDs', `masteryEvents[${index}].questionIds`)
        }
      }
      try {
        practiceHistory.masteryEvents.push(projectWaseShibuLevel2MasteryEvent(event, index))
      } catch (error) {
        issue(issues, error instanceof Error ? error.message : 'Level2 mastery event cannot map canonically', `masteryEvents[${index}]`)
      }
    }
  }

  return { practiceHistory, present: true, issues }
}
