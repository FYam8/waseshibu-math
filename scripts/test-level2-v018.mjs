import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'))
const core=readJson('src/data/level2/level2_master_2019_2026.json')
const support=readJson('src/data/level2/field_support_questions.json')
const assignments=readJson('src/data/level2/level2_field_assignments.json')
const pool=readJson('src/data/level2/practice_pool_index.json')
const sourceMap=readJson('src/data/level2/source_to_level2_map.json')
assert.equal(core.length,160)
assert.equal(support.length,2)
assert.equal(new Set([...core,...support].map(q=>q.id)).size,162)
assert.equal(assignments.assignments.length,160)
assert.equal(sourceMap.map.length,160)
assert.equal(pool.fields.length,18)
assert.equal(pool.fields.every(f=>f.masteryEligibleQuestionIds.length>=4),true)
const backlog=core.filter(q=>q.status==='backlog'||q.selectable===false)
assert.equal(backlog.length,60,'2019-2021 derived Level2 questions must remain stored as backlog')
assert.equal(backlog.every(q=>q.sourceYear>=2019&&q.sourceYear<=2021&&q.selectable===false),true)
assert.equal(core.filter(q=>q.status!=='backlog'&&q.selectable!==false).length,100,'only 2022-2026 original Level2 questions stay active')
assert.equal(pool.coreQuestionCount,100)
assert.equal(pool.officialPastQuestionCount,60)
assert.equal(pool.backlogQuestionCount,60)
const poolIds=new Set(pool.fields.flatMap(f=>f.masteryEligibleQuestionIds))
assert.equal([...poolIds].some(id=>/^L2-20(?:19|20|21)-/.test(id)),false,'backlog IDs must never remain selectable')
assert.equal([...poolIds].filter(id=>/^20(?:19|20|21)-Q/.test(id)).length,60,'all 60 canonical official IDs must replace backlog IDs')
assert.equal(sourceMap.map.filter(x=>x.sourceQuestionId.match(/^20(?:19|20|21)-/)).every(x=>x.level2QuestionId===x.sourceQuestionId),true,'old-year direct map must use canonical official IDs')
assert.deepEqual(pool.fields.find(f=>f.fieldId==='factoring').masteryEligibleQuestionIds.sort(),['L2-2025-Q1-2','L2-2026-Q1-6','SUP-FAC-001','SUP-FAC-002'].sort())
for(const q of [...core,...support])for(const key of ['problemFigure','hintFigure','explanationFigure'])if(q[key])assert.equal(fs.existsSync(path.join('public/level2',q[key])),true,`missing ${q[key]}`)
const requiredProblemFigures=[
  '2019-Q1-4','2019-Q1-8','2020-Q1-5','2020-Q1-8','2021-Q1-6',
  '2019-Q2-1','2019-Q2-2','2019-Q4-1','2019-Q4-2','2019-Q4-3','2019-Q5-1','2019-Q5-2','2019-Q5-3',
  '2020-Q3-1','2020-Q3-2','2020-Q3-3','2022-Q2-1','2022-Q2-2','2022-Q2-3',
  '2023-Q4-1','2023-Q4-2','2023-Q4-3','2024-Q2-1','2024-Q2-2','2024-Q2-3',
  '2026-Q4-1','2026-Q4-2','2026-Q4-3'
]
for(const sourceQuestionId of requiredProblemFigures){
  const q=core.find(item=>item.sourceQuestionId===sourceQuestionId)
  assert.ok(q?.problemFigure,`${sourceQuestionId} must show its figure before answering`)
  assert.ok(q.contentRevision>=2,`${sourceQuestionId} figure clarification must increment contentRevision`)
  const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,16)
  assert.equal(q.contentHash,hash({context:q.context,prompt:q.prompt,answer:q.answer,acceptedAnswers:q.acceptedAnswers,explanation:q.explanation,problemFigure:q.problemFigure,hintFigure:q.hintFigure,explanationFigure:q.explanationFigure,problemTable:q.problemTable}),`${sourceQuestionId} contentHash must include the current figures and table`)
  assert.equal(q.renderHash,hash({context:q.context,prompt:q.prompt,problemFigure:q.problemFigure,hintFigure:q.hintFigure,explanationFigure:q.explanationFigure,problemTable:q.problemTable}),`${sourceQuestionId} renderHash must include the current figures and table`)
}
const requiredProblemTables=['2021-Q4-1','2021-Q4-2','2021-Q4-3','2022-Q3-3']
for(const sourceQuestionId of requiredProblemTables){
  const q=core.find(item=>item.sourceQuestionId===sourceQuestionId)
  assert.ok(q?.problemTable?.headers.length>=3,`${sourceQuestionId} must have a structured problem table`)
  assert.ok(q.problemTable.rows.length>=2,`${sourceQuestionId} problem table must have at least two rows`)
  assert.ok(q.contentRevision>=2,`${sourceQuestionId} table clarification must increment contentRevision`)
  const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,16)
  assert.equal(q.contentHash,hash({context:q.context,prompt:q.prompt,answer:q.answer,acceptedAnswers:q.acceptedAnswers,explanation:q.explanation,problemFigure:q.problemFigure,hintFigure:q.hintFigure,explanationFigure:q.explanationFigure,problemTable:q.problemTable}),`${sourceQuestionId} contentHash must include the current table`)
  assert.equal(q.renderHash,hash({context:q.context,prompt:q.prompt,problemFigure:q.problemFigure,hintFigure:q.hintFigure,explanationFigure:q.explanationFigure,problemTable:q.problemTable}),`${sourceQuestionId} renderHash must include the current table`)
}
const remediationUi=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const mathAnswerInputUi=fs.readFileSync('src/components/MathAnswerInput.tsx','utf8')
const pastPapersUi=fs.readFileSync('src/pages/PastPapers.tsx','utf8')
const reinforcementUi=fs.readFileSync('src/pages/Reinforcement.tsx','utf8')
assert.match(remediationUi,/level2FigureUrl\(q\.hintFigure\)/,'hintFigure must be read by the practice UI')
assert.match(remediationUi,/alt=\{`\$\{q\.id\}のヒント図`\}/,'hintFigure must be rendered after hint use')
assert.match(remediationUi,/usedExplanation\|\|revealedAnswer[\s\S]*explanationFigure/,'answer reveal must render its explanation figure before grading')
assert.match(remediationUi,/q\.problemTable[\s\S]*<table className="level2-table"/,'structured problem tables must render before grading')
assert.match(remediationUi,/isOfficial[\s\S]*<FocusedQuestionView/,'official practice questions must render the verified official-page crop')
assert.match(remediationUi,/isOfficial\?isExamAnswerCorrect/,'official practice questions must use official answer grading')
assert.match(remediationUi,/isOfficial\?`target-\$\{q\.id\}`:q\.id/,'official practice history must use the canonical target-prefixed ID')
for(const symbol of ['≦','≧','＜','＞','＝'])assert.ok(mathAnswerInputUi.includes(`label:'${symbol}'`),`math keypad must provide ${symbol}`)
for(const symbol of ['≦','≧','＜','＞','＝'])assert.ok(pastPapersUi.includes(`['${symbol}'`),`past-paper keypad must provide ${symbol}`)
assert.match(reinforcementUi,/<MathAnswerInput value=\{answers\[item\.id\]\|\|''\}/,'official reinforcement must use the math keypad')
assert.match(mathAnswerInputUi,/onPointerDown=\{e=>e\.preventDefault\(\)\}/,'math keypad must retain the active input cursor on touch')
assert.match(pastPapersUi,/focusedInputKey=useRef<string>/,'past-paper keypad must remember the selected answer field')
assert.match(pastPapersUi,/q\.subquestions\.some\(sub=>keyFor\(q,sub\.no\)===remembered\)/,'remembered field must be limited to the visible major question')
assert.match(pastPapersUi,/onPointerDown=\{e=>e\.preventDefault\(\)\}/,'past-paper keypad must not blur the selected answer field on touch')

const out=path.join(os.tmpdir(),`waseshibu-level2-${process.pid}.mjs`)
await build({stdin:{contents:`export * from ${JSON.stringify(path.resolve('src/level2History.ts'))};export * from ${JSON.stringify(path.resolve('src/level2ProgressView.ts'))};export {isAcceptedLevel2Answer} from ${JSON.stringify(path.resolve('src/level2Answer.ts'))};export * from ${JSON.stringify(path.resolve('src/data/level2Data.ts'))};`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:out,define:{'import.meta.env.BASE_URL':'"./"'}})
const mod=await import(pathToFileURL(out).href+`?t=${Date.now()}`)
for(const q of [...core,...support]){
  assert.equal(mod.isAcceptedLevel2Answer(q.answer,q),true,`${q.id} canonical answer must pass`)
  assert.equal(mod.isAcceptedLevel2Answer('__definitely_wrong__',q),false,`${q.id} representative wrong answer must fail`)
}
class MemoryStorage{
  map=new Map()
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
}
const record=(selected,correct,store)=>mod.recordLevel2Attempt({
  key:selected.key,question:selected.question,presentationId:selected.presentationId,
  answer:correct?selected.question.answer:'wrong',correct,usedHint:false,usedExplanation:false,
  revealedAnswer:false,firstSubmission:true,practiceFieldId:selected.session.fieldIdAtSessionStart
},store)

assert.equal(mod.backlogLevel2Questions.length,60)
assert.equal([...mod.level2QuestionById].some(([id])=>/^L2-20(?:19|20|21)-/.test(id)),false,'backlog questions must not be in the runtime selectable map')
const officialRuntime=mod.level2QuestionById.get('2021-Q5-1')
assert.equal(officialRuntime?.bankType,'past-paper')
assert.equal(officialRuntime?.answer,'(24/13,0)')
assert.equal(mod.directQuestionForSource('2021-Q5-1')?.id,'2021-Q5-1')
const rangeRuntime=mod.level2QuestionById.get('L2-2022-Q1-4')
assert.ok(rangeRuntime,'range-answer Level2 question must remain selectable')
assert.equal(mod.isAcceptedLevel2Answer('0≦y≦32',rangeRuntime),true,'Japanese inequality symbols must pass')
assert.equal(mod.isAcceptedLevel2Answer('0<=y<=32',rangeRuntime),true,'ASCII inequality symbols must pass')

// A saved 3/4 streak containing backlog questions must not complete a new official question.
const migratedStore=new MemoryStorage()
migratedStore.setItem(mod.LEVEL2_HISTORY_STORAGE_KEY,JSON.stringify({schemaVersion:1,attempts:[],questionStats:{},masteryEvents:[],sessions:{'field:coordinates':{
  sessionId:'old-session',triggerSourceQuestionId:null,directLevel2QuestionId:null,fieldIdAtSessionStart:'coordinates',fieldAssignmentRevisionAtSessionStart:7,
  currentStreak:3,currentStreakQuestionIds:['L2-2019-Q1-6','L2-2019-Q5-3','L2-2020-Q3-2'],bestStreak:3,status:'active',lastQuestionId:'L2-2020-Q3-2',lastPresentedIds:['L2-2019-Q1-6','L2-2019-Q5-3','L2-2020-Q3-2'],bagRemaining:[],updatedAt:'2026-09-01T00:00:00.000Z'
}}}))
const migrated=mod.selectLevel2Question(null,'coordinates',migratedStore)
assert.equal(migrated.session.currentStreak,0,'backlog streak must restart at 0/4')
assert.equal(mod.loadLevel2History(migratedStore).attempts.length,0,'backlog migration must retain attempt history without fabricating attempts')

// A correct official question is deferred behind unchanged originals, but remains a fallback
// so a four-distinct-question streak is still possible in a four-item field.
const priorityStore=new MemoryStorage()
priorityStore.setItem('waseshibu-math-attempts',JSON.stringify([{id:'p1',questionId:'target-2020-Q1-1',status:'correct',at:'2026-09-03T00:00:00.000Z'}]))
let priorityStep=mod.selectLevel2Question(null,'expressions',priorityStore)
assert.notEqual(priorityStep.question.id,'2020-Q1-1','just-completed official question must not immediately repeat')
const priorityIds=[]
for(let i=0;i<4;i++){
  if(i)priorityStep=mod.selectLevel2Question(null,'expressions',priorityStore)
  priorityIds.push(priorityStep.question.id)
  record(priorityStep,true,priorityStore)
}
assert.equal(new Set(priorityIds).size,4)
assert.equal(priorityIds[3],'2020-Q1-1','correct official question may return only after the other three distinct questions')
// A wrong answer preserves already completed items and continues through the fixed set.
for(const wrongAt of [2,3,4]){
  const rotationStore=new MemoryStorage()
  let step=mod.selectLevel2Question('2024-Q1-6','expressions',rotationStore,'2026-09-05T00:00:00.000Z')
  const shown=[]
  for(let position=1;position<=wrongAt;position++){
    shown.push(step.question.id)
    record(step,position!==wrongAt,rotationStore)
    if(position<wrongAt)step=mod.selectLevel2Question('2024-Q1-6','expressions',rotationStore)
  }
  const remainingAfterWrong=mod.loadLevel2History(rotationStore).sessions[step.key].bagRemaining[0]
  const following=mod.selectLevel2Question('2024-Q1-6','expressions',rotationStore)
  if(remainingAfterWrong)assert.notEqual(following.question.id,shown.at(-1),`position ${wrongAt}: continue through unpresented fixed problems first`)
  if(remainingAfterWrong){
    assert.equal(following.question.id,remainingAfterWrong,`position ${wrongAt}: must continue to the next bag problem`)
    assert.notEqual(following.question.id,shown[0],`position ${wrongAt}: must not hard-reset to the first problem`)
  }else assert.equal(following.question.id,shown.at(-1),'after the first pass, only the unresolved item is retried')
  const rotationHistory=mod.loadLevel2History(rotationStore)
  assert.equal(rotationHistory.attempts.length,wrongAt,`position ${wrongAt}: every attempt must be retained`)
  assert.equal(rotationHistory.sessions[step.key].currentStreak,wrongAt-1,`position ${wrongAt}: completed problems must remain complete`)
}
// An older saved session may have lastQuestionId but no shuffle-bag arrays.
// It must resume away from the last/first question instead of treating it as new.
const legacyStore=new MemoryStorage()
let legacyStep=mod.selectLevel2Question('2024-Q1-6','expressions',legacyStore,'2026-09-05T01:00:00.000Z')
const legacyFirst=legacyStep.question.id
record(legacyStep,false,legacyStore)
const legacyRaw=JSON.parse(legacyStore.getItem(mod.LEVEL2_HISTORY_STORAGE_KEY))
delete legacyRaw.sessions[legacyStep.key].lastPresentedIds
delete legacyRaw.sessions[legacyStep.key].bagRemaining
delete legacyRaw.sessions[legacyStep.key].fixedQuestionIds
delete legacyRaw.sessions[legacyStep.key].completedQuestionIds
delete legacyRaw.sessions[legacyStep.key].retryQuestionIds
delete legacyRaw.sessions[legacyStep.key].requiredCount
legacyStore.setItem(mod.LEVEL2_HISTORY_STORAGE_KEY,JSON.stringify(legacyRaw))
legacyStep=mod.selectLevel2Question('2024-Q1-6','expressions',legacyStore)
assert.notEqual(legacyStep.question.id,legacyFirst,'legacy session must not jump to its first problem')
assert.equal(mod.loadLevel2History(legacyStore).attempts.length,1,'legacy-session normalization must retain attempts')

const legacyHeavyStore=new MemoryStorage()
legacyHeavyStore.setItem(mod.LEVEL2_HISTORY_STORAGE_KEY,JSON.stringify({schemaVersion:1,attempts:[],questionStats:{},masteryEvents:[],sessions:{'source:2024-Q5-1':{
  sessionId:'legacy-heavy',triggerSourceQuestionId:'2024-Q5-1',directLevel2QuestionId:'L2-2024-Q5-1',fieldIdAtSessionStart:'angles-circles',fieldAssignmentRevisionAtSessionStart:1,
  currentStreak:0,currentStreakQuestionIds:[],bestStreak:0,status:'active',lastQuestionId:null,lastPresentedIds:[],bagRemaining:[],updatedAt:'2026-09-01T00:00:00.000Z'
}}}))
assert.equal(mod.loadLevel2SessionSummaries(legacyHeavyStore)[0].requiredCount,2,'Today/ETA summary must match the two-question target before a legacy session is opened')
assert.equal(mod.selectLevel2Question('2024-Q5-1','angles-circles',legacyHeavyStore).session.requiredCount,2,'legacy heavy session without requiredCount must migrate to two questions')

const legacyHeavyCompleteStore=new MemoryStorage()
legacyHeavyCompleteStore.setItem(mod.LEVEL2_HISTORY_STORAGE_KEY,JSON.stringify({schemaVersion:1,attempts:[],questionStats:{},masteryEvents:[],sessions:{'source:2024-Q5-1':{
  sessionId:'legacy-heavy-progress',triggerSourceQuestionId:'2024-Q5-1',directLevel2QuestionId:'L2-2024-Q5-1',fieldIdAtSessionStart:'angles-circles',fieldAssignmentRevisionAtSessionStart:1,
  currentStreak:2,currentStreakQuestionIds:['L2-2024-Q5-1','L2-2023-Q1-5'],bestStreak:2,status:'active',lastQuestionId:'L2-2023-Q1-5',lastPresentedIds:['L2-2024-Q5-1','L2-2023-Q1-5'],bagRemaining:[],updatedAt:'2026-09-01T00:00:00.000Z'
}}}))
const migratedHeavyComplete=mod.selectLevel2Question('2024-Q5-1','angles-circles',legacyHeavyCompleteStore)
assert.equal(migratedHeavyComplete.session.status,'completed','legacy 2 qualifying answers must satisfy the new frozen two-question target')
assert.equal(mod.loadLevel2History(legacyHeavyCompleteStore).masteryEvents.length,1,'qualified legacy completion must create one mastery checkpoint without deleting history')
const storage=new MemoryStorage()
let selected=mod.selectLevel2Question('2024-Q1-6','expressions',storage,'2026-09-03T00:00:00.000Z')
assert.equal(selected.question.id,'L2-2024-Q1-6','source question must open direct Level2')
const used=[]
for(let i=0;i<4;i++){
  if(i)selected=mod.selectLevel2Question('2024-Q1-6','expressions',storage)
  used.push(selected.question.id)
  const result=mod.recordLevel2Attempt({key:selected.key,question:selected.question,presentationId:selected.presentationId,answer:selected.question.answer,correct:true,usedHint:false,usedExplanation:false,revealedAnswer:false,firstSubmission:true,practiceFieldId:selected.session.fieldIdAtSessionStart},storage)
  assert.equal(result.session.currentStreak,i+1)
}
assert.equal(new Set(used).size,4,'4/4 must use distinct questionIds')
let history=mod.loadLevel2History(storage)
assert.equal(history.attempts.length,4)
assert.equal(history.masteryEvents.length,1)
assert.equal(history.masteryEvents[0].label,'いったん克服')
selected=mod.selectLevel2Question('2024-Q1-6','expressions',storage,undefined,true)
assert.equal(selected.session.currentStreak,0,'explicit re-practice must start a new 0/4 session without deleting history')
assert.equal(mod.loadLevel2History(storage).attempts.length,4)

selected=mod.selectLevel2Question('2024-Q1-6','expressions',storage,'2026-09-04T00:00:00.000Z')
assert.equal(selected.session.currentStreak,0,'new wrong source attempt must reactivate at 0/4')
const firstAfterReactivation=selected.question.id
let result=mod.recordLevel2Attempt({key:selected.key,question:selected.question,presentationId:selected.presentationId,answer:selected.question.answer,correct:true,usedHint:false,usedExplanation:false,revealedAnswer:false,firstSubmission:true,practiceFieldId:selected.session.fieldIdAtSessionStart},storage)
selected=mod.selectLevel2Question('2024-Q1-6','expressions',storage)
const wrongQuestion=selected.question.id
result=mod.recordLevel2Attempt({key:selected.key,question:selected.question,presentationId:selected.presentationId,answer:'wrong',correct:false,usedHint:false,usedExplanation:false,revealedAnswer:false,firstSubmission:true,practiceFieldId:selected.session.fieldIdAtSessionStart},storage)
const expectedNextQuestion=result.session.bagRemaining[0]
assert.equal(result.session.currentStreak,1)
selected=mod.selectLevel2Question('2024-Q1-6','expressions',storage)
assert.equal(selected.question.id,expectedNextQuestion,'wrong answer must continue to the next shuffle-bag problem')
assert.notEqual(selected.question.id,firstAfterReactivation,'wrong answer must not jump back to the first problem')
assert.notEqual(selected.question.id,wrongQuestion,'wrong answer must not immediately repeat the same problem')
assert.equal(mod.loadLevel2History(storage).attempts.length,6,'wrong reset must retain every attempt')

selected=mod.selectLevel2Question(null,'factoring',storage)
result=mod.recordLevel2Attempt({key:selected.key,question:selected.question,presentationId:selected.presentationId,answer:selected.question.answer,correct:true,usedHint:false,usedExplanation:false,revealedAnswer:false,firstSubmission:true,practiceFieldId:'factoring'},storage)
assert.equal(result.session.currentStreak,1)
const assisted=mod.markLevel2Assistance(selected.key,storage)
assert.equal(assisted.currentStreak,1,'hint/reveal must not erase completed problems')

// Workload-based targets are frozen at session start: Q1=4, Q2/Q3=3, Q4/Q5=2.
for(const [sourceId,expected] of [['2024-Q1-1',4],['2024-Q2-1',3],['2024-Q5-1',2]]){
  const workloadStore=new MemoryStorage()
  let workloadStep=mod.selectLevel2Question(sourceId,'expressions',workloadStore)
  assert.equal(workloadStep.session.requiredCount,expected,`${sourceId} target count`)
  assert.equal(workloadStep.session.fixedQuestionIds.length,expected,`${sourceId} fixed set size`)
  const fixed=[...workloadStep.session.fixedQuestionIds]
  const reloaded=mod.selectLevel2Question(sourceId,'expressions',workloadStore)
  assert.equal(reloaded.question.id,workloadStep.question.id,'reload before answering must keep the current fixed question')
  assert.deepEqual(reloaded.session.fixedQuestionIds,fixed,'reload must not rerandomize the fixed set')
  let guard=0
  while(workloadStep.session.status!=='completed'&&guard++<10){
    const recorded=record(workloadStep,true,workloadStore)
    workloadStep=recorded.completed?{...workloadStep,session:recorded.session}:mod.selectLevel2Question(sourceId,'expressions',workloadStore)
  }
  assert.equal(workloadStep.session.status,'completed',`${sourceId} must complete at its frozen target`)
  const completedReload=mod.selectLevel2Question(sourceId,'expressions',workloadStore)
  assert.equal(completedReload.session.status,'completed','completed session must reload without crashing or starting a new set')
  assert.deepEqual(completedReload.session.fixedQuestionIds,fixed,'completed reload must preserve the original fixed set')
}

const fraction={id:'test',sourceQuestionId:null,status:'final',contentVerified:true,materialized:true,prompt:'',answer:'1/3',explanation:''}
const radical={...fraction,answer:'√3−1',acceptedAnswers:[]}
const ratio={...fraction,answer:'2:3',acceptedAnswers:[]}
const unordered=core.find(q=>q.id==='L2-2019-Q1-9')
const choices=core.find(q=>q.id==='L2-2023-Q1-8')
const triangles=core.find(q=>q.id==='L2-2023-Q4-1')
assert.equal(mod.isAcceptedLevel2Answer('3/9',fraction),false,'unreduced fraction must fail')
assert.equal(mod.isAcceptedLevel2Answer('-1+√3',radical),true,'equivalent simplified radical order must pass')
assert.equal(mod.isAcceptedLevel2Answer('4:6',ratio),false,'non-simplest ratio must fail')
assert.equal(mod.isAcceptedLevel2Answer('2:3',ratio),true)
assert.equal(mod.isAcceptedLevel2Answer('x=-4/3,-12',unordered),true,'unordered solutions must accept any order')
assert.equal(mod.isAcceptedLevel2Answer('オ・ア・エ・ウ',choices),true,'unordered choices must accept any order')
assert.equal(mod.isAcceptedLevel2Answer('ACD~ABM,ACB~ADM',triangles),true,'equivalent triangle-pair order/direction must pass')
fs.unlinkSync(out)
console.log('PASS: fixed 2-4 question sets, unresolved-only retry, non-destructive history, assistance, final-answer grading')
