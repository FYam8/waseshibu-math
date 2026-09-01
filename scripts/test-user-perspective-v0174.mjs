import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-user-v0174-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
const tsc=fs.existsSync(compiler)?compiler:'tsc'
const built=spawnSync(tsc,['src/learningRoute.ts','src/dailyPlan.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`compile failed\n${built.stdout}\n${built.stderr}`)
class MemoryStorage{constructor(seed={}){this.map=new Map(Object.entries(seed))}getItem(k){return this.map.has(k)?this.map.get(k):null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}
global.window={dispatchEvent(){},addEventListener(){},removeEventListener(){}}
global.CustomEvent=class {constructor(type){this.type=type}}
const require=createRequire(import.meta.url)
const route=require(path.join(temp,'learningRoute.js'))
const daily=require(path.join(temp,'dailyPlan.js'))
const base={
 'waseshibu-math-preferences':JSON.stringify({target:60}),
 'waseshibu-math-attempts':'[]','waseshibu-math-exam-scores':'[]',
 'waseshibu-math-guided-progress-v2':'{}','waseshibu-math-guided-reviews-v1':'{}',
 'waseshibu-math-learning-route-v1':JSON.stringify({solvedYears:[],usedOldQuestionIds:[],reinforcement:{},updatedAt:'2026-09-01T00:00:00.000Z'}),
 'waseshibu-math-exam-drafts-v2':'{}'
}
const reset=(extra={})=>{global.localStorage=new MemoryStorage({...base,...extra})}
const attempt=(questionId,at='2026-09-01T00:00:00.000Z',status='deferred',topic='過去問')=>({id:`a-${questionId}`,deviceId:'d',resetVersion:0,questionId,mode:'multi',topic,status,at})

// A: 年度画面を開くだけで初見性を失う
reset({'waseshibu-math-attempts':JSON.stringify([attempt('exposure-2025')])})
if(route.yearExposureState(2025)!=='partially_exposed')throw new Error('opening 2025 still treated as untouched')
console.log('PASS: opening a full-year paper marks it exposed')

// B: 2025を見ただけでも未使用確認年度から外れ、2026を選ぶ
reset({
 'waseshibu-math-attempts':JSON.stringify([attempt('exposure-2025')]),
 'waseshibu-math-exam-scores':JSON.stringify([{id:'e24',deviceId:'d',resetVersion:0,year:2024,score:100,completed:true,scoreValidity:'first-look',at:'2026-08-20T00:00:00.000Z'}])
})
if(route.nextCheckpointYear()!==2023)throw new Error(`required flow must choose 2023 before later years, got ${route.nextCheckpointYear()}`)
console.log('PASS: untouched checkpoint is preferred after view-only exposure')

// C: 旧年度を通しで開いたら、その年度の全小問を「未使用補強」として再提示しない
reset({'waseshibu-math-attempts':JSON.stringify([attempt('exposure-2021')])})
const y21=route.oldQuestionBank().filter(x=>x.year===2021)
if(!y21.length)throw new Error('fixture: no 2021 questions')
if(y21.some(x=>route.oldQuestionAssignmentState(x.id)!=='exposed'))throw new Error('opened 2021 contains questions still marked unused')
console.log('PASS: full-year old-paper viewing exposes all its subquestions')

// D: 露出済み旧年度は補強予約から除外
const sourceAttempt=attempt('exam-2024-Q1-1','2026-09-01T01:00:00.000Z','wrong','数式計算')
reset({
 'waseshibu-math-attempts':JSON.stringify([attempt('exposure-2021'),sourceAttempt]),
 'waseshibu-math-exam-scores':JSON.stringify([{id:'e24',deviceId:'d',resetVersion:0,year:2024,score:55,completed:true,weakFields:['式の計算・文字式'],at:'2026-09-01T01:00:00.000Z'}])
})
const plan=route.ensureReinforcementPlan(JSON.parse(global.localStorage.getItem('waseshibu-math-exam-scores'))[0],60)
const selected=Object.values(plan.fields).flat()
if(selected.some(id=>id.startsWith('2021-')))throw new Error('opened 2021 was reused as unused reinforcement')
console.log('PASS: viewed old year is excluded from reinforcement candidates')

// E: 任意旧年度誤答は必須キューを横取りしない
reset({'waseshibu-math-attempts':JSON.stringify([
 attempt('exam-2019-Q1-1','2026-09-01T03:00:00.000Z','wrong','数式計算'),
 attempt('exam-2024-Q1-1','2026-09-01T02:00:00.000Z','wrong','数式計算')
])})
const tasks=daily.buildTodayTaskCandidates(60,new Date('2026-09-01T09:00:00Z'))
if(tasks.some(x=>x.questionId==='2019-Q1-1'))throw new Error('optional 2019 mistake entered required queue')
if(!tasks.some(x=>x.questionId==='2024-Q1-1'))throw new Error('2024 core mistake missing')
console.log('PASS: optional old-year mistakes stay outside required queue')

// F: 複数ドラフトでは主学習を優先、任意旧年度は保持
reset({'waseshibu-math-exam-drafts-v2':JSON.stringify({
 '2019':{phase:'mark',answers:{},seconds:200,updatedAt:'2026-09-01T06:00:00.000Z'},
 '2024':{phase:'solve',answers:{'2024-Q1-1':'x'},seconds:30,updatedAt:'2026-09-01T05:00:00.000Z'}
})})
if(!route.coreResumeDraftAction()?.to.includes('year=2024'))throw new Error('old optional draft masks core draft')
if(!route.optionalOldYearDraftAction()?.to.includes('year=2019'))throw new Error('optional old draft lost')
console.log('PASS: core draft priority and optional draft preservation')

// G: 画面実装が露出イベントを保存し、採点時に露出状態を参照する
const pp=fs.readFileSync('src/pages/PastPapers.tsx','utf8')
if(!pp.includes('questionId:id')||!pp.includes('const id=`exposure-${year}`'))throw new Error('PastPapers no longer persists exposure event')
if(!pp.includes('const [firstLookEligible]=useState(inferredFirstLook)'))throw new Error('first-look eligibility is not captured before exposure event')
if(!pp.includes('firstLookEligible})'))throw new Error('first-look eligibility is not persisted in draft')
if(!pp.includes("scoreValidity:!prior&&firstLookEligible?'first-look':'reference'"))throw new Error('score validity does not preserve the current first-look attempt')
console.log('PASS: UI exposure event and first-look attempt context stay distinct')


// H: 推奨ルート外の警告を見ただけでは年度を露出済みにしない
if(!pp.includes("if(phase!=='solve'||(needsWarning&&!warningAccepted))return"))throw new Error('warning-only visit can still persist exposure')
if(!pp.includes("if(phase==='result'||(needsWarning&&!warningAccepted))return;writeDraft"))throw new Error('warning-only visit can still create/update a phantom draft')
console.log('PASS: warning-only visits do not consume first-look eligibility')


// I: 学習履歴画面でも2019〜2021の任意得点が「現在段階」を上書きしない
const report=fs.readFileSync('src/pages/Report.tsx','utf8')
if(!report.includes('const latest=latestMainCheckExam()??null'))throw new Error('Report current stage still follows the latest optional old-year score')
if(!report.includes('2019〜2021年度は補強・任意演習の履歴として保存し、現在段階を上書きしません'))throw new Error('Report does not explain old-year score role')
if(!report.includes("x.scoreValidity==='first-look'?'初見スコア'"))throw new Error('score history does not distinguish first-look/reference')
const home=fs.readFileSync('src/pages/Home.tsx','utf8')
if(!home.includes('参考スコア（初見比較には使わない）'))throw new Error('Home does not disclose reference-score status')
console.log('PASS: optional old-year scores do not redefine current stage and score validity is visible')


// J: 得点だけの手入力は学習ルートを勝手に完了させない
reset({
 'waseshibu-math-exam-scores':JSON.stringify([
   {id:'manual24',deviceId:'d',resetVersion:0,year:2024,score:70,completed:true,at:'2026-09-01T10:00:00.000Z'}
 ])
})
if(route.latestExam(2024))throw new Error('manual score without question-level detail is treated as a completed diagnosis')
if(route.nextLearningAction(60).to!=='/past-papers?year=2024')throw new Error('manual score incorrectly advances the core learning cycle')
console.log('PASS: score-only manual records do not bypass question-level diagnosis')


// K: 得点だけの手入力では大問1失点を「0」と断定しない
if(!home.includes("const q1Miss=latest&&latestItems.length?"))throw new Error('Home still renders zero Q1 misses from a score-only manual record')
if(!home.includes('この得点は得点記録のみです。弱点や大問1の失点数を出すには'))throw new Error('Home does not explain missing question-level diagnosis for manual score')
console.log('PASS: score-only records do not masquerade as zero Q1 mistakes')

console.log('PASS: v0.17.5 user-perspective scenarios')
