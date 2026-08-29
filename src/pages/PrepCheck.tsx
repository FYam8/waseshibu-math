import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MathAnswerInput from '../components/MathAnswerInput'
import { isAcceptedAnswer } from '../answer'
import { loadPrepState, prepQuestions, runExamIntegrityCheck, savePrepState } from '../preflight'

export default function PrepCheck(){
  const navigate=useNavigate(),integrity=runExamIntegrityCheck()
  const [state,setState]=useState(loadPrepState()),[answer,setAnswer]=useState(()=>loadPrepState().answers[prepQuestions[loadPrepState().index].id]||''),[result,setResult]=useState<boolean|null>(null)
  const q=prepQuestions[state.index],tries=state.tries[q.id]||0
  const persist=(next:typeof state)=>{setState(next);savePrepState(next)}
  const submit=()=>{
    if(!answer.trim()||result===true)return
    const correct=isAcceptedAnswer(answer,q.answer,q.acceptedAnswers),next={...state,answers:{...state.answers,[q.id]:answer},tries:{...state.tries,[q.id]:tries+1}}
    persist(next);setResult(correct)
  }
  const next=()=>{
    if(state.index===prepQuestions.length-1){persist({...state,answers:{...state.answers,[q.id]:answer},completed:true,skipped:false});navigate('/past-papers?year=2024');return}
    const index=state.index+1,nextState={...state,index};persist(nextState);setAnswer(nextState.answers[prepQuestions[index].id]||'');setResult(null)
  }
  const skip=()=>{persist({...state,skipped:true});navigate('/past-papers?year=2024')}
  if(!integrity.ok)return <section className="card integrity-failed"><span className="eyebrow">SAFETY CHECK FAILED</span><h1>採点データを確認できませんでした</h1><p>誤採点を防ぐため、過去問の開始を停止しています。</p><ul>{integrity.issues.slice(0,8).map(x=><li key={x}>{x}</li>)}</ul><Link className="button" to="/">ホームへ戻る</Link></section>
  if(state.completed)return <section className="card prep-complete"><span className="eyebrow">READY</span><h1>入力・採点チェックは完了済みです</h1><p>全160小問の正答データと、2024年度全20小問の構成も確認できています。</p><div className="actions"><Link className="button primary" to="/past-papers?year=2024">2024年度を始める</Link><button className="button" onClick={()=>{const reset={...state,index:0,answers:{},tries:{},completed:false,skipped:false};persist(reset);setAnswer('');setResult(null)}}>5問をもう一度</button></div></section>
  return <>
    <div className="page-head"><div><span className="eyebrow">PREPARATION · {state.index+1}/5</span><h1>入力・自動採点チェック</h1><p className="muted">過去問の得点には含まれません。入力方法を確認しながら、基本事項を5問だけ復習します。</p></div><span className="integrity-ok">✓ 採点データ確認済み<br/><small>全160問・2024年度20問</small></span></div>
    <section className="card prep-card"><div className="prep-progress">{prepQuestions.map((_,i)=><span key={i} className={i<state.index?'done':i===state.index?'active':''}>{i<state.index?'✓':i+1}</span>)}</div><span className="eyebrow">QUESTION {state.index+1}</span><h2>{q.prompt}</h2><MathAnswerInput value={answer} onChange={value=>{setAnswer(value);persist({...state,answers:{...state.answers,[q.id]:value}});if(result!==null)setResult(null)}} onEnter={submit} autoFocus placeholder="答えを入力（全角可）" />
      {result===false&&<div className="prep-feedback wrong"><b>もう一度考えてみましょう</b><p>{tries>=2?q.explanation:q.hint}</p></div>}
      {result===true&&<div className="prep-feedback correct"><b>○ 正解</b><p>{q.explanation}</p></div>}
      <div className="actions">{result===true?<button className="button primary" onClick={next}>{state.index===4?'完了して2024年度へ':'次の問題へ'}</button>:<button className="button primary" disabled={!answer.trim()} onClick={submit}>自動採点する</button>}<Link className="button" to="/">途中保存してホームへ</Link></div>
    </section>
    <section className="notice-box prep-skip"><div><b>すぐ過去問を始めたい場合</b><p>内部の採点データ検査は完了しているため、この5問は後回しにできます。</p></div><button className="button" onClick={skip}>5問を後回しにして2024年度へ</button></section>
  </>
}
