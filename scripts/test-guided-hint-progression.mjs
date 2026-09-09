import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-hint-progression-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',['src/guidedReview.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`guidedReview compile failed\n${built.stdout}\n${built.stderr}`)

const require=createRequire(import.meta.url)
const guided=require(path.join(temp,'guidedReview.js'))
const solutions=require(path.join(root,'src/data/guidedSolutions.json')).solutions
const normalize=value=>String(value).normalize('NFKC').replace(/\s+/g,'').replace(/[。．…]/g,'')

let checked=0,guardedHints=0,legacyRevealRestatements=0
for(const solution of Object.values(solutions))for(const step of solution.steps){
  checked++
  const finalAnswers=[solution.finalAnswer.answer,...solution.finalAnswer.acceptedAnswers]
  const displayed=guided.guidedHint2ForDisplay(step,finalAnswers)
  if(displayed!==step.hint2)guardedHints++
  const quoted=step.hint2.match(/^このSTEPでは「([\s\S]*?)…?」となる理由を確認します。?$/)?.[1]
  if(quoted){
    const hint=normalize(quoted),reveal=normalize(step.reveal)
    if(hint===reveal||hint.startsWith(reveal)||reveal.startsWith(hint)){
      legacyRevealRestatements++
      if(displayed===step.hint2)throw new Error(`${solution.questionId}/${step.id}: reveal restatement is still displayed at hint level 2`)
      if(normalize(displayed)===reveal)throw new Error(`${solution.questionId}/${step.id}: displayed hint2 still equals reveal`)
    }
  }
}

if(checked<653)throw new Error(`expected at least 653 guided steps, got ${checked}`)

for(const [questionId,stepId,answer] of [
  ['2022-Q1-5','calc-3','3/8'],
  ['2022-Q1-7','calc-3','176'],
  ['2024-Q3-2','calc-3','1/2'],
  ['2025-Q1-8','calc-4','102'],
  ['2026-Q1-3','calc-2','(4,3)'],
  ['2026-Q1-5','calc-2','9'],
]){
  const step=solutions[questionId].steps.find(item=>item.id===stepId)
  const solution=solutions[questionId]
  const displayed=guided.guidedHint2ForDisplay(step,[solution.finalAnswer.answer,...solution.finalAnswer.acceptedAnswers])
  if(normalize(displayed).includes(normalize(answer)))throw new Error(`${questionId}/${stepId}: final answer leaked in displayed hint2`)
}

const factorStep=solutions['2026-Q1-6'].steps.find(step=>step.id==='calc-3')
if(guided.guidedHint2ForDisplay(factorStep,['(x-2)(x+y+5)']).includes('(x-2)(x+y+5)'))throw new Error('2026-Q1-6/calc-3: factored final answer leaked in hint2')

const fillBlank=solutions['2019-Q1-1'].steps.find(step=>step.id==='calc-1')
if(guided.guidedHint2ForDisplay(fillBlank,['8'])!==fillBlank.hint2)throw new Error('safe fill-blank hint2 should remain unchanged')

const guidedUi=fs.readFileSync(path.join(root,'src/pages/GuidedReview.tsx'),'utf8')
if(!guidedUi.includes('guidedHint2ForDisplay(current,[solution.finalAnswer.answer,...solution.finalAnswer.acceptedAnswers])'))throw new Error('Guided UI is not wired to the progressive hint2 display guard')

console.log(`PASS: ${checked} STEPを検査し、確認文の先出し${legacyRevealRestatements}件を含む${guardedHints}件をレベル2で保護。固定7件の最終答案漏洩なし。`)
