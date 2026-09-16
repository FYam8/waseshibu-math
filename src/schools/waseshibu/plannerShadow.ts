import type { CanonicalScheduledTaskPlan } from '../../engine/learnerState'
import { projectWaseShibuScheduledTaskPlan } from './plannerCompatibility'

export const WASESHIBU_DAILY_REQUIRED_PLAN_KEY = 'waseshibu-math-daily-required-plan-v2'
export const WASESHIBU_STUDY_AHEAD_PLAN_KEY = 'waseshibu-math-study-ahead-plan-v1'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuPlannerShadowIssue = {
  key: string
  message: string
}

export type WaseShibuPlannerShadow = {
  todayRequiredPlan: CanonicalScheduledTaskPlan | null
  studyAheadPlan: CanonicalScheduledTaskPlan | null
  issues: WaseShibuPlannerShadowIssue[]
}

function readOne(
  storage: ReadOnlyStorage,
  key: string,
  planKind: CanonicalScheduledTaskPlan['planKind'],
  issues: WaseShibuPlannerShadowIssue[]
) {
  const rawText = storage.getItem(key)
  if (rawText === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    issues.push({ key, message: 'invalid JSON in persisted scheduler plan' })
    return null
  }

  try {
    return projectWaseShibuScheduledTaskPlan(parsed, planKind)
  } catch (error) {
    issues.push({
      key,
      message: `scheduler plan cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}`
    })
    return null
  }
}

/**
 * Read both WaseShibu scheduler records without running reconciliation logic.
 *
 * This intentionally snapshots persisted policy state only. It never generates
 * tasks, promotes a study-ahead plan, changes a target, refills a queue or
 * writes any localStorage key.
 */
export function readWaseShibuCanonicalPlannerShadow(storage: ReadOnlyStorage): WaseShibuPlannerShadow {
  const issues: WaseShibuPlannerShadowIssue[] = []
  return {
    todayRequiredPlan: readOne(storage, WASESHIBU_DAILY_REQUIRED_PLAN_KEY, 'today-required', issues),
    studyAheadPlan: readOne(storage, WASESHIBU_STUDY_AHEAD_PLAN_KEY, 'study-ahead', issues),
    issues
  }
}
