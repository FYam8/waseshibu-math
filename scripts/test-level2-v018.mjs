import assert from 'node:assert/strict'
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
assert.deepEqual(pool.fields.find(f=>f.fieldId==='factoring').masteryEligibleQuestionIds.sort(),['L2-2025-Q1-2','L2-2026-Q1-6','SUP-FAC-001','SUP-FAC-002'].sort())
for(const q of [...core,...support])for(const key of ['problemFigure','hintFigure','explanationFigure'])if(q[key])assert.equal(fs.existsSync(path.join('public/level2',q[key])),true,`missing ${q[key]}`)

const out=path.join(os.tmpdir(),`waseshibu-level2-${process.pid}.mjs`)
await build({stdin:{contents:`export * from ${JSON.stringify(path.resolve('src/level2History.ts'))};export {isAcceptedLevel2Answer} from ${JSON.stringify(path.resolve('src/level2Answer.ts'))};export {level2QuestionById} from ${JSON.stringify(path.resolve('src/data/level2Data.ts'))};`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:out,define:{'import.meta.env.BASE_URL':'"./"'}})
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
let result=mod.recordLevel2Attempt({key:selected.key,question:selected.question,presentationId:selected.presentationId,answer:'wrong',correct:false,usedHint:false,usedExplanation:false,revealedAnswer:false,firstSubmission:true,practiceFieldId:selected.session.fieldIdAtSessionStart},storage)
assert.equal(result.session.currentStreak,0)
assert.equal(mod.loadLevel2History(storage).attempts.length,5,'wrong reset must retain attempts')

selected=mod.selectLevel2Question(null,'factoring',storage)
result=mod.recordLevel2Attempt({key:selected.key,question:selected.question,presentationId:selected.presentationId,answer:selected.question.answer,correct:true,usedHint:false,usedExplanation:false,revealedAnswer:false,firstSubmission:true,practiceFieldId:'factoring'},storage)
assert.equal(result.session.currentStreak,1)
const assisted=mod.markLevel2Assistance(selected.key,storage)
assert.equal(assisted.currentStreak,0,'hint/reveal must reset immediately')

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
console.log('PASS: audited v7 160+2, direct mapping, immutable IDs, distinct 4/4, reset/retention, assistance, final-answer grading')
