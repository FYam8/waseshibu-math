import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { answerPages, examPages } from '../data/examConfig'
import { classifyRemediationField } from '../data/remediation'
import { createRecordId, loadAttempts, saveAttempt } from '../storage'
import { ensureReinforcementPlan, latestExam, loadLearningRoute, markOldQuestionCompleted, oldQuestionBank, reinforcementComplete } from '../learningRoute'

const BASE=import.meta.env.BASE_URL
const pad=(n:number)=>String(n).padStart(2,'0')
const paperImage=(year:number,page:number)=>`${BASE}exam-pages/${year}/page-${pad(page)}.jpg`
const answerImage=(year:number,page:number)=>`${BASE}exam-answers/${year}/page-${page}.jpg`

export default function Reinforcement(){
  const [params]=useSearchParams(),source=Number(params.get('source')||2024)===2025?2025:2024
  const exam=latestExam(source)
  const [version,setVersion]=useState(0)
  const [open,setOpen]=useState<string|null>(null)
  const [showAnswer,setShowAnswer]=useState<Record<string,boolean>>({})
  const [answers,setAnswers]=useState<Record<string,string>>({})
  const bank=useMemo(()=>oldQuestionBank(),[])
  if(!exam)return <section className="card warning-card"><span className="eyebrow">DIAGNOSIS REQUIRED</span><h1>{source}年度の診断が先です</h1><p>全小問を採点・分類すると、優先弱点3分野と過去問の該当問題を自動で選びます。</p><Link className="button primary" to={`/past-papers?year=${source}`}>{source}年度を解く</Link></section>

  const plan=ensureReinforcementPlan(exam),state=loadLearningRoute(),fresh=state.reinforcement[String(source)]||plan
  const completed=new Set(fresh.completedQuestionIds),attempts=loadAttempts(),fields=exam.weakFields||[]
  const done=reinforcementComplete(source)
  const mark=(id:string,topic:string,correct:boolean)=>{
    markOldQuestionCompleted(source,id)
    saveAttempt({id:createRecordId(`target-${id}`),questionId:`target-${id}`,mode:'multi',topic,status:correct?'correct':'wrong',mistakeTag:correct?undefined:'解法未習得',answer:answers[id]||'',at:new Date().toISOString()})
    setVersion(v=>v+1)
  }
  void version
  return <>
    <div className="page-head"><div><span className="eyebrow">TARGETED REINFORCEMENT</span><h1>{source}年度から見つかった弱点3分野</h1><p className="muted">過去問の該当問題 → 類題4問の順で、設定が変わっても解ける状態にします。</p></div><b className="route-status">{done?'補強完了':'補強中'}</b></div>
    <div className="reinforce-flow"><b>1　過去問の該当問題</b><span>→</span><b>2　同分野の類題4問連続正解</b><span>→</span><b>3　次年度で確認</b></div>
    {fields.length===0&&<section className="card"><h2>優先補強なし</h2><p>今回の診断では失点分野がありませんでした。次年度へ進めます。</p></section>}
    <div className="reinforce-fields">{fields.map((fieldName,fieldIndex)=>{
      const ids=fresh.fields[fieldName]||[],items=ids.map(id=>bank.find(x=>x.id===id)).filter(Boolean) as ReturnType<typeof oldQuestionBank>
      const actualDone=ids.every(id=>completed.has(id))
      const mastered=attempts.some(a=>a.questionId.startsWith('mastery-')&&a.status==='correct'&&a.at>exam.at&&classifyRemediationField(a.topic).title===fieldName)
      return <section className="card reinforce-field" key={fieldName}><div className="section-head"><div><span className="field-number">{fieldIndex+1}</span><h2>{fieldName}</h2></div><b>{actualDone?'過去問済み':'過去問演習中'} / {mastered?'類題済み':'類題未完了'}</b></div><p className="muted">この診断で予約した問題だけを表示します。同じ問題を別の補強で重複使用しません。</p>
        <div className="target-question-list">{items.length===0?<p className="notice-box">この分野の未使用問題は残っていません。類題4問へ進んでください。</p>:items.map(item=>{const isOpen=open===item.id,isDone=completed.has(item.id);return <article className={`target-question ${isDone?'done':''}`} key={item.id}><button className="target-question-head" onClick={()=>setOpen(isOpen?null:item.id)}><span>{isDone?'✓':'○'}</span><b>{item.year}年度 大問{item.major}（{item.subNo}）</b><small>{item.topic}</small><em>{isOpen?'閉じる':'同じ画面で解く'}</em></button>{isOpen&&<div className="target-workspace"><div><div className="exam-images">{(examPages[item.year]?.[item.major-1]||[]).map(page=><img key={page} src={paperImage(item.year,page)} alt={`${item.year}年度 大問${item.major}`} />)}</div></div><aside><label>（{item.subNo}）の答え<input value={answers[item.id]||''} onChange={e=>setAnswers(v=>({...v,[item.id]:e.target.value}))} placeholder="答えを入力" /></label><button className="button" onClick={()=>setShowAnswer(v=>({...v,[item.id]:!v[item.id]}))}>{showAnswer[item.id]?'公式解答を閉じる':'公式解答を確認'}</button>{showAnswer[item.id]&&<div className="official-answer">{Array.from({length:answerPages[item.year]||1},(_,i)=><img key={i} src={answerImage(item.year,i+1)} alt={`${item.year}年度 公式解答`} />)}</div>}<p>公式解答と照合して記録してください。</p><div className="actions"><button className="button primary" onClick={()=>mark(item.id,item.topic,true)}>正解として記録</button><button className="button" onClick={()=>mark(item.id,item.topic,false)}>不正解として記録</button></div></aside></div>}</article>})}</div>
        <div className="reinforce-next"><div><b>過去問 {ids.filter(id=>completed.has(id)).length}/{ids.length}</b><span> → </span><b>類題 {mastered?'4/4':'0〜3/4'}</b></div><Link className={`button ${actualDone?'primary':'disabled'}`} aria-disabled={!actualDone} onClick={e=>{if(!actualDone)e.preventDefault()}} to={`/remediate?topic=${encodeURIComponent(fieldName)}&source=${source}`}>{mastered?'類題4問をもう一度':'類題4問へ進む'}</Link></div>
      </section>})}</div>
    <section className={`card route-complete ${done?'done':''}`}><h2>{done?'補強が完了しました':'次年度は補強完了後に解放'}</h2><p>{done?`${source===2024?'2025年度で改善を確認します。':'2026年度で仕上がりを確認します。'}`:'各分野で、該当過去問の記録と類題4問連続正解の両方が必要です。'}</p>{done?<Link className="button primary" to={`/past-papers?year=${source===2024?2025:2026}`}>{source===2024?'2025年度 改善確認へ':'2026年度 仕上げへ'}</Link>:<Link className="button" to="/">ホームで進捗を見る</Link>}</section>
  </>
}
