import { Link } from 'react-router-dom'
import { useState } from 'react'
import { currentLearningPhase, latestExam, reinforcementComplete, routePhaseDone, sourceMistakeProgress } from '../learningRoute'
import { loadAttempts, loadExamScores, loadPreferences, savePreferences } from '../storage'
import { loadPrepState, runExamIntegrityCheck, savePrepState } from '../preflight'
import { gradeInTarget, storedExamItems, strategyForStoredExam, targetProfile, weakFieldsForStoredExam } from '../targetStrategy'

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
  {n:2,title:'2024年度の弱点を直す'},
  {n:3,title:'2025年度で改善確認'},
  {n:4,title:'残った弱点を直す'},
  {n:5,title:'2026年度で仕上がり確認'},
  {n:6,title:'2019〜2023年度の残りを演習'}
]

export default function Home(){
  const [prefs,setPrefs]=useState(loadPreferences()),phase=currentLearningPhase(),scores=loadExamScores(),attempts=loadAttempts(),prep=loadPrepState(),integrity=runExamIntegrityCheck()
  const latest=scores[0],exam24=latestExam(2024),exam25=latestExam(2025),exam26=latestExam(2026)
  const draft24=draftFor(2024),draft25=draftFor(2025),draft26=draftFor(2026)
  const source24=exam24?sourceMistakeProgress(2024,prefs.target):null,source25=exam25?sourceMistakeProgress(2025,prefs.target):null
  const weak24=exam24?weakFieldsForStoredExam(prefs.target,exam24,attempts):[],weak25=exam25?weakFieldsForStoredExam(prefs.target,exam25,attempts):[]
  const items24=exam24?storedExamItems(exam24,attempts):[]
  const deferred24=items24.filter(item=>item.status!=='correct'&&!gradeInTarget(prefs.target,item.grade)).length
  const targetStrategy=latest?strategyForStoredExam(prefs.target,latest,attempts):null
  const prepInProgress=!prep.completed&&!prep.skipped&&(prep.index>0||Object.keys(prep.answers).length>0)
  const resume=draftResume()||(prepInProgress?{to:'/setup-check',label:`準備問題 ${prep.index+1}/5 から続ける`}:null)
  const setTarget=(target:60|70|75)=>{const next={...prefs,target};setPrefs(next);savePreferences(next)}

  const phaseAction=(n:number)=>{
    if(n===1){
      if(hasDraftProgress(draft24))return draft24?.phase==='mark'?{to:'/past-papers?year=2024&review=1',label:'採点を続ける'}:{to:'/past-papers?year=2024',label:exam24?'診断更新の続きを解く':'続きから解く'}
      if(!exam24)return {to:'/past-papers?year=2024',label:'診断テストを始める'}
      if(source24&&source24.remainingIds.length)return {to:'/mistakes?year=2024',label:`優先${source24.remainingIds.length}問の間違い直しを始める`}
      return {to:'/report',label:'診断結果を見る'}
    }
    if(n===2){
      if(!exam24)return {to:'/past-papers?year=2024',label:'2024年度の診断から'}
      if(source24&&source24.remainingIds.length)return {to:'/mistakes?year=2024',label:`元の間違い${source24.remainingIds.length}問を直す`}
      return {to:'/reinforce?source=2024',label:reinforcementComplete(2024)?'補強を復習する':'旧年度＋類題へ進む'}
    }
    if(n===3){
      if(!reinforcementComplete(2024))return phaseAction(2)
      if(hasDraftProgress(draft25))return draft25?.phase==='mark'?{to:'/past-papers?year=2025&review=1',label:'採点を続ける'}:{to:'/past-papers?year=2025',label:'続きから解く'}
      return {to:'/past-papers?year=2025',label:exam25?'診断を更新する':'2025年度を解く'}
    }
    if(n===4){
      if(!exam25)return {to:'/past-papers?year=2025',label:'2025年度の確認から'}
      if(source25&&source25.remainingIds.length)return {to:'/mistakes?year=2025',label:`元の間違い${source25.remainingIds.length}問を直す`}
      return {to:'/reinforce?source=2025',label:reinforcementComplete(2025)?'補強を復習する':'旧年度＋類題へ進む'}
    }
    if(n===5){
      if(!reinforcementComplete(2025))return phaseAction(4)
      if(hasDraftProgress(draft26))return draft26?.phase==='mark'?{to:'/past-papers?year=2026&review=1',label:'採点を続ける'}:{to:'/past-papers?year=2026',label:'続きから解く'}
      return {to:'/past-papers?year=2026',label:exam26?'仕上がりを再確認する':'2026年度を解く'}
    }
    return exam26?{to:'/years',label:'残り年度を演習する'}:{to:'/past-papers?year=2026',label:'2026年度の確認から'}
  }

  const primary=resume||(!prep.completed&&!prep.skipped?{to:'/setup-check',label:'準備5問から始める'}:phaseAction(phase))
  const diagDone=!!exam24,diagUpdating=diagDone&&hasDraftProgress(draft24)
  const diagStatus=!diagDone?(hasDraftProgress(draft24)?draft24?.phase==='mark'?'解答済み・採点待ち':'途中':'未着手'):diagUpdating?'診断更新中':'診断完了'

  return <>
    <section className={`hero card route-hero ${integrity.ok?'':'integrity-failed'}`}><div><span className="eyebrow">PASS ROUTE · 60–75 POINTS</span><h1>{resume?'今日も、続きから少しずつ。':'次にやることは、1つだけ。'}</h1><p>2024年度で診断し、まず元の間違いを直してから旧年度問題・類題へ進み、2025・2026年度で改善を確認します。</p><div className="integrity-line">{integrity.ok?<><b>✓ 採点データ確認済み</b><span>全{integrity.answerCount}問・2024年度{integrity.year2024Count}問</span></>:<><b>採点データに問題があります</b><span>{integrity.issues[0]}</span></>}</div><div className="target-row"><span>学習目標</span>{[60,70,75].map(t=><button key={t} className={`target-chip ${prefs.target===t?'selected':''}`} onClick={()=>setTarget(t as 60|70|75)}>{t}点</button>)}</div><div className="target-impact"><b>{prefs.target}点方針</b><span>{targetProfile(prefs.target).summary}</span>{targetStrategy&&<em>{targetStrategy.reached?'目標到達済み':`最新得点からあと${targetStrategy.gap}点`}</em>}</div><div className="actions">{integrity.ok&&<Link className="button primary next-action" to={primary.to}>{primary.label}</Link>}{integrity.ok&&!prep.completed&&!prep.skipped&&<Link className="button" to="/past-papers?year=2024" onClick={()=>savePrepState({...prep,skipped:true})}>準備を後回しにして2024年度へ</Link>}<a className="button" href="#step-selector">学習フェーズを見る</a></div></div><div className="score-orb"><strong>{latest?.score??'--'}</strong><span>{latest?`${latest.year}年度 実得点`:'診断前'}</span></div></section>

    <section className="card learning-route" id="step-selector"><div className="section-head"><div><span className="eyebrow">PREPARATION + 6 LEARNING PHASES</span><h2>同じ画面へ行く重複ステップをなくしました</h2></div><b>推奨 PHASE {phase}/6</b></div>
      <div className="route-grid route-grid-unified"><article className={`${prep.completed?'done':''} ${!prep.completed&&!prep.skipped?'active':''}`}><span>{prep.completed?'✓':'準'}</span><div><b>入力・自動採点チェック5問</b><small>{prep.completed?'完了':prep.skipped?'後回し':'最初に推奨'}</small></div><Link to="/setup-check">{prepInProgress?'続き':'開く'}</Link></article>
        <article className={`diagnosis-route-card ${diagDone?'done':''} ${phase===1&&(prep.completed||prep.skipped)?'active':''}`}><span>{diagDone?'✓':'1'}</span><div className="diagnosis-route-main"><b>2024年度 診断テスト</b><small>{diagStatus}</small>{exam24&&<div className="diagnosis-summary"><strong>{exam24.score}<em>/100点</em></strong><span>{prefs.target}点目標：優先要復習 {source24?.remainingIds.length||0}問</span>{deferred24>0&&<span>B・C等の目標外 {deferred24}問は後回し</span>}{weak24.length>0&&<span>弱点：{weak24.join(' / ')}</span>}</div>}{diagUpdating&&<p className="route-warning-text">新しい診断を途中まで進めています。完了するまでは現在の診断結果も保持されます。</p>}{exam24&&!diagUpdating&&<p className="route-warning-text">「診断を更新」して再採点すると、以後の弱点補強は新しい結果が基準になります。過去の得点・履歴は削除しません。</p>}<div className="route-card-actions"><Link className="button primary" to={phaseAction(1).to}>{phaseAction(1).label}</Link>{exam24&&<Link className="button" to="/report">弱点分析を見る</Link>}{exam24&&!diagUpdating&&<Link className="button ghost" to="/past-papers?year=2024">診断を更新してもう一度受ける</Link>}</div></div></article>
        {phases.map(item=>{const done=routePhaseDone(item.n),active=item.n===phase&&(prep.completed||prep.skipped),action=phaseAction(item.n);let detail='';if(item.n===2)detail=!exam24?'2024年度の診断が必要':source24?.remainingIds.length?`元の誤答 ${source24.remainingIds.length}問 → 旧年度問題 → 類題4問`:`元の誤答確認済み。旧年度問題・類題へ`;if(item.n===3)detail=exam25?`${exam25.score}点・改善確認済み`:'2024補強後に実施';if(item.n===4)detail=!exam25?'2025年度の確認が必要':source25?.remainingIds.length?`元の誤答 ${source25.remainingIds.length}問 → 旧年度問題 → 類題4問`:`元の誤答確認済み。旧年度問題・類題へ`;if(item.n===5)detail=exam26?`${exam26.score}点・仕上がり確認済み`:'2025補強後に実施';if(item.n===6)detail='仕上げ後に未使用年度・未使用問題を回す';return <article key={item.n} className={`${done?'done':''} ${active?'active':''}`}><span>{done?'✓':item.n}</span><div><b>{item.title}</b><small>{done?'完了':active?'現在の推奨':'次の段階'}</small>{detail&&<em className="route-detail">{detail}</em>}{item.n===2&&exam24&&weak24.length>0&&<em className="route-detail">対象：{weak24.join(' / ')}</em>}{item.n===4&&exam25&&weak25.length>0&&<em className="route-detail">対象：{weak25.join(' / ')}</em>}</div><Link to={action.to}>{action.label}</Link></article>})}
      </div><p className="muted route-help">診断・採点・弱点抽出は1つの診断フェーズに統合しました。採点後は、目標点に含まれる元の間違いを先に直してから補強へ進みます。</p></section>

    <section className="grid three"><article className="card stat"><b>160問</b><span>内部検査済みの全小問</span></article><article className="card stat"><b>18分野</b><span>各分野の類題4問</span></article><article className="card stat"><b>自動保存</b><span>入力ごとに途中状態を保存</span></article></section>
  </>
}
