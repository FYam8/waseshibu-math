import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import './guidedReview.css'
import './homeRoute.css'
import { bootstrapSafety } from './safetyBootstrap'
import { syncRequiredYearCompletionLocks } from './learningRoute'
import SafetyMode from './SafetyMode'
import { initMathProgressSync } from './progressSync'

const root=ReactDOM.createRoot(document.getElementById('root')!)
root.render(<main className="boot-screen"><b>学習データを確認しています…</b><span>保存済みの続きはそのまま引き継ぎます。</span></main>)

void bootstrapSafety().then(result=>{
  if(result.mode==='safe'){root.render(<SafetyMode result={result}/>);return}
  // 旧版ですでに本線を完了している年度は、React renderの外で完了ロックへ昇格する。
  syncRequiredYearCompletionLocks()
  // 目標変更後も、その目標ですでに完了している旧履歴を任意再受験より先に固定する。
  window.addEventListener('waseshibu-preferences-change',()=>syncRequiredYearCompletionLocks())
  // Cloud同期はlocal-first。失敗しても数学学習・既存localStorage/IndexedDBには影響させない。
  try{initMathProgressSync()}catch{/* local-only fallback */}
  root.render(<React.StrictMode><HashRouter><App /></HashRouter></React.StrictMode>)
}).catch(error=>root.render(<SafetyMode result={{mode:'safe',message:`起動前の安全確認を完了できません：${error instanceof Error?error.message:'不明なエラー'}`}}/>))
