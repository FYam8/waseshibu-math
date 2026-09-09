import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-guided-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',['src/guidedReview.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`guidedReview compile failed\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),guided=require(path.join(temp,'guidedReview.js'))
const solutions=require(path.join(root,'src/data/guidedSolutions.json')).solutions

const step=guided.getGuidedSolution('2024-Q1-2').steps[0]
for(const bad of ['あ','適当','わからない','123','？','999=999','7+7=14']){
  if(guided.validateGuidedStepResponse(step,bad))throw new Error(`irrelevant input passed: ${bad}`)
}
for(const good of ['30','5×12÷2=30','底面積30']){
  if(!guided.validateGuidedStepResponse(step,good))throw new Error(`valid step input rejected: ${good}`)
}

const step2=guided.getGuidedSolution('2024-Q1-3').steps[0]
if(!guided.validateGuidedStepResponse(step2,'y=k/x'))throw new Error('equivalent formula should pass')
if(guided.validateGuidedStepResponse(step2,'999'))throw new Error('unrelated number should fail')
if(guided.validateGuidedStepResponse(step2,'999=999'))throw new Error('unrelated equation should fail')

// This is a relevance gate, not an algebra checker. A sign error can still be
// recorded, so the UI must not imply that the intermediate work was graded.
const signErrorStep=guided.getGuidedSolution('2024-Q1-1').steps[0]
if(!guided.validateGuidedStepResponse(signErrorStep,'(9-12)=3'))throw new Error('relevant sign-error work should remain recordable')
const guidedUi=fs.readFileSync(path.join(root,'src/pages/GuidedReview.tsx'),'utf8')
if(!guidedUi.includes('この欄は途中式の記録用です。入力内容の数学的な正誤は自動判定しません。'))throw new Error('Guided UI must disclose that intermediate work is not auto-graded')

let checked=0
for(const solution of Object.values(solutions))for(const guidedStep of solution.steps){
  checked++
  if(!guided.validateGuidedStepResponse(guidedStep,guidedStep.reveal))throw new Error(`${solution.questionId}/${guidedStep.id}: own reveal rejected`)
  const source=`${guidedStep.hint1} ${guidedStep.hint2} ${guidedStep.reveal}`.toLowerCase()
  const unused=['z','q','v','j','w','f'].find(letter=>!source.includes(letter))
  if(!unused)throw new Error(`${solution.questionId}/${guidedStep.id}: no unused test marker`)
  const unrelated=`${unused}${unused}=${unused}${unused}`
  if(guided.validateGuidedStepResponse(guidedStep,unrelated))throw new Error(`${solution.questionId}/${guidedStep.id}: unrelated equation passed`)
}

console.log(`PASS: Guided STEP relevance gate rejects filler/unrelated equations, keeps relevant work recordable, and discloses no intermediate grading (${checked} steps across ${Object.keys(solutions).length} questions)`)
