import type {
  CanonicalGuidedLearningState,
  CanonicalGuidedMasteryState,
  CanonicalGuidedProblemProgress,
  CanonicalGuidedSelfAssessment,
  CanonicalGuidedStepProgress
} from '../../engine/learnerState'

export const LEGACY_GUIDED_REVIEW_KEY = 'waseshibu-math-guided-review-v1'
export const LEGACY_GUIDED_PROGRESS_KEY = 'waseshibu-math-guided-progress-v2'

const REVIEW_FIELDS = new Set([
  'questionId', 'step1', 'step2', 'finalAnswer', 'hintUsed', 'answerSeen', 'outcome', 'updatedAt'
])
const PROGRESS_FIELDS = new Set([
  'questionId', 'currentStepId', 'stepProgress', 'finalAnswer', 'finalAnswerSeen',
  'reproductionAttempts', 'reproductionSucceeded', 'independentSucceeded',
  'practiceStreak', 'mastery', 'dependencyMode', 'updatedAt', 'migratedFrom'
])
const STEP_FIELDS = new Set(['stepId', 'answer', 'tries', 'hintLevelUsed', 'completed', 'selfAssessment'])
const MASTERIES = new Set<CanonicalGuidedMasteryState>([
  'unseen', 'attempted', 'exposed', 'guided', 'reproduced', 'independent', 'consolidated'
])
const ASSESSMENTS = new Set<CanonicalGuidedSelfAssessment>(['matched', 'guided', 'unclear'])
const LEGACY_OUTCOMES = new Set(['independent', 'guided', 'reproduced', 'wrong'])

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function assertKnownFields(value: Record<string, unknown>, allowed: Set<string>, label: string) {
  const unknown = Object.keys(value).filter(key => !allowed.has(key))
  if (unknown.length) throw new Error(`${label} contains unsupported field(s): ${unknown.join(', ')}`)
}

function requireString(value: unknown, label: string) {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`)
  return value
}

function requireBoolean(value: unknown, label: string) {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`)
  return value
}

function requireNonNegativeInteger(value: unknown, label: string) {
  if (!Number.isInteger(value) || Number(value) < 0) throw new Error(`${label} must be a non-negative integer`)
  return Number(value)
}

function requireTimestamp(value: unknown, label: string) {
  const text = requireString(value, label)
  if (!Number.isFinite(Date.parse(text))) throw new Error(`${label} must be a valid timestamp`)
  return text
}

export type WaseShibuLegacyGuidedReviewEvidence = {
  questionId: string
  step1: string
  step2: string
  finalAnswer: string
  hintUsed: boolean
  answerSeen: boolean
  outcome?: 'independent' | 'guided' | 'reproduced' | 'wrong'
  updatedAt: string
}

/**
 * v1 review records are compatibility/fallback evidence, not authoritative
 * mastery state. Preserve them losslessly under schoolEvidence so a shared
 * engine never double-counts them as a second guided-progress timeline.
 */
export function projectWaseShibuLegacyGuidedReviewRecord(
  problemId: string,
  value: unknown
): WaseShibuLegacyGuidedReviewEvidence {
  if (!isObject(value)) throw new Error(`guided review ${problemId} must be an object`)
  assertKnownFields(value, REVIEW_FIELDS, `guided review ${problemId}`)
  const questionId = requireString(value.questionId, `guided review ${problemId}.questionId`)
  if (questionId !== problemId) throw new Error(`guided review key/questionId mismatch: ${problemId} / ${questionId}`)
  const outcome = value.outcome === undefined ? undefined : requireString(value.outcome, `guided review ${problemId}.outcome`)
  if (outcome !== undefined && !LEGACY_OUTCOMES.has(outcome)) {
    throw new Error(`guided review ${problemId}.outcome is unsupported: ${outcome}`)
  }
  return {
    questionId,
    step1: requireString(value.step1, `guided review ${problemId}.step1`),
    step2: requireString(value.step2, `guided review ${problemId}.step2`),
    finalAnswer: requireString(value.finalAnswer, `guided review ${problemId}.finalAnswer`),
    hintUsed: requireBoolean(value.hintUsed, `guided review ${problemId}.hintUsed`),
    answerSeen: requireBoolean(value.answerSeen, `guided review ${problemId}.answerSeen`),
    ...(outcome === undefined ? {} : { outcome: outcome as WaseShibuLegacyGuidedReviewEvidence['outcome'] }),
    updatedAt: requireTimestamp(value.updatedAt, `guided review ${problemId}.updatedAt`)
  }
}

function projectStep(problemId: string, stepId: string, value: unknown): CanonicalGuidedStepProgress {
  if (!isObject(value)) throw new Error(`guided progress ${problemId}.stepProgress.${stepId} must be an object`)
  assertKnownFields(value, STEP_FIELDS, `guided progress ${problemId}.stepProgress.${stepId}`)
  const storedStepId = requireString(value.stepId, `guided progress ${problemId}.stepProgress.${stepId}.stepId`)
  if (storedStepId !== stepId) throw new Error(`guided step key/stepId mismatch: ${stepId} / ${storedStepId}`)
  const hint = requireNonNegativeInteger(value.hintLevelUsed, `guided progress ${problemId}.stepProgress.${stepId}.hintLevelUsed`)
  if (hint > 3) throw new Error(`guided progress ${problemId}.stepProgress.${stepId}.hintLevelUsed must be 0..3`)
  const assessment = value.selfAssessment === undefined
    ? undefined
    : requireString(value.selfAssessment, `guided progress ${problemId}.stepProgress.${stepId}.selfAssessment`)
  if (assessment !== undefined && !ASSESSMENTS.has(assessment as CanonicalGuidedSelfAssessment)) {
    throw new Error(`guided progress ${problemId}.stepProgress.${stepId}.selfAssessment is unsupported: ${assessment}`)
  }
  return {
    stepId,
    answerText: requireString(value.answer, `guided progress ${problemId}.stepProgress.${stepId}.answer`),
    tries: requireNonNegativeInteger(value.tries, `guided progress ${problemId}.stepProgress.${stepId}.tries`),
    maxHintLevelUsed: hint as 0 | 1 | 2 | 3,
    completed: requireBoolean(value.completed, `guided progress ${problemId}.stepProgress.${stepId}.completed`),
    ...(assessment === undefined ? {} : { selfAssessment: assessment as CanonicalGuidedSelfAssessment })
  }
}

export function projectWaseShibuGuidedProgressRecord(
  problemId: string,
  value: unknown
): CanonicalGuidedProblemProgress {
  if (!isObject(value)) throw new Error(`guided progress ${problemId} must be an object`)
  assertKnownFields(value, PROGRESS_FIELDS, `guided progress ${problemId}`)
  const questionId = requireString(value.questionId, `guided progress ${problemId}.questionId`)
  if (questionId !== problemId) throw new Error(`guided progress key/questionId mismatch: ${problemId} / ${questionId}`)
  if (!isObject(value.stepProgress)) throw new Error(`guided progress ${problemId}.stepProgress must be an object`)

  const stepsById: Record<string, CanonicalGuidedStepProgress> = {}
  for (const [stepId, step] of Object.entries(value.stepProgress)) {
    stepsById[stepId] = projectStep(problemId, stepId, step)
  }

  const mastery = requireString(value.mastery, `guided progress ${problemId}.mastery`)
  if (!MASTERIES.has(mastery as CanonicalGuidedMasteryState)) {
    throw new Error(`guided progress ${problemId}.mastery is unsupported: ${mastery}`)
  }

  const currentStepId = value.currentStepId === undefined
    ? undefined
    : requireString(value.currentStepId, `guided progress ${problemId}.currentStepId`)
  const dependencyMode = value.dependencyMode === undefined
    ? undefined
    : requireString(value.dependencyMode, `guided progress ${problemId}.dependencyMode`)
  if (dependencyMode !== undefined && dependencyMode !== 'own' && dependencyMode !== 'official') {
    throw new Error(`guided progress ${problemId}.dependencyMode is unsupported: ${dependencyMode}`)
  }
  const migratedFrom = value.migratedFrom === undefined
    ? undefined
    : requireString(value.migratedFrom, `guided progress ${problemId}.migratedFrom`)

  const schoolEvidence: Record<string, unknown> = {}
  if (dependencyMode !== undefined) schoolEvidence.legacyDependencyMode = dependencyMode
  if (migratedFrom !== undefined) schoolEvidence.migratedFrom = migratedFrom

  return {
    problemId,
    ...(currentStepId === undefined ? {} : { currentStepId }),
    stepsById,
    finalAnswerText: requireString(value.finalAnswer, `guided progress ${problemId}.finalAnswer`),
    finalAnswerSeen: requireBoolean(value.finalAnswerSeen, `guided progress ${problemId}.finalAnswerSeen`),
    reproductionAttempts: requireNonNegativeInteger(value.reproductionAttempts, `guided progress ${problemId}.reproductionAttempts`),
    reproductionSucceeded: requireBoolean(value.reproductionSucceeded, `guided progress ${problemId}.reproductionSucceeded`),
    independentSucceeded: requireBoolean(value.independentSucceeded, `guided progress ${problemId}.independentSucceeded`),
    practiceStreak: requireNonNegativeInteger(value.practiceStreak, `guided progress ${problemId}.practiceStreak`),
    mastery: mastery as CanonicalGuidedMasteryState,
    updatedAt: requireTimestamp(value.updatedAt, `guided progress ${problemId}.updatedAt`),
    ...(Object.keys(schoolEvidence).length ? { schoolEvidence } : {})
  }
}

export function combineWaseShibuGuidedState(
  progressByProblemId: Record<string, CanonicalGuidedProblemProgress>,
  legacyReviewByProblemId: Record<string, WaseShibuLegacyGuidedReviewEvidence>
): CanonicalGuidedLearningState {
  return {
    progressByProblemId,
    schoolEvidence: { legacyReviewByProblemId }
  }
}
