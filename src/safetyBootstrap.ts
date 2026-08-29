import { BACKUP_KEYS, collectBackup, type BackupPackage, type StorageLike } from './dataBackup'
import { CURRENT_DATA_VERSION, LEGACY_DRAFT_KEY, runDataMigrations } from './dataMigration'
import { createDailyRestorePoint, createRestorePoint, restorePointPayload } from './safetyStorage'
import { ACTIVE_APP_VERSION_KEY, APP_VERSION, LAST_APP_VERSION_KEY, SAFE_MODE_KEY } from './version'

export const MIGRATION_JOURNAL_KEY='waseshibu-math-migration-journal-v1'
const LEASE_KEY='waseshibu-math-migration-lease-v1'
export const UPDATE_NOTICE_KEY='waseshibu-math-update-notice-v1'

type JournalStage='snapshot_started'|'snapshot_verified'|'migration_started'|'migration_validated'|'migration_committed'
type Journal={appVersion:string;stage:JournalStage;checkpointId?:string;startedAt:string;updatedAt:string}
export type BootstrapResult={mode:'normal';updated:boolean;checkpointId?:string}|{mode:'safe';message:string;checkpointId?:string;temporary?:boolean}
type Dependencies={
  storage?:StorageLike
  createPoint?:typeof createRestorePoint
  restorePoint?:typeof restorePointPayload
  migrate?:typeof runDataMigrations
  dailyPoint?:typeof createDailyRestorePoint
  useLock?:boolean
}

const isObject=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)
const json=(raw:string|null)=>{try{return raw===null?null:JSON.parse(raw)}catch{return null}}
const setOf=(value:unknown)=>new Set(Array.isArray(value)?value.map(String):[])
const includesAll=(before:Set<string>,after:Set<string>)=>[...before].every(x=>after.has(x))
const stable=(value:unknown):string=>Array.isArray(value)?`[${value.map(stable).join(',')}]`:value&&typeof value==='object'?`{${Object.entries(value as Record<string,unknown>).sort(([x],[y])=>x.localeCompare(y)).map(([key,item])=>`${JSON.stringify(key)}:${stable(item)}`).join(',')}}`:JSON.stringify(value)
const newerThan=(candidate:string,current:string)=>{const a=candidate.split('.').map(Number),b=current.split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length);i++){const difference=(a[i]||0)-(b[i]||0);if(difference)return difference>0}return false}

function validateNoLoss(before:BackupPackage,after:BackupPackage){
  const a=before.data,b=after.data,issues:string[]=[]
  for(const key of ['waseshibu-math-attempts','waseshibu-math-exam-scores'] as const){
    const beforeIds=new Set((Array.isArray(a[key])?a[key]:[]).map((x:any)=>String(x?.id||JSON.stringify(x))))
    const afterIds=new Set((Array.isArray(b[key])?b[key]:[]).map((x:any)=>String(x?.id||JSON.stringify(x))))
    if(!includesAll(beforeIds,afterIds))issues.push(`${key} の記録が減少しました`)
  }
  const draftA=isObject(a['waseshibu-math-exam-drafts-v2'])?new Set(Object.keys(a['waseshibu-math-exam-drafts-v2'])):new Set<string>()
  const draftB=isObject(b['waseshibu-math-exam-drafts-v2'])?new Set(Object.keys(b['waseshibu-math-exam-drafts-v2'])):new Set<string>()
  if(!includesAll(draftA,draftB))issues.push('途中の年度演習が減少しました')
  const routeA=isObject(a['waseshibu-math-learning-route-v1'])?a['waseshibu-math-learning-route-v1']:{}
  const routeB=isObject(b['waseshibu-math-learning-route-v1'])?b['waseshibu-math-learning-route-v1']:{}
  if(!includesAll(setOf(routeA.solvedYears),setOf(routeB.solvedYears)))issues.push('完了年度が減少しました')
  if(!includesAll(setOf(routeA.usedOldQuestionIds),setOf(routeB.usedOldQuestionIds)))issues.push('補強履歴が減少しました')
  const prepA=isObject(a['waseshibu-math-prep-check-v1'])?a['waseshibu-math-prep-check-v1']:{}
  const prepB=isObject(b['waseshibu-math-prep-check-v1'])?b['waseshibu-math-prep-check-v1']:{}
  const answersA=isObject(prepA.answers)?new Set(Object.keys(prepA.answers)):new Set<string>(),answersB=isObject(prepB.answers)?new Set(Object.keys(prepB.answers)):new Set<string>()
  if(!includesAll(answersA,answersB)||(prepA.completed===true&&prepB.completed!==true))issues.push('準備5問の進捗が減少しました')
  for(const key of ['waseshibu-math-preferences','waseshibu-math-daily'] as const)if(a[key]!==undefined&&b[key]===undefined)issues.push(`${key} が失われました`)
  for(const key of BACKUP_KEYS.filter(key=>!key.endsWith('data-version')))if(stable(a[key])!==stable(b[key]))issues.push(`${key} の内容が意図せず変化しました`)
  if(issues.length)throw new Error(issues.join('、'))
}

function learningDataExists(storage:StorageLike){
  return [...BACKUP_KEYS.filter(key=>!key.endsWith('data-version')),LEGACY_DRAFT_KEY].some(key=>storage.getItem(key)!==null)
}
function readJournal(storage:StorageLike):Journal|null{
  const value=json(storage.getItem(MIGRATION_JOURNAL_KEY));return isObject(value)&&typeof value.appVersion==='string'&&typeof value.stage==='string'?value as Journal:null
}
function writeJournal(storage:StorageLike,stage:JournalStage,checkpointId?:string){
  const previous=readJournal(storage),now=new Date().toISOString(),value:Journal={appVersion:APP_VERSION,stage,checkpointId,startedAt:previous?.appVersion===APP_VERSION?previous.startedAt:now,updatedAt:now}
  storage.setItem(MIGRATION_JOURNAL_KEY,JSON.stringify(value))
}
function safeResult(storage:StorageLike,message:string,checkpointId?:string,temporary=false):BootstrapResult{
  if(!temporary)try{storage.setItem(SAFE_MODE_KEY,JSON.stringify({appVersion:APP_VERSION,message,checkpointId,at:new Date().toISOString()}))}catch{/* UI still remains read-only */}
  return {mode:'safe',message,checkpointId,temporary}
}
async function requestPersistence(){
  try{if(typeof navigator!=='undefined'&&navigator.storage?.persist)return await navigator.storage.persist()}catch{/* browser decides */}return false
}
function announceUpdate(){
  try{if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('waseshibu-math-updates');channel.postMessage({type:'updated',version:APP_VERSION});channel.close()}}catch{/* optional */}
}

async function performBootstrap(deps:Dependencies):Promise<BootstrapResult>{
  const storage=deps.storage??localStorage,createPoint=deps.createPoint??createRestorePoint,restorePoint=deps.restorePoint??restorePointPayload,migrate=deps.migrate??runDataMigrations,dailyPoint=deps.dailyPoint??createDailyRestorePoint
  const safe=json(storage.getItem(SAFE_MODE_KEY))
  if(isObject(safe)&&safe.appVersion===APP_VERSION)return {mode:'safe',message:String(safe.message||'更新処理を完了できませんでした'),checkpointId:typeof safe.checkpointId==='string'?safe.checkpointId:undefined}
  if(safe)storage.removeItem(SAFE_MODE_KEY)

  const activeVersion=storage.getItem(ACTIVE_APP_VERSION_KEY)
  if(activeVersion&&newerThan(activeVersion,APP_VERSION))return safeResult(storage,'このタブより新しいバージョンが開かれています。学習履歴を保護するため、古い画面からの保存を停止しました。',undefined,true)

  const interrupted=readJournal(storage)
  if(interrupted?.appVersion===APP_VERSION&&['migration_started','migration_validated','migration_committed'].includes(interrupted.stage)){
    if(interrupted.checkpointId)try{await restorePoint(interrupted.checkpointId,storage)}catch(error){return safeResult(storage,`中断前の復元ポイントを確認できません：${error instanceof Error?error.message:'復元エラー'}`,interrupted.checkpointId)}
    return safeResult(storage,'前回の更新が途中で中断されたため、更新前の学習データへ戻して停止しました。',interrupted.checkpointId)
  }
  if(interrupted)storage.removeItem(MIGRATION_JOURNAL_KEY)

  const previous=storage.getItem(LAST_APP_VERSION_KEY)||storage.getItem(ACTIVE_APP_VERSION_KEY)
  const updated=previous!==APP_VERSION
  let checkpointId:string|undefined
  try{
    const storedDataVersion=Number(storage.getItem('waseshibu-math-data-version')||'0')
    if(!updated&&storedDataVersion===CURRENT_DATA_VERSION){
      try{await dailyPoint(storage)}catch{/* manual JSON export remains available */}
      return {mode:'normal',updated:false}
    }
    const hasData=learningDataExists(storage)
    if(updated&&hasData){
      writeJournal(storage,'snapshot_started')
      const point=await createPoint('pre_upgrade',storage,true);checkpointId=point.id
      writeJournal(storage,'snapshot_verified',checkpointId)
    }
    const before=collectBackup(storage)
    writeJournal(storage,'migration_started',checkpointId)
    const result=migrate(storage)
    if(!result.ok)throw new Error(result.error||'データを更新できませんでした')
    const after=collectBackup(storage)
    validateNoLoss(before,after)
    writeJournal(storage,'migration_validated',checkpointId)
    if(after.dataVersion!==CURRENT_DATA_VERSION)throw new Error('データ形式の更新を確認できませんでした')
    writeJournal(storage,'migration_committed',checkpointId)
    storage.setItem(ACTIVE_APP_VERSION_KEY,APP_VERSION)
    storage.setItem(LAST_APP_VERSION_KEY,APP_VERSION)
    storage.setItem(UPDATE_NOTICE_KEY,JSON.stringify({from:previous,to:APP_VERSION,at:new Date().toISOString(),checkpointId}))
    storage.removeItem(MIGRATION_JOURNAL_KEY)
    announceUpdate()
    void requestPersistence()
    try{await dailyPoint(storage)}catch{/* pre-upgrade point already protects this start */}
    return {mode:'normal',updated,checkpointId}
  }catch(error){
    if(checkpointId)try{await restorePoint(checkpointId,storage)}catch(restoreError){return safeResult(storage,`更新と自動復元の両方を完了できません：${restoreError instanceof Error?restoreError.message:'復元エラー'}`,checkpointId)}
    return safeResult(storage,`学習データを変更せず停止しました：${error instanceof Error?error.message:'更新エラー'}`,checkpointId)
  }
}

export async function bootstrapSafety(deps:Dependencies={}):Promise<BootstrapResult>{
  const storage=deps.storage??localStorage
  if(deps.useLock!==false&&typeof navigator!=='undefined'&&navigator.locks?.request){
    return navigator.locks.request('waseshibu-math-data-migration',()=>performBootstrap(deps))
  }
  const token=`${Date.now()}-${Math.random().toString(36).slice(2)}`,now=Date.now(),lease=json(storage.getItem(LEASE_KEY))
  if(isObject(lease)&&Number(lease.expiresAt)>now)return safeResult(storage,'別のタブで更新準備中です。少し待ってから再読み込みしてください。',undefined,true)
  try{
    storage.setItem(LEASE_KEY,JSON.stringify({token,expiresAt:now+30_000}))
    return await performBootstrap(deps)
  }finally{
    const current=json(storage.getItem(LEASE_KEY));if(isObject(current)&&current.token===token)storage.removeItem(LEASE_KEY)
  }
}
