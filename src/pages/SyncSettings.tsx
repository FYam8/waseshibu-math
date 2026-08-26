import { useState } from 'react'
import {
  clearGitHubSyncConfig, loadGitHubSyncConfig, loadGitHubToken,
  saveGitHubSyncConfig, saveGitHubToken, syncAll, testGitHubConnection,
  type GitHubSyncConfig
} from '../githubSync'
import { isSyncDirty, loadSyncMeta } from '../storage'

export default function SyncSettings() {
  const saved = loadGitHubSyncConfig()
  const initialToken = loadGitHubToken()
  const [owner,setOwner] = useState(saved?.owner || '')
  const [repo,setRepo] = useState(saved?.repo || 'waseshibu-math-sync')
  const [branch,setBranch] = useState(saved?.branch || 'main')
  const [token,setToken] = useState(initialToken)
  const [status,setStatus] = useState(saved && !initialToken ? 'トークン再入力が必要' : '未接続')
  const [busy,setBusy] = useState(false)
  const [lastSync,setLastSync] = useState(loadSyncMeta().lastSyncAt || '')

  const config = ():GitHubSyncConfig => ({
    owner:owner.trim(), repo:repo.trim(), branch:branch.trim() || 'main'
  })

  const persist = () => {
    if (!owner.trim() || !repo.trim() || !token.trim()) {
      throw new Error('GitHubユーザー名・リポジトリ名・トークンを入力してください。')
    }
    saveGitHubSyncConfig(config())
    saveGitHubToken(token.trim())
  }

  const test = async () => {
    setBusy(true)
    try {
      persist()
      await testGitHubConnection(config(),token.trim())
      setStatus('接続OK')
    } catch(e:any) {
      setStatus(`接続失敗：${e?.message || e}`)
    } finally { setBusy(false) }
  }

  const sync = async () => {
    setBusy(true)
    setStatus('同期中…')
    try {
      persist()
      const at = await syncAll(config(),token.trim())
      setLastSync(at)
      setStatus('同期済み')
    } catch(e:any) {
      setStatus(e?.message === 'offline' ? 'オフライン：端末内に保存済み' : `同期失敗：${e?.message || e}`)
    } finally { setBusy(false) }
  }

  const disconnect = () => {
    clearGitHubSyncConfig()
    setToken('')
    setStatus('未接続')
  }

  return (
    <>
      <div className="page-head">
        <div><span className="eyebrow">GITHUB ONLY SYNC</span><h1>端末間同期</h1></div>
      </div>

      <section className="card">
        <h2>Private Repository と同期</h2>
        <p>
          GitHub Pagesのアプリから、あなた専用のPrivate Repositoryへ学習履歴を保存します。
          SupabaseやFirebaseなどの外部サービスは使いません。
        </p>
        <div className="notice-box">
          <b>個人利用向け：</b> fine-grained personal access token は同期用Private Repositoryだけを対象にし、
          Repository permissions の <b>Contents: Read and write</b> のみに限定してください。
          PATは安全性を優先して、このブラウザセッション中だけ保持します。
        </div>

        <div className="sync-form">
          <label>GitHubユーザー名
            <input value={owner} onChange={e=>setOwner(e.target.value)} placeholder="your-github-name" autoComplete="username" />
          </label>
          <label>同期用Private Repository
            <input value={repo} onChange={e=>setRepo(e.target.value)} placeholder="waseshibu-math-sync" />
          </label>
          <label>ブランチ
            <input value={branch} onChange={e=>setBranch(e.target.value)} placeholder="main" />
          </label>
          <label>Fine-grained PAT（セッション内のみ）
            <input type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder="github_pat_..." autoComplete="off" />
          </label>
        </div>

        <div className="actions">
          <button className="button" disabled={busy} onClick={test}>接続テスト</button>
          <button className="button primary" disabled={busy} onClick={sync}>今すぐ同期</button>
          <button className="button danger" disabled={busy} onClick={disconnect}>接続情報を削除</button>
        </div>
      </section>

      <section className="grid three">
        <article className="card stat"><b className="stage-text">{status}</b><span>同期状態</span></article>
        <article className="card stat"><b>{isSyncDirty()?'あり':'なし'}</b><span>未同期変更</span></article>
        <article className="card stat"><b className="stage-text">{lastSync ? new Date(lastSync).toLocaleString() : '--'}</b><span>最終同期</span></article>
      </section>

      <section className="card">
        <h2>初回セットアップ</h2>
        <ol className="setup-list">
          <li>GitHubで <code>waseshibu-math-sync</code> などのPrivate Repositoryを作り、<b>READMEを追加して初期化</b>します。</li>
          <li>Fine-grained PATを作り、Repository accessをそのPrivate Repositoryだけに限定します。</li>
          <li>Repository permissionsは <code>Contents: Read and write</code> を設定します。</li>
          <li>上の欄にGitHubユーザー名・リポジトリ名・PATを入力して「接続テスト」。</li>
          <li>「今すぐ同期」を押すと、必要な <code>data/</code> ファイルが自動作成されます。</li>
          <li>別端末でも同じRepositoryを設定し、その端末のセッションでPATを入力して同期します。</li>
        </ol>
      </section>

      <section className="card">
        <h2>同期されるもの</h2>
        <p>今日の8問の進捗、正解・不正解・見送り、ミス分類、解答時間、過去問得点、目標点を同期します。</p>
        <p className="muted">アクセストークン、過去問PDF、学校の問題本文は同期データに書き込みません。</p>
      </section>
    </>
  )
}
