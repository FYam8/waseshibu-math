export const BACKUP_KEYS=[
  'waseshibu-math-attempts','waseshibu-math-preferences','waseshibu-math-daily',
  'waseshibu-math-exam-scores','waseshibu-math-exam-drafts-v2','waseshibu-math-learning-route-v1'
] as const

export type BackupKey=typeof BACKUP_KEYS[number]
export type BackupPackage={app:'waseshibu-math';schemaVersion:1|2;exportedAt:string;data:Partial<Record<BackupKey,unknown>>}
export type RestoreMode='replace'|'merge'
export type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'>

const isObject=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)

export function collectBackup(storage:StorageLike=localStorage):BackupPackage{
  const data:Partial<Record<BackupKey,unknown>>={}
  BACKUP_KEYS.forEach(key=>{const raw=storage.getItem(key);if(raw!==null)try{data[key]=JSON.parse(raw)}catch{data[key]=raw}})
  return {app:'waseshibu-math',schemaVersion:2,exportedAt:new Date().toISOString(),data}
}

export function validateBackup(value:unknown):BackupPackage{
  if(!isObject(value)||value.app!=='waseshibu-math'||(value.schemaVersion!==1&&value.schemaVersion!==2)||typeof value.exportedAt!=='string'||Number.isNaN(Date.parse(value.exportedAt))||!isObject(value.data))throw new Error('このアプリのバックアップ形式ではありません')
  const data=value.data
  for(const key of Object.keys(data))if(!BACKUP_KEYS.includes(key as BackupKey))throw new Error(`未対応のデータ項目が含まれています：${key}`)
  const arrays:BackupKey[]=['waseshibu-math-attempts','waseshibu-math-exam-scores']
  for(const key of arrays)if(key in data&&!Array.isArray(data[key]))throw new Error(`${key} の形式が壊れています`)
  const objects:BackupKey[]=['waseshibu-math-preferences','waseshibu-math-daily','waseshibu-math-exam-drafts-v2','waseshibu-math-learning-route-v1']
  for(const key of objects)if(key in data&&data[key]!==null&&!isObject(data[key]))throw new Error(`${key} の形式が壊れています`)
  return value as BackupPackage
}

export function parseBackup(text:string):BackupPackage{
  if(text.length>5_000_000)throw new Error('ファイルが大きすぎます（上限5MB）')
  try{return validateBackup(JSON.parse(text))}catch(error){if(error instanceof SyntaxError)throw new Error('JSONファイルが壊れています');throw error}
}

function uniqueById(local:unknown,incoming:unknown){
  const a=Array.isArray(local)?local:[],b=Array.isArray(incoming)?incoming:[]
  return [...new Map([...a,...b].filter(isObject).map(x=>[String(x.id||JSON.stringify(x)),x])).values()]
}

export function mergeBackupValue(key:BackupKey,local:unknown,incoming:unknown){
  if(key.endsWith('attempts')||key.endsWith('exam-scores'))return uniqueById(local,incoming)
  if(key.endsWith('exam-drafts-v2'))return {...(isObject(local)?local:{}),...(isObject(incoming)?incoming:{})}
  if(key.endsWith('learning-route-v1')){
    const a:any=isObject(local)?local:{},b:any=isObject(incoming)?incoming:{},reinforcement={...(a.reinforcement||{})}
    for(const [planKey,incomingPlan] of Object.entries(b.reinforcement||{})){
      const localPlan:any=reinforcement[planKey],next:any=incomingPlan
      reinforcement[planKey]=localPlan?.examId===next?.examId?{...localPlan,...next,completedQuestionIds:[...new Set([...(localPlan.completedQuestionIds||[]),...(next.completedQuestionIds||[])])]}:next
    }
    return {...a,...b,solvedYears:[...new Set([...(a.solvedYears||[]),...(b.solvedYears||[])])],usedOldQuestionIds:[...new Set([...(a.usedOldQuestionIds||[]),...(b.usedOldQuestionIds||[])])],reinforcement,updatedAt:new Date().toISOString()}
  }
  return incoming
}

export function restoreBackup(storage:StorageLike,incoming:BackupPackage,mode:RestoreMode){
  validateBackup(incoming)
  const before=new Map<BackupKey,string|null>(BACKUP_KEYS.map(key=>[key,storage.getItem(key)]))
  const next=new Map<BackupKey,string|null>()
  BACKUP_KEYS.forEach(key=>{
    if(!(key in incoming.data)){next.set(key,mode==='replace'?null:before.get(key)??null);return}
    let value=incoming.data[key]
    if(mode==='merge'){let local:unknown=null;try{local=JSON.parse(before.get(key)||'null')}catch{/* invalid local data is replaced */}value=mergeBackupValue(key,local,value)}
    next.set(key,JSON.stringify(value))
  })
  try{
    BACKUP_KEYS.forEach(key=>{const value=next.get(key);if(value===null||value===undefined)storage.removeItem(key);else storage.setItem(key,value)})
  }catch(error){
    BACKUP_KEYS.forEach(key=>{const value=before.get(key);try{if(value===null||value===undefined)storage.removeItem(key);else storage.setItem(key,value)}catch{/* best-effort rollback */}})
    throw new Error(`復元できなかったため元のデータへ戻しました：${error instanceof Error?error.message:'保存エラー'}`)
  }
}

export function backupStats(pkg:BackupPackage){
  const attempts=pkg.data['waseshibu-math-attempts'],scores=pkg.data['waseshibu-math-exam-scores'],drafts=pkg.data['waseshibu-math-exam-drafts-v2']
  return {attempts:Array.isArray(attempts)?attempts.length:0,scores:Array.isArray(scores)?scores.length:0,drafts:isObject(drafts)?Object.keys(drafts).length:0}
}
