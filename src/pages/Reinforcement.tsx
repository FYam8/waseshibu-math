import { Link, useSearchParams } from 'react-router-dom'
import { latestExam, nextLearningAction, sourceMistakeProgress, sourcePracticeProgress } from '../learningRoute'
import { loadAttempts, loadPreferences } from '../storage'
import { storedExamItems, targetGoalLabel } from '../targetStrategy'
import { loadLevel2SessionSummaries } from '../level2ProgressView'
import { requiredPracticeCount } from '../practiceLoad'

export default function Reinforcement(){
  const [params]=useSearchParams(),rawSource=Number(params.get('source')||2024),source=rawSource>=2022&&rawSource<=2026?rawSource:2024
  const exam=latestExam(source),target=loadPreferences().target
  if(!exam)return <section className="card warning-card"><span className="eyebrow">DIAGNOSIS REQUIRED</span><h1>{source}年度の診断が先です</h1><p>全小問を採点すると、目標範囲の未解決問題と固定類題を表示します。</p><Link className="button primary" to={`/past-papers?year=${source}`}>{source}年度を解く</Link></section>

  const attempts=loadAttempts(),sourceProgress=sourceMistakeProgress(source,target)
  if(!sourceProgress.complete)return <>
    <div className="page-head"><div><span className="eyebrow">SOURCE QUESTION FIRST · {targetGoalLabel(target)}</span><h1>まず{source}年度で間違えた問題を直します</h1><p className="muted">元問題をヒントなしで再現できる状態にしてから、その元問題の固定類題へ進みます。</p></div><b className="route-status">残り {sourceProgress.remainingIds.length}問</b></div>
    <section className="card source-review-gate"><h2>元問題の直しが先です</h2><p>{targetGoalLabel(target)}目標で必須なのは「元問題の直し → 固定類題」です。2019〜2021年度の別枠演習は任意です。</p><div className="actions"><Link className="button primary" to={`/mistakes?year=${source}`}>未解決問題を直す</Link><Link className="button" to="/">ホームへ戻る</Link></div></section>
  </>

  const practice=sourcePracticeProgress(source,target),required=new Set(practice.requiredIds)
  const items=storedExamItems(exam,attempts).filter(item=>required.has(item.key))
  const sessions=loadLevel2SessionSummaries()
  const sessionFor=(id:string)=>sessions
    .filter(session=>session.triggerSourceQuestionId===id&&(!session.sourceAttemptAt||session.sourceAttemptAt>=exam.at))
    .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0]
  const nextAfterDone=practice.complete?nextLearningAction(target):null

  return <>
    <div className="page-head"><div><span className="eyebrow">FIXED PRACTICE · {targetGoalLabel(target)}</span><h1>{source}年度の固定類題</h1><p className="muted">元問題ごとに、開始時に固定した2〜4問を未正解の問題だけ周回します。</p></div><b className="route-status">{practice.complete?'本線補強完了':`${practice.completedIds.length}/${practice.requiredIds.length}セット完了`}</b></div>

    {items.length===0?<section className="card"><h2>必須の固定類題はありません</h2><p>現在の目標範囲では追加補強は不要です。次の年度へ進めます。</p>{nextAfterDone&&<Link className="button primary" to={nextAfterDone.to}>{nextAfterDone.label}</Link>}</section>:
      <div className="reinforce-fields">{items.map(item=>{
        const session=sessionFor(item.key),isDone=practice.completedIds.includes(item.key)
        const requiredCount=session?.requiredCount||requiredPracticeCount(item.key,'')
        const completedCount=isDone?requiredCount:Math.min(requiredCount,session?.completedQuestionIds.length||0)
        return <section className={`card reinforce-field ${isDone?'done':''}`} key={item.key}>
          <div className="section-head"><div><span className="eyebrow">SOURCE QUESTION</span><h2>{source}年度 大問{item.major}（{item.subNo}）</h2></div><b>{completedCount}/{requiredCount}</b></div>
          <p><b>{item.topic}</b>の固定類題。元問題ごとの完了状態を独立して管理します。</p>
          <div className="progress-track"><i style={{width:`${requiredCount?completedCount/requiredCount*100:0}%`}}/></div>
          <div className="actions"><Link className={`button ${isDone?'':'primary'}`} to={`/remediate?topic=${encodeURIComponent(item.topic)}&source=${source}&q=${encodeURIComponent(item.key)}`}>{isDone?'任意でもう一度':'固定類題を続ける'}</Link></div>
          <p className="muted">誤答しても必要問題数は増えません。正解済み問題は維持し、未正解問題だけを再挑戦します。</p>
        </section>
      })}</div>}

    <section className={`card route-complete ${practice.complete?'done':''}`}><h2>{practice.complete?'本線の補強が完了しました':'固定類題を完了すると次年度へ進めます'}</h2><p>{practice.complete?'この年度の必須補強は完了です。完了後の再練習はエクストラ扱いで、残日数には戻しません。':'元問題ごとの固定類題を順に完了します。'}</p>{practice.complete&&nextAfterDone?<Link className="button primary" to={nextAfterDone.to}>{nextAfterDone.label}</Link>:<Link className="button" to="/">ホームで進捗を見る</Link>}</section>

    <section className="card optional-old-years"><div className="section-head"><div><span className="eyebrow">EXTRA · OPTIONAL</span><h2>2019〜2021年度の追加演習</h2></div><b>残日数には含めません</b></div><p>時間に余裕があるときだけ取り組む別枠の演習です。未完了でも本線の次年度へ進めます。</p><p className="muted">固定類題セットの中に2019〜2021年度の公式問題が含まれる場合は、その固定セットの1問として通常どおり完了が必要です。</p><div className="actions"><Link className="button" to="/past-papers?year=2019">2019年度</Link><Link className="button" to="/past-papers?year=2020">2020年度</Link><Link className="button" to="/past-papers?year=2021">2021年度</Link></div></section>
  </>
}
