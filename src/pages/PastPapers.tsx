import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.json'
import type { AttemptStatus, MajorQuestion } from '../types'
import { createRecordId, saveAttempt, saveExamScore } from '../storage'

const years=[2026,2025,2024,2023,2022,2021,2020,2019]
const tags=['知識不足','解法未習得','読み落とし','計算ミス','符号ミス','場合分け不足','時間不足','答え方の不備']
const keypad=['/','√()','^2','()','-','±','π',':',',']
type Mark={status:AttemptStatus,tag:string}
type Phase='solve'|'mark'

const DRAFT_KEY='waseshibu-math-past-paper-drafts'
const loadDrafts=():Record<string,Record<string,string>>=>{
  try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')}catch{return {}}
}

export default function PastPapers(){
  const [year,setYear]=useState(2026),[seconds,setSeconds]=useState(0),[running,setRunning]=useState(false)
  const [phase,setPhase]=useState<Phase>('solve'),[marks,setMarks]=useState<Record<string,Mark>>({}),[saved,setSaved]=useState(false)
  const [drafts,setDrafts]=useState(loadDrafts),[activeKey,setActiveKey]=useState('')
  const majors=(questions.questions as MajorQuestion[]).filter(x=>x.year===year)
  const subquestionCount=majors.reduce((sum,q)=>sum+q.subquestions.length,0)
  const markedCount=Object.keys(marks).length
  const total=useMemo(()=>Object.values(marks).filter(x=>x.status==='correct').length*5,[marks])
  const yearAnswers=drafts[String(year)]||{}
  const problemUrl=`./past-papers/${year}_数学_問題.pdf`
  const answerUrl=`./past-papers/${year}_数学_解答.pdf`

  useEffect(()=>{if(!running)return;const timer=setInterval(()=>setSeconds(v=>v+1),1000);return()=>clearInterval(timer)},[running])
  const chooseYear=(y:number)=>{setYear(y);setSeconds(0);setRunning(false);setPhase('solve');setMarks({});setSaved(false);setActiveKey('')}
  const setAnswer=(key:string,value:string)=>{
    setDrafts(current=>{
      const next={...current,[String(year)]:{...(current[String(year)]||{}),[key]:value}}
      localStorage.setItem(DRAFT_KEY,JSON.stringify(next))
      return next
    })
  }
  const insert=(text:string)=>{
    if(!activeKey)return
    const current=yearAnswers[activeKey]||''
    const next=current+text
    setAnswer(activeKey,text.endsWith('()')?`${current}${text.slice(0,-1)}`:next)
  }
  const mark=(key:string,status:AttemptStatus)=>setMarks(v=>({...v,[key]:{status,tag:v[key]?.tag||'解法未習得'}}))
  const setTag=(key:string,tag:string)=>setMarks(v=>({...v,[key]:{status:v[key]?.status||'wrong',tag}}))
  const beginMarking=()=>{setRunning(false);setPhase('mark');window.scrollTo({top:0,behavior:'smooth'})}
  const save=()=>{
    saveExamScore({id:createRecordId(`past-paper-${year}`),year,score:total,at:new Date().toISOString()})
    for(const q of majors)for(const sub of q.subquestions){
      const key=`${q.id}-${sub.no}`,value=marks[key]
      if(!value)continue
      saveAttempt({id:createRecordId(`paper-${key}`),questionId:`paper-${key}`,mode:q.major===1?'q1':'multi',topic:sub.topic,status:value.status,mistakeTag:value.status==='correct'?undefined:value.tag,seconds,at:new Date().toISOString()})
    }
    setSaved(true)
  }
  const clearDraft=()=>{
    setDrafts(current=>{
      const next={...current};delete next[String(year)];localStorage.setItem(DRAFT_KEY,JSON.stringify(next));return next
    })
    setMarks({});setPhase('solve');setSaved(false);setActiveKey('')
  }
  const fmt=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return <>
    <div className="page-head"><div><span className="eyebrow">2019–2026 ACTUAL PAST PAPERS</span><h1>過去問をアプリで解く</h1><p className="muted">実際の問題冊子を表示し、解答入力から答え合わせまでこの画面で進めます。</p></div><select value={year} onChange={e=>chooseYear(Number(e.target.value))}>{years.map(y=><option key={y}>{y}年度</option>)}</select></div>

    <section className="card paper-controls"><div><b>{year}年度・{subquestionCount}小問</b><p className="muted">1小問5点。解答は端末内へ自動保存されます。</p></div><div className="paper-timer"><b>{fmt(seconds)}</b><button className="button primary" onClick={()=>setRunning(v=>!v)}>{running?'一時停止':'計測開始'}</button><button className="button" onClick={()=>{setRunning(false);setSeconds(0)}}>時間リセット</button></div></section>

    <section className="card workflow-strip"><div className={phase==='solve'?'current':'done'}><b>1</b><span>問題を解く</span></div><div className={phase==='mark'?'current':''}><b>2</b><span>公式解答で採点</span></div><div><b>3</b><span>間違いの類題4問</span></div></section>

    {phase==='solve'?<>
      <section className="card paper-viewer"><div className="section-head"><div><span className="eyebrow">ORIGINAL QUESTION BOOKLET</span><h2>実際の問題冊子</h2></div><a className="button" href={problemUrl} target="_blank" rel="noreferrer">別画面で開く</a></div><iframe src={problemUrl} title={`${year}年度 数学問題冊子`}/><p className="pdf-fallback">表示できない場合は「別画面で開く」を使ってください。</p></section>

      <section className="card answer-sheet"><div className="section-head"><div><span className="eyebrow">ANSWER SHEET</span><h2>解答を入力</h2></div><b>{Object.values(yearAnswers).filter(Boolean).length}/{subquestionCount} 入力</b></div><p className="muted">図や途中式は紙に書き、最終答案を入力してください。入力欄を選ぶと下の数式ボタンが使えます。</p>
        <div className="shared-keypad">{keypad.map(k=><button type="button" key={k} onClick={()=>insert(k)} disabled={!activeKey}>{k}</button>)}<button type="button" onClick={()=>activeKey&&setAnswer(activeKey,'')} disabled={!activeKey}>クリア</button></div>
        <div className="paper-answer-list">{majors.map(q=><div className="paper-major" key={q.id}><h3>大問{q.major}　{q.title}</h3>{q.subquestions.map(sub=>{const key=`${q.id}-${sub.no}`;return <label className="paper-answer" key={key}><span>({sub.no})</span><input value={yearAnswers[key]||''} onFocus={()=>setActiveKey(key)} onChange={e=>setAnswer(key,e.target.value)} placeholder="答え" autoCapitalize="off" autoCorrect="off" spellCheck={false}/><small>{sub.topic}</small></label>})}</div>)}</div>
        <div className="actions"><button className="button primary" onClick={beginMarking}>解き終わったので答え合わせへ</button><button className="button danger" onClick={clearDraft}>この年度の入力を消す</button></div>
      </section>
    </>:<>
      <section className="card paper-viewer"><div className="section-head"><div><span className="eyebrow">OFFICIAL ANSWER SHEET</span><h2>公式解答で答え合わせ</h2></div><a className="button" href={answerUrl} target="_blank" rel="noreferrer">別画面で開く</a></div><iframe src={answerUrl} title={`${year}年度 数学模範解答`}/><p className="pdf-fallback">問題を見直すときは、下の「問題へ戻る」を使えます。</p></section>

      <section className="card"><div className="section-head"><div><span className="eyebrow">QUESTION-BY-QUESTION</span><h2>小問ごとに採点</h2></div><b>{markedCount}/{subquestionCount}問採点</b></div><p className="muted">入力した答えと公式解答を比べて、○・×・後回しを選んでください。×と後回しは18分野の類題へつながります。</p>
        <div className="paper-mark-list">{majors.map(q=><div className="paper-major" key={q.id}><h3>大問{q.major}　{q.title}</h3>{q.subquestions.map(sub=>{const key=`${q.id}-${sub.no}`,value=marks[key];return <div className="paper-sub" key={key}><div><b>({sub.no})</b><span>{yearAnswers[key]||'未入力'}</span><small>{sub.topic}</small></div><div className="mark-buttons"><button className={value?.status==='correct'?'selected ok':''} onClick={()=>mark(key,'correct')}>○</button><button className={value?.status==='wrong'?'selected ng':''} onClick={()=>mark(key,'wrong')}>×</button><button className={value?.status==='deferred'?'selected defer':''} onClick={()=>mark(key,'deferred')}>後回し</button></div>{value&&value.status!=='correct'?<select value={value.tag} onChange={e=>setTag(key,e.target.value)}>{tags.map(t=><option key={t}>{t}</option>)}</select>:<span/>}</div>})}</div>)}</div>
      </section>

      <section className="card"><div className="section-head"><div><span className="eyebrow">RESULT</span><h2>採点結果</h2></div><strong className="paper-total">{total}/100</strong></div><p className="muted">採点済み{markedCount}問／全{subquestionCount}問。未採点は0点として表示しています。</p><div className="actions"><button className="button primary" onClick={save} disabled={markedCount!==subquestionCount}>結果を保存して類題へ</button><button className="button" onClick={()=>setPhase('solve')}>問題へ戻る</button><Link className="button" to="/mistakes">間違い直しを見る</Link></div>{markedCount!==subquestionCount&&<p className="notice-box">全小問を○・×・後回しのいずれかで採点すると保存できます。</p>}{saved&&<p className="result ok">保存しました。「間違い直し」から、間違えた分野の類題4問へ進めます。</p>}</section>
    </>}
  </>
}
