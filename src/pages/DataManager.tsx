import { useMemo, useRef, useState } from 'react'

const KEYS=[
  'waseshibu-math-attempts','waseshibu-math-preferences','waseshibu-math-daily',
  'waseshibu-math-exam-scores','waseshibu-math-exam-drafts-v2','waseshibu-math-learning-route-v1'
] as const
type Package={app:'waseshibu-math';schemaVersion:1;exportedAt:string;data:Record<string,unknown>}

function collect():Package{
  const data:Record<string,unknown>={}
  KEYS.forEach(key=>{const raw=localStorage.getItem(key);if(raw!==null)try{data[key]=JSON.parse(raw)}catch{data[key]=raw}})
  return {app:'waseshibu-math',schemaVersion:1,exportedAt:new Date().toISOString(),data}
}
function download(pkg:Package){
  const blob=new Blob([JSON.stringify(pkg,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download=`waseshibu-math-${pkg.exportedAt.slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function uniqueById(local:unknown,remote:unknown){
  const a=Array.isArray(local)?local:[],b=Array.isArray(remote)?remote:[]
  return [...new Map([...a,...b].filter(x=>x&&typeof x==='object').map((x:any)=>[String(x.id||JSON.stringify(x)),x])).values()]
}
function mergeValue(key:string,local:unknown,incoming:unknown){
  if(key.endsWith('attempts')||key.endsWith('exam-scores'))return uniqueById(local,incoming)
  if(key.endsWith('exam-drafts-v2'))return {...(local as object||{}),...(incoming as object||{})}
  if(key.endsWith('learning-route-v1')){
    const a:any=local&&typeof local==='object'?local:{},b:any=incoming&&typeof incoming==='object'?incoming:{}
    const reinforcement={...(a.reinforcement||{})}
    for(const [planKey,incomingPlan] of Object.entries(b.reinforcement||{})){
      const localPlan:any=reinforcement[planKey],next:any=incomingPlan
      reinforcement[planKey]=localPlan?.examId===next?.examId?{...localPlan,...next,completedQuestionIds:[...new Set([...(localPlan.completedQuestionIds||[]),...(next.completedQuestionIds||[])])]}:next
    }
    return {...a,...b,solvedYears:[...new Set([...(a.solvedYears||[]),...(b.solvedYears||[])])],usedOldQuestionIds:[...new Set([...(a.usedOldQuestionIds||[]),...(b.usedOldQuestionIds||[])])],reinforcement,updatedAt:new Date().toISOString()}
  }
  return incoming
}

export default function DataManager(){
  const input=useRef<HTMLInputElement>(null)
  const [incoming,setIncoming]=useState<Package|null>(null),[error,setError]=useState(''),[done,setDone]=useState('')
  const current=useMemo(()=>collect(),[done])
  const stats=(pkg:Package)=>{const attempts=pkg.data['waseshibu-math-attempts'],scores=pkg.data['waseshibu-math-exam-scores'],drafts=pkg.data['waseshibu-math-exam-drafts-v2'];return {attempts:Array.isArray(attempts)?attempts.length:0,scores:Array.isArray(scores)?scores.length:0,drafts:drafts&&typeof drafts==='object'?Object.keys(drafts).length:0}}
  const loadFile=async(file?:File)=>{
    setError('');setDone('');if(!file)return
    try{const parsed=JSON.parse(await file.text());if(parsed?.app!=='waseshibu-math'||parsed?.schemaVersion!==1||!parsed.data||typeof parsed.data!=='object')throw new Error('形式が一致しません');setIncoming(parsed)}catch(e){setIncoming(null);setError(`読み込めませんでした：${e instanceof Error?e.message:'JSONを確認してください'}`)}
  }
  const apply=(mode:'replace'|'merge')=>{
    if(!incoming)return
    download(collect())
    if(mode==='replace')KEYS.forEach(key=>localStorage.removeItem(key))
    KEYS.forEach(key=>{if(!(key in incoming.data))return;let value=incoming.data[key];if(mode==='merge'){let local:unknown=null;try{local=JSON.parse(localStorage.getItem(key)||'null')}catch{/* no-op */}value=mergeValue(key,local,value)}localStorage.setItem(key,JSON.stringify(value))})
    setDone(mode==='replace'?'読み込んだデータへ入れ替えました。':'現在データと統合しました。');setIncoming(null);window.dispatchEvent(new CustomEvent('waseshibu-route-change'))
  }
  const nowStats=stats(current),inStats=incoming?stats(incoming):null
  return <>
    <div className="page-head"><div><span className="eyebrow">LOCAL DATA</span><h1>データ管理</h1><p className="muted">学習データはこの端末にだけ保存され、操作しない限り外部へ送信されません。</p></div></div>
    <section className="card data-card"><div><span className="eyebrow">EXPORT</span><h2>学習データを書き出す</h2><p>端末の故障・機種変更に備えて、解答、診断、タイマー、迷い印、得点、弱点、補強進捗、途中状態を1つのJSONファイルに保存します。</p><div className="data-stats"><span>解答記録 <b>{nowStats.attempts}</b></span><span>年度診断 <b>{nowStats.scores}</b></span><span>途中年度 <b>{nowStats.drafts}</b></span></div></div><button className="button primary" onClick={()=>download(collect())}>この端末のデータを書き出す</button></section>
    <section className="card data-card"><div><span className="eyebrow">IMPORT</span><h2>ファイルから復元する</h2><p>まず内容を確認し、その後「入れ替え」または「統合」を選びます。適用直前に現在データも自動でバックアップします。</p></div><input ref={input} type="file" accept="application/json,.json" hidden onChange={e=>loadFile(e.target.files?.[0])}/><button className="button" onClick={()=>input.current?.click()}>JSONファイルを選ぶ</button>{error&&<p className="data-error">{error}</p>}{done&&<p className="data-success">{done} ホームへ戻ると進捗へ反映されます。</p>}
      {incoming&&inStats&&<div className="import-preview"><h3>読み込み前の確認</h3><p>書き出し日時：{new Date(incoming.exportedAt).toLocaleString('ja-JP')}</p><div className="data-stats"><span>解答記録 <b>{inStats.attempts}</b></span><span>年度診断 <b>{inStats.scores}</b></span><span>途中年度 <b>{inStats.drafts}</b></span></div><div className="import-choices"><button className="button primary" onClick={()=>apply('replace')}>入れ替える（推奨）</button><button className="button" onClick={()=>apply('merge')}>現在データと統合</button><button className="button" onClick={()=>setIncoming(null)}>キャンセル</button></div><p className="muted">入れ替え：このアプリの学習データだけを置換します。統合：解答・得点はIDで重複を除き、途中状態は読み込む側を優先します。</p></div>}
    </section>
    <section className="notice-box"><b>おすすめ：</b>大きな診断を終えたときと、端末を変更する前に書き出してください。問題画像やアプリ本体はファイルに含めないため、容量は小さいままです。</section>
  </>
}
