import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-activity-shadow-'))
const out = path.join(temp, 'out')
const emptyTypes = path.join(temp, 'types')
fs.mkdirSync(emptyTypes)

const entries = [
  'src/engine/appProfile.ts',
  'src/engine/examContract.ts',
  'src/engine/learnerState.ts',
  'src/schools/waseshibu/appProfile.ts',
  'src/schools/waseshibu/legacyCompatibility.ts',
  'src/schools/waseshibu/activityCompatibility.ts',
  'src/schools/waseshibu/activityShadow.ts',
  'src/schools/waseshibu/activityAudit.ts',
  'src/storage.ts'
]

const compiled = spawnSync('tsc', [
  ...entries,
  '--outDir', out,
  '--module', 'commonjs',
  '--target', 'ES2022',
  '--lib', 'ES2022,DOM',
  '--typeRoots', emptyTypes,
  '--skipLibCheck',
  '--strict'
], { cwd: root, encoding: 'utf8' })
if (compiled.status !== 0) throw new Error(`activity-shadow modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

class MemoryStorage {
  constructor(seed = {}) {
    this.map = new Map(Object.entries(seed))
    this.writes = 0
  }
  get length() { return this.map.size }
  key(index) { return [...this.map.keys()][index] ?? null }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.writes++; this.map.set(key, String(value)) }
  removeItem(key) { this.writes++; this.map.delete(key) }
  clear() { this.writes++; this.map.clear() }
  snapshot() { return JSON.stringify([...this.map.entries()].sort(([a],[b]) => a.localeCompare(b))) }
}

function installStorage(storage) {
  globalThis.localStorage = storage
  globalThis.sessionStorage = new MemoryStorage()
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} }
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init) { this.type = type; this.detail = init?.detail }
  }
}

const seed = {
  'waseshibu-math-sync-meta': JSON.stringify({ attemptsResetVersion: 7, examScoresResetVersion: 9 }),
  'waseshibu-math-attempts': JSON.stringify([
    {
      id: 'daily-1', questionId: 'field-expressions-1', mode: 'q1', topic: '式の計算',
      status: 'wrong', mistakeTag: '計算ミス', seconds: 33, at: '2026-09-01T10:00:00.000Z'
    },
    {
      id: 'exam-1', deviceId: 'device-a', resetVersion: 12,
      questionId: 'exam-2024-Q1-1', mode: 'multi', topic: '数式計算', status: 'correct',
      diagnosis: 'correct', answer: '6', flagged: false, seconds: 12, at: '2026-09-02T10:00:00.000Z'
    },
    {
      id: 'exposure-1', questionId: 'exposure-2025', mode: 'multi', topic: '2025年度 過去問',
      status: 'deferred', at: '2026-09-03T10:00:00.000Z'
    },
    {
      id: 'mastery-1', questionId: 'mastery-expressions', mode: 'multi', topic: '式の計算',
      status: 'correct', at: '2026-09-04T10:00:00.000Z'
    },
    {
      id: 'target-1', questionId: 'target-2019-Q1-1', mode: 'multi', topic: '数式計算',
      status: 'wrong', answer: '5', at: '2026-09-05T10:00:00.000Z'
    },
    {
      id: 'training-1', questionId: 'year-2026-Q1', mode: 'multi', topic: '年度別トレーニング',
      status: 'correct', at: '2026-09-06T10:00:00.000Z'
    },
    {
      id: 'legacy-normalize-1', questionId: 'L2-expressions-01', mode: 'unexpected', topic: '',
      status: 'unexpected', correct: true, approach: 'unexpected', diagnosis: 'unexpected',
      answer: 123, flagged: 'yes', seconds: '20', at: 1780000000000
    }
  ])
}

const storage = new MemoryStorage(seed)
installStorage(storage)
const require = createRequire(import.meta.url)
const audit = require(path.join(out, 'schools/waseshibu/activityAudit.js'))

const before = storage.snapshot()
const report = audit.auditWaseShibuActivities()
const after = storage.snapshot()

assert.equal(report.ok, true, report.mismatches.map(x => `${x.surface}: ${x.message}`).join('\n'))
assert.deepEqual(report.mismatches, [])
assert.deepEqual(report.shadowIssues, [])
assert.equal(after, before, 'activity audit must not mutate persisted state')
assert.equal(storage.writes, 0, 'activity audit must perform zero storage writes')
assert.deepEqual(report.legacyProjection, report.canonicalShadow)
assert.equal(report.canonicalShadow.length, 7)

const byId = new Map(report.canonicalShadow.map(record => [record.id, record]))

const daily = byId.get('daily-1')
assert.equal(daily.kind, 'problem-attempt')
assert.equal(daily.problemId, 'field-expressions-1')
assert.equal(daily.examId, undefined)
assert.equal(daily.outcome, 'wrong')
assert.equal(daily.deviceId, 'legacy-device')
assert.equal(daily.resetVersion, 7)
assert.equal(daily.durationSeconds, 33)
assert.equal(daily.schoolEvidence.legacyMode, 'q1')
assert.equal(daily.schoolEvidence.legacyMistakeTag, '計算ミス')

const exam = byId.get('exam-1')
assert.equal(exam.kind, 'problem-attempt')
assert.equal(exam.problemId, '2024-Q1-1')
assert.equal(exam.examId, 'waseshibu-2024')
assert.equal(exam.answerText, '6')
assert.equal(exam.flagged, false)
assert.equal(exam.deviceId, 'device-a')
assert.equal(exam.resetVersion, 12)
assert.equal(exam.schoolEvidence.legacyDiagnosis, 'correct')

const exposure = byId.get('exposure-1')
assert.equal(exposure.kind, 'exam-exposure')
assert.equal(exposure.examId, 'waseshibu-2025')
assert.equal('problemId' in exposure, false, 'exam exposure must never masquerade as a problem attempt')

const mastery = byId.get('mastery-1')
assert.equal(mastery.kind, 'mastery-marker')
assert.equal(mastery.markerId, 'mastery-expressions')
assert.equal('problemId' in mastery, false, 'mastery marker must never masquerade as a problem attempt')

const target = byId.get('target-1')
assert.equal(target.kind, 'problem-attempt')
assert.equal(target.problemId, '2019-Q1-1')
assert.equal(target.examId, 'waseshibu-2019')

const training = byId.get('training-1')
assert.equal(training.kind, 'problem-attempt')
assert.equal(training.problemId, 'year-2026-Q1')
assert.equal(training.examId, undefined, 'synthetic year-training work must not be bound to a concrete past-paper exam by ID parsing')

const normalizedLegacy = byId.get('legacy-normalize-1')
assert.equal(normalizedLegacy.kind, 'problem-attempt')
assert.equal(normalizedLegacy.problemId, 'L2-expressions-01')
assert.equal(normalizedLegacy.outcome, 'correct', 'legacy raw.correct fallback must match loadAttempts')
assert.equal(normalizedLegacy.topicLabel, '旧データ')
assert.equal(normalizedLegacy.schoolEvidence.legacyMode, 'q1', 'unknown legacy mode must match current q1 fallback')
assert.equal(normalizedLegacy.schoolEvidence.legacyApproach, undefined)
assert.equal(normalizedLegacy.schoolEvidence.legacyDiagnosis, undefined)
assert.equal(normalizedLegacy.answerText, undefined)
assert.equal(normalizedLegacy.flagged, undefined)
assert.equal(normalizedLegacy.durationSeconds, undefined)
assert.equal(normalizedLegacy.at, '1780000000000')

// Corrupt JSON: current runtime falls back to [], but migration audit must fail
// closed instead of treating corruption as a valid empty history.
const corrupt = new MemoryStorage({
  'waseshibu-math-sync-meta': JSON.stringify({ attemptsResetVersion: 3 }),
  'waseshibu-math-attempts': '{bad json'
})
installStorage(corrupt)
const corruptReport = audit.auditWaseShibuActivities()
assert.equal(corruptReport.ok, false)
assert.ok(corruptReport.mismatches.some(x => x.surface === 'shadow'))
assert.equal(corrupt.writes, 0)

// A filtered legacy record is a potential data-loss condition for migration and
// therefore blocks the audit even though the active reader silently omits it.
const filtered = new MemoryStorage({
  'waseshibu-math-attempts': JSON.stringify([{ id: 'missing-question', at: '2026-09-01T00:00:00.000Z' }])
})
installStorage(filtered)
const filteredReport = audit.auditWaseShibuActivities()
assert.equal(filteredReport.ok, false)
assert.ok(filteredReport.mismatches.some(x => x.surface === 'shadow'))
assert.equal(filtered.writes, 0)

// Exposure semantics require a concrete known exam. Do not silently invent a
// canonical exam ID for an unsupported legacy exposure year.
const badExposure = new MemoryStorage({
  'waseshibu-math-attempts': JSON.stringify([
    { id: 'bad-exposure', questionId: 'exposure-2099', mode: 'multi', topic: 'future', status: 'deferred', at: '2026-09-01T00:00:00.000Z' }
  ])
})
installStorage(badExposure)
const badExposureReport = audit.auditWaseShibuActivities()
assert.equal(badExposureReport.ok, false)
assert.ok(badExposureReport.mismatches.some(x => x.surface === 'activityRecords' || x.surface === 'shadow'))
assert.equal(badExposure.writes, 0)

console.log('SHARED ENGINE ACTIVITY SHADOW TEST PASSED')
console.log('actual loadAttempts == canonical activity shadow; problem attempts, exam exposure and mastery markers stay distinct; zero writes: OK')
