import questions from './data/questions.json'
import type { ExamScore, MajorQuestion } from './types'
import { classifyRemediationField } from './data/remediation'
import { loadAttempts, loadExamScores, loadPreferences } from './storage'
import { canWriteLearningData, notifyWriteBlocked } from './version'
import { loadGuidedProgressState, loadGuidedReviews } from './guidedReview'
import { gradeInTarget, storedExamItems, weakFieldsForStoredExam, type TargetScore } from './targetStrategy'

const ROUTE_KEY='waseshibu-math-learning-route-v1'

export type ReinforcementPlan={
  examId:string
  sourceYear:number
  target?:TargetScore
  fields:Record<string,string[]>
  completedQuestionIds:string[]
  createdAt:string
  requiresSourceReview?:boolean
}

export type LearningRouteState={
  solvedYears:number[]
  usedOldQuestionIds:string[]
  reinforcement:Record<string,ReinforcementPlan>
  updatedAt:string
}

export type SourceMistakeProgress={requiredIds:string[];completedIds:string[];remainingIds:string[];complete:boolean}

const empty=():LearningRouteState=>({solvedYears:[],usedOldQuestionIds:[],reinforcement:{},updatedAt:new Date(0).toISOString()})

export function loadLearningRoute():LearningRouteState{
  try{
    const raw=JSON.parse(localStorage.getItem(ROUTE_KEY)||'null')
    if(!raw)return empty()
    return {
      solvedYears:Array.isArray(raw.solvedYears)?raw.solvedYears.filter(Number.isInteger):[],
      usedOldQuestionIds:Array.isArray(raw.usedOldQuestionIds)?raw.usedOldQuestionIds.map(String):[],
      reinforcement:raw.reinforcement&&typeof raw.reinforcement==='object'?raw.reinforcement:{},
      updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:new Date(0).toISOString()
    }
  }catch{return empty()}
}

export function saveLearningRoute(state:LearningRouteState){
  if(!canWriteLearningData()){notifyWriteBlocked();return}
  localStorage.setItem(ROUTE_KEY,JSON.stringify({...state,updatedAt:new Date().toISOString()}))
  window.dispatchEvent(new CustomEvent('waseshibu-route-change'))
}

export function markYearSolved(year:number){
  const state=loadLearningRoute()
  if(state.solvedYears.includes(year))return
  saveLearningRoute({...state,solvedYears:[...state.solvedYears,year]})
}

export type OldQuestionItem={id:string,year:number,major:number,subNo:string,topic:string,title:string,field:string}

export function oldQuestionBank():OldQuestionItem[]{
  return (questions.questions as MajorQuestion[]).filter(q=>q.year>=2019&&q.year<=2023).flatMap(q=>q.subquestions.map(s=>({
    id:`${q.id}-${s.no}`,year:q.year,major:q.major,subNo:s.no,topic:s.topic,title:q.title,field:classifyRemediationField(s.topic).title
  })))
}

function hasQuestionLevelExamDetail(exam:ExamScore){
  if(exam.correctCount!==undefined||exam.wrongCount!==undefined||exam.unansweredCount!==undefined)return true
  return loadAttempts().some(a=>a.at===exam.at&&a.questionId.startsWith(`exam-${exam.year}-Q`))
}

// 学習ルート・弱点補強は「得点だけの手入力」では進めない。
// 小問別の正誤が保存された年度だけを、診断済みの過去問として扱う。
export function latestExam(year:number){
  return loadExamScores().filter(x=>x.year===year&&x.completed!==false&&hasQuestionLevelExamDetail(x)).sort((a,b)=>b.at.localeCompare(a.at))[0]
}

// Home/得点履歴の「最新得点」は、手入力も含む主確認年度の最新記録を表示してよい。
// ただし学習ルート判定には latestExam() を使う。
export function latestMainCheckExam(){
  return loadExamScores().filter(x=>x.completed!==false&&x.year>=2024&&x.year<=2026).sort((a,b)=>b.at.localeCompare(a.at))[0]
}

export function isMainCheckYear(year:number){
  return year>=2024&&year<=2026
}

function actualOldQuestionExposureIds(){
  const ids=new Set<string>()
  const openedYears=new Set<number>()
  for(const attempt of loadAttempts()){
    const exposure=attempt.questionId.match(/^exposure-(20(?:19|2[0-3]))$/)
    if(exposure)openedYears.add(Number(exposure[1]))
    const raw=attempt.questionId.startsWith('exam-')?attempt.questionId.slice(5):attempt.questionId.startsWith('target-')?attempt.questionId.slice(7):''
    if(/^20(19|2[0-3])-Q\d+-/.test(raw))ids.add(raw)
  }
  // 年度通し画面はその年度の問題全体を表示するため、開いた時点で全小問を露出済みとみなす。
  for(const item of oldQuestionBank())if(openedYears.has(item.year))ids.add(item.id)
  const guided=loadGuidedProgressState()
  for(const [id,state] of Object.entries(guided)){
    if(/^20(19|2[0-3])-Q\d+-/.test(id)&&state?.mastery!=='unseen')ids.add(id)
  }
  return ids
}

export type OldQuestionAssignmentState='none'|'reserved'|'completed'|'exposed'
export function oldQuestionAssignmentState(id:string):OldQuestionAssignmentState{
  const state=loadLearningRoute()
  for(const plan of Object.values(state.reinforcement)){
    if(plan.completedQuestionIds.includes(id))return 'completed'
  }
  if(actualOldQuestionExposureIds().has(id))return 'exposed'
  for(const plan of Object.values(state.reinforcement)){
    if(Object.values(plan.fields).some(ids=>ids.includes(id)))return 'reserved'
  }
  return 'none'
}

export function sourceMistakeProgress(year:number,target:TargetScore=loadPreferences().target):SourceMistakeProgress{
  const exam=latestExam(year)
  if(!exam)return {requiredIds:[],completedIds:[],remainingIds:[],complete:false}
  const attempts=loadAttempts(),reviews=loadGuidedReviews(),progress=loadGuidedProgressState()
  const requiredIds=storedExamItems(exam,attempts).filter(item=>item.status!=='correct'&&gradeInTarget(target,item.grade)).map(item=>item.key)
  const completedIds=requiredIds.filter(id=>{
    const current=progress[id]
    if(current&&current.updatedAt>=exam.at&&['reproduced','independent','consolidated'].includes(current.mastery))return true
    // v0.15以前の学習履歴も完了判定に残す。
    const legacy=reviews[id]
    return !!legacy&&legacy.updatedAt>=exam.at&&(legacy.outcome==='independent'||legacy.outcome==='reproduced')
  })
  const completed=new Set(completedIds),remainingIds=requiredIds.filter(id=>!completed.has(id))
  return {requiredIds,completedIds,remainingIds,complete:remainingIds.length===0}
}

export type UnresolvedSourceSummary={
  year:number
  total:number
  wrong:number
  unanswered:number
  remainingIds:string[]
}

export function unresolvedSourceSummary(year:number,target:TargetScore=loadPreferences().target):UnresolvedSourceSummary|null{
  const exam=latestExam(year)
  if(!exam)return null
  const attempts=loadAttempts(),source=sourceMistakeProgress(year,target),remaining=new Set(source.remainingIds)
  const items=storedExamItems(exam,attempts).filter(item=>remaining.has(item.key))
  return {
    year,
    total:items.length,
    wrong:items.filter(item=>item.status==='wrong').length,
    unanswered:items.filter(item=>item.status==='unanswered').length,
    remainingIds:source.remainingIds
  }
}

export function firstUnresolvedSource(target:TargetScore=loadPreferences().target):UnresolvedSourceSummary|null{
  for(const year of [2024,2025,2026]){
    const summary=unresolvedSourceSummary(year,target)
    if(summary&&summary.total>0)return summary
  }
  return null
}


function practicePlanComplete(exam:ExamScore,target:TargetScore,plan:ReinforcementPlan|undefined,attempts=loadAttempts(),fields=weakFieldsForStoredExam(target,exam,attempts)){
  if(!fields.length)return true
  if(!plan||plan.examId!==exam.id||plan.target!==target)return false
  const completed=new Set(plan.completedQuestionIds)
  return fields.every(field=>{
    const actualDone=(plan.fields[field]||[]).every(id=>completed.has(id))
    const mastered=attempts.some(a=>a.questionId.startsWith('mastery-')&&a.status==='correct'&&a.at>exam.at&&classifyRemediationField(a.topic).title===field)
    return actualDone&&mastered
  })
}

export function ensureReinforcementPlan(exam:ExamScore,target:TargetScore=loadPreferences().target):ReinforcementPlan{
  const state=loadLearningRoute(),key=String(exam.year),existing=state.reinforcement[key],attempts=loadAttempts()
  const desired=weakFieldsForStoredExam(target,exam,attempts),sameFields=existing&&Object.keys(existing.fields).length===desired.length&&desired.every(field=>field in existing.fields)
  if(existing?.examId===exam.id&&existing.target===target&&sameFields){
    if(existing.requiresSourceReview!==undefined)return existing
    const legacyDone=practicePlanComplete(exam,target,existing,attempts,desired)
    const stamped={...existing,requiresSourceReview:!legacyDone}
    saveLearningRoute({...state,reinforcement:{...state.reinforcement,[key]:stamped}})
    return stamped
  }

  // 「予約」と「実際に解いた」を分離する。
  // 他の現行補強プランに予約されている問題、または実際に露出した問題だけを候補から外す。
  // 目標変更で現在プランから外れた未実施予約は、再び候補へ戻せる。
  const bank=oldQuestionBank(),exposed=actualOldQuestionExposureIds()
  const reservedByOther=new Set<string>()
  for(const [planKey,plan] of Object.entries(state.reinforcement)){
    if(planKey===key)continue
    for(const ids of Object.values(plan.fields))for(const id of ids)reservedByOther.add(id)
  }
  const completedAnywhere=new Set<string>()
  for(const plan of Object.values(state.reinforcement))for(const id of plan.completedQuestionIds)completedAnywhere.add(id)

  const fields:Record<string,string[]>={}
  for(const field of desired){
    const retained=existing?.examId===exam.id?(existing.fields[field]||[]).filter(id=>!completedAnywhere.has(id)||existing.completedQuestionIds.includes(id)):[]
    const candidates=bank.filter(x=>x.field===field&&!reservedByOther.has(x.id)&&!completedAnywhere.has(x.id)&&!exposed.has(x.id)).sort((a,b)=>b.year-a.year||a.major-b.major)
    const selected:OldQuestionItem[]=retained.map(id=>bank.find(x=>x.id===id)).filter(Boolean) as OldQuestionItem[]
    for(const item of candidates){
      if(selected.length>=4)break
      if(!selected.some(x=>x.id===item.id)&&(!selected.some(x=>x.year===item.year)||candidates.length<=4))selected.push(item)
    }
    for(const item of candidates)if(selected.length<Math.min(4,candidates.length)&&!selected.some(x=>x.id===item.id))selected.push(item)
    fields[field]=selected.map(x=>x.id)
  }

  const legacyDone=!!existing&&existing.examId===exam.id&&existing.target===target&&existing.requiresSourceReview===undefined&&practicePlanComplete(exam,target,existing,attempts,desired)
  const plan:ReinforcementPlan={examId:exam.id,sourceYear:exam.year,target,fields,completedQuestionIds:existing?.examId===exam.id?[...existing.completedQuestionIds]:[],createdAt:new Date().toISOString(),requiresSourceReview:!legacyDone}
  // usedOldQuestionIds は後方互換用に「実際に完了した旧年度問題」の履歴だけを保持する。
  const completedHistory=new Set(state.usedOldQuestionIds.filter(id=>completedAnywhere.has(id)))
  for(const id of plan.completedQuestionIds)completedHistory.add(id)
  saveLearningRoute({...state,usedOldQuestionIds:[...completedHistory],reinforcement:{...state.reinforcement,[key]:plan}})
  return plan
}

export function markOldQuestionCompleted(sourceYear:number,id:string){
  const state=loadLearningRoute(),key=String(sourceYear),plan=state.reinforcement[key]
  if(!plan||plan.completedQuestionIds.includes(id))return
  saveLearningRoute({
    ...state,
    usedOldQuestionIds:[...new Set([...state.usedOldQuestionIds,id])],
    reinforcement:{...state.reinforcement,[key]:{...plan,completedQuestionIds:[...plan.completedQuestionIds,id]}}
  })
}

export function reinforcementPracticeComplete(year:number){
  const exam=latestExam(year)
  if(!exam)return false
  const attempts=loadAttempts(),target=loadPreferences().target,fields=weakFieldsForStoredExam(target,exam,attempts)
  return practicePlanComplete(exam,target,loadLearningRoute().reinforcement[String(year)],attempts,fields)
}

export function reinforcementComplete(year:number){
  const exam=latestExam(year)
  if(!exam)return false
  const attempts=loadAttempts(),target=loadPreferences().target,fields=weakFieldsForStoredExam(target,exam,attempts)
  if(!fields.length)return true
  const plan=loadLearningRoute().reinforcement[String(year)]
  if(!practicePlanComplete(exam,target,plan,attempts,fields))return false
  // v0.13以前ですでに旧方式の補強を完了していた利用者は完了のまま維持します。
  if(plan?.requiresSourceReview===false||plan?.requiresSourceReview===undefined)return true
  return sourceMistakeProgress(year,target).complete
}

// 旧8ステップ番号は既存コード互換のため維持します。
// ただし2025/2026は固定順ではなく、未露出年度を優先して確認します。
function completedCheckpointYears(){
  return [2025,2026].filter(year=>!!latestExam(year)).sort((a,b)=>{
    const ea=latestExam(a),eb=latestExam(b)
    return String(ea?.at||'').localeCompare(String(eb?.at||''))
  })
}

export function nextCheckpointYear(){
  const remaining=[2025,2026].filter(year=>!latestExam(year))
  if(!remaining.length)return null
  const untouched=remaining.find(year=>yearExposureState(year)==='untouched')
  return untouched??remaining[0]
}

export function currentLearningStep(){
  const exam24=latestExam(2024)
  if(!exam24)return 1
  if(!sourceMistakeProgress(2024).complete)return 2
  if(!reinforcementComplete(2024))return 4
  const completed=completedCheckpointYears()
  if(!completed.length)return 5
  if(!reinforcementComplete(completed[0]))return 6
  if(completed.length<2)return 7
  return 8
}

// ホームでは実際の学習単位に整理した6フェーズを使います。
export function currentLearningPhase(){
  const target=loadPreferences().target,exam24=latestExam(2024)
  if(!exam24)return 1
  if(!sourceMistakeProgress(2024,target).complete)return 2
  if(!reinforcementComplete(2024))return 3
  const completed=completedCheckpointYears()
  if(!completed.length)return 4
  if(!sourceMistakeProgress(completed[0],target).complete||!reinforcementComplete(completed[0]))return 5
  return 6
}

export function routeStepDone(step:number){
  const target=loadPreferences().target,exam24=latestExam(2024),completed=completedCheckpointYears()
  if(step===1)return !!exam24
  if(step===2)return !!exam24&&sourceMistakeProgress(2024,target).complete
  if(step===3)return !!exam24&&reinforcementComplete(2024)
  if(step===4)return completed.length>=1
  if(step===5)return completed.length>=1&&sourceMistakeProgress(completed[0],target).complete&&reinforcementComplete(completed[0])
  if(step===6)return completed.length===2&&completed.every(year=>sourceMistakeProgress(year,target).complete&&reinforcementComplete(year))
  return false
}


export type YearExposureState='untouched'|'partially_exposed'|'fully_attempted'
export type YearRole='main-check'|'reinforcement-pool'|'different-structure'

export function yearRole(year:number):YearRole{
  if(year===2019)return 'different-structure'
  if(year>=2020&&year<=2023)return 'reinforcement-pool'
  return 'main-check'
}

export function yearExposureState(year:number):YearExposureState{
  const exam=latestExam(year)
  if(exam)return 'fully_attempted'
  const attempts=loadAttempts()
  // 過去問ページでは年度全体の問題が表示されるため、開いた履歴だけでも初見性は失われる。
  const opened=attempts.some(a=>a.questionId===`exposure-${year}`)
  const attemptedIds=new Set(attempts.flatMap(a=>{
    if(a.questionId.startsWith('target-')){
      const id=a.questionId.slice(7)
      return id.startsWith(`${year}-Q`)?[id]:[]
    }
    if(a.questionId.startsWith('exam-')){
      const id=a.questionId.slice(5)
      return id.startsWith(`${year}-Q`)?[id]:[]
    }
    return []
  }))
  const guided=loadGuidedProgressState()
  const guidedExposure=Object.keys(guided).some(id=>id.startsWith(`${year}-Q`)&&guided[id]?.mastery!=='unseen')
  return opened||attemptedIds.size||guidedExposure?'partially_exposed':'untouched'
}

export function scoreInterpretation(year:number){
  return yearExposureState(year)==='untouched'?'初見スコア候補':'参考スコア'
}

export type LearningAction={to:string;label:string;purpose?:string}

type ExamDraftLike={phase?:'solve'|'mark';answers?:Record<string,string>;seconds?:number;updatedAt?:string}
function draftEntries(){
  try{
    const drafts=JSON.parse(localStorage.getItem('waseshibu-math-exam-drafts-v2')||'{}') as Record<string,ExamDraftLike>
    return Object.entries(drafts).filter(([,draft])=>draft&&(draft.phase==='mark'||(draft.phase==='solve'&&(Number(draft.seconds)>0||Object.values(draft.answers||{}).some(Boolean))))).sort((a,b)=>String(b[1].updatedAt||'').localeCompare(String(a[1].updatedAt||'')))
  }catch{return [] as [string,ExamDraftLike][]}
}
function actionForDraft(entry:[string,ExamDraftLike]):LearningAction{
  const [year,draft]=entry,isOptional=Number(year)<=2023
  return draft.phase==='mark'
    ?{to:`/past-papers?year=${year}&review=1`,label:`${year}年度の採点を続ける`,purpose:isOptional?'中断中の任意演習':'学習サイクル'}
    :{to:`/past-papers?year=${year}`,label:`${year}年度の続きから`,purpose:isOptional?'中断中の任意演習':'学習サイクル'}
}
export function resumeDraftAction():LearningAction|null{
  const entry=draftEntries()[0]
  return entry?actionForDraft(entry):null
}
export function coreResumeDraftAction():LearningAction|null{
  const entry=draftEntries().find(([year])=>Number(year)>=2024)
  return entry?actionForDraft(entry):null
}
export function optionalOldYearDraftAction():LearningAction|null{
  const entry=draftEntries().find(([year])=>Number(year)>=2019&&Number(year)<=2023)
  return entry?actionForDraft(entry):null
}

export function nextLearningAction(target:TargetScore=loadPreferences().target):LearningAction{
  const draft=coreResumeDraftAction()
  if(draft)return draft

  const exam24=latestExam(2024)
  if(!exam24)return {to:'/past-papers?year=2024',label:'2024年度を解く',purpose:'診断'}
  const source24=sourceMistakeProgress(2024,target)
  if(source24.remainingIds.length)return {to:'/mistakes?year=2024',label:`2024年度の未解決問題 ${source24.remainingIds.length}問を直す`,purpose:'元問題修正'}
  if(!reinforcementComplete(2024))return {to:'/reinforce?source=2024',label:'2024年度の類題・2019〜2023年度で補強する',purpose:'類題・旧年度補強'}

  const completed=completedCheckpointYears()
  // 既に解いた確認年度は、その年度の弱点修正・補強を先に終える。
  for(const year of completed){
    const source=sourceMistakeProgress(year,target)
    if(source.remainingIds.length)return {to:`/mistakes?year=${year}`,label:`${year}年度の未解決問題 ${source.remainingIds.length}問を直す`,purpose:completed.indexOf(year)===0?'再補強':'仕上げ補強'}
    if(!reinforcementComplete(year))return {to:`/reinforce?source=${year}`,label:`${year}年度の類題・2019〜2023年度で補強する`,purpose:completed.indexOf(year)===0?'再補強':'仕上げ補強'}
  }

  const next=nextCheckpointYear()
  if(next){
    const exposure=yearExposureState(next)
    const isFirst=completed.length===0
    return {
      to:`/past-papers?year=${next}`,
      label:`${next}年度を${exposure==='untouched'?(isFirst?'改善確認':'仕上がり確認'):'参考確認'}として解く`,
      purpose:exposure==='untouched'?(isFirst?'改善確認':'仕上がり確認'):'参考確認'
    }
  }
  return {to:'/years',label:'仕上げ・任意演習へ進む'}
}

export function routePhaseDone(phase:number){
  return routeStepDone(phase)
}

export const learningRouteStorageKey=ROUTE_KEY
