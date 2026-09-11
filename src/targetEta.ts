import questions from './data/questions.json'
import type { MajorQuestion } from './types'
import { loadAttempts } from './storage'
import { loadGuidedProgressState } from './guidedReview'
import { loadLevel2SessionSummaries } from './level2ProgressView'
import { requiredPracticeCount } from './practiceLoad'
import { REQUIRED_MAIN_YEAR_SEQUENCE, isRequiredYearLocked, latestExam, sourceMistakeProgress } from './learningRoute'
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
  // 必須年度の過去問は目標外の小問も年度通しで1問として数える。
  // 目標範囲内だけ、誤答時に必要になる「直し1問＋固定類題」を先に予約する。
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

      // 一度その目標で本線完了した年度は、任意再受験・任意再練習でETAを再開しない。
      if(isRequiredYearLocked(year,target))continue

      const exam=latestExam(year)
      if(!exam){
        // 未採点年度は、過去問そのもの＋目標範囲内の直し・固定類題を先取り予約。
        remainingQuestions+=yearQuestions.reduce((sum,q)=>sum+reservedQuestionCount(q.id,q.grade,target),0)
        continue
      }

      const itemById=new Map(storedExamItems(exam,attempts).map(item=>[item.key,item]))
      const repairRemaining=new Set(sourceMistakeProgress(year,target).remainingIds)

      for(const q of yearQuestions){
        const item=itemById.get(q.id)
        if(!item){
          // 壊れた／旧形式の部分データで過小表示しない。
          remainingQuestions+=reservedQuestionCount(q.id,q.grade,target)
          continue
        }
        if(item.status==='correct')continue
        // 年度通しの採点が確定した時点で、過去問1問分は消える。
        // 目標外のB/C問題は、現在目標では直し・類題を必須にしない。
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

  // A→B→Cと目標を上げたとき、必要量が逆転して見えないよう表示だけ単調化する。
  let floor=0
  return raw.map(item=>{
    const remainingQuestions=Math.max(floor,item.remainingQuestions)
    floor=remainingQuestions
    const days=remainingQuestions===0?0:Math.ceil(remainingQuestions/Math.max(1,item.dailyCapacity))
    return {...item,remainingQuestions,remainingUnits:remainingQuestions,days,complete:remainingQuestions===0}
  })
}
