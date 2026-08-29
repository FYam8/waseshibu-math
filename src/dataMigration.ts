export const DATA_VERSION_KEY='waseshibu-math-data-version'
export const CURRENT_DATA_VERSION=3
export const LEGACY_DRAFT_KEY='waseshibu-math-exam-drafts'
export const CURRENT_DRAFT_KEY='waseshibu-math-exam-drafts-v2'
export const PREP_STORAGE_KEY='waseshibu-math-prep-check-v1'
export const GUIDED_REVIEW_STORAGE_KEY='waseshibu-math-guided-review-v1'

export type MigrationStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>
const isObject=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)

export function normalizePrepRecord(value:unknown){
  const raw=isObject(value)?value:{}
  const answers:Record<string,string>={},tries:Record<string,number>={}
  if(isObject(raw.answers))for(const [key,answer] of Object.entries(raw.answers))if(typeof answer==='string'||typeof answer==='number')answers[key]=String(answer)
  if(isObject(raw.tries))for(const [key,count] of Object.entries(raw.tries)){const number=Number(count);if(Number.isFinite(number))tries[key]=Math.max(0,Math.floor(number))}
  return {
    ...raw,
    version:1,
    index:Number.isFinite(Number(raw.index))?Math.max(0,Number(raw.index)):0,
    answers,
    tries,
    completed:raw.completed===true,
    skipped:raw.skipped===true,
    updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:new Date(0).toISOString()
  }
}

export function migrateDataRecord(input:Record<string,unknown>,fromVersion:number){
  if(fromVersion>CURRENT_DATA_VERSION)throw new Error('このデータは新しいバージョンのアプリで作成されています。アプリを更新してから復元してください')
  const data={...input};let version=Math.max(0,fromVersion)
  if(version<1){
    if(!(CURRENT_DRAFT_KEY in data)&&LEGACY_DRAFT_KEY in data)data[CURRENT_DRAFT_KEY]=data[LEGACY_DRAFT_KEY]
    delete data[LEGACY_DRAFT_KEY]
    version=1
  }
  if(version<2){
    if(PREP_STORAGE_KEY in data)data[PREP_STORAGE_KEY]=normalizePrepRecord(data[PREP_STORAGE_KEY])
    version=2
  }
  if(version<3){
    if(!(GUIDED_REVIEW_STORAGE_KEY in data))data[GUIDED_REVIEW_STORAGE_KEY]={}
    version=3
  }
  data[DATA_VERSION_KEY]=CURRENT_DATA_VERSION
  return {data,version}
}

export function runDataMigrations(storage:MigrationStorage=localStorage){
  const storedVersion=Number(storage.getItem(DATA_VERSION_KEY)||'0')
  if(storedVersion>CURRENT_DATA_VERSION)return {ok:false,fromVersion:storedVersion,toVersion:storedVersion,error:'新しいデータ形式です'}
  if(storedVersion===CURRENT_DATA_VERSION)return {ok:true,fromVersion:storedVersion,toVersion:CURRENT_DATA_VERSION}
  const keys=['waseshibu-math-attempts','waseshibu-math-preferences','waseshibu-math-daily','waseshibu-math-exam-scores',CURRENT_DRAFT_KEY,'waseshibu-math-learning-route-v1',PREP_STORAGE_KEY,GUIDED_REVIEW_STORAGE_KEY,LEGACY_DRAFT_KEY]
  const source:Record<string,unknown>={}
  for(const key of keys){const raw=storage.getItem(key);if(raw===null)continue;try{source[key]=JSON.parse(raw)}catch{source[key]=raw}}
  const managedKeys=[...keys,DATA_VERSION_KEY],before=new Map(managedKeys.map(key=>[key,storage.getItem(key)]))
  try{
    const migrated=migrateDataRecord(source,Number.isFinite(storedVersion)?storedVersion:0)
    for(const [key,value] of Object.entries(migrated.data))storage.setItem(key,JSON.stringify(value))
    storage.setItem(DATA_VERSION_KEY,String(CURRENT_DATA_VERSION))
    return {ok:true,fromVersion:Number.isFinite(storedVersion)?storedVersion:0,toVersion:CURRENT_DATA_VERSION}
  }catch(error){
    for(const [key,value] of before)try{if(value===null)storage.removeItem(key);else storage.setItem(key,value)}catch{/* best-effort rollback */}
    return {ok:false,fromVersion:storedVersion,toVersion:storedVersion,error:`更新前のデータへ戻しました：${error instanceof Error?error.message:'移行できませんでした'}`}
  }
}
