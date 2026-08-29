import { Link } from 'react-router-dom'
import { useState } from 'react'
import { currentLearningStep, latestExam, routeStepDone } from '../learningRoute'
import { loadExamScores, loadPreferences, savePreferences } from '../storage'
import { loadPrepState, runExamIntegrityCheck, savePrepState } from '../preflight'

const route=[
  {n:1,title:'2024年度を本番形式で実施',to:'/past-papers?year=2024'},
  {n:2,title:'全20小問を自動採点',to:'/past-papers?year=2024&review=1'},
  {n:3,title:'優先弱点3分野を抽出',to:'/report'},
  {n:4,title:'2019〜2023該当問題＋類題4問',to:'/reinforce?source=2024'},
  {n:5,title:'2025年度で改善確認',to:'/past-papers?year=2025'},
  {n:6,title:'残った弱点3分野を補強',to:'/reinforce?source=2025'},
  {n:7,title:'2026年度で仕上がり確認',to:'/past-papers?year=2026'},
  {n:8,title:'2019〜2023年度の残りを演習',to:'/years'}
]

function draftResume(){
  try{
    const drafts=JSON.parse(localStorage.getItem('waseshibu-math-exam-drafts-v2')||'{}'),entries=Object.entries(drafts) as [string,any][]
    const marking=entries.find(([,x])=>x?.phase==='mark');if(marking)return {to:`/past-papers?year=${marking[0]}&review=1`,label:`${marking[0]}年度の採点を続ける`}
    const solving=entries.find(([,x])=>x?.phase==='solve'&&(Number(x.seconds)>0||Object.values(x.answers||{}).some(Boolean)));if(solving)return {to:`/past-papers?year=${solving[0]}`,label:`${solving[0]}年度の続きから`}
  }catch{/* no draft */}
  return null
}

export default function Home(){
  const [prefs,setPrefs]=useState(loadPreferences()),step=currentLearningStep(),scores=loadExamScores(),prep=loadPrepState(),integrity=runExamIntegrityCheck()
  const current=route.find(x=>x.n===step)!,latest=scores[0],draft=draftResume()
  const prepInProgress=!prep.completed&&!prep.skipped&&(prep.index>0||Object.keys(prep.answers).length>0)
  const resume=draft||(prepInProgress?{to:'/setup-check',label:`準備問題 ${prep.index+1}/5 から続ける`}:null)
  const primary=resume||(!prep.completed&&!prep.skipped?{to:'/setup-check',label:'準備5問から始める'}:{to:current.to,label:`STEP ${step}　${current.title}`})
  const setTarget=(target:60|70|75)=>{const next={...prefs,target};setPrefs(next);savePreferences(next)}
  const prerequisite=(n:number)=>n===2&&!routeStepDone(1)||(n===3||n===4)&&!latestExam(2024)||n===6&&!latestExam(2025)
  const destination=(n:number,fallback:string)=>n===2&&!routeStepDone(1)?'/past-papers?year=2024':(n===3||n===4)&&!latestExam(2024)?(routeStepDone(1)?'/past-papers?year=2024&review=1':'/past-papers?year=2024'):n===6&&!latestExam(2025)?'/past-papers?year=2025':fallback
  return <>
    <section className={`hero card route-hero ${integrity.ok?'':'integrity-failed'}`}><div><span className="eyebrow">PASS ROUTE · 60–75 POINTS</span><h1>{resume?'保存した続きから再開できます。':'次にやることは、1つだけ。'}</h1><p>準備5問で入力を確認した後、2024年度で診断し、補強してから2025・2026年度で改善を確認します。</p><div className="integrity-line">{integrity.ok?<><b>✓ 採点データ確認済み</b><span>全{integrity.answerCount}問・2024年度{integrity.year2024Count}問</span></>:<><b>採点データに問題があります</b><span>{integrity.issues[0]}</span></>}</div><div className="target-row"><span>学習目標</span>{[60,70,75].map(t=><button key={t} className={`target-chip ${prefs.target===t?'selected':''}`} onClick={()=>setTarget(t as 60|70|75)}>{t}点</button>)}</div><div className="actions">{integrity.ok&&<Link className="button primary next-action" to={primary.to}>{primary.label}</Link>}{integrity.ok&&!prep.completed&&!prep.skipped&&<Link className="button" to="/past-papers?year=2024" onClick={()=>savePrepState({...prep,skipped:true})}>準備を後回しにして2024年度へ</Link>}<a className="button" href="#step-selector">ステップを選ぶ</a></div></div><div className="score-orb"><strong>{latest?.score??'--'}</strong><span>{latest?`${latest.year}年度 実得点`:'診断前'}</span></div></section>

    <section className="card learning-route" id="step-selector"><div className="section-head"><div><span className="eyebrow">PREPARATION + 8-STEP ROUTE</span><h2>順番でも、途中からでも始められます</h2></div><b>推奨 STEP {step}/8</b></div><div className="route-grid"><article className={`${prep.completed?'done':''} ${!prep.completed&&!prep.skipped?'active':''}`}><span>{prep.completed?'✓':'準'}</span><div><b>入力・自動採点チェック5問</b><small>{prep.completed?'完了':prep.skipped?'後回し':'最初に推奨'}</small></div><Link to="/setup-check">{prepInProgress?'続き':'開く'}</Link></article>{route.map(item=>{const done=routeStepDone(item.n),active=item.n===step&&(prep.completed||prep.skipped),missing=prerequisite(item.n);return <article key={item.n} className={`${done?'done':''} ${active?'active':''} ${missing?'prerequisite':''}`}><span>{done?'✓':item.n}</span><div><b>{item.title}</b><small>{done?'完了':missing?'必要な前段階へ案内':active?'推奨位置':'任意に開始可能'}</small></div><Link to={destination(item.n,item.to)}>{missing?'前段階から':'開く'}</Link></article>})}</div><p className="muted route-help">どの段階からでも選べます。診断結果が必要な段階では、架空の弱点を作らず必要な年度へ自動で案内します。</p></section>

    <section className="grid three"><article className="card stat"><b>160問</b><span>内部検査済みの全小問</span></article><article className="card stat"><b>18分野</b><span>各分野の類題4問</span></article><article className="card stat"><b>自動保存</b><span>入力ごとに途中状態を保存</span></article></section>
  </>
}
