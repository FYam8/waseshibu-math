import { NavLink } from 'react-router-dom'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { currentLearningStep } from '../learningRoute'

export default function Layout({ children }: PropsWithChildren) {
  const [routeVersion,setRouteVersion]=useState(0)
  useEffect(()=>{const refresh=()=>setRouteVersion(v=>v+1);window.addEventListener('waseshibu-route-change',refresh);window.addEventListener('storage',refresh);return()=>{window.removeEventListener('waseshibu-route-change',refresh);window.removeEventListener('storage',refresh)}},[])
  const step=currentLearningStep(),learnTo=step===1?'/past-papers?year=2024':step===2?'/past-papers?year=2024&review=1':step===4?'/reinforce?source=2024':step===5?'/past-papers?year=2025':step===6?'/reinforce?source=2025':step===7?'/past-papers?year=2026':'/years'
  void routeVersion
  return (
    <div className="app-shell">
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
