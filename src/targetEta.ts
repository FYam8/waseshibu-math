import questions from './data/questions.json'
import type { MajorQuestion } from './types'
import { loadAttempts } from './storage'
import { loadGuidedProgressState, type GuidedProgressState } from './guidedReview'
import { loadRemediationProgressState } from './remediationProgress'
import { classifyRemediationField } from './data/remediation'
import { latestExam, loadLearningRoute } from './learningRoute'
import { gradeInTarget, storedExamItems, targetGoalLabel, weakFieldsForStoredExam, type TargetScore } from './targetStrategy'

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
  year:major.year,
  topic:sub.topic,
  grade:sub.grade
})))
const questionById=new Map(questionMeta.map(q=>[q.id,q]))

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

  if(attemptIsNewer&&latestAttempt?.status==='correct')return 0
  if(attemptIsNewer&&latestAttempt?.status!=='correct')return 2

  if(!p)return 1
  if(p.mastery==='consolidated'||p.mastery==='independent'){
    const age=now.getTime()-Date.parse(p.updatedAt||'')
    return Number.isFinite(age)&&age>=7*24*60*60*1000?1:0
  }
  if(p.mastery==='reproduced')return 1
  if(p.mastery==='guided'||p.mastery==='exposed'||p.mastery==='attempted')return 2
  return 1
}

function latestExamAttempts(){
  const attempts=loadAttempts(),latestByQuestion=new Map<string,MinimalAttempt>()
  for(const attempt of attempts){
    if(!attempt.questionId.startsWith('exam-'))continue
    const id=attempt.questionId.slice(5)
    if(!latestByQuestion.has(id))latestByQuestion.set(id,attempt)
  }
  return {attempts,latestByQuestion}
}

export function buildGoalDayEstimates(
  now=new Date(),
  dailyCapacity=DEFAULT_DAILY_TASK_CAPACITY,
):GoalDayEstimate[]{
  const progress=loadGuidedProgressState()
  const remediationProgress=loadRemediationProgressState()
  const {attempts,latestByQuestion}=latestExamAttempts()
  const route=loadLearningRoute()

  const raw=([60,70,75] as TargetScore[]).map(target=>{
    let remainingUnits=0
    let includedQuestions=0

    // 得点確認の主軸は2024〜2026。未実施年度はその年度の対象小問数を実学習量として数える。
    // 実施済み年度は、正解済みを除き「解き直し・定着」に必要な分だけ数える。
    for(const year of [2024,2025,2026]){
      const exam=latestExam(year)
      const targetQuestions=questionMeta.filter(q=>q.year===year&&gradeInTarget(target,q.grade))
      if(!exam){
        includedQuestions+=targetQuestions.length
        remainingUnits+=targetQuestions.length
        continue
      }
      const examItems=storedExamItems(exam,attempts)
      const itemById=new Map(examItems.map(item=>[item.key,item]))
      for(const q of targetQuestions){
        const item=itemById.get(q.id)
        if(!item)continue
        includedQuestions++
        if(item.status!=='correct')remainingUnits+=estimateUnitsForQuestion(q.id,progress,latestByQuestion.get(q.id),now)
      }
    }

    // 2019〜2023年度は「全問題」を数えない。現在の補強計画に実際に選ばれた問題だけを数える。
    // さらに、各弱点分野の類題4問も未完了なら学習単位として加える。
    for(const sourceYear of [2024,2025,2026]){
      const exam=latestExam(sourceYear)
      if(!exam)continue
      const plan=route.reinforcement[String(sourceYear)]
      if(!plan||plan.examId!==exam.id||plan.target!==target)continue
      const completed=new Set(plan.completedQuestionIds)
      const fields=weakFieldsForStoredExam(target,exam,attempts)
      for(const field of fields){
        const selected=plan.fields[field]||[]
        const remainingOld=selected.filter(id=>!completed.has(id))
        remainingUnits+=remainingOld.length
        includedQuestions+=remainingOld.length

        const mastered=attempts.some(a=>a.questionId.startsWith('mastery-')&&a.status==='correct'&&a.at>exam.at&&classifyRemediationField(a.topic).title===field)
        if(!mastered){
          // 4問連続正解の類題セットを、実際の4学習単位として見込む。
          const sourceIds=storedExamItems(exam,attempts)
            .filter(item=>item.status!=='correct'&&gradeInTarget(target,item.grade))
            .filter(item=>classifyRemediationField(item.topic).title===field)
            .map(item=>item.key)
          const streak=Math.max(0,...sourceIds.map(id=>remediationProgress[id]?.streak??progress[id]?.practiceStreak??0))
          remainingUnits+=Math.max(0,4-Math.min(4,streak))
        }
      }
    }

    const cap=Math.max(1,Math.floor(dailyCapacity))
    const days=remainingUnits===0?0:Math.ceil(remainingUnits/cap)
    return {
      target,
      label:targetGoalLabel(target),
      remainingUnits,
      days,
      complete:remainingUnits===0,
      includedQuestions,
      dailyCapacity:cap
    }
  })

  // 目標を上げたのに残り学習量が減る表示は、任意演習やtarget別plan差による混乱を生む。
  // 学習履歴は変えず、表示用見積もりだけ A≦B≦C を保証する。
  let floor=0
  return raw.map(item=>{
    const remainingUnits=Math.max(floor,item.remainingUnits)
    floor=remainingUnits
    const days=remainingUnits===0?0:Math.ceil(remainingUnits/Math.max(1,item.dailyCapacity))
    return {...item,remainingUnits,days,complete:remainingUnits===0}
  })
}