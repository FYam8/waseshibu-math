import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MathAnswerInput from '../components/MathAnswerInput'
import { getRemediationForSource } from '../data/remediation'
import { isAcceptedAnswer } from '../answer'
import { createRecordId, loadAttempts, saveAttempt } from '../storage'
import { updateGuidedProgress } from '../guidedReview'
import { ensureRemediationProgress, recordRemediationAttempt } from '../remediationProgress'

export default function Remediation(){
  const [params]=useSearchParams(),topic=params.get('topic')||'式の計算・文字式',source=params.get('source'),sourceQuestion=params.get('q')||'',remediation=getRemediationForSource(topic,sourceQuestion),field=remediation.field,questions=remediation.questions,difficulty=remediation.difficulty
  const latestSourceAttemptAt=sourceQuestion?loadAttempts().filter(a=>a.questionId===`exam-${sourceQuestion}`&&a.status!=='correct').sort((a,b)=>b.at.localeCompare(a.at))[0]?.at:undefined
  const initial=sourceQuestion?ensureRemediationProgress(sourceQuestion,field.id,difficulty,questions.length,latestSourceAttemptAt):undefined
  const [index,setIndex]=useState(initial?.currentIndex||0),[answer,setAnswer]=useState(''),[result,setResult]=useState<boolean|null>(null)
  const [streak,setStreak]=useState(initial?.streak||0),[total,setTotal]=useState(initial?.attemptCount||0),[finished,setFinished]=useState(initial?.status==='completed')
  const q=questions[index%Math.max(1,questions.length)]
  const submit=()=>{if(result!==null||!answer.trim())return;setResult(isAcceptedAnswer(answer,q.answer,q.acceptedAnswers))}
  const next=()=>{
    if(result===null)return
    const questionId=`remedy-${sourceQuestion||field.id}-${difficulty}-${index}`
    saveAttempt({id:createRecordId(`remedy-${index}`),questionId,mode:'multi',topic,status:result?'correct':'wrong',mistakeTag:result?undefined:'解法未習得',at:new Date().toISOString()})
    if(sourceQuestion){
      const progress=recordRemediationAttempt(sourceQuestion,field.id,difficulty,questions.length,questionId,result,latestSourceAttemptAt)
      // Guided側の既存参照も同じ値へ同期する。重複問題では進めない。
      updateGuidedProgress(sourceQuestion,progress.status==='completed'?{practiceStreak:progress.streak,mastery:'consolidated'}:{practiceStreak:progress.streak})
      setTotal(progress.attemptCount);setStreak(progress.streak);setIndex(progress.currentIndex)
      if(progress.status==='completed'){
        saveAttempt({id:createRecordId('mastery'),questionId:`mastery-${sourceQuestion}`,mode:'multi',topic,status:'correct',at:new Date().toISOString()})
        setFinished(true);return
      }
    }else{
      const nextStreak=result?streak+1:0
      setTotal(v=>v+1)
      if(nextStreak>=4){
        saveAttempt({id:createRecordId('mastery'),questionId:`mastery-${topic}`,mode:'multi',topic,status:'correct',at:new Date().toISOString()})
        setStreak(4);setFinished(true);return
      }
      setStreak(nextStreak);setIndex(v=>(v+1)%questions.length)
    }
    setAnswer('');setResult(null)
  }
  if(finished)return <section className="card mastery-card"><span className="eyebrow">MASTERED</span><h1>4問連続正解</h1><p><b>{field.title}</b>を克服済みにしました。4つの異なる類題を順に正解した記録を保存しています。</p><div className="actions"><Link className="button primary" to={source?`/reinforce?source=${source}`:'/mistakes'}>{source?'弱点補強へ戻る':'次の弱点へ'}</Link><Link className="button" to="/">ホームで次の行動を見る</Link></div></section>
  return <>
    <div className="page-head"><div><span className="eyebrow">4-QUESTION REMEDIATION</span><h1>{field.title}</h1><p className="muted">過去問基準の難易度：{difficulty}</p>{topic!==field.title&&<p className="muted">過去問の未解決：{topic}</p>}</div><div className="streak-badge">連続 {streak}/4</div></div>
    <div className="progress-track"><i style={{width:`${streak/4*100}%`}}/></div>
    <article className="card practice-card"><div className="qtop"><div><span className="eyebrow">連続正解チャレンジ {Math.min(streak+1,4)}/4</span><h2>{field.title}</h2></div><span className="progress-pill">挑戦 {total+1}</span></div><p className="problem">{q.prompt}</p><MathAnswerInput value={answer} onChange={setAnswer} onEnter={submit} disabled={result!==null} autoFocus/>
      {result===null?<div className="actions"><button className="button primary" onClick={submit} disabled={!answer.trim()}>採点する</button></div>:<div className={`result ${result?'ok':'ng'}`}><h3>{result?'○ 正解':'× 不正解・連続記録を0に戻します'}</h3><p><b>正答：</b>{q.answer}</p><p>{q.explanation}</p><button className="button primary" onClick={next}>{result?'次の類題へ':'解法を確認して次へ'}</button></div>}
    </article>
    <section className="card"><h2>克服ルール</h2><p>元問題のA/B/C判定と中心技能に合わせた4問を、異なる問題として順番に連続正解すると克服です。途中で間違えた場合は0/4へ戻ります。途中でHomeへ戻ったり再読み込みしても、次の問題位置から再開します。</p></section>
  </>
}
