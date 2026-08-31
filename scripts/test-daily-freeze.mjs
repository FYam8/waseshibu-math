import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-freeze-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
const tsc=fs.existsSync(compiler)?compiler:'tsc'
const built=spawnSync(tsc,['src/dailyPlan.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`dailyPlan.ts compile failed\n${built.stdout}\n${built.stderr}`)

class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed))}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
  removeItem(k){this.map.delete(k)}
}
const questions=JSON.parse(fs.readFileSync(path.join(root,'src/data/questions.json'),'utf8'))
const ids=questions.questions.filter(m=>m.year===2024).flatMap(m=>m.subquestions.map(s=>`${m.id}-${s.no}`)).slice(0,12)
const attempts=ids.map((qid,i)=>({id:`w${i}`,deviceId:'d',resetVersion:0,questionId:`exam-${qid}`,mode:'q1',topic:'確認',status:'wrong',at:`2026-08-31T00:${String(59-i).padStart(2,'0')}:00.000Z`}))
global.localStorage=new MemoryStorage({
  'waseshibu-math-attempts':JSON.stringify(attempts),
  'waseshibu-math-exam-scores':'[]',
  'waseshibu-math-guided-progress-v2':'{}'
})
const require=createRequire(import.meta.url),daily=require(path.join(temp,'dailyPlan.js'))
const now=new Date('2026-08-31T09:00:00Z')
const first=daily.buildTodayTasks(75,now)
if(first.length!==10)throw new Error(`expected exactly 10 initial required tasks, got ${first.length}`)
const completed=first[0].questionId
const newerCorrect={id:'correct-new',deviceId:'d',resetVersion:0,questionId:`exam-${completed}`,mode:'q1',topic:'確認',status:'correct',at:'2026-08-31T01:30:00.000Z'}
global.localStorage.setItem('waseshibu-math-attempts',JSON.stringify([newerCorrect,...attempts]))
const second=daily.buildTodayTasks(75,now)
if(second.length!==9)throw new Error(`11th task was auto-refilled; expected 9 remaining, got ${second.length}`)
// 目標を変えても「今日の必須総数」が10を超えないことを確認。
const afterSwitch=daily.buildTodayTasks(60,now)
const rawPlan=JSON.parse(global.localStorage.getItem('waseshibu-math-daily-required-plan-v2'))
if(rawPlan.completedIds.length+rawPlan.pendingIds.length>10)throw new Error('target switch exceeded the daily total cap of 10')
if(afterSwitch.length>10-rawPlan.completedIds.length)throw new Error('target switch refilled beyond remaining daily slots')


const nextDay=daily.buildTodayTasks(75,new Date('2026-09-01T09:00:00Z'))
if(nextDay.length<1||nextDay.length>10)throw new Error('next day should generate a fresh plan of up to 10')

// 候補がない日の「学習サイクル次の1件」も日次計画に固定し、完了後に次フェーズを必須補充しない。
global.localStorage=new MemoryStorage({
  'waseshibu-math-attempts':'[]',
  'waseshibu-math-exam-scores':'[]',
  'waseshibu-math-guided-progress-v2':'{}'
})
const fallback1={id:'progression:/past-papers?year=2024',kind:'past-paper',title:'2024年度を解く',detail:'次の1ステップ',to:'/past-papers?year=2024',priority:1}
const fallback2={id:'progression:/reinforce?source=2024',kind:'past-paper',title:'弱点を直す',detail:'次の1ステップ',to:'/reinforce?source=2024',priority:1}
const onlyOne=daily.buildTodayTasks(70,now,fallback1)
if(onlyOne.length!==1||onlyOne[0].id!==fallback1.id)throw new Error('fallback progression should be the single required task')
const afterFallbackDone=daily.buildTodayTasks(70,now,fallback2)
if(afterFallbackDone.length!==0)throw new Error('next progression was auto-refilled as another required task')
const optionalAfter=daily.buildOptionalNextTask(70,now,fallback2)
if(!optionalAfter||optionalAfter.id!==fallback2.id)throw new Error('next progression should remain available as optional continuation')

console.log('PASS: 1日10件を固定し、完了後の11件目を自動補充せず、目標変更でも必須総数10件を超えない')
