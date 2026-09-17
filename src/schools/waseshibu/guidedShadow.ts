import type {
  CanonicalGuidedLearningState,
  CanonicalGuidedProblemProgress
} from '../../engine/learnerState'
import {
  LEGACY_GUIDED_PROGRESS_KEY,
  LEGACY_GUIDED_REVIEW_KEY,
  combineWaseShibuGuidedState,
  projectWaseShibuGuidedProgressRecord,
  projectWaseShibuLegacyGuidedReviewRecord,
  type WaseShibuLegacyGuidedReviewEvidence
} from './guidedCompatibility'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuGuidedShadowIssue = {
  key: typeof LEGACY_GUIDED_REVIEW_KEY | typeof LEGACY_GUIDED_PROGRESS_KEY
  problemId?: string
  message: string
}

export type WaseShibuGuidedShadow = {
  guidedLearning: CanonicalGuidedLearningState
  legacyReviewPresent: boolean
  progressPresent: boolean
  issues: WaseShibuGuidedShadowIssue[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function readRawObject(
  storage: ReadOnlyStorage,
  key: typeof LEGACY_GUIDED_REVIEW_KEY | typeof LEGACY_GUIDED_PROGRESS_KEY,
  issues: WaseShibuGuidedShadowIssue[]
) {
  const raw = storage.getItem(key)
  if (raw === null) return { present: false, value: {} as Record<string, unknown> }
  try {
    const parsed = JSON.parse(raw)
    if (!isObject(parsed)) {
      issues.push({ key, message: 'persisted guided state must be a JSON object' })
      return { present: true, value: {} as Record<string, unknown> }
    }
    return { present: true, value: parsed }
  } catch {
    issues.push({ key, message: 'persisted guided state is not valid JSON' })
    return { present: true, value: {} as Record<string, unknown> }
  }
}

/**
 * Strict, read-only projection of both WaseShibu guided stores.
 *
 * `guided-progress-v2` is the active mastery/progress timeline. The older
 * `guided-review-v1` record is still written/read as compatibility evidence and
 * a final-answer fallback, so it is preserved under schoolEvidence instead of
 * being treated as a second mastery timeline.
 */
export function readWaseShibuCanonicalGuidedShadow(
  storage: ReadOnlyStorage = localStorage
): WaseShibuGuidedShadow {
  const issues: WaseShibuGuidedShadowIssue[] = []
  const legacyReviews = readRawObject(storage, LEGACY_GUIDED_REVIEW_KEY, issues)
  const progress = readRawObject(storage, LEGACY_GUIDED_PROGRESS_KEY, issues)

  const legacyReviewByProblemId: Record<string, WaseShibuLegacyGuidedReviewEvidence> = {}
  for (const [problemId, value] of Object.entries(legacyReviews.value)) {
    try {
      legacyReviewByProblemId[problemId] = projectWaseShibuLegacyGuidedReviewRecord(problemId, value)
    } catch (error) {
      issues.push({
        key: LEGACY_GUIDED_REVIEW_KEY,
        problemId,
        message: error instanceof Error ? error.message : 'legacy guided review cannot map canonically'
      })
    }
  }

  const progressByProblemId: Record<string, CanonicalGuidedProblemProgress> = {}
  for (const [problemId, value] of Object.entries(progress.value)) {
    try {
      progressByProblemId[problemId] = projectWaseShibuGuidedProgressRecord(problemId, value)
    } catch (error) {
      issues.push({
        key: LEGACY_GUIDED_PROGRESS_KEY,
        problemId,
        message: error instanceof Error ? error.message : 'guided progress cannot map canonically'
      })
    }
  }

  return {
    guidedLearning: combineWaseShibuGuidedState(progressByProblemId, legacyReviewByProblemId),
    legacyReviewPresent: legacyReviews.present,
    progressPresent: progress.present,
    issues
  }
}
