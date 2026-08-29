import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import { bootstrapSafety } from './safetyBootstrap'
import SafetyMode from './SafetyMode'

const root=ReactDOM.createRoot(document.getElementById('root')!)
root.render(<main className="boot-screen"><b>学習データを確認しています…</b><span>保存済みの続きはそのまま引き継ぎます。</span></main>)

void bootstrapSafety().then(result=>{
  if(result.mode==='safe'){root.render(<SafetyMode result={result}/>);return}
  root.render(<React.StrictMode><HashRouter><App /></HashRouter></React.StrictMode>)
}).catch(error=>root.render(<SafetyMode result={{mode:'safe',message:`起動前の安全確認を完了できません：${error instanceof Error?error.message:'不明なエラー'}`}}/>))
