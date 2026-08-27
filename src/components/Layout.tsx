import { NavLink } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import SyncBadge from './SyncBadge'

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">WaseShibu Math 70 <span className="unofficial">非公式</span></div>
          <div className="subtitle">過去問の出題構造を参考にした学習用Webアプリ</div>
        </div>
        <SyncBadge />
      </header>
      <nav className="nav" aria-label="メインナビゲーション">
        <NavLink to="/">ホーム</NavLink>
        <NavLink to="/years">年度分析</NavLink>
        <NavLink to="/year-training">全年度演習</NavLink>
        <NavLink to="/mistakes">間違い直し</NavLink>
        <NavLink to="/practice">大問1練習</NavLink>
        <NavLink to="/multi">大問2〜5</NavLink>
        <NavLink to="/report">弱点・得点記録</NavLink>
        <NavLink to="/past-papers">過去問採点</NavLink>
        <NavLink to="/sync">端末間同期</NavLink>
      </nav>
      <main className="container">{children}</main>
      <footer className="footer">
        非公式の学習支援アプリです。問題冊子は手元の印刷物を使用し、アプリには学習記録と類題を掲載します。A/B/Cは学習上の優先度です。同期はGitHub Private Repositoryを利用します。
      </footer>
    </div>
  )
}
