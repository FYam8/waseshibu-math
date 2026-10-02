import { loadAttempts, loadExamScores, loadPreferences, loadSyncMeta } from './storage'
import { loadLearningRoute } from './learningRoute'
import { loadLevel2History } from './level2History'
import { loadGuidedProgressState } from './guidedReview'
import { WASESHIBU_SYNC_PROFILE } from './schools/waseshibu/syncProfile'

const SYNC_DB=WASESHIBU_SYNC_PROFILE.localDatabaseName
const SYNC_DB_VERSION=WASESHIBU_SYNC_PROFILE.localDatabaseVersion
const APP_ID=WASESHIBU_SYNC_PROFILE.appId
import './shared-progress-transport.js'

type StateRecord={sourceRecordId:string;eventType:string;occurredAt:string;payload:Record<string,unknown>}
function apiBase(){
  const environmentValues={
    [WASESHIBU_SYNC_PROFILE.apiEnvironmentKey]:import.meta.env.VITE_PROGRESS_API_BASE
  }
  const env=environmentValues[WASESHIBU_SYNC_PROFILE.apiEnvironmentKey]||''
  const win=typeof window!=='undefined'?(window as any)[WASESHIBU_SYNC_PROFILE.browserApiOverrideKey]||'':''
  return String(env||win).replace(/\/+$/,'')
}
function latestIso(values:string[]){return values.filter(v=>Number.isFinite(Date.parse(v))&&Date.parse(v)>0).sort().at(-1)||null}
function currentGuidedRecords(){return Object.values(loadGuidedProgressState()).filter(x=>x&&x.mastery!=='unseen')}
function unmirroredLevel2Attempts(attempts:ReturnType<typeof loadAttempts>,level2Attempts:ReturnType<typeof loadLevel2History>['attempts']){
  const mirrored=new Set(attempts.map(a=>`${a.at}|${a.questionId.replace(/^target-/,'')}`))
  return level2Attempts.filter(x=>!mirrored.has(`${x.answeredAt}|${x.questionId}`))
}
function buildStateRecords():StateRecord[]{
  const attempts=loadAttempts(),scores=loadExamScores(),level2=loadLevel2History(),guided=currentGuidedRecords(),prefs=loadPreferences(),route=loadLearningRoute(),meta=loadSyncMeta(),stateChangedAt=new Date().toISOString()
  const level2Only=unmirroredLevel2Attempts(attempts,level2.attempts)
  const latestExam=[...scores].filter(x=>x.completed!==false).sort((a,b)=>b.at.localeCompare(a.at))[0]
  const lastLearningAt=latestIso([...attempts.map(x=>x.at),...scores.map(x=>x.at),...level2Only.map(x=>x.answeredAt),...guided.map(x=>x.updatedAt)])
  const total=attempts.length+scores.length+level2Only.length+guided.length
  const records:StateRecord[]=[{
    sourceRecordId:'state:summary',eventType:'progress_state',occurredAt:stateChangedAt,
    payload:{total,kind:`target-${prefs.target}`,completed:false,...(lastLearningAt?{lastLearningAt}:{})}
  }]
  const examResetAt=meta.examScoresResetVersion>1_000_000_000_000?new Date(meta.examScoresResetVersion).toISOString():stateChangedAt
  records.push(latestExam?{
    sourceRecordId:'state:latest-exam',eventType:'exam_completed',occurredAt:latestExam.at,
    payload:{year:String(latestExam.year),score:latestExam.score,maxScore:100,kind:latestExam.scoreValidity||latestExam.attemptKind||'exam',completed:true,lastLearningAt:latestExam.at}
  }:{sourceRecordId:'state:latest-exam',eventType:'exam_state',occurredAt:examResetAt,payload:{completed:false}})
  const completedYears=new Set((route.completedCoreByTarget[String(prefs.target) as '60'|'70'|'75']||[]).map(Number))
  for(let year=2019;year<=2026;year++){
    const relevantTimes=[...scores.filter(x=>x.year===year).map(x=>x.at),...attempts.filter(x=>x.questionId.includes(String(year))||x.topic.includes(`${year}年度`)).map(x=>x.at),...level2Only.filter(x=>x.questionId.includes(String(year))).map(x=>x.answeredAt),...guided.filter(x=>x.questionId.includes(String(year))).map(x=>x.updatedAt)]
    const started=relevantTimes.length>0||route.solvedYears.includes(year)||completedYears.has(year)
    const completed=completedYears.has(year)
    records.push({sourceRecordId:`state:year:${year}`,eventType:completed?'year_completed':'year_state',occurredAt:stateChangedAt,payload:started?{year:String(year),completed}:{completed:false}})
  }
  return records
}
function buildBaseline(){
  const attempts=loadAttempts(),scores=loadExamScores(),level2=loadLevel2History(),guided=currentGuidedRecords(),years:Record<string,number>={}
  const level2Only=unmirroredLevel2Attempts(attempts,level2.attempts)
  for(const score of scores)years[String(score.year)]=(years[String(score.year)]||0)+1
  for(const attempt of attempts){const m=`${attempt.questionId} ${attempt.topic}`.match(/20(?:19|2[0-6])/);if(m)years[m[0]]=(years[m[0]]||0)+1}
  for(const attempt of level2Only){const m=attempt.questionId.match(/20(?:19|2[0-6])/);if(m)years[m[0]]=(years[m[0]]||0)+1}
  for(const record of guided){const m=record.questionId.match(/20(?:19|2[0-6])/);if(m)years[m[0]]=(years[m[0]]||0)+1}
  const eventCount=attempts.length+scores.length+level2Only.length+guided.length
  const payload={baseline:true,eventCount,scoredEventCount:scores.length,scoreTotal:scores.reduce((n,x)=>n+x.score,0),eventsByYear:years,capturedAt:new Date().toISOString(),progressLabel:`math target ${loadPreferences().target}`}
  return payload
}

let transport:any
export function initMathProgressSync(){
  if(transport||!apiBase()||typeof indexedDB==='undefined')return
  const shared=(globalThis as any).SHARED_PROGRESS_TRANSPORT
  if(!shared)return
  transport=shared.createTransport({schoolId:WASESHIBU_SYNC_PROFILE.schoolId,
    legacyEndpoint:WASESHIBU_SYNC_PROFILE.deploymentApiBase,
    appId:APP_ID,dbName:SYNC_DB,dbVersion:SYNC_DB_VERSION,endpoint:apiBase,
    loadState:()=>({}),buildStateRecords,buildBaseline,
    buildOccurrenceRecords:()=>[],occurrenceSignature:()=>''})
  transport.start()
}
