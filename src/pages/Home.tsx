import questions from '../data/questions.json'
import { Link } from 'react-router-dom'
import { loadAttempts, loadExamScores, loadPreferences, savePreferences } from '../storage'
import type { MajorQuestion } from '../types'
import { useState } from 'react'

export default function Home() {
  const attempts = loadAttempts()
  const examScores = loadExamScores()
  const [prefs, setPrefs] = useState(loadPreferences())
  const majors = (questions.questions as MajorQuestion[]).length

  const scoredQ1 = attempts.filter(a=>a.mode==='q1' && a.status!=='deferred').slice(0,8)
  const q1Correct = scoredQ1.filter(a=>a.status==='correct').length
  const q1Rate = scoredQ1.length ? Math.round(q1Correct/scoredQ1.length*100) : null

  const latestExam = examScores[0] ?? null
  const gap = latestExam ? Math.max(0, prefs.target-latestExam.score) : null

  const setTarget = (target: 60|70|75) => {
    const next = {...prefs, target}
    setPrefs(next)
    savePreferences(next)
  }

  return (
    <>
      <section className="hero card">
        <div>
          <span className="eyebrow">2019–2026 過去問構造ベース / 非公式</span>
          <h1>取れる5点を、落とさない。</h1>
          <p>大問1の取りこぼしを減らし、大問2〜5は（1）（2）を中心に回収。満点ではなく60〜75点の再現性を高める設計です。</p>

          <div className="target-row">
            <span>学習目標</span>
            {[60,70,75].map(t => (
              <button key={t} className={`target-chip ${prefs.target===t?'selected':''}`} onClick={()=>setTarget(t as 60|70|75)}>{t}点</button>
            ))}
          </div>

          <div className="actions">
            <Link className="button primary" to="/practice">今日の8問を始める</Link>
            <Link className="button" to="/multi">大問2〜5を練習</Link>
            <Link className="button" to="/report">過去問得点を記録</Link>
          </div>
        </div>

        <div className="score-orb">
          <strong>{latestExam ? latestExam.score : '--'}</strong>
          <span>{latestExam ? `${latestExam.year}年度 記録` : '過去問得点未入力'}</span>
        </div>
      </section>

      <section className="grid three">
        <article className="card stat"><b>{majors}</b><span>分析済み大問</span></article>
        <article className="card stat"><b>{q1Rate === null ? '--' : `${q1Rate}%`}</b><span>直近の大問1練習正答率</span></article>
        <article className="card stat"><b>{gap ?? '--'}</b><span>記録得点から目標まで</span></article>
      </section>

      <section className="card next-card">
        <div>
          <span className="eyebrow">NEXT ACTION</span>
          <h2>次にやること</h2>
        </div>
        <div className="next-grid">
          <div><strong>1</strong><span>今日の8問</span><p>2020〜2026型の8問構成で、最近の失点テーマを最大4問優先します。</p></div>
          <div><strong>2</strong><span>ミス分類</span><p>「難しくて取れない」と「本来取れた」を分けます。</p></div>
          <div><strong>3</strong><span>過去問得点記録</span><p>実際に解いた年度の得点で現在段階を判断します。</p></div>
        </div>
      </section>

      <section className="card">
        <h2>このアプリの得点表示について</h2>
        <p className="muted">
          100点満点の「現在得点」は、ユーザーが実際に解いた過去問の記録だけを使います。
          練習正答率から100点満点の得点を推測する表示は行いません。
        </p>
      </section>
    </>
  )
}
