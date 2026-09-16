import type { TargetScore } from '../../targetStrategy'

export const LEGACY_DAILY_REQUIRED_PLAN_KEY = 'waseshibu-math-daily-required-plan-v2'
export const LEGACY_STUDY_AHEAD_PLAN_KEY = 'waseshibu-math-study-ahead-plan-v1'

export type LegacyPlannerTask = {
  id: string
  kind: 'review' | 'practice' | 'past-paper'
  title: string
  detail: string
  to: string
  priority: number
  questionId?: string
  grade?: 'A' | 'B' | 'C'
}

export type LegacyDailyRequiredPlan = {
  date: string
  target: TargetScore
  pendingIds: string[]
  completedIds: string[]
  fallbackTask?: LegacyPlannerTask
  queueVersion?: number
}

export type LegacyStudyAheadPlan = LegacyDailyRequiredPlan

type ReadOnlyStorage = Pick<Storage, 'getItem'>

/**
 * Read-only mirror of the private `loadDailyRequiredPlan(date, target)` logic
 * in `dailyPlan.ts`.
 *
 * It intentionally preserves the current forgiving runtime semantics: invalid
 * JSON, wrong-date records or malformed pending/completed arrays are treated as
 * an empty ephemeral plan for the requested date/target. It never writes or
 * reconciles the persisted scheduler record.
 */
export function readLegacyDailyRequiredPlanForAudit(
  storage: ReadOnlyStorage,
  date: string,
  target: TargetScore
): LegacyDailyRequiredPlan {
  try {
    const parsed = JSON.parse(storage.getItem(LEGACY_DAILY_REQUIRED_PLAN_KEY) || 'null') as LegacyDailyRequiredPlan | null
    if (parsed && parsed.date === date && Array.isArray(parsed.pendingIds) && Array.isArray(parsed.completedIds)) {
      return {
        ...parsed,
        target: parsed.target === 60 || parsed.target === 70 || parsed.target === 75
          ? parsed.target
          : target
      }
    }
  } catch {
    // Match the current runtime reader: regenerate an empty in-memory plan.
  }
  return { date, target, pendingIds: [], completedIds: [] }
}

/**
 * Read-only mirror of the private `loadStudyAheadPlan()` logic in
 * `dailyPlan.ts`. Invalid JSON/shapes become null exactly as they do today.
 * This function performs no promotion, refill, reconciliation or write.
 */
export function readLegacyStudyAheadPlanForAudit(
  storage: ReadOnlyStorage
): LegacyStudyAheadPlan | null {
  try {
    const parsed = JSON.parse(storage.getItem(LEGACY_STUDY_AHEAD_PLAN_KEY) || 'null') as LegacyStudyAheadPlan | null
    if (
      parsed &&
      typeof parsed.date === 'string' &&
      Array.isArray(parsed.pendingIds) &&
      Array.isArray(parsed.completedIds)
    ) return parsed
  } catch {
    // Match the current runtime reader: broken optional study-ahead is ignored.
  }
  return null
}
