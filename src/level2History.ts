import { canWriteLearningData, notifyWriteBlocked } from './version'
import { LEVEL2_ASSIGNMENT_SET_REVISION, assignmentRevision, currentFieldId, directQuestionForSource, level2FieldById, level2QuestionById, type Level2Question } from './data/level2Data'

export const LEVEL2_HISTORY_STORAGE_KEY='waseshibu-math-level2-history-v1'
export type Level2Bank='core160'|'field-support'|'legacy72'
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
}
export type MasteryEvent={fieldId:string;achievedAt:string;fieldAssignmentRevision:number;questionIds:string[];label:'いったん克服'}
export type Level2History={schemaVersion:1;attempts:Level2Attempt[];questionStats:Record<string,QuestionStats>;sessions:Record<string,Level2Session>;masteryEvents:MasteryEvent[]}
type StorageRead=Pick<Storage,'getItem'>
type StorageWrite=Pick<Storage,'getItem'|'setItem'>
const blank=():Level2History=>({schemaVersion:1,attempts:[],questionStats:{},sessions:{},masteryEvents:[]})
const uuid=()=>typeof crypto!=='undefined'&&'randomUUID'in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`
const now=()=>new Date().toISOString()

export function loadLevel2History(storage:StorageRead=localStorage):Level2History{
  try{
    const raw=JSON.parse(storage.getItem(LEVEL2_HISTORY_STORAGE_KEY)||'null')
    if(!raw||typeof raw!=='object')return blank()
    return {schemaVersion:1,attempts:Array.isArray(raw.attempts)?raw.attempts:[],questionStats:raw.questionStats&&typeof raw.questionStats==='object'?raw.questionStats:{},sessions:raw.sessions&&typeof raw.sessions==='object'?raw.sessions:{},masteryEvents:Array.isArray(raw.masteryEvents)?raw.masteryEvents:[]}
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
    fieldAssignmentRevisionAtSessionStart:direct?assignmentRevision(direct.id):LEVEL2_ASSIGNMENT_SET_REVISION,currentStreak:0,currentStreakQuestionIds:[],bestStreak:0,status:'active',sourceAttemptAt,lastQuestionId:null,lastPresentedIds:[],bagRemaining:[],updatedAt:now()}
}

export function ensureLevel2Session(sourceQuestionId:string|null,requestedFieldId:string,forceNew=false,storage:StorageWrite=localStorage,latestSourceAttemptAt?:string){
  const history=loadLevel2History(storage),direct=sourceQuestionId?directQuestionForSource(sourceQuestionId):undefined
  const fieldId=direct?currentFieldId(direct.id):requestedFieldId,key=sessionKey(sourceQuestionId,fieldId)
  let session=history.sessions[key]
  if(!session||forceNew||(latestSourceAttemptAt&&(!session.sourceAttemptAt||session.sourceAttemptAt<latestSourceAttemptAt)))session=freshSession(sourceQuestionId,fieldId,latestSourceAttemptAt)
  history.sessions[key]=session;saveLevel2History(history,storage)
  return {key,session,history}
}

function orderedCandidates(ids:string[],history:Level2History,session:Level2Session){
  const eligible=ids.filter(id=>level2QuestionById.has(id)&&!session.currentStreakQuestionIds.includes(id))
  const unseen=eligible.filter(id=>(history.questionStats[id]?.attemptCount||0)===0)
  const byOldest=(xs:string[])=>[...xs].sort((a,b)=>(history.questionStats[a]?.lastAttemptAt||'').localeCompare(history.questionStats[b]?.lastAttemptAt||''))
  return unseen.length?byOldest(unseen):byOldest(eligible)
}

export function selectLevel2Question(sourceQuestionId:string|null,requestedFieldId:string,storage:StorageWrite=localStorage,latestSourceAttemptAt?:string,forceNew=false){
  const ensured=ensureLevel2Session(sourceQuestionId,requestedFieldId,forceNew,storage,latestSourceAttemptAt),{history}=ensured
  let {session}=ensured
  const field=level2FieldById.get(session.fieldIdAtSessionStart)
  if(!field)throw new Error('対応する分野の問題プールがありません')
  const ids=field.masteryEligibleQuestionIds
  const directId=session.directLevel2QuestionId
  let chosen:string|undefined
  if(directId&&!session.currentStreakQuestionIds.includes(directId)&&!session.lastPresentedIds.slice(-3).includes(directId))chosen=directId
  let bag=session.bagRemaining.filter(id=>ids.includes(id)&&id!==session.lastQuestionId&&!session.currentStreakQuestionIds.includes(id))
  if(!chosen){
    if(!bag.length)bag=orderedCandidates(ids,history,session).filter(id=>id!==session.lastQuestionId)
    chosen=bag[0]||orderedCandidates(ids,history,session)[0]||ids.find(id=>id!==session.lastQuestionId)||ids[0]
  }
  if(!chosen)throw new Error('出題可能な問題がありません')
  bag=bag.filter(id=>id!==chosen)
  session={...session,lastQuestionId:chosen,lastPresentedIds:[...session.lastPresentedIds,chosen].slice(-20),bagRemaining:bag,updatedAt:now()}
  history.sessions[ensured.key]=session;saveLevel2History(history,storage)
  return {question:level2QuestionById.get(chosen)!,presentationId:uuid(),session,key:ensured.key}
}

export type RecordLevel2Input={key:string;question:Level2Question;presentationId:string;answer:string;correct:boolean;usedHint:boolean;usedExplanation:boolean;revealedAnswer:boolean;firstSubmission:boolean;practiceFieldId:string|null}
export function markLevel2Assistance(key:string,storage:StorageWrite=localStorage){
  const history=loadLevel2History(storage),session=history.sessions[key]
  if(!session)return undefined
  const next={...session,currentStreak:0,currentStreakQuestionIds:[],status:'active' as const,updatedAt:now()}
  history.sessions[key]=next;saveLevel2History(history,storage);return next
}
export function recordLevel2Attempt(input:RecordLevel2Input,storage:StorageWrite=localStorage){
  const history=loadLevel2History(storage),session=history.sessions[input.key]
  if(!session)throw new Error('学習セッションが見つかりません')
  const at=now(),qualifying=input.firstSubmission&&input.correct&&!input.usedHint&&!input.usedExplanation&&!input.revealedAnswer
  const attempt:Level2Attempt={attemptId:uuid(),questionId:input.question.id,presentationId:input.presentationId,weaknessSessionId:session.sessionId,answeredAt:at,submissionIndex:1,isFirstSubmissionForPresentation:input.firstSubmission,isCorrect:input.correct,usedHintBeforeAnswer:input.usedHint,usedExplanationBeforeAnswer:input.usedExplanation,revealedAnswerBeforeAnswer:input.revealedAnswer,contentRevisionAtAttempt:input.question.contentRevision||1,gradingRevisionAtAttempt:input.question.gradingRevision||1,fieldIdAtAttempt:currentFieldId(input.question.id),fieldAssignmentRevisionAtAttempt:assignmentRevision(input.question.id),practiceFieldIdAtAttempt:input.practiceFieldId,questionBank:(input.question.bankType==='field-support'?'field-support':'core160'),answer:input.answer}
  const old=history.questionStats[input.question.id]||{attemptCount:0,correctCount:0,qualifyingCorrectCount:0,lastAttemptAt:null,lastResult:null}
  history.attempts.push(attempt)
  history.questionStats[input.question.id]={attemptCount:old.attemptCount+1,correctCount:old.correctCount+(input.correct?1:0),qualifyingCorrectCount:old.qualifyingCorrectCount+(qualifying?1:0),lastAttemptAt:at,lastResult:input.correct}
  const streakIds=qualifying&&!session.currentStreakQuestionIds.includes(input.question.id)?[...session.currentStreakQuestionIds,input.question.id]:[]
  const streak=streakIds.length,best=Math.max(session.bestStreak,streak),completed=streak>=4
  history.sessions[input.key]={...session,currentStreak:streak,currentStreakQuestionIds:streakIds,bestStreak:best,status:completed?'completed':'active',updatedAt:at}
  if(completed)history.masteryEvents.push({fieldId:session.fieldIdAtSessionStart,achievedAt:at,fieldAssignmentRevision:LEVEL2_ASSIGNMENT_SET_REVISION,questionIds:streakIds.slice(-4),label:'いったん克服'})
  saveLevel2History(history,storage)
  return {attempt,session:history.sessions[input.key],qualifying,completed}
}

export function resetLevel2Weakness(sourceQuestionId:string,fieldId:string,storage:StorageWrite=localStorage,latestSourceAttemptAt?:string){return ensureLevel2Session(sourceQuestionId,fieldId,true,storage,latestSourceAttemptAt)}
