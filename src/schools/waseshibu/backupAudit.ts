import type { BackupKey, BackupPackage } from '../../dataBackup'

export const WASESHIBU_PORTABLE_BACKUP_EXCLUDED_RUNTIME_KEYS = [
  'waseshibu-math-device-id',
  'waseshibu-math-sync-meta'
] as const

export type WaseShibuBackupAuditIssue = {
  surface: string
  code:
    | 'runtime-key-leak'
    | 'missing-device-provenance'
    | 'missing-reset-epoch'
    | 'duplicate-record-id'
    | 'merge-record-conflict'
    | 'merge-map-conflict'
    | 'merge-replace-conflict'
    | 'level2-merge-loss-risk'
  message: string
}

export type WaseShibuBackupAuditResult = {
  ready: boolean
  issues: WaseShibuBackupAuditIssue[]
}

const ATTEMPTS_KEY: BackupKey = 'waseshibu-math-attempts'
const SCORES_KEY: BackupKey = 'waseshibu-math-exam-scores'
const LEVEL2_KEY: BackupKey = 'waseshibu-math-level2-history-v1'

const SHALLOW_MAP_KEYS: BackupKey[] = [
  'waseshibu-math-exam-drafts-v2',
  'waseshibu-math-daily-required-plan-v2',
  'waseshibu-math-study-ahead-plan-v1',
  'waseshibu-math-guided-review-v1',
  'waseshibu-math-guided-progress-v2',
  'waseshibu-math-remediation-progress-v1'
]

const REPLACE_KEYS: BackupKey[] = [
  'waseshibu-math-preferences',
  'waseshibu-math-daily',
  'waseshibu-math-prep-check-v1'
]

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
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

function nonNegativeInteger(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0
}

function auditPortableRecordArray(
  key: typeof ATTEMPTS_KEY | typeof SCORES_KEY,
  value: unknown,
  issues: WaseShibuBackupAuditIssue[]
) {
  if (!Array.isArray(value)) return
  const ids = new Set<string>()
  value.forEach((entry, index) => {
    if (!isObject(entry)) return
    const id = typeof entry.id === 'string' ? entry.id : ''
    if (id) {
      if (ids.has(id)) {
        issues.push({
          surface: `${key}[${index}]`,
          code: 'duplicate-record-id',
          message: `duplicate portable record id requires an explicit no-loss policy: ${id}`
        })
      }
      ids.add(id)
    }
    if (typeof entry.deviceId !== 'string' || entry.deviceId.length === 0) {
      issues.push({
        surface: `${key}[${index}]`,
        code: 'missing-device-provenance',
        message: 'portable record depends on a deviceId fallback that is intentionally excluded from the backup package'
      })
    }
    if (!nonNegativeInteger(entry.resetVersion)) {
      issues.push({
        surface: `${key}[${index}]`,
        code: 'missing-reset-epoch',
        message: 'portable record depends on the local sync reset epoch, which is intentionally excluded from the backup package'
      })
    }
  })
}

/**
 * Audit whether a current WaseShibu backup is self-contained as portable learner
 * data without copying local runtime identity/tombstone state across devices.
 *
 * `deviceId` on individual records is provenance and may travel. The current
 * device identity key and sync-meta/tombstone container must not travel.
 */
export function auditWaseShibuPortableBackup(pkg: BackupPackage): WaseShibuBackupAuditResult {
  const issues: WaseShibuBackupAuditIssue[] = []
  const data = pkg.data as Record<string, unknown>

  for (const key of WASESHIBU_PORTABLE_BACKUP_EXCLUDED_RUNTIME_KEYS) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      issues.push({
        surface: key,
        code: 'runtime-key-leak',
        message: 'school-local runtime identity/sync metadata must not be transported in a portable learner backup'
      })
    }
  }

  auditPortableRecordArray(ATTEMPTS_KEY, pkg.data[ATTEMPTS_KEY], issues)
  auditPortableRecordArray(SCORES_KEY, pkg.data[SCORES_KEY], issues)

  return { ready: issues.length === 0, issues }
}

function indexById(value: unknown, idField: string) {
  const result = new Map<string, Record<string, unknown>>()
  if (!Array.isArray(value)) return result
  for (const entry of value) {
    if (!isObject(entry) || typeof entry[idField] !== 'string' || entry[idField] === '') continue
    result.set(String(entry[idField]), entry)
  }
  return result
}

function auditIdentityConflicts(
  surface: string,
  local: unknown,
  incoming: unknown,
  idField: string,
  issues: WaseShibuBackupAuditIssue[]
) {
  const left = indexById(local, idField)
  const right = indexById(incoming, idField)
  for (const [id, next] of right) {
    const previous = left.get(id)
    if (previous && !sameValue(previous, next)) {
      issues.push({
        surface: `${surface}:${id}`,
        code: 'merge-record-conflict',
        message: `current merge keeps only one differing record with identity ${id}`
      })
    }
  }
}

function auditMapConflicts(
  key: string,
  local: unknown,
  incoming: unknown,
  issues: WaseShibuBackupAuditIssue[]
) {
  if (!isObject(local) || !isObject(incoming)) return
  for (const [childKey, next] of Object.entries(incoming)) {
    if (Object.prototype.hasOwnProperty.call(local, childKey) && !sameValue(local[childKey], next)) {
      issues.push({
        surface: `${key}.${childKey}`,
        code: 'merge-map-conflict',
        message: 'current shallow merge overwrites a differing local entry with the incoming entry'
      })
    }
  }
}

function level2MasteryIdentity(value: Record<string, unknown>) {
  const questionIds = Array.isArray(value.questionIds) ? value.questionIds.join(',') : ''
  return `${String(value.fieldId || '')}|${String(value.achievedAt || '')}|${questionIds}`
}

function auditLevel2Merge(
  local: unknown,
  incoming: unknown,
  issues: WaseShibuBackupAuditIssue[]
) {
  if (!isObject(local) || !isObject(incoming)) return
  auditIdentityConflicts(`${LEVEL2_KEY}.attempts`, local.attempts, incoming.attempts, 'attemptId', issues)
  auditMapConflicts(`${LEVEL2_KEY}.sessions`, local.sessions, incoming.sessions, issues)

  const leftEvents = new Map<string, Record<string, unknown>>()
  if (Array.isArray(local.masteryEvents)) {
    for (const event of local.masteryEvents) if (isObject(event)) leftEvents.set(level2MasteryIdentity(event), event)
  }
  if (Array.isArray(incoming.masteryEvents)) {
    for (const event of incoming.masteryEvents) {
      if (!isObject(event)) continue
      const identity = level2MasteryIdentity(event)
      const previous = leftEvents.get(identity)
      if (previous && !sameValue(previous, event)) {
        issues.push({
          surface: `${LEVEL2_KEY}.masteryEvents:${identity}`,
          code: 'merge-record-conflict',
          message: 'current Level2 merge deduplicates mastery events by a reduced identity and drops differing evidence'
        })
      }
    }
  }

  const localStats = isObject(local.questionStats) ? local.questionStats : {}
  const incomingStats = isObject(incoming.questionStats) ? incoming.questionStats : {}
  if (Object.keys(localStats).length > 0 || Object.keys(incomingStats).length > 0) {
    issues.push({
      surface: `${LEVEL2_KEY}.questionStats`,
      code: 'level2-merge-loss-risk',
      message: 'current Level2 merge regenerates questionStats from attempts; aggregate-only or additive stats evidence is not preserved automatically'
    })
  }

  for (const record of [local, incoming]) {
    const unknown = Object.keys(record).filter(key => !['schemaVersion', 'attempts', 'questionStats', 'sessions', 'masteryEvents'].includes(key))
    if (unknown.length) {
      issues.push({
        surface: LEVEL2_KEY,
        code: 'level2-merge-loss-risk',
        message: `current Level2 merge discards root fields: ${unknown.join(', ')}`
      })
    }
  }
}

function auditRouteMerge(
  local: unknown,
  incoming: unknown,
  issues: WaseShibuBackupAuditIssue[]
) {
  if (!isObject(local) || !isObject(incoming)) return
  auditMapConflicts('waseshibu-math-learning-route-v1.reinforcement', local.reinforcement, incoming.reinforcement, issues)
  for (const key of Object.keys(incoming)) {
    if (['solvedYears', 'usedOldQuestionIds', 'reinforcement', 'completedCoreByTarget', 'updatedAt'].includes(key)) continue
    if (Object.prototype.hasOwnProperty.call(local, key) && !sameValue(local[key], incoming[key])) {
      issues.push({
        surface: `waseshibu-math-learning-route-v1.${key}`,
        code: 'merge-map-conflict',
        message: 'current route merge overwrites a differing local field with incoming data'
      })
    }
  }
}

/**
 * Detect existing merge cases where the current incoming-wins / shallow merge
 * rules are not demonstrably lossless. This does not change `restoreBackup()`;
 * it is a cutover gate for a future canonical backup/import implementation.
 */
export function auditWaseShibuBackupMerge(
  local: BackupPackage,
  incoming: BackupPackage
): WaseShibuBackupAuditResult {
  const issues: WaseShibuBackupAuditIssue[] = []

  auditIdentityConflicts(ATTEMPTS_KEY, local.data[ATTEMPTS_KEY], incoming.data[ATTEMPTS_KEY], 'id', issues)
  auditIdentityConflicts(SCORES_KEY, local.data[SCORES_KEY], incoming.data[SCORES_KEY], 'id', issues)

  for (const key of SHALLOW_MAP_KEYS) {
    auditMapConflicts(key, local.data[key], incoming.data[key], issues)
  }
  for (const key of REPLACE_KEYS) {
    if (key in local.data && key in incoming.data && !sameValue(local.data[key], incoming.data[key])) {
      issues.push({
        surface: key,
        code: 'merge-replace-conflict',
        message: 'current merge mode replaces the local value for this surface rather than combining both values'
      })
    }
  }

  auditRouteMerge(local.data['waseshibu-math-learning-route-v1'], incoming.data['waseshibu-math-learning-route-v1'], issues)
  auditLevel2Merge(local.data[LEVEL2_KEY], incoming.data[LEVEL2_KEY], issues)

  return { ready: issues.length === 0, issues }
}
