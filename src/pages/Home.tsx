import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { currentLearningPhase, firstUnresolvedSource, latestExam, latestMainCheckExam, nextLearningAction, optionalOldYearDraftAction, routePhaseDone } from '../learningRoute'
import { loadAttempts, loadPreferences, savePreferences } from '../storage'
import { loadPrepState, runExamIntegrityCheck } from '../preflight'
import { buildNextDayTasks, buildOptionalNextTask, buildTodayTasks, nextDayPlanSummary, startNextDayPlan, todayPlanSummary } from '../dailyPlan'
import { gradeInTarget, storedExamItems, strategyForStoredExam, targetGoalLabel, targetProfile, weakFieldsForStoredExam } from '../targetStrategy'
import { buildGoalDayEstimates } from '../targetEta'
import { inProgressLevel2Sessions } from '../level2History'
import { level2FieldById } from '../data/level2Data'

const phases=[
  {n:1,title:'2024年度で診断'},
  {n:2,title:'2024年度の弱点を修正・補強'},
  {n:3,title:'2023年度で改善確認①'},
  {n:4,title:'2022年度で改善確認②'},
  {n:5,title:'2025年度で実戦確認'},
  {n:6,title:'2026年度で最終確認'}
]

export default function Home(){
  const [prefs,setPrefs]=useState(loadPreferences())
  const [aheadTick,setAheadTick]=useState(0)
  const [etaTick,setEtaTick]=useState(0)
  useEffect(()=>{
    const refresh=()=>setEtaTick(x=>x+1)
    window.addEventListener('storage',refresh)
    window.addEventListener('focus',refresh)
    window.addEventListener('waseshibu-route-change',refresh)
    return()=>{window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh);window.removeEventListener('waseshibu-route-change',refresh)}
  },[])

  const phase=currentLearningPhase(),attempts=loadAttempts(),prep=loadPrepState(),integrity=runExamIntegrityCheck()
  const latest=latestMainCheckExam()
  const weakLatest=latest?weakFieldsForStoredExam(prefs.target,latest,attempts):[]
  const targetStrategy=latest?strategyForStoredExam(prefs.target,latest,attempts):null
  const unresolved=firstUnresolvedSource(prefs.target)
  const recoveryExam=unresolved?latestExam(unresolved.year):null
  const recoveryStrategy=recoveryExam?strategyForStoredExam(prefs.target,recoveryExam,attempts):null
  const activeRecoveryCandidates=recoveryStrategy?.candidates.filter(c=>unresolved?.remainingIds.includes(c.key)).slice(0,3)||[]
  const goalDayEstimates=useMemo(()=>buildGoalDayEstimates(),[prefs.target,etaTick])
  const prepInProgress=!prep.completed&&!prep.skipped&&(prep.index>0||Object.keys(prep.answers).length>0)
  const optionalOldDraft=optionalOldYearDraftAction()
  const activeRemediations=inProgressLevel2Sessions().filter(item=>{
    const match=item.triggerSourceQuestionId?.match(/^(\d{4})-/)
    const year=match?Number(match[1]):0
    return year>=2022&&year<=2026
  })
  const preferredRemediation=activeRemediations.find(item=>unresolved&&item.triggerSourceQuestionId?.startsWith(`${unresolved.year}-`))||activeRemediations[0]
  const preferredRemediationField=preferredRemediation?level2FieldById.get(preferredRemediation.fieldIdAtSessionStart):undefined
  const preferredRemediationYear=preferredRemediation?.triggerSourceQuestionId?Number(preferredRemediation.triggerSourceQuestionId.slice(0,4)):undefined
  const preferredRemediationMatch=preferredRemediation?.triggerSourceQuestionId?.match(/^(\d{4})-Q(\d+)-(.+)$/)
  const preferredRemediationSourceLabel=preferredRemediationMatch?`${preferredRemediationMatch[1]}年度 大問${preferredRemediationMatch[2]}（${preferredRemediationMatch[3]}）`:preferredRemediation?.triggerSourceQuestionId
  const remediationResume=preferredRemediation?{
    to:`/remediate?topic=${encodeURIComponent(preferredRemediationField?.label||preferredRemediation.fieldIdAtSessionStart)}&source=${preferredRemediationYear}&q=${encodeURIComponent(preferredRemediation.triggerSourceQuestionId||'')}`,
    label:`${preferredRemediationField?.label||'弱点'}の類題 ${preferredRemediation.completedQuestionIds.length}/${preferredRemediation.requiredCount} の続き`
  }:null
  const resume=prepInProgress?{to:'/setup-check',label:`準備問題 ${prep.index+1}/5 から続ける`}:null
  const setTarget=(target:60|70|75)=>{const next={...prefs,target};setPrefs(next);savePreferences(next)}

  const routeAction=nextLearningAction(prefs.target)
  const progression=resume||(!prep.completed&&!prep.skipped?{to:'/setup-check',label:'準備5問を確認する'}:routeAction)
  const progressionTask=progression?{id:`progression:${progression.to}`,kind:'past-paper' as const,title:progression.label,detail:'学習サイクルの次の1ステップ',to:progression.to,priority:1}:undefined
  const todayTasks=useMemo(()=>buildTodayTasks(prefs.target,new Date(),progressionTask),[prefs.target,progressionTask?.id])
  const todaySummary=useMemo(()=>todayPlanSummary(prefs.target,new Date(),progressionTask),[prefs.target,progressionTask?.id,todayTasks.length])
  const optionalNext=useMemo(()=>buildOptionalNextTask(prefs.target,new Date(),progressionTask),[prefs.target,progressionTask?.id,todayTasks.length])
  const nextDaySummary=useMemo(()=>nextDayPlanSummary(prefs.target,new Date(),progressionTask),[prefs.target,progressionTask?.id,todayTasks.length,aheadTick])
  const nextDayTasks=useMemo(()=>buildNextDayTasks(prefs.target,new Date(),progressionTask),[prefs.target,progressionTask?.id,todayTasks.length,aheadTick])
  const startAhead=()=>{startNextDayPlan(prefs.target,new Date(),progressionTask);setAheadTick(x=>x+1)}
  const taskList=todayTasks
  const primaryQueueTask=taskList[0]||optionalNext||progressionTask
  const latestItems=latest?storedExamItems(latest,attempts):[]
  const q1Miss=latest&&latestItems.length?latestItems.filter(x=>x.major===1&&x.status!=='correct'&&gradeInTarget(prefs.target,x.grade)).length:'--'

  return <>
    <section className={`card today-hero ${integrity.ok?'':'integrity-failed'}`}>
      <div className="today-head">
        <div><span className="eyebrow">TODAY · MAX 10 TASKS</span><h1>今日やること</h1><p>上から順に進めれば大丈夫です。弱点が多くても、今日の必須課題は最大10件に絞ります。終わった後は、時間があれば任意で先へ進めます。</p></div>
        <div className="goal-block"><span>学習目標</span><strong>{targetGoalLabel(prefs.target)}</strong><small>目標と現在得点は別に管理</small></div>
      </div>
      <div className="target-row goal-selector"><span>目標を変更</span>{([60,70,75] as const).map((t,i)=><button key={t} className={`target-chip ${prefs.target===t?'selected':''}`} onClick={()=>setTarget(t)}>{String.fromCharCode(65+i)} {t}点</button>)}</div>
      <div className="goal-eta" aria-label="学習目標ごとの残り問題数">
        {goalDayEstimates.map(estimate=><article key={estimate.target} className={prefs.target===estimate.target?'selected':''}>
          <div><b>{estimate.label}</b><small>残り {estimate.remainingQuestions}問｜1日10問ペース</small></div>
          <strong>{estimate.complete?'本線完了':`あと${estimate.days}日`}</strong>
        </article>)}
      </div>
      <p className="goal-eta-note">過去問の直し・固定類題の予約分を先に含めています。正解すると不要な予約分もまとめて減ります。別枠の2019〜2021年度追加演習は含みません。</p>
      {!integrity.ok?<div className="notice-box"><b>採点データを確認してください。</b><span>{integrity.issues[0]}</span></div>:taskList.length?
        <>
          <div className="today-list">{taskList.map((task,i)=><article key={task.id}><span>{i+1}</span><div><b>{task.title}</b><small>{task.detail}</small></div><Link className={i===0?'button primary':'button'} to={task.to}>{i===0?'今これをやる':'開く'}</Link></article>)}</div>
          <div className="today-more"><span>まず今日の必須課題を終えます。追加演習は完了後に表示します。</span></div>
        </>
        :<>
          <div className="today-complete">
            <b>{remediationResume?'✓ 今日の予定分は完了しました':'✓ 本日の必須課題は完了です'}</b>
            <p>ここで終えても大丈夫です。追加の学習は任意です。</p>
            <p>{remediationResume?`学習全体には続きがあります。途中の類題は ${preferredRemediation?.completedQuestionIds.length||0}/${preferredRemediation?.requiredCount||0} で保存済みです。次回も同じ固定セットから再開できます。`:'今日の必須課題は完了です。学習全体に続きがある場合は「次のアクション」から進められます。'}</p>
            <div className="actions"><Link className="button" to={optionalNext?.to||'/years'}>{optionalNext?'時間があれば次のアクションへ':'時間があれば先へ進む'}</Link>{!nextDaySummary.started&&<button className="button" type="button" onClick={startAhead}>次の日の分も先取りする</button>}</div>
            {optionalNext&&<small>次のアクション：{optionalNext.title}</small>}
          </div>
          {nextDaySummary.started&&<div className="study-ahead"><div className="section-head"><div><span className="eyebrow">STUDY AHEAD · MAX 10 TASKS</span><h2>{nextDaySummary.date} の分を先取り</h2></div><b>{nextDayTasks.length?`残り ${nextDayTasks.length}件`:'完了'}</b></div>{nextDayTasks.length?<div className="today-list">{nextDayTasks.map((task,i)=><article key={`ahead-${task.id}`}><span>{i+1}</span><div><b>{task.title}</b><small>{task.detail}</small></div><Link className={i===0?'button primary':'button'} to={task.to}>{i===0?'今これをやる':'開く'}</Link></article>)}</div>:<div className="today-complete"><b>✓ 次の日の分も完了</b><p>先取り分まで完了しました。ここで終了して大丈夫です。翌日は、この先取り結果を引き継いで同じ課題を重複して出しません。</p></div>}</div>}
        </>}
    </section>

    <section className="grid three status-grid">
      <article className="card stat"><b>{latest?.score??'--'}</b><span>{latest?`${latest.year}年度の現在得点`:'過去問未実施'}</span>{latest&&<small>{latest.scoreValidity==='reference'?'参考スコア（初見比較には使わない）':latest.scoreValidity==='first-look'?'初見スコア':'記録スコア'}</small>}</article>
      <article className="card stat"><b>{targetGoalLabel(prefs.target)}</b><span>現在の学習目標</span></article>
      <article className="card stat"><b>{q1Miss}</b><span>最新年度・大問1の優先失点</span></article>
    </section>

    {remediationResume&&<section className="card remediation-resume-card"><div className="section-head"><div><span className="eyebrow">IN-PROGRESS REMEDIATION</span><h2>{preferredRemediationField?.label||'弱点'}の類題を続ける</h2></div><b>{preferredRemediation?.completedQuestionIds.length}/{preferredRemediation?.requiredCount}</b></div><p>{preferredRemediationSourceLabel}の弱点補強が途中です。正式な進捗は保存済みです。</p><div className="actions"><Link className="button primary" to={remediationResume.to}>類題 {preferredRemediation?.completedQuestionIds.length}/{preferredRemediation?.requiredCount} の続きから</Link></div></section>}
    <section className="card current-status"><div className="section-head"><div><span className="eyebrow">CURRENT STATUS</span><h2>現在の到達状況</h2></div>{targetStrategy&&<b>{targetStrategy.reached?'目標到達':'あと'+targetStrategy.gap+'点'}</b>}</div><p>{targetProfile(prefs.target).summary}</p>{targetStrategy&&<div className="target-impact"><b>{targetGoalLabel(prefs.target)}方針</b><span>{targetStrategy.summary}</span></div>}<p className="muted">A＝60点、B＝70点、C＝75点。目標を変えても、これまでの得点・正誤・GuidedSolution・類題履歴は消しません。</p>{latest&&latestItems.length===0&&<p className="muted">この得点は得点記録のみです。弱点や大問1の失点数を出すには、過去問をアプリで小問別に採点してください。</p>}</section>

    <section className="card weakness-direct"><div className="section-head"><div><span className="eyebrow">WEAKNESS → ACTION</span><h2>いま直す弱点</h2></div><Link to={unresolved?`/mistakes?year=${unresolved.year}`:'/mistakes'}>すべて見る</Link></div>{unresolved&&activeRecoveryCandidates.length?<><p className="muted">{unresolved.year}年度の未解決 {unresolved.total}問（誤答 {unresolved.wrong}問・未回答 {unresolved.unanswered}問）のうち、優先度の高い{activeRecoveryCandidates.length}問を表示しています。</p><div className="weak-action-grid">{activeRecoveryCandidates.map(c=><article key={c.key}><div><span className={`grade grade-${c.grade}`}>{c.grade}</span><b>{c.label}</b><small>{c.reason}・約{c.points}点</small></div><Link className="button primary" to={`/guided-review?q=${encodeURIComponent(c.key)}`}>この1問を直す</Link></article>)}</div></>:unresolved?<div className="weakness-cleared"><b>{unresolved.year}年度に未解決問題があります</b><p className="muted">現在の推奨は「{primaryQueueTask?.title||progression.label}」です。</p><Link className="button primary" to={primaryQueueTask?.to||progression.to}>次のアクションへ</Link></div>:weakLatest.length?<div className="weak-action-grid">{weakLatest.map(field=><article key={field}><div><b>{field}</b><small>最新過去問から抽出した目標範囲の弱点</small></div><Link className="button primary" to={`/remediate?topic=${encodeURIComponent(field)}`}>克服問題へ</Link></article>)}</div>:<div className="weakness-cleared"><b>現在の未解決元問題はありません</b><p className="muted">現在の推奨は「{primaryQueueTask?.title||progression.label}」です。</p><Link className="button primary" to={primaryQueueTask?.to||progression.to}>次のアクションへ</Link></div>}</section>

    <section className="card learning-route compact-route"><div className="section-head"><div><span className="eyebrow">PAST PAPER CYCLE</span><h2>2024診断 → 2023改善確認① → 2022改善確認② → 2025実戦確認 → 2026最終確認</h2></div><b>PHASE {phase}/6</b></div><div className="compact-phase-list">{phases.map(item=>{const done=routePhaseDone(item.n),active=item.n===phase;return <article key={item.n} className={`${done?'done':''} ${active?'active':''}`}><span>{done?'✓':item.n}</span><div><b>{item.title}</b><small>{active?'現在の推奨':done?'完了':'次の段階'}</small></div>{active&&<Link to={primaryQueueTask?.to||progression.to}>{primaryQueueTask?.title||progression.label}</Link>}</article>})}</div><p className="muted">2019〜2021年度の別枠演習はエクストラです。未完了でも本線を進められ、残日数にも含めません。固定類題セットの中に旧年度の公式問題が含まれる場合は、その固定セットの1問として扱います。</p>{optionalOldDraft&&<div className="weakness-cleared"><b>中断中の任意演習：{optionalOldDraft.label}</b><p className="muted">現在の必須学習とは別枠です。時間があるときに再開できます。</p><Link className="button" to={optionalOldDraft.to}>任意演習を再開</Link></div>}</section>

    <section className="card home-secondary"><div><h2>学習履歴・データ</h2><p className="muted">今日の課題より下に配置しています。アップデート時も既存履歴を非破壊で移行します。</p></div><div className="actions"><Link className="button" to="/report">学習履歴を見る</Link><Link className="button" to="/data">バックアップ・入出力</Link><Link className="button" to="/years">過去問一覧</Link></div></section>
  </>
}
