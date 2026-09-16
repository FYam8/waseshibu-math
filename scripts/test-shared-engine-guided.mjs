import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-guided-audit-'))
const out = path.join(temp, 'out')
const emptyTypes = path.join(temp, 'types')
fs.mkdirSync(emptyTypes)

const entries = [
  'src/engine/examContract.ts',
  'src/engine/learnerState.ts',
  'src/schools/waseshibu/guidedCompatibility.ts',
  'src/schools/waseshibu/guidedShadow.ts',
  'src/schools/waseshibu/guidedLegacyReader.ts',
  'src/schools/waseshibu/guidedAudit.ts'
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
if (compiled.status !== 0) throw new Error(`guided-audit modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

// Pin the read-only mirror to the actual current private readers. This avoids
// importing the content-heavy guided runtime just to audit storage semantics,
// while still making any reader drift fail the build until the mirror is
// reviewed deliberately.
const guidedSource = fs.readFileSync(path.join(root, 'src/guidedReview.ts'), 'utf8')
assert.ok(guidedSource.includes("const raw=JSON.parse(storage.getItem(GUIDED_REVIEW_KEY)||'{}');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}"), 'guided-review reader semantics drifted')
assert.ok(guidedSource.includes("const value=JSON.parse(storage.getItem(GUIDED_PROGRESS_KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}"), 'guided-progress reader semantics drifted')

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
}

const require = createRequire(import.meta.url)
const auditModule = require(path.join(out, 'schools/waseshibu/guidedAudit.js'))
const shadowModule = require(path.join(out, 'schools/waseshibu/guidedShadow.js'))

const seed = {
  'waseshibu-math-guided-review-v1': JSON.stringify({
    '2024-Q1-1': {
      questionId: '2024-Q1-1',
      step1: 'まず式を整理する',
      step2: '次に計算する',
      finalAnswer: '5',
      hintUsed: true,
      answerSeen: true,
      outcome: 'guided',
      updatedAt: '2026-09-10T10:00:00.000Z'
    }
  }),
  'waseshibu-math-guided-progress-v2': JSON.stringify({
    '2024-Q1-1': {
      questionId: '2024-Q1-1',
      currentStepId: 'method',
      stepProgress: {
        focus: {
          stepId: 'focus', answer: '式の形を見る', tries: 1,
          hintLevelUsed: 1, completed: true, selfAssessment: 'guided'
        },
        method: {
          stepId: 'method', answer: '6になる', tries: 2,
          hintLevelUsed: 0, completed: true, selfAssessment: 'matched'
        }
      },
      finalAnswer: '6',
      finalAnswerSeen: true,
      reproductionAttempts: 2,
      reproductionSucceeded: true,
      independentSucceeded: false,
      practiceStreak: 4,
      mastery: 'consolidated',
      dependencyMode: 'official',
      updatedAt: '2026-09-12T12:00:00.000Z',
      migratedFrom: 'waseshibu-math-guided-review-v1'
    }
  })
}

const storage = new MemoryStorage(seed)
installStorage(storage)
const before = storage.snapshot()
const report = auditModule.auditWaseShibuGuidedState(storage)
const after = storage.snapshot()

assert.equal(report.ok, true, report.mismatches.map(x => `${x.surface}: ${x.message}`).join('\n'))
assert.deepEqual(report.mismatches, [])
assert.equal(after, before)
assert.equal(storage.writes, 0, 'guided audit must perform zero writes')
assert.equal(report.canonicalShadow.legacyReviewPresent, true)
assert.equal(report.canonicalShadow.progressPresent, true)

const progress = report.canonicalShadow.guidedLearning.progressByProblemId['2024-Q1-1']
assert.equal(progress.mastery, 'consolidated')
assert.equal(progress.finalAnswerText, '6')
assert.equal(progress.practiceStreak, 4)
assert.equal(progress.currentStepId, 'method')
assert.equal(progress.stepsById.focus.maxHintLevelUsed, 1)
assert.equal(progress.stepsById.method.tries, 2)
assert.equal(progress.schoolEvidence.legacyDependencyMode, 'official')
assert.equal(progress.schoolEvidence.migratedFrom, 'waseshibu-math-guided-review-v1')

const legacyEvidence = report.canonicalShadow.guidedLearning.schoolEvidence.legacyReviewByProblemId['2024-Q1-1']
assert.equal(legacyEvidence.finalAnswer, '5')
assert.equal(legacyEvidence.outcome, 'guided')
assert.notEqual(legacyEvidence.finalAnswer, progress.finalAnswerText, 'v1 compatibility evidence may legitimately diverge from active v2 progress')
assert.notEqual(legacyEvidence.outcome, progress.mastery, 'v1 and v2 must not be forced into false mastery parity')

// Absence means no persisted guided record. The runtime readers return {}, but
// migration must not invent a persisted default record.
const emptyStorage = new MemoryStorage()
installStorage(emptyStorage)
const empty = auditModule.auditWaseShibuGuidedState(emptyStorage)
assert.equal(empty.ok, true)
assert.equal(empty.canonicalShadow.legacyReviewPresent, false)
assert.equal(empty.canonicalShadow.progressPresent, false)
assert.deepEqual(empty.canonicalShadow.guidedLearning.progressByProblemId, {})
assert.deepEqual(empty.canonicalShadow.guidedLearning.schoolEvidence.legacyReviewByProblemId, {})
assert.equal(emptyStorage.writes, 0)

// Corrupt JSON is forgiving in today's reader, but unsafe for migration because
// source bytes would otherwise disappear behind an empty object.
const corrupt = new MemoryStorage({ 'waseshibu-math-guided-progress-v2': '{broken' })
installStorage(corrupt)
const corruptReport = auditModule.auditWaseShibuGuidedState(corrupt)
assert.equal(corruptReport.ok, false)
assert.ok(corruptReport.mismatches.some(x => x.surface === 'shadow'))
assert.equal(corrupt.writes, 0)

// Unknown record fields must not be silently discarded. `migratedFrom` is the
// one historical migration field deliberately recognized and preserved.
const unknownField = new MemoryStorage({
  'waseshibu-math-guided-progress-v2': JSON.stringify({
    '2024-Q1-1': {
      questionId: '2024-Q1-1', stepProgress: {}, finalAnswer: '', finalAnswerSeen: false,
      reproductionAttempts: 0, reproductionSucceeded: false, independentSucceeded: false,
      practiceStreak: 0, mastery: 'unseen', updatedAt: '2026-09-01T00:00:00.000Z', surprise: true
    }
  })
})
installStorage(unknownField)
const unknownFieldReport = auditModule.auditWaseShibuGuidedState(unknownField)
assert.equal(unknownFieldReport.ok, false)
assert.ok(unknownFieldReport.mismatches.some(x => x.message.includes('unsupported field')))
assert.equal(unknownField.writes, 0)

// A key/questionId mismatch is unreachable through loadGuidedProgress(id) and
// therefore a data-loss risk, not something migration may rename speculatively.
const mismatchedId = new MemoryStorage({
  'waseshibu-math-guided-progress-v2': JSON.stringify({
    '2024-Q1-1': {
      questionId: '2024-Q1-2', stepProgress: {}, finalAnswer: '', finalAnswerSeen: false,
      reproductionAttempts: 0, reproductionSucceeded: false, independentSucceeded: false,
      practiceStreak: 0, mastery: 'unseen', updatedAt: '2026-09-01T00:00:00.000Z'
    }
  })
})
installStorage(mismatchedId)
const mismatchedIdReport = auditModule.auditWaseShibuGuidedState(mismatchedId)
assert.equal(mismatchedIdReport.ok, false)
assert.ok(mismatchedIdReport.mismatches.some(x => x.message.includes('key/questionId mismatch')))
assert.equal(mismatchedId.writes, 0)

// Fractional counters are accepted as raw JS values by the current reader but
// cannot be represented as trustworthy guided attempt counts without guessing.
const fractional = new MemoryStorage({
  'waseshibu-math-guided-progress-v2': JSON.stringify({
    '2024-Q1-1': {
      questionId: '2024-Q1-1',
      stepProgress: { focus: { stepId: 'focus', answer: 'x', tries: 1.5, hintLevelUsed: 0, completed: false } },
      finalAnswer: '', finalAnswerSeen: false,
      reproductionAttempts: 0, reproductionSucceeded: false, independentSucceeded: false,
      practiceStreak: 0, mastery: 'attempted', updatedAt: '2026-09-01T00:00:00.000Z'
    }
  })
})
installStorage(fractional)
const fractionalReport = auditModule.auditWaseShibuGuidedState(fractional)
assert.equal(fractionalReport.ok, false)
assert.ok(fractionalReport.mismatches.some(x => x.message.includes('non-negative integer')))
assert.equal(fractional.writes, 0)

// Legacy-review unknown fields also fail closed because v1 is still read/written
// as compatibility evidence by the current GuidedReview UI.
const legacyUnknown = new MemoryStorage({
  'waseshibu-math-guided-review-v1': JSON.stringify({
    '2024-Q1-1': {
      questionId: '2024-Q1-1', step1: '', step2: '', finalAnswer: '6',
      hintUsed: false, answerSeen: false, updatedAt: '2026-09-01T00:00:00.000Z', oldExtra: 'x'
    }
  })
})
installStorage(legacyUnknown)
const legacyUnknownReport = auditModule.auditWaseShibuGuidedState(legacyUnknown)
assert.equal(legacyUnknownReport.ok, false)
assert.ok(legacyUnknownReport.mismatches.some(x => x.message.includes('unsupported field')))
assert.equal(legacyUnknown.writes, 0)

// Direct shadow invocation is also read-only.
const shadowStorage = new MemoryStorage(seed)
const shadowBefore = shadowStorage.snapshot()
shadowModule.readWaseShibuCanonicalGuidedShadow(shadowStorage)
assert.equal(shadowStorage.snapshot(), shadowBefore)
assert.equal(shadowStorage.writes, 0)

console.log('SHARED ENGINE GUIDED STATE AUDIT TEST PASSED')
console.log('guided-progress-v2 stays authoritative, guided-review-v1 remains compatibility evidence, zero writes and fail-closed malformed-state detection: OK')
