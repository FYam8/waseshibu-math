import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-single-error-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',['src/guidedReview.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`guidedReview compile failed\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),guided=require(path.join(temp,'guidedReview.js'))
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}}
const questionId='2024-Q1-1',step=guided.getGuidedSolution(questionId).steps[0]

// S2-STATE-001: a relevant sign error is recordable, but it is not a correct answer.
assert.equal(guided.validateGuidedStepResponse(step,'(9-12)=3'),true)
const signStore=memory()
let progress=guided.recordGuidedStep(questionId,step.id,'(9-12)=3',0,false,signStore)
assert.equal(progress.mastery,'attempted')
assert.equal(progress.independentSucceeded,false)

// S2-STATE-002: the learner's self-report may complete the STEP, never certify mastery.
progress=guided.assessGuidedStep(questionId,step.id,'matched',signStore)
assert.equal(progress.stepProgress[step.id].completed,true)
assert.equal(progress.stepProgress[step.id].selfAssessment,'matched')
assert.equal(progress.mastery,'attempted')
assert.equal(progress.independentSucceeded,false)

// S2-STATE-003/004: the final answer is graded separately; the same sign error stays wrong.
let outcome=guided.recordGuidedFinal(questionId,'3','retry',signStore)
assert.deepEqual(outcome,{correct:false,mastery:'attempted'})
progress=guided.loadGuidedProgress(questionId,signStore)
assert.equal(progress.reproductionSucceeded,false)
assert.equal(progress.independentSucceeded,false)
assert.equal(progress.practiceStreak,0)

// S2-STATE-005: Guided state must not invent a diagnosis or mistake category.
const serialized=JSON.parse(signStore.getItem(guided.GUIDED_PROGRESS_KEY))
assert.equal('mistakeTag' in serialized[questionId],false)
assert.equal('diagnosis' in serialized[questionId],false)
assert.equal(serialized[questionId].questionId,questionId)

// S2-STATE-006: seeing a hint and then answering correctly remains guided, not independent.
const hintedStore=memory()
guided.recordGuidedStep(questionId,step.id,'(9-12)=3',1,false,hintedStore)
outcome=guided.recordGuidedFinal(questionId,'6','guided',hintedStore)
assert.deepEqual(outcome,{correct:true,mastery:'guided'})
assert.equal(guided.loadGuidedProgress(questionId,hintedStore).independentSucceeded,false)

// S2-STATE-007: a genuinely correct, no-hint final answer is the contrasting mastery path.
const independentStore=memory()
outcome=guided.recordGuidedFinal(questionId,'6','retry',independentStore)
assert.deepEqual(outcome,{correct:true,mastery:'independent'})
assert.equal(guided.loadGuidedProgress(questionId,independentStore).independentSucceeded,true)

// S2-STATE-008: the interface must describe the STEP as an ungraded record.
const ui=fs.readFileSync(path.join(root,'src/pages/GuidedReview.tsx'),'utf8')
assert.match(ui,/この欄は途中式の記録用です。入力内容の数学的な正誤は自動判定しません。/)
assert.match(ui,/自分の考えを記録した（正誤未確認）/)

console.log('PASS: S2-STATE-001..008 関連する単一誤りの記録、自己評価、最終採点、習得判定、診断非生成を分離')
console.log('HOLD: 最初の誤り・原因・正しい考え方・次回注意の自動添削は、別途学習仕様と精度評価が必要')

