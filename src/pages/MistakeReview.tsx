import { Link, useSearchParams } from 'react-router-dom'
import { loadAttempts, loadExamScores, loadPreferences } from '../storage'
import { classifyRemediationField } from '../data/remediation'
import { guidedOutcomeLabel, loadGuidedReview } from '../guidedReview'
import { gradeAdvice } from '../targetStrategy'
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
  const recommended=new Set(latestExam?.weakFields||[])
  const masteredAt=new Map<string,string>()
  for(const a of attempts)if(a.questionId.startsWith('mastery-')&&a.status==='correct'){const field=classifyRemediationField(a.topic).title;if(!masteredAt.has(field))masteredAt.set(field,a.at)}
  const latest=new Map<string,(typeof attempts)[number]>()
  for(const a of attempts)if(!a.questionId.startsWith('remedy-')&&!a.questionId.startsWith('mastery-')&&!a.questionId.startsWith('exposure-')&&!latest.has(a.questionId))latest.set(a.questionId,a)
  const unresolved=[...latest.values()].filter(x=>x.status!=='correct'&&x.at>(masteredAt.get(classifyRemediationField(x.topic).title)||''))
  const grouped=unresolved.reduce<Record<string,typeof unresolved>>((acc,x)=>{const field=classifyRemediationField(x.topic).title;(acc[field]??=[]).push(x);return acc},{})
  const allTopics=Object.entries(grouped).sort((a,b)=>b[1].length-a[1].length)
  const topics=(recommended.size?allTopics.filter(([topic])=>recommended.has(topic)):allTopics).slice(0,3)
  const tagCount=unresolved.reduce<Record<string,number>>((acc,x)=>{const tag=x.mistakeTag||'未分類';acc[tag]=(acc[tag]||0)+1;return acc},{})
  const tags=Object.entries(tagCount).sort((a,b)=>b[1]-a[1])
  const remedyLink=(topic:string)=>`/remediate?topic=${encodeURIComponent(topic)}${latestExam?`&year=${latestExam.year}`:''}`
  const examWrong=unresolved.map(a=>({attempt:a,meta:questionMeta(a.questionId)})).filter(x=>x.meta&&(!focusYear||x.meta.year===focusYear)).sort((a,b)=>b.attempt.at.localeCompare(a.attempt.at))
  return <>
    <div className="page-head"><div><span className="eyebrow">WRONG ANSWERS ONLY</span><h1>間違い直し</h1></div></div>
    <section className="grid three"><article className="card stat"><b>{topics.reduce((n,[,items])=>n+items.length,0)}</b><span>優先3分野の未解決設問</span></article><article className="card stat"><b>{topics.length}</b><span>いま直す弱点分野</span></article><article className="card stat"><b>{tags[0]?.[0]||'--'}</b><span>最多の失点原因</span></article></section>
    {!!examWrong.length&&<section className="card"><div className="section-head"><div><span className="eyebrow">QUESTION BY QUESTION</span><h2>間違えた小問を1問ずつ直す</h2></div><b>{examWrong.length}問</b></div><p className="muted">自力で解き直す・ステップで理解する・すぐ答えを見る、のどれからでも始められます。</p><div className="guided-question-list">{examWrong.map(({attempt,meta})=>{if(!meta)return null;const review=loadGuidedReview(meta.id);return <article key={attempt.questionId}><div><b>{meta.year}年度 大問{meta.major}（{meta.subNo}）</b><span>{meta.topic}</span><small>優先度{meta.grade}・{gradeAdvice(prefs.target,meta.grade)}{attempt.mistakeTag?` ／ ${attempt.mistakeTag}`:''}</small>{review&&<em>{guidedOutcomeLabel(review.outcome)}</em>}</div><Link className="button primary" to={`/guided-review?q=${encodeURIComponent(meta.id)}`}>この1問を理解する</Link></article>})}</div></section>}
    {topics.length===0?<section className="card"><h2>優先3分野の補強は完了です</h2><p className="muted">診断がまだの場合は2024年度へ、完了済みの場合はホームに表示される次年度へ進んでください。</p><Link className="button primary" to="/">ホームで次の行動を見る</Link></section>:<>
      <section className="card"><h2>直す順番</h2><p className="muted">診断で選ばれた上位3分野に限定しています。3分野を克服してから次年度へ進みます。</p><div className="review-order"><div><b>1</b><span>計算・符号・読み落とし</span><small>次回取れる失点から直す</small></div><div><b>2</b><span>解法・知識不足</span><small>解法3手順から類題へ</small></div><div><b>3</b><span>場合分け・時間不足</span><small>後回し判断も改善</small></div></div></section>
      <section className="review-topics">{topics.map(([topic,items])=>{const easy=items.some(x=>['計算ミス','符号ミス','読み落とし','答え方の不備'].includes(x.mistakeTag||'')),priority=easy||items.length>=3?'A':items.length===2?'B':'C';return <article className="card" key={topic}><div className="section-head"><div><span className="eyebrow">優先度 {priority}・{priority==='A'?'当日':priority==='B'?'翌日':'軽く確認'}</span><h3>{topic}</h3></div><b>{items.length}問</b></div><div className="chips">{[...new Set(items.map(x=>x.mistakeTag||'未分類'))].map(x=><span key={x}>{x}</span>)}</div><p className="muted">最後の記録：{new Date(items[0].at).toLocaleDateString('ja-JP')}</p><Link className="button primary" to={remedyLink(topic)}>類題4問で克服する</Link></article>})}</section>
    </>}
  </>
}
