import questions from './data/questions.json'
import type { ExamScore, MajorQuestion } from './types'
import { classifyRemediationField } from './data/remediation'
import { loadAttempts, loadExamScores } from './storage'

const ROUTE_KEY='waseshibu-math-learning-route-v1'

export type ReinforcementPlan={
  examId:string
  sourceYear:number
  fields:Record<string,string[]>
  completedQuestionIds:string[]
  createdAt:string
}

export type LearningRouteState={
  solvedYears:number[]
  usedOldQuestionIds:string[]
  reinforcement:Record<string,ReinforcementPlan>
  updatedAt:string
}

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

export function ensureReinforcementPlan(exam:ExamScore):ReinforcementPlan{
  const state=loadLearningRoute(),key=String(exam.year),existing=state.reinforcement[key]
  if(existing?.examId===exam.id)return existing
  const used=new Set(state.usedOldQuestionIds),bank=oldQuestionBank()
  const fields:Record<string,string[]>={}
  for(const field of exam.weakFields||[]){
    const candidates=bank.filter(x=>x.field===field&&!used.has(x.id)).sort((a,b)=>b.year-a.year||a.major-b.major)
    const selected:OldQuestionItem[]=[]
    for(const item of candidates){
      if(selected.length>=4)break
      if(!selected.some(x=>x.year===item.year)||candidates.length<=4)selected.push(item)
    }
    for(const item of candidates)if(selected.length<Math.min(4,candidates.length)&&!selected.some(x=>x.id===item.id))selected.push(item)
    fields[field]=selected.map(x=>x.id)
    selected.forEach(x=>used.add(x.id))
  }
  const plan:ReinforcementPlan={examId:exam.id,sourceYear:exam.year,fields,completedQuestionIds:[],createdAt:new Date().toISOString()}
  saveLearningRoute({...state,usedOldQuestionIds:[...used],reinforcement:{...state.reinforcement,[key]:plan}})
  return plan
}

export function markOldQuestionCompleted(sourceYear:number,id:string){
  const state=loadLearningRoute(),key=String(sourceYear),plan=state.reinforcement[key]
  if(!plan||plan.completedQuestionIds.includes(id))return
  saveLearningRoute({...state,reinforcement:{...state.reinforcement,[key]:{...plan,completedQuestionIds:[...plan.completedQuestionIds,id]}}})
}

export function latestExam(year:number){return loadExamScores().find(x=>x.year===year&&x.completed!==false)}

export function reinforcementComplete(year:number){
  const exam=latestExam(year)
  if(!exam)return false
  if(!(exam.weakFields||[]).length)return true
  const state=loadLearningRoute(),plan=state.reinforcement[String(year)]
  if(!plan||plan.examId!==exam.id)return false
  const completed=new Set(plan.completedQuestionIds),attempts=loadAttempts()
  return (exam.weakFields||[]).every(field=>{
    const actualDone=(plan.fields[field]||[]).every(id=>completed.has(id))
    const mastered=attempts.some(a=>a.questionId.startsWith('mastery-')&&a.status==='correct'&&a.at>exam.at&&classifyRemediationField(a.topic).title===field)
    return actualDone&&mastered
  })
}

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

export const learningRouteStorageKey=ROUTE_KEY
