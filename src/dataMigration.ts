
export const DATA_VERSION_KEY='waseshibu-math-data-version'
export const CURRENT_DATA_VERSION=6
export const LEGACY_DRAFT_KEY='waseshibu-math-exam-drafts'
export const CURRENT_DRAFT_KEY='waseshibu-math-exam-drafts-v2'
export const PREP_STORAGE_KEY='waseshibu-math-prep-check-v1'
export const GUIDED_REVIEW_STORAGE_KEY='waseshibu-math-guided-review-v1'
export const GUIDED_PROGRESS_STORAGE_KEY='waseshibu-math-guided-progress-v2'
export const MIGRATION_BACKUP_STORAGE_KEY='waseshibu-math-migration-backup-v1'
export const REMEDIATION_PROGRESS_STORAGE_KEY='waseshibu-math-remediation-progress-v1'

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

function migratedMastery(record:Record<string,unknown>){
  const outcome=String(record.outcome||'')
  if(outcome==='independent')return 'independent'
  if(outcome==='reproduced')return 'reproduced'
  if(outcome==='guided')return 'guided'
  if(record.answerSeen===true)return 'exposed'
  if(outcome==='wrong'||record.step1||record.step2||record.finalAnswer)return 'attempted'
  return 'unseen'
}

export function guidedProgressFromLegacy(value:unknown){
  const legacy=isObject(value)?value:{},result:Record<string,unknown>={}
  for(const [questionId,item] of Object.entries(legacy)){
    if(!isObject(item))continue
    const hintUsed=item.hintUsed===true,answerSeen=item.answerSeen===true,outcome=String(item.outcome||'')
    const stepProgress:Record<string,unknown>={}
    if(typeof item.step1==='string'&&item.step1)stepProgress.focus={stepId:'focus',answer:item.step1,tries:1,hintLevelUsed:hintUsed?1:0,completed:true}
    if(typeof item.step2==='string'&&item.step2)stepProgress.method={stepId:'method',answer:item.step2,tries:1,hintLevelUsed:hintUsed?1:0,completed:true}
    result[questionId]={
      questionId,
      stepProgress,
      finalAnswer:typeof item.finalAnswer==='string'?item.finalAnswer:'',
      finalAnswerSeen:answerSeen,
      reproductionAttempts:outcome==='reproduced'?1:0,
      reproductionSucceeded:outcome==='reproduced',
      independentSucceeded:outcome==='independent',
      practiceStreak:0,
      mastery:migratedMastery(item),
      updatedAt:typeof item.updatedAt==='string'?item.updatedAt:new Date(0).toISOString(),
      migratedFrom:'waseshibu-math-guided-review-v1'
    }
  }
  return result
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
  if(version<4){
    // 旧Guided Reviewは一切削除・上書きせず、新形式へコピーして派生させる。
    if(!(GUIDED_PROGRESS_STORAGE_KEY in data))data[GUIDED_PROGRESS_STORAGE_KEY]=guidedProgressFromLegacy(data[GUIDED_REVIEW_STORAGE_KEY])
    version=4
  }
  if(version<5){
    // v5はUX・目標ロジックの更新。学習履歴の意味は変更せず、そのまま保持する。
    version=5
  }
  if(version<6){
    // v6は類題の「問題位置＋連続正解」を元問題ID単位で永続化する。
    // v5以前の practiceStreak には「4つの異なる類題を順に正解した」証拠がない。
    // 旧不具合で同じ類題の再正解が連続数に混ざった可能性があるため、
    // Guided履歴そのものは保持するが、新しい mastery 判定へは引き継がない。
    // 類題を次に開いた時点から、安全側の 0/4 で新形式の進捗を開始する。
    if(!(REMEDIATION_PROGRESS_STORAGE_KEY in data))data[REMEDIATION_PROGRESS_STORAGE_KEY]={}
    version=6
  }
  data[DATA_VERSION_KEY]=CURRENT_DATA_VERSION
  return {data,version}
}

export function runDataMigrations(storage:MigrationStorage=localStorage){
  const storedVersion=Number(storage.getItem(DATA_VERSION_KEY)||'0')
  if(storedVersion>CURRENT_DATA_VERSION)return {ok:false,fromVersion:storedVersion,toVersion:storedVersion,error:'新しいデータ形式です'}
  if(storedVersion===CURRENT_DATA_VERSION)return {ok:true,fromVersion:storedVersion,toVersion:CURRENT_DATA_VERSION}
  const keys=['waseshibu-math-attempts','waseshibu-math-preferences','waseshibu-math-daily','waseshibu-math-exam-scores',CURRENT_DRAFT_KEY,'waseshibu-math-learning-route-v1',PREP_STORAGE_KEY,GUIDED_REVIEW_STORAGE_KEY,GUIDED_PROGRESS_STORAGE_KEY,REMEDIATION_PROGRESS_STORAGE_KEY,LEGACY_DRAFT_KEY]
  const source:Record<string,unknown>={}
  for(const key of keys){const raw=storage.getItem(key);if(raw===null)continue;try{source[key]=JSON.parse(raw)}catch{source[key]=raw}}
  const managedKeys=[...keys,DATA_VERSION_KEY],before=new Map(managedKeys.map(key=>[key,storage.getItem(key)]))
  // migration前の生データを別キーへ退避する。成功前に旧データを削除しない。
  const backupPayload={fromVersion:Number.isFinite(storedVersion)?storedVersion:0,createdAt:new Date().toISOString(),raw:Object.fromEntries([...before].filter(([,value])=>value!==null))}
  try{storage.setItem(MIGRATION_BACKUP_STORAGE_KEY,JSON.stringify(backupPayload))}
  catch(error){return {ok:false,fromVersion:storedVersion,toVersion:storedVersion,error:`更新前バックアップを保存できないため移行を中止しました：${error instanceof Error?error.message:'保存エラー'}`}}
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
