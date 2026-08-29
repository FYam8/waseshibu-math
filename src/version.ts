export const APP_VERSION='0.12.1'
export const ACTIVE_APP_VERSION_KEY='waseshibu-math-active-app-version'
export const LAST_APP_VERSION_KEY='waseshibu-math-last-app-version'
export const SAFE_MODE_KEY='waseshibu-math-safe-mode-v1'

export function canWriteLearningData(storage:Pick<Storage,'getItem'>=localStorage){
  const active=storage.getItem(ACTIVE_APP_VERSION_KEY),safe=storage.getItem(SAFE_MODE_KEY)
  return !safe&&(!active||active===APP_VERSION)
}

export function notifyWriteBlocked(){
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('waseshibu-write-blocked'))
}
