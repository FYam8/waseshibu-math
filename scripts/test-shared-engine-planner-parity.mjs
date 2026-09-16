import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-planner-parity-'))
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
  'src/schools/waseshibu/plannerShadow.ts',
  'src/schools/waseshibu/plannerLegacyReader.ts',
  'src/schools/waseshibu/plannerAudit.ts'
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
if (compiled.status !== 0) throw new Error(`planner-parity modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

// Keep the audit mirror pinned to the current private runtime-reader semantics.
// If dailyPlan.ts changes these readers, this gate forces the compatibility
// mirror to be reviewed before migration claims advance.
const dailySource = fs.readFileSync(path.join(root, 'src/dailyPlan.ts'), 'utf8')
assert.ok(dailySource.includes("const DAILY_REQUIRED_PLAN_KEY='waseshibu-math-daily-required-plan-v2'"))
assert.ok(dailySource.includes('function loadDailyRequiredPlan(date:string,target:TargetScore):DailyRequiredPlan{'))
assert.ok(dailySource.includes('target:parsed.target===60||parsed.target===70||parsed.target===75?parsed.target:target'))
assert.ok(dailySource.includes("const STUDY_AHEAD_PLAN_KEY='waseshibu-math-study-ahead-plan-v1'"))
assert.ok(dailySource.includes('function loadStudyAheadPlan():StudyAheadPlan|null{'))
assert.ok(dailySource.includes("typeof parsed.date==='string'&&Array.isArray(parsed.pendingIds)&&Array.isArray(parsed.completedIds)"))

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
    pendingIds: ['review-2024-Q1-1', 'practice-2024-Q2-1'],
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
    pendingIds: ['practice-2024-Q3-1'],
    completedIds: [],
    queueVersion: 3
  })
}

const require = createRequire(import.meta.url)
const audit = require(path.join(out, 'schools/waseshibu/plannerAudit.js'))
const readers = require(path.join(out, 'schools/waseshibu/plannerLegacyReader.js'))

const storage = new MemoryStorage(seed)
const before = storage.snapshot()
const report = audit.auditWaseShibuPlannerReaderParity(storage)
const after = storage.snapshot()

assert.equal(report.ok, true, report.mismatches.map(x => `${x.surface}: ${x.message}`).join('\n'))
assert.deepEqual(report.mismatches, [])
assert.equal(after, before, 'planner parity audit must not mutate persisted state')
assert.equal(storage.writes, 0, 'planner parity audit must perform zero writes')
assert.deepEqual(report.legacyTodayProjection, report.canonicalShadow.todayRequiredPlan)
assert.deepEqual(report.legacyStudyAheadProjection, report.canonicalShadow.studyAheadPlan)
assert.equal(report.legacyTodayProjection.targetId, '70')
assert.equal(report.legacyStudyAheadProjection.targetId, '75')
assert.deepEqual(report.legacyTodayProjection.pendingTaskIds, ['review-2024-Q1-1', 'practice-2024-Q2-1'])
assert.equal(report.legacyTodayProjection.fallbackTask.schoolEvidence.legacyRoute, '/past-papers?year=2025')

// The current required-plan reader is date-scoped. A stale stored date is not
// silently treated as today's plan; it yields a fresh ephemeral empty value and
// still performs zero writes.
const stale = new MemoryStorage(seed)
const staleRead = readers.readLegacyDailyRequiredPlanForAudit(stale, '2026-09-18', 60)
assert.deepEqual(staleRead, { date: '2026-09-18', target: 60, pendingIds: [], completedIds: [] })
assert.equal(stale.writes, 0)

// Missing persisted plans are valid absence for the canonical shadow. The
// current today reader still has its existing ephemeral default behavior.
const empty = new MemoryStorage()
const emptyReport = audit.auditWaseShibuPlannerReaderParity(empty)
assert.equal(emptyReport.ok, true)
assert.equal(emptyReport.canonicalShadow.todayRequiredPlan, null)
assert.equal(emptyReport.canonicalShadow.studyAheadPlan, null)
assert.deepEqual(readers.readLegacyDailyRequiredPlanForAudit(empty, '2026-09-16', 70), {
  date: '2026-09-16', target: 70, pendingIds: [], completedIds: []
})
assert.equal(readers.readLegacyStudyAheadPlanForAudit(empty), null)
assert.equal(empty.writes, 0)

// The forgiving runtime reader would fall back/ignore malformed state, but
// migration parity must fail closed when raw bytes cannot be represented.
const invalidTarget = new MemoryStorage({
  [TODAY_KEY]: JSON.stringify({ date: '2026-09-16', target: 80, pendingIds: [], completedIds: [] })
})
const invalidTargetReport = audit.auditWaseShibuPlannerReaderParity(invalidTarget)
assert.equal(invalidTargetReport.ok, false)
assert.ok(invalidTargetReport.mismatches.some(x => x.surface === 'shadow'))
assert.equal(invalidTarget.writes, 0)

const corruptAhead = new MemoryStorage({ [AHEAD_KEY]: '{bad json' })
const corruptAheadReport = audit.auditWaseShibuPlannerReaderParity(corruptAhead)
assert.equal(corruptAheadReport.ok, false)
assert.ok(corruptAheadReport.mismatches.some(x => x.surface === 'shadow'))
assert.equal(corruptAhead.writes, 0)

const unknownField = new MemoryStorage({
  [TODAY_KEY]: JSON.stringify({
    date: '2026-09-16', target: 70, pendingIds: [], completedIds: [], queueVersion: 3, futureField: true
  })
})
const unknownReport = audit.auditWaseShibuPlannerReaderParity(unknownField)
assert.equal(unknownReport.ok, false)
assert.ok(unknownReport.mismatches.some(x => x.surface === 'shadow'))
assert.equal(unknownField.writes, 0)

console.log('SHARED ENGINE PLANNER READER PARITY TEST PASSED')
console.log('legacy read-only scheduler semantics == canonical persisted shadow for valid plans; stale/absent behavior preserved; malformed state fails closed; zero writes: OK')
