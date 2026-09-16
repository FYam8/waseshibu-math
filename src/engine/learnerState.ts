import type { CanonicalExamResult } from './examContract'

export type CanonicalLearnerPreferences = {
  targetId: string
  name?: string
  updatedAt: string
}

/**
 * Generic exam draft wrapper. The payload remains owned by the exam UI until a
 * later extraction defines a canonical answer/timer draft schema.
 */
export type CanonicalExamDraft<TPayload = unknown> = {
  examId: string
  payload: TPayload
}

export type CanonicalActivityOutcome = 'correct' | 'wrong' | 'deferred'

/**
 * Shared metadata for one persisted learning activity.
 *
 * `schoolEvidence` is intentionally opaque to generic engine code. It exists so
 * a school adapter can preserve legacy-only fields during migration without
 * turning those fields into universal semantics.
 */
export type CanonicalActivityBase = {
  id: string
  at: string
  deviceId?: string
  resetVersion?: number
  topicLabel?: string
  schoolEvidence?: Record<string, unknown>
}

/** A learner actually answered, skipped or deferred one concrete problem. */
export type CanonicalProblemAttemptActivity = CanonicalActivityBase & {
  kind: 'problem-attempt'
  problemId: string
  examId?: string
  outcome: CanonicalActivityOutcome
  answerText?: string
  flagged?: boolean
  durationSeconds?: number
}

/** Opening a concrete exam is exposure evidence, not a problem answer attempt. */
export type CanonicalExamExposureActivity = CanonicalActivityBase & {
  kind: 'exam-exposure'
  examId: string
}

/**
 * Legacy apps may persist mastery markers in an attempt-like container. Keep
 * them explicit so generic attempt analytics never mistake them for answers.
 */
export type CanonicalMasteryMarkerActivity = CanonicalActivityBase & {
  kind: 'mastery-marker'
  markerId: string
}

export type CanonicalActivityRecord =
  | CanonicalProblemAttemptActivity
  | CanonicalExamExposureActivity
  | CanonicalMasteryMarkerActivity

/**
 * One resumable daily problem-practice session.
 *
 * This is intentionally not the same concept as a school's generated
 * "today's required tasks" scheduler. Problem IDs are opaque; the shared
 * engine does not parse them or infer school policy from them.
 */
export type CanonicalDailyPracticeSession = {
  date: string
  problemIds: string[]
  completed: boolean
  queueProblemIds?: string[]
  deferredOnceProblemIds?: string[]
  settledCount?: number
  correctCount?: number
  wrongCount?: number
  deferredCount?: number
  elapsedSeconds?: number
  updatedAt?: string
}

export type CanonicalReinforcementState = {
  /** Concrete source exam whose weaknesses created this plan. */
  sourceExamId: string
  /** Optional source result identity when the school keeps result records. */
  sourceResultId?: string
  targetId?: string
  fields: Record<string, string[]>
  completedProblemIds: string[]
  createdAt?: string
  requiresSourceReview?: boolean
}

export type CanonicalLearningRouteState = {
  solvedExamIds: string[]
  usedProblemIds: string[]
  completedExamIdsByTarget: Record<string, string[]>
  reinforcementByExamId: Record<string, CanonicalReinforcementState>
  updatedAt?: string
}

/**
 * Read model used during behaviour-preserving extraction. It is deliberately a
 * value object: persistence code is school-owned and injected separately.
 *
 * Activity records and daily practice are separately audited before they are
 * added to the aggregate migration surface.
 */
export type CanonicalLearnerStateShadow = {
  preferences: CanonicalLearnerPreferences
  examResults: CanonicalExamResult[]
  draftsByExamId: Record<string, unknown>
  route: CanonicalLearningRouteState
}

/**
 * In-memory migration candidate after all currently integrated safety audits.
 * This does not imply a canonical storage key or authorize a write migration.
 */
export type CanonicalLearnerStateMigrationCandidate = CanonicalLearnerStateShadow & {
  activityRecords: CanonicalActivityRecord[]
}
