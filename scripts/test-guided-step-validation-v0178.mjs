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

const step=guided.getGuidedSolution('2024-Q1-2').steps[0]
for(const bad of ['あ','適当','わからない','123','？']){
  if(guided.validateGuidedStepResponse(step,bad))throw new Error(`irrelevant input passed: ${bad}`)
}
for(const good of ['30','5×12÷2=30','底面積30']){
  if(!guided.validateGuidedStepResponse(step,good))throw new Error(`valid step input rejected: ${good}`)
}

const step2=guided.getGuidedSolution('2024-Q1-3').steps[0]
if(!guided.validateGuidedStepResponse(step2,'y=k/x'))throw new Error('equivalent formula should pass')
if(guided.validateGuidedStepResponse(step2,'999'))throw new Error('unrelated number should fail')
console.log('PASS: Guided STEP rejects filler input while accepting required numbers/equivalent formulas')
