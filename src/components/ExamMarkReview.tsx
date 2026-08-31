import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FocusedQuestionView from './FocusedQuestionView'
import { getExamAnswer } from '../data/examAnswers'
import type { MajorQuestion } from '../types'

type Status='correct'|'wrong'|'unanswered'
type Props={
  year:number
  majors:MajorQuestion[]
  answers:Record<string,string>
  flags:Record<string,boolean>
  causeMap:Record<string,string>
  overrides:Record<string,'correct'|'wrong'>
  statusFor:(key:string)=>Status
  setCauseMap:(fn:(value:Record<string,string>)=>Record<string,string>)=>void
  setOverrides:(fn:(value:Record<string,'correct'|'wrong'>)=>Record<string,'correct'|'wrong'>)=>void
  onFinish:()=>void
}
const causes=['計算ミス','符号ミス','条件読み落とし','知識不足','解法未習得','場合分け不足','答え方の不備','時間不足','現時点では難しい']
const keyFor=(q:MajorQuestion,no:string)=>`${q.id}-${no}`

export default function ExamMarkReview({year,majors,answers,flags,causeMap,statusFor,setCauseMap,setOverrides,onFinish}:Props){
  const all=majors.flatMap(major=>major.subquestions.map((sub,subIndex)=>({major,sub,subIndex,key:keyFor(major,sub.no)})))
  const makeOrder=()=>[...all].sort((a,b)=>{
    const rank=(x:typeof a)=>statusFor(x.key)==='wrong'?0:statusFor(x.key)==='unanswered'?1:2
    return rank(a)-rank(b)||a.major.major-b.major.major||a.subIndex-b.subIndex
  })
  // 採点確認を開始した時点の順番を固定する。○/×を手動修正しても今見ている小問を飛ばさない。
  const [reviewOrder,setReviewOrder]=useState(makeOrder)
  const [currentIndex,setCurrentIndex]=useState(0)
  useEffect(()=>{setReviewOrder(makeOrder());setCurrentIndex(0)},[year])
  const safeIndex=Math.max(0,Math.min(reviewOrder.length-1,currentIndex)),current=reviewOrder[safeIndex]
  if(!current)return <section className="card"><h1>採点対象がありません</h1><button className="button primary" onClick={onFinish}>結果を保存する</button></section>
  const status=statusFor(current.key),expected=getExamAnswer(current.key)
  const move=(next:number)=>{setCurrentIndex(Math.max(0,Math.min(reviewOrder.length-1,next)));window.scrollTo({top:0,behavior:'smooth'})}
  return <>
    <div className="page-head"><div><span className="eyebrow">ONE QUESTION MARKING</span><h1>{year}年度｜採点確認</h1><p className="muted">失点した小問から1問ずつ確認します。ほかの問題・正答は同時に表示しません。</p></div><b>{safeIndex+1} / {reviewOrder.length}</b></div>
    <div className="one-question-banner"><b>今確認しているのは 大問{current.major.major}（{current.sub.no}）だけ</b><span>公式解答ページ全体は表示しません。</span></div>
    <div className="mark-focus-grid">
      <section className="card"><FocusedQuestionView year={year} major={current.major.major} subIndex={current.subIndex} subCount={current.major.subquestions.length} subNo={current.sub.no} topic={current.sub.topic}/></section>
      <aside className="card mark-focus-panel">
        <div className={`mark-status ${status}`}><b>{status==='correct'?'○ 正解':status==='wrong'?'× 不正解':'— 未回答'}</b><span>{current.sub.topic}</span></div>
        <div className="single-answer-compare"><div><span>自分の答え</span><b>{answers[current.key]||'未入力'}</b></div><div><span>この小問の正答</span><b>{expected?.answer||'正答データを確認できません'}</b></div></div>
        <button className="grade-override" onClick={()=>setOverrides(v=>({...v,[current.key]:status==='correct'?'wrong':'correct'}))}>{status==='correct'?'不正解に修正':'正解に修正'}</button>
        {status!=='correct'&&<><label className="mark-cause">間違えた原因（任意）<select value={causeMap[current.key]||''} onChange={e=>setCauseMap(v=>({...v,[current.key]:e.target.value}))}><option value="">選択しない</option>{causes.map(x=><option key={x}>{x}</option>)}</select></label><Link className="button primary" to={`/guided-review?q=${encodeURIComponent(current.key)}`}>この1問の解説・解き直しへ</Link></>}
        {flags[current.key]&&<div className="notice-box">この問題は「迷い」として記録されています。</div>}
        <div className="mark-focus-nav"><button className="button" disabled={safeIndex===0} onClick={()=>move(safeIndex-1)}>← 前の小問</button>{safeIndex<reviewOrder.length-1?<button className="button primary" onClick={()=>move(safeIndex+1)}>次の小問 →</button>:<button className="button primary" onClick={onFinish}>採点結果を保存</button>}</div>
        <p className="muted">順番は「不正解 → 未回答 → 正解」です。まず失点した問題だけを確認できます。</p>
      </aside>
    </div>
  </>
}
