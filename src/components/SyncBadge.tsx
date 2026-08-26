import { useEffect, useState } from 'react'
import { loadGitHubSyncConfig, loadGitHubToken } from '../githubSync'
import { isSyncDirty, loadSyncMeta } from '../storage'

export default function SyncBadge() {
  const [,rerender]=useState(0)
  useEffect(()=>{
    const update=()=>rerender(v=>v+1)
    window.addEventListener('waseshibu-sync-dirty',update)
    window.addEventListener('waseshibu-sync-complete',update)
    window.addEventListener('storage',update)
    return ()=>{
      window.removeEventListener('waseshibu-sync-dirty',update)
      window.removeEventListener('waseshibu-sync-complete',update)
      window.removeEventListener('storage',update)
    }
  },[])

  const configured=!!loadGitHubSyncConfig()
  const hasToken=!!loadGitHubToken()
  const dirty=isSyncDirty()
  const last=loadSyncMeta().lastSyncAt

  const cls=!configured?'sync-off':!hasToken?'sync-auth':dirty?'sync-pending':'sync-ok'
  const text=!configured?'同期未設定':!hasToken?'再認証必要':dirty?'未同期あり':last?'同期済み':'同期待ち'

  return <a href="#/sync" className={`sync-badge ${cls}`} title={last?`最終同期 ${new Date(last).toLocaleString()}`:undefined}>
    <i />{text}
  </a>
}
