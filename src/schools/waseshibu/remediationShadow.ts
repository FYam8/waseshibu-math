import type {
  CanonicalRemediationProgress,
  CanonicalRemediationState
} from '../../engine/remediationContract'
import {
  LEGACY_REMEDIATION_PROGRESS_KEY,
  combineWaseShibuRemediationState,
  normalizeWaseShibuRemediationRecord,
  projectWaseShibuRemediationRecord
} from './remediationCompatibility'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuRemediationShadowIssue = {
  key: typeof LEGACY_REMEDIATION_PROGRESS_KEY
  entryKey?: string
  sourceProblemId?: string
  message: string
}

export type WaseShibuRemediationShadow = {
  remediation: CanonicalRemediationState
  present: boolean
  issues: WaseShibuRemediationShadowIssue[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Strict migration shadow for WaseShibu remediation progress.
 *
 * Effective values reproduce today's runtime normalization, while raw entries
 * that runtime would silently drop or collapse are reported as migration
 * blockers. No persisted value is written, deleted, renamed or repaired.
 */
export function readWaseShibuCanonicalRemediationShadow(
  storage: ReadOnlyStorage = localStorage
): WaseShibuRemediationShadow {
  const issues: WaseShibuRemediationShadowIssue[] = []
  const rawText = storage.getItem(LEGACY_REMEDIATION_PROGRESS_KEY)
  if (rawText === null) {
    return { remediation: combineWaseShibuRemediationState({}), present: false, issues }
  }

  let raw: unknown
  try {
    raw = JSON.parse(rawText)
  } catch {
    issues.push({ key: LEGACY_REMEDIATION_PROGRESS_KEY, message: 'persisted remediation state is not valid JSON' })
    return { remediation: combineWaseShibuRemediationState({}), present: true, issues }
  }
  if (!isObject(raw)) {
    issues.push({ key: LEGACY_REMEDIATION_PROGRESS_KEY, message: 'persisted remediation state must be a JSON object' })
    return { remediation: combineWaseShibuRemediationState({}), present: true, issues }
  }

  const progressBySourceProblemId: Record<string, CanonicalRemediationProgress> = {}
  for (const [entryKey, value] of Object.entries(raw)) {
    if (!isObject(value)) {
      issues.push({
        key: LEGACY_REMEDIATION_PROGRESS_KEY,
        entryKey,
        message: 'runtime reader would silently drop a non-object remediation entry'
      })
      continue
    }
    try {
      const normalized = normalizeWaseShibuRemediationRecord(entryKey, value)
      const projected = projectWaseShibuRemediationRecord(normalized)
      if (Object.prototype.hasOwnProperty.call(progressBySourceProblemId, projected.sourceProblemId)) {
        issues.push({
          key: LEGACY_REMEDIATION_PROGRESS_KEY,
          entryKey,
          sourceProblemId: projected.sourceProblemId,
          message: 'multiple persisted entries normalize to the same source problem; runtime last-write overwrite needs an explicit no-loss migration policy'
        })
      }
      progressBySourceProblemId[projected.sourceProblemId] = projected
    } catch (error) {
      issues.push({
        key: LEGACY_REMEDIATION_PROGRESS_KEY,
        entryKey,
        message: error instanceof Error ? error.message : 'remediation record cannot map canonically'
      })
    }
  }

  return {
    remediation: combineWaseShibuRemediationState(progressBySourceProblemId),
    present: true,
    issues
  }
}
