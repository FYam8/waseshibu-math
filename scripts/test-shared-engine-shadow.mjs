import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-shadow-state-'))
const out = path.join(temp, 'out')
const emptyTypes = path.join(temp, 'types')
fs.mkdirSync(emptyTypes)

const entries = [
  'src/engine/appProfile.ts',
  'src/engine/examContract.ts',
  'src/engine/learnerState.ts',
  'src/schools/waseshibu/appProfile.ts',
  'src/schools/waseshibu/legacyCompatibility.ts',
  'src/schools/waseshibu/shadowState.ts'
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
if (compiled.status !== 0) throw new Error(`shadow-state modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

const require = createRequire(import.meta.url)
const shadow = require(path.join(out, 'schools/waseshibu/shadowState.js'))

class ReadOnlyMemoryStorage {
  constructor(seed) {
    this.map = new Map(Object.entries(seed))
    this.reads = []
  }
  getItem(key) {
    this.reads.push(key)
    return this.map.has(key) ? this.map.get(key) : null
  }
  snapshot() {
    return JSON.stringify([...this.map.entries()].sort(([a],[b]) => a.localeCompare(b)))
  }
}

const seed = {
  'waseshibu-math-preferences': JSON.stringify({ target: 70, name: '受験生', updatedAt: '2026-09-01T10:00:00.000Z' }),
  'waseshibu-math-exam-scores': JSON.stringify([
    {
      id: 'score-2024', deviceId: 'device-a', resetVersion: 3, year: 2024, score: 68,
      reproducibleScore: 64, recoverableScore: 72, timeCandidateScore: 74,
      correctCount: 14, wrongCount: 5, unansweredCount: 1, completed: true,
      attemptKind: 'first', scoreValidity: 'first-look', weakFields: ['数式計算'],
      at: '2026-09-02T10:00:00.000Z'
    },
    {
      id: 'score-2025', deviceId: 'device-a', resetVersion: 3, year: 2025, score: 72,
      correctCount: 15, wrongCount: 4, unansweredCount: 1, completed: true,
      attemptKind: 'retake', scoreValidity: 'reference',
      at: '2026-09-03T10:00:00.000Z'
    }
  ]),
  'waseshibu-math-exam-drafts-v2': JSON.stringify({
    '2023': { answers: { '2023-Q1-1': '4' }, flags: {}, seconds: 121, majorIndex: 0, phase: 'solve' },
    '2026': { answers: { '2026-Q1-1': '7' }, flags: { '2026-Q1-2': true }, seconds: 44, majorIndex: 1, phase: 'mark' }
  }),
  'waseshibu-math-learning-route-v1': JSON.stringify({
    solvedYears: [2024, 2023],
    usedOldQuestionIds: ['2019-Q1-1'],
    reinforcement: {
      '2024': {
        examId: 'score-2024',
        sourceYear: 2024,
        target: 70,
        fields: { '数式計算': ['2019-Q1-1'] },
        completedQuestionIds: ['2019-Q1-1'],
        createdAt: '2026-09-02T11:00:00.000Z',
        requiresSourceReview: false
      }
    },
    completedCoreByTarget: {
      '60': [2024, 2023],
      '70': [2024],
      '75': []
    },
    updatedAt: '2026-09-03T11:00:00.000Z'
  })
}

const storage = new ReadOnlyMemoryStorage(seed)
const before = storage.snapshot()
const result = shadow.readWaseShibuCanonicalShadow(storage)
const after = storage.snapshot()

assert.equal(after, before, 'shadow read must not mutate any persisted byte/string')
assert.deepEqual(result.issues, [])
assert.equal(result.state.preferences.targetId, '70')
assert.equal(result.state.preferences.name, '受験生')
assert.deepEqual(result.state.examResults.map(x => [x.id, x.examId, x.score, x.maxScore, x.scoreAuthority]), [
  ['score-2024', 'waseshibu-2024', 68, 100, 'school-modelled'],
  ['score-2025', 'waseshibu-2025', 72, 100, 'school-modelled']
])
assert.equal(result.state.examResults[0].deviceId, 'device-a')
assert.equal(result.state.examResults[0].resetVersion, 3)
assert.deepEqual(result.state.examResults[0].schoolEvidence, {
  reproducibleScore: 64,
  recoverableScore: 72,
  timeCandidateScore: 74,
  attemptKind: 'first',
  scoreValidity: 'first-look',
  weakFields: ['数式計算']
})
assert.deepEqual(Object.keys(result.state.draftsByExamId).sort(), ['waseshibu-2023', 'waseshibu-2026'])
assert.equal(result.state.draftsByExamId['waseshibu-2026'].seconds, 44)
assert.deepEqual(result.state.route.solvedExamIds, ['waseshibu-2024', 'waseshibu-2023'])
assert.deepEqual(result.state.route.completedExamIdsByTarget, {
  '60': ['waseshibu-2024', 'waseshibu-2023'],
  '70': ['waseshibu-2024'],
  '75': []
})
assert.deepEqual(result.state.route.reinforcementByExamId['waseshibu-2024'], {
  sourceExamId: 'waseshibu-2024',
  sourceResultId: 'score-2024',
  targetId: '70',
  fields: { '数式計算': ['2019-Q1-1'] },
  completedProblemIds: ['2019-Q1-1'],
  createdAt: '2026-09-02T11:00:00.000Z',
  requiresSourceReview: false
})
assert.deepEqual(result.state.route.usedProblemIds, ['2019-Q1-1'])

const impliedLocks = shadow.readWaseShibuCanonicalShadow(new ReadOnlyMemoryStorage({
  'waseshibu-math-learning-route-v1': JSON.stringify({
    solvedYears: [], usedOldQuestionIds: [], reinforcement: {},
    completedCoreByTarget: { '75': [2024, 2019] }
  })
}))
assert.deepEqual(impliedLocks.state.route.completedExamIdsByTarget, {
  '75': ['waseshibu-2024'],
  '60': ['waseshibu-2024'],
  '70': ['waseshibu-2024']
}, 'shadow route must match WaseShibu target-completion closure and exclude optional old years')

const defaults = shadow.readWaseShibuCanonicalShadow(new ReadOnlyMemoryStorage({}))
assert.equal(defaults.state.preferences.targetId, '70')
assert.equal(defaults.state.preferences.updatedAt, '1970-01-01T00:00:00.000Z')
assert.deepEqual(defaults.state.examResults, [])
assert.deepEqual(defaults.state.draftsByExamId, {})
assert.deepEqual(defaults.state.route.solvedExamIds, [])
assert.deepEqual(defaults.issues, [])

const malformed = shadow.readWaseShibuCanonicalShadow(new ReadOnlyMemoryStorage({
  'waseshibu-math-exam-drafts-v2': '{bad json',
  'waseshibu-math-learning-route-v1': JSON.stringify({ solvedYears: [2024, 2099] })
}))
assert.ok(malformed.issues.some(x => x.key === 'waseshibu-math-exam-drafts-v2'))
assert.ok(malformed.issues.some(x => x.message.includes('2099')))
assert.deepEqual(malformed.state.route.solvedExamIds, ['waseshibu-2024'])

console.log('SHARED ENGINE SHADOW STATE TEST PASSED')
console.log('legacy WaseShibu preferences/results/drafts/route -> canonical read-only view, zero writes, preserved evidence and route semantics: OK')
