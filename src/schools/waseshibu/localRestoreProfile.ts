import { BACKUP_KEYS } from '../../dataBackup'
import { LEGACY_DRAFT_KEY } from '../../dataMigration'
import type { LocalRestoreProfile } from '../../engine/localRestoreContract'

export const WASESHIBU_DEVICE_ID_KEY = 'waseshibu-math-device-id'
export const WASESHIBU_SYNC_META_KEY = 'waseshibu-math-sync-meta'

export const WASESHIBU_LOCAL_RESTORE_KEYS = [
  ...BACKUP_KEYS,
  LEGACY_DRAFT_KEY,
  WASESHIBU_DEVICE_ID_KEY,
  WASESHIBU_SYNC_META_KEY
] as const

export type WaseShibuLocalRestoreKey = typeof WASESHIBU_LOCAL_RESTORE_KEYS[number]

export const WASESHIBU_LOCAL_RESTORE_PROFILE: LocalRestoreProfile<WaseShibuLocalRestoreKey> = {
  profileId: 'waseshibu-math-local-restore',
  schemaVersion: 1,
  keys: WASESHIBU_LOCAL_RESTORE_KEYS,
  portableExcludedKeys: [WASESHIBU_DEVICE_ID_KEY, WASESHIBU_SYNC_META_KEY]
}
