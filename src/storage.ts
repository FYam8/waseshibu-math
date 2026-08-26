import type { Attempt, ExamScore } from './types'

const ATTEMPT_KEY = 'waseshibu-math-attempts'
const PREF_KEY = 'waseshibu-math-preferences'
const DAILY_KEY = 'waseshibu-math-daily'
const EXAM_KEY = 'waseshibu-math-exam-scores'
const DEVICE_KEY = 'waseshibu-math-device-id'
const META_KEY = 'waseshibu-math-sync-meta'
const DIRTY_KEY = 'waseshibu-math-sync-dirty'
const DIRTY_REV_KEY = 'waseshibu-math-sync-dirty-revision'

export type Preferences = {
  target: 60 | 70 | 75
  name?: string
  updatedAt: string
}

export type DailyState = {
  date: string
  questionIds: string[]
  completed: boolean
  queue?: string[]
  deferredOnce?: string[]
  settled?: number
  correctCount?: number
  wrongCount?: number
  deferredCount?: number
  sessionElapsed?: number
  updatedAt?: string
}

export type SyncMeta = {
  attemptsResetVersion: number
  examScoresResetVersion: number
  lastSyncAt?: string
}

const now = () => new Date().toISOString()

function nextResetVersion(current:number) {
  // 古い端末がオフライン中にリセットしても、通常は過去の世代より新しくなるよう
  // 現在時刻(ms)と現在世代+1の大きい方を使う。
  return Math.max(current + 1, Date.now())
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function createRecordId(prefix = 'record'): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${getDeviceId()}-${prefix}-${random}`
}

export function loadSyncMeta(): SyncMeta {
  try {
    const raw = JSON.parse(localStorage.getItem(META_KEY) || '{}')
    return {
      attemptsResetVersion: Number.isInteger(raw.attemptsResetVersion) ? raw.attemptsResetVersion : 0,
      examScoresResetVersion: Number.isInteger(raw.examScoresResetVersion) ? raw.examScoresResetVersion : 0,
      lastSyncAt: typeof raw.lastSyncAt === 'string' ? raw.lastSyncAt : undefined
    }
  } catch {
    return { attemptsResetVersion: 0, examScoresResetVersion: 0 }
  }
}

export function saveSyncMeta(meta: SyncMeta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta))
}

export function markSyncDirty() {
  const next = getSyncDirtyRevision() + 1
  localStorage.setItem(DIRTY_REV_KEY, String(next))
  localStorage.setItem(DIRTY_KEY, '1')
  window.dispatchEvent(new CustomEvent('waseshibu-sync-dirty'))
}

export function getSyncDirtyRevision() {
  const n = Number(localStorage.getItem(DIRTY_REV_KEY) || '0')
  return Number.isFinite(n) ? n : 0
}

export function clearSyncDirtyIfUnchanged(revisionAtStart:number) {
  if (getSyncDirtyRevision() !== revisionAtStart) return false
  localStorage.removeItem(DIRTY_KEY)
  return true
}

export function isSyncDirty() {
  return localStorage.getItem(DIRTY_KEY) === '1'
}

function migrateAttempt(raw: any): Attempt | null {
  if (!raw || !raw.id || !raw.questionId || !raw.at) return null
  const meta = loadSyncMeta()
  return {
    id: String(raw.id),
    deviceId: String(raw.deviceId || 'legacy-device'),
    resetVersion: Number.isInteger(raw.resetVersion) ? raw.resetVersion : meta.attemptsResetVersion,
    questionId: String(raw.questionId),
    mode: raw.mode === 'multi' ? 'multi' : 'q1',
    topic: String(raw.topic || '旧データ'),
    status: raw.status === 'correct' || raw.status === 'wrong' || raw.status === 'deferred'
      ? raw.status
      : raw.correct === true ? 'correct' : 'wrong',
    mistakeTag: raw.mistakeTag,
    seconds: typeof raw.seconds === 'number' ? raw.seconds : undefined,
    at: String(raw.at)
  }
}

export function loadAttempts(): Attempt[] {
  try {
    const raw = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || '[]')
    return Array.isArray(raw) ? raw.map(migrateAttempt).filter(Boolean) as Attempt[] : []
  } catch { return [] }
}

export function replaceAttempts(attempts: Attempt[], markDirty = false) {
  const unique = [...new Map(attempts.map(x => [x.id, x])).values()]
    .sort((a,b) => b.at.localeCompare(a.at))
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(unique))
  if (markDirty) markSyncDirty()
}

export function saveAttempt(attempt: Omit<Attempt, 'deviceId'|'resetVersion'> & Partial<Pick<Attempt,'deviceId'|'resetVersion'>>) {
  const meta = loadSyncMeta()
  const full: Attempt = {
    ...attempt,
    deviceId: attempt.deviceId || getDeviceId(),
    resetVersion: Number.isInteger(attempt.resetVersion) ? attempt.resetVersion! : meta.attemptsResetVersion
  }
  replaceAttempts([full, ...loadAttempts()])
  markSyncDirty()
}

export function clearAttempts() {
  localStorage.removeItem(ATTEMPT_KEY)
  const meta = loadSyncMeta()
  saveSyncMeta({...meta, attemptsResetVersion: nextResetVersion(meta.attemptsResetVersion)})
  markSyncDirty()
}

export function loadPreferences(): Preferences {
  try {
    const raw = JSON.parse(localStorage.getItem(PREF_KEY) || '{}')
    return {
      target: raw.target === 60 || raw.target === 75 ? raw.target : 70,
      name: typeof raw.name === 'string' ? raw.name : undefined,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '1970-01-01T00:00:00.000Z'
    }
  } catch {
    return { target: 70, updatedAt: '1970-01-01T00:00:00.000Z' }
  }
}

export function savePreferences(prefs: Omit<Preferences,'updatedAt'> & Partial<Pick<Preferences,'updatedAt'>>, markDirty = true) {
  const full: Preferences = {...prefs, updatedAt: prefs.updatedAt || now()}
  localStorage.setItem(PREF_KEY, JSON.stringify(full))
  if (markDirty) markSyncDirty()
}

export function loadDaily(): DailyState | null {
  try { return JSON.parse(localStorage.getItem(DAILY_KEY) || 'null') } catch { return null }
}

export function saveDaily(state: DailyState, markDirty = true) {
  localStorage.setItem(DAILY_KEY, JSON.stringify({...state, updatedAt: state.updatedAt || now()}))
  if (markDirty) markSyncDirty()
}

export function loadExamScores(): ExamScore[] {
  try {
    const raw = JSON.parse(localStorage.getItem(EXAM_KEY) || '[]')
    const meta = loadSyncMeta()
    return Array.isArray(raw) ? raw.filter(x =>
      x && Number.isInteger(x.year) && x.year >= 2019 && x.year <= 2026 &&
      typeof x.score === 'number' && x.score >= 0 && x.score <= 100
    ).map(x => ({
      ...x,
      deviceId: String(x.deviceId || 'legacy-device'),
      resetVersion: Number.isInteger(x.resetVersion) ? x.resetVersion : meta.examScoresResetVersion
    })) : []
  } catch { return [] }
}

export function replaceExamScores(scores: ExamScore[], markDirty = false) {
  const unique = [...new Map(scores.map(x => [x.id, x])).values()]
    .sort((a,b) => b.at.localeCompare(a.at))
  localStorage.setItem(EXAM_KEY, JSON.stringify(unique))
  if (markDirty) markSyncDirty()
}

export function saveExamScore(score: Omit<ExamScore,'deviceId'|'resetVersion'> & Partial<Pick<ExamScore,'deviceId'|'resetVersion'>>) {
  const meta = loadSyncMeta()
  const full: ExamScore = {
    ...score,
    deviceId: score.deviceId || getDeviceId(),
    resetVersion: Number.isInteger(score.resetVersion) ? score.resetVersion! : meta.examScoresResetVersion
  }
  replaceExamScores([full, ...loadExamScores()])
  markSyncDirty()
}

export function clearExamScores() {
  localStorage.removeItem(EXAM_KEY)
  const meta = loadSyncMeta()
  saveSyncMeta({...meta, examScoresResetVersion: nextResetVersion(meta.examScoresResetVersion)})
  markSyncDirty()
}
