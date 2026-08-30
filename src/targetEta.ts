import questions from './data/questions.json'
import type { MajorQuestion } from './types'
import { loadAttempts } from './storage'
import { loadGuidedProgressState, type GuidedProgressState } from './guidedReview'
import { gradeInTarget, targetGoalLabel, type TargetScore } from './targetStrategy'

export type GoalDayEstimate={
  target:TargetScore
  label:string
  remainingUnits:number
  days:number
  complete:boolean
  includedQuestions:number
  dailyCapacity:number
}

const majors=questions.questions as MajorQuestion[]
const questionMeta=majors.flatMap(major=>major.subquestions.map(sub=>({
  id:`${major.id}-${sub.no}`,
  grade:sub.grade
})))

export const DEFAULT_DAILY_TASK_CAPACITY=10

type MinimalAttempt={questionId:string;status:string;at:string}

function estimateUnitsForQuestion(
  questionId:string,
  progress:GuidedProgressState,
  latestAttempt?:MinimalAttempt,
  now=new Date()
){
  const p=progress[questionId]
  const attemptIsNewer=!!latestAttempt&&(!p||latestAttempt.at>p.updatedAt)

  // 最新の過去問でヒントなし正解できていれば、その時点では追加必須課題なし。
  if(attemptIsNewer&&latestAttempt?.status==='correct')return 0

  // 克服後に再び誤答した場合は「直し + 類題確認」の2学習単位へ戻す。
  if(attemptIsNewer&&latestAttempt?.status!=='correct')return 2

  if(!p){
    // 未着手はまず過去問・確認問題で1回出会う。
    return 1
  }

  if(p.mastery==='consolidated'||p.mastery==='independent'){
    // 7日以上空いた場合だけ忘却防止の1単位を見込む。
    const age=now.getTime()-Date.parse(p.updatedAt||'')
    return Number.isFinite(age)&&age>=7*24*60*60*1000?1:0
  }
  if(p.mastery==='reproduced')return 1
  if(p.mastery==='guided'||p.mastery==='exposed'||p.mastery==='attempted')return 2
  return 1
}

export function buildGoalDayEstimates(
  now=new Date(),
  dailyCapacity=DEFAULT_DAILY_TASK_CAPACITY,
):GoalDayEstimate[]{
  const progress=loadGuidedProgressState()
  const attempts=loadAttempts()
  const latestByQuestion=new Map<string,MinimalAttempt>()

  // loadAttempts は新しい順。最初に見つかった過去問記録を最新として使う。
  for(const attempt of attempts){
    if(!attempt.questionId.startsWith('exam-'))continue
    const id=attempt.questionId.slice(5)
    if(!latestByQuestion.has(id))latestByQuestion.set(id,attempt)
  }

  return ([60,70,75] as TargetScore[]).map(target=>{
    const included=questionMeta.filter(q=>gradeInTarget(target,q.grade))
    const remainingUnits=included.reduce((sum,q)=>sum+estimateUnitsForQuestion(q.id,progress,latestByQuestion.get(q.id),now),0)
    const cap=Math.max(1,Math.floor(dailyCapacity))
    const days=remainingUnits===0?0:Math.ceil(remainingUnits/cap)
    return {
      target,
      label:targetGoalLabel(target),
      remainingUnits,
      days,
      complete:remainingUnits===0,
      includedQuestions:included.length,
      dailyCapacity:cap
    }
  })
}
