import questions from './data/questions.json'
import type { MajorQuestion } from './types'
import { loadAttempts } from './storage'
import { loadGuidedProgressState } from './guidedReview'
import { loadLevel2SessionSummaries } from './level2ProgressView'
import { requiredPracticeCount } from './practiceLoad'
import { REQUIRED_MAIN_YEAR_SEQUENCE, latestExam, requiredYearComplete, sourceMistakeProgress } from './learningRoute'
import { gradeInTarget, storedExamItems, targetGoalLabel, type TargetScore } from './targetStrategy'

export type GoalDayEstimate={
  target:TargetScore
  label:string
  remainingQuestions:number
  remainingUnits:number
  days:number
  complete:boolean
  includedQuestions:number
  dailyCapacity:number
}

const majors=questions.questions as MajorQuestion[]
const questionMeta=majors.flatMap(major=>major.subquestions.map(sub=>({
  id:`${major.id}-${sub.no}`,
  year:major.year,
  major:major.major,
  topic:sub.topic,
  grade:sub.grade
})))

export const DEFAULT_DAILY_TASK_CAPACITY=10

function reservedPracticeCount(questionId:string){
  return requiredPracticeCount(questionId,'')
}

export function reservedQuestionCount(questionId:string,grade:'A'|'B'|'C',target:TargetScore){
  return 1+(gradeInTarget(target,grade)?1+reservedPracticeCount(questionId):0)
}

function latestPracticeSession(questionId:string,examAt:string){
  return loadLevel2SessionSummaries()
    .filter(session=>session.triggerSourceQuestionId===questionId&&(!session.sourceAttemptAt||session.sourceAttemptAt>=examAt))
    .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0]
}

function remainingPracticeQuestions(questionId:string,examAt:string){
  const progress=loadGuidedProgressState()[questionId]
  if(progress&&progress.updatedAt>=examAt&&progress.mastery==='consolidated')return 0
  const session=latestPracticeSession(questionId,examAt)
  if(!session)return reservedPracticeCount(questionId)
  if(session.status==='completed')return 0
  return Math.max(0,session.requiredCount-Math.min(session.requiredCount,session.completedQuestionIds.length))
}

export function buildGoalDayEstimates(
  _now=new Date(),
  dailyCapacity=DEFAULT_DAILY_TASK_CAPACITY,
):GoalDayEstimate[]{
  const attempts=loadAttempts()
  const raw=([60,70,75] as TargetScore[]).map(target=>{
    let remainingQuestions=0
    let includedQuestions=0

    for(const year of REQUIRED_MAIN_YEAR_SEQUENCE){
      const yearQuestions=questionMeta.filter(q=>q.year===year)
      includedQuestions+=yearQuestions.length

      // 現在の履歴で本線完了なら0扱い。完了ロック保存前の旧履歴でも一時的に日数を戻さない。
      if(requiredYearComplete(year,target))continue

      const exam=latestExam(year)
      if(!exam){
        remainingQuestions+=yearQuestions.reduce((sum,q)=>sum+reservedQuestionCount(q.id,q.grade,target),0)
        continue
      }

      const itemById=new Map(storedExamItems(exam,attempts).map(item=>[item.key,item]))
      const repairRemaining=new Set(sourceMistakeProgress(year,target).remainingIds)

      for(const q of yearQuestions){
        const item=itemById.get(q.id)
        if(!item){
          remainingQuestions+=reservedQuestionCount(q.id,q.grade,target)
          continue
        }
        if(item.status==='correct')continue
        if(!gradeInTarget(target,q.grade))continue

        if(repairRemaining.has(q.id))remainingQuestions+=1
        remainingQuestions+=remainingPracticeQuestions(q.id,exam.at)
      }
    }

    const cap=Math.max(1,Math.floor(dailyCapacity))
    const days=remainingQuestions===0?0:Math.ceil(remainingQuestions/cap)
    return {
      target,
      label:targetGoalLabel(target),
      remainingQuestions,
      remainingUnits:remainingQuestions,
      days,
      complete:remainingQuestions===0,
      includedQuestions,
      dailyCapacity:cap
    }
  })

  let floor=0
  return raw.map(item=>{
    const remainingQuestions=Math.max(floor,item.remainingQuestions)
    floor=remainingQuestions
    const days=remainingQuestions===0?0:Math.ceil(remainingQuestions/Math.max(1,item.dailyCapacity))
    return {...item,remainingQuestions,remainingUnits:remainingQuestions,days,complete:remainingQuestions===0}
  })
}
