import {
  LEGACY_GUIDED_PROGRESS_KEY,
  LEGACY_GUIDED_REVIEW_KEY
} from './guidedCompatibility'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

function readLegacyObject(storage: ReadOnlyStorage, key: string): Record<string, unknown> {
  try {
    const value = JSON.parse(storage.getItem(key) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {}
  } catch {
    return {}
  }
}

/**
 * Read-only mirror of `loadGuidedReviews()` in `guidedReview.ts`.
 * It intentionally keeps the current forgiving parse/object semantics and
 * performs no validation, normalization or write.
 */
export function readLegacyGuidedReviewsForAudit(storage: ReadOnlyStorage = localStorage) {
  return readLegacyObject(storage, LEGACY_GUIDED_REVIEW_KEY)
}

/**
 * Read-only mirror of `loadGuidedProgressState()` in `guidedReview.ts`.
 * It intentionally keeps the current forgiving parse/object semantics and
 * performs no validation, normalization or write.
 */
export function readLegacyGuidedProgressForAudit(storage: ReadOnlyStorage = localStorage) {
  return readLegacyObject(storage, LEGACY_GUIDED_PROGRESS_KEY)
}
