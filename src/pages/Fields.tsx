import { Link } from 'react-router-dom'
import { level2Fields } from '../data/level2Data'

export default function Fields(){
  return <>
    <div className="page-head"><div><span className="eyebrow">18 FIELDS · OFFICIAL + LEVEL 2</span><h1>18分野の補強問題</h1><p className="muted">2019〜2021年度の公式過去問60問、2022〜2026年度由来のオリジナル類題100問、因数分解support 2問を使います。旧オリジナル60問はバックログとして保存し、現在は出題しません。</p></div><b className="streak-badge">出題可能 162問</b></div>
    <section className="card notice-box"><b>基本は過去問が先です。</b><br/>過去問を間違えた直後は、カテゴリ検索ではなく sourceQuestionId に対応する直結Level2から開始します。この一覧から分野練習もできます。</section>
    <section className="field-grid">{level2Fields.map((field,index)=>
      <article className="card field-card" key={field.fieldId}><div className="section-head"><span className="field-number">{String(index+1).padStart(2,'0')}</span><b>{field.masteryEligibleCount}問</b></div><h2>{field.label}</h2><p className="muted">オリジナル：{field.coreQuestionIds.length}問{field.officialPastQuestionIds?.length?<><br/>公式過去問：{field.officialPastQuestionIds.length}問</>:null}{field.supportQuestionIds.length?<><br/>field-support：{field.supportQuestionIds.length}問</>:null}<br/>異なる4問で4/4：{field.fourStreakReady?'可能':'問題不足'}</p><Link className="button primary" to={`/remediate?field=${encodeURIComponent(field.fieldId)}&topic=${encodeURIComponent(field.label)}`}>この分野を練習</Link></article>
    )}</section>
    <section className="card"><h2>旧類題の扱い</h2><p>旧72問と2019〜2021年度由来のオリジナル60問は削除していません。既存attemptとともにバックログ・legacyとして保持し、内容同一性を確認せず公式過去問へ履歴を移すことはありません。</p></section>
  </>
}
