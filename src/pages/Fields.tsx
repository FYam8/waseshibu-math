import { Link } from 'react-router-dom'
import questions from '../data/questions.json'
import type { MajorQuestion } from '../types'
import { classifyRemediationField, remediationFields } from '../data/remediation'

const majors=questions.questions as MajorQuestion[]

export default function Fields(){
  const coverage=new Map<string,Set<number>>()
  for(const major of majors)for(const sub of major.subquestions){
    const field=classifyRemediationField(sub.topic)
    if(!coverage.has(field.id))coverage.set(field.id,new Set())
    coverage.get(field.id)!.add(major.year)
  }
  return <>
    <div className="page-head"><div><span className="eyebrow">18 FIELDS × 4 QUESTIONS</span><h1>18分野の類題</h1><p className="muted">2019〜2026年度の出題テーマを18分野に整理した、全72問の類題バンクです。</p></div><b className="streak-badge">18分野・72問</b></div>
    <section className="card notice-box"><b>基本は過去問が先です。</b><br/>過去問を解いて間違えた分野は「間違い直し」に自動で並びます。この一覧から直接練習することもできます。</section>
    <section className="field-grid">{remediationFields.map((field,index)=>{
      const years=[...(coverage.get(field.id)||new Set<number>())].sort()
      return <article className="card field-card" key={field.id}><div className="section-head"><span className="field-number">{String(index+1).padStart(2,'0')}</span><b>類題4問</b></div><h2>{field.title}</h2><p className="muted">過去問分析での該当年度：{years.length?years.join('・'):'個別テーマを統合'}</p><Link className="button primary" to={`/remediate?topic=${encodeURIComponent(field.title)}`}>4問に挑戦</Link></article>
    })}</section>
    <section className="card"><h2>「全年度分」の意味</h2><p>この72問は、過去問本文72問ではありません。2019〜2026年度の実際の過去問を分析して作った類題です。実際の過去問は「過去問演習」で年度ごとに問題冊子を表示します。</p></section>
  </>
}
