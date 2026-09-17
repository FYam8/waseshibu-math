import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-daily-shadow-'))
const out = path.join(temp, 'out')
const emptyTypes = path.join(temp, 'types')
fs.mkdirSync(emptyTypes)

const entries = [
  'src/engine/appProfile.ts',
  'src/engine/examContract.ts',
  'src/engine/learnerState.ts',
  'src/schools/waseshibu/appProfile.ts',
  'src/schools/waseshibu/dailyCompatibility.ts',
  'src/schools/waseshibu/dailyShadow.ts',
  'src/schools/waseshibu/dailyAudit.ts',
  'src/storage.ts'
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
if (compiled.status !== 0) throw new Error(`daily-shadow modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

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
  'waseshibu-math-daily': JSON.stringify({
    date: '2026-09-16',
    questionIds: ['field-expressions-1', 'field-functions-1', 'field-geometry-1'],
    completed: false,
    queue: ['field-functions-1', 'field-geometry-1'],
    deferredOnce: ['field-geometry-1'],
    settled: 1,
    correctCount: 1,
    wrongCount: 0,
    deferredCount: 0,
    sessionElapsed: 143,
    updatedAt: '2026-09-16T15:00:00.000Z'
  })
}

const storage = new MemoryStorage(seed)
installStorage(storage)
const require = createRequire(import.meta.url)
const audit = require(path.join(out, 'schools/waseshibu/dailyAudit.js'))

const before = storage.snapshot()
const report = audit.auditWaseShibuDailyPractice()
const after = storage.snapshot()
assert.equal(report.ok, true, report.mismatches.map(x => `${x.surface}: ${x.message}`).join('\n'))
assert.deepEqual(report.mismatches, [])
assert.deepEqual(report.shadowIssues, [])
assert.equal(after, before)
assert.equal(storage.writes, 0, 'daily audit must perform zero storage writes')
assert.deepEqual(report.legacyProjection, report.canonicalShadow)
assert.deepEqual(report.canonicalShadow, {
  date: '2026-09-16',
  problemIds: ['field-expressions-1', 'field-functions-1', 'field-geometry-1'],
  completed: false,
  queueProblemIds: ['field-functions-1', 'field-geometry-1'],
  deferredOnceProblemIds: ['field-geometry-1'],
  settledCount: 1,
  correctCount: 1,
  wrongCount: 0,
  deferredCount: 0,
  elapsedSeconds: 143,
  updatedAt: '2026-09-16T15:00:00.000Z'
})

const empty = new MemoryStorage()
installStorage(empty)
const emptyReport = audit.auditWaseShibuDailyPractice()
assert.equal(emptyReport.ok, true)
assert.equal(emptyReport.canonicalShadow, null)
assert.equal(empty.writes, 0)

// loadDaily() currently falls back to null on corrupt JSON. Migration must not
// mistake that fallback for a valid empty history: corruption fails closed.
const corrupt = new MemoryStorage({ 'waseshibu-math-daily': '{bad json' })
installStorage(corrupt)
const corruptReport = audit.auditWaseShibuDailyPractice()
assert.equal(corruptReport.ok, false)
assert.ok(corruptReport.mismatches.some(x => x.surface === 'shadow'))
assert.equal(corrupt.writes, 0)

// The current reader performs no shape validation. Canonical migration does:
// unsupported shapes must block migration rather than be guessed or coerced.
const malformed = new MemoryStorage({
  'waseshibu-math-daily': JSON.stringify({ date: '2026-09-16', questionIds: 'not-an-array', completed: false })
})
installStorage(malformed)
const malformedReport = audit.auditWaseShibuDailyPractice()
assert.equal(malformedReport.ok, false)
assert.ok(malformedReport.mismatches.some(x => x.surface === 'dailyPractice' || x.surface === 'shadow'))
assert.equal(malformed.writes, 0)

// Unknown fields are migration-risk evidence. Do not silently discard them.
const unknown = new MemoryStorage({
  'waseshibu-math-daily': JSON.stringify({ date: '2026-09-16', questionIds: [], completed: true, futureField: 1 })
})
installStorage(unknown)
const unknownReport = audit.auditWaseShibuDailyPractice()
assert.equal(unknownReport.ok, false)
assert.ok(unknownReport.mismatches.some(x => x.message.includes('unsupported fields')))
assert.equal(unknown.writes, 0)

console.log('SHARED ENGINE DAILY PRACTICE SHADOW TEST PASSED')
console.log('actual loadDaily == canonical daily-practice shadow; corrupt/malformed/unknown state fails closed; zero writes: OK')
