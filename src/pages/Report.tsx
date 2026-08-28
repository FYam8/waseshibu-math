import { useMemo, useState } from 'react'
import {
  clearAttempts, clearExamScores, createRecordId, loadAttempts, loadExamScores,
  loadPreferences, saveExamScore
} from '../storage'

export default function Report() {
  const [version,setVersion]=useState(0)
  const [year,setYear]=useState(2026)
  const [score,setScore]=useState('')
  const attempts=useMemo(()=>loadAttempts(),[version])
  const examScores=useMemo(()=>loadExamScores(),[version])
  const prefs=loadPreferences()

  const scored=attempts.filter(a=>a.status!=='deferred')
  const correct=scored.filter(a=>a.status==='correct').length
  const wrong=scored.filter(a=>a.status==='wrong').length
  const deferred=attempts.filter(a=>a.status==='deferred').length
  const rate=scored.length?Math.round(correct/scored.length*100):0

  const q1Recent=attempts.filter(a=>a.questionId.startsWith('field-') && a.status!=='deferred').slice(0,8)
  const q1Correct=q1Recent.filter(a=>a.status==='correct').length
  const reviewResult=q1Recent.length===8?`${q1Correct}/8`:null

  const tagCounts=attempts
    .filter(a=>a.status==='wrong' && a.mistakeTag)
    .reduce<Record<string,number>>((acc,a)=>{
      acc[a.mistakeTag!]=(acc[a.mistakeTag!]||0)+1
      return acc
    },{})
  const ranking=(Object.entries(tagCounts) as [string,number][]).sort((a,b)=>b[1]-a[1])

  const topicCounts=attempts
    .filter(a=>a.status==='wrong')
    .reduce<Record<string,number>>((acc,a)=>{
      acc[a.topic]=(acc[a.topic]||0)+1
      return acc
    },{})
  const topicRanking=(Object.entries(topicCounts) as [string,number][])
    .filter(([topic])=>topic!=='旧データ')
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)

  const latest=examScores[0]??null
  const todoTopics:[string,number][]=latest?.weakFields?.length?latest.weakFields.map(x=>[x,1]):topicRanking.length?topicRanking:[['2024年度の診断',1]]
  const latestScore=latest?.score ?? null
  const stage =
    latestScore===null ? '未判定' :
    latestScore<50 ? '50点未満' :
    latestScore<60 ? '50〜59点' :
    latestScore<70 ? '60〜69点' :
    latestScore<=75 ? '70〜75点' : '75点以上'

  const addScore=()=>{
    const n=Number(score)
    if(!Number.isFinite(n)||n<0||n>100)return
    saveExamScore({
      id:createRecordId(`exam-${year}`),
      year,
      score:Math.round(n),
      at:new Date().toISOString()
    })
    setScore('')
    setVersion(v=>v+1)
  }

  const advice =
    latestScore===null
      ? 'まず実際の過去問を1年分解き、100点満点の得点を記録すると現在段階を判定できます。'
      : latestScore<50
      ? 'まず60点。大問1の基礎・標準処理と、大問2〜5の（1）を優先します。'
      : latestScore<60
      ? '60点突破が最優先。本来取れたA問題の失点を確認し、弱点単元を絞ります。'
      : latestScore<70
      ? '65〜70点の安定を目標に、標準問題の完成度と時間配分を高めます。'
      : latestScore<=75
      ? '70〜75点の再現性を優先。C問題への深追いより、A/Bの取りこぼし防止を重視します。'
      : '数学の超難問対策を最優先にせず、安定維持と国語・英語との学習バランスも検討します。'

  return (
    <>
      <div className="page-head">
        <div><span className="eyebrow">SCORE STRATEGY</span><h1>弱点・得点記録</h1></div>
      </div>

      <section className="card score-entry">
        <div>
          <h2>実際に解いた過去問の得点を記録</h2>
          <p className="muted">この記録だけを100点満点の「現在段階」判定に使います。</p>
        </div>
        <div className="score-form">
          <select value={year} onChange={e=>setYear(Number(e.target.value))}>
            {[2026,2025,2024,2023,2022,2021,2020,2019].map(y=><option key={y} value={y}>{y}年度</option>)}
          </select>
          <input inputMode="numeric" value={score} onChange={e=>setScore(e.target.value)} placeholder="得点 0〜100" />
          <button className="button primary" onClick={addScore}>記録</button>
        </div>
      </section>

      <section className="grid four">
        <article className="card stat"><b>{latestScore ?? '--'}</b><span>最新の過去問得点</span></article>
        <article className="card stat"><b>{latest?.reproducibleScore ?? '--'}</b><span>再現可能得点</span></article>
        <article className="card stat"><b>{latest?.recoverableScore===undefined?'--':`+${latest.recoverableScore}`}</b><span>回収可能得点</span></article>
        <article className="card stat"><b>{latest?.timeCandidateScore ?? '--'}</b><span>時間候補（別枠）</span></article>
      </section>

      <section className="grid three">
        <article className="card stat"><b className="stage-text">{stage}</b><span>現在の段階</span></article>
        <article className="card stat"><b>{reviewResult??'--'}</b><span>直近の弱点復習8問</span></article>
        <article className="card stat"><b>{deferred}</b><span>見送り記録</span></article>
      </section>

      <section className="card">
        <h2>練習の失点原因</h2>
        {ranking.length===0?<p className="muted">まだ失点分類データがありません。</p>:(
          <div className="bars">
            {ranking.map(([tag,count])=>(
              <div className="barrow" key={tag}>
                <span>{tag}</span>
                <div className="bar"><i style={{width:`${Math.max(8,count/ranking[0][1]*100)}%`}} /></div>
                <b>{count}</b>
              </div>
            ))}
          </div>
        )}
        <p className="muted">練習正答率：{scored.length?`${rate}%（${correct}/${scored.length}）`:'データなし'}。見送りは正誤率から除外します。</p>
      </section>

      <section className="card">
        <h2>次にやる3項目</h2>
        <div className="todo-list">
          {todoTopics.map(([topic],i)=>(
            <div key={topic}><b>{i+1}</b><span>{topic}</span></div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>現在の学習判断</h2>
        <p>{advice}</p>
        <p className="muted">目標設定：{prefs.target}点。これは公式の合格最低点ではなく、学習上の目安です。</p>
      </section>

      <section className="card">
        <div className="section-head"><h2>過去問得点履歴</h2>
          <button className="button danger" onClick={()=>{clearExamScores();setVersion(v=>v+1)}}>得点履歴を削除</button>
        </div>
        {examScores.length===0?<p className="muted">まだ記録がありません。</p>:(
          <div className="history-list">
            {examScores.slice(0,10).map(x=><div key={x.id}><span>{x.year}年度　{x.attemptKind==='retake'?'再受験':'初回・記録'}</span><b>{x.score}/100{x.reproducibleScore!==undefined?`　再現 ${x.reproducibleScore}`:''}</b></div>)}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-head"><h2>練習履歴の管理</h2>
          <button className="button danger" onClick={()=>{clearAttempts();setVersion(v=>v+1)}}>練習履歴を削除</button>
        </div>
        <p className="muted">端末内へ即時保存します。機種変更やバックアップには「データ管理」からJSONファイルを書き出してください。</p>
      </section>
    </>
  )
}
