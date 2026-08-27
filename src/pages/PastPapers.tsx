import { useEffect, useMemo, useState } from 'react'
import questions from '../data/questions.json'
import type { AttemptStatus, MajorQuestion } from '../types'
import { createRecordId, saveAttempt, saveExamScore } from '../storage'

const years=[2026,2025,2024,2023,2022,2021,2020,2019]
const scoreMax=(year:number)=>year===2019?[45,10,15,15,15]:[40,15,15,15,15]
const tags=['知識不足','解法未習得','読み落とし','計算ミス','符号ミス','場合分け不足','時間不足','答え方の不備']
type Mark={status:AttemptStatus,tag:string}

export default function PastPapers(){
  const [year,setYear]=useState(2026),[seconds,setSeconds]=useState(0),[running,setRunning]=useState(false)
  const [scores,setScores]=useState(['','','','','']),[marks,setMarks]=useState<Record<string,Mark>>({}),[saved,setSaved]=useState(false)
  const max=scoreMax(year),majors=(questions.questions as MajorQuestion[]).filter(x=>x.year===year)
  const total=useMemo(()=>scores.reduce((n,x)=>n+(Number(x)||0),0),[scores])
  useEffect(()=>{if(!running)return;const timer=setInterval(()=>setSeconds(v=>v+1),1000);return()=>clearInterval(timer)},[running])
  const chooseYear=(y:number)=>{setYear(y);setSeconds(0);setRunning(false);setScores(['','','','','']);setMarks({});setSaved(false)}
  const setScore=(i:number,value:string)=>{const n=value===''?'':String(Math.min(max[i],Math.max(0,Number(value)||0)));setScores(v=>v.map((x,j)=>j===i?n:x));setSaved(false)}
  const mark=(key:string,status:AttemptStatus)=>setMarks(v=>({...v,[key]:{status,tag:v[key]?.tag||'解法未習得'}}))
  const setTag=(key:string,tag:string)=>setMarks(v=>({...v,[key]:{status:v[key]?.status||'wrong',tag}}))
  const save=()=>{
    saveExamScore({id:createRecordId(`past-paper-${year}`),year,score:total,at:new Date().toISOString()})
    for(const q of majors)for(const sub of q.subquestions){const key=`${q.id}-${sub.no}`,value=marks[key];if(!value)continue;saveAttempt({id:createRecordId(`paper-${key}`),questionId:`paper-${key}`,mode:q.major===1?'q1':'multi',topic:sub.topic,status:value.status,mistakeTag:value.status==='correct'?undefined:value.tag,seconds,at:new Date().toISOString()})}
    setSaved(true)
  }
  const fmt=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  return <>
    <div className="page-head"><div><span className="eyebrow">PRINTED PAST PAPER LOG</span><h1>紙の過去問を採点・分析</h1></div><select value={year} onChange={e=>chooseYear(Number(e.target.value))}>{years.map(y=><option key={y}>{y}年度</option>)}</select></div>
    <section className="card paper-controls"><div><b>紙の問題冊子を用意して開始</b><p className="muted">問題は紙で解き、この画面では時間と結果だけを記録します。</p></div><div className="paper-timer"><b>{fmt(seconds)}</b><button className="button primary" onClick={()=>setRunning(v=>!v)}>{running?'一時停止':'計測開始'}</button><button className="button" onClick={()=>{setRunning(false);setSeconds(0)}}>リセット</button></div></section>
    <section className="card pass-route"><h2>{year}年度・解く順番</h2><div className="route-steps"><div><b>① 大問1</b><span>{max[0]}点中30〜{year===2019?'40':'35'}点を確保</span></div><div><b>② 大問2〜5の（1）</b><span>方針が立つ問題から回収</span></div><div><b>③ （2）→（3）</b><span>70〜75点分を追加</span></div><div><b>④ 見直し</b><span>符号・単位・最簡形</span></div></div></section>
    <section className="card"><div className="section-head"><div><span className="eyebrow">QUESTION-BY-QUESTION</span><h2>小問ごとの結果</h2></div><b>{Object.keys(marks).length}問登録</b></div><p className="muted">○・×・後回しを選び、×と後回しには原因を付けます。保存後「間違い直し」に自動で並びます。</p>
      <div className="paper-mark-list">{majors.map(q=><div className="paper-major" key={q.id}><h3>大問{q.major}　{q.title}</h3>{q.subquestions.map(sub=>{const key=`${q.id}-${sub.no}`,value=marks[key];return <div className="paper-sub" key={key}><div><b>({sub.no})</b><span>{sub.topic}</span></div><div className="mark-buttons"><button className={value?.status==='correct'?'selected ok':''} onClick={()=>mark(key,'correct')}>○</button><button className={value?.status==='wrong'?'selected ng':''} onClick={()=>mark(key,'wrong')}>×</button><button className={value?.status==='deferred'?'selected defer':''} onClick={()=>mark(key,'deferred')}>後回し</button></div>{value&&value.status!=='correct'?<select value={value.tag} onChange={e=>setTag(key,e.target.value)}>{tags.map(t=><option key={t}>{t}</option>)}</select>:<span/>}</div>})}</div>)}</div>
    </section>
    <section className="card"><div className="section-head"><div><span className="eyebrow">SELF SCORING</span><h2>大問別得点</h2></div><strong className="paper-total">{total}/100</strong></div><div className="major-score-grid">{max.map((m,i)=><label key={i}><span>大問{i+1}（{m}点）</span><input inputMode="numeric" value={scores[i]} onChange={e=>setScore(i,e.target.value)} placeholder="0"/></label>)}</div><div className="actions"><button className="button primary" onClick={save}>得点と小問結果を保存</button><a className="button" href="#/mistakes">間違い直しへ</a></div>{saved&&<p className="result ok">保存しました。間違えた小問は「間違い直し」に登録されています。</p>}</section>
  </>
}
