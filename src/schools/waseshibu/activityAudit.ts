import type { CanonicalActivityRecord } from '../../engine/learnerState'
import { loadAttempts } from '../../storage'
import { projectWaseShibuAttemptActivity } from './activityCompatibility'
import { readWaseShibuCanonicalActivityShadow, type WaseShibuActivityShadowIssue } from './activityShadow'

const ATTEMPT_KEY = 'waseshibu-math-attempts'
const META_KEY = 'waseshibu-math-sync-meta'
const AUDITED_KEYS = [ATTEMPT_KEY, META_KEY] as const

export type WaseShibuActivityAuditMismatch = {
  surface: 'activityRecords' | 'storage' | 'shadow'
  message: string
}

export type WaseShibuActivityAuditReport = {
  ok: boolean
  mismatches: WaseShibuActivityAuditMismatch[]
  shadowIssues: WaseShibuActivityShadowIssue[]
  legacyProjection: CanonicalActivityRecord[]
  canonicalShadow: CanonicalActivityRecord[]
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

function storageSnapshot() {
  return Object.fromEntries(AUDITED_KEYS.map(key => [key, localStorage.getItem(key)])) as Record<(typeof AUDITED_KEYS)[number], string | null>
}

function sameRawSnapshot(
  left: Record<(typeof AUDITED_KEYS)[number], string | null>,
  right: Record<(typeof AUDITED_KEYS)[number], string | null>
) {
  return AUDITED_KEYS.every(key => left[key] === right[key])
}

/**
 * Compare the actual current `loadAttempts()` reader with the independent raw
 * activity shadow. This remains an audit-only path and performs zero writes.
 */
export function auditWaseShibuActivities(): WaseShibuActivityAuditReport {
  const before = storageSnapshot()
  const mismatches: WaseShibuActivityAuditMismatch[] = []
  const legacyProjection: CanonicalActivityRecord[] = []

  for (const attempt of loadAttempts()) {
    try {
      legacyProjection.push(projectWaseShibuAttemptActivity(attempt))
    } catch (error) {
      mismatches.push({
        surface: 'activityRecords',
        message: `legacy attempt cannot map canonically: ${attempt.questionId} (${error instanceof Error ? error.message : 'unknown error'})`
      })
    }
  }

  const shadow = readWaseShibuCanonicalActivityShadow(localStorage)
  if (!sameValue(legacyProjection, shadow.activityRecords)) {
    mismatches.push({ surface: 'activityRecords', message: 'active loadAttempts() projection and canonical activity shadow are not equivalent' })
  }

  for (const issue of shadow.issues) {
    mismatches.push({ surface: 'shadow', message: `${issue.key}: ${issue.message}` })
  }

  const after = storageSnapshot()
  if (!sameRawSnapshot(before, after)) {
    mismatches.push({ surface: 'storage', message: 'activity audit changed persisted WaseShibu state' })
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    shadowIssues: shadow.issues,
    legacyProjection,
    canonicalShadow: shadow.activityRecords
  }
}
