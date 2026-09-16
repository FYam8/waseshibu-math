import type { CanonicalDailyPracticeSession } from '../../engine/learnerState'
import { projectWaseShibuDailyPracticeState } from './dailyCompatibility'

const DAILY_KEY = 'waseshibu-math-daily'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuDailyShadowIssue = {
  key: string
  message: string
}

export type WaseShibuDailyShadow = {
  dailyPractice: CanonicalDailyPracticeSession | null
  issues: WaseShibuDailyShadowIssue[]
}

/**
 * Independent raw-storage reader for the legacy daily practice session.
 * It never writes, repairs or regenerates learner data.
 */
export function readWaseShibuCanonicalDailyShadow(storage: ReadOnlyStorage): WaseShibuDailyShadow {
  const issues: WaseShibuDailyShadowIssue[] = []
  const rawText = storage.getItem(DAILY_KEY)
  if (rawText === null) return { dailyPractice: null, issues }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    issues.push({ key: DAILY_KEY, message: 'invalid JSON in legacy daily practice state' })
    return { dailyPractice: null, issues }
  }

  try {
    return { dailyPractice: projectWaseShibuDailyPracticeState(parsed), issues }
  } catch (error) {
    issues.push({
      key: DAILY_KEY,
      message: `daily practice state cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}`
    })
    return { dailyPractice: null, issues }
  }
}
