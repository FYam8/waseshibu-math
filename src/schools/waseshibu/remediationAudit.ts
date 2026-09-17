import type { CanonicalRemediationProgress } from '../../engine/remediationContract'
import {
  LEGACY_REMEDIATION_PROGRESS_KEY,
  combineWaseShibuRemediationState,
  projectWaseShibuRemediationRecord
} from './remediationCompatibility'
import { readLegacyRemediationProgressForAudit } from './remediationLegacyReader'
import { readWaseShibuCanonicalRemediationShadow } from './remediationShadow'

type ReadOnlyStorage = Pick<Storage, 'getItem'>

export type WaseShibuRemediationAuditMismatch = {
  surface: 'remediation' | 'legacyReader' | 'storage' | 'shadow'
  message: string
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

function projectLegacyState(storage: ReadOnlyStorage) {
  const projected: Record<string, CanonicalRemediationProgress> = {}
  for (const [sourceProblemId, record] of Object.entries(readLegacyRemediationProgressForAudit(storage))) {
    const item = projectWaseShibuRemediationRecord(record)
    if (item.sourceProblemId !== sourceProblemId) {
      throw new Error(`legacy remediation map identity mismatch: ${sourceProblemId} / ${item.sourceProblemId}`)
    }
    projected[sourceProblemId] = item
  }
  return combineWaseShibuRemediationState(projected)
}

/** Read-only parity audit between today's remediation loader semantics and the canonical shadow. */
export function auditWaseShibuRemediationState(
  storage: ReadOnlyStorage = localStorage
) {
  const before = storage.getItem(LEGACY_REMEDIATION_PROGRESS_KEY)
  const mismatches: WaseShibuRemediationAuditMismatch[] = []
  const shadow = readWaseShibuCanonicalRemediationShadow(storage)

  for (const issue of shadow.issues) {
    mismatches.push({
      surface: 'shadow',
      message: `${issue.entryKey || issue.sourceProblemId || LEGACY_REMEDIATION_PROGRESS_KEY}: ${issue.message}`
    })
  }

  let legacyProjection = combineWaseShibuRemediationState({})
  try {
    legacyProjection = projectLegacyState(storage)
    if (!sameValue(legacyProjection, shadow.remediation)) {
      mismatches.push({
        surface: 'remediation',
        message: 'read-only legacy remediation projection and canonical shadow are not equivalent'
      })
    }
  } catch (error) {
    mismatches.push({
      surface: 'legacyReader',
      message: `legacy remediation reader cannot project canonically: ${error instanceof Error ? error.message : 'unknown error'}`
    })
  }

  const after = storage.getItem(LEGACY_REMEDIATION_PROGRESS_KEY)
  if (before !== after) {
    mismatches.push({ surface: 'storage', message: 'remediation audit changed persisted WaseShibu state' })
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    legacyProjection,
    canonicalShadow: shadow.remediation
  }
}
