import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-dual-read-'))
const out = path.join(temp, 'out')
const emptyTypes = path.join(temp, 'types')
fs.mkdirSync(emptyTypes)

const entries = [
  'src/engine/appProfile.ts',
  'src/engine/examContract.ts',
  'src/engine/learnerState.ts',
  'src/schools/waseshibu/appProfile.ts',
  'src/schools/waseshibu/legacyCompatibility.ts',
  'src/schools/waseshibu/shadowState.ts',
  'src/schools/waseshibu/dualReadAudit.ts',
  'src/storage.ts',
  'src/learningRoute.ts'
]

const compiled = spawnSync('tsc', [
  ...entries,
  '--outDir', out,
  '--module', 'commonjs',
  '--target', 'ES2022',
  '--lib', 'ES2022,DOM',
  '--resolveJsonModule',
  '--esModuleInterop',
  '--typeRoots', emptyTypes,
  '--skipLibCheck',
  '--strict'
], { cwd: root, encoding: 'utf8' })
if (compiled.status !== 0) throw new Error(`dual-read modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

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

const seed = {
  'waseshibu-math-preferences': JSON.stringify({ target: 70, name: '受験生', updatedAt: '2026-09-10T08:00:00.000Z' }),
  'waseshibu-math-sync-meta': JSON.stringify({ attemptsResetVersion: 4, examScoresResetVersion: 9, lastSyncAt: '2026-09-10T09:00:00.000Z' }),
  'waseshibu-math-exam-scores': JSON.stringify([
    {
      id: 'score-2024', year: 2024, score: 66,
      reproducibleScore: 62, recoverableScore: 71, timeCandidateScore: 73,
      correctCount: 13, wrongCount: 6, unansweredCount: 1,
      completed: true, attemptKind: 'first', scoreValidity: 'first-look', weakFields: ['数式計算'],
      at: '2026-09-11T10:00:00.000Z'
    },
    {
      id: 'score-2025', deviceId: 'device-explicit', resetVersion: 12,
      year: 2025, score: 72, correctCount: 15, wrongCount: 4, unansweredCount: 1,
      completed: true, attemptKind: 'retake', scoreValidity: 'reference',
      at: '2026-09-12T10:00:00.000Z'
    }
  ]),
  'waseshibu-math-exam-drafts-v2': JSON.stringify({
    '2023': { answers: { '2023-Q1-1': '4' }, flags: {}, seconds: 81, majorIndex: 0, phase: 'solve' },
    '2026': { answers: { '2026-Q1-1': '7' }, flags: { '2026-Q1-2': true }, seconds: 39, majorIndex: 1, phase: 'mark' }
  }),
  'waseshibu-math-learning-route-v1': JSON.stringify({
    solvedYears: [2024, 2023],
    usedOldQuestionIds: ['2019-Q1-1'],
    reinforcement: {
      '2024': {
        examId: 'score-2024', sourceYear: 2024, target: 70,
        fields: { '数式計算': ['2019-Q1-1'] },
        completedQuestionIds: ['2019-Q1-1'],
        createdAt: '2026-09-11T11:00:00.000Z', requiresSourceReview: false
      }
    },
    completedCoreByTarget: { '75': [2024], '70': [2023], '60': [] },
    updatedAt: '2026-09-12T11:00:00.000Z'
  })
}

const storage = new MemoryStorage(seed)
globalThis.localStorage = storage
globalThis.sessionStorage = new MemoryStorage()
globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {}
}
globalThis.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail } }

const require = createRequire(import.meta.url)
const dualRead = require(path.join(out, 'schools/waseshibu/dualReadAudit.js'))

const before = storage.snapshot()
const report = dualRead.auditWaseShibuDualRead()
const after = storage.snapshot()

assert.equal(report.ok, true, report.mismatches.map(x => `${x.surface}: ${x.message}`).join('\n'))
assert.deepEqual(report.mismatches, [])
assert.deepEqual(report.shadowIssues, [])
assert.equal(after, before, 'dual-read audit must not mutate persisted state')
assert.equal(storage.writes, 0, 'dual-read audit must perform zero storage writes')
assert.deepEqual(report.legacyProjection, report.canonicalShadow, 'actual legacy readers and canonical shadow must be semantically identical')

assert.equal(report.canonicalShadow.preferences.targetId, '70')
assert.equal(report.canonicalShadow.examResults[0].examId, 'waseshibu-2024')
assert.equal(report.canonicalShadow.examResults[0].deviceId, 'legacy-device', 'shadow must match legacy default device identity')
assert.equal(report.canonicalShadow.examResults[0].resetVersion, 9, 'shadow must match legacy sync-meta resetVersion fallback')
assert.equal(report.canonicalShadow.examResults[1].deviceId, 'device-explicit')
assert.equal(report.canonicalShadow.examResults[1].resetVersion, 12)
assert.deepEqual(report.canonicalShadow.route.completedExamIdsByTarget, {
  '60': ['waseshibu-2024', 'waseshibu-2023'],
  '70': ['waseshibu-2023', 'waseshibu-2024'],
  '75': ['waseshibu-2024']
}, 'canonical shadow must preserve the exact current target-completion closure ordering')
assert.equal(report.canonicalShadow.draftsByExamId['waseshibu-2026'].seconds, 39)

const malformedStorage = new MemoryStorage({
  'waseshibu-math-preferences': JSON.stringify({ target: 70 }),
  'waseshibu-math-learning-route-v1': JSON.stringify({ solvedYears: [2024, 2099], completedCoreByTarget: {}, reinforcement: {} })
})
globalThis.localStorage = malformedStorage
const malformed = dualRead.auditWaseShibuDualRead()
assert.equal(malformed.ok, false, 'unmappable legacy state must fail dual-read parity closed')
assert.ok(malformed.mismatches.some(x => x.surface === 'route' || x.surface === 'shadow'))
assert.equal(malformedStorage.writes, 0, 'failed audit must still remain read-only')

globalThis.localStorage = new MemoryStorage({})
const empty = dualRead.auditWaseShibuDualRead()
assert.equal(empty.ok, true, empty.mismatches.map(x => `${x.surface}: ${x.message}`).join('\n'))
assert.equal(empty.canonicalShadow.preferences.targetId, '70')
assert.equal(empty.canonicalShadow.route.updatedAt, '1970-01-01T00:00:00.000Z')

console.log('SHARED ENGINE DUAL-READ PARITY TEST PASSED')
console.log('active legacy readers == canonical shadow for preferences/results/drafts/route, zero writes, fail-closed mismatch detection: OK')
