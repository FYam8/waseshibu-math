import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-shared-engine-'))
const out = path.join(temp, 'out')
const emptyTypes = path.join(temp, 'types')
fs.mkdirSync(emptyTypes)

const entries = [
  'src/engine/appProfile.ts',
  'src/engine/examContract.ts',
  'src/schools/waseshibu/appProfile.ts',
  'src/schools/waseshibu/legacyCompatibility.ts'
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

if (compiled.status !== 0) {
  throw new Error(`shared-engine compatibility modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)
}

const require = createRequire(import.meta.url)
const load = rel => require(path.join(out, rel))
const examContract = load('engine/examContract.js')
const schoolProfile = load('schools/waseshibu/appProfile.js')
const compat = load('schools/waseshibu/legacyCompatibility.js')

const profile = schoolProfile.WASESHIBU_APP_PROFILE
assert.equal(profile.id, 'waseshibu')
assert.deepEqual(profile.supportedYears, [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026])
assert.deepEqual(profile.targets.map(x => [x.id, x.scoreThreshold, x.legacyValue]), [
  ['60', 60, 60],
  ['70', 70, 70],
  ['75', 75, 75]
])
assert.equal(profile.runtime.storageNamespace, 'waseshibu-math')
assert.equal(profile.runtime.backupAppId, 'waseshibu-math')
assert.equal(profile.runtime.updateChannel, 'waseshibu-math-updates')
assert.equal(profile.runtime.progressSync.indexedDbName, 'waseshibu-progress-sync')
assert.equal(profile.runtime.progressSync.appId, 'math')

assert.equal(compat.WASESHIBU_EXAM_CATALOG.length, 8)
for (const year of profile.supportedYears) {
  const examId = compat.examIdForLegacyYear(year)
  assert.equal(examId, `waseshibu-${year}`)
  assert.equal(compat.legacyYearForExamId(examId), year)
}
assert.throws(() => compat.examIdForLegacyYear(2027), /unsupported WaseShibu exam year/)
assert.throws(() => compat.legacyYearForExamId('R25-MATH-A'), /unsupported WaseShibu examId/)

for (const target of [60, 70, 75]) {
  const targetId = compat.targetIdForLegacyTarget(target)
  assert.equal(targetId, String(target))
  assert.equal(compat.legacyTargetForTargetId(targetId), target)
}
assert.throws(() => compat.targetIdForLegacyTarget(80), /unsupported WaseShibu legacy target/)

const legacyDrafts = {
  '2024': { answers: { '2024-Q1-1': '6' }, seconds: 10 },
  '2025': { answers: { '2025-Q1-1': '8' }, seconds: 20 }
}
const canonicalDrafts = compat.mapLegacyYearKeyedRecord(legacyDrafts)
assert.deepEqual(canonicalDrafts, {
  'waseshibu-2024': legacyDrafts['2024'],
  'waseshibu-2025': legacyDrafts['2025']
})
assert.deepEqual(legacyDrafts, {
  '2024': { answers: { '2024-Q1-1': '6' }, seconds: 10 },
  '2025': { answers: { '2025-Q1-1': '8' }, seconds: 20 }
}, 'pure mapping must not mutate legacy source')
assert.throws(() => compat.mapLegacyYearKeyedRecord({ foo: {} }), /invalid legacy year key/)

assert.deepEqual(compat.mapLegacyCompletionByTarget({
  '60': [2024],
  '70': [2024, 2023, 2023],
  '75': [2024, 2023, 2022]
}), {
  '60': ['waseshibu-2024'],
  '70': ['waseshibu-2024', 'waseshibu-2023'],
  '75': ['waseshibu-2024', 'waseshibu-2023', 'waseshibu-2022']
})

for (const phase of profile.learningPhases) {
  assert.ok(Array.isArray(phase.examIds) && phase.examIds.length > 0, `phase ${phase.step} must bind to examId`)
  for (const examId of phase.examIds) assert.equal(compat.legacyYearForExamId(examId), phase.year)
}

const scored = examContract.assertCanonicalExamResult({
  id: 'score-1',
  examId: 'waseshibu-2024',
  completed: true,
  at: '2026-01-01T00:00:00.000Z',
  score: 70,
  maxScore: 100,
  scoreAuthority: 'official',
  correctCount: 14,
  wrongCount: 6,
  unansweredCount: 0
})
assert.equal(scored.score, 70)

const unscored = examContract.assertCanonicalExamResult({
  id: 'rikkyo-example',
  examId: 'R25-MATH-A',
  completed: true,
  at: '2026-01-01T00:00:00.000Z',
  scoreAuthority: 'not-available',
  correctCount: 31,
  wrongCount: 8,
  unansweredCount: 0
})
assert.equal(unscored.score, undefined)
assert.throws(() => examContract.assertCanonicalExamResult({
  id: 'bad-1', examId: 'R25-MATH-A', completed: true, at: '2026-01-01T00:00:00.000Z', scoreAuthority: 'official'
}), /unscored result must use not-available authority/)
assert.throws(() => examContract.assertCanonicalExamResult({
  id: 'bad-2', examId: 'R25-MATH-A', completed: true, at: '2026-01-01T00:00:00.000Z', score: 50, maxScore: 100, scoreAuthority: 'not-available'
}), /scored result cannot use not-available authority/)

console.log('SHARED ENGINE COMPATIBILITY TEST PASSED')
console.log('examId/year bridge, targetId/legacy bridge, score authority, and WaseShibu identity preservation: OK')
