import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-queue-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
const tsc=fs.existsSync(compiler)?compiler:'tsc'
const built=spawnSync(tsc,['src/dailyPlan.ts','src/learningRoute.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`queue audit compile failed\n${built.stdout}\n${built.stderr}`)

class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed))}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
  removeItem(k){this.map.delete(k)}
}
const seed={
  'waseshibu-math-attempts':JSON.stringify([
    {id:'a1',deviceId:'d',resetVersion:0,questionId:'exam-2024-Q1-1',mode:'q1',topic:'数式計算',status:'deferred',at:'2026-08-31T00:00:00.000Z'},
    {id:'a2',deviceId:'d',resetVersion:0,questionId:'exam-2024-Q1-2',mode:'q1',topic:'三角柱の表面積',status:'wrong',at:'2026-08-31T00:00:00.000Z'},
    {id:'a3',deviceId:'d',resetVersion:0,questionId:'exam-2025-Q1-1',mode:'q1',topic:'計算',status:'wrong',at:'2026-08-31T00:00:00.000Z'}
  ]),
  'waseshibu-math-exam-scores':JSON.stringify([
    {id:'e25',deviceId:'d',resetVersion:0,year:2025,score:60,completed:true,at:'2026-08-31T01:00:00.000Z'},
    {id:'e24',deviceId:'d',resetVersion:0,year:2024,score:55,completed:true,at:'2026-08-31T00:00:00.000Z'}
  ]),
  'waseshibu-math-preferences':JSON.stringify({target:75})
}
global.localStorage=new MemoryStorage(seed)
global.window={dispatchEvent(){}}
global.CustomEvent=class{constructor(type){this.type=type}}

const require=createRequire(import.meta.url)
const daily=require(path.join(temp,'dailyPlan.js'))
const route=require(path.join(temp,'learningRoute.js'))
const now=new Date('2026-08-31T09:00:00Z')

const resume={id:'progression:/past-papers?year=2019',kind:'past-paper',title:'2019年度の続きから',detail:'学習サイクルの次の1ステップ',to:'/past-papers?year=2019',priority:1}
const resumeQueue=daily.buildLearningQueue(75,now,resume)
if(resumeQueue[0]?.id!==resume.id)throw new Error('draft resume is not first in common queue')

const mistakes={id:'progression:/mistakes?year=2024',kind:'past-paper',title:'2024年度の未解決問題 2問を直す',detail:'学習サイクルの次の1ステップ',to:'/mistakes?year=2024',priority:1}
const weakQueue=daily.buildLearningQueue(75,now,mistakes)
if(!weakQueue[0]?.questionId?.startsWith('2024-'))throw new Error('2024 unresolved route did not resolve to a concrete 2024 question first')

const summary=route.unresolvedSourceSummary(2024,75)
if(!summary||summary.total!==2||summary.wrong!==1||summary.unanswered!==1)throw new Error(`unresolved summary mismatch: ${JSON.stringify(summary)}`)
const first=route.firstUnresolvedSource(75)
if(first?.year!==2024)throw new Error('first unresolved source must follow 2024 -> 2025 -> 2026 learning cycle')

daily.startNextDayPlan(75,now,resume)
const ahead=daily.buildNextDayTasks(75,now,resume)
if(ahead[0]?.id!==resume.id)throw new Error('study-ahead first task must match common queue first task')

const home=fs.readFileSync(path.join(root,'src/pages/Home.tsx'),'utf8')
if(home.includes('phaseAction('))throw new Error('Home still owns an independent phaseAction decision engine')
for(const token of ['firstUnresolvedSource','primaryQueueTask','未解決','誤答 {unresolved.wrong}問・未回答 {unresolved.unanswered}問']){
  if(!home.includes(token))throw new Error(`Home consistency token missing: ${token}`)
}

// 旧版で固定済みの日次・先取り計画も、更新直後に共通キュー順へ一度だけ再整列する。
global.localStorage=new MemoryStorage({
  ...seed,
  'waseshibu-math-daily-required-plan-v2':JSON.stringify({date:'2026-08-31',target:75,pendingIds:['review-2024-Q1-1'],completedIds:[]}),
  'waseshibu-math-study-ahead-plan-v1':JSON.stringify({date:'2026-09-01',target:75,pendingIds:['review-2024-Q1-1'],completedIds:[]})
})
const migratedToday=daily.buildTodayTasks(75,now,resume)
if(migratedToday[0]?.id!==resume.id)throw new Error('legacy daily plan was not realigned to common queue')
const migratedAhead=daily.buildNextDayTasks(75,now,resume)
if(migratedAhead[0]?.id!==resume.id)throw new Error('legacy study-ahead plan was not realigned to common queue')

console.log('PASS: learning queue / weakness / route / study-ahead consistency')
