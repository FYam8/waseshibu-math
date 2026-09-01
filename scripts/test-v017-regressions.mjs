import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),fail=msg=>{throw new Error(msg)},read=p=>fs.readFileSync(path.join(root,p),'utf8')

// 1) 数学的同値答案
{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-answer-'))
  const empty=path.join(temp,'types');fs.mkdirSync(empty)
  const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
  const tsc=fs.existsSync(compiler)?compiler:'tsc'
  const built=spawnSync(tsc,['src/answer.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--typeRoots',empty,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
  if(built.status!==0)fail(`answer.ts compile failed\n${built.stdout}\n${built.stderr}`)
  const require=createRequire(import.meta.url),answer=require(path.join(temp,'answer.js'))
  const cases=[
    ['√13+3','3+√13',true],
    ['12+3t-3t²/2','-3t²/2+3t+12',true],
    ['(a+b)/(ab)','1/a+1/b',true],
    ['(3t,(9/4)t²)','(3t,9t²/4)',true],
    ['y=(7√2/32)x+2','y=7√2x/32+2',true],
    ['(4,3)','(3,4)',false],
    ['1:2','2:4',true],
    ['2,3/2','3/2,2',true],
    ['√(x+1)','sqrt(x+1)',true],
    ['√(x+1)','√x+1',false]
  ]
  for(const [input,expected,want] of cases)if(answer.isAcceptedAnswer(input,expected)!==want)fail(`equivalence mismatch: ${input} / ${expected}`)
}

// 2) 採点・時間・原因・レビュー順・2026導線
const paper=read('src/pages/PastPapers.tsx'),review=read('src/components/ExamMarkReview.tsx'),route=read('src/learningRoute.ts'),guided=read('src/pages/GuidedReview.tsx'),guidedCore=read('src/guidedReview.ts')
if(!paper.includes('seconds:questionSeconds[x.key]'))fail('per-question seconds not stored')
if(paper.includes("diagnosis:x.status==='correct'?'correct':'recoverable'"))fail('all misses still forced recoverable')
for(const token of ["cause==='時間不足'?'time'","cause==='現時点では難しい'?'difficult'","nextLearningAction(strategy.target)"])if(!paper.includes(token))fail(`PastPapers missing ${token}`)
if(!review.includes('const [reviewOrder,setReviewOrder]=useState(makeOrder)')||review.includes('const wrongFirst='))fail('marking order is not frozen')
if(!route.includes('nextLearningAction')||!route.includes('for(const year of REQUIRED_MAIN_YEAR_SEQUENCE)')||!route.includes('reinforcementComplete(year,target)'))fail('common next action does not cover required five-year remediation')
if(!route.includes('const desired=weakFieldsForStoredExam(target,exam,attempts)'))fail('reinforcement plan still depends on stale stored weakFields')
if(!guided.includes("assessStep('matched')")||!guided.includes("assessStep('guided')")||!guided.includes("assessStep('unclear')"))fail('guided step self-check UI missing')
if(!guidedCore.includes("selfAssessment?:'matched'|'guided'|'unclear'"))fail('guided self assessment not persisted')

// 3) 先取り目標変更
{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-ahead-'))
  const empty=path.join(temp,'types');fs.mkdirSync(empty)
  const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
  const tsc=fs.existsSync(compiler)?compiler:'tsc'
  const built=spawnSync(tsc,['src/dailyPlan.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',empty,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
  if(built.status!==0)fail(`dailyPlan compile failed\n${built.stdout}\n${built.stderr}`)
  class MemoryStorage{constructor(seed={}){this.map=new Map(Object.entries(seed))}getItem(k){return this.map.has(k)?this.map.get(k):null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}
  global.localStorage=new MemoryStorage({
    'waseshibu-math-attempts':JSON.stringify([
      {id:'a1',deviceId:'d',resetVersion:0,questionId:'exam-2024-Q1-1',mode:'q1',topic:'数式計算',status:'wrong',at:'2026-08-31T00:00:00.000Z'},
      {id:'a2',deviceId:'d',resetVersion:0,questionId:'exam-2024-Q2-1',mode:'q1',topic:'関数',status:'wrong',at:'2026-08-31T00:00:00.000Z'},
      {id:'a3',deviceId:'d',resetVersion:0,questionId:'exam-2024-Q5-3',mode:'q1',topic:'図形',status:'wrong',at:'2026-08-31T00:00:00.000Z'}
    ]),
    'waseshibu-math-exam-scores':JSON.stringify([{id:'e',deviceId:'d',resetVersion:0,year:2024,score:55,completed:true,at:'2026-08-31T00:00:00.000Z'}]),
    'waseshibu-math-guided-progress-v2':'{}'
  })
  const require=createRequire(import.meta.url),daily=require(path.join(temp,'dailyPlan.js')),now=new Date('2026-08-31T09:00:00Z')
  daily.startNextDayPlan(75,now)
  let c=daily.buildNextDayTasks(75,now)
  if(c.length>10)fail('C study-ahead exceeded 10')
  let a=daily.buildNextDayTasks(60,now)
  if(a.length>10||a.some(x=>x.grade==='B'||x.grade==='C'))fail('study-ahead target downgrade not reconciled')
  let c2=daily.buildNextDayTasks(75,now)
  if(c2.length>10||c2.length<c.length)fail('study-ahead target restore did not refill valid slots')
}

// 4) backup keys
const backup=read('src/dataBackup.ts')
for(const key of ['waseshibu-math-daily-required-plan-v2','waseshibu-math-study-ahead-plan-v1'])if(!backup.includes(key))fail(`backup missing ${key}`)


// 5) backup round-trip for fixed daily / study-ahead plans
{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-backup-'))
  const empty=path.join(temp,'types');fs.mkdirSync(empty)
  const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
  const tsc=fs.existsSync(compiler)?compiler:'tsc'
  const built=spawnSync(tsc,['src/dataBackup.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--typeRoots',empty,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
  if(built.status!==0)fail(`dataBackup compile failed\n${built.stdout}\n${built.stderr}`)
  class MemoryStorage{constructor(seed={}){this.map=new Map(Object.entries(seed))}getItem(k){return this.map.has(k)?this.map.get(k):null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}
  const seed={
    'waseshibu-math-data-version':'5',
    'waseshibu-math-daily-required-plan-v2':JSON.stringify({date:'2026-08-31',target:70,pendingIds:['a'],completedIds:['b']}),
    'waseshibu-math-study-ahead-plan-v1':JSON.stringify({date:'2026-09-01',target:70,pendingIds:['c'],completedIds:[]})
  }
  const storage=new MemoryStorage(seed),require=createRequire(import.meta.url),backupMod=require(path.join(temp,'dataBackup.js'))
  const pack=backupMod.collectBackup(storage)
  if(!pack.data['waseshibu-math-daily-required-plan-v2']||!pack.data['waseshibu-math-study-ahead-plan-v1'])fail('plan keys missing from export')
  const restored=new MemoryStorage({'waseshibu-math-data-version':'5'})
  backupMod.restoreBackup(restored,pack,'replace')
  if(!restored.getItem('waseshibu-math-daily-required-plan-v2')||!restored.getItem('waseshibu-math-study-ahead-plan-v1'))fail('plan keys missing after restore')
}

// 6) ETA wording
const home=read('src/pages/Home.tsx')
if(!home.includes('残り学習量 約${estimate.days}日')||home.includes('学習目標ごとの推定残り日数'))fail('ETA wording still implies guaranteed arrival days')

console.log('PASS: v0.17.0 runtime regression audit — equivalence, time, diagnosis, frozen review, guided self-check, 2026 flow, target-change study-ahead, backup, ETA')
