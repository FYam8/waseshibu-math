import { useEffect, useMemo, useState } from 'react'
import { createRecordId, saveExamScore } from '../storage'

const years=[2026,2025,2024,2023,2022,2021,2020,2019]
const scoreMax=(year:number)=>year===2019?[45,10,15,15,15]:[40,15,15,15,15]

export default function PastPapers(){
  const [year,setYear]=useState(2026)
  const [kind,setKind]=useState<'問題'|'解答'>('問題')
  const [seconds,setSeconds]=useState(0)
  const [running,setRunning]=useState(false)
  const [scores,setScores]=useState(['','','','',''])
  const [saved,setSaved]=useState(false)
  const max=scoreMax(year)
  const total=useMemo(()=>scores.reduce((n,x)=>n+(Number(x)||0),0),[scores])
  const pdfUrl=`./past-papers/${year}_数学_${kind}.pdf`

  useEffect(()=>{
    if(!running)return
    const timer=setInterval(()=>setSeconds(v=>v+1),1000)
    return()=>clearInterval(timer)
  },[running])

  const chooseYear=(y:number)=>{setYear(y);setKind('問題');setSeconds(0);setRunning(false);setScores(['','','','','']);setSaved(false)}
  const setScore=(i:number,value:string)=>{
    const n=value===''?'':String(Math.min(max[i],Math.max(0,Number(value)||0)))
    setScores(v=>v.map((x,j)=>j===i?n:x));setSaved(false)
  }
  const save=()=>{
    saveExamScore({id:createRecordId(`past-paper-${year}`),year,score:total,at:new Date().toISOString()})
    setSaved(true)
  }
  const fmt=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return <>
    <div className="page-head">
      <div><span className="eyebrow">ORIGINAL PAST PAPERS / 2019–2026</span><h1>過去問を解く</h1></div>
      <select value={year} onChange={e=>chooseYear(Number(e.target.value))}>{years.map(y=><option key={y}>{y}年度</option>)}</select>
    </div>

    <section className="card paper-controls">
      <div className="paper-tabs">
        <button className={kind==='問題'?'active':''} onClick={()=>setKind('問題')}>問題冊子</button>
        <button className={kind==='解答'?'active':''} onClick={()=>setKind('解答')}>模範解答</button>
      </div>
      <div className="paper-timer">
        <b>{fmt(seconds)}</b>
        <button className="button primary" onClick={()=>setRunning(v=>!v)}>{running?'一時停止':'計測開始'}</button>
        <button className="button" onClick={()=>{setRunning(false);setSeconds(0)}}>リセット</button>
      </div>
      <a className="button" href={pdfUrl} target="_blank" rel="noreferrer">PDFを別画面で開く</a>
    </section>

    <section className="card pass-route">
      <h2>{year}年度・合格点を取る順番</h2>
      <div className="route-steps">
        <div><b>① 大問1</b><span>{max[0]}点中30〜{year===2019?'40':'35'}点を確保</span></div>
        <div><b>② 大問2〜5の（1）</b><span>方針がすぐ立つ問題から回収</span></div>
        <div><b>③ （2）→（3）</b><span>70〜75点に必要な標準問題を追加</span></div>
        <div><b>④ 見直し</b><span>計算・符号・単位・最簡形を確認</span></div>
      </div>
      <p className="muted">最初は時間内に完答することより、「取る問題」と「後回し」を判断する練習を優先します。</p>
    </section>

    <section className="paper-viewer card">
      <iframe key={pdfUrl} src={pdfUrl} title={`${year}年度 数学 ${kind}`} />
      <p className="pdf-fallback">表示されない場合は「PDFを別画面で開く」を押してください。</p>
    </section>

    <section className="card">
      <div className="section-head"><div><span className="eyebrow">SELF SCORING</span><h2>大問別に自己採点</h2></div><strong className="paper-total">{total}/100</strong></div>
      <div className="major-score-grid">
        {max.map((m,i)=><label key={i}><span>大問{i+1}（{m}点）</span><input inputMode="numeric" value={scores[i]} onChange={e=>setScore(i,e.target.value)} placeholder="0"/></label>)}
      </div>
      <div className="actions"><button className="button primary" onClick={save}>得点を保存</button><a className="button" href="#/report">弱点・得点記録を見る</a></div>
      {saved&&<p className="result ok">保存しました。端末間同期を実行すると他の端末にも反映されます。</p>}
      <div className="score-judgement">
        <b>{total<60?'まず60点へ':total<70?'60点到達：次は70点安定へ':total<=75?'合格圏の再現性を高める段階':'75点超：取りこぼし防止を優先'}</b>
        <span>{total<60?'大問1と各大問（1）の失点を先に解き直します。':total<70?'B問題のうち、解説を読めば再現できる問題を追加します。':'C問題の深追いより、取れたはずのA/B問題を再確認します。'}</span>
      </div>
    </section>
  </>
}
