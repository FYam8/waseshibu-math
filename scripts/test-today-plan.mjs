import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-today-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
const tsc=fs.existsSync(compiler)?compiler:'tsc'
const built=spawnSync(tsc,['src/dailyPlan.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`dailyPlan.ts をテスト用にコンパイルできません\n${built.stdout}\n${built.stderr}`)

class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed))}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
  removeItem(k){this.map.delete(k)}
}
const seed={
  'waseshibu-math-attempts':JSON.stringify([
    {id:'a1',deviceId:'d',resetVersion:0,questionId:'exam-2024-Q1-1',mode:'q1',topic:'数式計算',status:'wrong',mistakeTag:'計算ミス',at:'2026-08-31T00:00:00.000Z'},
    {id:'a2',deviceId:'d',resetVersion:0,questionId:'exam-2024-Q2-1',mode:'q1',topic:'関数',status:'wrong',at:'2026-08-31T00:00:00.000Z'},
    {id:'a3',deviceId:'d',resetVersion:0,questionId:'exam-2024-Q5-3',mode:'q1',topic:'図形',status:'wrong',at:'2026-08-31T00:00:00.000Z'}
  ]),
  'waseshibu-math-exam-scores':JSON.stringify([{id:'e',deviceId:'d',resetVersion:0,year:2024,score:55,completed:true,at:'2026-08-31T00:00:00.000Z'}]),
  'waseshibu-math-guided-progress-v2':JSON.stringify({
    '2024-Q1-1':{questionId:'2024-Q1-1',stepProgress:{},finalAnswer:'6',finalAnswerSeen:false,reproductionAttempts:1,reproductionSucceeded:true,independentSucceeded:true,practiceStreak:4,mastery:'consolidated',updatedAt:'2026-08-01T00:00:00.000Z'}
  })
}
global.localStorage=new MemoryStorage(seed)
const require=createRequire(import.meta.url),daily=require(path.join(temp,'dailyPlan.js')),target=require(path.join(temp,'targetStrategy.js'))

if(target.targetGoalLabel(60)!=='A 60点'||target.targetGoalLabel(70)!=='B 70点'||target.targetGoalLabel(75)!=='C 75点')throw new Error('A60/B70/C75 label mismatch')
const p60=daily.buildTodayTasks(60,new Date('2026-08-31T09:00:00Z'))
const p70=daily.buildTodayTasks(70,new Date('2026-08-31T09:00:00Z'))
const p75=daily.buildTodayTasks(75,new Date('2026-08-31T09:00:00Z'))
if(p60.length>5||p70.length>5||p75.length>5)throw new Error('today task cap exceeded')
if(!p60.some(x=>x.questionId==='2024-Q1-1'))throw new Error('newer wrong answer did not reopen old consolidated weakness')
if(p60.some(x=>x.grade==='B'||x.grade==='C'))throw new Error('A60 included out-of-target B/C')
if(p70.some(x=>x.grade==='C'))throw new Error('B70 included out-of-target C')
if(!p75.some(x=>x.grade==='C'))throw new Error('C75 did not include eligible C')
console.log('PASS: 今日やること 最大5件・A60/B70/C75・新しい再誤答で弱点再開')
