
import raw from './data/guidedSolutions.json'
import questions from './data/questions.json'
import { getExamAnswer, isExamAnswerCorrect } from './data/examAnswers'
import { canWriteLearningData, notifyWriteBlocked } from './version'
import type { MajorQuestion } from './types'

export const GUIDED_REVIEW_KEY='waseshibu-math-guided-review-v1'
export const GUIDED_PROGRESS_KEY='waseshibu-math-guided-progress-v2'

export type GuidedOutcome='independent'|'guided'|'reproduced'|'wrong'
export type GuidedReviewRecord={questionId:string;step1:string;step2:string;finalAnswer:string;hintUsed:boolean;answerSeen:boolean;outcome?:GuidedOutcome;updatedAt:string}
export type GuidedReviewState=Record<string,GuidedReviewRecord>

export type MasteryState='unseen'|'attempted'|'exposed'|'guided'|'reproduced'|'independent'|'consolidated'
export type StepProgress={stepId:string;answer:string;tries:number;hintLevelUsed:0|1|2|3;completed:boolean;selfAssessment?:'matched'|'guided'|'unclear'}
export type GuidedProgressRecord={
  questionId:string
  currentStepId?:string
  stepProgress:Record<string,StepProgress>
  finalAnswer:string
  finalAnswerSeen:boolean
  reproductionAttempts:number
  reproductionSucceeded:boolean
  independentSucceeded:boolean
  practiceStreak:number
  mastery:MasteryState
  dependencyMode?:'own'|'official'
  updatedAt:string
}
export type GuidedProgressState=Record<string,GuidedProgressRecord>

export type GuidedStep={
  id:string
  title:string
  prompt:string
  hint1:string
  hint2:string
  reveal:string
  response:{type:'self-check'|'text'}
}
export type GuidedSolution={
  schemaVersion:1
  questionId:string
  year:number
  major:number
  subNo:string
  title:string
  topic:string
  priority:'A'|'B'|'C'
  firstNotice:string
  context:{dependsOn:{questionId:string;usage:string;officialValue:string}[]}
  steps:GuidedStep[]
  finalAnswer:{answer:string;acceptedAnswers:string[];formRequirement:'canonical'|'equivalent'}
  fullExplanation:string[]
  commonMistakes:string[]
  takeaway:{pattern:string}
  reproduction:{required:boolean;hideGuidance:boolean;successRequiresFinalCorrect:boolean}
  connections:{pastExamSimilar:string[];practiceTopic:string}
  audit:{contentVersion:number;answerChecked:boolean;stepsChecked:boolean;scopeChecked:boolean;figureChecked:boolean;status:'approved'|'needs-review';basis:string}
}

const solutionMap=(raw as unknown as {solutions:Record<string,GuidedSolution>}).solutions
const majors=questions.questions as MajorQuestion[]

export function normalizeGuidedQuestionId(value:string){return value.replace(/^exam-/,'')}
export function getGuidedSolution(questionId:string){return solutionMap[normalizeGuidedQuestionId(questionId)]||null}
export function guidedSolutionCount(){return Object.keys(solutionMap).length}

export function guidedQuestion(questionId:string){
  const id=normalizeGuidedQuestionId(questionId),major=majors.find(m=>id.startsWith(`${m.id}-`))
  if(!major)return null
  const sub=major.subquestions.find(s=>`${major.id}-${s.no}`===id)
  if(!sub)return null
  const index=major.subquestions.indexOf(sub),previous=index>0?major.subquestions[index-1]:null,previousId=previous?`${major.id}-${previous.no}`:undefined
  const solution=getGuidedSolution(id)
  return {
    id,year:major.year,major:major.major,subNo:sub.no,subIndex:index,subCount:major.subquestions.length,
    topic:sub.topic,grade:sub.grade,title:major.title,coreIdeas:major.core_ideas,answer:getExamAnswer(id),
    previousId,previousAnswer:previousId?getExamAnswer(previousId):undefined,solution
  }
}

export function loadGuidedReviews(storage:Pick<Storage,'getItem'>=localStorage):GuidedReviewState{
  try{const raw=JSON.parse(storage.getItem(GUIDED_REVIEW_KEY)||'{}');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}}catch{return {}}
}
export function loadGuidedReview(questionId:string,storage:Pick<Storage,'getItem'>=localStorage){return loadGuidedReviews(storage)[normalizeGuidedQuestionId(questionId)]}
export function saveGuidedReview(record:GuidedReviewRecord,storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const isBrowserStorage=typeof localStorage!=='undefined'&&storage===localStorage
  if(isBrowserStorage&&!canWriteLearningData()){notifyWriteBlocked();return}
  const all=loadGuidedReviews(storage),id=normalizeGuidedQuestionId(record.questionId)
  storage.setItem(GUIDED_REVIEW_KEY,JSON.stringify({...all,[id]:{...record,questionId:id,updatedAt:new Date().toISOString()}}))
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('waseshibu-guided-review-change'))
}

export function blankGuidedProgress(questionId:string):GuidedProgressRecord{
  return {questionId:normalizeGuidedQuestionId(questionId),stepProgress:{},finalAnswer:'',finalAnswerSeen:false,reproductionAttempts:0,reproductionSucceeded:false,independentSucceeded:false,practiceStreak:0,mastery:'unseen',updatedAt:new Date(0).toISOString()}
}
export function loadGuidedProgressState(storage:Pick<Storage,'getItem'>=localStorage):GuidedProgressState{
  try{const value=JSON.parse(storage.getItem(GUIDED_PROGRESS_KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}
}
export function loadGuidedProgress(questionId:string,storage:Pick<Storage,'getItem'>=localStorage){
  const id=normalizeGuidedQuestionId(questionId)
  return loadGuidedProgressState(storage)[id]||blankGuidedProgress(id)
}
export function saveGuidedProgress(record:GuidedProgressRecord,storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const isBrowserStorage=typeof localStorage!=='undefined'&&storage===localStorage
  if(isBrowserStorage&&!canWriteLearningData()){notifyWriteBlocked();return}
  const all=loadGuidedProgressState(storage),id=normalizeGuidedQuestionId(record.questionId)
  const next={...record,questionId:id,updatedAt:new Date().toISOString()}
  storage.setItem(GUIDED_PROGRESS_KEY,JSON.stringify({...all,[id]:next}))
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('waseshibu-guided-progress-change'))
}
export function updateGuidedProgress(questionId:string,patch:Partial<GuidedProgressRecord>,storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const current=loadGuidedProgress(questionId,storage)
  const next={...current,...patch,questionId:normalizeGuidedQuestionId(questionId)}
  saveGuidedProgress(next,storage);return next
}
export function recordGuidedStep(questionId:string,stepId:string,answer:string,hintLevelUsed:0|1|2|3,completed:boolean,storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const current=loadGuidedProgress(questionId,storage),old=current.stepProgress[stepId]
  const changed=!old||old.answer!==answer
  const item:StepProgress={stepId,answer,tries:(old?.tries||0)+(changed?1:0),hintLevelUsed:Math.max(old?.hintLevelUsed||0,hintLevelUsed) as 0|1|2|3,completed:old?.completed||completed,selfAssessment:old?.selfAssessment}
  const used=Math.max(...Object.values({...current.stepProgress,[stepId]:item}).map(x=>x.hintLevelUsed),0)
  const mastery:MasteryState=current.finalAnswerSeen?'exposed':used>0?'guided':current.mastery==='unseen'?'attempted':current.mastery
  return updateGuidedProgress(questionId,{currentStepId:stepId,stepProgress:{...current.stepProgress,[stepId]:item},mastery},storage)
}

export function assessGuidedStep(questionId:string,stepId:string,selfAssessment:'matched'|'guided'|'unclear',storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const current=loadGuidedProgress(questionId,storage),old=current.stepProgress[stepId]
  if(!old)return current
  const item:StepProgress={...old,selfAssessment,completed:selfAssessment!=='unclear'}
  const mastery:MasteryState=selfAssessment==='matched'&&old.hintLevelUsed===0?current.mastery:(current.mastery==='consolidated'?current.mastery:'guided')
  return updateGuidedProgress(questionId,{currentStepId:stepId,stepProgress:{...current.stepProgress,[stepId]:item},mastery},storage)
}
export function revealGuidedFinalAnswer(questionId:string,storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const current=loadGuidedProgress(questionId,storage)
  return updateGuidedProgress(questionId,{finalAnswerSeen:true,mastery:current.mastery==='consolidated'?current.mastery:'exposed'},storage)
}
export function recordGuidedFinal(questionId:string,input:string,mode:'guided'|'retry',storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const current=loadGuidedProgress(questionId,storage),correct=isExamAnswerCorrect(normalizeGuidedQuestionId(questionId),input)
  const hintUsed=Object.values(current.stepProgress).some(x=>x.hintLevelUsed>0)
  const stepAnswerSeen=Object.values(current.stepProgress).some(x=>x.hintLevelUsed>=3)
  const answerExposed=current.finalAnswerSeen||stepAnswerSeen
  let mastery=current.mastery
  let reproductionAttempts=current.reproductionAttempts
  let reproductionSucceeded=current.reproductionSucceeded
  let independentSucceeded=current.independentSucceeded
  if(mode==='retry')reproductionAttempts++
  if(correct){
    // すでに定着済みの問題を忘却防止で再確認して正解した場合は、定着状態を下げない。
    if(current.mastery==='consolidated')mastery='consolidated'
    else if(mode==='retry'&&answerExposed){mastery='reproduced';reproductionSucceeded=true}
    else if(!answerExposed&&!hintUsed&&current.dependencyMode!=='official'){mastery='independent';independentSucceeded=true}
    else if(answerExposed){mastery='reproduced';reproductionSucceeded=true}
    else mastery='guided'
  }else{
    // 定着済みでも再度間違えたら「克服済み」のままにしない。
    mastery='attempted'
  }
  updateGuidedProgress(questionId,{finalAnswer:input,reproductionAttempts,reproductionSucceeded,independentSucceeded,mastery,practiceStreak:correct?current.practiceStreak:0},storage)
  return {correct,mastery}
}

export function effectivePracticeStreak(questionId:string,latestSourceAttemptAt?:string,storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const current=loadGuidedProgress(questionId,storage)
  if(latestSourceAttemptAt&&current.updatedAt<latestSourceAttemptAt)return 0
  return current.practiceStreak
}
export function resetPracticeIfSourceAttemptIsNewer(questionId:string,latestSourceAttemptAt?:string,storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const current=loadGuidedProgress(questionId,storage)
  if(!latestSourceAttemptAt||current.updatedAt>=latestSourceAttemptAt)return current
  return updateGuidedProgress(questionId,{practiceStreak:0,mastery:'attempted'},storage)
}

export function recordPracticeStreak(questionId:string,correct:boolean,storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const current=loadGuidedProgress(questionId,storage),practiceStreak=correct?Math.min(4,current.practiceStreak+1):0
  const mastery=practiceStreak>=4?'consolidated':correct?current.mastery:(current.independentSucceeded?'independent':current.reproductionSucceeded?'reproduced':'attempted')
  return updateGuidedProgress(questionId,{practiceStreak,mastery},storage)
}

export function guidedOutcomeLabel(outcome?:GuidedOutcome|MasteryState){
  if(outcome==='independent')return 'ヒントなしで自力正解'
  if(outcome==='guided')return 'ヒントありで理解'
  if(outcome==='reproduced')return '答え確認後に再現'
  if(outcome==='consolidated')return '類題4問連続正解'
  if(outcome==='exposed')return '答えを確認済み・未再現'
  if(outcome==='attempted')return '学習中'
  if(outcome==='wrong')return 'もう一度確認'
  return '未着手'
}
