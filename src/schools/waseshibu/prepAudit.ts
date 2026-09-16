import type { CanonicalPreparationCheckState } from '../../engine/learnerState'
import { loadPrepState } from '../../preflight'
import { projectWaseShibuPrepRuntimeState, WASESHIBU_PREP_KEY } from './prepCompatibility'
import { readWaseShibuCanonicalPrepShadow, type WaseShibuPrepShadowIssue } from './prepShadow'

export type WaseShibuPrepAuditMismatch = {
  surface: 'preparationCheck' | 'storage' | 'shadow'
  message: string
}

export type WaseShibuPrepAuditReport = {
  ok: boolean
  mismatches: WaseShibuPrepAuditMismatch[]
  shadowIssues: WaseShibuPrepShadowIssue[]
  legacyProjection: CanonicalPreparationCheckState | null
  canonicalShadow: CanonicalPreparationCheckState | null
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
 * Compare the active `loadPrepState()` reader against an independent strict
 * raw-storage projection. The audit is read-only.
 *
 * When the key is absent, the runtime's ephemeral default state is deliberately
 * not treated as persisted canonical data; absence remains null.
 */
export function auditWaseShibuPrepState(): WaseShibuPrepAuditReport {
  const before = localStorage.getItem(WASESHIBU_PREP_KEY)
  const mismatches: WaseShibuPrepAuditMismatch[] = []
  const shadow = readWaseShibuCanonicalPrepShadow(localStorage)

  let legacyProjection: CanonicalPreparationCheckState | null = null
  if (before !== null) {
    try {
      legacyProjection = projectWaseShibuPrepRuntimeState(loadPrepState() as unknown)
    } catch (error) {
      mismatches.push({
        surface: 'preparationCheck',
        message: `active loadPrepState() value cannot map canonically: ${error instanceof Error ? error.message : 'unknown error'}`
      })
    }

    if (legacyProjection && shadow.preparationCheck && !sameValue(legacyProjection, shadow.preparationCheck)) {
      mismatches.push({
        surface: 'preparationCheck',
        message: 'active prep reader projection and canonical raw shadow are not equivalent'
      })
    }
    if (legacyProjection && !shadow.preparationCheck && shadow.issues.length === 0) {
      mismatches.push({
        surface: 'preparationCheck',
        message: 'persisted prep state exists but canonical shadow produced no state'
      })
    }
  }

  for (const issue of shadow.issues) {
    mismatches.push({ surface: 'shadow', message: `${issue.key}: ${issue.message}` })
  }

  const after = localStorage.getItem(WASESHIBU_PREP_KEY)
  if (before !== after) {
    mismatches.push({ surface: 'storage', message: 'prep audit changed persisted WaseShibu state' })
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    shadowIssues: shadow.issues,
    legacyProjection,
    canonicalShadow: shadow.preparationCheck
  }
}
