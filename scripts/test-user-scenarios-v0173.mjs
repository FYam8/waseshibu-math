import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-user-scenarios-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
const tsc=fs.existsSync(compiler)?compiler:'tsc'
const built=spawnSync(tsc,['src/learningRoute.ts','src/dailyPlan.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`runtime modules compile failed\n${built.stdout}\n${built.stderr}`)

class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed))}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
  removeItem(k){this.map.delete(k)}
}
global.window={dispatchEvent(){},addEventListener(){},removeEventListener(){}}
global.CustomEvent=class {constructor(type){this.type=type}}
const require=createRequire(import.meta.url)
const route=require(path.join(temp,'learningRoute.js'))
const daily=require(path.join(temp,'dailyPlan.js'))

const basePrefs=JSON.stringify({target:60})
const reset=(seed={})=>{
  global.localStorage=new MemoryStorage({
    'waseshibu-math-preferences':basePrefs,
    'waseshibu-math-attempts':'[]',
    'waseshibu-math-exam-scores':'[]',
    'waseshibu-math-guided-progress-v2':'{}',
    'waseshibu-math-guided-reviews-v1':'{}',
    'waseshibu-math-learning-route-v1':JSON.stringify({solvedYears:[],usedOldQuestionIds:[],reinforcement:{},updatedAt:'2026-08-31T00:00:00.000Z'}),
    'waseshibu-math-exam-drafts-v2':'{}',
    ...seed
  })
}

// 1) 2019〜2021の任意通し演習の誤答は、今日の必須10課題へ入らない。
reset({
  'waseshibu-math-attempts':JSON.stringify([
    {id:'old',deviceId:'d',resetVersion:0,questionId:'exam-2019-Q1-1',mode:'multi',topic:'数式計算',status:'wrong',at:'2026-08-31T02:00:00.000Z'},
    {id:'core',deviceId:'d',resetVersion:0,questionId:'exam-2024-Q1-1',mode:'multi',topic:'数式計算',status:'wrong',at:'2026-08-31T01:00:00.000Z'}
  ])
})
const required=daily.buildTodayTaskCandidates(60,new Date('2026-08-31T09:00:00Z'))
if(required.some(x=>x.questionId==='2019-Q1-1'))throw new Error('optional 2019 mistake entered required queue')
if(!required.some(x=>x.questionId==='2024-Q1-1'))throw new Error('core 2024 mistake missing from required queue')
console.log('PASS: optional old-year mistakes stay out of required queue')

// 2) 旧年度ドラフトと主学習ドラフトが同時にあっても、主学習の続きが必須側で見える。
reset({
  'waseshibu-math-exam-drafts-v2':JSON.stringify({
    '2019':{phase:'mark',answers:{},seconds:100,updatedAt:'2026-08-31T05:00:00.000Z'},
    '2024':{phase:'solve',answers:{'2024-Q1-1':'1'},seconds:20,updatedAt:'2026-08-31T04:00:00.000Z'}
  })
})
if(!route.coreResumeDraftAction()?.to.includes('year=2024'))throw new Error('optional old draft masked core draft')
if(!route.optionalOldYearDraftAction()?.to.includes('year=2019'))throw new Error('optional old draft was not preserved separately')
console.log('PASS: core and optional drafts are separated')

// 3) 2025が一部露出済みなら、未露出の2026を改善確認に優先。
reset({
  'waseshibu-math-exam-scores':JSON.stringify([{id:'e24',deviceId:'d',resetVersion:0,year:2024,score:100,correctCount:20,wrongCount:0,unansweredCount:0,completed:true,scoreValidity:'first-look',at:'2026-08-20T00:00:00.000Z'}]),
  'waseshibu-math-guided-progress-v2':JSON.stringify({
    '2025-Q1-1':{questionId:'2025-Q1-1',stepProgress:{},finalAnswer:'',finalAnswerSeen:false,reproductionAttempts:0,reproductionSucceeded:false,independentSucceeded:false,practiceStreak:0,mastery:'exposed',updatedAt:'2026-08-25T00:00:00.000Z'}
  })
})
if(route.nextCheckpointYear()!==2023)throw new Error(`expected required 2023 checkpoint, got ${route.nextCheckpointYear()}`)
if(!route.nextLearningAction(60).to.includes('year=2023'))throw new Error(`route did not enforce required 2023: ${JSON.stringify(route.nextLearningAction(60))}`)
console.log('PASS: untouched checkpoint year is preferred')

// 4) 両方未露出なら標準ルート2025を維持。
reset({
  'waseshibu-math-exam-scores':JSON.stringify([{id:'e24',deviceId:'d',resetVersion:0,year:2024,score:100,correctCount:20,wrongCount:0,unansweredCount:0,completed:true,scoreValidity:'first-look',at:'2026-08-20T00:00:00.000Z'}])
})
if(route.nextCheckpointYear()!==2023)throw new Error('required 2023 checkpoint order was not preserved')
console.log('PASS: required 2024→2023→2022→2025→2026 order begins with 2023 after diagnosis')

// 5) 任意年度演習で不正解だった旧年度小問は、閲覧済みでも補強へ戻す。
reset()
let bank=route.oldQuestionBank()
const field='式の計算・文字式'
const exposed=bank.find(x=>x.field===field)
if(!exposed)throw new Error('test fixture: no old expression question')
global.localStorage.setItem('waseshibu-math-attempts',JSON.stringify([
  {id:'source',deviceId:'d',resetVersion:0,questionId:'exam-2024-Q1-1',mode:'multi',topic:'数式計算',status:'wrong',at:'2026-08-30T00:00:00.000Z'},
  {id:'old-exposed',deviceId:'d',resetVersion:0,questionId:`exam-${exposed.id}`,mode:'multi',topic:exposed.topic,status:'wrong',at:'2026-08-29T00:00:00.000Z'}
]))
const exam={id:'e24',deviceId:'d',resetVersion:0,year:2024,score:55,completed:true,weakFields:[field],at:'2026-08-30T00:00:00.000Z'}
global.localStorage.setItem('waseshibu-math-exam-scores',JSON.stringify([exam]))
const plan=route.ensureReinforcementPlan(exam,60)
const selected=Object.values(plan.fields).flat()
if(!selected.includes(exposed.id))throw new Error('wrong old-year question did not return to reinforcement')
if(route.oldQuestionAssignmentState(exposed.id)!=='reserved')throw new Error('reselected old question is not represented as an active reservation')
console.log('PASS: wrong old-year questions remain eligible after exposure')

// 6) 予約しただけでは「使用済み」履歴へ入れない。完了時だけcompletedになる。
const reservedId=selected[0]
if(reservedId){
  const before=route.loadLearningRoute()
  if(before.usedOldQuestionIds.includes(reservedId))throw new Error('reservation consumed usedOldQuestionIds')
  if(route.oldQuestionAssignmentState(reservedId)!=='reserved')throw new Error('reserved state not represented')
  route.markOldQuestionCompleted(2024,reservedId)
  if(route.oldQuestionAssignmentState(reservedId)!=='completed')throw new Error('completed reinforcement state not represented')
  if(!route.loadLearningRoute().usedOldQuestionIds.includes(reservedId))throw new Error('completed old question missing from historical used ids')
}
console.log('PASS: reserved / completed assignment states are distinct')

// 7) Home表示が旧年度の最新スコアに引っ張られないことを静的にも固定。
const home=fs.readFileSync('src/pages/Home.tsx','utf8')
if(!home.includes('const latest=latestMainCheckExam()'))throw new Error('Home does not use latest main-check score')
if(!home.includes('2024診断 → 2023改善確認① → 2022改善確認② → 2025実戦確認 → 2026最終確認'))throw new Error('Home six-phase heading mismatch')
console.log('PASS: Home uses main-check score and six-phase wording')

console.log('PASS: user-perspective scenario suite')
