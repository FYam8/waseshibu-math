import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waseshibu-level2-shadow-'))
const out = path.join(temp, 'out')
const emptyTypes = path.join(temp, 'types')
fs.mkdirSync(emptyTypes)

const entries = [
  'src/engine/practiceHistoryContract.ts',
  'src/practiceLoad.ts',
  'src/schools/waseshibu/level2Compatibility.ts',
  'src/schools/waseshibu/level2LegacyReader.ts',
  'src/schools/waseshibu/level2Shadow.ts',
  'src/schools/waseshibu/level2Audit.ts'
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
if (compiled.status !== 0) throw new Error(`Level2 shared-state modules compile failed\n${compiled.stdout}\n${compiled.stderr}`)

const historySource = fs.readFileSync(path.join(root, 'src/level2History.ts'), 'utf8')
for (const pinned of [
  "export const LEVEL2_HISTORY_STORAGE_KEY='waseshibu-math-level2-history-v1'",
  "const uniqueIds=(value:unknown)=>Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==='string'))]:[]",
  "if(!raw||typeof raw!=='object')return blank()",
  "if(raw.sessions&&typeof raw.sessions==='object'&&!Array.isArray(raw.sessions))",
  "requiredCount:Math.max(1,Math.min(4,Number(session.requiredCount)||requiredPracticeCount(session.triggerSourceQuestionId,session.fieldIdAtSessionStart)))",
  "completedQuestionIds:Array.isArray(session.completedQuestionIds)?uniqueIds(session.completedQuestionIds):currentStreakQuestionIds",
  "return {schemaVersion:1,attempts:Array.isArray(raw.attempts)?raw.attempts:[],questionStats:raw.questionStats&&typeof raw.questionStats==='object'?raw.questionStats:{},sessions,masteryEvents:Array.isArray(raw.masteryEvents)?raw.masteryEvents:[]}"
]) assert.ok(historySource.includes(pinned), `active Level2 reader drifted; review shared-state parity pin: ${pinned}`)

const summarySource = fs.readFileSync(path.join(root, 'src/level2ProgressView.ts'), 'utf8')
for (const pinned of [
  "const completed=[...new Set(Array.isArray(session.completedQuestionIds)?session.completedQuestionIds.map(String):Array.isArray(session.currentStreakQuestionIds)?session.currentStreakQuestionIds.map(String):[])]",
  "requiredCount:Math.max(1,Math.min(4,Number(session.requiredCount)||requiredPracticeCount(triggerSourceQuestionId,fieldIdAtSessionStart)))",
  "status:session.status==='completed'?'completed':'active'",
  "updatedAt:typeof session.updatedAt==='string'?session.updatedAt:new Date(0).toISOString()"
]) assert.ok(summarySource.includes(pinned), `active Level2 summary reader drifted; review parity pin: ${pinned}`)

class ReadOnlyMemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); this.reads = 0 }
  getItem(key) { this.reads++; return this.map.has(key) ? this.map.get(key) : null }
  snapshot() { return JSON.stringify([...this.map.entries()].sort(([a], [b]) => a.localeCompare(b))) }
}

const require = createRequire(import.meta.url)
const compatibility = require(path.join(out, 'schools/waseshibu/level2Compatibility.js'))
const shadowModule = require(path.join(out, 'schools/waseshibu/level2Shadow.js'))
const auditModule = require(path.join(out, 'schools/waseshibu/level2Audit.js'))
const key = compatibility.LEGACY_LEVEL2_HISTORY_KEY

const validRaw = {
  schemaVersion: 1,
  attempts: [
    {
      attemptId: 'l2-attempt-1',
      questionId: 'L2-2024-Q1-1',
      presentationId: 'presentation-1',
      weaknessSessionId: 'session-source',
      answeredAt: '2026-09-16T10:00:00.000Z',
      submissionIndex: 1,
      isFirstSubmissionForPresentation: true,
      isCorrect: true,
      usedHintBeforeAnswer: false,
      usedExplanationBeforeAnswer: false,
      revealedAnswerBeforeAnswer: false,
      contentRevisionAtAttempt: 2,
      gradingRevisionAtAttempt: 1,
      fieldIdAtAttempt: 'expressions',
      fieldAssignmentRevisionAtAttempt: 7,
      practiceFieldIdAtAttempt: 'factoring',
      questionBank: 'core160',
      answer: '6',
      futureAttemptEvidence: 'preserve-me'
    }
  ],
  questionStats: {
    'L2-2024-Q1-1': {
      attemptCount: 3,
      correctCount: 2,
      qualifyingCorrectCount: 1,
      lastAttemptAt: '2026-09-16T10:00:00.000Z',
      lastResult: true,
      futureStatsEvidence: 11
    }
  },
  sessions: {
    'source:2024-Q1-1': {
      sessionId: 'session-source',
      triggerSourceQuestionId: '2024-Q1-1',
      directLevel2QuestionId: 'L2-2024-Q1-1',
      fieldIdAtSessionStart: 'expressions',
      fieldAssignmentRevisionAtSessionStart: 7,
      currentStreak: 2,
      currentStreakQuestionIds: ['L2-2024-Q1-1', 'L2-2024-Q1-2'],
      bestStreak: 2,
      status: 'active',
      sourceAttemptAt: '2026-09-16T09:30:00.000Z',
      lastQuestionId: 'L2-2024-Q1-2',
      lastPresentedIds: ['L2-2024-Q1-1', 'L2-2024-Q1-2'],
      bagRemaining: ['L2-2024-Q1-3'],
      updatedAt: '2026-09-16T10:00:00.000Z',
      requiredCount: '4',
      fixedQuestionIds: ['L2-2024-Q1-1', 'L2-2024-Q1-2', 'L2-2024-Q1-3', 'L2-2024-Q1-4'],
      completedQuestionIds: ['L2-2024-Q1-1', 'L2-2024-Q1-2'],
      retryQuestionIds: [],
      pendingAssistance: {
        questionId: 'L2-2024-Q1-3',
        usedHint: true,
        usedExplanation: false,
        revealedAnswer: false
      },
      futureSessionEvidence: { preserved: true }
    },
    'field:coordinates': {
      sessionId: 'session-field',
      triggerSourceQuestionId: null,
      directLevel2QuestionId: null,
      fieldIdAtSessionStart: 'coordinates',
      fieldAssignmentRevisionAtSessionStart: 7,
      currentStreak: 1,
      currentStreakQuestionIds: ['2021-Q5-1'],
      bestStreak: 1,
      status: 'active',
      lastQuestionId: '2021-Q5-1',
      lastPresentedIds: ['2021-Q5-1'],
      bagRemaining: ['2020-Q5-1'],
      updatedAt: '2026-09-16T11:00:00.000Z',
      // Old compatible shape: missing requiredCount uses current WaseShibu
      // field policy and missing completedQuestionIds uses current streak IDs.
      fixedQuestionIds: ['2021-Q5-1', '2020-Q5-1'],
      retryQuestionIds: [],
      pendingAssistance: null
    }
  },
  masteryEvents: [
    {
      fieldId: 'expressions',
      achievedAt: '2026-09-15T08:00:00.000Z',
      fieldAssignmentRevision: 7,
      questionIds: ['L2-2024-Q1-1', 'L2-2024-Q1-2', 'L2-2024-Q1-3', 'L2-2024-Q1-4'],
      requiredCount: 4,
      label: 'いったん克服',
      futureMasteryEvidence: 'preserve-me'
    }
  ]
}

const storage = new ReadOnlyMemoryStorage({ [key]: JSON.stringify(validRaw) })
const before = storage.snapshot()
const shadow = shadowModule.readWaseShibuCanonicalLevel2Shadow(storage)
assert.equal(storage.snapshot(), before, 'Level2 shadow must not mutate source bytes')
assert.equal(shadow.present, true)
assert.deepEqual(shadow.issues, [])

const history = shadow.practiceHistory
assert.equal(history.attempts.length, 1)
assert.equal(history.attempts[0].id, 'l2-attempt-1')
assert.equal(history.attempts[0].problemId, 'L2-2024-Q1-1')
assert.equal(history.attempts[0].sessionId, 'session-source')
assert.equal(history.attempts[0].skillIdAtAttempt, 'expressions')
assert.equal(history.attempts[0].practiceSkillIdAtAttempt, 'factoring')
assert.equal(history.attempts[0].schoolEvidence.legacyRecord.questionBank, 'core160')
assert.equal(history.attempts[0].schoolEvidence.legacyRecord.futureAttemptEvidence, 'preserve-me')
assert.equal(history.problemStatsByProblemId['L2-2024-Q1-1'].qualifyingCorrectCount, 1)
assert.equal(history.problemStatsByProblemId['L2-2024-Q1-1'].schoolEvidence.legacyRecord.futureStatsEvidence, 11)

const sourceSession = history.sessionsByKey['source:2024-Q1-1']
assert.equal(sourceSession.id, 'session-source')
assert.equal(sourceSession.sourceProblemId, '2024-Q1-1')
assert.equal(sourceSession.directProblemId, 'L2-2024-Q1-1')
assert.equal(sourceSession.skillId, 'expressions')
assert.equal(sourceSession.requiredCount, 4)
assert.deepEqual(sourceSession.completedProblemIds, ['L2-2024-Q1-1', 'L2-2024-Q1-2'])
assert.equal(sourceSession.pendingAssistance.problemId, 'L2-2024-Q1-3')
assert.deepEqual(sourceSession.schoolEvidence.legacyRecord.futureSessionEvidence, { preserved: true })
const fieldSession = history.sessionsByKey['field:coordinates']
assert.equal(fieldSession.requiredCount, 2, 'missing count must use current WaseShibu coordinates fallback')
assert.deepEqual(fieldSession.completedProblemIds, ['2021-Q5-1'], 'missing completed IDs must use current-streak IDs')
assert.equal(history.masteryEvents[0].skillId, 'expressions')
assert.equal(history.masteryEvents[0].schoolEvidence.legacyRecord.label, 'いったん克服')
assert.equal(history.masteryEvents[0].schoolEvidence.legacyRecord.futureMasteryEvidence, 'preserve-me')

const auditStorage = new ReadOnlyMemoryStorage({ [key]: JSON.stringify(validRaw) })
const auditBefore = auditStorage.snapshot()
const audit = auditModule.auditWaseShibuLevel2State(auditStorage)
assert.equal(audit.ok, true, audit.mismatches.map(x => `${x.surface}: ${x.message}`).join('\n'))
assert.deepEqual(audit.mismatches, [])
assert.deepEqual(audit.legacyProjection, audit.canonicalShadow)
assert.deepEqual(audit.legacySummaries, audit.canonicalSummaries)
assert.equal(auditStorage.snapshot(), auditBefore)

const missing = auditModule.auditWaseShibuLevel2State(new ReadOnlyMemoryStorage())
assert.equal(missing.ok, true)
assert.deepEqual(missing.canonicalShadow.attempts, [])
assert.deepEqual(missing.canonicalSummaries, [])

const badJsonStorage = new ReadOnlyMemoryStorage({ [key]: '{broken' })
const badJson = auditModule.auditWaseShibuLevel2State(badJsonStorage)
assert.equal(badJson.ok, false)
assert.ok(badJson.mismatches.some(x => x.surface === 'shadow' && x.message.includes('not valid JSON')))
assert.equal(badJsonStorage.snapshot(), JSON.stringify([[key, '{broken']]))

const futureSchema = auditModule.auditWaseShibuLevel2State(new ReadOnlyMemoryStorage({
  [key]: JSON.stringify({ ...validRaw, schemaVersion: 2 })
}))
assert.equal(futureSchema.ok, false)
assert.ok(futureSchema.mismatches.some(x => x.message.includes('schemaVersion 1')))

const duplicateAttemptRaw = structuredClone(validRaw)
duplicateAttemptRaw.attempts.push({ ...duplicateAttemptRaw.attempts[0], answeredAt: '2026-09-16T10:01:00.000Z' })
const duplicateAttempt = auditModule.auditWaseShibuLevel2State(new ReadOnlyMemoryStorage({ [key]: JSON.stringify(duplicateAttemptRaw) }))
assert.equal(duplicateAttempt.ok, false)
assert.ok(duplicateAttempt.mismatches.some(x => x.message.includes('duplicate Level2 attempt identity')))

const statsArray = auditModule.auditWaseShibuLevel2State(new ReadOnlyMemoryStorage({
  [key]: JSON.stringify({ ...validRaw, questionStats: [] })
}))
assert.equal(statsArray.ok, false)
assert.ok(statsArray.mismatches.some(x => x.message.includes('questionStats')))

const duplicateIdsRaw = structuredClone(validRaw)
duplicateIdsRaw.sessions['source:2024-Q1-1'].fixedQuestionIds = ['L2-2024-Q1-1', 'L2-2024-Q1-1']
const duplicateIds = auditModule.auditWaseShibuLevel2State(new ReadOnlyMemoryStorage({ [key]: JSON.stringify(duplicateIdsRaw) }))
assert.equal(duplicateIds.ok, false)
assert.ok(duplicateIds.mismatches.some(x => x.message.includes('deduplicate')))

const fractionalCountRaw = structuredClone(validRaw)
fractionalCountRaw.sessions['source:2024-Q1-1'].requiredCount = 2.5
const fractionalCount = auditModule.auditWaseShibuLevel2State(new ReadOnlyMemoryStorage({ [key]: JSON.stringify(fractionalCountRaw) }))
assert.equal(fractionalCount.ok, false)
assert.ok(fractionalCount.mismatches.some(x => x.message.includes('clamped or replaced')))

const malformedPendingRaw = structuredClone(validRaw)
malformedPendingRaw.sessions['source:2024-Q1-1'].pendingAssistance = { questionId: 123, usedHint: 'yes' }
const malformedPending = auditModule.auditWaseShibuLevel2State(new ReadOnlyMemoryStorage({ [key]: JSON.stringify(malformedPendingRaw) }))
assert.equal(malformedPending.ok, false)
assert.ok(malformedPending.mismatches.some(x => x.message.includes('pending assistance')))

const duplicateSessionRaw = structuredClone(validRaw)
duplicateSessionRaw.sessions['field:coordinates'].sessionId = 'session-source'
const duplicateSession = auditModule.auditWaseShibuLevel2State(new ReadOnlyMemoryStorage({ [key]: JSON.stringify(duplicateSessionRaw) }))
assert.equal(duplicateSession.ok, false)
assert.ok(duplicateSession.mismatches.some(x => x.message.includes('share one sessionId')))

const invalidTimeRaw = structuredClone(validRaw)
invalidTimeRaw.masteryEvents[0].achievedAt = 'not-a-date'
const invalidTime = auditModule.auditWaseShibuLevel2State(new ReadOnlyMemoryStorage({ [key]: JSON.stringify(invalidTimeRaw) }))
assert.equal(invalidTime.ok, false)
assert.ok(invalidTime.mismatches.some(x => x.message.includes('valid timestamp')))

// The two active readers disagree on an array-shaped sessions root: history
// drops it, while the summary reader traverses it. The migration gate must make
// this divergence visible rather than choosing one interpretation.
const arraySessionsRaw = {
  schemaVersion: 1,
  attempts: [],
  questionStats: {},
  sessions: [{
    sessionId: 'array-session', triggerSourceQuestionId: null, directLevel2QuestionId: null,
    fieldIdAtSessionStart: 'coordinates', fieldAssignmentRevisionAtSessionStart: 1,
    currentStreak: 0, currentStreakQuestionIds: [], bestStreak: 0, status: 'active',
    lastQuestionId: null, lastPresentedIds: [], bagRemaining: [], updatedAt: '2026-09-16T00:00:00.000Z',
    requiredCount: 2, fixedQuestionIds: [], completedQuestionIds: [], retryQuestionIds: [], pendingAssistance: null
  }],
  masteryEvents: []
}
const arraySessions = auditModule.auditWaseShibuLevel2State(new ReadOnlyMemoryStorage({ [key]: JSON.stringify(arraySessionsRaw) }))
assert.equal(arraySessions.ok, false)
assert.ok(arraySessions.mismatches.some(x => x.message.includes('progress-summary reader')))
assert.ok(arraySessions.mismatches.some(x => x.surface === 'sessionSummaries'))

console.log('SHARED ENGINE LEVEL2 STATE TEST PASSED')
console.log('history reader parity, independent summary-reader parity, lossless school evidence, strict migration blockers, zero writes: OK')
