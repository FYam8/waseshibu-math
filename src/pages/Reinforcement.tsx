import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FocusedQuestionView from '../components/FocusedQuestionView'
import { classifyRemediationField } from '../data/remediation'
import { createRecordId, loadAttempts, loadPreferences, saveAttempt } from '../storage'
import { ensureReinforcementPlan, latestExam, loadLearningRoute, markOldQuestionCompleted, oldQuestionBank, reinforcementComplete } from '../learningRoute'
import { getExamAnswer, isExamAnswerCorrect } from '../data/examAnswers'
import { cleanAnswerInput } from '../answer'
import { targetProfile, weakFieldsForStoredExam } from '../targetStrategy'
import { guidedQuestion } from '../guidedReview'

export default function Reinforcement(){
  const [params]=useSearchParams(),source=Number(params.get('source')||2024)===2025?2025:2024
  const exam=latestExam(source)
  const [version,setVersion]=useState(0)
  const [open,setOpen]=useState<string|null>(null)
  const [showAnswer,setShowAnswer]=useState<Record<string,boolean>>({})
  const [answers,setAnswers]=useState<Record<string,string>>({})
  const [results,setResults]=useState<Record<string,boolean>>({})
  const target=loadPreferences().target
  const bank=useMemo(()=>oldQuestionBank(),[])
  if(!exam)return <section className="card warning-card"><span className="eyebrow">DIAGNOSIS REQUIRED</span><h1>{source}年度の診断が先です</h1><p>全小問を採点・分類すると、優先弱点3分野と過去問の該当問題を自動で選びます。</p><Link className="button primary" to={`/past-papers?year=${source}`}>{source}年度を解く</Link></section>

  const attempts=loadAttempts(),fields=weakFieldsForStoredExam(target,exam,attempts),targetExam={...exam,weakFields:fields}
  const plan=ensureReinforcementPlan(targetExam,target),state=loadLearningRoute(),fresh=state.reinforcement[String(source)]||plan
  const completed=new Set(fresh.completedQuestionIds)
  const done=reinforcementComplete(source)
  const mark=(id:string,topic:string,correct:boolean)=>{
    markOldQuestionCompleted(source,id)
    saveAttempt({id:createRecordId(`target-${id}`),questionId:`target-${id}`,mode:'multi',topic,status:correct?'correct':'wrong',mistakeTag:correct?undefined:'解法未習得',answer:answers[id]||'',at:new Date().toISOString()})
    setVersion(v=>v+1)
  }
  const autoMark=(id:string,topic:string)=>{
    const value=answers[id]||''
    if(!value.trim())return
    const correct=isExamAnswerCorrect(id,value)
    setResults(v=>({...v,[id]:correct}));mark(id,topic,correct)
  }
  void version
  return <>
    <div className="page-head"><div><span className="eyebrow">TARGETED REINFORCEMENT · TARGET {target}</span><h1>{source}年度から見つかった弱点3分野</h1><p className="muted">{targetProfile(target).summary} 過去問の該当問題 → 類題4問の順で、設定が変わっても解ける状態にします。</p></div><b className="route-status">{done?'補強完了':'補強中'}</b></div>
    <div className="reinforce-flow"><b>1　過去問の該当問題</b><span>→</span><b>2　同分野の類題4問連続正解</b><span>→</span><b>3　次年度で確認</b></div>
    {fields.length===0&&<section className="card"><h2>優先補強なし</h2><p>今回の診断では失点分野がありませんでした。次年度へ進めます。</p></section>}
    <div className="reinforce-fields">{fields.map((fieldName,fieldIndex)=>{
      const ids=fresh.fields[fieldName]||[],items=ids.map(id=>bank.find(x=>x.id===id)).filter(Boolean) as ReturnType<typeof oldQuestionBank>
      const actualDone=ids.every(id=>completed.has(id))
      const mastered=attempts.some(a=>a.questionId.startsWith('mastery-')&&a.status==='correct'&&a.at>exam.at&&classifyRemediationField(a.topic).title===fieldName)
      return <section className="card reinforce-field" key={fieldName}><div className="section-head"><div><span className="field-number">{fieldIndex+1}</span><h2>{fieldName}</h2></div><b>{actualDone?'過去問済み':'過去問演習中'} / {mastered?'類題済み':'類題未完了'}</b></div><p className="muted">この診断で予約した問題だけを表示します。同じ問題を別の補強で重複使用しません。</p>
        <div className="target-question-list">{items.length===0?<p className="notice-box">この分野の未使用問題は残っていません。類題4問へ進んでください。</p>:items.map(item=>{const isOpen=open===item.id,isDone=completed.has(item.id),graded=item.id in results,meta=guidedQuestion(item.id),expected=getExamAnswer(item.id);return <article className={`target-question ${isDone?'done':''}`} key={item.id}><button className="target-question-head" onClick={()=>setOpen(isOpen?null:item.id)}><span>{isDone?'✓':'○'}</span><b>{item.year}年度 大問{item.major}（{item.subNo}）</b><small>{item.topic}</small><em>{isOpen?'閉じる':isDone?'記録済み・復習':'1問だけ解く'}</em></button>{isOpen&&<div className="target-workspace one-question-reinforce"><div>{meta?<FocusedQuestionView year={meta.year} major={meta.major} subIndex={meta.subIndex} subCount={meta.subCount} subNo={meta.subNo} topic={meta.topic}/>:<div className="notice-box">この小問を特定できません。間違い直し画面から開き直してください。</div>}</div><aside><div className="reinforce-focus-note"><b>表示・正答はこの1問だけ</b><span>別小問や公式解答ページ全体は表示しません。</span></div><label>（{item.subNo}）の答え<input value={answers[item.id]||''} maxLength={120} onChange={e=>setAnswers(v=>({...v,[item.id]:cleanAnswerInput(e.target.value)}))} placeholder="答えを入力（全角可）" autoCapitalize="off" autoCorrect="off" spellCheck={false}/></label>{graded&&<div className={`auto-grade ${results[item.id]?'correct':'wrong'}`}><b>{results[item.id]?'○ 正解':'× 不正解'}</b><span>この小問の正答：{expected?.answer||'正答データなし'}</span></div>}<button className="button primary" disabled={isDone||!(answers[item.id]||'').trim()} onClick={()=>autoMark(item.id,item.topic)}>{isDone?'採点済み':'この1問を自動採点'}</button><button className="button" onClick={()=>setShowAnswer(v=>({...v,[item.id]:!v[item.id]}))}>{showAnswer[item.id]?'正答を隠す':'この小問の正答だけ見る'}</button>{showAnswer[item.id]&&<div className="single-answer-only"><span>この小問の正答</span><strong>{expected?.answer||'正答データなし'}</strong><small>正答を見ただけでは習得扱いになりません。隠してからもう一度解いてください。</small></div>}<Link className="button" to={`/guided-review?q=${encodeURIComponent(item.id)}`}>この1問をステップで理解する</Link><p>{isDone?'この問題は採点・記録済みです。':'答えを入力するとこの小問だけを自動採点します。全角数字・記号も使えます。'}</p></aside></div>}</article>})}</div>
        <div className="reinforce-next"><div><b>過去問 {ids.filter(id=>completed.has(id)).length}/{ids.length}</b><span> → </span><b>類題 {mastered?'4/4':'0〜3/4'}</b></div><Link className={`button ${actualDone?'primary':'disabled'}`} aria-disabled={!actualDone} onClick={e=>{if(!actualDone)e.preventDefault()}} to={`/remediate?topic=${encodeURIComponent(fieldName)}&source=${source}`}>{mastered?'類題4問をもう一度':'類題4問へ進む'}</Link></div>
      </section>})}</div>
    <section className={`card route-complete ${done?'done':''}`}><h2>{done?'補強が完了しました':'次年度は補強完了後に解放'}</h2><p>{done?`${source===2024?'2025年度で改善を確認します。':'2026年度で仕上がりを確認します。'}`:'各分野で、該当過去問の記録と類題4問連続正解の両方が必要です。'}</p>{done?<Link className="button primary" to={`/past-papers?year=${source===2024?2025:2026}`}>{source===2024?'2025年度 改善確認へ':'2026年度 仕上げへ'}</Link>:<Link className="button" to="/">ホームで進捗を見る</Link>}</section>
  </>
}
