import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import questions from '../data/questions.json'
import { answerPages, examPages, examRole, pointsFor } from '../data/examConfig'
import { classifyRemediationField } from '../data/remediation'
import { createRecordId, loadExamScores, saveAttempt, saveExamScore } from '../storage'
import { currentLearningStep, markYearSolved } from '../learningRoute'
import { getExamAnswer, isExamAnswerCorrect } from '../data/examAnswers'
import { cleanAnswerInput } from '../answer'
import { runExamIntegrityCheck } from '../preflight'
import { createRestorePoint } from '../safetyStorage'
import { canWriteLearningData, notifyWriteBlocked } from '../version'
import type { MajorQuestion } from '../types'

const DRAFT_KEY='waseshibu-math-exam-drafts-v2'
const BASE=import.meta.env.BASE_URL
const causes=['計算ミス','符号ミス','条件読み落とし','知識不足','解法未習得','場合分け不足','答え方の不備']

type AutoStatus='correct'|'wrong'|'unanswered'
type Draft={answers:Record<string,string>;flags:Record<string,boolean>;causes:Record<string,string>;overrides:Record<string,'correct'|'wrong'>;seconds:number;majorIndex:number;phase:'solve'|'mark';updatedAt:string}

function readDraft(year:number):Partial<Draft>{
  try{
    const all=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}'),raw=all[String(year)]||{}
    if(raw.answers)return raw
    return {answers:raw}
  }catch{return {}}
}
function writeDraft(year:number,draft:Draft){
  if(!canWriteLearningData()){notifyWriteBlocked();return}
  try{const all=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');all[String(year)]=draft;localStorage.setItem(DRAFT_KEY,JSON.stringify(all))}catch{/* storage unavailable */}
}
const keyFor=(q:MajorQuestion,no:string)=>`${q.id}-${no}`
const pad=(n:number)=>String(n).padStart(2,'0')
const paperImage=(year:number,page:number)=>`${BASE}exam-pages/${year}/page-${pad(page)}.jpg`
const answerImage=(year:number,page:number)=>`${BASE}exam-answers/${year}/page-${page}.jpg`

export default function PastPapers(){
  const integrity=runExamIntegrityCheck()
  const [params]=useSearchParams()
  const requested=Number(params.get('year')||2024),year=requested>=2019&&requested<=2026?requested:2024
  const majors=useMemo(()=>(questions.questions as MajorQuestion[]).filter(q=>q.year===year).sort((a,b)=>a.major-b.major),[year])
  const initial=readDraft(year),review=params.get('review')==='1'
  const majorParam=Math.max(1,Math.min(5,Number(params.get('major')||1)))
  const [phase,setPhase]=useState<'solve'|'mark'|'result'>(review?'mark':initial.phase||'solve')
  const [majorIndex,setMajorIndex]=useState(review?0:Math.max(0,Number.isInteger(initial.majorIndex)?initial.majorIndex!:majorParam-1))
  const [answers,setAnswers]=useState<Record<string,string>>(initial.answers||{})
  const [flags,setFlags]=useState<Record<string,boolean>>(initial.flags||{})
  const [causeMap,setCauseMap]=useState<Record<string,string>>(initial.causes||{})
  const [overrides,setOverrides]=useState<Record<string,'correct'|'wrong'>>(initial.overrides||{})
  const [seconds,setSeconds]=useState(Number(initial.seconds)||0)
  const [running,setRunning]=useState(!review)
  const [focused,setFocused]=useState<string>('')
  const [answerOpen,setAnswerOpen]=useState(()=>window.innerWidth>700)
  const [warningAccepted,setWarningAccepted]=useState(false)
  const [savedResult,setSavedResult]=useState<{score:number;correct:number;wrong:number;unanswered:number;weak:string[]}|null>(null)
  const inputs=useRef<Record<string,HTMLInputElement|null>>({})
  const q=majors[majorIndex]
  const allSubs=majors.flatMap(m=>m.subquestions.map(s=>({major:m,sub:s,key:keyFor(m,s.no)})))
  const entered=allSubs.filter(x=>(answers[x.key]||'').trim()).length
  const statusFor=(key:string):AutoStatus=>{
    if(overrides[key])return overrides[key]
    if(!(answers[key]||'').trim())return 'unanswered'
    return isExamAnswerCorrect(key,answers[key]||'')?'correct':'wrong'
  }
  const step=currentLearningStep()
  const needsWarning=(year===2025&&step<5)||(year===2026&&step<7)

  useEffect(()=>{if(!running||phase!=='solve')return;const id=window.setInterval(()=>setSeconds(s=>s+1),1000);return()=>window.clearInterval(id)},[running,phase])
  useEffect(()=>{if(phase==='result')return;writeDraft(year,{answers,flags,causes:causeMap,overrides,seconds,majorIndex,phase,updatedAt:new Date().toISOString()})},[year,answers,flags,causeMap,overrides,seconds,majorIndex,phase])
  useEffect(()=>{if(phase!=='solve')return;const id=`exposure-${year}`;if(sessionStorage.getItem(id))return;sessionStorage.setItem(id,'1');saveAttempt({id:createRecordId(id),questionId:id,mode:'multi',topic:`${year}年度 過去問`,status:'deferred',at:new Date().toISOString()})},[year,phase])

  const insert=(text:string)=>{
    const key=focused||keyFor(q,q.subquestions[0].no),input=inputs.current[key],value=answers[key]||'',start=input?.selectionStart??value.length,end=input?.selectionEnd??value.length
    const next=value.slice(0,start)+text+value.slice(end);setAnswers(v=>({...v,[key]:next}))
    const pos=start+text.length-(text.endsWith('()')?1:0);requestAnimationFrame(()=>{input?.focus();input?.setSelectionRange(pos,pos)})
  }
  const formatTime=(value:number)=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`
  const changeMajor=(next:number)=>{setMajorIndex(Math.max(0,Math.min(majors.length-1,next)));window.scrollTo({top:0,behavior:'smooth'})}
  const beginMarking=()=>{setRunning(false);markYearSolved(year);setPhase('mark');setMajorIndex(0);setAnswerOpen(window.innerWidth>700);window.scrollTo({top:0,behavior:'smooth'})}
  const finish=()=>{
    if(!canWriteLearningData()){notifyWriteBlocked();return}
    const graded=allSubs.map(x=>({...x,status:statusFor(x.key)}))
    const score=Math.round(graded.reduce((sum,x)=>sum+(x.status==='correct'?pointsFor(year,x.major.major,x.major.subquestions.length):0),0))
    const weights:Record<string,number>={}
    graded.forEach(x=>{if(x.status==='correct')return;const f=classifyRemediationField(x.sub.topic).title;weights[f]=(weights[f]||0)+(x.status==='wrong'?3:1)})
    const weak=Object.entries(weights).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([x])=>x)
    const result={score,correct:graded.filter(x=>x.status==='correct').length,wrong:graded.filter(x=>x.status==='wrong').length,unanswered:graded.filter(x=>x.status==='unanswered').length,weak}
    const now=new Date().toISOString(),prior=loadExamScores().some(x=>x.year===year&&x.completed!==false)
    saveExamScore({id:createRecordId(`exam-${year}`),year,score:result.score,correctCount:result.correct,wrongCount:result.wrong,unansweredCount:result.unanswered,completed:true,attemptKind:prior?'retake':'first',weakFields:weak,at:now})
    graded.forEach(x=>saveAttempt({id:createRecordId(`exam-${x.key}`),questionId:`exam-${x.key}`,mode:'multi',topic:x.sub.topic,status:x.status==='correct'?'correct':x.status==='unanswered'?'deferred':'wrong',mistakeTag:causeMap[x.key],diagnosis:x.status==='correct'?'correct':'recoverable',answer:answers[x.key]||'',flagged:!!flags[x.key],seconds,at:now}))
    try{const all=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');delete all[String(year)];localStorage.setItem(DRAFT_KEY,JSON.stringify(all))}catch{/* no-op */}
    void createRestorePoint('exam_complete').catch(()=>{/* the saved result remains available for manual export */})
    setSavedResult(result);setPhase('result');window.scrollTo({top:0,behavior:'smooth'})
  }

  if(!integrity.ok)return <section className="card integrity-failed"><span className="eyebrow">SAFETY CHECK FAILED</span><h1>採点データを確認できないため開始を停止しました</h1><p>誤採点を防ぐための安全機能です。</p><ul>{integrity.issues.slice(0,8).map(x=><li key={x}>{x}</li>)}</ul><Link className="button" to="/">ホームへ戻る</Link></section>
  if(needsWarning&&!warningAccepted&&phase==='solve')return <section className="card warning-card"><span className="eyebrow">推奨ルート外の年度</span><h1>{year}年度を先に開きますか？</h1><p>{year===2025?'先に2024年度の弱点補強を終えると、改善を正しく比較できます。':'2026年度は仕上がり確認用です。先に2024・2025年度の診断と補強を終えることを推奨します。'}</p><div className="actions"><Link className="button primary" to="/">推奨ルートへ戻る</Link><button className="button" onClick={()=>setWarningAccepted(true)}>理解して開始する</button></div></section>

  if(phase==='result'&&savedResult)return <><div className="page-head"><div><span className="eyebrow">AUTO SCORING COMPLETE</span><h1>{year}年度の自動採点結果</h1></div></div><section className="grid four result-scores"><article className="card stat"><b>{savedResult.score}</b><span>自動採点</span></article><article className="card stat"><b>{savedResult.correct}</b><span>正解</span></article><article className="card stat"><b>{savedResult.wrong}</b><span>不正解</span></article><article className="card stat"><b>{savedResult.unanswered}</b><span>未回答</span></article></section><section className="card"><span className="eyebrow">TOP 3 WEAKNESSES</span><h2>優先弱点3分野</h2>{savedResult.weak.length?<div className="weak-three">{savedResult.weak.map((x,i)=><article key={x}><strong>{i+1}</strong><div><b>{x}</b><p>過去問の該当問題を解いてから、類題4問で定着させます。</p></div></article>)}</div>:<p>失点分野はありませんでした。</p>}<div className="actions"><Link className="button primary" to={year===2024?'/reinforce?source=2024':year===2025?'/reinforce?source=2025':'/years'}>{year===2026?'残りの年度演習へ':'弱点補強を始める'}</Link><Link className="button" to="/">ホームへ</Link></div></section></>

  return <>
    <div className="exam-compact-head"><div><span className="eyebrow">STEP {phase==='solve'?'解く':'自動採点・確認'}</span><h1>{year}年度｜{examRole(year)}</h1></div><div><b>{phase==='solve'?`入力 ${entered}/${allSubs.length}`:`自動採点 ${allSubs.length}問`}</b><Link to="/years">演習一覧</Link></div></div>
    <div className="major-tabs" aria-label="大問選択">{majors.map((m,i)=><button key={m.id} className={i===majorIndex?'active':''} onClick={()=>changeMajor(i)}>大問{m.major}<small>{m.subquestions.length}小問</small></button>)}</div>
    <div className={`exam-workspace ${answerOpen?'answer-open':''}`}>
      <section className="problem-pane card"><div className="section-head"><div><span className="eyebrow">PROBLEM</span><h2>大問 {q.major}　{q.title}</h2></div><b>{q.major===1?(year===2019?45:40):year===2019&&q.major===2?10:15}点</b></div><div className="exam-images">{(examPages[year]?.[q.major-1]||[]).map(page=><img key={page} src={paperImage(year,page)} alt={`${year}年度 大問${q.major} 問題ページ${page}`} loading="eager" />)}</div></section>
      <aside className={`answer-dock card ${answerOpen?'open':'closed'}`}><button className="answer-dock-toggle" onClick={()=>setAnswerOpen(v=>!v)} aria-expanded={answerOpen}>{phase==='solve'?`解答欄 ${q.subquestions.filter(s=>(answers[keyFor(q,s.no)]||'').trim()).length}/${q.subquestions.length}`:'自動採点結果'}<span>{answerOpen?'閉じる':'開く'}</span></button>{answerOpen&&<>
        {phase==='mark'&&<div className="official-answer"><span className="eyebrow">OFFICIAL ANSWERS</span>{Array.from({length:answerPages[year]||1},(_,i)=><img key={i} src={answerImage(year,i+1)} alt={`${year}年度 公式解答 ${i+1}`} />)}</div>}
        <div className="dock-scroll">{q.subquestions.map(s=>{const key=keyFor(q,s.no),status=statusFor(key),expected=getExamAnswer(key);return <div className={`dock-question auto-${status}`} key={key}><div className="dock-qhead"><b>({s.no})</b><span>{s.topic}</span><button className={flags[key]?'flagged':''} onClick={()=>setFlags(v=>({...v,[key]:!v[key]}))}>△ 迷い</button></div>{phase==='solve'?<input ref={el=>{inputs.current[key]=el}} value={answers[key]||''} maxLength={120} onFocus={()=>setFocused(key)} onChange={e=>setAnswers(v=>({...v,[key]:cleanAnswerInput(e.target.value)}))} placeholder="答えを入力（全角可）" autoCapitalize="off" autoCorrect="off" spellCheck={false}/>:<><div className="answer-compare"><span>自分の答え</span><b>{answers[key]||'未入力'}</b></div><div className={`auto-grade ${status}`}><b>{status==='correct'?'○ 正解':status==='wrong'?'× 不正解':'— 未回答'}</b><span>正答：{expected?.answer||'公式解答を確認'}</span></div><button className="grade-override" onClick={()=>setOverrides(v=>({...v,[key]:status==='correct'?'wrong':'correct'}))}>{status==='correct'?'不正解に修正':'正解に修正'}</button>{status!=='correct'&&<select value={causeMap[key]||''} onChange={e=>setCauseMap(v=>({...v,[key]:e.target.value}))}><option value="">間違えた原因（任意）</option>{causes.map(x=><option key={x}>{x}</option>)}</select>}</>}</div>})}</div>
        {phase==='solve'&&<div className="shared-keypad" aria-label="数式入力補助">{[['分数','/'],['√','√()'],['x²','^2'],['( )','()'],['−','-'],['±','±'],['π','π'],['比',':'],[',',',']].map(([label,text])=><button key={label} onClick={()=>insert(text)}>{label}</button>)}</div>}
        <div className="major-nav"><button className="button" disabled={majorIndex===0} onClick={()=>changeMajor(majorIndex-1)}>← 前</button>{majorIndex<majors.length-1?<button className="button primary" onClick={()=>changeMajor(majorIndex+1)}>次の大問 →</button>:phase==='solve'?<button className="button primary" onClick={beginMarking}>解答を終了して自動採点</button>:<button className="button primary" onClick={finish}>採点結果を保存する</button>}</div>{phase==='mark'&&<p className="dock-note">正誤は自動判定済みです。表記による誤判定だけ修正してください。原因入力は任意です。</p>}
      </>}</aside>
    </div>
    {phase==='solve'&&<div className="floating-timer" aria-label="試験タイマー"><b>{formatTime(seconds)}</b><button onClick={()=>setRunning(v=>!v)}>{running?'停止':'再開'}</button></div>}
  </>
}
