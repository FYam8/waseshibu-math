import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MathAnswerInput from '../components/MathAnswerInput'
import { getRemediation } from '../data/remediation'
import { isAcceptedAnswer } from '../answer'
import { createRecordId, saveAttempt } from '../storage'

export default function Remediation(){
  const [params]=useSearchParams(),topic=params.get('topic')||'大問1標準問題',questions=getRemediation(topic)
  const [index,setIndex]=useState(0),[answer,setAnswer]=useState(''),[result,setResult]=useState<boolean|null>(null)
  const [streak,setStreak]=useState(0),[total,setTotal]=useState(0),[finished,setFinished]=useState(false)
  const q=questions[index]
  const submit=()=>{if(result!==null||!answer.trim())return;setResult(isAcceptedAnswer(answer,q.answer,q.acceptedAnswers))}
  const next=()=>{
    if(result===null)return
    saveAttempt({id:createRecordId(`remedy-${index}`),questionId:`remedy-${topic}-${index}`,mode:'multi',topic,status:result?'correct':'wrong',mistakeTag:result?undefined:'解法未習得',at:new Date().toISOString()})
    const nextStreak=result?streak+1:0
    setTotal(v=>v+1)
    if(nextStreak>=5&&total+1>=8){
      saveAttempt({id:createRecordId('mastery'),questionId:`mastery-${topic}`,mode:'multi',topic,status:'correct',at:new Date().toISOString()})
      setStreak(3);setFinished(true);return
    }
    setStreak(nextStreak);setIndex(v=>(v+1)%questions.length);setAnswer('');setResult(null)
  }
  if(finished)return <section className="card mastery-card"><span className="eyebrow">MASTERED</span><h1>最低8問＋5問連続正解</h1><p><b>{topic}</b>を克服済みにしました。次回このテーマで間違えた場合は、再び復習対象になります。</p><div className="actions"><Link className="button primary" to="/mistakes">次の弱点へ</Link><Link className="button" to="/past-papers">過去問採点へ</Link></div></section>
  return <>
    <div className="page-head"><div><span className="eyebrow">ADAPTIVE MASTERY</span><h1>12問プールで克服</h1><p className="muted">{topic}</p></div><div className="streak-badge">挑戦 {total}/8以上・連続 {streak}/5</div></div>
    <div className="progress-track"><i style={{width:`${Math.min(total/8,streak/5)*100}%`}}/></div>
    <article className="card practice-card"><div className="qtop"><div><span className="eyebrow">類題 {index+1}</span><h2>{topic}</h2></div><span className="progress-pill">挑戦 {total+1}</span></div><p className="problem">{q.prompt}</p><MathAnswerInput value={answer} onChange={setAnswer} onEnter={submit} disabled={result!==null} autoFocus/>
      {result===null?<div className="actions"><button className="button primary" onClick={submit} disabled={!answer.trim()}>採点する</button></div>:<div className={`result ${result?'ok':'ng'}`}><h3>{result?'○ 正解':'× 不正解・連続記録を0に戻します'}</h3><p><b>正答：</b>{q.answer}</p><p>{q.explanation}</p><button className="button primary" onClick={next}>{result?'次の類題へ':'解法を確認して次へ'}</button></div>}
    </article>
    <section className="card"><h2>克服ルール</h2><p>12問の類題プールから出題します。最低8問に挑戦し、そのうえで5問連続正解すると克服です。途中で間違えたら連続数は0に戻ります。</p></section>
  </>
}
