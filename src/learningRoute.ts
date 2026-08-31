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

export function latestExam(year:number){return loadExamScores().find(x=>x.year===year&&x.completed!==false)}

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
  const used=new Set(state.usedOldQuestionIds),bank=oldQuestionBank()
  const fields:Record<string,string[]>={}
  for(const field of desired){
    const retained=existing?.examId===exam.id?(existing.fields[field]||[]):[]
    const candidates=bank.filter(x=>x.field===field&&!used.has(x.id)).sort((a,b)=>b.year-a.year||a.major-b.major)
    const selected:OldQuestionItem[]=retained.map(id=>bank.find(x=>x.id===id)).filter(Boolean) as OldQuestionItem[]
    for(const item of candidates){
      if(selected.length>=4)break
      if(!selected.some(x=>x.id===item.id)&&(!selected.some(x=>x.year===item.year)||candidates.length<=4))selected.push(item)
    }
    for(const item of candidates)if(selected.length<Math.min(4,candidates.length)&&!selected.some(x=>x.id===item.id))selected.push(item)
    fields[field]=selected.map(x=>x.id)
    selected.forEach(x=>used.add(x.id))
  }
  const legacyDone=!!existing&&existing.examId===exam.id&&existing.target===target&&existing.requiresSourceReview===undefined&&practicePlanComplete(exam,target,existing,attempts,desired)
  const plan:ReinforcementPlan={examId:exam.id,sourceYear:exam.year,target,fields,completedQuestionIds:existing?.examId===exam.id?[...existing.completedQuestionIds]:[],createdAt:new Date().toISOString(),requiresSourceReview:!legacyDone}
  saveLearningRoute({...state,usedOldQuestionIds:[...used],reinforcement:{...state.reinforcement,[key]:plan}})
  return plan
}

export function markOldQuestionCompleted(sourceYear:number,id:string){
  const state=loadLearningRoute(),key=String(sourceYear),plan=state.reinforcement[key]
  if(!plan||plan.completedQuestionIds.includes(id))return
  saveLearningRoute({...state,reinforcement:{...state.reinforcement,[key]:{...plan,completedQuestionIds:[...plan.completedQuestionIds,id]}}})
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

// 旧8ステップ番号は、2025/2026の先取り警告など既存コードとの互換性のため維持します。
export function currentLearningStep(){
  const state=loadLearningRoute(),exam24=latestExam(2024),exam25=latestExam(2025),exam26=latestExam(2026)
  if(!state.solvedYears.includes(2024))return 1
  if(!exam24)return 2
  if(!reinforcementComplete(2024))return 4
  if(!exam25)return 5
  if(!reinforcementComplete(2025))return 6
  if(!exam26)return 7
  return 8
}

export function routeStepDone(step:number){
  const state=loadLearningRoute(),exam24=latestExam(2024),exam25=latestExam(2025),exam26=latestExam(2026)
  if(step===1)return state.solvedYears.includes(2024)
  if(step===2||step===3)return !!exam24
  if(step===4)return reinforcementComplete(2024)
  if(step===5)return !!exam25
  if(step===6)return reinforcementComplete(2025)
  if(step===7)return !!exam26
  return false
}

// ホームでは実際の学習単位に整理した6フェーズを使います。
export function currentLearningPhase(){
  const exam24=latestExam(2024),exam25=latestExam(2025),exam26=latestExam(2026)
  if(!exam24)return 1
  if(!reinforcementComplete(2024))return 2
  if(!exam25)return 3
  if(!reinforcementComplete(2025))return 4
  if(!exam26)return 5
  return 6
}

export type LearningAction={to:string;label:string}

type ExamDraftLike={phase?:'solve'|'mark';answers?:Record<string,string>;seconds?:number}
export function resumeDraftAction():LearningAction|null{
  try{
    const drafts=JSON.parse(localStorage.getItem('waseshibu-math-exam-drafts-v2')||'{}') as Record<string,ExamDraftLike>
    const entries=Object.entries(drafts)
    const marking=entries.find(([,draft])=>draft?.phase==='mark')
    if(marking)return {to:`/past-papers?year=${marking[0]}&review=1`,label:`${marking[0]}年度の採点を続ける`}
    const solving=entries.find(([,draft])=>draft?.phase==='solve'&&(Number(draft.seconds)>0||Object.values(draft.answers||{}).some(Boolean)))
    if(solving)return {to:`/past-papers?year=${solving[0]}`,label:`${solving[0]}年度の続きから`}
  }catch{/* broken draft must not block the learning route */}
  return null
}
export function nextLearningAction(target:TargetScore=loadPreferences().target):LearningAction{
  const draft=resumeDraftAction()
  if(draft)return draft
  for(const year of [2024,2025,2026]){
    const exam=latestExam(year)
    if(!exam)return {to:`/past-papers?year=${year}`,label:`${year}年度を解く`}
    const source=sourceMistakeProgress(year,target)
    if(source.remainingIds.length)return {to:`/mistakes?year=${year}`,label:`${year}年度の未解決問題 ${source.remainingIds.length}問を直す`}
    if(!reinforcementComplete(year))return {to:`/reinforce?source=${year}`,label:`${year}年度の類題・旧年度で補強する`}
  }
  return {to:'/years',label:'仕上げ・任意演習へ進む'}
}

export function routePhaseDone(phase:number){
  if(phase===1)return !!latestExam(2024)
  if(phase===2)return reinforcementComplete(2024)
  if(phase===3)return !!latestExam(2025)
  if(phase===4)return reinforcementComplete(2025)
  if(phase===5)return !!latestExam(2026)
  if(phase===6)return !!latestExam(2026)&&reinforcementComplete(2026)
  return false
}

export const learningRouteStorageKey=ROUTE_KEY
