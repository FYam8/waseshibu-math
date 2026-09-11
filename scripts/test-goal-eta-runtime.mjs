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
const baseSeed={
  'waseshibu-math-attempts':'[]',
  'waseshibu-math-exam-scores':'[]',
  'waseshibu-math-guided-progress-v2':'{}',
  'waseshibu-math-guided-review-v1':'{}',
  'waseshibu-math-level2-history-v1':JSON.stringify({schemaVersion:1,attempts:[],questionStats:{},sessions:{},masteryEvents:[]}),
  'waseshibu-math-learning-route-v1':JSON.stringify({solvedYears:[],usedOldQuestionIds:[],reinforcement:{},completedCoreByTarget:{},updatedAt:'1970-01-01T00:00:00.000Z'}),
  'waseshibu-math-preferences':JSON.stringify({target:70,updatedAt:'1970-01-01T00:00:00.000Z'})
}
global.localStorage=new MemoryStorage(baseSeed)
global.window={dispatchEvent(){}}
const require=createRequire(import.meta.url),eta=require(path.join(temp,'targetEta.js'))

const data=JSON.parse(fs.readFileSync('src/data/questions.json','utf8')).questions
const sequence=[2024,2023,2022,2025,2026]
const inTarget=(target,grade)=>grade==='A'||(grade==='B'&&target>=70)||(grade==='C'&&target>=75)
const practiceCount=major=>major===1?4:(major===2||major===3?3:2)
function expected(target,yearFilter=sequence){
  return data.filter(major=>yearFilter.includes(major.year)).reduce((sum,major)=>sum+major.subquestions.reduce((subSum,sub)=>subSum+1+(inTarget(target,sub.grade)?1+practiceCount(major.major):0),0),0)
}

const initial=eta.buildGoalDayEstimates(new Date('2026-08-31T09:00:00Z'))
for(const item of initial){
  const want=expected(item.target)
  if(item.remainingQuestions!==want)throw new Error(`initial reservation mismatch target=${item.target}: ${item.remainingQuestions} != ${want}`)
  if(item.remainingUnits!==want)throw new Error(`compat remainingUnits mismatch target=${item.target}`)
  if(item.days!==Math.ceil(want/10))throw new Error(`day estimate mismatch target=${item.target}`)
  if(item.includedQuestions!==100)throw new Error(`all five required years must count full-paper questions: ${item.includedQuestions}`)
}

// 別枠の2019年度学習は本線ETAを変えない。
global.localStorage.setItem('waseshibu-math-guided-progress-v2',JSON.stringify({
  '2019-Q1-1':{questionId:'2019-Q1-1',stepProgress:{},finalAnswer:'',finalAnswerSeen:false,reproductionAttempts:1,reproductionSucceeded:true,independentSucceeded:true,practiceStreak:4,mastery:'consolidated',updatedAt:'2026-08-30T00:00:00.000Z'}
}))
const afterOldOptional=eta.buildGoalDayEstimates(new Date('2026-08-31T09:00:00Z'))
for(const item of afterOldOptional){
  const before=initial.find(x=>x.target===item.target)
  if(item.remainingQuestions!==before.remainingQuestions)throw new Error(`optional old-year work incorrectly changed ${item.target} ETA`)
}

// 60点目標で2024本線を完了ロックすると、2024の予約分だけ消える。70/75は別目標なのでロックしない。
global.localStorage.setItem('waseshibu-math-learning-route-v1',JSON.stringify({solvedYears:[2024],usedOldQuestionIds:[],reinforcement:{},completedCoreByTarget:{'60':[2024]},updatedAt:'2026-08-31T10:00:00.000Z'}))
const locked=eta.buildGoalDayEstimates(new Date('2026-08-31T10:00:00Z'))
const sixty=locked.find(x=>x.target===60),seventy=locked.find(x=>x.target===70)
if(sixty.remainingQuestions!==expected(60,[2023,2022,2025,2026]))throw new Error('60 target core completion lock did not remove 2024 reservation')
if(seventy.remainingQuestions!==expected(70))throw new Error('60 target lock must not remove 70 target work')

// 大問別の予約数を固定する。
if(eta.reservedQuestionCount('2024-Q1-1','A',60)!==6)throw new Error('Q1 reservation must be past-paper 1 + repair 1 + fixed practice 4')
if(eta.reservedQuestionCount('2024-Q2-1','A',60)!==5)throw new Error('Q2 reservation must be 1+1+3')
if(eta.reservedQuestionCount('2024-Q4-1','A',60)!==4)throw new Error('Q4 reservation must be 1+1+2')
if(eta.reservedQuestionCount('2024-Q4-1','C',60)!==1)throw new Error('out-of-target question must count only the full-paper question itself')

console.log('PASS: monotonic goal ETA reserves full-paper + repair + fixed practice, excludes optional old-year extras, and respects target-specific completion locks')
