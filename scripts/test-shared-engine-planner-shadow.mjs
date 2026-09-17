import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-planner-shadow-'))
const out = path.join(temp, 'out')
const emptyTypes = path.join(temp, 'types')
fs.mkdirSync(emptyTypes)

const entries = [
  'src/engine/appProfile.ts',
  'src/engine/examContract.ts',
  'src/engine/learnerState.ts',
  'src/schools/waseshibu/appProfile.ts',
  'src/schools/waseshibu/legacyCompatibility.ts',
  'src/schools/waseshibu/plannerCompatibility.ts',
  'src/schools/waseshibu/plannerShadow.ts'
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
if (compiled.status !== 0) throw new Error(`planner-shadow modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

class MemoryStorage {
  constructor(seed = {}) {
    this.map = new Map(Object.entries(seed))
    this.writes = 0
  }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.writes++; this.map.set(key, String(value)) }
  removeItem(key) { this.writes++; this.map.delete(key) }
  clear() { this.writes++; this.map.clear() }
  snapshot() { return JSON.stringify([...this.map.entries()].sort(([a],[b]) => a.localeCompare(b))) }
}

const TODAY_KEY = 'waseshibu-math-daily-required-plan-v2'
const AHEAD_KEY = 'waseshibu-math-study-ahead-plan-v1'

const seed = {
  [TODAY_KEY]: JSON.stringify({
    date: '2026-09-16',
    target: 70,
    pendingIds: ['review-2024-Q1-1', 'progression:/past-papers?year=2025'],
    completedIds: ['review-2024-Q1-2'],
    fallbackTask: {
      id: 'progression:/past-papers?year=2025',
      kind: 'past-paper',
      title: '2025年度を解く',
      detail: '次の1ステップ',
      to: '/past-papers?year=2025',
      priority: 1,
      questionId: '2025-Q1-1',
      grade: 'B'
    },
    queueVersion: 3
  }),
  [AHEAD_KEY]: JSON.stringify({
    date: '2026-09-17',
    target: 75,
    pendingIds: ['practice-2024-Q2-1'],
    completedIds: [],
    queueVersion: 3
  })
}

const storage = new MemoryStorage(seed)
const require = createRequire(import.meta.url)
const planner = require(path.join(out, 'schools/waseshibu/plannerShadow.js'))

const before = storage.snapshot()
const report = planner.readWaseShibuCanonicalPlannerShadow(storage)
const after = storage.snapshot()

assert.deepEqual(report.issues, [])
assert.equal(after, before, 'planner shadow must not mutate persisted state')
assert.equal(storage.writes, 0, 'planner shadow must perform zero writes')

const today = report.todayRequiredPlan
assert.equal(today.planKind, 'today-required')
assert.equal(today.date, '2026-09-16')
assert.equal(today.targetId, '70')
assert.deepEqual(today.pendingTaskIds, ['review-2024-Q1-1', 'progression:/past-papers?year=2025'])
assert.deepEqual(today.completedTaskIds, ['review-2024-Q1-2'])
assert.equal(today.schoolEvidence.legacyQueueVersion, 3)
assert.equal(today.fallbackTask.taskId, 'progression:/past-papers?year=2025')
assert.equal(today.fallbackTask.problemId, '2025-Q1-1')
assert.equal(today.fallbackTask.schoolEvidence.legacyKind, 'past-paper')
assert.equal(today.fallbackTask.schoolEvidence.legacyRoute, '/past-papers?year=2025')
assert.equal(today.fallbackTask.schoolEvidence.title, '2025年度を解く')
assert.equal(today.fallbackTask.schoolEvidence.grade, 'B')
assert.equal('to' in today.fallbackTask, false, 'WaseShibu route must not become a universal planner field')

const ahead = report.studyAheadPlan
assert.equal(ahead.planKind, 'study-ahead')
assert.equal(ahead.date, '2026-09-17')
assert.equal(ahead.targetId, '75')
assert.deepEqual(ahead.pendingTaskIds, ['practice-2024-Q2-1'])
assert.deepEqual(ahead.completedTaskIds, [])
assert.equal(ahead.fallbackTask, undefined)
assert.equal(ahead.schoolEvidence.legacyQueueVersion, 3)

// Missing planner keys are valid absence and must not invent an empty persisted plan.
const empty = new MemoryStorage()
const emptyReport = planner.readWaseShibuCanonicalPlannerShadow(empty)
assert.deepEqual(emptyReport.issues, [])
assert.equal(emptyReport.todayRequiredPlan, null)
assert.equal(emptyReport.studyAheadPlan, null)
assert.equal(empty.writes, 0)

// Corrupt JSON must fail closed rather than be treated as an empty valid plan.
const corrupt = new MemoryStorage({ [TODAY_KEY]: '{bad json' })
const corruptReport = planner.readWaseShibuCanonicalPlannerShadow(corrupt)
assert.ok(corruptReport.issues.some(x => x.key === TODAY_KEY))
assert.equal(corruptReport.todayRequiredPlan, null)
assert.equal(corrupt.writes, 0)

// Unknown fields are potential migration data loss and therefore block projection.
const unknownField = new MemoryStorage({
  [TODAY_KEY]: JSON.stringify({
    date: '2026-09-16', target: 70, pendingIds: [], completedIds: [], queueVersion: 3, hiddenFutureField: true
  })
})
const unknownReport = planner.readWaseShibuCanonicalPlannerShadow(unknownField)
assert.ok(unknownReport.issues.some(x => x.message.includes('unsupported fields')))
assert.equal(unknownField.writes, 0)

// Invalid target identity must not be guessed from the current UI target.
const invalidTarget = new MemoryStorage({
  [AHEAD_KEY]: JSON.stringify({ date: '2026-09-17', target: 80, pendingIds: [], completedIds: [] })
})
const invalidTargetReport = planner.readWaseShibuCanonicalPlannerShadow(invalidTarget)
assert.ok(invalidTargetReport.issues.some(x => x.message.includes('unsupported WaseShibu legacy target')))
assert.equal(invalidTarget.writes, 0)

// Fallback task metadata is preserved only when its current persisted shape is valid.
const badFallback = new MemoryStorage({
  [TODAY_KEY]: JSON.stringify({
    date: '2026-09-16', target: 70, pendingIds: [], completedIds: [],
    fallbackTask: { id: 'x', kind: 'past-paper', title: 'x', detail: 'x', to: '/x', priority: 'high' }
  })
})
const badFallbackReport = planner.readWaseShibuCanonicalPlannerShadow(badFallback)
assert.ok(badFallbackReport.issues.some(x => x.message.includes('fallbackTask.priority')))
assert.equal(badFallback.writes, 0)

console.log('SHARED ENGINE PLANNER SHADOW TEST PASSED')
console.log('today-required and study-ahead persisted plans map read-only; task IDs stay opaque; WaseShibu routes remain school evidence; malformed state fails closed: OK')
