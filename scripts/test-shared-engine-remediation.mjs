import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-remediation-shadow-'))
const out = path.join(temp, 'out')
const emptyTypes = path.join(temp, 'types')
fs.mkdirSync(emptyTypes)

const entries = [
  'src/engine/remediationContract.ts',
  'src/schools/waseshibu/remediationCompatibility.ts',
  'src/schools/waseshibu/remediationLegacyReader.ts',
  'src/schools/waseshibu/remediationShadow.ts',
  'src/schools/waseshibu/remediationAudit.ts'
]

const compiled = spawnSync('tsc', [
  ...entries,
  '--outDir', out,
  '--module', 'commonjs',
  '--target', 'ES2022',
  '--lib', 'ES2022,DOM',
  '--esModuleInterop',
  '--typeRoots', emptyTypes,
  '--skipLibCheck',
  '--strict'
], { cwd: root, encoding: 'utf8' })
if (compiled.status !== 0) throw new Error(`remediation shadow modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

const runtimeSource = fs.readFileSync(path.join(root, 'src/remediationProgress.ts'), 'utf8')
for (const pinned of [
  "export const REMEDIATION_PROGRESS_STORAGE_KEY='waseshibu-math-remediation-progress-v1'",
  "const sourceQuestionId=String(v.sourceQuestionId||key)",
  "const rank=v.rank==='B'||v.rank==='C'?v.rank:'A'",
  "const streak=clamp(Number(v.streak||0),0,4)",
  "currentIndex:Math.max(0,Math.floor(Number(v.currentIndex)||0))",
  "attemptCount:Math.max(0,Math.floor(Number(v.attemptCount)||0))",
  "v.correctQuestionIdsInCurrentStreak.map(String).slice(-4)",
  "status:v.status==='completed'||streak>=4?'completed':'in-progress'"
]) {
  assert.ok(runtimeSource.includes(pinned), `active remediation loader drifted; review canonical parity pin: ${pinned}`)
}

class ReadOnlyMemoryStorage {
  constructor(seed = {}) {
    this.map = new Map(Object.entries(seed))
    this.reads = 0
  }
  getItem(key) {
    this.reads++
    return this.map.has(key) ? this.map.get(key) : null
  }
  snapshot() {
    return JSON.stringify([...this.map.entries()].sort(([a], [b]) => a.localeCompare(b)))
  }
}

const require = createRequire(import.meta.url)
const compatibility = require(path.join(out, 'schools/waseshibu/remediationCompatibility.js'))
const shadowModule = require(path.join(out, 'schools/waseshibu/remediationShadow.js'))
const auditModule = require(path.join(out, 'schools/waseshibu/remediationAudit.js'))

const key = compatibility.LEGACY_REMEDIATION_PROGRESS_KEY
const validRaw = {
  'legacy-key': {
    sourceQuestionId: '2024-Q1-1',
    field: '数式計算',
    rank: 'B',
    currentIndex: '2.9',
    streak: '3.8',
    attemptCount: '7.9',
    correctQuestionIdsInCurrentStreak: [1, 'field-2', 'field-3', 'field-4', 'field-5'],
    sourceAttemptAt: '2026-09-16T10:00:00.000Z',
    status: 'in-progress',
    updatedAt: '2026-09-16T10:10:00.000Z',
    futureLegacyField: { preserved: true }
  },
  '2024-Q1-2': {
    field: '方程式',
    rank: 'unsupported-rank',
    currentIndex: -4,
    streak: 9,
    attemptCount: -2,
    correctQuestionIdsInCurrentStreak: ['a', 'b', 'c', 'd', 'e'],
    status: 'in-progress',
    updatedAt: '2026-09-16T11:00:00.000Z'
  },
  '2024-Q1-3': {
    field: '関数',
    rank: 'C',
    currentIndex: 1,
    streak: 1,
    attemptCount: 2,
    correctQuestionIdsInCurrentStreak: ['x'],
    status: 'completed',
    updatedAt: '2026-09-16T12:00:00.000Z'
  }
}
const storage = new ReadOnlyMemoryStorage({ [key]: JSON.stringify(validRaw) })
const before = storage.snapshot()
const shadow = shadowModule.readWaseShibuCanonicalRemediationShadow(storage)
const after = storage.snapshot()
assert.equal(after, before, 'remediation shadow must not mutate source bytes')
assert.equal(shadow.present, true)
assert.deepEqual(shadow.issues, [])

const first = shadow.remediation.progressBySourceProblemId['2024-Q1-1']
assert.equal(first.sourceProblemId, '2024-Q1-1')
assert.equal(first.sourceActivityAt, '2026-09-16T10:00:00.000Z')
assert.equal(first.status, 'in-progress')
assert.equal(first.streak, 3)
assert.equal(first.attemptCount, 7)
assert.deepEqual(first.correctProblemIdsInCurrentStreak, ['field-2', 'field-3', 'field-4', 'field-5'])
assert.equal(first.schoolEvidence.legacyRecord.field, '数式計算')
assert.equal(first.schoolEvidence.legacyRecord.rank, 'B')
assert.equal(first.schoolEvidence.legacyRecord.currentIndex, 2)
assert.deepEqual(first.schoolEvidence.legacyRecord.futureLegacyField, { preserved: true })

const second = shadow.remediation.progressBySourceProblemId['2024-Q1-2']
assert.equal(second.status, 'completed', 'streak normalization to 4 forces completed exactly as current runtime')
assert.equal(second.streak, 4)
assert.equal(second.attemptCount, 0)
assert.equal(second.schoolEvidence.legacyRecord.rank, 'A')
assert.equal(second.schoolEvidence.legacyRecord.currentIndex, 0)
assert.deepEqual(second.correctProblemIdsInCurrentStreak, ['b', 'c', 'd', 'e'])

const third = shadow.remediation.progressBySourceProblemId['2024-Q1-3']
assert.equal(third.status, 'completed', 'explicit legacy completed status may coexist with streak < 4')
assert.equal(third.streak, 1)

const auditStorage = new ReadOnlyMemoryStorage({ [key]: JSON.stringify(validRaw) })
const auditBefore = auditStorage.snapshot()
const audit = auditModule.auditWaseShibuRemediationState(auditStorage)
assert.equal(audit.ok, true, audit.mismatches.map(x => `${x.surface}: ${x.message}`).join('\n'))
assert.deepEqual(audit.mismatches, [])
assert.equal(auditStorage.snapshot(), auditBefore)
assert.deepEqual(audit.legacyProjection, audit.canonicalShadow)

const missing = shadowModule.readWaseShibuCanonicalRemediationShadow(new ReadOnlyMemoryStorage())
assert.equal(missing.present, false)
assert.deepEqual(missing.issues, [])
assert.deepEqual(missing.remediation.progressBySourceProblemId, {})

const corruptStorage = new ReadOnlyMemoryStorage({ [key]: '{broken' })
const corruptAudit = auditModule.auditWaseShibuRemediationState(corruptStorage)
assert.equal(corruptAudit.ok, false)
assert.ok(corruptAudit.mismatches.some(x => x.surface === 'shadow' && x.message.includes('not valid JSON')))
assert.equal(corruptStorage.snapshot(), JSON.stringify([[key, '{broken']]))

const droppedStorage = new ReadOnlyMemoryStorage({ [key]: JSON.stringify({ kept: null }) })
const droppedAudit = auditModule.auditWaseShibuRemediationState(droppedStorage)
assert.equal(droppedAudit.ok, false)
assert.ok(droppedAudit.mismatches.some(x => x.message.includes('silently drop')))
assert.deepEqual(droppedAudit.canonicalShadow.progressBySourceProblemId, {})

const collisionStorage = new ReadOnlyMemoryStorage({
  [key]: JSON.stringify({
    first: {
      sourceQuestionId: 'same-source', field: 'A', currentIndex: 0, streak: 0, attemptCount: 0,
      correctQuestionIdsInCurrentStreak: [], updatedAt: '2026-09-16T01:00:00.000Z'
    },
    second: {
      sourceQuestionId: 'same-source', field: 'B', currentIndex: 1, streak: 1, attemptCount: 1,
      correctQuestionIdsInCurrentStreak: ['p1'], updatedAt: '2026-09-16T02:00:00.000Z'
    }
  })
})
const collisionAudit = auditModule.auditWaseShibuRemediationState(collisionStorage)
assert.equal(collisionAudit.ok, false, 'two raw keys that collapse to one runtime key must block migration')
assert.ok(collisionAudit.mismatches.some(x => x.message.includes('same source problem')))
assert.equal(collisionAudit.canonicalShadow.progressBySourceProblemId['same-source'].schoolEvidence.legacyRecord.field, 'B')
assert.deepEqual(collisionAudit.legacyProjection, collisionAudit.canonicalShadow, 'effective last-entry-wins state still mirrors runtime')

const invalidTimestampStorage = new ReadOnlyMemoryStorage({
  [key]: JSON.stringify({
    source: {
      field: 'A', currentIndex: 0, streak: 0, attemptCount: 0,
      correctQuestionIdsInCurrentStreak: [], updatedAt: 'not-a-date'
    }
  })
})
const invalidTimestamp = auditModule.auditWaseShibuRemediationState(invalidTimestampStorage)
assert.equal(invalidTimestamp.ok, false, 'ambiguous legacy time evidence must not be guessed during migration')
assert.ok(invalidTimestamp.mismatches.some(x => x.message.includes('valid timestamp')))

const infiniteCursorStorage = new ReadOnlyMemoryStorage({
  [key]: JSON.stringify({
    source: {
      field: 'A', currentIndex: 'Infinity', streak: 0, attemptCount: 0,
      correctQuestionIdsInCurrentStreak: [], updatedAt: '2026-09-16T00:00:00.000Z'
    }
  })
})
const infiniteCursor = auditModule.auditWaseShibuRemediationState(infiniteCursorStorage)
assert.equal(infiniteCursor.ok, false, 'non-finite runtime-normalized cursor must block canonical migration')
assert.ok(infiniteCursor.mismatches.some(x => x.message.includes('finite integer')))

console.log('SHARED ENGINE REMEDIATION STATE TEST PASSED')
console.log('runtime normalization parity, lossless school evidence, collision/data-loss blockers, zero writes: OK')
