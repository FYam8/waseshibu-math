import questions from './data/questions.json'
import { getExamAnswer } from './data/examAnswers'
import { canWriteLearningData, notifyWriteBlocked } from './version'
import type { MajorQuestion } from './types'

export const GUIDED_REVIEW_KEY='waseshibu-math-guided-review-v1'

export type GuidedOutcome='independent'|'guided'|'reproduced'|'wrong'
export type GuidedReviewRecord={questionId:string;step1:string;step2:string;finalAnswer:string;hintUsed:boolean;answerSeen:boolean;outcome?:GuidedOutcome;updatedAt:string}
export type GuidedReviewState=Record<string,GuidedReviewRecord>

const majors=questions.questions as MajorQuestion[]
const guideForTopic=(topic:string)=>{
  if(/計算|文字式|式の変形|因数分解|方程式|平方根|根号/.test(topic))return {step1:'何を整理・変形すれば答えに近づくかを書いてください。',hint1:'符号、かっこ、分母、共通因数を1つずつ確認します。',step2:'途中式を1段階ずつ書いてください。暗算で飛ばさないのがポイントです。',hint2:'等号の左右で同じ操作になっているか、最後に代入・展開で確認します。'}
  if(/確率|場合|数え|カード|サイコロ|コイン|規則/.test(topic))return {step1:'「全体の場合」と「条件を満たす場合」をどう数えるか書いてください。',hint1:'重複・順序・戻す/戻さないを先に確認します。',step2:'樹形図、表、積の法則など、使う数え方と式を書いてください。',hint2:'確率なら最後に「条件を満たす数 ÷ 全体の数」に戻します。'}
  if(/関数|放物線|座標|直線|傾き|交点|変域/.test(topic))return {step1:'分かっている座標・式・範囲を整理して、求める量を書いてください。',hint1:'点の座標は式へ代入し、直線なら傾きと切片、放物線なら係数を確認します。',step2:'使う関係式を立て、どの値を代入するかを書いてください。',hint2:'グラフを頭の中だけで処理せず、xとyの対応を式で確認します。'}
  if(/角|三角|四角|円|相似|面積|体積|辺|長さ|図形|正多角|立体/.test(topic))return {step1:'図から分かる等しい角・辺、平行、相似、面積や体積の関係を書いてください。',hint1:'問題画像に印を付けるつもりで、既知量と求める量を分けます。',step2:'使う定理・比・公式を1つ選び、式または比を書いてください。',hint2:'相似比→面積比、半径→円、底面積×高さなど、段階を飛ばさないで確認します。'}
  if(/整数|約数|倍数|余り|データ|中央値|平均/.test(topic))return {step1:'条件を数式や短い言葉に置き換えてください。',hint1:'整数は倍数・余り、データは並べ替え・合計など基本操作へ戻します。',step2:'条件から使う式や計算手順を書いてください。',hint2:'求めた値が元の条件を全部満たすか確認します。'}
  return {step1:'問題文から「分かっていること」と「求めること」を自分の言葉で整理してください。',hint1:'数字・条件・図の印を拾い、求めるものを最後に1つ決めます。',step2:'使う公式・定理・考え方と、最初の式を書いてください。',hint2:'一度に答えまで進まず、最初の1手だけを明確にします。'}
}

export function normalizeGuidedQuestionId(value:string){return value.replace(/^exam-/,'')}
export function guidedQuestion(questionId:string){
  const id=normalizeGuidedQuestionId(questionId),major=majors.find(m=>id.startsWith(`${m.id}-`))
  if(!major)return null
  const sub=major.subquestions.find(s=>`${major.id}-${s.no}`===id)
  if(!sub)return null
  const index=major.subquestions.indexOf(sub),previous=index>0?major.subquestions[index-1]:null,previousId=previous?`${major.id}-${previous.no}`:undefined
  return {id,year:major.year,major:major.major,subNo:sub.no,topic:sub.topic,grade:sub.grade,title:major.title,coreIdeas:major.core_ideas,answer:getExamAnswer(id),previousId,previousAnswer:previousId?getExamAnswer(previousId):undefined,...guideForTopic(sub.topic)}
}
export function loadGuidedReviews(storage:Pick<Storage,'getItem'>=localStorage):GuidedReviewState{try{const raw=JSON.parse(storage.getItem(GUIDED_REVIEW_KEY)||'{}');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}}catch{return {}}}
export function loadGuidedReview(questionId:string,storage:Pick<Storage,'getItem'>=localStorage){return loadGuidedReviews(storage)[normalizeGuidedQuestionId(questionId)]}
export function saveGuidedReview(record:GuidedReviewRecord,storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
  const isBrowserStorage=typeof localStorage!=='undefined'&&storage===localStorage
  if(isBrowserStorage&&!canWriteLearningData()){notifyWriteBlocked();return}
  const all=loadGuidedReviews(storage),id=normalizeGuidedQuestionId(record.questionId)
  storage.setItem(GUIDED_REVIEW_KEY,JSON.stringify({...all,[id]:{...record,questionId:id,updatedAt:new Date().toISOString()}}))
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('waseshibu-guided-review-change'))
}
export function guidedOutcomeLabel(outcome?:GuidedOutcome){if(outcome==='independent')return 'ヒントなしで再現';if(outcome==='guided')return 'ヒントありで理解';if(outcome==='reproduced')return '答え確認後に再現';if(outcome==='wrong')return 'もう一度確認';return '未完了'}
