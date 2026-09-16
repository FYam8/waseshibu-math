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
  'src/schools/waseshibu/activityCompatibility.ts',
  'src/schools/waseshibu/activityShadow.ts',
  'src/schools/waseshibu/activityAudit.ts',
  'src/schools/waseshibu/dailyCompatibility.ts',
  'src/schools/waseshibu/dailyShadow.ts',
  'src/schools/waseshibu/dailyAudit.ts',
  'src/schools/waseshibu/plannerCompatibility.ts',
  'src/schools/waseshibu/plannerShadow.ts',
  'src/schools/waseshibu/plannerLegacyReader.ts',
  'src/schools/waseshibu/plannerAudit.ts',
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
  'waseshibu-math-attempts': JSON.stringify([
    {
      id: 'attempt-exam', questionId: 'exam-2024-Q1-1', mode: 'multi', topic: '数式計算',
      status: 'wrong', answer: '5', seconds: 30, at: '2026-09-11T10:05:00.000Z'
    },
    {
      id: 'attempt-exposure', questionId: 'exposure-2025', mode: 'multi', topic: '2025年度 過去問',
      status: 'deferred', at: '2026-09-12T09:00:00.000Z'
    },
    {
      id: 'attempt-mastery', questionId: 'mastery-expressions', mode: 'multi', topic: '式の計算',
      status: 'correct', at: '2026-09-12T11:00:00.000Z'
    }
  ]),
  'waseshibu-math-daily': JSON.stringify({
    date: '2026-09-16',
    questionIds: ['field-expressions-1', 'field-equations-1'],
    completed: false,
    queue: ['field-equations-1'],
    deferredOnce: ['field-expressions-1'],
    settled: 1,
    correctCount: 0,
    wrongCount: 1,
    deferredCount: 1,
    sessionElapsed: 92,
    updatedAt: '2026-09-16T08:30:00.000Z'
  }),
  'waseshibu-math-daily-required-plan-v2': JSON.stringify({
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
  'waseshibu-math-study-ahead-plan-v1': JSON.stringify({
    date: '2026-09-17',
    target: 75,
    pendingIds: ['practice-2024-Q2-1'],
    completedIds: [],
    queueVersion: 3
  }),
  // Deliberately outside the expanded rehearsal scope: it must remain untouched.
  'waseshibu-math-guided-progress-v2': JSON.stringify({
    '2024-Q1-1': { questionId: '2024-Q1-1', mastery: 'attempted', updatedAt: '2026-09-16T07:00:00.000Z' }
  })
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
assert.equal(report.rehearsalContractVersion, 3)
assert.deepEqual(report.scope, [
  'preferences',
  'examResults',
  'drafts',
  'route',
  'activityRecords',
  'dailyPractice',
  'todayRequiredPlan',
  'studyAheadPlan'
])
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
assert.equal(report.canonicalCandidate.activityRecords.length, 3)
const activities = new Map(report.canonicalCandidate.activityRecords.map(record => [record.id, record]))
assert.equal(activities.get('attempt-exam').kind, 'problem-attempt')
assert.equal(activities.get('attempt-exam').examId, 'waseshibu-2024')
assert.equal(activities.get('attempt-exam').deviceId, 'legacy-device')
assert.equal(activities.get('attempt-exam').resetVersion, 4)
assert.equal(activities.get('attempt-exposure').kind, 'exam-exposure')
assert.equal(activities.get('attempt-exposure').examId, 'waseshibu-2025')
assert.equal(activities.get('attempt-mastery').kind, 'mastery-marker')

assert.equal(report.canonicalCandidate.dailyPractice.date, '2026-09-16')
assert.deepEqual(report.canonicalCandidate.dailyPractice.problemIds, ['field-expressions-1', 'field-equations-1'])
assert.deepEqual(report.canonicalCandidate.dailyPractice.queueProblemIds, ['field-equations-1'])
assert.equal(report.canonicalCandidate.dailyPractice.elapsedSeconds, 92)

assert.equal(report.canonicalCandidate.todayRequiredPlan.planKind, 'today-required')
assert.equal(report.canonicalCandidate.todayRequiredPlan.targetId, '70')
assert.deepEqual(report.canonicalCandidate.todayRequiredPlan.pendingTaskIds, ['review-2024-Q1-1', 'progression:/past-papers?year=2025'])
assert.equal(report.canonicalCandidate.todayRequiredPlan.fallbackTask.taskId, 'progression:/past-papers?year=2025')
assert.equal(report.canonicalCandidate.todayRequiredPlan.fallbackTask.schoolEvidence.legacyRoute, '/past-papers?year=2025')
assert.equal(report.canonicalCandidate.studyAheadPlan.planKind, 'study-ahead')
assert.equal(report.canonicalCandidate.studyAheadPlan.targetId, '75')
assert.deepEqual(report.canonicalCandidate.studyAheadPlan.pendingTaskIds, ['practice-2024-Q2-1'])

assert.equal(report.sourceSnapshot['waseshibu-math-data-version'], '8')
assert.equal(report.sourceSnapshot['waseshibu-math-attempts'], seed['waseshibu-math-attempts'])
assert.equal(report.sourceSnapshot['waseshibu-math-daily'], seed['waseshibu-math-daily'])
assert.equal(report.sourceSnapshot['waseshibu-math-daily-required-plan-v2'], seed['waseshibu-math-daily-required-plan-v2'])
assert.equal(report.sourceSnapshot['waseshibu-math-study-ahead-plan-v1'], seed['waseshibu-math-study-ahead-plan-v1'])
assert.equal(
  Object.prototype.hasOwnProperty.call(report.sourceSnapshot, 'waseshibu-math-guided-progress-v2'),
  false,
  'unmigrated surfaces must not be implied by the rehearsal snapshot'
)

// Rollback rehearsal: corrupt only source surfaces in an isolated clone, then
// restore exact captured strings. This proves byte-for-byte restoration across
// attempts, daily practice and both scheduler plans before any production write.
const rollbackClone = new MemoryStorage(seed)
rollbackClone.setItem('waseshibu-math-preferences', '{"target":60}')
rollbackClone.removeItem('waseshibu-math-exam-scores')
rollbackClone.setItem('waseshibu-math-attempts', '[]')
rollbackClone.setItem('waseshibu-math-daily', 'null')
rollbackClone.removeItem('waseshibu-math-daily-required-plan-v2')
rollbackClone.setItem('waseshibu-math-study-ahead-plan-v1', '{"date":"2099-01-01"}')
rollbackClone.setItem('waseshibu-math-data-version', '999')
for (const key of rehearsal.WASESHIBU_REHEARSAL_SOURCE_KEYS) {
  const raw = report.sourceSnapshot[key]
  if (raw === null) rollbackClone.removeItem(key)
  else rollbackClone.setItem(key, raw)
}
for (const key of rehearsal.WASESHIBU_REHEARSAL_SOURCE_KEYS) {
  assert.equal(rollbackClone.getItem(key), seed[key] ?? null, `rollback source byte parity: ${key}`)
}
assert.equal(
  rollbackClone.getItem('waseshibu-math-guided-progress-v2'),
  seed['waseshibu-math-guided-progress-v2'],
  'rollback rehearsal must not touch out-of-scope guided progress'
)

// Duplicate result IDs are readable today, but canonical cutover must stop
// until an explicit no-loss duplicate policy exists.
const duplicateResultStorage = new MemoryStorage({
  'waseshibu-math-data-version': '8',
  'waseshibu-math-preferences': JSON.stringify({ target: 70 }),
  'waseshibu-math-exam-scores': JSON.stringify([
    { id: 'duplicate', year: 2024, score: 60, at: '2026-09-01T00:00:00.000Z' },
    { id: 'duplicate', year: 2025, score: 70, at: '2026-09-02T00:00:00.000Z' }
  ])
})
installStorage(duplicateResultStorage)
const duplicateResult = rehearsal.rehearseWaseShibuCanonicalMigration()
assert.equal(duplicateResult.ready, false, 'duplicate result identities must block migration rehearsal')
assert.ok(duplicateResult.issues.some(x => x.message.includes('duplicate result id')))
assert.equal(duplicateResultStorage.writes, 0)

// Attempt IDs may also be duplicated in legacy raw data. Preserve the source
// bytes, but stop the migration until a no-loss identity policy is explicit.
const duplicateActivityStorage = new MemoryStorage({
  'waseshibu-math-data-version': '8',
  'waseshibu-math-preferences': JSON.stringify({ target: 70 }),
  'waseshibu-math-attempts': JSON.stringify([
    { id: 'duplicate-activity', questionId: 'field-expressions-1', status: 'wrong', at: '2026-09-01T00:00:00.000Z' },
    { id: 'duplicate-activity', questionId: 'field-equations-1', status: 'correct', at: '2026-09-02T00:00:00.000Z' }
  ])
})
installStorage(duplicateActivityStorage)
const duplicateActivity = rehearsal.rehearseWaseShibuCanonicalMigration()
assert.equal(duplicateActivity.ready, false, 'duplicate activity identities must block migration rehearsal')
assert.ok(duplicateActivity.issues.some(x => x.message.includes('duplicate activity id')))
assert.equal(duplicateActivityStorage.writes, 0)

// A record silently filtered by today's loadAttempts() is a data-loss risk for
// migration, so aggregate rehearsal must inherit the activity audit's fail-close.
const filteredActivityStorage = new MemoryStorage({
  'waseshibu-math-data-version': '8',
  'waseshibu-math-preferences': JSON.stringify({ target: 70 }),
  'waseshibu-math-attempts': JSON.stringify([{ id: 'missing-question', at: '2026-09-01T00:00:00.000Z' }])
})
installStorage(filteredActivityStorage)
const filteredActivity = rehearsal.rehearseWaseShibuCanonicalMigration()
assert.equal(filteredActivity.ready, false)
assert.ok(filteredActivity.issues.some(x => x.surface.startsWith('activity:') || x.surface === 'activityRecords'))
assert.equal(filteredActivityStorage.writes, 0)

// Parseable but malformed daily practice must block the aggregate rehearsal.
const malformedDailyStorage = new MemoryStorage({
  'waseshibu-math-data-version': '8',
  'waseshibu-math-preferences': JSON.stringify({ target: 70 }),
  'waseshibu-math-daily': JSON.stringify({ date: '2026-09-16', questionIds: 'not-an-array', completed: false })
})
installStorage(malformedDailyStorage)
const malformedDaily = rehearsal.rehearseWaseShibuCanonicalMigration()
assert.equal(malformedDaily.ready, false)
assert.ok(malformedDaily.issues.some(x => x.surface === 'dailyPractice' || x.surface.startsWith('daily:')))
assert.equal(malformedDailyStorage.writes, 0)

// Unsupported planner target/shape must fail closed even though legacy runtime
// readers can fall back or ignore broken state.
const malformedPlannerStorage = new MemoryStorage({
  'waseshibu-math-data-version': '8',
  'waseshibu-math-preferences': JSON.stringify({ target: 70 }),
  'waseshibu-math-daily-required-plan-v2': JSON.stringify({
    date: '2026-09-16', target: 80, pendingIds: [], completedIds: [], queueVersion: 3
  })
})
installStorage(malformedPlannerStorage)
const malformedPlanner = rehearsal.rehearseWaseShibuCanonicalMigration()
assert.equal(malformedPlanner.ready, false)
assert.ok(malformedPlanner.issues.some(x => x.surface === 'todayRequiredPlan' || x.surface.startsWith('planner:')))
assert.equal(malformedPlannerStorage.writes, 0)

// Unmappable legacy route state fails closed and still remains read-only.
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
console.log('legacy -> canonical candidate includes activities + daily practice + both scheduler plans, exact source rollback evidence, fail-closed malformed state and zero production writes: OK')
