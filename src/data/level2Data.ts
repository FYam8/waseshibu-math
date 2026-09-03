import coreJson from './level2/level2_master_2019_2026.json'
import supportJson from './level2/field_support_questions.json'
import assignmentsJson from './level2/level2_field_assignments.json'
import poolJson from './level2/practice_pool_index.json'
import sourceMapJson from './level2/source_to_level2_map.json'
import questionsJson from './questions.json'
import guidedJson from './guidedSolutions.json'
import { getExamAnswer } from './examAnswers'
import type { MajorQuestion } from '../types'

export type Level2Question={
  id:string
  sourceYear?:number
  sourceQuestionId:string|null
  suggestedFieldId?:string
  fieldId?:string
  status:string
  selectable?:boolean
  backlogReason?:string
  contentVerified:boolean
  materialized:boolean
  context?:string
  prompt:string
  answer:string
  acceptedAnswers?:string[]
  explanation:string
  problemFigure?:string|null
  hintFigure?:string|null
  explanationFigure?:string|null
  problemTable?:{
    caption?:string
    headers:string[]
    rows:string[][]
  }
  contentRevision?:number
  gradingRevision?:number
  answerSpec?:{
    type:string
    elements?:string[]
    orderIndependent?:boolean
    pairs?:Array<{left:string[];right:string[]}>
    allowEquivalentCyclicOrReversedNotation?:boolean
  }
  bankType?:string
  officialYear?:number
  officialMajor?:number
  officialSubNo?:string
  officialSubIndex?:number
  officialSubCount?:number
}

export type Level2Field={
  fieldId:string
  label:string
  coreQuestionIds:string[]
  officialPastQuestionIds?:string[]
  supportQuestionIds:string[]
  masteryEligibleQuestionIds:string[]
  masteryEligibleCount:number
  fourStreakReady:boolean
}

type Assignment={questionId:string;fieldId:string;assignmentRevision:number;practiceFieldIds:string[]}

export const LEVEL2_ASSIGNMENT_SET_REVISION=Number(assignmentsJson.assignmentSetRevision||1)
export const level2Assignments=assignmentsJson.assignments as Assignment[]
const assignmentById=new Map(level2Assignments.map(x=>[x.questionId,x]))

const allCore=(coreJson as Level2Question[]).map(q=>({...q,sourceQuestionId:q.sourceQuestionId??null,bankType:'core160'}))
export const backlogLevel2Questions=allCore.filter(q=>q.status==='backlog'||q.selectable===false)
const core=allCore.filter(q=>!backlogLevel2Questions.includes(q))
const support=(supportJson as Level2Question[]).map(q=>({...q,sourceQuestionId:null,bankType:'field-support'}))
const guidedSolutions=(guidedJson as unknown as {solutions:Record<string,{fullExplanation?:string[]}>}).solutions
const officialPast=(questionsJson.questions as MajorQuestion[]).filter(major=>major.year>=2019&&major.year<=2021).flatMap(major=>major.subquestions.map((sub,subIndex)=>{
  const id=`${major.id}-${sub.no}`,expected=getExamAnswer(id),solution=guidedSolutions[id]
  if(!expected)throw new Error(`公式過去問 ${id} の正答がありません`)
  return {
    id,sourceYear:major.year,sourceQuestionId:id,suggestedFieldId:currentFieldIdForStoredId(`L2-${id}`),status:'final',contentVerified:true,materialized:true,
    prompt:'',answer:expected.answer,acceptedAnswers:expected.acceptedAnswers,explanation:solution?.fullExplanation?.join(' ')||'公式解答とステップ解説を確認してください。',
    problemFigure:null,hintFigure:null,explanationFigure:null,contentRevision:1,gradingRevision:1,bankType:'past-paper',
    officialYear:major.year,officialMajor:major.major,officialSubNo:sub.no,officialSubIndex:subIndex,officialSubCount:major.subquestions.length
  } satisfies Level2Question
}))
export const level2Questions:Level2Question[]=[...core,...officialPast,...support]
export const level2QuestionById=new Map(level2Questions.map(q=>[q.id,q]))
export const level2Fields=poolJson.fields as Level2Field[]
export const level2FieldById=new Map(level2Fields.map(f=>[f.fieldId,f]))
export const directLevel2BySource=new Map(sourceMapJson.map.map(x=>[x.sourceQuestionId,x.level2QuestionId]))

function storedAssignmentId(questionId:string){return /^20(?:19|20|21)-Q/.test(questionId)?`L2-${questionId}`:questionId}
function currentFieldIdForStoredId(questionId:string){return assignmentById.get(questionId)?.fieldId||allCore.find(q=>q.id===questionId)?.fieldId||allCore.find(q=>q.id===questionId)?.suggestedFieldId||''}
export function currentFieldId(questionId:string){
  const storedId=storedAssignmentId(questionId)
  return currentFieldIdForStoredId(storedId)||level2QuestionById.get(questionId)?.fieldId||level2QuestionById.get(questionId)?.suggestedFieldId||''
}

export function assignmentRevision(questionId:string){return assignmentById.get(storedAssignmentId(questionId))?.assignmentRevision||1}

export function level2FigureUrl(path?:string|null){
  if(!path)return null
  return `${import.meta.env.BASE_URL}level2/${path}`
}

export function directQuestionForSource(sourceQuestionId:string){
  const id=directLevel2BySource.get(sourceQuestionId)
  return id?level2QuestionById.get(id):undefined
}

export function resolveLevel2FieldId(topicOrId:string){
  if(level2FieldById.has(topicOrId))return topicOrId
  const byLabel=level2Fields.find(f=>f.label===topicOrId)
  if(byLabel)return byLabel.fieldId
  if(/平方根|根号|近似|小数部分/.test(topicOrId))return 'square-roots'
  if(/動点|速さ|追いつき|歩行|移動|グラフ/.test(topicOrId))return 'coordinates'
  return ''
}
