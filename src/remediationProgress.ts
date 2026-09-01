import { canWriteLearningData, notifyWriteBlocked } from './version'

export const REMEDIATION_PROGRESS_STORAGE_KEY='waseshibu-math-remediation-progress-v1'

export type RemediationProgressStatus='in-progress'|'completed'
export type RemediationProgressRecord={
  sourceQuestionId:string
  field:string
  rank:'A'|'B'|'C'
  currentIndex:number
  streak:number
  attemptCount:number
  correctQuestionIdsInCurrentStreak:string[]
  sourceAttemptAt?:string
  status:RemediationProgressStatus
  updatedAt:string
}
export type RemediationProgressState=Record<string,RemediationProgressRecord>
type StorageRead=Pick<Storage,'getItem'>
type StorageWrite=Pick<Storage,'getItem'|'setItem'>

const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,Math.floor(Number.isFinite(n)?n:min)))
const now=()=>new Date().toISOString()

export function loadRemediationProgressState(storage:StorageRead=localStorage):RemediationProgressState{
  try{
    const raw=JSON.parse(storage.getItem(REMEDIATION_PROGRESS_STORAGE_KEY)||'{}')
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return {}
    const out:RemediationProgressState={}
    for(const [key,value] of Object.entries(raw as Record<string,unknown>)){
      if(!value||typeof value!=='object'||Array.isArray(value))continue
      const v=value as Record<string,unknown>
      const sourceQuestionId=String(v.sourceQuestionId||key)
      const rank=v.rank==='B'||v.rank==='C'?v.rank:'A'
      const streak=clamp(Number(v.streak||0),0,4)
      out[sourceQuestionId]={
        ...v,
        sourceQuestionId,
        field:String(v.field||''),
        rank,
        currentIndex:Math.max(0,Math.floor(Number(v.currentIndex)||0)),
        streak,
        attemptCount:Math.max(0,Math.floor(Number(v.attemptCount)||0)),
        correctQuestionIdsInCurrentStreak:Array.isArray(v.correctQuestionIdsInCurrentStreak)?v.correctQuestionIdsInCurrentStreak.map(String).slice(-4):[],
        sourceAttemptAt:typeof v.sourceAttemptAt==='string'?v.sourceAttemptAt:undefined,
        status:v.status==='completed'||streak>=4?'completed':'in-progress',
        updatedAt:typeof v.updatedAt==='string'?v.updatedAt:new Date(0).toISOString()
      } as RemediationProgressRecord
    }
    return out
  }catch{return {}}
}

export function saveRemediationProgressState(state:RemediationProgressState,storage:StorageWrite=localStorage){
  if(typeof localStorage!=='undefined'&&storage===localStorage&&!canWriteLearningData()){notifyWriteBlocked();return}
  storage.setItem(REMEDIATION_PROGRESS_STORAGE_KEY,JSON.stringify(state))
}

export function loadRemediationProgress(sourceQuestionId:string,storage:StorageRead=localStorage){
  return loadRemediationProgressState(storage)[sourceQuestionId]
}

export function ensureRemediationProgress(
  sourceQuestionId:string,field:string,rank:'A'|'B'|'C',questionCount:number,latestSourceAttemptAt?:string,storage:StorageWrite=localStorage
){
  const state=loadRemediationProgressState(storage),existing=state[sourceQuestionId]
  // A newer source attempt means a fresh weakness: old 1/4..4/4 must never carry over.
  if(!existing||(
    latestSourceAttemptAt&&(!existing.sourceAttemptAt||existing.sourceAttemptAt<latestSourceAttemptAt)
  )){
    const fresh:RemediationProgressRecord={
      sourceQuestionId,field,rank,currentIndex:0,streak:0,attemptCount:0,
      correctQuestionIdsInCurrentStreak:[],sourceAttemptAt:latestSourceAttemptAt,status:'in-progress',updatedAt:now()
    }
    saveRemediationProgressState({...state,[sourceQuestionId]:fresh},storage)
    return fresh
  }
  const normalized={...existing,field,rank,currentIndex:questionCount?existing.currentIndex%questionCount:0}
  return normalized
}

export function recordRemediationAttempt(
  sourceQuestionId:string,field:string,rank:'A'|'B'|'C',questionCount:number,questionId:string,correct:boolean,
  latestSourceAttemptAt?:string,storage:StorageWrite=localStorage
){
  const current=ensureRemediationProgress(sourceQuestionId,field,rank,questionCount,latestSourceAttemptAt,storage)
  const state=loadRemediationProgressState(storage)
  let streak=0,correctIds:string[]=[]
  const isNewCorrect=correct&&!current.correctQuestionIdsInCurrentStreak.includes(questionId)
  if(isNewCorrect){
    correctIds=[...current.correctQuestionIdsInCurrentStreak,questionId]
    streak=Math.min(4,current.streak+1)
  }else if(correct){
    // A reload/repeat of a question already counted in the current streak does not advance.
    correctIds=[...current.correctQuestionIdsInCurrentStreak]
    streak=current.streak
  }
  const completed=streak>=4
  const nextIndex=completed?current.currentIndex:(!correct?0:(isNewCorrect?(current.currentIndex+1)%Math.max(1,questionCount):current.currentIndex))
  const next:RemediationProgressRecord={
    ...current,field,rank,currentIndex:nextIndex,streak,
    attemptCount:current.attemptCount+1,
    correctQuestionIdsInCurrentStreak:correctIds,
    sourceAttemptAt:latestSourceAttemptAt||current.sourceAttemptAt,
    status:completed?'completed':'in-progress',updatedAt:now()
  }
  saveRemediationProgressState({...state,[sourceQuestionId]:next},storage)
  return next
}

export function resetRemediationProgressForNewSourceAttempt(
  sourceQuestionId:string,field:string,rank:'A'|'B'|'C',latestSourceAttemptAt?:string,storage:StorageWrite=localStorage
){
  const state=loadRemediationProgressState(storage)
  const next:RemediationProgressRecord={sourceQuestionId,field,rank,currentIndex:0,streak:0,attemptCount:0,correctQuestionIdsInCurrentStreak:[],sourceAttemptAt:latestSourceAttemptAt,status:'in-progress',updatedAt:now()}
  saveRemediationProgressState({...state,[sourceQuestionId]:next},storage)
  return next
}

export function inProgressRemediations(storage:StorageRead=localStorage){
  return Object.values(loadRemediationProgressState(storage))
    .filter(x=>x.status==='in-progress'&&x.streak<4)
    .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
}
