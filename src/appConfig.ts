import { WASESHIBU_APP_PROFILE } from './schools/waseshibu/appProfile'

/**
 * WaseShibu composition root.
 *
 * Shared engine modules must receive school configuration through their public
 * interfaces rather than importing this singleton. Existing app-shell modules
 * can migrate through this root without importing a school package directly.
 */
export const APP_PROFILE = WASESHIBU_APP_PROFILE

export const APP_EVENT_NAMES = {
  routeChange: `${APP_PROFILE.runtime.eventNamespace}-route-change`,
  writeBlocked: `${APP_PROFILE.runtime.eventNamespace}-write-blocked`,
  preferencesChange: `${APP_PROFILE.runtime.eventNamespace}-preferences-change`
} as const
