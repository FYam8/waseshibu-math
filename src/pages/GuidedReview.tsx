import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MathAnswerInput from '../components/MathAnswerInput'
import { examPages } from '../data/examConfig'
import { isExamAnswerCorrect } from '../data/examAnswers'
import { guidedOutcomeLabel, guidedQuestion, loadGuidedReview, saveGuidedReview, type GuidedOutcome } from '../guidedReview'
import { loadPreferences } from '../storage'
import { gradeAdvice } from '../targetStrategy'

const BASE=import.meta.env.BASE_URL
const pad=(n:number)=>String(n).padStart(2,'0')
const paperImage=(year:number,page:number)=>`${BASE}exam-pages/${year}/page-${pad(page)}.jpg`

export default function GuidedReview(){
  const [params]=useSearchParams(),questionId=params.get('q')||''
  const q=useMemo(()=>guidedQuestion(questionId),[questionId])
  const saved=q?loadGuidedReview(q.id):undefined
  const [mode,setMode]=useState<'choose'|'guided'|'retry'|'answer'>(saved?'guided':'choose')
  const [step,setStep]=useState(saved?.outcome?3:1)
  const [step1,setStep1]=useState(saved?.step1||'')
  const [step2,setStep2]=useState(saved?.step2||'')
  const [finalAnswer,setFinalAnswer]=useState(saved?.finalAnswer||'')
  const [hint1,setHint1]=useState(saved?.hintUsed||false)
  const [hint2,setHint2]=useState(false)
  const [answerSeen,setAnswerSeen]=useState(saved?.answerSeen||false)
  const [result,setResult]=useState<boolean|null>(saved?.outcome?saved.outcome!=='wrong':null)
  const prefs=loadPreferences()
  if(!q)return <section className="card warning-card"><h1>問題を特定できませんでした</h1><p>間違い直し一覧から開き直してください。</p><Link className="button primary" to="/mistakes">間違い直しへ</Link></section>

  const persist=(outcome?:GuidedOutcome,seen=answerSeen,used=hint1||hint2)=>saveGuidedReview({questionId:q.id,step1,step2,finalAnswer,hintUsed:used,answerSeen:seen,outcome,updatedAt:new Date().toISOString()})
  const checkFinal=()=>{
    if(!finalAnswer.trim())return
    const ok=isExamAnswerCorrect(q.id,finalAnswer),outcome:GuidedOutcome=ok?(answerSeen?'reproduced':hint1||hint2?'guided':'independent'):'wrong'
    setResult(ok);persist(outcome)
  }
  const revealAnswer=()=>{setAnswerSeen(true);setMode('answer');setResult(null);persist(saved?.outcome,true)}
  const resetForRetry=()=>{setMode('retry');setFinalAnswer('');setResult(null)}
  const remedySource=q.year===2024||q.year===2025?`&source=${q.year}`:''

  return <>
    <div className="page-head"><div><span className="eyebrow">STEP REVIEW · TARGET {prefs.target}</span><h1>{q.year}年度 大問{q.major}（{q.subNo}）</h1><p className="muted">{q.topic}・優先度{q.grade}　{gradeAdvice(prefs.target,q.grade)}</p></div><Link className="button" to="/mistakes">間違い直しへ戻る</Link></div>
    <div className="guided-review-grid">
      <section className="card guided-problem"><div className="section-head"><div><span className="eyebrow">PROBLEM</span><h2>{q.title}</h2></div><b>（{q.subNo}）</b></div><div className="exam-images">{(examPages[q.year]?.[q.major-1]||[]).map(page=><img key={page} src={paperImage(q.year,page)} alt={`${q.year}年度 大問${q.major}`} />)}</div></section>
      <section className="card guided-panel">
        {mode==='choose'&&<><h2>この問題をどう直しますか？</h2><p>分かるところまでは自分で進め、必要なところだけ助けを使えます。</p><div className="guided-choice"><button className="button primary" onClick={()=>{setMode('guided');setStep(1)}}>ステップで理解する</button><button className="button" onClick={()=>setMode('retry')}>もう一度自力で解く</button><button className="button" onClick={revealAnswer}>答え・解説を見る</button></div></>}
        {mode==='guided'&&<>
          <div className="guided-progress"><span className={step>=1?'active':''}>1 整理</span><span className={step>=2?'active':''}>2 式・考え方</span><span className={step>=3?'active':''}>3 最終答案</span></div>
          {step===1&&<div className="guided-step"><span className="eyebrow">STEP 1</span><h2>問題を整理する</h2><p>{q.step1}</p><textarea value={step1} onChange={e=>setStep1(e.target.value)} placeholder="自分の言葉や途中メモを入力" rows={5}/>{hint1&&<div className="notice-box"><b>ヒント：</b>{q.hint1}</div>}<div className="actions"><button className="button" onClick={()=>{setHint1(true);persist(undefined,answerSeen,true)}}>ヒントを見る</button><button className="button primary" disabled={!step1.trim()} onClick={()=>{persist();setStep(2)}}>STEP 2へ</button><button className="button" onClick={revealAnswer}>すぐ答えを見る</button></div></div>}
          {step===2&&<div className="guided-step"><span className="eyebrow">STEP 2</span><h2>式・考え方を書く</h2><p>{q.step2}</p>{q.previousId&&<div className="notice-box"><b>前の小問を使う場合：</b>自分の（前問）の結果を使っても、正答 <b>{q.previousAnswer?.answer}</b> を使ってここから続けても構いません。</div>}<textarea value={step2} onChange={e=>setStep2(e.target.value)} placeholder="途中式・使う公式・考え方を入力" rows={6}/>{hint2&&<div className="notice-box"><b>ヒント：</b>{q.hint2}</div>}<div className="actions"><button className="button" onClick={()=>{setHint2(true);persist(undefined,answerSeen,true)}}>ヒントを見る</button><button className="button primary" disabled={!step2.trim()} onClick={()=>{persist();setStep(3)}}>最終答案へ</button><button className="button" onClick={revealAnswer}>すぐ答えを見る</button></div></div>}
          {step===3&&<div className="guided-step"><span className="eyebrow">STEP 3</span><h2>最後は自分で答える</h2><p>ここだけは正式な正答データで自動採点します。途中の説明文は採点しません。</p><MathAnswerInput value={finalAnswer} onChange={setFinalAnswer} onEnter={checkFinal} placeholder="最終答案を入力"/>{result!==null&&<div className={`result ${result?'ok':'ng'}`}><h3>{result?'○ 正解':'× もう一度確認'}</h3><p>{result?guidedOutcomeLabel(answerSeen?'reproduced':hint1||hint2?'guided':'independent'):'ヒントや答えを確認してから、もう一度自力で再現してください。'}</p></div>}<div className="actions"><button className="button primary" disabled={!finalAnswer.trim()} onClick={checkFinal}>採点する</button><button className="button" onClick={revealAnswer}>答え・解説を見る</button></div>{result&&<div className="actions"><Link className="button primary" to={`/remediate?topic=${encodeURIComponent(q.topic)}${remedySource}`}>同じ分野の類題へ</Link><button className="button" onClick={resetForRetry}>もう一度ヒントなしで解く</button></div>}</div>}
        </>}
        {mode==='retry'&&<div className="guided-step"><span className="eyebrow">RETRY</span><h2>何も見ずにもう一度</h2><p>答えを見た後でも、ここで再現できたかを確認します。</p><MathAnswerInput value={finalAnswer} onChange={setFinalAnswer} onEnter={checkFinal} placeholder="答えを入力"/>{result!==null&&<div className={`result ${result?'ok':'ng'}`}><h3>{result?'○ 再現できました':'× まだ不安定です'}</h3><p>{result?guidedOutcomeLabel(answerSeen?'reproduced':'independent'):'ステップ学習か答え確認に戻れます。'}</p></div>}<div className="actions"><button className="button primary" disabled={!finalAnswer.trim()} onClick={checkFinal}>採点する</button><button className="button" onClick={()=>{setMode('guided');setStep(1)}}>ステップで理解する</button><button className="button" onClick={revealAnswer}>答えを見る</button></div></div>}
        {mode==='answer'&&<div className="guided-step"><span className="eyebrow">ANSWER</span><h2>答えを確認</h2><div className="answer-reveal"><span>正答</span><strong>{q.answer?.answer||'正答データなし'}</strong></div><p>答えを見たこと自体は「習得」にはしません。考え方を確認したら、答えを閉じて自分で再現します。</p><div className="notice-box"><b>考え方の軸：</b>{q.coreIdeas.join(' / ')||q.hint2}</div><div className="actions"><button className="button primary" onClick={resetForRetry}>答えを閉じて自力で解く</button><button className="button" onClick={()=>{setMode('guided');setStep(1)}}>ステップで理解する</button></div></div>}
      </section>
    </div>
  </>
}
