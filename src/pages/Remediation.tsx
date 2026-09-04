import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MathAnswerInput from '../components/MathAnswerInput'
import { classifyRemediationField } from '../data/remediation'
import { currentFieldId, level2FieldById, level2FigureUrl, resolveLevel2FieldId, type Level2Question } from '../data/level2Data'
import { isAcceptedLevel2Answer } from '../level2Answer'
import { markLevel2Assistance, recordLevel2Attempt, selectLevel2Question, type Level2Session } from '../level2History'
import { createRecordId, loadAttempts, saveAttempt } from '../storage'
import { updateGuidedProgress } from '../guidedReview'
import FocusedQuestionView from '../components/FocusedQuestionView'
import { isExamAnswerCorrect } from '../data/examAnswers'

type Presentation={question:Level2Question;presentationId:string;session:Level2Session;key:string}

export default function Remediation(){
  const [params]=useSearchParams(),topic=params.get('topic')||'式の計算・文字式',source=params.get('source'),sourceQuestion=params.get('q')||''
  const requestedField=params.get('field')||resolveLevel2FieldId(topic)||resolveLevel2FieldId(classifyRemediationField(topic).title)||'expressions'
  const latestSourceAttemptAt=sourceQuestion?loadAttempts().filter(a=>a.questionId===`exam-${sourceQuestion}`&&a.status!=='correct').sort((a,b)=>b.at.localeCompare(a.at))[0]?.at:undefined
  const [presentation,setPresentation]=useState<Presentation>(()=>selectLevel2Question(sourceQuestion||null,requestedField,localStorage,latestSourceAttemptAt))
  const [answer,setAnswer]=useState(''),[result,setResult]=useState<boolean|null>(null)
  const [usedHint,setUsedHint]=useState(false),[usedExplanation,setUsedExplanation]=useState(false),[revealedAnswer,setRevealedAnswer]=useState(false)
  const [session,setSession]=useState(presentation.session),[finished,setFinished]=useState(presentation.session.status==='completed')
  const q=presentation.question,fieldId=session.fieldIdAtSessionStart||currentFieldId(q.id),field=level2FieldById.get(fieldId)
  const isOfficial=q.bankType==='past-paper'

  const submit=()=>{
    if(result!==null||!answer.trim()||finished)return
    const correct=isOfficial?isExamAnswerCorrect(q.id,answer):isAcceptedLevel2Answer(answer,q)
    const recorded=recordLevel2Attempt({key:presentation.key,question:q,presentationId:presentation.presentationId,answer,correct,usedHint,usedExplanation,revealedAnswer,firstSubmission:true,practiceFieldId:fieldId})
    saveAttempt({id:createRecordId(isOfficial?'past-practice':'level2'),questionId:isOfficial?`target-${q.id}`:q.id,mode:'multi',topic:field?.label||topic,status:correct?'correct':'wrong',mistakeTag:correct?undefined:'解法未習得',answer,at:recorded.attempt.answeredAt})
    if(sourceQuestion)updateGuidedProgress(sourceQuestion,recorded.completed?{practiceStreak:4,mastery:'consolidated'}:{practiceStreak:recorded.session.currentStreak})
    if(recorded.completed)saveAttempt({id:createRecordId('mastery'),questionId:`mastery-${sourceQuestion||fieldId}`,mode:'multi',topic:field?.label||topic,status:'correct',at:recorded.attempt.answeredAt})
    setResult(correct);setSession(recorded.session);if(recorded.completed)setFinished(true)
  }
  const next=()=>{
    if(result===null||finished)return
    const selected=selectLevel2Question(sourceQuestion||null,requestedField)
    setPresentation(selected);setSession(selected.session);setAnswer('');setResult(null);setUsedHint(false);setUsedExplanation(false);setRevealedAnswer(false)
  }
  const useHint=()=>{setUsedHint(true);const next=markLevel2Assistance(presentation.key);if(next)setSession(next)}
  const reveal=()=>{setUsedExplanation(true);setRevealedAnswer(true);const next=markLevel2Assistance(presentation.key);if(next)setSession(next)}
  const restart=()=>{const selected=selectLevel2Question(sourceQuestion||null,requestedField,localStorage,latestSourceAttemptAt,true);setPresentation(selected);setSession(selected.session);setAnswer('');setResult(null);setUsedHint(false);setUsedExplanation(false);setRevealedAnswer(false);setFinished(false)}
  if(finished)return <section className="card mastery-card"><span className="eyebrow">MASTERED FOR NOW</span><h1>{session.requiredCount}/{session.requiredCount}問完了</h1><p><b>{field?.label||topic}</b>は、いったん克服しました。開始時に固定した{session.requiredCount}問すべてに自力で正解した履歴を保存しています。</p><p className="muted">後の過去問で再度間違えた場合は、新しい固定セットで弱点補強を開始します。</p><div className="actions"><Link className="button primary" to={source?`/reinforce?source=${source}`:'/mistakes'}>{source?'弱点補強へ戻る':'次の弱点へ'}</Link><button className="button" onClick={restart}>新しいセットで再練習</button><Link className="button" to="/">ホームへ</Link></div></section>
  const problemFigure=level2FigureUrl(q.problemFigure),hintFigure=level2FigureUrl(q.hintFigure),explanationFigure=level2FigureUrl(q.explanationFigure)
  return <>
    <div className="page-head"><div><span className="eyebrow">PRACTICE · OFFICIAL + LEVEL 2</span><h1>{field?.label||topic}</h1><p className="muted">開始時に固定した{session.requiredCount}問を、未正解の問題だけ周回します。</p></div><div className="streak-badge">完了 {session.currentStreak}/{session.requiredCount}</div></div>
    <div className="progress-track"><i style={{width:`${session.currentStreak/session.requiredCount*100}%`}}/></div>
    <article className="card practice-card">
      <div className="qtop"><div><span className="eyebrow">{isOfficial?'公式過去問':q.bankType==='field-support'?'FIELD SUPPORT':'CORE LEVEL 2'}</span><h2>{isOfficial?`${q.officialYear}年度 大問${q.officialMajor}（${q.officialSubNo}）`:q.id}</h2></div><span className="progress-pill">完了 {session.currentStreak}/{session.requiredCount}</span></div>
      {isOfficial&&q.officialYear&&q.officialMajor&&q.officialSubNo!==undefined&&q.officialSubIndex!==undefined&&q.officialSubCount?<FocusedQuestionView year={q.officialYear} major={q.officialMajor} subIndex={q.officialSubIndex} subCount={q.officialSubCount} subNo={q.officialSubNo} topic={field?.label||topic}/>:<>
        {q.context&&<p className="problem-context">{q.context}</p>}
        {q.problemTable&&<div className="level2-table-wrap"><table className="level2-table">{q.problemTable.caption&&<caption>{q.problemTable.caption}</caption>}<thead><tr>{q.problemTable.headers.map((header,index)=><th key={index} scope="col">{header}</th>)}</tr></thead><tbody>{q.problemTable.rows.map((row,rowIndex)=><tr key={rowIndex}>{row.map((cell,cellIndex)=>cellIndex===0?<th key={cellIndex} scope="row">{cell}</th>:<td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}
        <p className="problem">{q.prompt}</p>
        {problemFigure&&<figure className="level2-figure"><img src={problemFigure} alt={`${q.id}の問題図`}/></figure>}
      </>}
      <MathAnswerInput value={answer} onChange={setAnswer} onEnter={submit} disabled={result!==null} autoFocus/>
      {usedHint&&<div className="hint"><b>ヒント：</b>条件と求めるものを分け、対応する公式・性質を1つずつ確認しましょう。{hintFigure&&hintFigure!==problemFigure&&<figure className="level2-figure"><img src={hintFigure} alt={`${q.id}のヒント図`}/></figure>}</div>}
      {(usedExplanation||revealedAnswer)&&result===null&&<div className="answer-reveal"><span>解説・正答を確認しました</span><strong>{q.answer}</strong><p>{q.explanation}</p>{explanationFigure&&explanationFigure!==problemFigure&&<figure className="level2-figure"><img src={explanationFigure} alt={`${q.id}の解説図`}/></figure>}</div>}
      {result===null?<div className="actions"><button className="button primary" onClick={submit} disabled={!answer.trim()}>採点する</button><button className="button" onClick={useHint}>ヒント</button><button className="button" onClick={reveal}>答え・解説を見る</button></div>:
        <div className={`result ${result?'ok':'ng'}`}><h3>{result?'○ 正解':'× 不正解'}</h3><p><b>正答：</b>{q.answer}</p><p>{q.explanation}</p>{explanationFigure&&explanationFigure!==problemFigure&&<figure className="level2-figure"><img src={explanationFigure} alt={`${q.id}の解説図`}/></figure>}<p className="muted">{result&&!usedHint&&!usedExplanation&&!revealedAnswer?'この問題は完了です。正解済み問題は再出題しません。':result?'履歴は保存しましたが、補助を使ったため、この問題は後でもう一度出題します。':'ほかの問題の完了状態は維持します。この問題だけ一巡後にもう一度出題します。'}</p><button className="button primary" onClick={next}>次の問題へ</button></div>}
    </article>
    <section className="card"><h2>{session.requiredCount}問完了のルール</h2><p>開始時に固定した{session.requiredCount}問すべてに自力で正解すると「いったん克服」です。誤答や補助利用があっても正解済み問題は維持し、未正解問題だけを周回します。</p></section>
  </>
}
