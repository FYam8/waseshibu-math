import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'shared-learning-flow-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
const built=spawnSync(compiler,['src/engine/learningFlow.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`learning flow compile failed\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),flow=require(path.join(temp,'learningFlow.js'))

const base={currentMastery:'attempted',correct:true,mode:'retry',finalAnswerSeen:true,stepHintLevels:[0,0],dependencyMode:'own',reproductionAttempts:0,reproductionSucceeded:false,independentSucceeded:false}
assert.deepEqual(flow.deriveCanonicalGuidedFinal(base),{mastery:'reproduced',reproductionAttempts:1,reproductionSucceeded:true,independentSucceeded:false,answerExposed:true,hintUsed:false})
assert.equal(flow.deriveCanonicalGuidedFinal({...base,mode:'guided',finalAnswerSeen:false}).mastery,'independent')
assert.equal(flow.deriveCanonicalGuidedFinal({...base,currentMastery:'consolidated',correct:false}).mastery,'attempted')
assert.equal(flow.canAdvanceCanonicalGuidedStep({assessment:'matched',responseValid:true,hintLevel:0}),true)
assert.equal(flow.canAdvanceCanonicalGuidedStep({assessment:'guided',responseValid:false,hintLevel:2}),false)
assert.equal(flow.canAdvanceCanonicalGuidedStep({assessment:'guided',responseValid:false,hintLevel:3}),true)
assert.equal(flow.clampCanonicalStepIndex(99,3),2)

let set=flow.reconcileCanonicalFixedSet({requiredCount:4,eligibleProblemIds:['p1','p2','p3','p4','p5'],fixedProblemIds:['p1','p2'],completedProblemIds:['p1'],orderedCandidateIds:['p3','p4','p5'],directProblemId:'p2',lastProblemId:null})
assert.deepEqual(set.problemIds,['p1','p2','p3','p4'])
assert.deepEqual(set.completedProblemIds,['p1'])
set=flow.applyCanonicalFixedSetResult({set,problemId:'p2',qualifying:false})
assert.deepEqual(set.completedProblemIds,['p1'])
assert.deepEqual(set.retryProblemIds,['p2'])
set=flow.applyCanonicalFixedSetResult({set,problemId:'p3',qualifying:true})
assert.deepEqual(set.completedProblemIds,['p1','p3'])
assert.equal(flow.nextCanonicalFixedSetIndex(set.problemIds,set.completedProblemIds,2),3)
for(const id of ['p2','p4'])set=flow.applyCanonicalFixedSetResult({set,problemId:id,qualifying:true})
assert.equal(set.status,'completed')
assert.equal(flow.nextCanonicalFixedSetIndex(set.problemIds,set.completedProblemIds,3),-1)
assert.equal(flow.nextCanonicalSequenceIndex(1,3),2)
assert.equal(flow.nextCanonicalSequenceIndex(2,3),-1)

const source=fs.readFileSync(path.join(root,'src/engine/learningFlow.ts'),'utf8')
assert.doesNotMatch(source,/waseshibu|rikkyo|L1|L2|CALCULATION|R\d{2}-MATH|\b20\d{2}\b/i)
assert.doesNotMatch(source,/localStorage|sessionStorage|IndexedDB|fetch\(/i)
assert.match(fs.readFileSync(path.join(root,'src/guidedReview.ts'),'utf8'),/deriveCanonicalGuidedFinal/)
assert.match(fs.readFileSync(path.join(root,'src/level2History.ts'),'utf8'),/applyCanonicalFixedSetResult/)

const esbuild=process.platform==='win32'?path.join(root,'node_modules','.bin','esbuild.cmd'):path.join(root,'node_modules','.bin','esbuild')
const runtime=path.join(temp,'learningFlow.runtime.js')
const bundled=spawnSync(esbuild,['src/engine/learningFlow.ts','--bundle','--format=iife','--global-name=CanonicalLearningFlow','--platform=browser','--target=es2020',`--outfile=${runtime}`],{cwd:root,encoding:'utf8'})
if(bundled.status!==0)throw new Error(`learning flow runtime build failed\n${bundled.stdout}\n${bundled.stderr}`)
assert.equal(fs.readFileSync(runtime,'utf8'),fs.readFileSync(path.join(root,'src/engine/learningFlow.runtime.js'),'utf8'),'checked-in browser runtime drifted from canonical TypeScript')
console.log('PASS shared learning flow: guided reproduction and fixed-set state machine')
