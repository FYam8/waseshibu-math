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

const explanationOverrides:Record<string,string>={
  'L2-2022-Q1-2':'x²−5x−14を因数分解する。積が−14、和が−5になる2数は−7と2なので、x²−5x−14=(x−7)(x+2)。したがって(x−7)(x+2)=0より、x=7またはx=−2。',
  'L2-2022-Q2-2':'Aはl上、Bはm上なのでA=(t,t²/3)、B=(t,10/t)。したがってC=(0,10/t)、D=(0,t²/3)で、ABCDは幅t、縦CD=10/t−t²/3の長方形。Q=(q,q²/3)(q>0)とおくと、△CDQは底辺CD、高さqだから面積は(1/2)×CD×q。一方、四角形ABCDの面積はt×CD。両者が等しいので(1/2)×CD×q=t×CDよりq=2t。よってQ=(2t,(4/3)t²)。',
  'L2-2022-Q4-2':'各スイッチに隣接する廊下は①が2本、②が3本、③が3本、④が4本、⑤が4本。2つのスイッチを押すと、両方に接する廊下があればその廊下は2回反転して消灯に戻り、それ以外の隣接廊下は1回反転して点灯する。したがって点灯数は「2つの隣接本数の和」から、2つを直接結ぶ廊下があるとき2を引けばよい。これが4になる組は{①,④},{①,⑤},{②,③}の3組。順序を区別するため各組2通りあり、3×2=6通り。',
  'L2-2022-Q4-3':'電灯は反転回数が奇数のときだけ点灯するので、同じ3つのスイッチを1回ずつ押すなら順序を変えても最終状態は同じ。3つを押したとき、点灯するのは「押した側と押していない側を結ぶ廊下」だけである。そこで押さない2つのスイッチを見る。①〜⑤の隣接本数は2,3,3,4,4本で、押さない2つを直接結ぶ廊下がある場合はその1本を2回数えているので2を引く。点灯数が4になる押さない組は{①,④},{①,⑤},{②,③}の3組。したがって押す3個の組は{②,③,⑤},{②,③,④},{①,④,⑤}の3組。各組の押す順序は3!=6通りなので、3×6=18通り。',
  'L2-2022-Q5-2':'対角面ACGEで考える。P,Qは△ABDのAB,ADの中点なのでPQ∥BDで、PQはBDをA中心に1/2に縮めた位置にある。BDとACの交点をM、PQとACの交点をJとすると、Mは正方形ABCDの中心だからAM=AC/2、したがってAJ=AM/2=AC/4。次に立方体ではBD∥FHなのでPQ∥FH。Fは平面PQF上にあるから、Fを通りPQに平行な直線FHも平面PQF上にある。FHとEGの交点をKとすると、FHとEGは正方形EFGHの対角線なのでKはEGの中点、よってGK=EG/2=AC/2。J,Kはともに平面PQFと対角面ACGE上にあるため、その2平面の交線はJK。IはAGと平面PQFの交点なのでIはJK上にある。AC∥EGより△IAJ∽△IGK。したがってAI:IG=AJ:GK=(AC/4):(AC/2)=1:2。'
}

export const LEVEL2_ASSIGNMENT_SET_REVISION=Number(assignmentsJson.assignmentSetRevision||1)
export const level2Assignments=assignmentsJson.assignments as Assignment[]
const assignmentById=new Map(level2Assignments.map(x=>[x.questionId,x]))

const allCore=(coreJson as Level2Question[]).map(q=>({...q,explanation:explanationOverrides[q.id]??q.explanation,sourceQuestionId:q.sourceQuestionId??null,bankType:'core160'}))
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
