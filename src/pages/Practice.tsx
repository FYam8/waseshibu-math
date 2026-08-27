import { useEffect, useMemo, useState } from 'react'
import { practiceQuestions } from '../data/practice'
import { createRecordId, loadAttempts, loadDaily, saveAttempt, saveDaily } from '../storage'
import { isAcceptedAnswer } from '../answer'
import MathAnswerInput from '../components/MathAnswerInput'

const mistakeTags = ['知識不足','解法未習得','読み落とし','計算ミス','符号ミス','場合分け不足','時間不足','答え方の不備']


function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function hashDate(s:string) {
  return [...s].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0, 7)
}

function deterministicShuffle<T>(items:T[], seedText:string) {
  const arr = [...items]
  let seed = Math.abs(hashDate(seedText))
  for (let i=arr.length-1;i>0;i--) {
    seed = (seed * 9301 + 49297) % 233280
    const j = seed % (i+1)
    ;[arr[i],arr[j]] = [arr[j],arr[i]]
  }
  return arr
}

function buildDailyIds() {
  const date = todayKey()
  const prior = loadDaily()
  if (prior?.date === date && prior.questionIds?.length === 8) return prior.questionIds

  // 最近の大問1練習で間違えたテーマを最大4問まで優先し、残りを日替わりで埋める。
  const attempts = loadAttempts()
  const wrongTopicCounts = attempts
    .filter(a => a.mode === 'q1' && a.status === 'wrong' && a.topic !== '旧データ')
    .slice(0, 60)
    .reduce<Record<string,number>>((acc,a)=>{
      acc[a.topic] = (acc[a.topic] || 0) + 1
      return acc
    }, {})

  const weakTopics = Object.entries(wrongTopicCounts)
    .sort((a,b)=>b[1]-a[1])
    .map(([topic])=>topic)

  const selected:string[] = []
  for (const topic of weakTopics) {
    const q = practiceQuestions.find(q => q.topic === topic && !selected.includes(q.id))
    if (q) selected.push(q.id)
    if (selected.length >= 4) break
  }

  const rest = deterministicShuffle(
    practiceQuestions.filter(q => !selected.includes(q.id)),
    `${date}-fill`
  )
  selected.push(...rest.slice(0, 8-selected.length).map(q=>q.id))

  saveDaily({date, questionIds:selected, completed:false})
  return selected
}

export default function Practice() {
  const dailyIds = useMemo(buildDailyIds, [])
  const priorDaily = loadDaily()
  const resumable = priorDaily?.date === todayKey() && !priorDaily.completed
  const [queue, setQueue] = useState<string[]>(resumable && priorDaily?.queue?.length ? priorDaily.queue : dailyIds)
  const [deferredOnce, setDeferredOnce] = useState<string[]>(resumable ? (priorDaily?.deferredOnce || []) : [])
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<null | boolean>(null)
  const [hint, setHint] = useState(0)
  const [mistake, setMistake] = useState('解法未習得')
  const [questionElapsed, setQuestionElapsed] = useState(0)
  const [sessionElapsed, setSessionElapsed] = useState(resumable ? (priorDaily?.sessionElapsed || 0) : 0)
  const [correctCount, setCorrectCount] = useState(resumable ? (priorDaily?.correctCount || 0) : 0)
  const [wrongCount, setWrongCount] = useState(resumable ? (priorDaily?.wrongCount || 0) : 0)
  const [deferredCount, setDeferredCount] = useState(resumable ? (priorDaily?.deferredCount || 0) : 0)
  const [settled, setSettled] = useState(resumable ? (priorDaily?.settled || 0) : 0)
  const [finished, setFinished] = useState(false)

  const q = practiceQuestions.find(x=>x.id===queue[0])

  useEffect(() => {
    if (finished) return
    const id = setInterval(()=>{
      setQuestionElapsed(v=>v+1)
      setSessionElapsed(v=>v+1)
    }, 1000)
    return ()=>clearInterval(id)
  }, [finished])

  useEffect(() => {
    if (finished) return
    saveDaily({
      date:todayKey(),
      questionIds:dailyIds,
      completed:false,
      queue,
      deferredOnce,
      settled,
      correctCount,
      wrongCount,
      deferredCount,
      sessionElapsed
    })
  }, [queue,deferredOnce,settled,correctCount,wrongCount,deferredCount,finished])

  useEffect(() => {
    if (finished || sessionElapsed === 0 || sessionElapsed % 10 !== 0) return
    saveDaily({
      date:todayKey(),
      questionIds:dailyIds,
      completed:false,
      queue,
      deferredOnce,
      settled,
      correctCount,
      wrongCount,
      deferredCount,
      sessionElapsed
    })
  }, [sessionElapsed,finished])

  const resetQuestionUi = () => {
    setAnswer('')
    setResult(null)
    setHint(0)
    setMistake('解法未習得')
    setQuestionElapsed(0)
  }

  const finishIfNeeded = (nextQueue:string[], nextSettled:number) => {
    if (nextQueue.length === 0 || nextSettled >= 8) {
      saveDaily({date:todayKey(), questionIds:dailyIds, completed:true})
      setFinished(true)
      return true
    }
    return false
  }

  const removeCurrent = () => {
    const nextQueue = queue.slice(1)
    const nextSettled = settled + 1
    setQueue(nextQueue)
    setSettled(nextSettled)
    resetQuestionUi()
    finishIfNeeded(nextQueue, nextSettled)
  }

  const submit = () => {
    if (!q || result !== null || !answer.trim()) return
    setResult(isAcceptedAnswer(answer, q.answer, q.acceptedAnswers))
  }

  const next = () => {
    if (!q || result === null) return
    saveAttempt({
      id:createRecordId(q.id),
      questionId:q.id,
      mode:'q1',
      topic:q.topic,
      status:result ? 'correct' : 'wrong',
      mistakeTag:result ? undefined : mistake,
      seconds:questionElapsed,
      at:new Date().toISOString()
    })
    if (result) setCorrectCount(v=>v+1)
    else setWrongCount(v=>v+1)
    removeCurrent()
  }

  const defer = () => {
    if (!q) return
    const alreadyDeferred = deferredOnce.includes(q.id)
    if (!alreadyDeferred) {
      setDeferredOnce(v=>[...v,q.id])
      setQueue([...queue.slice(1), q.id])
      resetQuestionUi()
      return
    }

    saveAttempt({
      id:createRecordId(q.id),
      questionId:q.id,
      mode:'q1',
      topic:q.topic,
      status:'deferred',
      seconds:questionElapsed,
      at:new Date().toISOString()
    })
    setDeferredCount(v=>v+1)
    removeCurrent()
  }

  const restart = () => {
    setQueue(dailyIds)
    setDeferredOnce([])
    setCorrectCount(0)
    setWrongCount(0)
    setDeferredCount(0)
    setSettled(0)
    setSessionElapsed(0)
    setFinished(false)
    resetQuestionUi()
  }

  const fmt = (seconds:number) =>
    `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`

  if (finished) {
    return (
      <>
        <div className="page-head">
          <div><span className="eyebrow">2020〜2026型 / TODAY'S 8</span><h1>今日の8問・結果</h1></div>
        </div>
        <section className="card session-summary">
          <div className="summary-score"><strong>{correctCount*5}</strong><span>/ 40点換算</span></div>
          <div className="grid three">
            <article className="stat"><b>{correctCount}</b><span>正解</span></article>
            <article className="stat"><b>{wrongCount}</b><span>不正解</span></article>
            <article className="stat"><b>{deferredCount}</b><span>見送り</span></article>
          </div>
          <p className="muted">「40点換算」はこの自作8問を各5点として数えた学習用指標で、過去問の実得点ではありません。</p>
          <div className="actions">
            <button className="button primary" onClick={restart}>同じ8問を再挑戦</button>
            <a className="button" href="#/report">弱点・得点記録へ</a>
          </div>
        </section>
      </>
    )
  }

  if (!q) return <p>問題セットを作成できませんでした。</p>

  return (
    <>
      <div className="page-head">
        <div><span className="eyebrow">2020〜2026型 / TODAY'S 8</span><h1>今日の8問（大問1）</h1></div>
        <div className="practice-meta">
          <span>{settled} / 8 完了</span>
          <span>問題 {fmt(questionElapsed)}</span>
          <span>合計 {fmt(sessionElapsed)}</span>
        </div>
      </div>

      <div className="progress-track"><i style={{width:`${settled/8*100}%`}} /></div>

      <article className="card practice-card">
        <div className="qtop">
          <div className="chips">
            <span>{q.topic}</span>
            <span>{q.sourcePattern}</span>
          </div>
          <span className={`grade grade-${q.grade}`}>{q.grade}</span>
        </div>

        <p className="strategy-box">
          {q.grade === 'A' ? 'A：短時間で確実に取りたい問題' : 'B：少し考えて方針が立てば取りたい問題'}
        </p>
        <p className="problem">{q.prompt}</p>

        <label className="answer-label">答え <small className="muted">（分数は約分、式はできるだけ簡単な形）</small></label>
        <MathAnswerInput value={answer} onChange={setAnswer} onEnter={submit} placeholder="答えを入力" autoFocus disabled={result!==null}/>

        {result === null && (
          <div className="actions">
            <button className="button primary" onClick={submit} disabled={!answer.trim()}>採点する</button>
            <button className="button" onClick={()=>setHint(Math.min(2,hint+1))}>ヒント</button>
            <button className="button ghost" onClick={defer}>
              {deferredOnce.includes(q.id) ? '今日は見送る' : '後回し'}
            </button>
          </div>
        )}

        {hint >= 1 && <div className="hint"><b>ヒント1：</b>{q.hint1}</div>}
        {hint >= 2 && <div className="hint"><b>ヒント2：</b>{q.hint2}</div>}

        {result !== null && (
          <div className={`result ${result ? 'ok' : 'ng'}`}>
            <strong>{result ? '○ 正解' : '× 不正解'}</strong>
            {!result && (
              <>
                <p>正答：{q.answer}</p>
                <label className="mistake-row">
                  ミス分類
                  <select value={mistake} onChange={e=>setMistake(e.target.value)}>
                    {mistakeTags.map(t=><option key={t}>{t}</option>)}
                  </select>
                </label>
              </>
            )}
            <p>{q.explanation}</p>
            <button className="button primary" onClick={next}>次へ</button>
          </div>
        )}

        {questionElapsed >= 180 && result === null && (
          <div className="time-warning">
            3分経過。方針が立たないなら一度「後回し」にして、取れる問題を先に回収しましょう。
          </div>
        )}
      </article>
    </>
  )
}
