import { useEffect, useState } from 'react'
import { collectBackup } from './dataBackup'
import { MIGRATION_JOURNAL_KEY, type BootstrapResult } from './safetyBootstrap'
import { downloadRestorePoint, listRestorePoints, restorePointPayload, type RestorePoint } from './safetyStorage'
import { SAFE_MODE_KEY } from './version'

function downloadCurrent(){
  const pkg=collectBackup(),blob=new Blob([JSON.stringify(pkg,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download=`waseshibu-math-safe-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}

export default function SafetyMode({result}:{result:Extract<BootstrapResult,{mode:'safe'}>}){
  const [points,setPoints]=useState<RestorePoint[]>([]),[message,setMessage]=useState(''),[error,setError]=useState('')
  useEffect(()=>{void listRestorePoints().then(setPoints).catch(e=>setError(e instanceof Error?e.message:'復元ポイントを確認できませんでした'))},[])
  const recover=async(id:string)=>{
    setError('');setMessage('')
    try{await restorePointPayload(id);localStorage.removeItem(SAFE_MODE_KEY);localStorage.removeItem(MIGRATION_JOURNAL_KEY);setMessage('復元できました。再読み込みして学習を続けます。');setTimeout(()=>location.reload(),700)}catch(e){setError(e instanceof Error?e.message:'復元できませんでした')}
  }
  return <main className="safe-shell">
    <section className="card safe-card"><span className="eyebrow">DATA PROTECTION MODE</span><h1>学習データを保護するため停止しました</h1><p>{result.message}</p><p className="muted">保存済みの学習履歴は削除していません。この画面では新しい解答を書き込まず、退避と復元だけを行えます。</p>
      {error&&<p className="data-error">{error}</p>}{message&&<p className="data-success">{message}</p>}
      <div className="actions"><button className="button primary" onClick={()=>{try{downloadCurrent()}catch(e){setError(e instanceof Error?e.message:'書き出せませんでした')}}}>現在データをJSON保存</button>{result.temporary&&<button className="button" onClick={()=>location.reload()}>もう一度確認する</button>}</div>
    </section>
    {!result.temporary&&!!points.length&&<section className="card"><h2>自動復元ポイント</h2><p className="muted">更新前の状態を端末内に保管しています。まずJSON保存してから復元することもできます。</p><div className="restore-list">{points.map(point=><article key={point.id}><div><b>{point.reason==='pre_upgrade'?'更新前':point.reason==='daily'?'日次保護':point.reason==='exam_complete'?'年度演習完了後':'手動保護'}</b><small>{new Date(point.createdAt).toLocaleString('ja-JP')} ／ アプリ {point.appVersion}</small></div><div><button className="button" onClick={()=>downloadRestorePoint(point)}>JSON保存</button><button className="button" onClick={()=>void recover(point.id)}>この時点へ復元</button></div></article>)}</div></section>}
  </main>
}
