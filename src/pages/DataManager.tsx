import { useEffect, useRef, useState } from 'react'
import { backupStats, collectBackup, parseBackup, restoreBackup, type BackupPackage } from '../dataBackup'
import { createRestorePoint, downloadRestorePoint, listRestorePoints, restoreFromPoint, type RestorePoint } from '../safetyStorage'

function download(pkg:BackupPackage){
  const blob=new Blob([JSON.stringify(pkg,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download=`waseshibu-math-${pkg.exportedAt.slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}

export default function DataManager(){
  const input=useRef<HTMLInputElement>(null)
  const [incoming,setIncoming]=useState<BackupPackage|null>(null),[error,setError]=useState(''),[done,setDone]=useState('')
  const [points,setPoints]=useState<RestorePoint[]>([]),[persistent,setPersistent]=useState<boolean|null>(null)
  const current=collectBackup()
  const refreshPoints=()=>void listRestorePoints().then(setPoints).catch(()=>setPoints([]))
  useEffect(()=>{refreshPoints();void navigator.storage?.persisted?.().then(setPersistent).catch(()=>setPersistent(null))},[])
  const loadFile=async(file?:File)=>{
    setError('');setDone('');if(!file)return
    try{if(file.size>5_000_000)throw new Error('ファイルが大きすぎます（上限5MB）');setIncoming(parseBackup(await file.text()))}catch(e){setIncoming(null);setError(`読み込めませんでした：${e instanceof Error?e.message:'JSONを確認してください'}`)}
  }
  const apply=async(mode:'replace'|'merge')=>{
    if(!incoming)return
    setError('')
    try{await createRestorePoint('before_import');download(collectBackup());restoreBackup(localStorage,incoming,mode);setDone(mode==='replace'?'読み込んだデータへ入れ替えました。':'現在データと統合しました。');setIncoming(null);refreshPoints();window.dispatchEvent(new CustomEvent('waseshibu-route-change'))}catch(e){setError(e instanceof Error?e.message:'復元できませんでした')}
  }
  const makePoint=async()=>{setError('');try{await createRestorePoint('manual');setDone('現在の状態を復元ポイントとして保存しました。');refreshPoints()}catch(e){setError(e instanceof Error?e.message:'復元ポイントを作成できませんでした')}}
  const restorePoint=async(point:RestorePoint)=>{if(!window.confirm(`${new Date(point.createdAt).toLocaleString('ja-JP')} の状態へ戻しますか？\n現在の状態も復元ポイントへ残します。`))return;setError('');try{await restoreFromPoint(point.id);setDone('選んだ時点へ復元しました。現在の状態も復元ポイントに残しています。');refreshPoints();window.dispatchEvent(new CustomEvent('waseshibu-route-change'))}catch(e){setError(e instanceof Error?e.message:'復元できませんでした')}}
  const nowStats=backupStats(current),inStats=incoming?backupStats(incoming):null
  return <>
    <div className="page-head"><div><span className="eyebrow">LOCAL DATA</span><h1>データ管理</h1><p className="muted">学習データはこの端末にだけ保存され、操作しない限り外部へ送信されません。</p></div></div>
    <section className="card data-card"><div><span className="eyebrow">EXPORT</span><h2>学習データを書き出す</h2><p>端末の故障・機種変更に備えて、準備5問、解答、自動採点、タイマー、迷い印、得点、弱点、補強進捗、途中状態を1つのJSONファイルに保存します。</p><div className="data-stats"><span>準備5問 <b>{nowStats.prepDone?'済':'—'}</b></span><span>解答記録 <b>{nowStats.attempts}</b></span><span>年度診断 <b>{nowStats.scores}</b></span><span>途中年度 <b>{nowStats.drafts}</b></span></div></div><button className="button primary" onClick={()=>download(collectBackup())}>この端末のデータを書き出す</button></section>
    <section className="card data-card"><div><span className="eyebrow">IMPORT</span><h2>ファイルから復元する</h2><p>まず内容を確認し、その後「入れ替え」または「統合」を選びます。適用直前に現在データも自動でバックアップします。</p></div><input ref={input} type="file" accept="application/json,.json" hidden onChange={e=>{void loadFile(e.target.files?.[0]);e.currentTarget.value=''}}/><button className="button" onClick={()=>input.current?.click()}>JSONファイルを選ぶ</button>{error&&<p className="data-error">{error}</p>}{done&&<p className="data-success">{done} ホームへ戻ると進捗へ反映されます。</p>}
      {incoming&&inStats&&<div className="import-preview"><h3>読み込み前の確認</h3><p>書き出し日時：{new Date(incoming.exportedAt).toLocaleString('ja-JP')}　／　データ形式：v{incoming.dataVersion}</p><div className="data-stats"><span>準備5問 <b>{inStats.prepDone?'済':'—'}</b></span><span>解答記録 <b>{inStats.attempts}</b></span><span>年度診断 <b>{inStats.scores}</b></span><span>途中年度 <b>{inStats.drafts}</b></span></div><div className="import-choices"><button className="button primary" onClick={()=>void apply('replace')}>入れ替える（推奨）</button><button className="button" onClick={()=>void apply('merge')}>現在データと統合</button><button className="button" onClick={()=>setIncoming(null)}>キャンセル</button></div><p className="muted">古いバックアップは現在の形式へ自動変換します。入れ替え：このアプリの学習データだけを置換します。統合：解答・得点はIDで重複を除き、途中状態は読み込む側を優先します。</p></div>}
    </section>
    <section className="card restore-card"><div className="section-head"><div><span className="eyebrow">RESTORE POINTS</span><h2>この端末の復元ポイント</h2></div><button className="button" onClick={()=>void makePoint()}>今の状態を保存</button></div><p className="muted">更新前、1日1回、年度演習の保存後、JSON読込前に自動作成します。新しいものを最大5件（更新前は最大2件）端末内に保持します。{persistent===true?' ブラウザから永続保存の許可を得ています。':persistent===false?' ブラウザの容量整理対象になる場合があるため、重要な節目ではJSON保存も推奨します。':''}</p>{points.length?<div className="restore-list">{points.map(point=><article key={point.id}><div><b>{point.reason==='pre_upgrade'?'アプリ更新前':point.reason==='daily'?'その日の開始時':point.reason==='exam_complete'?'年度演習の保存後':point.reason==='before_import'?'JSON読込前':'手動保存'}</b><small>{new Date(point.createdAt).toLocaleString('ja-JP')} ／ データ形式 v{point.dataVersion}{point.pinned?' ／ 保護中':''}</small></div><div><button className="button" onClick={()=>downloadRestorePoint(point)}>JSON保存</button><button className="button" onClick={()=>void restorePoint(point)}>復元</button></div></article>)}</div>:<p>復元ポイントはまだありません。次の更新時や年度演習の保存後に自動作成されます。</p>}</section>
    <section className="notice-box"><b>安全設計：</b>更新や読み込みの前に端末内へ退避し、内容を読み直してから処理します。保存または検証に失敗した場合は通常起動せず、復元できる状態で停止します。</section>
  </>
}
