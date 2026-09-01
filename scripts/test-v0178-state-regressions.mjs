import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-v0178-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',[
  'src/dailyPlan.ts','src/learningRoute.ts','src/targetEta.ts','src/remediationProgress.ts',
  '--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM',
  '--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'
],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`state modules compile failed\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url)
class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed))}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
  removeItem(k){this.map.delete(k)}
}
global.window={dispatchEvent(){},CustomEvent:class{}}

const at='2026-09-01T10:00:00.000Z'
global.localStorage=new MemoryStorage({
  'waseshibu-math-preferences':JSON.stringify({target:70,updatedAt:at}),
  'waseshibu-math-attempts':JSON.stringify([{id:'a',questionId:'exam-2024-Q1-2',mode:'q1',topic:'三角柱の表面積',status:'wrong',at}]),
  'waseshibu-math-guided-progress-v2':JSON.stringify({
    '2024-Q1-2':{questionId:'2024-Q1-2',stepProgress:{},finalAnswer:'300',finalAnswerSeen:true,reproductionAttempts:1,reproductionSucceeded:true,independentSucceeded:false,practiceStreak:2,mastery:'reproduced',updatedAt:'2026-09-01T11:00:00.000Z'}
  }),
  'waseshibu-math-remediation-progress-v1':JSON.stringify({
    '2024-Q1-2':{sourceQuestionId:'2024-Q1-2',field:'solids',rank:'A',currentIndex:2,streak:2,attemptCount:2,correctQuestionIdsInCurrentStreak:['r0','r1'],sourceAttemptAt:at,status:'in-progress',updatedAt:'2026-09-01T11:05:00.000Z'}
  })
})
const daily=require(path.join(temp,'dailyPlan.js'))
let tasks=daily.buildTodayTaskCandidates(70,new Date('2026-09-01T12:00:00.000Z'))
const resume=tasks.find(x=>x.questionId==='2024-Q1-2')
if(!resume||resume.kind!=='practice'||!resume.detail.includes('2/4')||!resume.to.includes('2024-Q1-2'))throw new Error('2/4 remediation does not reappear as a Home/daily resume task')
console.log('PASS: 2/4 remediation remains visible and links back to the correct source question')

// 2025 draft must never steal the main action while 2024 unresolved work exists.
global.localStorage=new MemoryStorage({
  'waseshibu-math-preferences':JSON.stringify({target:70,updatedAt:at}),
  'waseshibu-math-exam-scores':JSON.stringify([{id:'s24',year:2024,score:0,correctCount:0,wrongCount:1,unansweredCount:19,completed:true,at}]),
  'waseshibu-math-attempts':JSON.stringify([{id:'a24',questionId:'exam-2024-Q1-1',mode:'q1',topic:'数式計算',status:'wrong',at}]),
  'waseshibu-math-guided-review-v1':'{}',
  'waseshibu-math-guided-progress-v2':'{}',
  'waseshibu-math-exam-drafts-v2':JSON.stringify({'2025':{phase:'solve',answers:{},seconds:30,updatedAt:'2026-09-01T12:00:00.000Z'}})
})
const route=require(path.join(temp,'learningRoute.js'))
const action=route.nextLearningAction(70)
if(action.to!=='/mistakes?year=2024')throw new Error(`2025 draft stole required 2024 action: ${JSON.stringify(action)}`)
const optional=route.coreResumeDraftAction()
if(!optional||!optional.to.includes('2025'))throw new Error('2025 draft should still remain resumable as a separate draft')
console.log('PASS: required 2024 recovery outranks an opened 2025 draft')

// Optional 2019 activity must not change ETA; and display estimates must be monotonic A<=B<=C.
global.localStorage=new MemoryStorage({
  'waseshibu-math-preferences':JSON.stringify({target:70,updatedAt:at}),
  'waseshibu-math-attempts':'[]',
  'waseshibu-math-exam-scores':'[]',
  'waseshibu-math-guided-progress-v2':'{}',
  'waseshibu-math-remediation-progress-v1':'{}',
  'waseshibu-math-learning-route-v1':JSON.stringify({solvedYears:[],usedOldQuestionIds:[],reinforcement:{},updatedAt:at})
})
const eta=require(path.join(temp,'targetEta.js'))
const before=eta.buildGoalDayEstimates(new Date('2026-09-01T12:00:00.000Z'))
global.localStorage.setItem('waseshibu-math-attempts',JSON.stringify([{id:'old',questionId:'exposure-2019',mode:'q1',topic:'任意演習',status:'wrong',at}]))
const after=eta.buildGoalDayEstimates(new Date('2026-09-01T12:00:00.000Z'))
for(let i=0;i<before.length;i++)if(before[i].remainingUnits!==after[i].remainingUnits)throw new Error('optional 2019 exposure changed required ETA')
if(!(after[0].remainingUnits<=after[1].remainingUnits&&after[1].remainingUnits<=after[2].remainingUnits))throw new Error(`ETA is not monotonic: ${after.map(x=>x.remainingUnits).join(',')}`)
console.log('PASS: optional 2019 exposure is excluded from required ETA and A<=B<=C is enforced')
