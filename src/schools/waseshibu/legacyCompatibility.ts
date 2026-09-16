import type { CanonicalExamDefinition } from '../../engine/examContract'
import { WASESHIBU_APP_PROFILE } from './appProfile'

const SUPPORTED_YEARS = WASESHIBU_APP_PROFILE.supportedYears

export const WASESHIBU_EXAM_CATALOG: readonly CanonicalExamDefinition[] = SUPPORTED_YEARS.map(year => ({
  examId: `waseshibu-${year}`,
  year,
  label: `${year}年度`
}))

const examByYear = new Map(WASESHIBU_EXAM_CATALOG.map(exam => [exam.year, exam]))
const examById = new Map(WASESHIBU_EXAM_CATALOG.map(exam => [exam.examId, exam]))
const targetByLegacy = new Map(WASESHIBU_APP_PROFILE.targets.map(target => [String(target.legacyValue), target]))
const targetById = new Map(WASESHIBU_APP_PROFILE.targets.map(target => [target.id, target]))

/** Resolve a legacy WaseShibu year key without changing the public URL/state yet. */
export function examIdForLegacyYear(year: number): string {
  const exam = examByYear.get(year)
  if (!exam) throw new Error(`unsupported WaseShibu exam year: ${year}`)
  return exam.examId
}

/** Reverse mapping used by the WaseShibu compatibility layer only. */
export function legacyYearForExamId(examId: string): number {
  const exam = examById.get(examId)
  if (!exam) throw new Error(`unsupported WaseShibu examId: ${examId}`)
  return exam.year
}

/** Map persisted numeric 60/70/75 preferences to canonical opaque target IDs. */
export function targetIdForLegacyTarget(value: string | number): string {
  const target = targetByLegacy.get(String(value))
  if (!target) throw new Error(`unsupported WaseShibu legacy target: ${value}`)
  return target.id
}

/** Reverse mapping for compatibility writes while the legacy storage format remains active. */
export function legacyTargetForTargetId(targetId: string): string | number {
  const target = targetById.get(targetId)
  if (!target || target.legacyValue === undefined) throw new Error(`unsupported WaseShibu targetId: ${targetId}`)
  return target.legacyValue
}

/**
 * Convert a year-keyed WaseShibu record to examId keys without mutating the
 * source. Unknown keys fail closed so migration cannot silently discard state.
 */
export function mapLegacyYearKeyedRecord<T>(source: Record<string, T>): Record<string, T> {
  const result: Record<string, T> = {}
  for (const [legacyKey, value] of Object.entries(source)) {
    const year = Number(legacyKey)
    if (!Number.isInteger(year) || String(year) !== legacyKey) throw new Error(`invalid legacy year key: ${legacyKey}`)
    const examId = examIdForLegacyYear(year)
    if (Object.prototype.hasOwnProperty.call(result, examId)) throw new Error(`duplicate canonical examId: ${examId}`)
    result[examId] = value
  }
  return result
}

/**
 * Convert legacy completedCoreByTarget {"70":[2024,...]} into canonical
 * targetId -> examId[] shape. This helper is pure; persistence writes happen
 * only in a later tested migration step.
 */
export function mapLegacyCompletionByTarget(source: Record<string, unknown>): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [legacyTarget, rawYears] of Object.entries(source)) {
    const targetId = targetIdForLegacyTarget(legacyTarget)
    if (!Array.isArray(rawYears)) throw new Error(`invalid completion list for target ${legacyTarget}`)
    const examIds = rawYears.map(year => {
      if (!Number.isInteger(year)) throw new Error(`invalid completion year for target ${legacyTarget}`)
      return examIdForLegacyYear(Number(year))
    })
    result[targetId] = [...new Set(examIds)]
  }
  return result
}
