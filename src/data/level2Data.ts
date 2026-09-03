import coreJson from './level2/level2_master_2019_2026.json'
import supportJson from './level2/field_support_questions.json'
import assignmentsJson from './level2/level2_field_assignments.json'
import poolJson from './level2/practice_pool_index.json'
import sourceMapJson from './level2/source_to_level2_map.json'

export type Level2Question={
  id:string
  sourceYear?:number
  sourceQuestionId:string|null
  suggestedFieldId?:string
  fieldId?:string
  status:string
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
}

export type Level2Field={
  fieldId:string
  label:string
  coreQuestionIds:string[]
  supportQuestionIds:string[]
  masteryEligibleQuestionIds:string[]
  masteryEligibleCount:number
  fourStreakReady:boolean
}

type Assignment={questionId:string;fieldId:string;assignmentRevision:number;practiceFieldIds:string[]}

export const LEVEL2_ASSIGNMENT_SET_REVISION=Number(assignmentsJson.assignmentSetRevision||1)
export const level2Assignments=assignmentsJson.assignments as Assignment[]
const assignmentById=new Map(level2Assignments.map(x=>[x.questionId,x]))

const core=(coreJson as Level2Question[]).map(q=>({...q,sourceQuestionId:q.sourceQuestionId??null,bankType:'core160'}))
const support=(supportJson as Level2Question[]).map(q=>({...q,sourceQuestionId:null,bankType:'field-support'}))
export const level2Questions:Level2Question[]=[...core,...support]
export const level2QuestionById=new Map(level2Questions.map(q=>[q.id,q]))
export const level2Fields=poolJson.fields as Level2Field[]
export const level2FieldById=new Map(level2Fields.map(f=>[f.fieldId,f]))
export const directLevel2BySource=new Map(sourceMapJson.map.map(x=>[x.sourceQuestionId,x.level2QuestionId]))

export function currentFieldId(questionId:string){
  return assignmentById.get(questionId)?.fieldId||level2QuestionById.get(questionId)?.fieldId||level2QuestionById.get(questionId)?.suggestedFieldId||''
}

export function assignmentRevision(questionId:string){return assignmentById.get(questionId)?.assignmentRevision||1}

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
