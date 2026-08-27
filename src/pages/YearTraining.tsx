import { useMemo, useState } from 'react'
import { yearTraining } from '../data/yearTraining'
import { isAcceptedAnswer } from '../answer'
import { createRecordId, saveAttempt } from '../storage'

const mistakeTags = ['知識不足','解法未習得','読み落とし','計算ミス','符号ミス','場合分け不足','時間不足','答え方の不備']

export default function YearTraining() {
  const [year,setYear]=useState(2026)
  const [major,setMajor]=useState(1)
  const [answer,setAnswer]=useState('')
  const [result,setResult]=useState<boolean|null>(null)
  const [showPlan,setShowPlan]=useState(false)
  const [mistake,setMistake]=useState('解法未習得')
  const lesson=useMemo(()=>yearTraining.find(x=>x.year===year&&x.major===major)!,[year,major])
  let completedValues:string[]=[]
  try {
    const stored=JSON.parse(localStorage.getItem('waseshibu.math.yearTraining.completed')||'[]')
    completedValues=Array.isArray(stored)?stored.filter(x=>typeof x==='string'):[]
  } catch { completedValues=[] }
  const completed=new Set(completedValues)

  const choose=(nextYear:number,nextMajor:number)=>{
    setYear(nextYear);setMajor(nextMajor);setAnswer('');setResult(null);setShowPlan(false)
  }
  const submit=()=>{
    if(!answer.trim()||result!==null)return
    setResult(isAcceptedAnswer(answer,lesson.answer,lesson.acceptedAnswers))
  }
  const recordAndNext=()=>{
    if(result===null)return
    saveAttempt({id:createRecordId(lesson.id),questionId:`year-${lesson.id}`,mode:'multi',topic:lesson.pastPattern,status:result?'correct':'wrong',mistakeTag:result?undefined:mistake,at:new Date().toISOString()})
    completed.add(lesson.id)
    localStorage.setItem('waseshibu.math.yearTraining.completed',JSON.stringify([...completed]))
    if(major<5)choose(year,major+1)
    else if(year<2026)choose(year+1,1)
    else choose(2019,1)
  }

  return <>
    <div className="page-head">
      <div><span className="eyebrow">ALL YEARS / 40 MISSIONS</span><h1>年度別・過去問型トレーニング</h1></div>
      <div className="score-form">
        <select value={year} onChange={e=>choose(Number(e.target.value),major)}>
          {[2026,2025,2024,2023,2022,2021,2020,2019].map(y=><option key={y}>{y}</option>)}
        </select>
        <select value={major} onChange={e=>choose(year,Number(e.target.value))}>
          {[1,2,3,4,5].map(n=><option key={n} value={n}>大問{n}</option>)}
        </select>
      </div>
    </div>

    <div className="mission-grid">
      {[2019,2020,2021,2022,2023,2024,2025,2026].map(y=>
        <div className="mission-year" key={y}><b>{y}</b>{[1,2,3,4,5].map(n=>{
          const id=`${y}-Q${n}`; return <button key={id} className={`${id===lesson.id?'current':''} ${completed.has(id)?'done':''}`} onClick={()=>choose(y,n)}>{n}</button>
        })}</div>
      )}
    </div>

    <article className="card lesson-card">
      <div className="qtop">
        <div><span className="qnum">{lesson.year}年度・大問{lesson.major}</span><h2>{lesson.pastPattern}</h2></div>
        <span className={`target-badge target-${lesson.target}`}>{lesson.target}点</span>
      </div>
      <p className="strategy-box">得点戦略：{lesson.scorePlan}</p>
      <button className="button" onClick={()=>setShowPlan(v=>!v)}>{showPlan?'解法手順を閉じる':'先に解法3手順を確認'}</button>
      {showPlan&&<ol className="solve-steps">{lesson.steps.map(x=><li key={x}>{x}</li>)}</ol>}
      <div className="training-problem">
        <span className="eyebrow">過去問の構造を保った類題</span>
        <p className="problem">{lesson.prompt}</p>
        <input className="answer-input" value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} disabled={result!==null} placeholder="答えを入力"/>
        {result===null?<div className="actions"><button className="button primary" onClick={submit} disabled={!answer.trim()}>採点する</button></div>:
          <div className={`result ${result?'ok':'ng'}`}>
            <h3>{result?'正解':'不正解'}</h3>
            <p><b>正答：</b>{lesson.answer}</p><p>{lesson.explanation}</p>
            {!result&&<label className="mistake-row">失点原因<select value={mistake} onChange={e=>setMistake(e.target.value)}>{mistakeTags.map(x=><option key={x}>{x}</option>)}</select></label>}
            <div className="actions"><button className="button primary" onClick={recordAndNext}>記録して次へ</button><button className="button" onClick={()=>{setAnswer('');setResult(null)}}>解き直す</button></div>
          </div>}
      </div>
    </article>

    <section className="card">
      <h2>合格につなげる回し方</h2>
      <div className="next-grid">
        <div><strong>1</strong><span>60点ルート</span><p>各年度の大問1と「60点」表示の大問を先に2周します。</p></div>
        <div><strong>2</strong><span>70点ルート</span><p>大問2〜5の（1）（2）で使う手順を、年度をまたいで反復します。</p></div>
        <div><strong>3</strong><span>75点安定</span><p>不正解だけを解き直し、計算・読み落とし・時間不足を分けて潰します。</p></div>
      </div>
    </section>
  </>
}
