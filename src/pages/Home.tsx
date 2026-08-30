import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { currentLearningPhase, latestExam, reinforcementComplete, routePhaseDone, sourceMistakeProgress } from '../learningRoute'
import { loadAttempts, loadExamScores, loadPreferences, savePreferences } from '../storage'
import { loadPrepState, runExamIntegrityCheck, savePrepState } from '../preflight'
import { buildTodayTasks } from '../dailyPlan'
import { gradeInTarget, storedExamItems, strategyForStoredExam, targetGoalLabel, targetProfile, weakFieldsForStoredExam } from '../targetStrategy'

type DraftState={phase?:'solve'|'mark';answers?:Record<string,string>;seconds?:number;majorIndex?:number}
function draftFor(year:number):DraftState|null{
  try{const drafts=JSON.parse(localStorage.getItem('waseshibu-math-exam-drafts-v2')||'{}');return drafts[String(year)]||null}catch{return null}
}
function hasDraftProgress(draft:DraftState|null){return !!draft&&(draft.phase==='mark'||Number(draft.seconds)>0||Object.values(draft.answers||{}).some(Boolean))}
function draftResume(){
  try{
    const drafts=JSON.parse(localStorage.getItem('waseshibu-math-exam-drafts-v2')||'{}'),entries=Object.entries(drafts) as [string,DraftState][]
    const marking=entries.find(([,x])=>x?.phase==='mark');if(marking)return {to:`/past-papers?year=${marking[0]}&review=1`,label:`${marking[0]}年度の採点を続ける`}
    const solving=entries.find(([,x])=>x?.phase==='solve'&&(Number(x.seconds)>0||Object.values(x.answers||{}).some(Boolean)));if(solving)return {to:`/past-papers?year=${solving[0]}`,label:`${solving[0]}年度の続きから`}
  }catch{/* no draft */}
  return null
}

const phases=[
  {n:1,title:'2024年度で診断'},
  {n:2,title:'2024年度の弱点を直す'},
  {n:3,title:'2025年度で改善確認'},
  {n:4,title:'残った弱点を直す'},
  {n:5,title:'2026年度で仕上がり確認'},
  {n:6,title:'仕上げ・任意演習'}
]

export default function Home(){
  const [prefs,setPrefs]=useState(loadPreferences())
  const phase=currentLearningPhase(),scores=loadExamScores(),attempts=loadAttempts(),prep=loadPrepState(),integrity=runExamIntegrityCheck()
  const latest=scores[0],exam24=latestExam(2024),exam25=latestExam(2025),exam26=latestExam(2026)
  const draft24=draftFor(2024),draft25=draftFor(2025),draft26=draftFor(2026)
  const source24=exam24?sourceMistakeProgress(2024,prefs.target):null,source25=exam25?sourceMistakeProgress(2025,prefs.target):null
  const weakLatest=latest?weakFieldsForStoredExam(prefs.target,latest,attempts):[]
  const targetStrategy=latest?strategyForStoredExam(prefs.target,latest,attempts):null
  const todayTasks=useMemo(()=>buildTodayTasks(prefs.target),[prefs.target])
  const prepInProgress=!prep.completed&&!prep.skipped&&(prep.index>0||Object.keys(prep.answers).length>0)
  const resume=draftResume()||(prepInProgress?{to:'/setup-check',label:`準備問題 ${prep.index+1}/5 から続ける`}:null)
  const setTarget=(target:60|70|75)=>{const next={...prefs,target};setPrefs(next);savePreferences(next)}

  const phaseAction=(n:number)=>{
    if(n===1){
      if(hasDraftProgress(draft24))return draft24?.phase==='mark'?{to:'/past-papers?year=2024&review=1',label:'採点を続ける'}:{to:'/past-papers?year=2024',label:'続きを解く'}
      return {to:'/past-papers?year=2024',label:exam24?'診断を更新する':'2024年度を解く'}
    }
    if(n===2){
      if(!exam24)return phaseAction(1)
      if(source24?.remainingIds.length)return {to:'/mistakes?year=2024',label:`元の誤答 ${source24.remainingIds.length}問を直す`}
      return {to:'/reinforce?source=2024',label:reinforcementComplete(2024)?'補強を復習する':'類題・旧年度で補強する'}
    }
    if(n===3){
      if(!reinforcementComplete(2024))return phaseAction(2)
      if(hasDraftProgress(draft25))return draft25?.phase==='mark'?{to:'/past-papers?year=2025&review=1',label:'採点を続ける'}:{to:'/past-papers?year=2025',label:'続きを解く'}
      return {to:'/past-papers?year=2025',label:exam25?'2025年度を再確認':'2025年度を解く'}
    }
    if(n===4){
      if(!exam25)return phaseAction(3)
      if(source25?.remainingIds.length)return {to:'/mistakes?year=2025',label:`元の誤答 ${source25.remainingIds.length}問を直す`}
      return {to:'/reinforce?source=2025',label:reinforcementComplete(2025)?'補強を復習する':'類題・旧年度で補強する'}
    }
    if(n===5){
      if(!reinforcementComplete(2025))return phaseAction(4)
      if(hasDraftProgress(draft26))return draft26?.phase==='mark'?{to:'/past-papers?year=2026&review=1',label:'採点を続ける'}:{to:'/past-papers?year=2026',label:'続きを解く'}
      return {to:'/past-papers?year=2026',label:exam26?'2026年度を再確認':'2026年度を解く'}
    }
    return {to:'/years',label:'任意で残り年度を演習する'}
  }

  const progression=resume||(!prep.completed&&!prep.skipped?{to:'/setup-check',label:'準備5問を確認する'}:phase<6?phaseAction(phase):null)
  const taskList=todayTasks.length?todayTasks:progression?[{id:'progression',kind:'past-paper' as const,title:progression.label,detail:'学習サイクルの次の1ステップ',to:progression.to,priority:1}]:[]
  const latestItems=latest?storedExamItems(latest,attempts):[]
  const q1Miss=latestItems.filter(x=>x.major===1&&x.status!=='correct'&&gradeInTarget(prefs.target,x.grade)).length

  return <>
    <section className={`card today-hero ${integrity.ok?'':'integrity-failed'}`}>
      <div className="today-head">
        <div><span className="eyebrow">TODAY · MAX 5 TASKS</span><h1>今日やること</h1><p>上から順に進めれば大丈夫です。弱点が多くても、今日の必須課題は最大5件に絞ります。</p></div>
        <div className="goal-block"><span>学習目標</span><strong>{targetGoalLabel(prefs.target)}</strong><small>目標と現在得点は別に管理</small></div>
      </div>
      <div className="target-row goal-selector"><span>目標を変更</span>{([60,70,75] as const).map((t,i)=><button key={t} className={`target-chip ${prefs.target===t?'selected':''}`} onClick={()=>setTarget(t)}>{String.fromCharCode(65+i)} {t}点</button>)}</div>
      {!integrity.ok?<div className="notice-box"><b>採点データを確認してください。</b><span>{integrity.issues[0]}</span></div>:taskList.length?
        <div className="today-list">{taskList.map((task,i)=><article key={task.id}><span>{i+1}</span><div><b>{task.title}</b><small>{task.detail}</small></div><Link className={i===0?'button primary':'button'} to={task.to}>{i===0?'今これをやる':'開く'}</Link></article>)}</div>
        :<div className="today-complete"><b>✓ 今日の数学は完了</b><p>必須課題はありません。追加したい場合だけ残り年度を確認してください。</p><Link className="button" to="/years">もう少し練習する</Link></div>}
    </section>

    <section className="grid three status-grid">
      <article className="card stat"><b>{latest?.score??'--'}</b><span>{latest?`${latest.year}年度の現在得点`:'過去問未実施'}</span></article>
      <article className="card stat"><b>{targetGoalLabel(prefs.target)}</b><span>現在の学習目標</span></article>
      <article className="card stat"><b>{q1Miss}</b><span>最新年度・大問1の優先失点</span></article>
    </section>

    <section className="card current-status">
      <div className="section-head"><div><span className="eyebrow">CURRENT STATUS</span><h2>現在の到達状況</h2></div>{targetStrategy&&<b>{targetStrategy.reached?'目標到達':'あと'+targetStrategy.gap+'点'}</b>}</div>
      <p>{targetProfile(prefs.target).summary}</p>
      {targetStrategy&&<div className="target-impact"><b>{targetGoalLabel(prefs.target)}方針</b><span>{targetStrategy.summary}</span></div>}
      <p className="muted">A＝60点、B＝70点、C＝75点。目標を変えても、これまでの得点・正誤・GuidedSolution・類題履歴は消しません。</p>
    </section>

    <section className="card weakness-direct">
      <div className="section-head"><div><span className="eyebrow">WEAKNESS → ACTION</span><h2>いま直す弱点</h2></div><Link to="/mistakes">すべて見る</Link></div>
      {targetStrategy?.candidates.length?<div className="weak-action-grid">{targetStrategy.candidates.map(c=><article key={c.key}><div><span className={`grade grade-${c.grade}`}>{c.grade}</span><b>{c.label}</b><small>{c.reason}・約{c.points}点</small></div><Link className="button primary" to={`/guided-review?q=${encodeURIComponent(c.key)}`}>この1問を直す</Link></article>)}</div>:weakLatest.length?<div className="weak-action-grid">{weakLatest.map(field=><article key={field}><div><b>{field}</b><small>最新過去問から抽出した目標範囲の弱点</small></div><Link className="button primary" to={`/remediate?topic=${encodeURIComponent(field)}`}>克服問題へ</Link></article>)}</div>:<p className="muted">目標範囲の優先弱点はまだありません。過去問を採点するとここに直接表示します。</p>}
    </section>

    <section className="card learning-route compact-route">
      <div className="section-head"><div><span className="eyebrow">PAST PAPER CYCLE</span><h2>過去問 → 弱点 → 類題 → 別年度</h2></div><b>PHASE {phase}/6</b></div>
      <div className="compact-phase-list">{phases.map(item=>{const done=routePhaseDone(item.n),active=item.n===phase,action=phaseAction(item.n);return <article key={item.n} className={`${done?'done':''} ${active?'active':''}`}><span>{done?'✓':item.n}</span><div><b>{item.title}</b><small>{active?'現在の推奨':done?'完了':'次の段階'}</small></div>{active&&<Link to={action.to}>{action.label}</Link>}</article>})}</div>
      <p className="muted">問題ランクA/B/Cと、本番中の「今解く／後回し／最後に戻る」は別の情報として扱います。</p>
    </section>

    <section className="card home-secondary"><div><h2>学習履歴・データ</h2><p className="muted">今日の課題より下に配置しています。アップデート時も既存履歴を非破壊で移行します。</p></div><div className="actions"><Link className="button" to="/report">学習履歴を見る</Link><Link className="button" to="/data">バックアップ・入出力</Link><Link className="button" to="/years">過去問一覧</Link></div></section>
  </>
}
