import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-prep-audit-'))
const out = path.join(temp, 'out')
const emptyTypes = path.join(temp, 'types')
fs.mkdirSync(emptyTypes)

const entries = [
  'src/engine/appProfile.ts',
  'src/engine/examContract.ts',
  'src/engine/learnerState.ts',
  'src/schools/waseshibu/appProfile.ts',
  'src/schools/waseshibu/prepCompatibility.ts',
  'src/schools/waseshibu/prepShadow.ts',
  'src/schools/waseshibu/prepAudit.ts',
  'src/preflight.ts',
  'src/dataMigration.ts',
  'src/version.ts',
  'src/appConfig.ts'
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
if (compiled.status !== 0) throw new Error(`prep-audit modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

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
}

const PREP_KEY = 'waseshibu-math-prep-check-v1'
const require = createRequire(import.meta.url)
const prepAudit = require(path.join(out, 'schools/waseshibu/prepAudit.js'))

function install(storage) {
  globalThis.localStorage = storage
  globalThis.sessionStorage = new MemoryStorage()
}

const valid = new MemoryStorage({
  [PREP_KEY]: JSON.stringify({
    version: 1,
    index: '3',
    answers: { 'prep-1': 6, 'prep-2': '-3', 'school-local-item': 'memo' },
    tries: { 'prep-1': '2.8', 'prep-2': -4 },
    completed: false,
    skipped: true,
    updatedAt: '2026-09-16T18:00:00.000Z'
  })
})
install(valid)
const validReport = prepAudit.auditWaseShibuPrepState()
assert.equal(validReport.ok, true, validReport.mismatches.map(x => x.message).join('\n'))
assert.deepEqual(validReport.mismatches, [])
assert.equal(valid.writes, 0, 'prep audit must perform zero writes')
assert.equal(validReport.canonicalShadow.currentItemIndex, 3)
assert.deepEqual(validReport.canonicalShadow.answersByItemId, {
  'prep-1': '6',
  'prep-2': '-3',
  'school-local-item': 'memo'
})
assert.deepEqual(validReport.canonicalShadow.triesByItemId, { 'prep-1': 2, 'prep-2': 0 })
assert.equal(validReport.canonicalShadow.completed, false)
assert.equal(validReport.canonicalShadow.skipped, true)
assert.equal(validReport.canonicalShadow.schoolEvidence.legacyVersion, 1)
assert.deepEqual(validReport.legacyProjection, validReport.canonicalShadow)

// Current runtime clamps a numeric/string index into the five-item range.
const clamped = new MemoryStorage({
  [PREP_KEY]: JSON.stringify({ index: 99, answers: {}, tries: {}, completed: false, skipped: false })
})
install(clamped)
const clampedReport = prepAudit.auditWaseShibuPrepState()
assert.equal(clampedReport.ok, true, clampedReport.mismatches.map(x => x.message).join('\n'))
assert.equal(clampedReport.canonicalShadow.currentItemIndex, 4)
assert.equal(clampedReport.canonicalShadow.updatedAt, '1970-01-01T00:00:00.000Z')
assert.equal(clamped.writes, 0)

// Absence is not persisted as an invented default canonical record.
const absent = new MemoryStorage()
install(absent)
const absentReport = prepAudit.auditWaseShibuPrepState()
assert.equal(absentReport.ok, true)
assert.equal(absentReport.canonicalShadow, null)
assert.equal(absentReport.legacyProjection, null)
assert.equal(absent.writes, 0)

// A persisted null follows today's runtime defaulting semantics while exact raw
// bytes remain available to the later aggregate rollback snapshot.
const persistedNull = new MemoryStorage({ [PREP_KEY]: 'null' })
install(persistedNull)
const nullReport = prepAudit.auditWaseShibuPrepState()
assert.equal(nullReport.ok, true, nullReport.mismatches.map(x => x.message).join('\n'))
assert.equal(nullReport.canonicalShadow.currentItemIndex, 0)
assert.deepEqual(nullReport.canonicalShadow.answersByItemId, {})
assert.equal(persistedNull.writes, 0)

// Corrupt JSON must not be mistaken for valid empty prep state.
const corrupt = new MemoryStorage({ [PREP_KEY]: '{bad json' })
install(corrupt)
const corruptReport = prepAudit.auditWaseShibuPrepState()
assert.equal(corruptReport.ok, false)
assert.ok(corruptReport.mismatches.some(x => x.surface === 'shadow'))
assert.equal(corrupt.writes, 0)

// Unknown fields are currently carried through normalizePrepRecord's spread;
// migration must stop rather than silently discard them from canonical state.
const unknown = new MemoryStorage({
  [PREP_KEY]: JSON.stringify({ index: 0, answers: {}, tries: {}, completed: false, skipped: false, futureField: 1 })
})
install(unknown)
const unknownReport = prepAudit.auditWaseShibuPrepState()
assert.equal(unknownReport.ok, false)
assert.ok(unknownReport.mismatches.some(x => x.message.includes('unsupported fields')))
assert.equal(unknown.writes, 0)

// Future prep schema versions are forced back to v1 by today's loader; migration
// refuses that lossy downgrade until an explicit future-version policy exists.
const futureVersion = new MemoryStorage({
  [PREP_KEY]: JSON.stringify({ version: 2, index: 0, answers: {}, tries: {}, completed: false, skipped: false })
})
install(futureVersion)
const futureVersionReport = prepAudit.auditWaseShibuPrepState()
assert.equal(futureVersionReport.ok, false)
assert.ok(futureVersionReport.mismatches.some(x => x.message.includes('unsupported persisted prep version')))
assert.equal(futureVersion.writes, 0)

// Values that today's normalizer would silently filter must block migration.
const filteredAnswer = new MemoryStorage({
  [PREP_KEY]: JSON.stringify({ index: 0, answers: { 'prep-1': true }, tries: {}, completed: false, skipped: false })
})
install(filteredAnswer)
const filteredAnswerReport = prepAudit.auditWaseShibuPrepState()
assert.equal(filteredAnswerReport.ok, false)
assert.ok(filteredAnswerReport.mismatches.some(x => x.message.includes('would be filtered')))
assert.equal(filteredAnswer.writes, 0)

// A fractional index is parseable by the current loader but unsafe for the UI
// and cannot become a canonical preparation cursor without guessing.
const fractionalIndex = new MemoryStorage({
  [PREP_KEY]: JSON.stringify({ index: 1.5, answers: {}, tries: {}, completed: false, skipped: false })
})
install(fractionalIndex)
const fractionalReport = prepAudit.auditWaseShibuPrepState()
assert.equal(fractionalReport.ok, false)
assert.ok(fractionalReport.mismatches.some(x => x.message.includes('fractional') || x.message.includes('outside the current five-item contract')))
assert.equal(fractionalIndex.writes, 0)

console.log('SHARED ENGINE PREP CHECK AUDIT PASSED')
console.log('actual loadPrepState == strict canonical shadow for valid persisted prep data; absence stays absent; future/filtered/fractional state fails closed; zero writes: OK')
