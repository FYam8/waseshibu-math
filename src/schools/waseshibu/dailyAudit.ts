import type { CanonicalDailyPracticeSession } from '../../engine/learnerState'
import { loadDaily } from '../../storage'
import { projectWaseShibuDailyPracticeState } from './dailyCompatibility'
import { readWaseShibuCanonicalDailyShadow, type WaseShibuDailyShadowIssue } from './dailyShadow'

const DAILY_KEY = 'waseshibu-math-daily'

export type WaseShibuDailyAuditMismatch = {
  surface: 'dailyPractice' | 'storage' | 'shadow'
  message: string
}

export type WaseShibuDailyAuditReport = {
  ok: boolean
  mismatches: WaseShibuDailyAuditMismatch[]
  shadowIssues: WaseShibuDailyShadowIssue[]
  legacyProjection: CanonicalDailyPracticeSession | null
  canonicalShadow: CanonicalDailyPracticeSession | null
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

/**
 * Compare the active `loadDaily()` reader with an independent raw-storage
 * canonical shadow. The audit is read-only and intentionally covers only the
 * legacy 8-question practice session, not required-task/study-ahead planners.
 */
export function auditWaseShibuDailyPractice(): WaseShibuDailyAuditReport {
  const before = localStorage.getItem(DAILY_KEY)
  const mismatches: WaseShibuDailyAuditMismatch[] = []

  let legacyProjection: CanonicalDailyPracticeSession | null = null
  try {
    legacyProjection = projectWaseShibuDailyPracticeState(loadDaily() as unknown)
  } catch (error) {
    mismatches.push({
      surface: 'dailyPractice',
      message: `active loadDaily() value cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}`
    })
  }

  const shadow = readWaseShibuCanonicalDailyShadow(localStorage)
  if (!sameValue(legacyProjection, shadow.dailyPractice)) {
    mismatches.push({
      surface: 'dailyPractice',
      message: 'active loadDaily() projection and canonical daily shadow are not equivalent'
    })
  }

  for (const issue of shadow.issues) {
    mismatches.push({ surface: 'shadow', message: `${issue.key}: ${issue.message}` })
  }

  const after = localStorage.getItem(DAILY_KEY)
  if (before !== after) {
    mismatches.push({ surface: 'storage', message: 'daily practice audit changed persisted WaseShibu state' })
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    shadowIssues: shadow.issues,
    legacyProjection,
    canonicalShadow: shadow.dailyPractice
  }
}
