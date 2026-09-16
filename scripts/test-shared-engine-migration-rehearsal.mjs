import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-migration-rehearsal-'))
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
  'src/schools/waseshibu/migrationRehearsal.ts',
  'src/storage.ts',
  'src/learningRoute.ts',
  'src/dataMigration.ts'
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
if (compiled.status !== 0) throw new Error(`migration-rehearsal modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

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
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {}
  }
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init) { this.type = type; this.detail = init?.detail }
  }
}

const seed = {
  'waseshibu-math-data-version': '8',
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
  }),
  // Deliberately outside the current rehearsal scope: it must remain untouched.
  'waseshibu-math-attempts': JSON.stringify([{ id: 'attempt-keep', questionId: 'exam-2024-Q1-1', status: 'wrong', at: '2026-09-11T10:00:00.000Z' }])
}

const storage = new MemoryStorage(seed)
installStorage(storage)
const require = createRequire(import.meta.url)
const rehearsal = require(path.join(out, 'schools/waseshibu/migrationRehearsal.js'))

const before = storage.snapshot()
const report = rehearsal.rehearseWaseShibuCanonicalMigration()
const after = storage.snapshot()

assert.equal(report.ready, true, report.issues.map(x => `${x.surface}: ${x.message}`).join('\n'))
assert.deepEqual(report.issues, [])
assert.equal(report.rehearsalContractVersion, 1)
assert.deepEqual(report.scope, ['preferences', 'examResults', 'drafts', 'route'])
assert.equal(after, before, 'migration rehearsal must not mutate any persisted state')
assert.equal(storage.writes, 0, 'migration rehearsal must perform zero storage writes')
assert.equal(report.canonicalCandidate.preferences.targetId, '70')
assert.equal(report.canonicalCandidate.examResults[0].examId, 'waseshibu-2024')
assert.equal(report.canonicalCandidate.examResults[0].deviceId, 'legacy-device')
assert.equal(report.canonicalCandidate.examResults[0].resetVersion, 9)
assert.deepEqual(report.canonicalCandidate.route.completedExamIdsByTarget, {
  '60': ['waseshibu-2024', 'waseshibu-2023'],
  '70': ['waseshibu-2023', 'waseshibu-2024'],
  '75': ['waseshibu-2024']
})
assert.equal(report.sourceSnapshot['waseshibu-math-data-version'], '8')
assert.equal(Object.prototype.hasOwnProperty.call(report.sourceSnapshot, 'waseshibu-math-attempts'), false, 'unmigrated surfaces must not be implied by the rehearsal snapshot')

// Rollback rehearsal: corrupt only the source surfaces in an isolated clone,
// then restore the exact captured raw strings. This proves byte-for-byte source
// restoration is possible before any production write path is introduced.
const rollbackClone = new MemoryStorage(seed)
rollbackClone.setItem('waseshibu-math-preferences', '{"target":60}')
rollbackClone.removeItem('waseshibu-math-exam-scores')
rollbackClone.setItem('waseshibu-math-data-version', '999')
for (const key of rehearsal.WASESHIBU_REHEARSAL_SOURCE_KEYS) {
  const raw = report.sourceSnapshot[key]
  if (raw === null) rollbackClone.removeItem(key)
  else rollbackClone.setItem(key, raw)
}
for (const key of rehearsal.WASESHIBU_REHEARSAL_SOURCE_KEYS) {
  assert.equal(rollbackClone.getItem(key), seed[key] ?? null, `rollback source byte parity: ${key}`)
}
assert.equal(rollbackClone.getItem('waseshibu-math-attempts'), seed['waseshibu-math-attempts'], 'rollback rehearsal must not touch out-of-scope learner data')

// Duplicate legacy IDs are currently readable, but canonical cutover must stop
// until an explicit no-loss duplicate policy exists.
const duplicateStorage = new MemoryStorage({
  'waseshibu-math-data-version': '8',
  'waseshibu-math-preferences': JSON.stringify({ target: 70 }),
  'waseshibu-math-exam-scores': JSON.stringify([
    { id: 'duplicate', year: 2024, score: 60, at: '2026-09-01T00:00:00.000Z' },
    { id: 'duplicate', year: 2025, score: 70, at: '2026-09-02T00:00:00.000Z' }
  ])
})
installStorage(duplicateStorage)
const duplicate = rehearsal.rehearseWaseShibuCanonicalMigration()
assert.equal(duplicate.ready, false, 'duplicate result identities must block migration rehearsal')
assert.ok(duplicate.issues.some(x => x.message.includes('duplicate result id')))
assert.equal(duplicateStorage.writes, 0)

// Unmappable legacy state fails closed and still remains read-only.
const malformedStorage = new MemoryStorage({
  'waseshibu-math-data-version': '8',
  'waseshibu-math-preferences': JSON.stringify({ target: 70 }),
  'waseshibu-math-learning-route-v1': JSON.stringify({ solvedYears: [2024, 2099], completedCoreByTarget: {}, reinforcement: {} })
})
installStorage(malformedStorage)
const malformed = rehearsal.rehearseWaseShibuCanonicalMigration()
assert.equal(malformed.ready, false)
assert.ok(malformed.issues.some(x => x.surface === 'route' || x.surface === 'shadow'))
assert.equal(malformedStorage.writes, 0)

console.log('SHARED ENGINE MIGRATION REHEARSAL TEST PASSED')
console.log('legacy -> canonical candidate, dual-read validation, exact source snapshot, simulated rollback, zero production writes: OK')
