import { canWriteLearningData, notifyWriteBlocked } from './version'
import { LEVEL2_ASSIGNMENT_SET_REVISION, assignmentRevision, currentFieldId, directQuestionForSource, level2FieldById, level2QuestionById, type Level2Question } from './data/level2Data'
import { requiredPracticeCount } from './practiceLoad'

export const LEVEL2_HISTORY_STORAGE_KEY='waseshibu-math-level2-history-v1'
export type Level2Bank='core160'|'past-paper'|'field-support'|'legacy72'
export type Level2Attempt={
  attemptId:string;questionId:string;presentationId:string;weaknessSessionId:string|null;answeredAt:string
  submissionIndex:number;isFirstSubmissionForPresentation:boolean;isCorrect:boolean;usedHintBeforeAnswer:boolean
  usedExplanationBeforeAnswer:boolean;revealedAnswerBeforeAnswer:boolean;contentRevisionAtAttempt:number
  gradingRevisionAtAttempt:number;fieldIdAtAttempt:string;fieldAssignmentRevisionAtAttempt:number
  practiceFieldIdAtAttempt:string|null;questionBank:Level2Bank;answer:string
}
export type QuestionStats={attemptCount:number;correctCount:number;qualifyingCorrectCount:number;lastAttemptAt:string|null;lastResult:boolean|null}
export type Level2Session={
  sessionId:string;triggerSourceQuestionId:string|null;directLevel2QuestionId:string|null;fieldIdAtSessionStart:string
  fieldAssignmentRevisionAtSessionStart:number;currentStreak:number;currentStreakQuestionIds:string[];bestStreak:number
  status:'active'|'completed';sourceAttemptAt?:string;lastQuestionId:string|null;lastPresentedIds:string[];bagRemaining:string[];updatedAt:string
  requiredCount:number;fixedQuestionIds:string[];completedQuestionIds:string[];retryQuestionIds:string[]
}
export type MasteryEvent={fieldId:string;achievedAt:string;fieldAssignmentRevision:number;questionIds:string[];requiredCount?:number;label:'いったん克服'}
export type Level2History={schemaVersion:1;attempts:Level2Attempt[];questionStats:Record<string,QuestionStats>;sessions:Record<string,Level2Session>;masteryEvents:MasteryEvent[]}
type StorageRead=Pick<Storage,'getItem'>
type StorageWrite=Pick<Storage,'getItem'|'setItem'>
const blank=():Level2History=>({schemaVersion:1,attempts:[],questionStats:{},sessions:{},masteryEvents:[]})
const uuid=()=>typeof crypto!=='undefined'&&'randomUUID'in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`
const now=()=>new Date().toISOString()
const uniqueIds=(value:unknown)=>Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==='string'))]:[]

export function loadLevel2History(storage:StorageRead=localStorage):Level2History{
  try{
    const raw=JSON.parse(storage.getItem(LEVEL2_HISTORY_STORAGE_KEY)||'null')
    if(!raw||typeof raw!=='object')return blank()
    const sessions:Record<string,Level2Session>={}
    if(raw.sessions&&typeof raw.sessions==='object'&&!Array.isArray(raw.sessions))for(const [key,value] of Object.entries(raw.sessions as Record<string,unknown>)){
      if(!value||typeof value!=='object'||Array.isArray(value))continue
      const session=value as Level2Session
      const currentStreakQuestionIds=uniqueIds(session.currentStreakQuestionIds)
      sessions[key]={...session,
        currentStreakQuestionIds,
        lastPresentedIds:uniqueIds(session.lastPresentedIds),
        bagRemaining:uniqueIds(session.bagRemaining),
        requiredCount:Math.max(1,Math.min(4,Number(session.requiredCount)||requiredPracticeCount(session.triggerSourceQuestionId,session.fieldIdAtSessionStart))),
        fixedQuestionIds:uniqueIds(session.fixedQuestionIds),
        completedQuestionIds:Array.isArray(session.completedQuestionIds)?uniqueIds(session.completedQuestionIds):currentStreakQuestionIds,
        retryQuestionIds:uniqueIds(session.retryQuestionIds)
      }
    }
    return {schemaVersion:1,attempts:Array.isArray(raw.attempts)?raw.attempts:[],questionStats:raw.questionStats&&typeof raw.questionStats==='object'?raw.questionStats:{},sessions,masteryEvents:Array.isArray(raw.masteryEvents)?raw.masteryEvents:[]}
  }catch{return blank()}
}

export function saveLevel2History(state:Level2History,storage:StorageWrite=localStorage){
  if(typeof localStorage!=='undefined'&&storage===localStorage&&!canWriteLearningData()){notifyWriteBlocked();return}
  storage.setItem(LEVEL2_HISTORY_STORAGE_KEY,JSON.stringify(state))
}

function sessionKey(sourceQuestionId:string|null,fieldId:string){return sourceQuestionId?`source:${sourceQuestionId}`:`field:${fieldId}`}
function freshSession(sourceQuestionId:string|null,fieldId:string,sourceAttemptAt?:string):Level2Session{
  const direct=sourceQuestionId?directQuestionForSource(sourceQuestionId):undefined
  return {sessionId:uuid(),triggerSourceQuestionId:sourceQuestionId,directLevel2QuestionId:direct?.id||null,fieldIdAtSessionStart:fieldId,
    fieldAssignmentRevisionAtSessionStart:direct?assignmentRevision(direct.id):LEVEL2_ASSIGNMENT_SET_REVISION,currentStreak:0,currentStreakQuestionIds:[],bestStreak:0,status:'active',sourceAttemptAt,lastQuestionId:null,lastPresentedIds:[],bagRemaining:[],requiredCount:requiredPracticeCount(sourceQuestionId,fieldId),fixedQuestionIds:[],completedQuestionIds:[],retryQuestionIds:[],updatedAt:now()}
}

export function ensureLevel2Session(sourceQuestionId:string|null,requestedFieldId:string,forceNew=false,storage:StorageWrite=localStorage,latestSourceAttemptAt?:string){
  const history=loadLevel2History(storage),direct=sourceQuestionId?directQuestionForSource(sourceQuestionId):undefined
  const fieldId=direct?currentFieldId(direct.id):requestedFieldId,key=sessionKey(sourceQuestionId,fieldId)
  let session=history.sessions[key]
  if(!session||forceNew||(latestSourceAttemptAt&&(!session.sourceAttemptAt||session.sourceAttemptAt<latestSourceAttemptAt)))session=freshSession(sourceQuestionId,fieldId,latestSourceAttemptAt)
  // 2019〜2021由来の旧Level2はバックログへ残すが、新しい公式過去問の
  // 4/4へ旧問題の連続記録を持ち越さない。履歴本体・bestStreakは削除しない。
  if(session.currentStreakQuestionIds.some(id=>/^L2-20(?:19|20|21)-/.test(id))){
    session={...session,currentStreak:0,currentStreakQuestionIds:[],status:'active',fixedQuestionIds:[],completedQuestionIds:[],retryQuestionIds:[],
      directLevel2QuestionId:direct?.id||null,lastQuestionId:/^L2-20(?:19|20|21)-/.test(session.lastQuestionId||'')?null:session.lastQuestionId,
      lastPresentedIds:session.lastPresentedIds.filter(id=>!/^L2-20(?:19|20|21)-/.test(id)),
      bagRemaining:session.bagRemaining.filter(id=>!/^L2-20(?:19|20|21)-/.test(id)),updatedAt:now()}
  }
  history.sessions[key]=session;saveLevel2History(history,storage)
  return {key,session,history}
}

function officialPastPriority(id:string,storage:StorageRead){
  if(!/^20(?:19|20|21)-Q/.test(id))return 0
  try{
    const attempts=JSON.parse(storage.getItem('waseshibu-math-attempts')||'[]') as Array<{questionId?:string;status?:string;at?:string}>
    const relevant=attempts.filter(a=>a.questionId===`exam-${id}`||a.questionId===`target-${id}`).sort((a,b)=>(b.at||'').localeCompare(a.at||''))
    return relevant[0]?.status==='correct'?2:relevant.length?0:1
  }catch{return 1}
}

function orderedCandidates(ids:string[],history:Level2History,session:Level2Session,storage:StorageRead){
  const eligible=ids.filter(id=>level2QuestionById.has(id)&&!session.currentStreakQuestionIds.includes(id))
  return [...eligible].sort((a,b)=>{
    const officialRank=officialPastPriority(a,storage)-officialPastPriority(b,storage)
    if(officialRank)return officialRank
    const seenRank=Number((history.questionStats[a]?.attemptCount||0)>0)-Number((history.questionStats[b]?.attemptCount||0)>0)
    return seenRank||(history.questionStats[a]?.lastAttemptAt||'').localeCompare(history.questionStats[b]?.lastAttemptAt||'')
  })
}

export function selectLevel2Question(sourceQuestionId:string|null,requestedFieldId:string,storage:StorageWrite=localStorage,latestSourceAttemptAt?:string,forceNew=false){
  const ensured=ensureLevel2Session(sourceQuestionId,requestedFieldId,forceNew,storage,latestSourceAttemptAt),{history}=ensured
  let {session}=ensured
  const field=level2FieldById.get(session.fieldIdAtSessionStart)
  if(!field)throw new Error('対応する分野の問題プールがありません')
  const ids=field.masteryEligibleQuestionIds.filter(id=>level2QuestionById.has(id))
  const directId=session.directLevel2QuestionId
  if(session.status==='completed'){
    const completedQuestionId=session.lastQuestionId||session.fixedQuestionIds.at(-1)||session.completedQuestionIds.at(-1)
    const completedQuestion=completedQuestionId?level2QuestionById.get(completedQuestionId):undefined
    if(!completedQuestion)throw new Error('完了済みセッションの問題が見つかりません')
    return {question:completedQuestion,presentationId:uuid(),session,key:ensured.key}
  }
  if(!session.fixedQuestionIds.length){
    const ordered=orderedCandidates(ids,history,session,storage)
    const retained=session.completedQuestionIds.filter(id=>ids.includes(id))
    const directFirst=directId&&ids.includes(directId)&&!retained.includes(directId)&&!session.lastQuestionId?[directId]:[]
    const fixed=[...retained,...directFirst,...ordered.filter(id=>!directFirst.includes(id)&&!retained.includes(id)&&id!==session.lastQuestionId),...(session.lastQuestionId&&ids.includes(session.lastQuestionId)?[session.lastQuestionId]:[])].slice(0,session.requiredCount)
    if(!fixed.length)throw new Error('出題可能な問題がありません')
    const completedQuestionIds=retained.filter(id=>fixed.includes(id))
    session={...session,requiredCount:fixed.length,fixedQuestionIds:fixed,bagRemaining:fixed.filter(id=>!completedQuestionIds.includes(id)),
      currentStreak:completedQuestionIds.length,currentStreakQuestionIds:completedQuestionIds,completedQuestionIds,retryQuestionIds:[]}
    if(session.completedQuestionIds.length>=session.requiredCount){
      session={...session,currentStreak:session.requiredCount,currentStreakQuestionIds:session.completedQuestionIds,status:'completed',updatedAt:now()}
      if(!history.masteryEvents.some(event=>event.fieldId===session.fieldIdAtSessionStart&&event.achievedAt===session.updatedAt)){
        history.masteryEvents.push({fieldId:session.fieldIdAtSessionStart,achievedAt:session.updatedAt,fieldAssignmentRevision:LEVEL2_ASSIGNMENT_SET_REVISION,questionIds:session.completedQuestionIds,requiredCount:session.requiredCount,label:'いったん克服'})
      }
      history.sessions[ensured.key]=session;saveLevel2History(history,storage)
      return {question:level2QuestionById.get(session.lastQuestionId||session.completedQuestionIds.at(-1)!)!,presentationId:uuid(),session,key:ensured.key}
    }
  }
  let bag=session.bagRemaining.filter(id=>session.fixedQuestionIds.includes(id)&&!session.completedQuestionIds.includes(id))
  if(!bag.length)bag=session.retryQuestionIds.filter(id=>session.fixedQuestionIds.includes(id)&&!session.completedQuestionIds.includes(id))
  const chosen=bag[0]
  if(!chosen)throw new Error('出題可能な問題がありません')
  session={...session,lastQuestionId:chosen,lastPresentedIds:[...session.lastPresentedIds,chosen].slice(-20),bagRemaining:bag,updatedAt:now()}
  history.sessions[ensured.key]=session;saveLevel2History(history,storage)
  return {question:level2QuestionById.get(chosen)!,presentationId:uuid(),session,key:ensured.key}
}

export type RecordLevel2Input={key:string;question:Level2Question;presentationId:string;answer:string;correct:boolean;usedHint:boolean;usedExplanation:boolean;revealedAnswer:boolean;firstSubmission:boolean;practiceFieldId:string|null}
export function markLevel2Assistance(key:string,storage:StorageWrite=localStorage){
  const history=loadLevel2History(storage),session=history.sessions[key]
  if(!session)return undefined
  const next={...session,status:'active' as const,updatedAt:now()}
  history.sessions[key]=next;saveLevel2History(history,storage);return next
}
export function recordLevel2Attempt(input:RecordLevel2Input,storage:StorageWrite=localStorage){
  const history=loadLevel2History(storage),session=history.sessions[input.key]
  if(!session)throw new Error('学習セッションが見つかりません')
  const at=now(),qualifying=input.firstSubmission&&input.correct&&!input.usedHint&&!input.usedExplanation&&!input.revealedAnswer
  const questionBank:Level2Bank=input.question.bankType==='field-support'?'field-support':input.question.bankType==='past-paper'?'past-paper':'core160'
  const attempt:Level2Attempt={attemptId:uuid(),questionId:input.question.id,presentationId:input.presentationId,weaknessSessionId:session.sessionId,answeredAt:at,submissionIndex:1,isFirstSubmissionForPresentation:input.firstSubmission,isCorrect:input.correct,usedHintBeforeAnswer:input.usedHint,usedExplanationBeforeAnswer:input.usedExplanation,revealedAnswerBeforeAnswer:input.revealedAnswer,contentRevisionAtAttempt:input.question.contentRevision||1,gradingRevisionAtAttempt:input.question.gradingRevision||1,fieldIdAtAttempt:currentFieldId(input.question.id),fieldAssignmentRevisionAtAttempt:assignmentRevision(input.question.id),practiceFieldIdAtAttempt:input.practiceFieldId,questionBank,answer:input.answer}
  const old=history.questionStats[input.question.id]||{attemptCount:0,correctCount:0,qualifyingCorrectCount:0,lastAttemptAt:null,lastResult:null}
  history.attempts.push(attempt)
  history.questionStats[input.question.id]={attemptCount:old.attemptCount+1,correctCount:old.correctCount+(input.correct?1:0),qualifyingCorrectCount:old.qualifyingCorrectCount+(qualifying?1:0),lastAttemptAt:at,lastResult:input.correct}
  const completedIds=qualifying&&!session.completedQuestionIds.includes(input.question.id)?[...session.completedQuestionIds,input.question.id]:session.completedQuestionIds
  const retryIds=qualifying?session.retryQuestionIds.filter(id=>id!==input.question.id):[...session.retryQuestionIds.filter(id=>id!==input.question.id),input.question.id]
  const progress=completedIds.length,best=Math.max(session.bestStreak,progress),completed=progress>=session.requiredCount
  history.sessions[input.key]={...session,currentStreak:progress,currentStreakQuestionIds:completedIds,completedQuestionIds:completedIds,retryQuestionIds:retryIds,bagRemaining:session.bagRemaining.filter(id=>id!==input.question.id),bestStreak:best,status:completed?'completed':'active',updatedAt:at}
  if(completed)history.masteryEvents.push({fieldId:session.fieldIdAtSessionStart,achievedAt:at,fieldAssignmentRevision:LEVEL2_ASSIGNMENT_SET_REVISION,questionIds:completedIds,requiredCount:session.requiredCount,label:'いったん克服'})
  saveLevel2History(history,storage)
  return {attempt,session:history.sessions[input.key],qualifying,completed}
}

export function resetLevel2Weakness(sourceQuestionId:string,fieldId:string,storage:StorageWrite=localStorage,latestSourceAttemptAt?:string){return ensureLevel2Session(sourceQuestionId,fieldId,true,storage,latestSourceAttemptAt)}

export function hasCurrentLevel2Mastery(fieldId:string,after:string,storage:StorageRead=localStorage){
  return loadLevel2History(storage).masteryEvents.some(event=>{
    const questionIds=[...new Set(event.questionIds)]
    return event.fieldId===fieldId&&event.achievedAt>after&&questionIds.length>=(event.requiredCount||4)&&questionIds.every(id=>level2QuestionById.has(id))
  })
}

export function inProgressLevel2Sessions(storage:StorageRead=localStorage){
  return Object.values(loadLevel2History(storage).sessions)
    .filter(session=>session.status==='active'&&(session.completedQuestionIds.length>0||session.lastPresentedIds.length>0))
    .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
}
