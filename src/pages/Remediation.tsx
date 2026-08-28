import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MathAnswerInput from '../components/MathAnswerInput'
import { classifyRemediationField } from '../data/remediation'
import { isAcceptedAnswer } from '../answer'
import { createRecordId, saveAttempt } from '../storage'

export default function Remediation(){
  const [params]=useSearchParams(),topic=params.get('topic')||'式の計算・文字式',field=classifyRemediationField(topic),questions=field.questions
  const [index,setIndex]=useState(0),[answer,setAnswer]=useState(''),[result,setResult]=useState<boolean|null>(null)
  const [streak,setStreak]=useState(0),[total,setTotal]=useState(0),[finished,setFinished]=useState(false)
  const q=questions[index]
  const submit=()=>{if(result!==null||!answer.trim())return;setResult(isAcceptedAnswer(answer,q.answer,q.acceptedAnswers))}
  const next=()=>{
    if(result===null)return
    saveAttempt({id:createRecordId(`remedy-${index}`),questionId:`remedy-${field.id}-${index}`,mode:'multi',topic,status:result?'correct':'wrong',mistakeTag:result?undefined:'解法未習得',at:new Date().toISOString()})
    const nextStreak=result?streak+1:0
    setTotal(v=>v+1)
    if(nextStreak>=4){
      saveAttempt({id:createRecordId('mastery'),questionId:`mastery-${topic}`,mode:'multi',topic,status:'correct',at:new Date().toISOString()})
      setStreak(4);setFinished(true);return
    }
    setStreak(nextStreak);setIndex(v=>(v+1)%questions.length);setAnswer('');setResult(null)
  }
  if(finished)return <section className="card mastery-card"><span className="eyebrow">MASTERED</span><h1>4問連続正解</h1><p><b>{field.title}</b>を克服済みにしました。次回このテーマで間違えた場合は、再び復習対象になります。</p><div className="actions"><Link className="button primary" to="/mistakes">次の弱点へ</Link><Link className="button" to="/past-papers">次の過去問へ</Link></div></section>
  return <>
    <div className="page-head"><div><span className="eyebrow">4-QUESTION REMEDIATION</span><h1>{field.title}</h1>{topic!==field.title&&<p className="muted">過去問の失点：{topic}</p>}</div><div className="streak-badge">連続 {streak}/4</div></div>
    <div className="progress-track"><i style={{width:`${streak/4*100}%`}}/></div>
    <article className="card practice-card"><div className="qtop"><div><span className="eyebrow">類題 {index+1}/4</span><h2>{field.title}</h2></div><span className="progress-pill">挑戦 {total+1}</span></div><p className="problem">{q.prompt}</p><MathAnswerInput value={answer} onChange={setAnswer} onEnter={submit} disabled={result!==null} autoFocus/>
      {result===null?<div className="actions"><button className="button primary" onClick={submit} disabled={!answer.trim()}>採点する</button></div>:<div className={`result ${result?'ok':'ng'}`}><h3>{result?'○ 正解':'× 不正解・連続記録を0に戻します'}</h3><p><b>正答：</b>{q.answer}</p><p>{q.explanation}</p><button className="button primary" onClick={next}>{result?'次の類題へ':'解法を確認して次へ'}</button></div>}
    </article>
    <section className="card"><h2>克服ルール</h2><p>この分野の類題は4問です。4問を連続正解すると克服です。途中で間違えた場合は解説を確認し、同じ4問を順にもう一度解きます。</p></section>
  </>
}
