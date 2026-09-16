import type {
  CanonicalPracticeAttempt,
  CanonicalPracticeHistory,
  CanonicalPracticeMasteryEvent,
  CanonicalPracticeProblemStats,
  CanonicalPracticeSession
} from '../../engine/practiceHistoryContract'
import { emptyCanonicalPracticeHistory } from '../../engine/practiceHistoryContract'
import { requiredPracticeCount } from '../../practiceLoad'

export const LEGACY_LEVEL2_HISTORY_KEY = 'waseshibu-math-level2-history-v1'

export type WaseShibuLegacyLevel2Session = Record<string, unknown> & {
  sessionId: unknown
  triggerSourceQuestionId: unknown
  directLevel2QuestionId: unknown
  fieldIdAtSessionStart: unknown
  fieldAssignmentRevisionAtSessionStart: unknown
  currentStreak: unknown
  currentStreakQuestionIds: string[]
  bestStreak: unknown
  status: unknown
  sourceAttemptAt?: unknown
  lastQuestionId: unknown
  lastPresentedIds: string[]
  bagRemaining: string[]
  updatedAt: unknown
  requiredCount: number
  fixedQuestionIds: string[]
  completedQuestionIds: string[]
  retryQuestionIds: string[]
  pendingAssistance: {
    questionId: string
    usedHint: boolean
    usedExplanation: boolean
    revealedAnswer: boolean
  } | null
}

export type WaseShibuLegacyLevel2History = {
  schemaVersion: 1
  attempts: unknown[]
  questionStats: Record<string, unknown> | unknown[]
  sessions: Record<string, WaseShibuLegacyLevel2Session>
  masteryEvents: unknown[]
}

export type WaseShibuLevel2SessionSummary = {
  triggerSourceQuestionId: string | null
  sourceAttemptAt?: string
  requiredCount: number
  completedQuestionIds: string[]
  status: 'active' | 'completed'
  updatedAt: string
}

export function uniqueLegacyLevel2Ids(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string'))]
    : []
}

/** Exact per-session normalization used by the active Level2 history reader. */
export function normalizeWaseShibuLevel2Session(value: Record<string, unknown>): WaseShibuLegacyLevel2Session {
  const currentStreakQuestionIds = uniqueLegacyLevel2Ids(value.currentStreakQuestionIds)
  const pending = value.pendingAssistance
  const pendingAssistance = pending && typeof pending === 'object' && !Array.isArray(pending) && typeof (pending as Record<string, unknown>).questionId === 'string'
    ? {
        questionId: String((pending as Record<string, unknown>).questionId),
        usedHint: (pending as Record<string, unknown>).usedHint === true,
        usedExplanation: (pending as Record<string, unknown>).usedExplanation === true,
        revealedAnswer: (pending as Record<string, unknown>).revealedAnswer === true
      }
    : null

  return {
    ...value,
    currentStreakQuestionIds,
    lastPresentedIds: uniqueLegacyLevel2Ids(value.lastPresentedIds),
    bagRemaining: uniqueLegacyLevel2Ids(value.bagRemaining),
    requiredCount: Math.max(
      1,
      Math.min(
        4,
        Number(value.requiredCount) ||
          requiredPracticeCount(
            value.triggerSourceQuestionId as string | null,
            value.fieldIdAtSessionStart as string
          )
      )
    ),
    fixedQuestionIds: uniqueLegacyLevel2Ids(value.fixedQuestionIds),
    completedQuestionIds: Array.isArray(value.completedQuestionIds)
      ? uniqueLegacyLevel2Ids(value.completedQuestionIds)
      : currentStreakQuestionIds,
    retryQuestionIds: uniqueLegacyLevel2Ids(value.retryQuestionIds),
    pendingAssistance
  } as WaseShibuLegacyLevel2Session
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value as Record<string, unknown>
}

function nonEmptyString(value: unknown, label: string) {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`)
  return value
}

function nullableString(value: unknown, label: string) {
  if (value === null || value === undefined) return null
  return nonEmptyString(value, label)
}

function booleanValue(value: unknown, label: string) {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`)
  return value
}

function integer(value: unknown, label: string, min = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < min) {
    throw new Error(`${label} must be an integer >= ${min}`)
  }
  return value
}

function validTimestamp(value: unknown, label: string) {
  const text = nonEmptyString(value, label)
  if (!Number.isFinite(Date.parse(text))) throw new Error(`${label} must be a valid timestamp`)
  return text
}

function stringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) throw new Error(`${label} must be a string array`)
  return [...value] as string[]
}

export function projectWaseShibuLevel2Attempt(value: unknown, index: number): CanonicalPracticeAttempt {
  const record = asRecord(value, `Level2 attempt[${index}]`)
  return {
    id: nonEmptyString(record.attemptId, `Level2 attempt[${index}].attemptId`),
    problemId: nonEmptyString(record.questionId, `Level2 attempt[${index}].questionId`),
    presentationId: nonEmptyString(record.presentationId, `Level2 attempt[${index}].presentationId`),
    sessionId: nullableString(record.weaknessSessionId, `Level2 attempt[${index}].weaknessSessionId`),
    answeredAt: validTimestamp(record.answeredAt, `Level2 attempt[${index}].answeredAt`),
    submissionIndex: integer(record.submissionIndex, `Level2 attempt[${index}].submissionIndex`, 1),
    firstSubmission: booleanValue(record.isFirstSubmissionForPresentation, `Level2 attempt[${index}].isFirstSubmissionForPresentation`),
    correct: booleanValue(record.isCorrect, `Level2 attempt[${index}].isCorrect`),
    usedHintBeforeAnswer: booleanValue(record.usedHintBeforeAnswer, `Level2 attempt[${index}].usedHintBeforeAnswer`),
    usedExplanationBeforeAnswer: booleanValue(record.usedExplanationBeforeAnswer, `Level2 attempt[${index}].usedExplanationBeforeAnswer`),
    revealedAnswerBeforeAnswer: booleanValue(record.revealedAnswerBeforeAnswer, `Level2 attempt[${index}].revealedAnswerBeforeAnswer`),
    contentRevisionAtAttempt: integer(record.contentRevisionAtAttempt, `Level2 attempt[${index}].contentRevisionAtAttempt`),
    gradingRevisionAtAttempt: integer(record.gradingRevisionAtAttempt, `Level2 attempt[${index}].gradingRevisionAtAttempt`),
    skillIdAtAttempt: nonEmptyString(record.fieldIdAtAttempt, `Level2 attempt[${index}].fieldIdAtAttempt`),
    skillAssignmentRevisionAtAttempt: integer(record.fieldAssignmentRevisionAtAttempt, `Level2 attempt[${index}].fieldAssignmentRevisionAtAttempt`),
    practiceSkillIdAtAttempt: nullableString(record.practiceFieldIdAtAttempt, `Level2 attempt[${index}].practiceFieldIdAtAttempt`),
    answerText: typeof record.answer === 'string' ? record.answer : (() => { throw new Error(`Level2 attempt[${index}].answer must be a string`) })(),
    schoolEvidence: { legacyRecord: { ...record } }
  }
}

export function projectWaseShibuLevel2ProblemStats(
  problemId: string,
  value: unknown
): CanonicalPracticeProblemStats {
  nonEmptyString(problemId, 'Level2 questionStats key')
  const record = asRecord(value, `Level2 questionStats.${problemId}`)
  const lastAttemptAt = record.lastAttemptAt === null
    ? null
    : validTimestamp(record.lastAttemptAt, `Level2 questionStats.${problemId}.lastAttemptAt`)
  const lastResult = record.lastResult === null
    ? null
    : booleanValue(record.lastResult, `Level2 questionStats.${problemId}.lastResult`)
  return {
    attemptCount: integer(record.attemptCount, `Level2 questionStats.${problemId}.attemptCount`),
    correctCount: integer(record.correctCount, `Level2 questionStats.${problemId}.correctCount`),
    qualifyingCorrectCount: integer(record.qualifyingCorrectCount, `Level2 questionStats.${problemId}.qualifyingCorrectCount`),
    lastAttemptAt,
    lastResult,
    schoolEvidence: { legacyRecord: { ...record } }
  }
}

export function projectWaseShibuLevel2Session(
  storageKey: string,
  record: WaseShibuLegacyLevel2Session
): CanonicalPracticeSession {
  nonEmptyString(storageKey, 'Level2 session storage key')
  const requiredCount = integer(record.requiredCount, `Level2 session ${storageKey}.requiredCount`, 1)
  if (requiredCount > 4) throw new Error(`Level2 session ${storageKey}.requiredCount must be <= 4`)
  const sourceAttemptAt = record.sourceAttemptAt === undefined
    ? undefined
    : validTimestamp(record.sourceAttemptAt, `Level2 session ${storageKey}.sourceAttemptAt`)
  const status = record.status === 'active' || record.status === 'completed'
    ? record.status
    : (() => { throw new Error(`Level2 session ${storageKey}.status must be active or completed`) })()
  const pending = record.pendingAssistance

  return {
    id: nonEmptyString(record.sessionId, `Level2 session ${storageKey}.sessionId`),
    sourceProblemId: nullableString(record.triggerSourceQuestionId, `Level2 session ${storageKey}.triggerSourceQuestionId`),
    directProblemId: nullableString(record.directLevel2QuestionId, `Level2 session ${storageKey}.directLevel2QuestionId`),
    skillId: nonEmptyString(record.fieldIdAtSessionStart, `Level2 session ${storageKey}.fieldIdAtSessionStart`),
    skillAssignmentRevision: integer(record.fieldAssignmentRevisionAtSessionStart, `Level2 session ${storageKey}.fieldAssignmentRevisionAtSessionStart`),
    currentStreak: integer(record.currentStreak, `Level2 session ${storageKey}.currentStreak`),
    currentStreakProblemIds: stringArray(record.currentStreakQuestionIds, `Level2 session ${storageKey}.currentStreakQuestionIds`),
    bestStreak: integer(record.bestStreak, `Level2 session ${storageKey}.bestStreak`),
    status,
    ...(sourceAttemptAt === undefined ? {} : { sourceActivityAt: sourceAttemptAt }),
    lastProblemId: nullableString(record.lastQuestionId, `Level2 session ${storageKey}.lastQuestionId`),
    recentProblemIds: stringArray(record.lastPresentedIds, `Level2 session ${storageKey}.lastPresentedIds`),
    remainingProblemIds: stringArray(record.bagRemaining, `Level2 session ${storageKey}.bagRemaining`),
    updatedAt: validTimestamp(record.updatedAt, `Level2 session ${storageKey}.updatedAt`),
    requiredCount,
    fixedProblemIds: stringArray(record.fixedQuestionIds, `Level2 session ${storageKey}.fixedQuestionIds`),
    completedProblemIds: stringArray(record.completedQuestionIds, `Level2 session ${storageKey}.completedQuestionIds`),
    retryProblemIds: stringArray(record.retryQuestionIds, `Level2 session ${storageKey}.retryQuestionIds`),
    pendingAssistance: pending === null
      ? null
      : {
          problemId: nonEmptyString(pending.questionId, `Level2 session ${storageKey}.pendingAssistance.questionId`),
          usedHint: pending.usedHint,
          usedExplanation: pending.usedExplanation,
          revealedAnswer: pending.revealedAnswer
        },
    schoolEvidence: {
      legacyStorageKey: storageKey,
      legacyRecord: { ...record }
    }
  }
}

export function projectWaseShibuLevel2MasteryEvent(value: unknown, index: number): CanonicalPracticeMasteryEvent {
  const record = asRecord(value, `Level2 masteryEvent[${index}]`)
  const requiredCount = record.requiredCount === undefined
    ? undefined
    : integer(record.requiredCount, `Level2 masteryEvent[${index}].requiredCount`, 1)
  if (requiredCount !== undefined && requiredCount > 4) {
    throw new Error(`Level2 masteryEvent[${index}].requiredCount must be <= 4`)
  }
  return {
    skillId: nonEmptyString(record.fieldId, `Level2 masteryEvent[${index}].fieldId`),
    achievedAt: validTimestamp(record.achievedAt, `Level2 masteryEvent[${index}].achievedAt`),
    skillAssignmentRevision: integer(record.fieldAssignmentRevision, `Level2 masteryEvent[${index}].fieldAssignmentRevision`),
    problemIds: stringArray(record.questionIds, `Level2 masteryEvent[${index}].questionIds`),
    ...(requiredCount === undefined ? {} : { requiredCount }),
    schoolEvidence: { legacyRecord: { ...record } }
  }
}

export function projectWaseShibuLevel2History(history: WaseShibuLegacyLevel2History): CanonicalPracticeHistory {
  const canonical = emptyCanonicalPracticeHistory()
  canonical.schoolEvidence = { legacySchemaVersion: history.schemaVersion }
  canonical.attempts = history.attempts.map(projectWaseShibuLevel2Attempt)
  if (Array.isArray(history.questionStats)) throw new Error('Level2 questionStats must not be an array')
  canonical.problemStatsByProblemId = Object.fromEntries(
    Object.entries(history.questionStats).map(([problemId, value]) => [
      problemId,
      projectWaseShibuLevel2ProblemStats(problemId, value)
    ])
  )
  canonical.sessionsByKey = Object.fromEntries(
    Object.entries(history.sessions).map(([key, value]) => [key, projectWaseShibuLevel2Session(key, value)])
  )
  canonical.masteryEvents = history.masteryEvents.map(projectWaseShibuLevel2MasteryEvent)
  return canonical
}

export function canonicalLevel2SessionSummaries(history: CanonicalPracticeHistory): WaseShibuLevel2SessionSummary[] {
  return Object.values(history.sessionsByKey).map(session => ({
    triggerSourceQuestionId: session.sourceProblemId,
    ...(session.sourceActivityAt === undefined ? {} : { sourceAttemptAt: session.sourceActivityAt }),
    requiredCount: session.requiredCount,
    completedQuestionIds: [...session.completedProblemIds],
    status: session.status,
    updatedAt: session.updatedAt
  }))
}
