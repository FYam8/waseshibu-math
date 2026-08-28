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

  const scoredQ1 = attempts.filter(a=>a.questionId.startsWith('field-') && a.status!=='deferred').slice(0,8)
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
          <span className="eyebrow">2019–2026 過去問＋18分野の弱点対策 / 非公式</span>
          <h1>取れる5点を、落とさない。</h1>
          <p>まず実際の過去問をアプリ上で解きます。間違えた小問を18分野へ分類し、その分野の類題4問で解き直す設計です。</p>

          <div className="target-row">
            <span>学習目標</span>
            {[60,70,75].map(t => (
              <button key={t} className={`target-chip ${prefs.target===t?'selected':''}`} onClick={()=>setTarget(t as 60|70|75)}>{t}点</button>
            ))}
          </div>

          <div className="actions">
            <Link className="button primary" to="/past-papers">実際の過去問を解く</Link>
            <Link className="button" to="/mistakes">間違いの類題4問へ</Link>
            <Link className="button" to="/fields">18分野・全72問を見る</Link>
            <Link className="button" to="/practice">弱点復習8問</Link>
            <Link className="button" to="/report">過去問得点を記録</Link>
          </div>
        </div>

        <div className="score-orb">
          <strong>{latestExam ? latestExam.score : '--'}</strong>
          <span>{latestExam ? `${latestExam.year}年度 記録` : '過去問得点未入力'}</span>
        </div>
      </section>

      <section className="grid three">
        <article className="card stat"><b>8年</b><span>実際の過去問（{majors}大問）</span></article>
        <article className="card stat"><b>{q1Rate === null ? '--' : `${q1Rate}%`}</b><span>直近8問の復習正答率</span></article>
        <article className="card stat"><b>{gap ?? '--'}</b><span>記録得点から目標まで</span></article>
      </section>

      <section className="card next-card">
        <div>
          <span className="eyebrow">NEXT ACTION</span>
          <h2>次にやること</h2>
        </div>
        <div className="next-grid">
          <div><strong>1</strong><span>実際の過去問</span><p>2019〜2026年度から1年を選び、問題冊子を画面で見ながら解答します。</p></div>
          <div><strong>2</strong><span>小問別に採点</span><p>公式解答と比べて、○・×・後回しと失点原因を記録します。</p></div>
          <div><strong>3</strong><span>類題4問</span><p>間違いを18分野に整理し、同じ分野を4問連続正解するまで解き直します。</p></div>
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
