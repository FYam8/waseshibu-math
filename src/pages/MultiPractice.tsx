import { useEffect, useState } from 'react'
import { multiSets } from '../data/multiPractice'
import { createRecordId, saveAttempt } from '../storage'
import { isAcceptedAnswer } from '../answer'
import MathAnswerInput from '../components/MathAnswerInput'

const tags=['知識不足','解法未習得','読み落とし','計算ミス','符号ミス','場合分け不足','時間不足','答え方の不備']

export default function MultiPractice(){
  const [setIndex,setSetIndex]=useState(0)
  const [partIndex,setPartIndex]=useState(0)
  const [answer,setAnswer]=useState('')
  const [result,setResult]=useState<boolean|null>(null)
  const [hint,setHint]=useState(0)
  const [tag,setTag]=useState('解法未習得')
  const [elapsed,setElapsed]=useState(0)
  const set=multiSets[setIndex]
  const part=set.parts[partIndex]

  useEffect(()=>{
    const id=setInterval(()=>setElapsed(v=>v+1),1000)
    return ()=>clearInterval(id)
  },[setIndex,partIndex])

  const resetUi=()=>{setAnswer('');setResult(null);setHint(0);setTag('解法未習得');setElapsed(0)}

  const submit=()=>{
    if(result!==null || !answer.trim()) return
    setResult(isAcceptedAnswer(answer, part.answer, part.acceptedAnswers))
  }

  const next=()=>{
    if(result===null) return
    saveAttempt({
      id:createRecordId(`multi-${part.id}`),
      questionId:`multi-${part.id}`,
      mode:'multi',
      topic:set.domain,
      status:result?'correct':'wrong',
      mistakeTag:result?undefined:tag,
      seconds:elapsed,
      at:new Date().toISOString()
    })
    if(partIndex<set.parts.length-1) setPartIndex(partIndex+1)
    else {setSetIndex((setIndex+1)%multiSets.length);setPartIndex(0)}
    resetUi()
  }

  const defer=()=>{
    saveAttempt({
      id:createRecordId(`multi-${part.id}`),
      questionId:`multi-${part.id}`,
      mode:'multi',
      topic:set.domain,
      status:'deferred',
      seconds:elapsed,
      at:new Date().toISOString()
    })
    if(partIndex<set.parts.length-1) setPartIndex(partIndex+1)
    else {setSetIndex((setIndex+1)%multiSets.length);setPartIndex(0)}
    resetUi()
  }

  const decision =
    part.grade==='A' ? 'A：60点狙いでも優先して取りたい' :
    part.grade==='B' ? 'B：70点を狙うなら追加したい' :
    'C：数分で方針が立たなければ後回し候補'

  return <>
    <div className="page-head">
      <div><span className="eyebrow">誘導を読む練習</span><h1>大問2〜5 実戦類題</h1></div>
      <select value={setIndex} onChange={e=>{setSetIndex(Number(e.target.value));setPartIndex(0);resetUi()}}>
        {multiSets.map((s,i)=><option key={s.id} value={i}>{s.title}</option>)}
      </select>
    </div>

    <div className="card source-banner">
      <b>{set.domain}</b>
      <span>{set.basedOn}</span>
    </div>

    <div className="notice-box">
      この類題は過去問本文の転載ではなく、確認できる出題構造・誘導を参考に作成した自作問題です。
    </div>

    <div className="induction">
      {set.parts.map((p,i)=><div key={p.id} className={`induction-step ${i===partIndex?'current':''} ${i<partIndex?'done':''}`}>
        <b>({i+1})</b><span>{p.pattern}</span><em className={`mini grade-${p.grade}`}>{p.grade}</em>
      </div>)}
    </div>

    <article className="card practice-card">
      <div className="qtop">
        <div><span className="eyebrow">{part.pattern}</span><h2>{part.title}</h2></div>
        <div className="practice-meta"><span>{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')}</span></div>
      </div>

      <p className="strategy-box">{decision}</p>
      <p className="problem">{part.prompt}</p>

      <label className="answer-label">答え</label>
      <MathAnswerInput value={answer} onChange={setAnswer} onEnter={submit} disabled={result!==null}/>

      {result===null&&<div className="actions">
        <button className="button primary" onClick={submit} disabled={!answer.trim()}>採点</button>
        <button className="button" onClick={()=>setHint(Math.min(2,hint+1))}>ヒント</button>
        <button className="button ghost" onClick={defer}>この設問は見送る</button>
      </div>}

      {hint>=1&&<div className="hint"><b>ヒント1：</b>{part.hint1}</div>}
      {hint>=2&&<div className="hint"><b>ヒント2：</b>{part.hint2}</div>}

      {result!==null&&<div className={`result ${result?'ok':'ng'}`}>
        <strong>{result?'○ 正解':'× 不正解'}</strong>
        {!result&&<>
          <p>正答：{part.answer}</p>
          <label className="mistake-row">
            ミス分類
            <select value={tag} onChange={e=>setTag(e.target.value)}>
              {tags.map(t=><option key={t}>{t}</option>)}
            </select>
          </label>
        </>}
        <p>{part.explanation}</p>
        <div className="connection">
          <b>{partIndex===0?'【（1）の役割】':partIndex===1?'【（2）へのつながり】':'【（3）で必要な発想】'}</b>
          <p>{part.connection}</p>
        </div>
        <button className="button primary" onClick={next}>{partIndex===2?'次の大問へ':'次の設問へ'}</button>
      </div>}

      {elapsed>=180 && result===null &&
        <div className="time-warning">3分経過。C相当なら見送る、A/Bならヒントで方針を確認する判断も練習しましょう。</div>
      }
    </article>
  </>
}
