import { useState } from 'react'
import MathAnswerInput from './MathAnswerInput'
import { bankForSource } from '../data/skillChecks'
import { checkKey,checkSummary,loadChecks,nextCheck,saveCheck } from '../skillCheck'
export default function SkillCheck({source,onContinue}:{source:string;onContinue:()=>void}){
 const bank=bankForSource(source)
 const [records,setRecords]=useState(loadChecks),[answer,setAnswer]=useState(''),[feedback,setFeedback]=useState<{correct:boolean;explanation:string}|null>(null),[error,setError]=useState('')
 if(!bank)return null
 const item=nextCheck(bank,source,records)
 const submit=(value:string)=>{
  if(!item||feedback||!value.trim())return
  if(!saveCheck(source,item,value)){setError('保存できませんでした。入力を残しています。もう一度お試しください。');return}
  const saved=loadChecks();setFeedback({correct:saved[checkKey(source,item)].correct,explanation:item.explanation});setError('')
 }
 return <section className="card skill-check" aria-label="短い確認問題">
 <h2>短い問題で、次の練習を選びます</h2><p className="muted">原因の説明は不要です。必要な確認だけ最大3問。オリジナル練習で、入試得点には加えません。</p>
 {item?<><p className="problem">{item.prompt}</p>{item.choices?<div className="actions">{item.choices.map(choice=><button className="button" key={choice} disabled={!!feedback} onClick={()=>{setAnswer(choice);submit(choice)}}>{choice}</button>)}</div>:<><MathAnswerInput value={answer} onChange={setAnswer} onEnter={()=>submit(answer)} disabled={!!feedback}/><button className="button primary" disabled={!!feedback||!answer.trim()} onClick={()=>submit(answer)}>確認する</button></>}
 {feedback&&<div className={`result ${feedback.correct?'ok':'ng'}`}><b>{feedback.correct?'正解':'この手順を確認しましょう'}</b>{!feedback.correct&&<p>{feedback.explanation}</p>}<button className="button primary" onClick={()=>{setRecords(loadChecks());setFeedback(null);setAnswer('')}}>続ける</button></div>}</>:<><p>{checkSummary(bank,source,records)}</p><button className="button primary" onClick={onContinue}>元の問題の解説・解き直しへ</button></>}
 {error&&<p role="alert">{error}</p>}{item&&<button className="button" onClick={onContinue}>確認を省いて解説・解き直しへ</button>}
 </section>
}
