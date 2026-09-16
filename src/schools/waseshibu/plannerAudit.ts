import type { CanonicalScheduledTaskPlan } from '../../engine/learnerState'
import type { TargetScore } from '../../targetStrategy'
import { legacyTargetForTargetId } from './legacyCompatibility'
import { projectWaseShibuScheduledTaskPlan } from './plannerCompatibility'
import {
  LEGACY_DAILY_REQUIRED_PLAN_KEY,
  LEGACY_STUDY_AHEAD_PLAN_KEY,
  readLegacyDailyRequiredPlanForAudit,
  readLegacyStudyAheadPlanForAudit
} from './plannerLegacyReader'
import { readWaseShibuCanonicalPlannerShadow, type WaseShibuPlannerShadow } from './plannerShadow'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuPlannerAuditMismatch = {
  surface: 'todayRequiredPlan' | 'studyAheadPlan' | 'storage' | 'shadow'
  message: string
}

export type WaseShibuPlannerAuditReport = {
  ok: boolean
  mismatches: WaseShibuPlannerAuditMismatch[]
  legacyTodayProjection: CanonicalScheduledTaskPlan | null
  legacyStudyAheadProjection: CanonicalScheduledTaskPlan | null
  canonicalShadow: WaseShibuPlannerShadow
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
    [LEGACY_DAILY_REQUIRED_PLAN_KEY]: storage.getItem(LEGACY_DAILY_REQUIRED_PLAN_KEY),
    [LEGACY_STUDY_AHEAD_PLAN_KEY]: storage.getItem(LEGACY_STUDY_AHEAD_PLAN_KEY)
  }
}

function targetScoreForTargetId(targetId: string): TargetScore {
  const value = legacyTargetForTargetId(targetId)
  if (value === 60 || value === 70 || value === 75) return value
  throw new Error(`targetId does not resolve to the current WaseShibu TargetScore: ${targetId}`)
}

/**
 * Read-only parity audit for persisted WaseShibu scheduler plans.
 *
 * The legacy side mirrors the private reader semantics only; it never invokes
 * reconciliation APIs because those can freeze/refill/promote plans and write
 * localStorage. The canonical side reads the exact raw persisted bytes through
 * `plannerShadow.ts`. Valid persisted plans must project identically.
 *
 * Corrupt/unsupported data still fails closed through shadow issues even when
 * the forgiving legacy reader would regenerate/ignore it at runtime.
 */
export function auditWaseShibuPlannerReaderParity(
  storage: ReadOnlyStorage = localStorage
): WaseShibuPlannerAuditReport {
  const before = snapshot(storage)
  const mismatches: WaseShibuPlannerAuditMismatch[] = []
  const shadow = readWaseShibuCanonicalPlannerShadow(storage)

  for (const issue of shadow.issues) {
    mismatches.push({ surface: 'shadow', message: `${issue.key}: ${issue.message}` })
  }

  let legacyTodayProjection: CanonicalScheduledTaskPlan | null = null
  const rawTodayExists = before[LEGACY_DAILY_REQUIRED_PLAN_KEY] !== null
  if (rawTodayExists && shadow.todayRequiredPlan) {
    try {
      const target = targetScoreForTargetId(shadow.todayRequiredPlan.targetId)
      const legacy = readLegacyDailyRequiredPlanForAudit(storage, shadow.todayRequiredPlan.date, target)
      legacyTodayProjection = projectWaseShibuScheduledTaskPlan(legacy, 'today-required')
      if (!sameValue(legacyTodayProjection, shadow.todayRequiredPlan)) {
        mismatches.push({
          surface: 'todayRequiredPlan',
          message: 'read-only legacy today-plan projection and canonical raw shadow are not equivalent'
        })
      }
    } catch (error) {
      mismatches.push({
        surface: 'todayRequiredPlan',
        message: `legacy today-plan reader cannot project canonically: ${error instanceof Error ? error.message : 'unknown error'}`
      })
    }
  } else if (rawTodayExists && !shadow.todayRequiredPlan && !shadow.issues.some(issue => issue.key === LEGACY_DAILY_REQUIRED_PLAN_KEY)) {
    mismatches.push({
      surface: 'todayRequiredPlan',
      message: 'persisted today-plan exists but canonical shadow produced no plan'
    })
  }

  let legacyStudyAheadProjection: CanonicalScheduledTaskPlan | null = null
  const rawAheadExists = before[LEGACY_STUDY_AHEAD_PLAN_KEY] !== null
  if (rawAheadExists && shadow.studyAheadPlan) {
    try {
      const legacy = readLegacyStudyAheadPlanForAudit(storage)
      if (!legacy) {
        mismatches.push({
          surface: 'studyAheadPlan',
          message: 'canonical shadow accepted study-ahead state that the legacy reader ignores'
        })
      } else {
        legacyStudyAheadProjection = projectWaseShibuScheduledTaskPlan(legacy, 'study-ahead')
        if (!sameValue(legacyStudyAheadProjection, shadow.studyAheadPlan)) {
          mismatches.push({
            surface: 'studyAheadPlan',
            message: 'read-only legacy study-ahead projection and canonical raw shadow are not equivalent'
          })
        }
      }
    } catch (error) {
      mismatches.push({
        surface: 'studyAheadPlan',
        message: `legacy study-ahead reader cannot project canonically: ${error instanceof Error ? error.message : 'unknown error'}`
      })
    }
  } else if (rawAheadExists && !shadow.studyAheadPlan && !shadow.issues.some(issue => issue.key === LEGACY_STUDY_AHEAD_PLAN_KEY)) {
    mismatches.push({
      surface: 'studyAheadPlan',
      message: 'persisted study-ahead plan exists but canonical shadow produced no plan'
    })
  }

  const after = snapshot(storage)
  if (!sameValue(before, after)) {
    mismatches.push({ surface: 'storage', message: 'planner reader parity audit changed persisted scheduler state' })
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    legacyTodayProjection,
    legacyStudyAheadProjection,
    canonicalShadow: shadow
  }
}
