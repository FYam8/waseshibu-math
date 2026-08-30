import questions from './data/questions.json'
import { pointsFor } from './data/examConfig'
import { classifyRemediationField } from './data/remediation'
import type { Attempt, ExamScore, Grade, MajorQuestion } from './types'

export type TargetScore=60|70|75
export type StrategyItem={key:string;major:number;subNo:string;topic:string;grade:Grade;status:'correct'|'wrong'|'unanswered';points:number;cause?:string;flagged?:boolean}
export type RecoveryCandidate={key:string;label:string;grade:Grade;points:number;reason:string}
export type ExamTargetStrategy={target:TargetScore;score:number;gap:number;reached:boolean;projectedScore:number;recoverablePoints:number;candidates:RecoveryCandidate[];summary:string;timePlan:{label:string;percent:number}[]}

const easyCauses=new Set(['計算ミス','符号ミス','条件読み落とし','読み落とし','答え方の不備'])
const profiles:Record<TargetScore,{summary:string;timePlan:{label:string;percent:number}[]}>= {
  60:{summary:'大問1と大問2〜5の（1）を優先し、難しい（3）は後回しにします。',timePlan:[{label:'大問1',percent:50},{label:'大問2〜5（1）',percent:35},{label:'見直し',percent:15}]},
  70:{summary:'大問1を安定させ、大問2〜5の（2）までのA・B問題を増やします。',timePlan:[{label:'大問1',percent:40},{label:'大問2〜5 A・B',percent:45},{label:'見直し',percent:15}]},
  75:{summary:'A・B問題を確実にした後、取れそうなC問題だけを選びます。',timePlan:[{label:'大問1',percent:35},{label:'大問2〜5 A・B',percent:50},{label:'選ぶC問題',percent:10},{label:'見直し',percent:5}]}
}

export const targetProfile=(target:TargetScore)=>profiles[target]
export const targetGoalLabel=(target:TargetScore)=>target===60?'A 60点':target===70?'B 70点':'C 75点'
export const targetGoalLetter=(target:TargetScore)=>target===60?'A':target===70?'B':'C'
export const gradeInTarget=(target:TargetScore,grade:Grade)=>grade==='A'||(grade==='B'&&target>=70)||(grade==='C'&&target>=75)
export function gradeAdvice(target:TargetScore,grade:Grade){
  if(grade==='A')return '目標点にかかわらず最優先'
  if(grade==='B')return target>=70?'今回の目標で優先':'60点を固めた後に追加'
  return target>=75?'A・Bが安定したら選んで挑戦':'現時点では後回し候補'
}

function itemRank(target:TargetScore,item:StrategyItem){
  const gradeRank:Record<Grade,number>=target===60?{A:0,B:4,C:8}:target===70?{A:0,B:1.5,C:7}:{A:0,B:1,C:2.5}
  const no=Number.parseInt(item.subNo,10)
  return gradeRank[item.grade]+(item.major===1?-1:0)+(no===1?-0.5:no>=3?1:0)+(easyCauses.has(item.cause||'')?-1:0)+(item.status==='unanswered'?0.5:0)+(item.flagged?0.25:0)
}
function candidateReason(target:TargetScore,item:StrategyItem){
  if(easyCauses.has(item.cause||''))return `${item.cause}を直して回収`
  if(item.status==='unanswered')return '未回答：方針を立てる練習から'
  if(item.grade==='A')return '基礎・標準として最優先'
  if(item.grade==='B')return target>=70?'目標到達に必要な標準問題':'60点安定後の追加候補'
  return target>=75?'取れそうなら選ぶ発展問題':'今回は後回し候補'
}

export function rankWeakFields(target:TargetScore,items:StrategyItem[]){
  const weights:Record<string,number>={},gradeWeight:Record<TargetScore,Record<Grade,number>>={60:{A:6,B:1.5,C:.25},70:{A:6,B:4,C:.5},75:{A:6,B:5,C:2}}
  for(const item of items){if(item.status==='correct'||!gradeInTarget(target,item.grade))continue;const field=classifyRemediationField(item.topic).title,status=item.status==='wrong'?1:.7,cause=easyCauses.has(item.cause||'')?1.25:1;weights[field]=(weights[field]||0)+gradeWeight[target][item.grade]*status*cause}
  return Object.entries(weights).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ja')).slice(0,3).map(([field])=>field)
}

export function buildTargetStrategy(target:TargetScore,score:number,items:StrategyItem[]):ExamTargetStrategy{
  const candidates=items.filter(item=>item.status!=='correct'&&gradeInTarget(target,item.grade)).sort((a,b)=>itemRank(target,a)-itemRank(target,b)||a.key.localeCompare(b.key)).slice(0,3).map(item=>({key:item.key,label:`大問${item.major}（${item.subNo}） ${item.topic}`,grade:item.grade,points:Math.round(item.points),reason:candidateReason(target,item)}))
  const recoverablePoints=candidates.reduce((sum,item)=>sum+item.points,0),gap=Math.max(0,target-score),projectedScore=Math.min(100,score+recoverablePoints),reached=gap===0
  const summary=reached?`目標${target}点に到達しています。次は同じ得点を再現できるよう、優先問題の取りこぼしを直します。`:!candidates.length?(items.length?`目標方針内の優先問題は取れています。次の段階の問題を増やすか、時間配分を見直します。`:`得点だけの記録では回収問題を特定できません。次の年度をアプリで自動採点すると、具体的な候補を表示します。`):projectedScore>=target?`上の回収候補を取り直せれば、目標${target}点に届く見込みです。`:`まず上の回収候補を直し、残りは弱点3分野の補強で埋めます。`
  return {target,score,gap,reached,projectedScore,recoverablePoints,candidates,summary,timePlan:profiles[target].timePlan}
}

const majorQuestions=questions.questions as MajorQuestion[]
const questionByKey=new Map<string,{major:MajorQuestion;sub:MajorQuestion['subquestions'][number]}>(majorQuestions.flatMap(major=>major.subquestions.map(sub=>[`${major.id}-${sub.no}`,{major,sub}])))
export function storedExamItems(exam:ExamScore,attempts:Attempt[]):StrategyItem[]{
  return attempts.filter(attempt=>attempt.at===exam.at&&attempt.questionId.startsWith(`exam-${exam.year}-Q`)).flatMap(attempt=>{const key=attempt.questionId.slice(5),found=questionByKey.get(key);if(!found)return [];return [{key,major:found.major.major,subNo:found.sub.no,topic:found.sub.topic,grade:found.sub.grade,status:attempt.status==='deferred'?'unanswered':attempt.status,points:pointsFor(exam.year,found.major.major,found.major.subquestions.length),cause:attempt.mistakeTag,flagged:attempt.flagged}]})
}
export function strategyForStoredExam(target:TargetScore,exam:ExamScore,attempts:Attempt[]){return buildTargetStrategy(target,exam.score,storedExamItems(exam,attempts))}
export function weakFieldsForStoredExam(target:TargetScore,exam:ExamScore,attempts:Attempt[]){const items=storedExamItems(exam,attempts);return items.length?rankWeakFields(target,items):exam.weakFields||[]}
