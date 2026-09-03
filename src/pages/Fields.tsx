import { Link } from 'react-router-dom'
import { level2Fields } from '../data/level2Data'

export default function Fields(){
  return <>
    <div className="page-head"><div><span className="eyebrow">18 FIELDS · AUDITED V7</span><h1>18分野のLevel2</h1><p className="muted">2019〜2026年度の実過去問160小問に直結するcore Level2と、因数分解support 2問です。</p></div><b className="streak-badge">core 160＋support 2</b></div>
    <section className="card notice-box"><b>基本は過去問が先です。</b><br/>過去問を間違えた直後は、カテゴリ検索ではなく sourceQuestionId に対応する直結Level2から開始します。この一覧から分野練習もできます。</section>
    <section className="field-grid">{level2Fields.map((field,index)=>
      <article className="card field-card" key={field.fieldId}><div className="section-head"><span className="field-number">{String(index+1).padStart(2,'0')}</span><b>{field.masteryEligibleCount}問</b></div><h2>{field.label}</h2><p className="muted">core：{field.coreQuestionIds.length}問{field.supportQuestionIds.length?<><br/>field-support：{field.supportQuestionIds.length}問</>:null}<br/>異なる4問で4/4：{field.fourStreakReady?'可能':'問題不足'}</p><Link className="button primary" to={`/remediate?field=${encodeURIComponent(field.fieldId)}&topic=${encodeURIComponent(field.label)}`}>この分野を練習</Link></article>
    )}</section>
    <section className="card"><h2>旧類題の扱い</h2><p>旧72問と既存の難易度別・過去問別類題は削除していません。既存attemptとともにlegacyとして保持し、内容同一性を確認せず新Level2へ履歴を移すことはありません。</p></section>
  </>
}
