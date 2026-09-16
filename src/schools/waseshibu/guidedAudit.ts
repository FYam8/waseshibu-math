import type { CanonicalGuidedProblemProgress } from '../../engine/learnerState'
import {
  LEGACY_GUIDED_PROGRESS_KEY,
  LEGACY_GUIDED_REVIEW_KEY,
  projectWaseShibuGuidedProgressRecord,
  projectWaseShibuLegacyGuidedReviewRecord,
  type WaseShibuLegacyGuidedReviewEvidence
} from './guidedCompatibility'
import {
  readLegacyGuidedProgressForAudit,
  readLegacyGuidedReviewsForAudit
} from './guidedLegacyReader'
import {
  readWaseShibuCanonicalGuidedShadow,
  type WaseShibuGuidedShadow
} from './guidedShadow'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuGuidedAuditMismatch = {
  surface: 'legacyReview' | 'guidedProgress' | 'storage' | 'shadow'
  message: string
}

export type WaseShibuGuidedAuditReport = {
  ok: boolean
  mismatches: WaseShibuGuidedAuditMismatch[]
  legacyReviewProjection: Record<string, WaseShibuLegacyGuidedReviewEvidence>
  guidedProgressProjection: Record<string, CanonicalGuidedProblemProgress>
  canonicalShadow: WaseShibuGuidedShadow
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

function snapshot(storage: ReadOnlyStorage) {
  return {
    [LEGACY_GUIDED_REVIEW_KEY]: storage.getItem(LEGACY_GUIDED_REVIEW_KEY),
    [LEGACY_GUIDED_PROGRESS_KEY]: storage.getItem(LEGACY_GUIDED_PROGRESS_KEY)
  }
}

function projectLegacyReviews(value: Record<string, unknown>) {
  const result: Record<string, WaseShibuLegacyGuidedReviewEvidence> = {}
  for (const [problemId, record] of Object.entries(value)) {
    result[problemId] = projectWaseShibuLegacyGuidedReviewRecord(problemId, record)
  }
  return result
}

function projectLegacyProgress(value: Record<string, unknown>) {
  const result: Record<string, CanonicalGuidedProblemProgress> = {}
  for (const [problemId, record] of Object.entries(value)) {
    result[problemId] = projectWaseShibuGuidedProgressRecord(problemId, record)
  }
  return result
}

/**
 * Read-only parity audit for WaseShibu guided state.
 *
 * The two persisted stores are intentionally audited separately. v2 progress is
 * the authoritative active mastery timeline; v1 review remains compatibility
 * evidence/final-answer fallback. The audit never requires their mastery values
 * to match, because legitimate current flows can update v2 without rewriting
 * every field in v1.
 */
export function auditWaseShibuGuidedState(
  storage: ReadOnlyStorage = localStorage
): WaseShibuGuidedAuditReport {
  const before = snapshot(storage)
  const mismatches: WaseShibuGuidedAuditMismatch[] = []
  const shadow = readWaseShibuCanonicalGuidedShadow(storage)

  for (const issue of shadow.issues) {
    mismatches.push({ surface: 'shadow', message: `${issue.key}${issue.problemId ? `/${issue.problemId}` : ''}: ${issue.message}` })
  }

  let legacyReviewProjection: Record<string, WaseShibuLegacyGuidedReviewEvidence> = {}
  try {
    legacyReviewProjection = projectLegacyReviews(readLegacyGuidedReviewsForAudit(storage))
    const shadowEvidence = (shadow.guidedLearning.schoolEvidence?.legacyReviewByProblemId || {}) as Record<string, unknown>
    if (!sameValue(legacyReviewProjection, shadowEvidence)) {
      mismatches.push({
        surface: 'legacyReview',
        message: 'read-only legacy guided-review projection and canonical compatibility evidence are not equivalent'
      })
    }
  } catch (error) {
    mismatches.push({
      surface: 'legacyReview',
      message: `legacy guided-review reader cannot project canonically: ${error instanceof Error ? error.message : 'unknown error'}`
    })
  }

  let guidedProgressProjection: Record<string, CanonicalGuidedProblemProgress> = {}
  try {
    guidedProgressProjection = projectLegacyProgress(readLegacyGuidedProgressForAudit(storage))
    if (!sameValue(guidedProgressProjection, shadow.guidedLearning.progressByProblemId)) {
      mismatches.push({
        surface: 'guidedProgress',
        message: 'read-only legacy guided-progress projection and canonical active progress are not equivalent'
      })
    }
  } catch (error) {
    mismatches.push({
      surface: 'guidedProgress',
      message: `legacy guided-progress reader cannot project canonically: ${error instanceof Error ? error.message : 'unknown error'}`
    })
  }

  const after = snapshot(storage)
  if (!sameValue(before, after)) {
    mismatches.push({ surface: 'storage', message: 'guided-state audit changed persisted WaseShibu state' })
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    legacyReviewProjection,
    guidedProgressProjection,
    canonicalShadow: shadow
  }
}
