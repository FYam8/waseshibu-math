import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FocusedQuestionView from '../components/FocusedQuestionView'
import { classifyRemediationField } from '../data/remediation'
import { createRecordId, loadAttempts, loadPreferences, saveAttempt } from '../storage'
import { ensureReinforcementPlan, latestExam, loadLearningRoute, markOldQuestionCompleted, nextLearningAction, oldQuestionBank, reinforcementComplete, sourceMistakeProgress, yearRole } from '../learningRoute'
import { getExamAnswer, isExamAnswerCorrect } from '../data/examAnswers'
import { cleanAnswerInput } from '../answer'
import { targetGoalLabel, targetProfile, weakFieldsForStoredExam } from '../targetStrategy'
import { guidedQuestion } from '../guidedReview'

export default function Reinforcement(){
  const [params]=useSearchParams(),rawSource=Number(params.get('source')||2024),source=rawSource>=2022&&rawSource<=2026?rawSource:2024
  const exam=latestExam(source)
  const [version,setVersion]=useState(0)
  const [open,setOpen]=useState<string|null>(null)
  const [showAnswer,setShowAnswer]=useState<Record<string,boolean>>({})
  const [needsReproduction,setNeedsReproduction]=useState<Record<string,boolean>>({})
  const [answers,setAnswers]=useState<Record<string,string>>({})
  const [results,setResults]=useState<Record<string,boolean>>({})
  const target=loadPreferences().target
  const bank=useMemo(()=>oldQuestionBank(),[])
  if(!exam)return <section className="card warning-card"><span className="eyebrow">DIAGNOSIS REQUIRED</span><h1>{source}年度の診断が先です</h1><p>全小問を採点・分類すると、優先弱点3分野と過去問の該当問題を自動で選びます。</p><Link className="button primary" to={`/past-papers?year=${source}`}>{source}年度を解く</Link></section>

  const attempts=loadAttempts(),fields=weakFieldsForStoredExam(target,exam,attempts),targetExam={...exam,weakFields:fields}
  const plan=ensureReinforcementPlan(targetExam,target),state=loadLearningRoute(),fresh=state.reinforcement[String(source)]||plan
  const completed=new Set(fresh.completedQuestionIds)
  const done=reinforcementComplete(source),sourceProgress=sourceMistakeProgress(source,target)
  const nextAfterDone=done?nextLearningAction(target):null
  const sourceReviewRequired=fresh.requiresSourceReview!==false
  const mark=(id:string,topic:string,correct:boolean)=>{
    // 間違えた時点では「補強完了」にしない。正解して初めて完了扱いにする。
    if(correct)markOldQuestionCompleted(source,id)
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

  if(!done&&sourceReviewRequired&&!sourceProgress.complete)return <>
    <div className="page-head"><div><span className="eyebrow">SOURCE QUESTION FIRST · {targetGoalLabel(target)}</span><h1>まず{source}年度で間違えた問題を直します</h1><p className="muted">旧年度問題へ進む前に、診断で実際に間違えた目標範囲の小問を理解し、もう一度再現できる状態にします。</p></div><b className="route-status">{sourceProgress.completedIds.length}/{sourceProgress.requiredIds.length}問</b></div>
    <section className="card source-review-gate"><h2>残り {sourceProgress.remainingIds.length}問</h2><p>{targetGoalLabel(target)}目標では、元の未解決問題を先に直してから「2019〜2021該当問題 → 類題4問」へ進みます。</p><div className="reinforce-flow four-step"><b>1　元の未解決問題を再現</b><span>→</span><b>2　旧年度の該当問題</b><span>→</span><b>3　類題4問</b><span>→</span><b>4　次年度で確認</b></div><div className="actions"><Link className="button primary" to={`/mistakes?year=${source}`}>元の未解決問題を直す</Link><Link className="button" to="/">ホームへ戻る</Link></div><p className="muted">答えを見ただけでは完了になりません。「ヒントなしで再現」または「答え確認後に再現」まで進めると、この補強が解放されます。</p></section>
  </>

  return <>
    <div className="page-head"><div><span className="eyebrow">TARGETED REINFORCEMENT · {targetGoalLabel(target)}</span><h1>{source}年度から見つかった弱点3分野</h1><p className="muted">{targetProfile(target).summary} 元の未解決問題 → 過去問の該当問題 → 類題4問の順で、設定が変わっても解ける状態にします。</p></div><b className="route-status">{done?'補強完了':'補強中'}</b></div>
    {done&&!sourceProgress.complete&&fresh.requiresSourceReview===false&&<div className="notice-box"><b>旧バージョンで補強完了済みです。</b> 完了状態は維持しています。元の{source}年度誤答の再確認は任意です。</div>}
    <div className="reinforce-flow four-step"><b>1　元の未解決問題を再現</b><span>→</span><b>2　旧年度の該当問題</b><span>→</span><b>3　類題4問連続正解</b><span>→</span><b>4　次年度で確認</b></div>
    {fields.length===0&&<section className="card"><h2>優先補強なし</h2><p>今回の診断では目標範囲の失点分野がありませんでした。次年度へ進めます。</p></section>}
    <div className="reinforce-fields">{fields.map((fieldName,fieldIndex)=>{
      const ids=fresh.fields[fieldName]||[],items=ids.map(id=>bank.find(x=>x.id===id)).filter(Boolean) as ReturnType<typeof oldQuestionBank>
      const triggerSourceQuestionId=attempts.filter(a=>a.status==='wrong'&&a.questionId.startsWith(`exam-${source}-`)&&classifyRemediationField(a.topic).title===fieldName).sort((a,b)=>b.at.localeCompare(a.at))[0]?.questionId.replace(/^exam-/,'')
      const actualDone=ids.every(id=>completed.has(id))
      const mastered=attempts.some(a=>a.questionId.startsWith('mastery-')&&a.status==='correct'&&a.at>exam.at&&classifyRemediationField(a.topic).title===fieldName)
      return <section className="card reinforce-field" key={fieldName}><div className="section-head"><div><span className="field-number">{fieldIndex+1}</span><h2>{fieldName}</h2></div><b>{actualDone?'過去問済み':'過去問演習中'} / {mastered?'類題済み':'類題未完了'}</b></div><p className="muted">この診断で予約した問題だけを表示します。同じ問題を別の補強で重複使用しません。</p>
        <div className="target-question-list">{items.length===0?<p className="notice-box">この分野の未使用問題は残っていません。類題4問へ進んでください。</p>:items.map(item=>{const isOpen=open===item.id,isDone=completed.has(item.id),graded=item.id in results,meta=guidedQuestion(item.id),expected=getExamAnswer(item.id);return <article className={`target-question ${isDone?'done':''}`} key={item.id}><button className="target-question-head" onClick={()=>setOpen(isOpen?null:item.id)}><span>{isDone?'✓':'○'}</span><b>{item.year}年度{yearRole(item.year)==='different-structure'?'（構成が異なる年度）':''} 大問{item.major}（{item.subNo}）</b><small>{source}年度の「{fieldName}」補強・{item.topic}</small><em>{isOpen?'閉じる':isDone?'記録済み・復習':'1問だけ解く'}</em></button>{isOpen&&<div className="target-workspace one-question-reinforce"><div>{meta?<FocusedQuestionView year={meta.year} major={meta.major} subIndex={meta.subIndex} subCount={meta.subCount} subNo={meta.subNo} topic={meta.topic}/>:<div className="notice-box">この小問を特定できません。間違い直し画面から開き直してください。</div>}</div><aside><div className="reinforce-focus-note"><b>表示・正答はこの1問だけ</b><span>別小問や公式解答ページ全体は表示しません。</span></div><label>（{item.subNo}）の答え<input value={answers[item.id]||''} maxLength={120} onChange={e=>setAnswers(v=>({...v,[item.id]:cleanAnswerInput(e.target.value)}))} placeholder="答えを入力（全角可）" autoCapitalize="off" autoCorrect="off" spellCheck={false}/></label>{graded&&<div className={`auto-grade ${results[item.id]?'correct':'wrong'}`}><b>{results[item.id]?'○ 正解':'× 不正解'}</b><span>この小問の正答：{expected?.answer||'正答データなし'}</span></div>}<button className="button primary" disabled={isDone||showAnswer[item.id]||!(answers[item.id]||'').trim()} onClick={()=>autoMark(item.id,item.topic)}>{isDone?'採点済み':showAnswer[item.id]?'正答を隠してから再現':'この1問を自動採点'}</button><button className="button" onClick={()=>{
          const currentlyShown=!!showAnswer[item.id]
          if(!currentlyShown){
            setNeedsReproduction(v=>({...v,[item.id]:true}))
            setShowAnswer(v=>({...v,[item.id]:true}))
          }else{
            // 正答を見た後は、そのまま写して完了できないよう入力と直前採点をリセットする。
            setShowAnswer(v=>({...v,[item.id]:false}))
            if(needsReproduction[item.id]){
              setAnswers(v=>({...v,[item.id]:''}))
              setResults(v=>{const next={...v};delete next[item.id];return next})
            }
          }
        }}>{showAnswer[item.id]?'正答を隠して自力で再現':'この小問の正答だけ見る'}</button>{showAnswer[item.id]&&<div className="single-answer-only"><span>この小問の正答</span><strong>{expected?.answer||'正答データなし'}</strong><small>正答を見ただけでは完了になりません。「正答を隠して自力で再現」を押すと入力をリセットし、もう一度正解したときだけ完了になります。</small></div>}<Link className="button" to={`/guided-review?q=${encodeURIComponent(item.id)}`}>この1問をステップで理解する</Link><p>{isDone?'この問題は採点・記録済みです。':'答えを入力するとこの小問だけを自動採点します。全角数字・記号も使えます。'}</p></aside></div>}</article>})}</div>
        <div className="reinforce-next"><div><b>過去問 {ids.filter(id=>completed.has(id)).length}/{ids.length}</b><span> → </span><b>類題 {mastered?'4/4':'0〜3/4'}</b></div><Link className={`button ${actualDone?'primary':'disabled'}`} aria-disabled={!actualDone} onClick={e=>{if(!actualDone)e.preventDefault()}} to={`/remediate?topic=${encodeURIComponent(fieldName)}&source=${source}${triggerSourceQuestionId?`&q=${encodeURIComponent(triggerSourceQuestionId)}`:''}`}>{mastered?'類題4問をもう一度':'類題4問へ進む'}</Link></div>
      </section>})}</div>
    <section className={`card route-complete ${done?'done':''}`}><h2>{done?'補強が完了しました':source===2026?'仕上げ補強を完了します':'次の確認は補強完了後に解放'}</h2><p>{done?`次の推奨は「${nextAfterDone?.label||'ホームで進捗を確認'}」です。未露出の確認年度が残っている場合は、そちらを優先します。`:'元の未解決問題確認、各分野の該当過去問、類題4問連続正解を順に完了します。'}</p>{done&&nextAfterDone?<Link className="button primary" to={nextAfterDone.to}>{nextAfterDone.label}</Link>:<Link className="button" to="/">ホームで進捗を見る</Link>}</section>
  </>
}
