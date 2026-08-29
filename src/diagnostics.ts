import { backupStats, collectBackup, type BackupPackage, type StorageLike } from './dataBackup'
import { CURRENT_DATA_VERSION } from './dataMigration'
import { MIGRATION_JOURNAL_KEY, UPDATE_NOTICE_KEY } from './safetyBootstrap'
import { listRestorePoints, type RestorePoint } from './safetyStorage'
import { runExamIntegrityCheck } from './preflight'
import { ACTIVE_APP_VERSION_KEY, APP_VERSION, LAST_APP_VERSION_KEY, SAFE_MODE_KEY } from './version'

const isObject=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)
const validDate=(value:unknown)=>typeof value==='string'&&!Number.isNaN(Date.parse(value))?value:null
const latest=(values:(string|null)[])=>values.filter((x):x is string=>!!x).sort().at(-1)||null

export function learningLastSavedAt(pkg:BackupPackage){
  const data=pkg.data,attempts=Array.isArray(data['waseshibu-math-attempts'])?data['waseshibu-math-attempts']:[],scores=Array.isArray(data['waseshibu-math-exam-scores'])?data['waseshibu-math-exam-scores']:[]
  const drafts=isObject(data['waseshibu-math-exam-drafts-v2'])?Object.values(data['waseshibu-math-exam-drafts-v2']):[]
  const objects=[data['waseshibu-math-preferences'],data['waseshibu-math-daily'],data['waseshibu-math-learning-route-v1'],data['waseshibu-math-prep-check-v1'],...drafts].filter(isObject)
  return latest([...attempts,...scores].filter(isObject).map(x=>validDate(x.at)).concat(objects.map(x=>validDate(x.updatedAt)||validDate(x.date))))
}

export function protectionSummary(pkg:BackupPackage,points:RestorePoint[]){
  const stats=backupStats(pkg)
  return {appVersion:APP_VERSION,dataVersion:CURRENT_DATA_VERSION,lastSavedAt:learningLastSavedAt(pkg),latestRestorePointAt:points[0]?.createdAt||null,restorePointCount:points.length,...stats}
}

export async function createDiagnosticReport(storage:StorageLike=localStorage){
  const pkg=collectBackup(storage),points=await listRestorePoints(storage),summary=protectionSummary(pkg,points),integrity=runExamIntegrityCheck()
  let persistent:boolean|null=null
  try{if(typeof navigator!=='undefined'&&navigator.storage?.persisted)persistent=await navigator.storage.persisted()}catch{/* unavailable */}
  return {
    app:'waseshibu-math-diagnostics',reportVersion:1,generatedAt:new Date().toISOString(),
    version:{app:APP_VERSION,data:CURRENT_DATA_VERSION,active:storage.getItem(ACTIVE_APP_VERSION_KEY),last:storage.getItem(LAST_APP_VERSION_KEY)},
    protection:{persistent,restorePointCount:summary.restorePointCount,latestRestorePointAt:summary.latestRestorePointAt,safeMode:storage.getItem(SAFE_MODE_KEY)!==null,migrationJournal:storage.getItem(MIGRATION_JOURNAL_KEY)!==null,updateNotice:storage.getItem(UPDATE_NOTICE_KEY)!==null},
    learning:{lastSavedAt:summary.lastSavedAt,attempts:summary.attempts,scores:summary.scores,drafts:summary.drafts,prepStarted:summary.prepStarted,prepDone:summary.prepDone},
    grading:{ok:integrity.ok,questionCount:integrity.questionCount,answerCount:integrity.answerCount,year2024Count:integrity.year2024Count,issues:integrity.issues}
  }
}

export function downloadDiagnosticReport(report:Awaited<ReturnType<typeof createDiagnosticReport>>){
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download=`waseshibu-math-diagnostics-${report.generatedAt.slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
