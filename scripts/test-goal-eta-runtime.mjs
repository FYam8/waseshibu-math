import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-eta-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
const tsc=fs.existsSync(compiler)?compiler:'tsc'
const built=spawnSync(tsc,['src/targetEta.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`targetEta.ts compile failed\n${built.stdout}\n${built.stderr}`)

class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed))}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
  removeItem(k){this.map.delete(k)}
}
global.localStorage=new MemoryStorage({
  'waseshibu-math-attempts':'[]',
  'waseshibu-math-guided-progress-v2':'{}'
})
const require=createRequire(import.meta.url),eta=require(path.join(temp,'targetEta.js'))

const initial=eta.buildGoalDayEstimates(new Date('2026-08-31T09:00:00Z'))
const compact=Object.fromEntries(initial.map(x=>[x.target,{days:x.days,questions:x.includedQuestions,units:x.remainingUnits}]))
if(compact[60].questions!==88||compact[70].questions!==143||compact[75].questions!==160)throw new Error(`target inclusion mismatch ${JSON.stringify(compact)}`)
if(compact[60].days!==9||compact[70].days!==15||compact[75].days!==16)throw new Error(`initial day estimate mismatch ${JSON.stringify(compact)}`)

// A問題を1問克服済みにすると、A/B/Cすべての残り単位が1つ減る。
global.localStorage.setItem('waseshibu-math-guided-progress-v2',JSON.stringify({
  '2019-Q1-1':{questionId:'2019-Q1-1',stepProgress:{},finalAnswer:'',finalAnswerSeen:false,reproductionAttempts:1,reproductionSucceeded:true,independentSucceeded:true,practiceStreak:4,mastery:'consolidated',updatedAt:'2026-08-30T00:00:00.000Z'}
}))
const after=eta.buildGoalDayEstimates(new Date('2026-08-31T09:00:00Z'))
for(const x of after)if(x.remainingUnits!==compact[x.target].units-1)throw new Error(`mastery did not reduce ${x.target} ETA units`)

console.log('PASS: goal ETA runtime A=9日 / B=15日 / C=16日 (1日最大10課題の初期状態), progress-aware')
