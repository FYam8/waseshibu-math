import { assertExternalProgressSyncProfile } from '../../engine/externalSyncContract'

/**
 * WaseShibu owns every concrete sync identity below.
 * Rikkyo must provide a distinct profile even if sync mechanics are later shared.
 */
export const WASESHIBU_SYNC_PROFILE = assertExternalProgressSyncProfile({
  schoolId: 'waseshibu',
  localDatabaseName: 'waseshibu-progress-sync',
  localDatabaseVersion: 7,
  appId: 'math',
  apiEnvironmentKey: 'VITE_PROGRESS_API_BASE',
  browserApiOverrideKey: '__WASESHIBU_PROGRESS_API__',
  deploymentApiBase: 'https://waseshibu-progress-api.fyam8.workers.dev',
  transportKind: 'summary-events',
  projectionOwner: 'school'
})

export const WASESHIBU_SYNC_PROJECTION = {
  sourceRecordIds: ['state:summary', 'state:latest-exam'] as const,
  yearRange: { from: 2019, to: 2026 },
  targetIds: ['60', '70', '75'] as const,
  sendsRawAnswers: false,
  sendsProblemContent: false
}
