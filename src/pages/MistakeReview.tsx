import { Link, useSearchParams } from 'react-router-dom'
import { loadAttempts, loadExamScores, loadPreferences } from '../storage'
import { classifyRemediationField } from '../data/remediation'
import { guidedOutcomeLabel, loadGuidedReview } from '../guidedReview'
import { gradeAdvice, gradeInTarget, weakFieldsForStoredExam } from '../targetStrategy'
import questions from '../data/questions.json'
import type { MajorQuestion } from '../types'

const majors=questions.questions as MajorQuestion[]
function questionMeta(questionId:string){
  const id=questionId.replace(/^exam-/,'')
  const major=majors.find(m=>id.startsWith(`${m.id}-`))
  if(!major)return null
  const sub=major.subquestions.find(s=>`${major.id}-${s.no}`===id)
  return sub?{id,year:major.year,major:major.major,subNo:sub.no,topic:sub.topic,grade:sub.grade}:null
}

export default function MistakeReview(){
  const [params]=useSearchParams(),focusYear=Number(params.get('year'))
  const attempts=loadAttempts(),prefs=loadPreferences()
  const latestExam=loadExamScores().find(x=>x.completed!==false&&(!focusYear||x.year===focusYear))
  const recommended=new Set(latestExam?weakFieldsForStoredExam(prefs.target,latestExam,attempts):[])
  const masteredAt=new Map<string,string>()
  for(const a of attempts)if(a.questionId.startsWith('mastery-')&&a.status==='correct'){const field=classifyRemediationField(a.topic).title;if(!masteredAt.has(field))masteredAt.set(field,a.at)}
  const latest=new Map<string,(typeof attempts)[number]>()
  for(const a of attempts)if(!a.questionId.startsWith('remedy-')&&!a.questionId.startsWith('mastery-')&&!a.questionId.startsWith('exposure-')&&!latest.has(a.questionId))latest.set(a.questionId,a)
  const unresolved=[...latest.values()].filter(x=>x.status!=='correct'&&x.at>(masteredAt.get(classifyRemediationField(x.topic).title)||''))
  const unresolvedTarget=unresolved.filter(x=>{const meta=questionMeta(x.questionId);return !meta||gradeInTarget(prefs.target,meta.grade)})
  const grouped=unresolvedTarget.reduce<Record<string,typeof unresolvedTarget>>((acc,x)=>{const field=classifyRemediationField(x.topic).title;(acc[field]??=[]).push(x);return acc},{})
  const allTopics=Object.entries(grouped).sort((a,b)=>b[1].length-a[1].length)
  const topics=(recommended.size?allTopics.filter(([topic])=>recommended.has(topic)):allTopics).slice(0,3)
  const tagCount=unresolvedTarget.reduce<Record<string,number>>((acc,x)=>{const tag=x.mistakeTag||'未分類';acc[tag]=(acc[tag]||0)+1;return acc},{})
  const tags=Object.entries(tagCount).sort((a,b)=>b[1]-a[1])
  const remedyLink=(topic:string)=>`/remediate?topic=${encodeURIComponent(topic)}${latestExam?`&year=${latestExam.year}`:''}`
  const examWrongAll=unresolved.flatMap(attempt=>{const meta=questionMeta(attempt.questionId);return meta&&(!focusYear||meta.year===focusYear)?[{attempt,meta}]:[]}).sort((a,b)=>b.attempt.at.localeCompare(a.attempt.at))
  const examWrong=examWrongAll.filter(({meta})=>gradeInTarget(prefs.target,meta.grade))
  const deferredExamWrong=examWrongAll.filter(({meta})=>!gradeInTarget(prefs.target,meta.grade))
  const targetBand=prefs.target===60?'A問題':prefs.target===70?'A・B問題':'A・B・C問題'
  const deferredBand=prefs.target===60?'B・C問題':prefs.target===70?'C問題':''
  return <>
    <div className="page-head"><div><span className="eyebrow">WRONG ANSWERS ONLY</span><h1>間違い直し</h1></div></div>
    <section className="card target-review-policy"><div className="section-head"><div><span className="eyebrow">TARGET {prefs.target}</span><h2>{prefs.target}点目標：{targetBand}だけを先に直します</h2></div><b>{examWrong.length}問</b></div><p className="muted">目標点に含まれない問題は「今は後回し」に分けています。目標を70点・75点へ変更すると、自動で優先範囲も広がります。</p></section>
    <section className="grid three"><article className="card stat"><b>{topics.reduce((n,[,items])=>n+items.length,0)}</b><span>目標範囲の未解決設問</span></article><article className="card stat"><b>{topics.length}</b><span>いま直す弱点分野</span></article><article className="card stat"><b>{tags[0]?.[0]||'--'}</b><span>目標範囲の最多失点原因</span></article></section>
    {!!examWrong.length&&<section className="card"><div className="section-head"><div><span className="eyebrow">QUESTION BY QUESTION · TARGET ONLY</span><h2>今直す小問</h2></div><b>{examWrong.length}問</b></div><p className="muted">現在の{prefs.target}点目標に含まれる問題だけです。自力で解き直す・ステップで理解する・すぐ答えを見る、のどれからでも始められます。</p><div className="guided-question-list">{examWrong.map(({attempt,meta})=>{const review=loadGuidedReview(meta.id);return <article key={attempt.questionId}><div><b>{meta.year}年度 大問{meta.major}（{meta.subNo}）</b><span>{meta.topic}</span><small>問題ランク{meta.grade}・{gradeAdvice(prefs.target,meta.grade)}{attempt.mistakeTag?` ／ ${attempt.mistakeTag}`:''}</small>{review&&<em>{guidedOutcomeLabel(review.outcome)}</em>}</div><Link className="button primary" to={`/guided-review?q=${encodeURIComponent(meta.id)}`}>この1問を理解する</Link></article>})}</div></section>}
    {!examWrong.length&&<section className="card"><h2>{prefs.target}点目標の優先小問はありません</h2><p className="muted">現在残っている間違いが目標範囲外だけなら、先に次の年度へ進んで構いません。</p></section>}
    {!!deferredExamWrong.length&&prefs.target<75&&<details className="card deferred-mistakes"><summary>今は後回しの問題 {deferredExamWrong.length}問（{deferredBand}）</summary><p className="muted">{prefs.target}点を安定させるまでは主学習には出しません。確認したい場合だけ開いてください。</p><div className="guided-question-list">{deferredExamWrong.map(({attempt,meta})=><article key={attempt.questionId}><div><b>{meta.year}年度 大問{meta.major}（{meta.subNo}）</b><span>{meta.topic}</span><small>問題ランク{meta.grade}・{gradeAdvice(prefs.target,meta.grade)}{attempt.mistakeTag?` ／ ${attempt.mistakeTag}`:''}</small></div><Link className="button" to={`/guided-review?q=${encodeURIComponent(meta.id)}`}>任意で確認</Link></article>)}</div></details>}
    {topics.length===0?<section className="card"><h2>目標範囲の優先3分野は補強完了です</h2><p className="muted">診断がまだの場合は2024年度へ、完了済みの場合はホームに表示される次年度へ進んでください。</p><Link className="button primary" to="/">ホームで次の行動を見る</Link></section>:<>
      <section className="card"><h2>直す順番</h2><p className="muted">現在の{prefs.target}点目標に含まれる問題から選んだ上位3分野だけです。目標外のB/C問題で学習時間を使いすぎないようにします。</p><div className="review-order"><div><b>1</b><span>計算・符号・読み落とし</span><small>次回取れる失点から直す</small></div><div><b>2</b><span>解法・知識不足</span><small>解法3手順から類題へ</small></div><div><b>3</b><span>場合分け・時間不足</span><small>後回し判断も改善</small></div></div></section>
      <section className="review-topics">{topics.map(([topic,items])=>{const easy=items.some(x=>['計算ミス','符号ミス','読み落とし','答え方の不備'].includes(x.mistakeTag||'')),priority=easy||items.length>=3?'A':items.length===2?'B':'C';return <article className="card" key={topic}><div className="section-head"><div><span className="eyebrow">補強優先度 {priority}・{priority==='A'?'当日':priority==='B'?'翌日':'軽く確認'}</span><h3>{topic}</h3></div><b>{items.length}問</b></div><div className="chips">{[...new Set(items.map(x=>x.mistakeTag||'未分類'))].map(x=><span key={x}>{x}</span>)}</div><p className="muted">最後の記録：{new Date(items[0].at).toLocaleDateString('ja-JP')}</p><Link className="button primary" to={remedyLink(topic)}>類題4問で克服する</Link></article>})}</section>
    </>}
  </>
}
