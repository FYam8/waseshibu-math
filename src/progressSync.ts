import { loadAttempts, loadExamScores, loadPreferences, loadSyncMeta } from './storage'
import { loadLearningRoute } from './learningRoute'

const SYNC_DB='waseshibu-progress-sync'
const SYNC_DB_VERSION=7
const APP_ID='math'
const MAX_BATCH=10
const RECONCILE_INTERVAL_MS=60_000
const REQUEST_TIMEOUT_MS=15_000
const te=new TextEncoder()
let timer:number|undefined
let running=false

type ControlRow={key:string,value:any}
type SyncEvent={eventId:string;appId:string;sourceRecordId:string;revision:number;eventType:string;occurredAt:string;payload:Record<string,unknown>;queuedAt:string}
type StateRecord={sourceRecordId:string;eventType:string;occurredAt:string;payload:Record<string,unknown>}

function apiBase(){
  const env=import.meta.env.VITE_PROGRESS_API_BASE||''
  const win=typeof window!=='undefined'?(window as any).__WASESHIBU_PROGRESS_API__||'':''
  return String(env||win).replace(/\/+$/,'')
}
function canonicalize(v:any):any{return Array.isArray(v)?v.map(canonicalize):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonicalize(v[k])])):v}
const canonicalJson=(v:any)=>JSON.stringify(canonicalize(v))
async function sha256Hex(v:string){const d=await crypto.subtle.digest('SHA-256',te.encode(v));return[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function randomToken(bytes=32){const a=new Uint8Array(bytes);crypto.getRandomValues(a);let s='';for(const b of a)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'')}
async function fetchWithTimeout(url:string,options:RequestInit={}){const c=new AbortController(),id=window.setTimeout(()=>c.abort(),REQUEST_TIMEOUT_MS);try{return await fetch(url,{...options,signal:c.signal})}finally{clearTimeout(id)}}
function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(SYNC_DB,SYNC_DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('control'))db.createObjectStore('control',{keyPath:'key'});if(!db.objectStoreNames.contains('outbox'))db.createObjectStore('outbox',{keyPath:'eventId'});if(!db.objectStoreNames.contains('deadletter'))db.createObjectStore('deadletter',{keyPath:'eventId'});if(!db.objectStoreNames.contains('seen_v2'))db.createObjectStore('seen_v2',{keyPath:'sourceKey'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('progress sync database blocked'))})}
function txDone(tx:IDBTransaction){return new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('transaction aborted'))})}
function requestValue<T=any>(req:IDBRequest<T>){return new Promise<T>((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function getControl(key:string){const db=await openDb();try{const tx=db.transaction('control','readonly'),row=await requestValue<ControlRow|undefined>(tx.objectStore('control').get(key));await txDone(tx);return row?.value}finally{db.close()}}
async function setControl(key:string,value:any){const db=await openDb();try{const tx=db.transaction('control','readwrite'),s=tx.objectStore('control');value==null?s.delete(key):s.put({key,value});await txDone(tx)}finally{db.close()}}
function sourceKey(id:string){return `${APP_ID}:${id}`}
function deviceMetadata(){const ua=String(navigator.userAgent||'');return{deviceType:/iPad|Tablet/i.test(ua)?'tablet':/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop',osFamily:/iPhone|iPad|iOS/i.test(ua)?'iOS/iPadOS':/Android/i.test(ua)?'Android':/Windows/i.test(ua)?'Windows':/Mac OS|Macintosh/i.test(ua)?'macOS':/Linux/i.test(ua)?'Linux':'unknown',browserFamily:/Edg\//i.test(ua)?'Edge':/CriOS|Chrome\//i.test(ua)?'Chrome':/FxiOS|Firefox\//i.test(ua)?'Firefox':/Safari\//i.test(ua)?'Safari':'unknown'}}
async function ensureRegistration(){
  if(!apiBase()||await getControl('syncRevoked'))return null
  const existing=await getControl('registration');if(existing?.credential)return existing
  let pending=await getControl('pendingRegistration')
  if(!pending?.registrationId||!pending?.credential){pending={registrationId:crypto.randomUUID(),credential:randomToken(),createdAt:new Date().toISOString()};await setControl('pendingRegistration',pending)}
  try{
    const r=await fetchWithTimeout(`${apiBase()}/v1/register-anonymous`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({registrationId:pending.registrationId,credentialHash:await sha256Hex(pending.credential),device:deviceMetadata()})})
    const d=await r.json().catch(()=>({}));if(!r.ok)return null
    const reg={registrationId:pending.registrationId,credential:pending.credential,status:d.status||'unclassified',deviceCode:d.deviceCode||null,enrolledAt:new Date().toISOString()}
    await setControl('registration',reg);return reg
  }catch{return null}
}
function latestIso(values:string[]){return values.filter(v=>Number.isFinite(Date.parse(v))).sort().at(-1)||'1970-01-01T00:00:00.000Z'}
function buildStateRecords():StateRecord[]{
  const attempts=loadAttempts(),scores=loadExamScores(),prefs=loadPreferences(),route=loadLearningRoute(),meta=loadSyncMeta()
  const latestExam=[...scores].filter(x=>x.completed!==false).sort((a,b)=>b.at.localeCompare(a.at))[0]
  const lastLearningAt=latestIso([...attempts.map(x=>x.at),...scores.map(x=>x.at),route.updatedAt])
  const records:StateRecord[]=[{
    sourceRecordId:'state:summary',eventType:'progress_state',occurredAt:lastLearningAt,
    payload:{total:attempts.length+scores.length,kind:`target-${prefs.target}`,completed:false}
  }]
  const examResetAt=meta.examScoresResetVersion>1_000_000_000_000?new Date(meta.examScoresResetVersion).toISOString():lastLearningAt
  records.push(latestExam?{
    sourceRecordId:'state:latest-exam',eventType:'exam_completed',occurredAt:latestExam.at,
    payload:{year:String(latestExam.year),score:latestExam.score,maxScore:100,kind:latestExam.scoreValidity||latestExam.attemptKind||'exam',completed:true}
  }:{sourceRecordId:'state:latest-exam',eventType:'exam_state',occurredAt:examResetAt,payload:{completed:false}})
  const completedYears=new Set((route.completedCoreByTarget[String(prefs.target) as '60'|'70'|'75']||[]).map(Number))
  for(let year=2019;year<=2026;year++){
    const relevantTimes=[...scores.filter(x=>x.year===year).map(x=>x.at),...attempts.filter(x=>x.questionId.includes(String(year))||x.topic.includes(`${year}年度`)).map(x=>x.at)]
    const started=relevantTimes.length>0||route.solvedYears.includes(year)||completedYears.has(year)
    const completed=completedYears.has(year)
    records.push({sourceRecordId:`state:year:${year}`,eventType:completed?'year_completed':'year_state',occurredAt:started?latestIso([...relevantTimes,route.updatedAt]):lastLearningAt,payload:started?{year:String(year),completed}:{completed:false}})
  }
  return records
}
async function queueState(record:StateRecord){
  const fingerprint=await sha256Hex(canonicalJson({eventType:record.eventType,payload:record.payload}))
  const sourceHash=await sha256Hex(record.sourceRecordId)
  const db=await openDb();try{
    const tx=db.transaction(['outbox','seen_v2'],'readwrite'),seen=tx.objectStore('seen_v2'),key=sourceKey(record.sourceRecordId),current=await requestValue<any>(seen.get(key))
    if(current?.fingerprint===fingerprint){await txDone(tx);return false}
    const revision=Math.max(0,Number(current?.revision||0))+1
    const item:SyncEvent={eventId:`${APP_ID}:${sourceHash}:r${revision}`,appId:APP_ID,sourceRecordId:record.sourceRecordId,revision,eventType:record.eventType,occurredAt:record.occurredAt,payload:record.payload,queuedAt:new Date().toISOString()}
    tx.objectStore('outbox').put(item);seen.put({sourceKey:key,appId:APP_ID,sourceRecordId:record.sourceRecordId,state:'queued',revision,fingerprint,at:new Date().toISOString()});await txDone(tx);return true
  }finally{db.close()}
}
async function uploadBaseline(reg:any){
  const key=`${APP_ID}:baselineSent:${reg.registrationId}`;if(await getControl(key))return true
  const attempts=loadAttempts(),scores=loadExamScores(),years:Record<string,number>={}
  for(const score of scores)years[String(score.year)]=(years[String(score.year)]||0)+1
  for(const attempt of attempts){const m=`${attempt.questionId} ${attempt.topic}`.match(/20(?:19|2[0-6])/);if(m)years[m[0]]=(years[m[0]]||0)+1}
  const payload={baseline:true,eventCount:attempts.length+scores.length,scoredEventCount:scores.length,scoreTotal:scores.reduce((n,x)=>n+x.score,0),eventsByYear:years,capturedAt:new Date().toISOString(),progressLabel:`math target ${loadPreferences().target}`}
  try{const r=await fetchWithTimeout(`${apiBase()}/v1/progress/snapshot`,{method:'PUT',headers:{'content-type':'application/json','authorization':`Bearer ${reg.credential}`},body:JSON.stringify({appId:APP_ID,generation:1,payload})});const d=await r.json().catch(()=>({}));if(r.status===401){await setControl('syncRevoked',true);return false}if(r.status===403&&d?.code==='collection_disabled'){await setControl('collectionDisabled',true);return false}if(!r.ok)return false;await setControl(key,{at:new Date().toISOString()});return true}catch{return false}
}
async function readOutbox(){const db=await openDb();try{const tx=db.transaction('outbox','readonly'),rows=await requestValue<any[]>(tx.objectStore('outbox').getAll());await txDone(tx);return(rows||[]).filter(x=>x?.appId===APP_ID).sort((a,b)=>String(a.queuedAt).localeCompare(String(b.queuedAt))).slice(0,MAX_BATCH)}finally{db.close()}}
async function settle(ids:string[]){if(!ids.length)return;const db=await openDb();try{const tx=db.transaction('outbox','readwrite'),s=tx.objectStore('outbox');ids.forEach(id=>s.delete(id));await txDone(tx)}finally{db.close()}}
async function flush(reg:any){const batch=await readOutbox();if(!batch.length)return true;try{const r=await fetchWithTimeout(`${apiBase()}/v1/events/batch`,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${reg.credential}`},body:JSON.stringify({events:batch.map(({queuedAt,...e})=>e)})});const d=await r.json().catch(()=>({}));if(r.status===401){await setControl('syncRevoked',true);return false}if(r.status===403&&d?.code==='collection_disabled'){await setControl('collectionDisabled',true);return false}if(!r.ok)return false;await settle([...(d.accepted||[]),...(d.duplicate||[])]);return true}catch{return false}}
async function syncOnce(){
  if(running||!apiBase()||navigator.onLine===false)return;running=true
  try{const reg=await ensureRegistration();if(!reg?.credential||await getControl('collectionDisabled'))return;if(!(await uploadBaseline(reg)))return;for(const record of buildStateRecords())await queueState(record);await flush(reg)}finally{running=false}
}
export function initMathProgressSync(){
  if(!apiBase()||typeof indexedDB==='undefined')return
  void syncOnce()
  if(!timer)timer=window.setInterval(()=>void syncOnce(),RECONCILE_INTERVAL_MS)
  window.addEventListener('online',()=>void syncOnce())
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void syncOnce()})
}
