import { NavLink } from 'react-router-dom'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { currentLearningStep } from '../learningRoute'
import { loadPrepState } from '../preflight'
import { ACTIVE_APP_VERSION_KEY, APP_VERSION, SAFE_MODE_KEY } from '../version'

export default function Layout({ children }: PropsWithChildren) {
  const [routeVersion,setRouteVersion]=useState(0)
  const [updateBlocked,setUpdateBlocked]=useState(false)
  useEffect(()=>{
    const refresh=()=>setRouteVersion(v=>v+1)
    const blocked=()=>setUpdateBlocked(true)
    const storageChanged=(event:StorageEvent)=>{refresh();if((event.key===ACTIVE_APP_VERSION_KEY&&event.newValue&&event.newValue!==APP_VERSION)||(event.key===SAFE_MODE_KEY&&event.newValue))blocked()}
    let channel:BroadcastChannel|null=null
    try{channel=new BroadcastChannel('waseshibu-math-updates');channel.onmessage=event=>{if(event.data?.version&&event.data.version!==APP_VERSION)blocked()}}catch{/* optional */}
    window.addEventListener('waseshibu-route-change',refresh);window.addEventListener('waseshibu-write-blocked',blocked);window.addEventListener('storage',storageChanged)
    return()=>{window.removeEventListener('waseshibu-route-change',refresh);window.removeEventListener('waseshibu-write-blocked',blocked);window.removeEventListener('storage',storageChanged);channel?.close()}
  },[])
  const step=currentLearningStep(),prep=loadPrepState(),learnTo=!prep.completed&&!prep.skipped?'/setup-check':step===1?'/past-papers?year=2024':step===2?'/past-papers?year=2024&review=1':step===4?'/reinforce?source=2024':step===5?'/past-papers?year=2025':step===6?'/reinforce?source=2025':step===7?'/past-papers?year=2026':'/years'
  void routeVersion
  return (
    <div className="app-shell">
      {updateBlocked&&<div className="update-blocked" role="alert"><span><b>新しいバージョンがあります。</b> このタブからの保存を止め、学習履歴を保護しています。</span><button onClick={()=>location.reload()}>再読み込みして続ける</button></div>}
      <header className="topbar">
        <div>
          <div className="brand">WaseShibu Math 70 <span className="unofficial">非公式</span></div>
          <div className="subtitle">過去問の出題構造を参考にした学習用Webアプリ</div>
        </div>
        <span className="local-badge"><i />この端末に保存</span>
      </header>
      <nav className="nav" aria-label="メインナビゲーション">
        <NavLink to="/">ホーム</NavLink>
        <NavLink to={learnTo}>学習する</NavLink>
        <NavLink to="/years">演習ライブラリ</NavLink>
        <NavLink to="/report">学習記録</NavLink>
        <NavLink to="/data">データ管理</NavLink>
      </nav>
      <main className="container">{children}</main>
      <footer className="footer">
        非公式の学習支援アプリです。2019〜2026年度の過去問演習、学習記録、18分野の類題を掲載します。A/B/Cは学習上の優先度です。学習データはこの端末に保存されます。
      </footer>
    </div>
  )
}
