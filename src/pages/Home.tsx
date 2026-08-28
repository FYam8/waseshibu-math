import questions from '../data/questions.json'
import { Link } from 'react-router-dom'
import { loadAttempts, loadExamScores, loadPreferences, savePreferences } from '../storage'
import type { MajorQuestion } from '../types'
import { classifyRemediationField } from '../data/remediation'
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
  const exam = (year:number) => examScores.find(s=>s.year===year && s.completed!==false)
  const pending = (year:number) => {const result=exam(year);return result?.weakFields?.filter(field=>!attempts.some(a=>a.questionId.startsWith('mastery-')&&a.status==='correct'&&a.at>result.at&&classifyRemediationField(a.topic).title===field))||[]}
  const pending2024=pending(2024),pending2025=pending(2025)
  const nextAction = !exam(2024)?{to:'/past-papers?year=2024',label:'2024年度で診断する'}:pending2024.length?{to:'/mistakes?year=2024',label:`弱点${pending2024.length}分野を補強する`}:!exam(2025)?{to:'/past-papers?year=2025',label:'2025年度で改善確認'}:pending2025.length?{to:'/mistakes?year=2025',label:`残った弱点${pending2025.length}分野を補強`}:!exam(2026)?{to:'/past-papers?year=2026',label:'2026年度で仕上げ確認'}:{to:'/report',label:'結果と安定度を確認する'}
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
            <Link className="button primary" to={nextAction.to}>{nextAction.label}</Link>
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
        <article className="card stat"><b>160問</b><span>全8年・{majors}大問をアプリ内収録</span></article>
        <article className="card stat"><b>{q1Rate === null ? '--' : `${q1Rate}%`}</b><span>直近8問の復習正答率</span></article>
        <article className="card stat"><b>{gap ?? '--'}</b><span>記録得点から目標まで</span></article>
      </section>

      <section className="card next-card">
        <div>
          <span className="eyebrow">NEXT ACTION</span>
          <h2>次にやること</h2>
        </div>
        <div className="next-grid">
          <div><strong>1</strong><span>2024で診断</span><p>20小問を初見で解き、方針・実得点・再現可能得点を記録します。</p></div>
          <div><strong>2</strong><span>弱点3分野だけ補強</span><p>本来取れた失点を優先し、類題を4問連続正解するまで解き直します。</p></div>
          <div><strong>3</strong><span>2025→2026で確認</span><p>改善確認と仕上げ確認を分け、60〜75点を安定して再現できるか測ります。</p></div>
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
