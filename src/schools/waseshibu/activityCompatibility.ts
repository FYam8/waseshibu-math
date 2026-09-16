import type { CanonicalActivityRecord } from '../../engine/learnerState'
import type { Attempt } from '../../types'
import { examIdForLegacyYear } from './legacyCompatibility'

function legacyEvidence(attempt: Attempt) {
  const evidence: Record<string, unknown> = {
    legacyQuestionId: attempt.questionId,
    legacyMode: attempt.mode,
    legacyStatus: attempt.status
  }
  if (attempt.mistakeTag !== undefined) evidence.legacyMistakeTag = attempt.mistakeTag
  if (attempt.approach !== undefined) evidence.legacyApproach = attempt.approach
  if (attempt.diagnosis !== undefined) evidence.legacyDiagnosis = attempt.diagnosis
  return evidence
}

function examBackedProblemIdentity(questionId: string) {
  const prefix = questionId.startsWith('exam-')
    ? 'exam-'
    : questionId.startsWith('target-')
      ? 'target-'
      : null
  if (!prefix) return { problemId: questionId }

  const candidate = questionId.slice(prefix.length)
  const match = candidate.match(/^(\d{4})-Q/)
  if (!match) return { problemId: questionId }

  try {
    return { problemId: candidate, examId: examIdForLegacyYear(Number(match[1])) }
  } catch {
    // Preserve an unknown legacy problem identifier exactly rather than
    // inventing an exam binding. Exposure records are stricter because their
    // entire meaning depends on identifying one concrete exam.
    return { problemId: questionId }
  }
}

/**
 * WaseShibu-only compatibility projection for the legacy attempts container.
 *
 * The current container mixes actual answers with exposure and mastery marker
 * events. This adapter keeps those concepts distinct so the shared engine does
 * not universalize WaseShibu's `q1|multi` route labels or ID prefixes.
 */
export function projectWaseShibuAttemptActivity(attempt: Attempt): CanonicalActivityRecord {
  const base = {
    id: attempt.id,
    at: attempt.at,
    deviceId: attempt.deviceId,
    resetVersion: attempt.resetVersion,
    topicLabel: attempt.topic,
    schoolEvidence: legacyEvidence(attempt)
  }

  const exposure = attempt.questionId.match(/^exposure-(\d{4})$/)
  if (exposure) {
    return {
      ...base,
      kind: 'exam-exposure',
      examId: examIdForLegacyYear(Number(exposure[1]))
    }
  }

  if (attempt.questionId.startsWith('mastery-')) {
    return {
      ...base,
      kind: 'mastery-marker',
      markerId: attempt.questionId
    }
  }

  const identity = examBackedProblemIdentity(attempt.questionId)
  return {
    ...base,
    ...identity,
    kind: 'problem-attempt',
    outcome: attempt.status,
    answerText: attempt.answer,
    flagged: attempt.flagged,
    durationSeconds: attempt.seconds
  }
}
