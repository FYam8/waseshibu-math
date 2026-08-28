import { Link } from 'react-router-dom'
import { loadAttempts } from '../storage'
import { classifyRemediationField } from '../data/remediation'

export default function MistakeReview(){
  const attempts=loadAttempts()
  const masteredAt=new Map<string,string>()
  for(const a of attempts)if(a.questionId.startsWith('mastery-')&&a.status==='correct'){const field=classifyRemediationField(a.topic).title;if(!masteredAt.has(field))masteredAt.set(field,a.at)}
  const latest=new Map<string,(typeof attempts)[number]>()
  for(const a of attempts)if(!a.questionId.startsWith('remedy-')&&!a.questionId.startsWith('mastery-')&&!latest.has(a.questionId))latest.set(a.questionId,a)
  const unresolved=[...latest.values()].filter(x=>x.status!=='correct'&&x.at>(masteredAt.get(classifyRemediationField(x.topic).title)||''))
  const grouped=unresolved.reduce<Record<string,typeof unresolved>>((acc,x)=>{const field=classifyRemediationField(x.topic).title;(acc[field]??=[]).push(x);return acc},{})
  const topics=Object.entries(grouped).sort((a,b)=>b[1].length-a[1].length)
  const tagCount=unresolved.reduce<Record<string,number>>((acc,x)=>{const tag=x.mistakeTag||'未分類';acc[tag]=(acc[tag]||0)+1;return acc},{})
  const tags=Object.entries(tagCount).sort((a,b)=>b[1]-a[1])
  const remedyLink=(topic:string)=>`/remediate?topic=${encodeURIComponent(topic)}`
  return <>
    <div className="page-head"><div><span className="eyebrow">WRONG ANSWERS ONLY</span><h1>間違い直し</h1></div></div>
    <section className="grid three"><article className="card stat"><b>{unresolved.length}</b><span>未解決の設問</span></article><article className="card stat"><b>{topics.length}</b><span>弱点テーマ</span></article><article className="card stat"><b>{tags[0]?.[0]||'--'}</b><span>最多の失点原因</span></article></section>
    {unresolved.length===0?<section className="card"><h2>未解決の間違いはありません</h2><p className="muted">アプリで実際の過去問を解いて採点すると、間違えた18分野がここに並びます。</p><Link className="button primary" to="/past-papers">過去問を解く</Link></section>:<>
      <section className="card"><h2>直す順番</h2><div className="review-order"><div><b>1</b><span>計算・符号・読み落とし</span><small>次回取れる失点から直す</small></div><div><b>2</b><span>解法・知識不足</span><small>解法3手順から類題へ</small></div><div><b>3</b><span>場合分け・時間不足</span><small>後回し判断も改善</small></div></div></section>
      <section className="review-topics">{topics.map(([topic,items])=>{const easy=items.some(x=>['計算ミス','符号ミス','読み落とし','答え方の不備'].includes(x.mistakeTag||'')),priority=easy||items.length>=3?'A':items.length===2?'B':'C';return <article className="card" key={topic}><div className="section-head"><div><span className="eyebrow">優先度 {priority}・{priority==='A'?'当日':priority==='B'?'翌日':'軽く確認'}</span><h3>{topic}</h3></div><b>{items.length}問</b></div><div className="chips">{[...new Set(items.map(x=>x.mistakeTag||'未分類'))].map(x=><span key={x}>{x}</span>)}</div><p className="muted">最後の記録：{new Date(items[0].at).toLocaleDateString('ja-JP')}</p><Link className="button primary" to={remedyLink(topic)}>類題4問で克服する</Link></article>})}</section>
    </>}
  </>
}
