import questions from './data/questions.json'
import { examAnswers, isExamAnswerCorrect } from './data/examAnswers'
import type { MajorQuestion } from './types'

export const PREP_KEY='waseshibu-math-prep-check-v1'
export const PREP_VERSION=1

export type PrepQuestion={id:string;prompt:string;answer:string;acceptedAnswers?:string[];hint:string;explanation:string}
export const prepQuestions:PrepQuestion[]=[
  {id:'prep-1',prompt:'8 − 2 を計算してください。',answer:'6',hint:'8から2を引きます。',explanation:'8 − 2 = 6です。整数の入力を確認します。'},
  {id:'prep-2',prompt:'5 − 8 を計算してください。',answer:'-3',acceptedAnswers:['−3'],hint:'答えは0より小さくなります。',explanation:'5 − 8 = -3です。全角・半角の負号をどちらも使えます。'},
  {id:'prep-3',prompt:'1/2 + 1/4 を計算してください。',answer:'3/4',acceptedAnswers:['0.75'],hint:'1/2を分母4の分数に直します。',explanation:'2/4 + 1/4 = 3/4です。0.75でも正解になります。'},
  {id:'prep-4',prompt:'√12 を a√b の形に簡単にしてください。',answer:'2√3',acceptedAnswers:['2sqrt(3)','2*√3'],hint:'12 = 4 × 3 と分けます。',explanation:'√12 = √(4×3) = 2√3です。sqrt(3)入力にも対応します。'},
  {id:'prep-5',prompt:'x + y = 3、x − y = 1 の解を座標 (x,y) で入力してください。',answer:'(2,1)',acceptedAnswers:['2,1','x=2,y=1'],hint:'2つの式を加えると2x=4です。',explanation:'x=2、y=1なので、座標は(2,1)です。全角の括弧・数字・カンマにも対応します。'}
]

export type PrepState={version:number;index:number;answers:Record<string,string>;tries:Record<string,number>;completed:boolean;skipped:boolean;updatedAt:string}
const emptyPrep=():PrepState=>({version:PREP_VERSION,index:0,answers:{},tries:{},completed:false,skipped:false,updatedAt:new Date(0).toISOString()})

export function loadPrepState():PrepState{
  try{
    const raw=JSON.parse(localStorage.getItem(PREP_KEY)||'null')
    if(!raw||raw.version!==PREP_VERSION)return emptyPrep()
    return {version:PREP_VERSION,index:Math.max(0,Math.min(prepQuestions.length-1,Number(raw.index)||0)),answers:raw.answers&&typeof raw.answers==='object'?raw.answers:{},tries:raw.tries&&typeof raw.tries==='object'?raw.tries:{},completed:raw.completed===true,skipped:raw.skipped===true,updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:new Date(0).toISOString()}
  }catch{return emptyPrep()}
}

export function savePrepState(state:PrepState){
  localStorage.setItem(PREP_KEY,JSON.stringify({...state,version:PREP_VERSION,updatedAt:new Date().toISOString()}))
  window.dispatchEvent(new CustomEvent('waseshibu-route-change'))
}

const expected2024:Record<string,string>={
  '2024-Q1-1':'6','2024-Q1-2':'300','2024-Q1-3':'-2','2024-Q1-4':'22','2024-Q1-5':'150','2024-Q1-6':'(-1,-1)','2024-Q1-7':'2√15','2024-Q1-8':'2',
  '2024-Q2-1':'1/4','2024-Q2-2':'(-2,-4)','2024-Q2-3':'3±√13','2024-Q3-1':'3/4','2024-Q3-2':'1/2','2024-Q3-3':'11/15',
  '2024-Q4-1':'8','2024-Q4-2':'74/25','2024-Q4-3':'2√6/3,8/3','2024-Q5-1':'15','2024-Q5-2':'75','2024-Q5-3':'2,3,3'
}
const toFullWidth=(value:string)=>value.replace(/[!-~]/g,char=>String.fromCharCode(char.charCodeAt(0)+0xFEE0))

export type IntegrityResult={ok:boolean;questionCount:number;answerCount:number;year2024Count:number;issues:string[]}
let cachedIntegrity:IntegrityResult|null=null
export function runExamIntegrityCheck():IntegrityResult{
  if(cachedIntegrity)return cachedIntegrity
  const majors=questions.questions as MajorQuestion[],ids=majors.flatMap(q=>q.subquestions.map(s=>`${q.id}-${s.no}`)),answerIds=Object.keys(examAnswers),issues:string[]=[]
  const year2024Count=majors.filter(q=>q.year===2024).reduce((sum,q)=>sum+q.subquestions.length,0)
  if(ids.length!==160)issues.push(`問題数が160問ではありません（${ids.length}問）`)
  if(new Set(ids).size!==ids.length)issues.push('問題IDが重複しています')
  if(answerIds.length!==160)issues.push(`正答数が160件ではありません（${answerIds.length}件）`)
  const missing=ids.filter(id=>!examAnswers[id]),extra=answerIds.filter(id=>!ids.includes(id))
  if(missing.length)issues.push(`正答がない問題があります（${missing.slice(0,3).join(', ')}）`)
  if(extra.length)issues.push(`対応する問題がない正答があります（${extra.slice(0,3).join(', ')}）`)
  if(year2024Count!==20)issues.push(`2024年度が20小問ではありません（${year2024Count}問）`)
  for(const id of ids){const item=examAnswers[id];if(!item)continue;if(!isExamAnswerCorrect(id,item.answer))issues.push(`${id}の正答を判定できません`);if(!isExamAnswerCorrect(id,toFullWidth(item.answer)))issues.push(`${id}の全角正答を判定できません`);if(isExamAnswerCorrect(id,'__明らかな誤答__'))issues.push(`${id}が誤答を正解にしています`)}
  for(const [id,answer] of Object.entries(expected2024))if(examAnswers[id]?.answer!==answer)issues.push(`${id}が確認済み2024正答と一致しません`)
  cachedIntegrity={ok:issues.length===0,questionCount:ids.length,answerCount:answerIds.length,year2024Count,issues}
  return cachedIntegrity
}
