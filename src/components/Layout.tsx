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
        <NavLink to="/practice">大問1練習</NavLink>
        <NavLink to="/multi">大問2〜5</NavLink>
        <NavLink to="/report">弱点・得点記録</NavLink>
        <NavLink to="/sync">端末間同期</NavLink>
      </nav>
      <main className="container">{children}</main>
      <footer className="footer">
        非公式の学習支援アプリです。学校公式の試験問題・解答は掲載しません。A/B/Cは学習上の優先度です。同期はGitHub Private Repositoryを利用します。
      </footer>
    </div>
  )
}
