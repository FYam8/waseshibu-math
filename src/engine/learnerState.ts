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
 */
export type CanonicalLearnerStateShadow = {
  preferences: CanonicalLearnerPreferences
  examResults: CanonicalExamResult[]
  draftsByExamId: Record<string, unknown>
  route: CanonicalLearningRouteState
}
