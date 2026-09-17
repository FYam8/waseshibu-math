import type { CanonicalPreparationCheckState } from '../../engine/learnerState'
import { projectWaseShibuPrepRawState, WASESHIBU_PREP_KEY } from './prepCompatibility'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuPrepShadowIssue = {
  key: string
  message: string
}

export type WaseShibuPrepShadow = {
  preparationCheck: CanonicalPreparationCheckState | null
  issues: WaseShibuPrepShadowIssue[]
}

/**
 * Independent raw-storage reader for the persisted preparation check.
 * Absence remains null; no default record is invented in persisted state.
 */
export function readWaseShibuCanonicalPrepShadow(storage: ReadOnlyStorage): WaseShibuPrepShadow {
  const issues: WaseShibuPrepShadowIssue[] = []
  const rawText = storage.getItem(WASESHIBU_PREP_KEY)
  if (rawText === null) return { preparationCheck: null, issues }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    issues.push({ key: WASESHIBU_PREP_KEY, message: 'invalid JSON in persisted prep state' })
    return { preparationCheck: null, issues }
  }

  try {
    return { preparationCheck: projectWaseShibuPrepRawState(parsed), issues }
  } catch (error) {
    issues.push({
      key: WASESHIBU_PREP_KEY,
      message: `prep state cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}`
    })
    return { preparationCheck: null, issues }
  }
}
