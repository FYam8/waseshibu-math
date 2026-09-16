import type {
  CanonicalScheduledTaskPlan,
  CanonicalScheduledTaskReference
} from '../../engine/learnerState'
import { targetIdForLegacyTarget } from './legacyCompatibility'

const PLAN_KEYS = new Set([
  'date',
  'target',
  'pendingIds',
  'completedIds',
  'fallbackTask',
  'queueVersion'
])

const FALLBACK_TASK_KEYS = new Set([
  'id',
  'kind',
  'title',
  'detail',
  'to',
  'priority',
  'questionId',
  'grade'
])

type PlannerKind = CanonicalScheduledTaskPlan['planKind']

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new Error(`${field} must be a string array`)
  }
  return [...value]
}

function finiteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`)
  }
  return value
}

function projectFallbackTask(value: unknown): CanonicalScheduledTaskReference {
  const raw = asRecord(value)
  if (!raw) throw new Error('fallbackTask must be an object')

  const unknown = Object.keys(raw).filter(key => !FALLBACK_TASK_KEYS.has(key))
  if (unknown.length) throw new Error(`fallbackTask has unsupported fields: ${unknown.join(', ')}`)

  if (typeof raw.id !== 'string') throw new Error('fallbackTask.id must be a string')
  if (raw.kind !== 'review' && raw.kind !== 'practice' && raw.kind !== 'past-paper') {
    throw new Error('fallbackTask.kind is outside the current WaseShibu task contract')
  }
  if (typeof raw.title !== 'string') throw new Error('fallbackTask.title must be a string')
  if (typeof raw.detail !== 'string') throw new Error('fallbackTask.detail must be a string')
  if (typeof raw.to !== 'string') throw new Error('fallbackTask.to must be a string')
  const priority = finiteNumber(raw.priority, 'fallbackTask.priority')

  if (raw.questionId !== undefined && typeof raw.questionId !== 'string') {
    throw new Error('fallbackTask.questionId must be a string when present')
  }
  if (raw.grade !== undefined && raw.grade !== 'A' && raw.grade !== 'B' && raw.grade !== 'C') {
    throw new Error('fallbackTask.grade must be A/B/C when present')
  }

  const schoolEvidence: Record<string, unknown> = {
    legacyKind: raw.kind,
    title: raw.title,
    detail: raw.detail,
    legacyRoute: raw.to,
    priority
  }
  if (raw.grade !== undefined) schoolEvidence.grade = raw.grade

  return {
    taskId: raw.id,
    problemId: typeof raw.questionId === 'string' ? raw.questionId : undefined,
    schoolEvidence
  }
}

/**
 * Strict, pure projection of a persisted WaseShibu scheduler plan.
 *
 * This preserves task IDs as opaque identities. WaseShibu route strings,
 * labels, priorities and queue-version details stay school-owned evidence and
 * are not promoted into universal engine semantics.
 */
export function projectWaseShibuScheduledTaskPlan(
  value: unknown,
  planKind: PlannerKind
): CanonicalScheduledTaskPlan | null {
  if (value === null || value === undefined) return null
  const raw = asRecord(value)
  if (!raw) throw new Error('scheduled task plan must be an object or null')

  const unknown = Object.keys(raw).filter(key => !PLAN_KEYS.has(key))
  if (unknown.length) throw new Error(`scheduled task plan has unsupported fields: ${unknown.join(', ')}`)

  if (typeof raw.date !== 'string' || !raw.date) throw new Error('plan date must be a non-empty string')
  const targetId = targetIdForLegacyTarget(String(raw.target))
  const pendingTaskIds = stringArray(raw.pendingIds, 'pendingIds')
  const completedTaskIds = stringArray(raw.completedIds, 'completedIds')

  let fallbackTask: CanonicalScheduledTaskReference | undefined
  if (raw.fallbackTask !== undefined) fallbackTask = projectFallbackTask(raw.fallbackTask)

  const schoolEvidence: Record<string, unknown> = {}
  if (raw.queueVersion !== undefined) {
    if (!Number.isInteger(raw.queueVersion)) throw new Error('queueVersion must be an integer when present')
    schoolEvidence.legacyQueueVersion = raw.queueVersion
  }

  return {
    planKind,
    date: raw.date,
    targetId,
    pendingTaskIds,
    completedTaskIds,
    fallbackTask,
    schoolEvidence: Object.keys(schoolEvidence).length ? schoolEvidence : undefined
  }
}
