import { useMemo, useState } from 'react'
import questions from '../data/questions.json'
import type { MajorQuestion } from '../types'
import { Link } from 'react-router-dom'
import { loadLearningRoute } from '../learningRoute'

const domainLabel: Record<string,string> = {
  mixed:'小問集合', function:'関数・座標', probability:'確率', geometry:'図形',
  word_problem:'文章題', solid_geometry:'空間図形', combinatorics:'場合の数',
  motion:'動点', integer:'整数'
}

export default function Years() {
  const data=questions.questions as MajorQuestion[]
  const years=[...new Set(data.map(q=>q.year))].sort()
  const [year,setYear]=useState(2026)
  const selected=useMemo(()=>data.filter(q=>q.year===year),[data,year])
  const routeState=loadLearningRoute()
  const selectedIds=selected.flatMap(q=>q.subquestions.map(s=>`${q.id}-${s.no}`))
  const used=selectedIds.filter(id=>routeState.usedOldQuestionIds.includes(id)).length

  return (
    <>
      <div className="page-head">
        <div><span className="eyebrow">PRACTICE LIBRARY</span><h1>演習ライブラリ</h1></div>
        <select value={year} onChange={e=>setYear(Number(e.target.value))}>
          {years.map(y=><option key={y} value={y}>{y}年度</option>)}
        </select>
      </div>

      <div className="notice-box">
        診断用の2024〜2026年度と、補強・年度演習用の2019〜2023年度をすべて収録しています。A/B/Cは学校公式ではなく学習上の優先度です。
      </div>

      <div className="year-summary card">
        <strong>{year}年度</strong>
        <span>{year>=2019&&year<=2023?`弱点補強に割当 ${used}/${selectedIds.length}小問・未割当 ${selectedIds.length-used}小問`:'大問1=40点 / 大問2〜5=各15点'}</span>
      </div>

      <div className="actions library-actions"><Link className="button primary" to={`/past-papers?year=${year}`}>{year}年度を1年分解く</Link><Link className="button" to="/fields">18分野の類題を見る</Link></div>

      <div className="legend card">
        <span><b className="legend-a">A</b> 60点狙いでも優先</span>
        <span><b className="legend-b">B</b> 70点なら追加</span>
        <span><b className="legend-c">C</b> 方針が立たなければ後回し</span>
      </div>

      <div className="question-list">
        {selected.map(q=>(
          <article className="card question-card" key={q.id}>
            <div className="qtop">
              <div><span className="qnum">大問 {q.major}</span><h3>{q.title}</h3></div>
              <span className={`grade grade-${q.strategy_grade}`} title="学習優先度">{q.strategy_grade}</span>
            </div>

            <div className="chips">
              <span>{domainLabel[q.domain]||q.domain}</span>
              {q.core_ideas.slice(0,3).map(x=><span key={x}>{x}</span>)}
            </div>

            <div className="subqs">
              {q.subquestions.map(s=>(
                <div className="subq" key={s.no}>
                  <b>({s.no})</b>
                  <span>
                    {s.topic}
                    <small className="strategy-note">
                      {s.grade==='A'?'60点狙いでも取りたい':s.grade==='B'?'70点なら追加したい':'現時点では後回し候補'}
                    </small>
                  </span>
                  <em className={`mini grade-${s.grade}`}>{s.grade}</em>
                </div>
              ))}
            </div>

            {q.notes?.length>0 &&
              <div className="source-note">
                {q.notes.map(note=><p key={note}>{note}</p>)}
              </div>
            }

            <details>
              <summary>同じ思考プロセスの類題テンプレート</summary>
              <p>{q.similar_question_template}</p>
            </details>
            <Link className="button" to={`/past-papers?year=${year}&major=${q.major}`}>この大問を開く</Link>
          </article>
        ))}
      </div>
    </>
  )
}
