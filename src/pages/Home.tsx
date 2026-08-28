import { Link } from 'react-router-dom'
import { useState } from 'react'
import { currentLearningStep, routeStepDone } from '../learningRoute'
import { loadExamScores, loadPreferences, savePreferences } from '../storage'

const route=[
  {n:1,title:'2024年度を本番形式で実施',short:'2024 本番',to:'/past-papers?year=2024'},
  {n:2,title:'全20小問を診断',short:'20問診断',to:'/past-papers?year=2024&review=1'},
  {n:3,title:'優先弱点3分野を抽出',short:'弱点3分野',to:'/report'},
  {n:4,title:'2019〜2023該当問題＋類題4問',short:'第1補強',to:'/reinforce?source=2024'},
  {n:5,title:'2025年度で改善確認',short:'2025 確認',to:'/past-papers?year=2025'},
  {n:6,title:'残った弱点3分野を補強',short:'第2補強',to:'/reinforce?source=2025'},
  {n:7,title:'2026年度で仕上がり確認',short:'2026 仕上げ',to:'/past-papers?year=2026'},
  {n:8,title:'2019〜2023年度の残りを演習',short:'残りを演習',to:'/years'}
]

export default function Home(){
  const [prefs,setPrefs]=useState(loadPreferences()),step=currentLearningStep(),scores=loadExamScores()
  const current=route.find(x=>x.n===step)!,latest=scores[0]
  const setTarget=(target:60|70|75)=>{const next={...prefs,target};setPrefs(next);savePreferences(next)}
  return <>
    <section className="hero card route-hero"><div><span className="eyebrow">PASS ROUTE · 60–75 POINTS</span><h1>次にやることは、1つだけ。</h1><p>2024年度で診断し、2019〜2023年度の該当問題と類題で直してから、2025・2026年度で改善を確認します。</p><div className="target-row"><span>学習目標</span>{[60,70,75].map(t=><button key={t} className={`target-chip ${prefs.target===t?'selected':''}`} onClick={()=>setTarget(t as 60|70|75)}>{t}点</button>)}</div><div className="actions"><Link className="button primary next-action" to={current.to}>STEP {step}　{current.title}</Link></div></div><div className="score-orb"><strong>{latest?.score??'--'}</strong><span>{latest?`${latest.year}年度 実得点`:'診断前'}</span></div></section>

    <section className="card learning-route"><div className="section-head"><div><span className="eyebrow">8-STEP LEARNING ROUTE</span><h2>合格点を安定させる順番</h2></div><b>STEP {step}/8</b></div><div className="route-grid">{route.map(item=>{const done=routeStepDone(item.n),active=item.n===step,locked=item.n>step;return <article key={item.n} className={`${done?'done':''} ${active?'active':''} ${locked?'locked':''}`}><span>{done?'✓':item.n}</span><div><b>{item.title}</b><small>{done?'完了':active?'現在ここ':'前の段階後に解放'}</small></div>{active&&<Link to={item.to}>開始</Link>}</article>})}</div></section>

    <section className="grid three"><article className="card stat"><b>160問</b><span>2019〜2026年度の全小問</span></article><article className="card stat"><b>18分野</b><span>各分野の類題4問</span></article><article className="card stat"><b>端末内</b><span>学習データを自動保存</span></article></section>
  </>
}
