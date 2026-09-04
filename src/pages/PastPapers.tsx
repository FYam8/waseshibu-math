import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import questions from '../data/questions.json'
import { examPages, examRole, pointsFor } from '../data/examConfig'
import ExamMarkReview from '../components/ExamMarkReview'
import { createRecordId, loadExamScores, loadPreferences, saveAttempt, saveExamScore } from '../storage'
import { REQUIRED_MAIN_YEAR_SEQUENCE, markYearSolved, nextLearningAction, nextRequiredStageYear, requiredYearPurpose, yearExposureState } from '../learningRoute'
import { isExamAnswerCorrect } from '../data/examAnswers'
import { cleanAnswerInput } from '../answer'
import { runExamIntegrityCheck } from '../preflight'
import { createRestorePoint } from '../safetyStorage'
import { canWriteLearningData, notifyWriteBlocked } from '../version'
import { buildTargetStrategy, gradeInTarget, rankWeakFields, type ExamTargetStrategy, type StrategyItem } from '../targetStrategy'
import type { MajorQuestion } from '../types'

const DRAFT_KEY='waseshibu-math-exam-drafts-v2'
const BASE=import.meta.env.BASE_URL

type AutoStatus='correct'|'wrong'|'unanswered'
type Draft={answers:Record<string,string>;flags:Record<string,boolean>;causes:Record<string,string>;overrides:Record<string,'correct'|'wrong'>;seconds:number;questionSeconds?:Record<string,number>;majorIndex:number;phase:'solve'|'mark';updatedAt:string;firstLookEligible?:boolean}
type SavedResult={score:number;correct:number;wrong:number;unanswered:number;weak:string[];strategy:ExamTargetStrategy;wrongItems:StrategyItem[]}

function readDraft(year:number):Partial<Draft>{
  try{
    const all=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}'),raw=all[String(year)]
    if(!raw)return {}
    if(raw.answers)return raw
    // v1互換: 年度キー直下に answers のRecordだけを保存していた旧ドラフト。
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

export default function PastPapers(){
  const integrity=runExamIntegrityCheck()
  const [params]=useSearchParams()
  const requested=Number(params.get('year')||2024),year=requested>=2019&&requested<=2026?requested:2024
  const majors=useMemo(()=>(questions.questions as MajorQuestion[]).filter(q=>q.year===year).sort((a,b)=>a.major-b.major),[year])
  const initial=readDraft(year),review=params.get('review')==='1'
  const hasPriorCompleted=loadExamScores().some(x=>x.year===year&&x.completed!==false)
  const inferredFirstLook=!hasPriorCompleted&&(initial.firstLookEligible??(Object.keys(initial).length>0||yearExposureState(year)==='untouched'))
  const majorParam=Math.max(1,Math.min(5,Number(params.get('major')||1)))
  const [phase,setPhase]=useState<'solve'|'mark'|'result'>(review?'mark':initial.phase||'solve')
  const [majorIndex,setMajorIndex]=useState(review?0:Math.max(0,Number.isInteger(initial.majorIndex)?initial.majorIndex!:majorParam-1))
  const [answers,setAnswers]=useState<Record<string,string>>(initial.answers||{})
  const [flags,setFlags]=useState<Record<string,boolean>>(initial.flags||{})
  const [causeMap,setCauseMap]=useState<Record<string,string>>(initial.causes||{})
  const [overrides,setOverrides]=useState<Record<string,'correct'|'wrong'>>(initial.overrides||{})
  const [seconds,setSeconds]=useState(Number(initial.seconds)||0)
  const [questionSeconds,setQuestionSeconds]=useState<Record<string,number>>(initial.questionSeconds||{})
  const [firstLookEligible]=useState(inferredFirstLook)
  const [running,setRunning]=useState(!review)
  const [focused,setFocused]=useState<string>('')
  const [answerOpen,setAnswerOpen]=useState(()=>window.innerWidth>700)
  const [warningAccepted,setWarningAccepted]=useState(false)
  const [savedResult,setSavedResult]=useState<SavedResult|null>(null)
  const inputs=useRef<Record<string,HTMLInputElement|null>>({})
  const focusedInputKey=useRef<string>('')
  const q=majors[majorIndex]
  const allSubs=majors.flatMap(m=>m.subquestions.map(s=>({major:m,sub:s,key:keyFor(m,s.no)})))
  const entered=allSubs.filter(x=>(answers[x.key]||'').trim()).length
  const statusFor=(key:string):AutoStatus=>{
    if(overrides[key])return overrides[key]
    if(!(answers[key]||'').trim())return 'unanswered'
    return isExamAnswerCorrect(key,answers[key]||'')?'correct':'wrong'
  }
  const activeRequiredYear=nextRequiredStageYear()
  const requestedStage=REQUIRED_MAIN_YEAR_SEQUENCE.indexOf(year as (typeof REQUIRED_MAIN_YEAR_SEQUENCE)[number])
  const activeStage=activeRequiredYear===null?-1:REQUIRED_MAIN_YEAR_SEQUENCE.indexOf(activeRequiredYear)
  const needsWarning=requestedStage>=0&&activeStage>=0&&requestedStage>activeStage

  useEffect(()=>{if(!running||phase!=='solve')return;const id=window.setInterval(()=>{setSeconds(s=>s+1);if(focused)setQuestionSeconds(v=>({...v,[focused]:(v[focused]||0)+1}))},1000);return()=>window.clearInterval(id)},[running,phase,focused])
  useEffect(()=>{if(phase==='result'||(needsWarning&&!warningAccepted))return;writeDraft(year,{answers,flags,causes:causeMap,overrides,seconds,questionSeconds,majorIndex,phase:phase==='mark'?'mark':'solve',updatedAt:new Date().toISOString(),firstLookEligible})},[year,answers,flags,causeMap,overrides,seconds,questionSeconds,majorIndex,phase,firstLookEligible,needsWarning,warningAccepted])
  useEffect(()=>{if(phase!=='solve'||(needsWarning&&!warningAccepted))return;const id=`exposure-${year}`;if(sessionStorage.getItem(id))return;sessionStorage.setItem(id,'1');saveAttempt({id:createRecordId(id),questionId:id,mode:'multi',topic:`${year}年度 過去問`,status:'deferred',at:new Date().toISOString()})},[year,phase,needsWarning,warningAccepted])

  const insert=(text:string)=>{
    const fallbackKey=keyFor(q,q.subquestions[0].no),remembered=focusedInputKey.current
    const key=remembered&&q.subquestions.some(sub=>keyFor(q,sub.no)===remembered)?remembered:fallbackKey
    const input=inputs.current[key],value=answers[key]||'',start=input?.selectionStart??value.length,end=input?.selectionEnd??value.length
    const next=value.slice(0,start)+text+value.slice(end);setAnswers(v=>({...v,[key]:next}))
    const pos=start+text.length-(text.endsWith('()')?1:0);requestAnimationFrame(()=>{input?.focus();input?.setSelectionRange(pos,pos)})
  }
  const formatTime=(value:number)=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`
  const changeMajor=(next:number)=>{setMajorIndex(Math.max(0,Math.min(majors.length-1,next)));window.scrollTo({top:0,behavior:'smooth'})}
  const beginMarking=()=>{setRunning(false);markYearSolved(year);setPhase('mark');window.scrollTo({top:0,behavior:'smooth'})}
  const finish=()=>{
    if(!canWriteLearningData()){notifyWriteBlocked();return}
    const graded=allSubs.map(x=>({...x,status:statusFor(x.key)}))
    const score=Math.round(graded.reduce((sum,x)=>sum+(x.status==='correct'?pointsFor(year,x.major.major,x.major.subquestions.length):0),0))
    const target=loadPreferences().target,items:StrategyItem[]=graded.map(x=>({key:x.key,major:x.major.major,subNo:x.sub.no,topic:x.sub.topic,grade:x.sub.grade,status:x.status,points:pointsFor(year,x.major.major,x.major.subquestions.length),cause:causeMap[x.key],flagged:!!flags[x.key]}))
    const weak=rankWeakFields(target,items),strategy=buildTargetStrategy(target,score,items)
    const wrongItems=items.filter(x=>x.status!=='correct')
    const result:SavedResult={score,correct:graded.filter(x=>x.status==='correct').length,wrong:graded.filter(x=>x.status==='wrong').length,unanswered:graded.filter(x=>x.status==='unanswered').length,weak,strategy,wrongItems}
    const now=new Date().toISOString(),prior=loadExamScores().some(x=>x.year===year&&x.completed!==false)
    saveExamScore({id:createRecordId(`exam-${year}`),year,score:result.score,correctCount:result.correct,wrongCount:result.wrong,unansweredCount:result.unanswered,completed:true,attemptKind:prior?'retake':'first',scoreValidity:!prior&&firstLookEligible?'first-look':'reference',weakFields:weak,at:now})
    graded.forEach(x=>{
      const cause=causeMap[x.key]||''
      const diagnosis=x.status==='correct'?'correct':cause==='時間不足'?'time':cause==='現時点では難しい'?'difficult':cause?'recoverable':undefined
      saveAttempt({id:createRecordId(`exam-${x.key}`),questionId:`exam-${x.key}`,mode:'multi',topic:x.sub.topic,status:x.status==='correct'?'correct':x.status==='unanswered'?'deferred':'wrong',mistakeTag:cause||undefined,diagnosis,answer:answers[x.key]||'',flagged:!!flags[x.key],seconds:questionSeconds[x.key],at:now})
    })
    try{const all=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');delete all[String(year)];localStorage.setItem(DRAFT_KEY,JSON.stringify(all))}catch{/* no-op */}
    void createRestorePoint('exam_complete').catch(()=>{/* saved result remains */})
    setSavedResult(result);setPhase('result');window.scrollTo({top:0,behavior:'smooth'})
  }

  if(!integrity.ok)return <section className="card integrity-failed"><span className="eyebrow">SAFETY CHECK FAILED</span><h1>採点データを確認できないため開始を停止しました</h1><p>誤採点を防ぐための安全機能です。</p><ul>{integrity.issues.slice(0,8).map(x=><li key={x}>{x}</li>)}</ul><Link className="button" to="/">ホームへ戻る</Link></section>
  if(needsWarning&&!warningAccepted&&phase==='solve')return <section className="card warning-card"><span className="eyebrow">推奨ルート外の年度</span><h1>{year}年度を先に開きますか？</h1><p>標準ルートでは、先に{activeRequiredYear}年度の{activeRequiredYear?requiredYearPurpose(activeRequiredYear):'現在の学習'}と弱点補強を終えてから、{year}年度の{requiredYearPurpose(year)}へ進みます。先に開くと、その年度は初見比較ではなく参考確認になる場合があります。</p><div className="actions"><Link className="button primary" to="/">推奨ルートへ戻る</Link><button className="button" onClick={()=>setWarningAccepted(true)}>理解して開始する</button></div></section>

  if(phase==='mark')return <ExamMarkReview year={year} majors={majors} answers={answers} flags={flags} causeMap={causeMap} overrides={overrides} statusFor={statusFor} setCauseMap={setCauseMap} setOverrides={setOverrides} onFinish={finish}/>

  if(phase==='result'&&savedResult){const strategy=savedResult.strategy,priorityWrong=savedResult.wrongItems.filter(item=>gradeInTarget(strategy.target,item.grade)),deferredWrong=savedResult.wrongItems.filter(item=>!gradeInTarget(strategy.target,item.grade));return <>
    <div className="page-head"><div><span className="eyebrow">AUTO SCORING COMPLETE</span><h1>{year}年度の自動採点結果</h1></div></div>
    <section className="grid four result-scores"><article className="card stat"><b>{savedResult.score}</b><span>自動採点</span><small>{loadExamScores().find(x=>x.year===year)?.scoreValidity==='reference'?'参考スコア':'初見スコア'}</small></article><article className="card stat"><b>{savedResult.correct}</b><span>正解</span></article><article className="card stat"><b>{savedResult.wrong}</b><span>不正解</span></article><article className="card stat"><b>{savedResult.unanswered}</b><span>未回答</span></article></section>
    {priorityWrong.length>0&&<section className="card result-wrong-first"><div className="section-head"><div><span className="eyebrow">FIX THESE FIRST · TARGET {strategy.target}</span><h2>今直す問題</h2></div><b>{priorityWrong.length}問</b></div><p className="muted">{strategy.target}点目標に含まれる問題だけを先に表示します。解説画面では、その小問とその小問の正答だけを表示します。</p><div className="guided-question-list">{priorityWrong.map(item=><article key={item.key}><div><b>大問{item.major}（{item.subNo}）</b><span>{item.topic}</span><small>{item.status==='unanswered'?'未回答':'不正解'}・問題ランク{item.grade}{item.cause?` ／ ${item.cause}`:''}</small></div><Link className="button primary" to={`/guided-review?q=${encodeURIComponent(item.key)}`}>この1問を直す</Link></article>)}</div></section>}
    {deferredWrong.length>0&&strategy.target<75&&<details className="card deferred-mistakes"><summary>今は後回しの問題 {deferredWrong.length}問</summary><p className="muted">現在の{strategy.target}点目標には含めません。必要な場合だけ開いて確認できます。</p><div className="guided-question-list">{deferredWrong.map(item=><article key={item.key}><div><b>大問{item.major}（{item.subNo}）</b><span>{item.topic}</span><small>問題ランク{item.grade}・今は後回し</small></div><Link className="button" to={`/guided-review?q=${encodeURIComponent(item.key)}`}>任意で確認</Link></article>)}</div></details>}
    <section className={`card target-result ${strategy.reached?'reached':''}`}><div className="section-head"><div><span className="eyebrow">TARGET {strategy.target}</span><h2>{strategy.reached?`${strategy.target}点目標に到達`:`目標まであと${strategy.gap}点`}</h2></div><b className="target-projection">回収目安 約{strategy.projectedScore}点</b></div><p>{strategy.summary}</p>{strategy.candidates.length>0&&<div className="recovery-list">{strategy.candidates.map((item,i)=><article key={item.key}><strong>{i+1}</strong><div><b>{item.label}</b><small>優先度{item.grade}・約{item.points}点　{item.reason}</small></div></article>)}</div>}<div className="time-plan"><b>目標別の時間配分</b><div>{strategy.timePlan.map(item=><span key={item.label} style={{flex:item.percent}}>{item.label}<small>{item.percent}%</small></span>)}</div></div><p className="muted">時間配分と回収点は学習上の目安です。正誤判定と実得点は目標設定によって変わりません。</p></section>
    <section className="card"><span className="eyebrow">TOP 3 WEAKNESSES · TARGET {strategy.target}</span><h2>目標に直結する弱点3分野</h2>{savedResult.weak.length?<div className="weak-three">{savedResult.weak.map((x,i)=><article key={x}><strong>{i+1}</strong><div><b>{x}</b><p>上の目標範囲の小問を直してから、旧年度問題・負荷別の固定類題セットで定着させます。</p></div></article>)}</div>:<p>目標範囲の失点分野はありませんでした。</p>}<div className="actions">{(()=>{const next=nextLearningAction(strategy.target);return <Link className="button primary" to={next.to}>{next.label}</Link>})()}<Link className="button" to="/">ホームへ</Link></div></section>
  </>}

  return <>
    <div className="exam-compact-head"><div><span className="eyebrow">STEP 解く</span><h1>{year}年度｜{examRole(year)}</h1></div><div><b>入力 {entered}/{allSubs.length}</b><Link to="/years">演習一覧</Link></div></div>
    <div className="major-tabs" aria-label="大問選択">{majors.map((m,i)=><button key={m.id} className={i===majorIndex?'active':''} onClick={()=>changeMajor(i)}>大問{m.major}<small>{m.subquestions.length}小問</small></button>)}</div>
    <div className={`exam-workspace ${answerOpen?'answer-open':''}`}>
      <section className="problem-pane card"><div className="section-head"><div><span className="eyebrow">PROBLEM · EXAM MODE</span><h2>大問 {q.major}　{q.title}</h2></div><b>{q.major===1?(year===2019?45:40):year===2019&&q.major===2?10:15}点</b></div><p className="muted">本番演習中は、実際の試験と同じように問題ページ全体を表示します。</p><div className="exam-images">{(examPages[year]?.[q.major-1]||[]).map(page=><img key={page} src={paperImage(year,page)} alt={`${year}年度 大問${q.major} 問題ページ${page}`} loading="eager" />)}</div></section>
      <aside className={`answer-dock card ${answerOpen?'open':'closed'}`}><button className="answer-dock-toggle" onClick={()=>setAnswerOpen(v=>!v)} aria-expanded={answerOpen}>解答欄 {q.subquestions.filter(s=>(answers[keyFor(q,s.no)]||'').trim()).length}/{q.subquestions.length}<span>{answerOpen?'閉じる':'開く'}</span></button>{answerOpen&&<><div className="dock-scroll">{q.subquestions.map(s=>{const key=keyFor(q,s.no);return <div className="dock-question" key={key}><div className="dock-qhead"><b>({s.no})</b><span>{s.topic}</span><button className={flags[key]?'flagged':''} onClick={()=>setFlags(v=>({...v,[key]:!v[key]}))}>△ 迷い</button></div><input ref={el=>{inputs.current[key]=el}} value={answers[key]||''} maxLength={120} onFocus={()=>{focusedInputKey.current=key;setFocused(key)}} onBlur={()=>setFocused(v=>v===key?'':v)} onChange={e=>setAnswers(v=>({...v,[key]:cleanAnswerInput(e.target.value)}))} placeholder="答えを入力（全角可）" autoCapitalize="off" autoCorrect="off" spellCheck={false}/></div>})}</div><div className="shared-keypad" aria-label="数式入力補助">{[['分数','/'],['√','√()'],['x²','^2'],['( )','()'],['−','-'],['±','±'],['π','π'],['比',':'],[',',','],['≦','≦'],['≧','≧'],['＜','<'],['＞','>'],['＝','=']].map(([label,text])=><button type="button" key={label} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(text)}>{label}</button>)}</div><div className="major-nav"><button className="button" disabled={majorIndex===0} onClick={()=>changeMajor(majorIndex-1)}>← 前</button>{majorIndex<majors.length-1?<button className="button primary" onClick={()=>changeMajor(majorIndex+1)}>次の大問 →</button>:<button className="button primary" onClick={beginMarking}>解答を終了して自動採点</button>}</div></>}</aside>
    </div>
    <div className="floating-timer" aria-label="試験タイマー"><b>{formatTime(seconds)}</b><button onClick={()=>setRunning(v=>!v)}>{running?'停止':'再開'}</button></div>
  </>
}
