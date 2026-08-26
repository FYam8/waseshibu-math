import type { Attempt, ExamScore } from './types'
import {
  clearSyncDirtyIfUnchanged, getDeviceId, getSyncDirtyRevision,
  loadAttempts, loadDaily, loadExamScores, loadPreferences, loadSyncMeta,
  replaceAttempts, replaceExamScores, saveDaily, savePreferences,
  saveSyncMeta, type DailyState
} from './storage'

const CONFIG_KEY = 'waseshibu-github-sync-config'
const TOKEN_SESSION_KEY = 'waseshibu-github-token-session'
const LEGACY_TOKEN_LOCAL_KEY = 'waseshibu-github-token-local'

export type GitHubSyncConfig = {
  owner: string
  repo: string
  branch: string
}

export type RemoteProfile = {
  schemaVersion: 1
  deviceLastSeen: Record<string,string>
  preferences: ReturnType<typeof loadPreferences>
  resetVersions: {
    attempts: number
    examScores: number
  }
  updatedAt: string
}

type RemoteAttemptsFile = {
  schemaVersion: 1
  month: string
  attempts: Attempt[]
}

type RemoteExamFile = {
  schemaVersion: 1
  scores: ExamScore[]
}

type RemoteDailyFile = {
  schemaVersion: 1
  month: string
  days: Record<string, DailyState>
}

function base64EncodeUtf8(text:string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary)
}

function base64DecodeUtf8(base64:string) {
  const binary = atob(base64.replace(/\n/g,''))
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function apiUrl(config:GitHubSyncConfig, path:string) {
  return `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}`
}

function headers(token:string) {
  // Browser CORS対応:
  // GitHubのCORS preflightで許可されるAuthorization等だけを送る。
  // X-GitHub-Api-Version はブラウザCORSで許可ヘッダーに含まれないため付けない。
  // ヘッダー省略時はGitHubがサポート中の既定REST API versionを使用する。
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`
  }
}

async function githubError(res:Response, label:string) {
  let message = ''
  try {
    const body = await res.json()
    message = body?.message ? `: ${body.message}` : ''
  } catch {}
  return new Error(`${label}: ${res.status}${message}`)
}

export function loadGitHubSyncConfig(): GitHubSyncConfig | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null')
    if (!raw?.owner || !raw?.repo) return null
    return {
      owner: String(raw.owner),
      repo: String(raw.repo),
      branch: String(raw.branch || 'main')
    }
  } catch { return null }
}

export function saveGitHubSyncConfig(config:GitHubSyncConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function clearGitHubSyncConfig() {
  localStorage.removeItem(CONFIG_KEY)
  sessionStorage.removeItem(TOKEN_SESSION_KEY)
  localStorage.removeItem(LEGACY_TOKEN_LOCAL_KEY)
}

export function saveGitHubToken(token:string) {
  // PATを永続保存しない。GitHub Pagesの同一origin配下に別アプリがある場合も考慮し、
  // セッション内だけに保持する。
  localStorage.removeItem(LEGACY_TOKEN_LOCAL_KEY)
  sessionStorage.setItem(TOKEN_SESSION_KEY, token)
}

export function loadGitHubToken() {
  return sessionStorage.getItem(TOKEN_SESSION_KEY) || ''
}

async function getJsonFile<T>(config:GitHubSyncConfig, token:string, path:string):Promise<{data:T|null, sha?:string}> {
  const res = await fetch(`${apiUrl(config,path)}?ref=${encodeURIComponent(config.branch)}`, {headers:headers(token)})
  if (res.status === 404) return {data:null}
  if (!res.ok) throw await githubError(res, `GitHub GET ${path}`)
  const body = await res.json()
  if (Array.isArray(body)) throw new Error(`${path} is a directory, expected a file`)
  return {data: JSON.parse(base64DecodeUtf8(body.content)) as T, sha: body.sha}
}

async function listDirectory(config:GitHubSyncConfig, token:string, path:string):Promise<string[]> {
  const res = await fetch(`${apiUrl(config,path)}?ref=${encodeURIComponent(config.branch)}`, {headers:headers(token)})
  if (res.status === 404) return []
  if (!res.ok) throw await githubError(res, `GitHub LIST ${path}`)
  const body = await res.json()
  return Array.isArray(body) ? body.filter(x=>x.type==='file').map(x=>String(x.name)) : []
}

async function putJsonFile(
  config:GitHubSyncConfig, token:string, path:string, data:unknown, sha?:string
) {
  const body:any = {
    message: `sync: ${path}`,
    content: base64EncodeUtf8(JSON.stringify(data,null,2)),
    branch: config.branch
  }
  if (sha) body.sha = sha

  const res = await fetch(apiUrl(config,path), {
    method:'PUT',
    headers:{...headers(token),'Content-Type':'application/json'},
    body:JSON.stringify(body)
  })
  if (res.status === 409) {
    const err:any = new Error('GitHub conflict')
    err.code = 409
    throw err
  }
  if (!res.ok) throw await githubError(res, `GitHub PUT ${path}`)
}

function sameJson(a:unknown,b:unknown) {
  return JSON.stringify(a) === JSON.stringify(b)
}

async function mergeFileWithRetry<T>(
  config:GitHubSyncConfig,
  token:string,
  path:string,
  build:(remote:T|null)=>T,
  attempts=3
):Promise<T> {
  for (let i=0;i<attempts;i++) {
    const latest = await getJsonFile<T>(config,token,path)
    const merged = build(latest.data)

    // 内容が同じなら不要なcommitを作らない。
    if (latest.data !== null && sameJson(latest.data, merged)) return merged

    try {
      await putJsonFile(config,token,path,merged,latest.sha)
      return merged
    } catch (e:any) {
      if (e?.code !== 409 || i === attempts-1) throw e
    }
  }
  throw new Error('sync retry exhausted')
}

function monthOf(iso:string) {
  return iso.slice(0,7)
}

function localDateKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function currentMonth() {
  return localDateKey().slice(0,7)
}

function mergeAttempts(a:Attempt[], b:Attempt[], resetVersion:number) {
  const map = new Map<string,Attempt>()
  for (const item of [...a,...b]) {
    if (item.resetVersion < resetVersion) continue
    map.set(item.id,item)
  }
  return [...map.values()].sort((x,y)=>y.at.localeCompare(x.at))
}

function mergeScores(a:ExamScore[], b:ExamScore[], resetVersion:number) {
  const map = new Map<string,ExamScore>()
  for (const item of [...a,...b]) {
    if (item.resetVersion < resetVersion) continue
    map.set(item.id,item)
  }
  return [...map.values()].sort((x,y)=>y.at.localeCompare(x.at))
}

function dailyProgressTuple(d:DailyState) {
  const settled = d.settled || 0
  const resolved = (d.correctCount || 0) + (d.wrongCount || 0) + (d.deferredCount || 0)
  return [
    d.completed ? 1 : 0,
    settled,
    resolved,
    d.sessionElapsed || 0
  ]
}

function chooseDaily(local:DailyState, remote:DailyState) {
  // 端末時計のずれだけで進捗を巻き戻さない。
  const a = dailyProgressTuple(local)
  const b = dailyProgressTuple(remote)
  for (let i=0;i<a.length;i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? local : remote
  }
  return (local.updatedAt || '') >= (remote.updatedAt || '') ? local : remote
}

export async function testGitHubConnection(config:GitHubSyncConfig, token:string) {
  const repoRes = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`,
    {headers:headers(token)}
  )
  if (!repoRes.ok) throw await githubError(repoRes, 'Repository access failed')
  const repo = await repoRes.json()
  if (repo.private !== true) throw new Error('同期用RepositoryはPrivateにしてください。')

  const branchRes = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/branches/${encodeURIComponent(config.branch)}`,
    {headers:headers(token)}
  )
  if (!branchRes.ok) {
    throw new Error(`ブランチ ${config.branch} を確認できません。Private RepositoryをREADME付きで初期化してください。`)
  }
  return true
}

async function syncHistoryFiles(
  config:GitHubSyncConfig,
  token:string,
  attemptsReset:number,
  examReset:number
) {
  const localAttempts = loadAttempts().filter(x=>x.resetVersion>=attemptsReset)
  const remoteAttemptNames = (await listDirectory(config,token,'data/attempts'))
    .filter(n=>/^\d{4}-\d{2}\.json$/.test(n))

  const months = new Set<string>([
    ...localAttempts.map(x=>monthOf(x.at)),
    ...remoteAttemptNames.map(n=>n.replace('.json',''))
  ])

  const mergedAll:Attempt[] = []
  for (const month of [...months].sort()) {
    const path = `data/attempts/${month}.json`
    const localMonth = localAttempts.filter(x=>monthOf(x.at)===month)
    const mergedFile = await mergeFileWithRetry<RemoteAttemptsFile>(
      config, token, path,
      remote => ({
        schemaVersion:1,
        month,
        attempts:mergeAttempts(localMonth, remote?.attempts || [], attemptsReset)
      })
    )
    mergedAll.push(...mergedFile.attempts)
  }
  // 同期中にこの端末で新しい解答が増えていても消さない。
  replaceAttempts(mergeAttempts(loadAttempts(), mergedAll, attemptsReset))

  const localScores = loadExamScores().filter(x=>x.resetVersion>=examReset)
  const mergedExam = await mergeFileWithRetry<RemoteExamFile>(
    config, token, 'data/past-exams.json',
    remote => ({schemaVersion:1,scores:mergeScores(localScores,remote?.scores||[],examReset)})
  )
  // 同期中にこの端末で新しい過去問得点が増えていても消さない。
  replaceExamScores(mergeScores(loadExamScores(), mergedExam.scores, examReset))
}

async function syncDaily(config:GitHubSyncConfig, token:string) {
  const daily = loadDaily()
  if (daily) {
    const month = daily.date.slice(0,7)
    const path = `data/daily/${month}.json`
    const mergedDaily = await mergeFileWithRetry<RemoteDailyFile>(
      config, token, path,
      remote => {
        const days = {...(remote?.days || {})}
        const old = days[daily.date]
        days[daily.date] = old ? chooseDaily(daily,old) : daily
        return {schemaVersion:1,month,days}
      }
    )
    const selected = mergedDaily.days[daily.date]
    if (selected) {
      const current = loadDaily()
      const safe = current && current.date === selected.date ? chooseDaily(current,selected) : selected
      saveDaily(safe,false)
    }
    return
  }

  const month = currentMonth()
  const remoteDaily = (await getJsonFile<RemoteDailyFile>(config,token,`data/daily/${month}.json`)).data
  const today = localDateKey()
  if (remoteDaily?.days?.[today]) {
    const incoming = remoteDaily.days[today]
    const current = loadDaily()
    const safe = current && current.date === incoming.date ? chooseDaily(current,incoming) : incoming
    saveDaily(safe,false)
  }
}

export async function syncAll(config:GitHubSyncConfig, token:string) {
  if (!navigator.onLine) throw new Error('offline')
  const dirtyRevisionAtStart = getSyncDirtyRevision()
  await testGitHubConnection(config,token)

  const deviceId = getDeviceId()
  const initialMeta = loadSyncMeta()
  const initialPrefs = loadPreferences()
  const profilePath = 'data/profile.json'
  const firstRemote = (await getJsonFile<RemoteProfile>(config,token,profilePath)).data

  let attemptsReset = Math.max(initialMeta.attemptsResetVersion, firstRemote?.resetVersions?.attempts || 0)
  let examReset = Math.max(initialMeta.examScoresResetVersion, firstRemote?.resetVersions?.examScores || 0)
  let chosenPrefs = firstRemote?.preferences && firstRemote.preferences.updatedAt > initialPrefs.updatedAt
    ? firstRemote.preferences
    : initialPrefs

  saveSyncMeta({...initialMeta,attemptsResetVersion:attemptsReset,examScoresResetVersion:examReset})
  savePreferences(chosenPrefs,false)

  await syncHistoryFiles(config,token,attemptsReset,examReset)
  await syncDaily(config,token)

  const now = new Date().toISOString()
  const finalProfile = await mergeFileWithRetry<RemoteProfile>(
    config, token, profilePath,
    remote => {
      // 同期中にこの端末で目標点変更/履歴リセットが起きても上書きで消さない。
      const currentPrefs = loadPreferences()
      const currentMeta = loadSyncMeta()
      const preferenceCandidates = [chosenPrefs,currentPrefs,remote?.preferences].filter(Boolean) as ReturnType<typeof loadPreferences>[]
      const newestPrefs = preferenceCandidates.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0]
      return {
        schemaVersion:1,
        deviceLastSeen:{...(remote?.deviceLastSeen||{}),[deviceId]:now},
        preferences:newestPrefs,
        resetVersions:{
          attempts:Math.max(attemptsReset,currentMeta.attemptsResetVersion,remote?.resetVersions?.attempts||0),
          examScores:Math.max(examReset,currentMeta.examScoresResetVersion,remote?.resetVersions?.examScores||0)
        },
        updatedAt:now
      }
    }
  )

  // 同期途中に別端末で「履歴削除」が走った場合も、最後に検知して一度だけ掃除する。
  const latestLocalMeta = loadSyncMeta()
  const finalAttemptsReset = Math.max(attemptsReset,latestLocalMeta.attemptsResetVersion,finalProfile.resetVersions.attempts)
  const finalExamReset = Math.max(examReset,latestLocalMeta.examScoresResetVersion,finalProfile.resetVersions.examScores)
  if (finalAttemptsReset > attemptsReset || finalExamReset > examReset) {
    attemptsReset = finalAttemptsReset
    examReset = finalExamReset
    saveSyncMeta({...loadSyncMeta(),attemptsResetVersion:attemptsReset,examScoresResetVersion:examReset})
    await syncHistoryFiles(config,token,attemptsReset,examReset)
  }

  const latestLocalPrefs = loadPreferences()
  chosenPrefs = latestLocalPrefs.updatedAt > finalProfile.preferences.updatedAt
    ? latestLocalPrefs
    : finalProfile.preferences
  savePreferences(chosenPrefs,false)
  saveSyncMeta({
    attemptsResetVersion:attemptsReset,
    examScoresResetVersion:examReset,
    lastSyncAt:now
  })
  // 同期中に別画面で新しい学習記録が作られた場合はdirtyを消さない。
  clearSyncDirtyIfUnchanged(dirtyRevisionAtStart)
  window.dispatchEvent(new CustomEvent('waseshibu-sync-complete'))
  return now
}
