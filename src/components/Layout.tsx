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
        <NavLink to="/years">出題分析</NavLink>
        <NavLink to="/fields">18分野・72問</NavLink>
        <NavLink to="/mistakes">間違い直し</NavLink>
        <NavLink to="/practice">弱点復習8問</NavLink>
        <NavLink to="/report">弱点・得点記録</NavLink>
        <NavLink to="/past-papers">過去問演習</NavLink>
        <NavLink to="/sync">端末間同期</NavLink>
      </nav>
      <main className="container">{children}</main>
      <footer className="footer">
        非公式の学習支援アプリです。2019〜2026年度の過去問演習、学習記録、18分野の類題を掲載します。A/B/Cは学習上の優先度です。同期はGitHub Private Repositoryを利用します。
      </footer>
    </div>
  )
}
