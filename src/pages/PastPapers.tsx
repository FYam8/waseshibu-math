import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import questions from '../data/questions.json'
import { answerPages, examPages, examRole, pointsFor } from '../data/examConfig'
import { classifyRemediationField } from '../data/remediation'
import { createRecordId, loadExamScores, saveAttempt, saveExamScore } from '../storage'
import { currentLearningStep, markYearSolved } from '../learningRoute'
import type { Approach, Diagnosis, MajorQuestion } from '../types'

const DRAFT_KEY='waseshibu-math-exam-drafts-v2'
const BASE=import.meta.env.BASE_URL
const causes=['計算ミス','符号ミス','条件読み落とし','知識不足','解法未習得','場合分け不足','答え方の不備']
const approachOptions:[Approach,string][]=[['immediate','すぐ立った'],['thought','考えて立った'],['none','立たなかった']]
const diagnosisOptions:[Diagnosis,string][]=[['correct','正解'],['recoverable','本来取れた'],['difficult','今は難しい'],['time','時間があれば']]

type Draft={answers:Record<string,string>;approaches:Record<string,Approach>;flags:Record<string,boolean>;diagnoses:Record<string,Diagnosis>;causes:Record<string,string>;seconds:number;majorIndex:number;phase:'solve'|'mark';updatedAt:string}

function readDraft(year:number):Partial<Draft>{
  try{
    const all=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}'),raw=all[String(year)]||{}
    if(raw.answers)return raw
    return {answers:raw}
  }catch{return {}}
}
function writeDraft(year:number,draft:Draft){
  try{const all=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');all[String(year)]=draft;localStorage.setItem(DRAFT_KEY,JSON.stringify(all))}catch{/* storage unavailable */}
}
const keyFor=(q:MajorQuestion,no:string)=>`${q.id}-${no}`
const pad=(n:number)=>String(n).padStart(2,'0')
const paperImage=(year:number,page:number)=>`${BASE}exam-pages/${year}/page-${pad(page)}.jpg`
const answerImage=(year:number,page:number)=>`${BASE}exam-answers/${year}/page-${page}.jpg`

export default function PastPapers(){
  const [params]=useSearchParams()
  const requested=Number(params.get('year')||2024),year=requested>=2019&&requested<=2026?requested:2024
  const majors=useMemo(()=>(questions.questions as MajorQuestion[]).filter(q=>q.year===year).sort((a,b)=>a.major-b.major),[year])
  const initial=readDraft(year),review=params.get('review')==='1'
  const majorParam=Math.max(1,Math.min(5,Number(params.get('major')||1)))
  const [phase,setPhase]=useState<'solve'|'mark'|'result'>(review?'mark':initial.phase||'solve')
  const [majorIndex,setMajorIndex]=useState(review?0:Math.max(0,Number.isInteger(initial.majorIndex)?initial.majorIndex!:majorParam-1))
  const [answers,setAnswers]=useState<Record<string,string>>(initial.answers||{})
  const [approaches,setApproaches]=useState<Record<string,Approach>>(initial.approaches||{})
  const [flags,setFlags]=useState<Record<string,boolean>>(initial.flags||{})
  const [diagnoses,setDiagnoses]=useState<Record<string,Diagnosis>>(initial.diagnoses||{})
  const [causeMap,setCauseMap]=useState<Record<string,string>>(initial.causes||{})
  const [seconds,setSeconds]=useState(Number(initial.seconds)||0)
  const [running,setRunning]=useState(!review)
  const [focused,setFocused]=useState<string>('')
  const [answerOpen,setAnswerOpen]=useState(()=>window.innerWidth>700)
  const [warningAccepted,setWarningAccepted]=useState(false)
  const [savedResult,setSavedResult]=useState<{score:number;repro:number;recover:number;time:number;weak:string[]}|null>(null)
  const inputs=useRef<Record<string,HTMLInputElement|null>>({})
  const q=majors[majorIndex]
  const allSubs=majors.flatMap(m=>m.subquestions.map(s=>({major:m,sub:s,key:keyFor(m,s.no)})))
  const entered=allSubs.filter(x=>(answers[x.key]||'').trim()).length
  const diagnosed=allSubs.filter(x=>diagnoses[x.key]).length
  const missingCauses=allSubs.filter(x=>diagnoses[x.key]&&diagnoses[x.key]!=='correct'&&!causeMap[x.key]).length
  const readyToSave=diagnosed===allSubs.length&&missingCauses===0
  const step=currentLearningStep()
  const needsWarning=(year===2025&&step<5)||(year===2026&&step<7)

  useEffect(()=>{if(!running||phase!=='solve')return;const id=window.setInterval(()=>setSeconds(s=>s+1),1000);return()=>window.clearInterval(id)},[running,phase])
  useEffect(()=>{if(phase==='result')return;writeDraft(year,{answers,approaches,flags,diagnoses,causes:causeMap,seconds,majorIndex,phase,updatedAt:new Date().toISOString()})},[year,answers,approaches,flags,diagnoses,causeMap,seconds,majorIndex,phase])
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
    if(!readyToSave)return
    const total=(kind:'score'|'repro'|'recover'|'time')=>Math.round(allSubs.reduce((sum,x)=>{
      const d=diagnoses[x.key],p=pointsFor(year,x.major.major,x.major.subquestions.length)
      if(kind==='score')return sum+(d==='correct'?p:0)
      if(kind==='repro')return sum+(d==='correct'&&approaches[x.key]!=='none'?p:0)
      if(kind==='recover')return sum+(d==='recoverable'?p:0)
      return sum+(d==='time'?p:0)
    },0))
    const weights:Record<string,number>={}
    allSubs.forEach(x=>{const d=diagnoses[x.key];if(d==='correct')return;const f=classifyRemediationField(x.sub.topic).title;weights[f]=(weights[f]||0)+(d==='recoverable'?4:d==='time'?3:2)})
    const weak=Object.entries(weights).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([x])=>x)
    const result={score:total('score'),repro:total('repro'),recover:total('recover'),time:total('time'),weak}
    const now=new Date().toISOString(),prior=loadExamScores().some(x=>x.year===year&&x.completed!==false)
    saveExamScore({id:createRecordId(`exam-${year}`),year,score:result.score,reproducibleScore:result.repro,recoverableScore:result.recover,timeCandidateScore:result.time,completed:true,attemptKind:prior?'retake':'first',weakFields:weak,at:now})
    allSubs.forEach(x=>saveAttempt({id:createRecordId(`exam-${x.key}`),questionId:`exam-${x.key}`,mode:'multi',topic:x.sub.topic,status:diagnoses[x.key]==='correct'?'correct':'wrong',mistakeTag:causeMap[x.key],approach:approaches[x.key]||'none',diagnosis:diagnoses[x.key],answer:answers[x.key]||'',flagged:!!flags[x.key],seconds,at:now}))
    try{const all=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');delete all[String(year)];localStorage.setItem(DRAFT_KEY,JSON.stringify(all))}catch{/* no-op */}
    setSavedResult(result);setPhase('result');window.scrollTo({top:0,behavior:'smooth'})
  }

  if(needsWarning&&!warningAccepted&&phase==='solve')return <section className="card warning-card"><span className="eyebrow">推奨ルート外の年度</span><h1>{year}年度を先に開きますか？</h1><p>{year===2025?'先に2024年度の弱点補強を終えると、改善を正しく比較できます。':'2026年度は仕上がり確認用です。先に2024・2025年度の診断と補強を終えることを推奨します。'}</p><div className="actions"><Link className="button primary" to="/">推奨ルートへ戻る</Link><button className="button" onClick={()=>setWarningAccepted(true)}>理解して開始する</button></div></section>

  if(phase==='result'&&savedResult)return <><div className="page-head"><div><span className="eyebrow">DIAGNOSIS COMPLETE</span><h1>{year}年度の診断結果</h1></div></div><section className="grid four result-scores"><article className="card stat"><b>{savedResult.score}</b><span>実得点</span></article><article className="card stat"><b>{savedResult.repro}</b><span>再現可能得点</span></article><article className="card stat"><b>+{savedResult.recover}</b><span>回収可能得点</span></article><article className="card stat"><b>{savedResult.time}</b><span>時間候補</span></article></section><section className="card"><span className="eyebrow">TOP 3 WEAKNESSES</span><h2>優先弱点3分野</h2>{savedResult.weak.length?<div className="weak-three">{savedResult.weak.map((x,i)=><article key={x}><strong>{i+1}</strong><div><b>{x}</b><p>過去問の該当問題を解いてから、類題4問で定着させます。</p></div></article>)}</div>:<p>失点分野はありませんでした。</p>}<div className="actions"><Link className="button primary" to={year===2024?'/reinforce?source=2024':year===2025?'/reinforce?source=2025':'/years'}>{year===2026?'残りの年度演習へ':'弱点補強を始める'}</Link><Link className="button" to="/">ホームへ</Link></div></section></>

  return <>
    <div className="exam-compact-head"><div><span className="eyebrow">STEP {phase==='solve'?'解く':'採点・原因'}</span><h1>{year}年度｜{examRole(year)}</h1></div><div><b>{phase==='solve'?`入力 ${entered}/${allSubs.length}`:`診断 ${diagnosed}/${allSubs.length}`}</b><Link to="/years">演習一覧</Link></div></div>
    <div className="major-tabs" aria-label="大問選択">{majors.map((m,i)=><button key={m.id} className={i===majorIndex?'active':''} onClick={()=>changeMajor(i)}>大問{m.major}<small>{m.subquestions.length}小問</small></button>)}</div>
    <div className={`exam-workspace ${answerOpen?'answer-open':''}`}>
      <section className="problem-pane card"><div className="section-head"><div><span className="eyebrow">PROBLEM</span><h2>大問 {q.major}　{q.title}</h2></div><b>{q.major===1?(year===2019?45:40):year===2019&&q.major===2?10:15}点</b></div><div className="exam-images">{(examPages[year]?.[q.major-1]||[]).map(page=><img key={page} src={paperImage(year,page)} alt={`${year}年度 大問${q.major} 問題ページ${page}`} loading="eager" />)}</div></section>
      <aside className={`answer-dock card ${answerOpen?'open':'closed'}`}><button className="answer-dock-toggle" onClick={()=>setAnswerOpen(v=>!v)} aria-expanded={answerOpen}>{phase==='solve'?`解答欄 ${q.subquestions.filter(s=>(answers[keyFor(q,s.no)]||'').trim()).length}/${q.subquestions.length}`:'解答・正答・診断'}<span>{answerOpen?'閉じる':'開く'}</span></button>{answerOpen&&<>
        {phase==='mark'&&<div className="official-answer"><span className="eyebrow">OFFICIAL ANSWERS</span>{Array.from({length:answerPages[year]||1},(_,i)=><img key={i} src={answerImage(year,i+1)} alt={`${year}年度 公式解答 ${i+1}`} />)}</div>}
        <div className="dock-scroll">{q.subquestions.map(s=>{const key=keyFor(q,s.no),d=diagnoses[key];return <div className="dock-question" key={key}><div className="dock-qhead"><b>({s.no})</b><span>{s.topic}</span><button className={flags[key]?'flagged':''} onClick={()=>setFlags(v=>({...v,[key]:!v[key]}))}>△ 迷い</button></div>{phase==='solve'?<><input ref={el=>{inputs.current[key]=el}} value={answers[key]||''} onFocus={()=>setFocused(key)} onChange={e=>setAnswers(v=>({...v,[key]:e.target.value}))} placeholder="答えを入力" /><div className="approach-buttons">{approachOptions.map(([value,label])=><button key={value} className={approaches[key]===value?'selected':''} onClick={()=>setApproaches(v=>({...v,[key]:value}))}>{label}</button>)}</div></>:<><div className="answer-compare"><span>自分の答え</span><b>{answers[key]||'未入力'}</b></div><div className="diagnosis-buttons">{diagnosisOptions.map(([value,label])=><button key={value} className={d===value?'selected':''} onClick={()=>setDiagnoses(v=>({...v,[key]:value}))}>{label}</button>)}</div>{d&&d!=='correct'&&<select value={causeMap[key]||''} onChange={e=>setCauseMap(v=>({...v,[key]:e.target.value}))}><option value="">原因を選ぶ（任意）</option>{causes.map(x=><option key={x}>{x}</option>)}</select>}</>}</div>})}</div>
        {phase==='solve'&&<div className="shared-keypad" aria-label="数式入力補助">{[['分数','/'],['√','√()'],['x²','^2'],['( )','()'],['−','-'],['±','±'],['π','π'],['比',':'],[',',',']].map(([label,text])=><button key={label} onClick={()=>insert(text)}>{label}</button>)}</div>}
        <div className="major-nav"><button className="button" disabled={majorIndex===0} onClick={()=>changeMajor(majorIndex-1)}>← 前</button>{majorIndex<majors.length-1?<button className="button primary" onClick={()=>changeMajor(majorIndex+1)}>次の大問 →</button>:phase==='solve'?<button className="button primary" onClick={beginMarking}>解答を終了して採点</button>:<button className="button primary" disabled={!readyToSave} onClick={finish}>診断を保存する</button>}</div>{phase==='mark'&&!readyToSave&&<p className="dock-note">未分類 {allSubs.length-diagnosed}問・原因未選択 {missingCauses}問。すべて入力すると保存できます。</p>}
      </>}</aside>
    </div>
    {phase==='solve'&&<div className="floating-timer" aria-label="試験タイマー"><b>{formatTime(seconds)}</b><button onClick={()=>setRunning(v=>!v)}>{running?'停止':'再開'}</button></div>}
  </>
}
