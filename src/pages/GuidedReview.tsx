
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MathAnswerInput from '../components/MathAnswerInput'
import FocusedQuestionView from '../components/FocusedQuestionView'
import {
  guidedOutcomeLabel,guidedQuestion,loadGuidedProgress,loadGuidedReview,recordGuidedFinal,
  recordGuidedStep,revealGuidedFinalAnswer,saveGuidedReview,updateGuidedProgress,validateGuidedStepResponse,type GuidedOutcome
} from '../guidedReview'
import { loadPreferences } from '../storage'
import { gradeAdvice, targetGoalLabel } from '../targetStrategy'

export default function GuidedReview(){
  const [params]=useSearchParams(),questionId=params.get('q')||''
  const q=useMemo(()=>guidedQuestion(questionId),[questionId])
  const legacy=q?loadGuidedReview(q.id):undefined
  const initialProgress=q?loadGuidedProgress(q.id):undefined
  const solution=q?.solution
  const [mode,setMode]=useState<'choose'|'guided'|'retry'|'answer'>(initialProgress?.mastery&&initialProgress.mastery!=='unseen'?'guided':'choose')
  const [stepIndex,setStepIndex]=useState(0)
  const [responses,setResponses]=useState<Record<string,string>>(()=>initialProgress?Object.fromEntries(Object.entries(initialProgress.stepProgress).map(([id,p])=>[id,p.answer])):{})
  const [hintLevels,setHintLevels]=useState<Record<string,0|1|2|3>>(()=>initialProgress?Object.fromEntries(Object.entries(initialProgress.stepProgress).map(([id,p])=>[id,p.hintLevelUsed])):{})
  const [stepAssessments,setStepAssessments]=useState<Record<string,'matched'|'guided'|'unclear'>>(()=>initialProgress?Object.fromEntries(Object.entries(initialProgress.stepProgress).filter(([,p])=>p.selfAssessment).map(([id,p])=>[id,p.selfAssessment!])):{})
  const [finalAnswer,setFinalAnswer]=useState(initialProgress?.finalAnswer||legacy?.finalAnswer||'')
  const [result,setResult]=useState<boolean|null>(null)
  const [mastery,setMastery]=useState(initialProgress?.mastery||'unseen')
  const [dependencyMode,setDependencyMode]=useState<'own'|'official'>(initialProgress?.dependencyMode||'own')
  const prefs=loadPreferences()

  if(!q||!solution)return <section className="card warning-card"><h1>問題専用解説を特定できませんでした</h1><p>間違い直し一覧から開き直してください。</p><Link className="button primary" to="/mistakes">間違い直しへ</Link></section>
  const steps=solution.steps,current=steps[Math.min(stepIndex,steps.length-1)],hintLevel=hintLevels[current?.id]||0
  const currentResponse=responses[current?.id]||'',currentResponseValid=!!current&&validateGuidedStepResponse(current,currentResponse)
  const progress=loadGuidedProgress(q.id)
  const dependencies=solution.context.dependsOn||[]

  const persistLegacy=(outcome?:GuidedOutcome,seen=progress.finalAnswerSeen,used=Object.values(hintLevels).some(v=>v>0))=>{
    const values=Object.values(responses)
    saveGuidedReview({questionId:q.id,step1:values[0]||'',step2:values[1]||'',finalAnswer,hintUsed:used,answerSeen:seen,outcome,updatedAt:new Date().toISOString()})
  }
  const setHint=(level:1|2|3)=>{
    const next=Math.max(hintLevel,level) as 1|2|3
    setHintLevels(v=>({...v,[current.id]:next}))
    recordGuidedStep(q.id,current.id,responses[current.id]||'',next,false)
    if(level===3)updateGuidedProgress(q.id,{mastery:progress.mastery==='consolidated'?'consolidated':'exposed'})
  }
  const assessStep=(assessment:'matched'|'guided'|'unclear')=>{
    const value=responses[current.id]||''
    if(assessment==='matched'&&!validateGuidedStepResponse(current,value))return
    if(assessment==='guided'&&hintLevel<1)return
    recordGuidedStep(q.id,current.id,value,hintLevel,false)
    assessGuidedStep(q.id,current.id,assessment)
    setStepAssessments(v=>({...v,[current.id]:assessment}))
  }
  const completeStep=()=>{
    const value=responses[current.id]||'',assessment=stepAssessments[current.id]
    if(!assessment||assessment==='unclear')return
    if(assessment==='matched'&&!validateGuidedStepResponse(current,value))return
    if(assessment==='guided'&&hintLevel<3&&!validateGuidedStepResponse(current,value))return
    recordGuidedStep(q.id,current.id,value,hintLevel,true)
    assessGuidedStep(q.id,current.id,assessment)
    persistLegacy(undefined,progress.finalAnswerSeen,Object.values({...hintLevels,[current.id]:hintLevel}).some(v=>v>0))
    if(stepIndex<steps.length-1)setStepIndex(v=>v+1)
  }
  const checkFinal=(from:'guided'|'retry')=>{
    if(!finalAnswer.trim())return
    const outcome=recordGuidedFinal(q.id,finalAnswer,from)
    setResult(outcome.correct);setMastery(outcome.mastery)
    const legacyOutcome:GuidedOutcome=outcome.correct?(outcome.mastery==='independent'?'independent':outcome.mastery==='reproduced'?'reproduced':'guided'):'wrong'
    persistLegacy(legacyOutcome)
  }
  const revealAnswer=()=>{
    revealGuidedFinalAnswer(q.id);setMastery('exposed');setMode('answer');setResult(null)
    persistLegacy(undefined,true,true)
  }
  const resetForRetry=()=>{setMode('retry');setFinalAnswer('');setResult(null)}
  const remedySource=q.year>=2022&&q.year<=2026?`&source=${q.year}`:''
  const remedyLink=`/remediate?topic=${encodeURIComponent(q.topic)}${remedySource}&q=${encodeURIComponent(q.id)}`

  return <>
    <div className="page-head"><div><span className="eyebrow">GUIDED SOLUTION · {targetGoalLabel(prefs.target)}</span><h1>{q.year}年度 大問{q.major}（{q.subNo}）</h1><p className="muted">{q.topic}・優先度{q.grade}　{gradeAdvice(prefs.target,q.grade)}</p></div><Link className="button" to="/mistakes">間違い直しへ戻る</Link></div>
    <div className="one-question-banner"><b>今はこの1問だけ</b><span>ほかの小問・ほかの正答は表示しません。</span><em>{guidedOutcomeLabel(mastery)}</em></div>
    <div className="guided-review-grid">
      <section className="card guided-problem"><div className="section-head"><div><span className="eyebrow">FOCUSED PROBLEM</span><h2>{q.title}</h2></div><b>（{q.subNo}）</b></div><FocusedQuestionView year={q.year} major={q.major} subIndex={q.subIndex} subCount={q.subCount} subNo={q.subNo} topic={q.topic}/></section>
      <section className="card guided-panel">
        {mode==='choose'&&<><h2>この1問をどう直しますか？</h2><div className="notice-box"><b>最初に気づきたいこと</b><p>{solution.firstNotice}</p></div><div className="guided-choice"><button className="button primary" onClick={()=>{setMode('guided');setStepIndex(0)}}>問題専用STEPで理解する</button><button className="button" onClick={()=>setMode('retry')}>もう一度自力で解く</button><button className="button" onClick={revealAnswer}>この1問の答え・解説を見る</button></div></>}
        {mode==='guided'&&<>
          <div className="guided-progress dynamic">{steps.map((s,i)=><button key={s.id} className={i<=stepIndex?'active':''} onClick={()=>setStepIndex(i)}>{i+1}</button>)}</div>
          {dependencies.length>0&&<div className="notice-box dependency-box"><b>前問の結果を使う場合</b><p>自分の前問の値で続けるか、正答値を使ってこの小問の考え方だけ確認するか選べます。</p><div className="actions"><button className={`button ${dependencyMode==='own'?'primary':''}`} onClick={()=>{setDependencyMode('own');updateGuidedProgress(q.id,{dependencyMode:'own'})}}>自分の前問の答えを使う</button><button className={`button ${dependencyMode==='official'?'primary':''}`} onClick={()=>{setDependencyMode('official');updateGuidedProgress(q.id,{dependencyMode:'official'})}}>正答値を使う</button></div>{dependencyMode==='official'&&dependencies.map(d=><p key={d.questionId}><b>{d.questionId}</b> の正答値：<strong>{d.officialValue}</strong></p>)}</div>}
          <div className="guided-step">
            <span className="eyebrow">STEP {stepIndex+1} / {steps.length}</span><h2>{current.title}</h2><p>{current.prompt}</p>
            <textarea value={responses[current.id]||''} onChange={e=>setResponses(v=>({...v,[current.id]:e.target.value}))} placeholder="自分の途中式・考え方を入力" rows={5}/>{currentResponse&&!currentResponseValid&&<p className="muted">このSTEPで必要な数値・式・着眼点をもう少し具体的に入力してください。</p>}
            {hintLevel>=1&&<div className="notice-box"><b>ヒント1</b><p>{current.hint1}</p></div>}
            {hintLevel>=2&&<div className="notice-box"><b>さらにヒント</b><p>{current.hint2}</p></div>}
            {hintLevel>=3&&<div className="answer-reveal compact"><span>このSTEPの確認</span><strong>{current.reveal}</strong></div>}
            <div className="actions">
              {hintLevel<1&&<button className="button" onClick={()=>setHint(1)}>ヒント1</button>}
              {hintLevel>=1&&hintLevel<2&&<button className="button" onClick={()=>setHint(2)}>さらにヒント</button>}
              {hintLevel>=2&&hintLevel<3&&<button className="button" onClick={()=>setHint(3)}>STEPの答え</button>}
              <button className={`button ${stepAssessments[current.id]==='matched'?'primary':''}`} disabled={!currentResponseValid} onClick={()=>assessStep('matched')}>自分でも同じ考えになった</button>
              <button className={`button ${stepAssessments[current.id]==='guided'?'primary':''}`} disabled={hintLevel<1||(!currentResponseValid&&hintLevel<3)} onClick={()=>assessStep('guided')}>ヒント・確認を見て分かった</button>
              <button className={`button ${stepAssessments[current.id]==='unclear'?'primary':''}`} onClick={()=>assessStep('unclear')}>まだ分からない</button>
              {stepIndex<steps.length-1?<button className="button primary" disabled={!stepAssessments[current.id]||stepAssessments[current.id]==='unclear'||(stepAssessments[current.id]==='matched'&&!currentResponseValid)||(stepAssessments[current.id]==='guided'&&hintLevel<3&&!currentResponseValid)} onClick={completeStep}>次のSTEPへ</button>:<button className="button primary" disabled={!stepAssessments[current.id]||stepAssessments[current.id]==='unclear'||(stepAssessments[current.id]==='matched'&&!currentResponseValid)||(stepAssessments[current.id]==='guided'&&hintLevel<3&&!currentResponseValid)} onClick={()=>{completeStep();setMode('retry');setFinalAnswer('');setResult(null)}}>解説を閉じて自力再現へ</button>}
              <button className="button" onClick={revealAnswer}>この1問の答えを見る</button>
            </div>
          </div>
        </>}
        {mode==='retry'&&<div className="guided-step"><span className="eyebrow">REPRODUCTION</span><h2>最初から自力で再現</h2><p>STEP・ヒント・途中結果を隠しました。ここで正解して初めて「再現できた」と記録します。</p><MathAnswerInput value={finalAnswer} onChange={setFinalAnswer} onEnter={()=>checkFinal('retry')} placeholder="この小問の最終答案を入力"/>{result!==null&&<div className={`result ${result?'ok':'ng'}`}><h3>{result?'○ 再現できました':'× まだ不安定です'}</h3><p>{guidedOutcomeLabel(mastery)}</p></div>}<div className="actions"><button className="button primary" disabled={!finalAnswer.trim()} onClick={()=>checkFinal('retry')}>この1問を採点する</button><button className="button" onClick={()=>{setMode('guided');setStepIndex(0)}}>STEPへ戻る</button><button className="button" onClick={revealAnswer}>この1問の答えを見る</button></div>{result&&<div className="actions"><Link className="button primary" to={remedyLink}>類題4問へ</Link></div>}</div>}
        {mode==='answer'&&<div className="guided-step"><span className="eyebrow">ANSWER · THIS QUESTION ONLY</span><h2>この小問の答えと完全解説</h2><div className="answer-reveal"><span>大問{q.major}（{q.subNo}）の正答だけを表示</span><strong>{solution.finalAnswer.answer||q.answer?.answer||'正答データなし'}</strong></div><div className="explanation-flow">{solution.fullExplanation.map((text,i)=><div key={i}><b>{i+1}</b><p>{text}</p></div>)}</div><div className="notice-box"><b>よくある間違い</b><ul>{solution.commonMistakes.map(x=><li key={x}>{x}</li>)}</ul></div><div className="notice-box"><b>この問題で覚えるパターン</b><p>{solution.takeaway.pattern}</p></div><p className="muted">答えを見たこと自体は習得扱いになりません。</p><div className="actions"><button className="button primary" onClick={resetForRetry}>答えを閉じてこの1問を自力再現</button><button className="button" onClick={()=>{setMode('guided');setStepIndex(0)}}>STEPを確認する</button></div></div>}
      </section>
    </div>
  </>
}
