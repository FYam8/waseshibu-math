import assert from 'node:assert/strict'
import { build } from 'esbuild'

async function loadModule(entry){
  const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false})
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}

class MemoryStorage{
  constructor(seed={},failOnWrite=Infinity){this.map=new Map(Object.entries(seed));this.writes=0;this.failOnWrite=failOnWrite}
  getItem(key){return this.map.has(key)?this.map.get(key):null}
  setItem(key,value){this.writes++;if(this.writes===this.failOnWrite)throw new Error('quota test');this.map.set(key,String(value))}
  removeItem(key){this.map.delete(key)}
}

const backup=await loadModule('src/dataBackup.ts')
const answer=await loadModule('src/answer.ts')
const exam=await loadModule('src/data/examAnswers.ts')
const preflight=await loadModule('src/preflight.ts')
const migration=await loadModule('src/dataMigration.ts')
const safetyStorage=await loadModule('src/safetyStorage.ts')
const safetyBootstrap=await loadModule('src/safetyBootstrap.ts')
const version=await loadModule('src/version.ts')
const diagnostics=await loadModule('src/diagnostics.ts')
const sample={
  'waseshibu-math-attempts':[{id:'a1',questionId:'2024-Q1-1',answer:'６',status:'correct',at:'2026-01-01T00:00:00.000Z'}],
  'waseshibu-math-preferences':{target:70,name:'受験生',updatedAt:'2026-01-01T00:00:00.000Z'},
  'waseshibu-math-daily':{date:'2026-01-01',questionIds:['2024-Q1-1'],completed:false},
  'waseshibu-math-exam-scores':[{id:'s1',year:2024,score:65,correctCount:13,at:'2026-01-01T00:00:00.000Z'}],
  'waseshibu-math-exam-drafts-v2':{'2025':{answers:{'2025-Q1-1':'－１６'},flags:{'2025-Q1-2':true},seconds:321,majorIndex:1,phase:'solve'}},
  'waseshibu-math-learning-route-v1':{solvedYears:[2024],usedOldQuestionIds:['2019-Q1-1'],reinforcement:{'2024':{examId:'s1',completedQuestionIds:['2019-Q1-1']}},updatedAt:'2026-01-01T00:00:00.000Z'}
  ,'waseshibu-math-prep-check-v1':{version:1,index:2,answers:{'prep-1':'６','prep-2':'－３'},tries:{'prep-1':1,'prep-2':1},completed:false,skipped:false,updatedAt:'2026-01-01T00:00:00.000Z'}
  ,'waseshibu-math-data-version':2
}
const source=new MemoryStorage(Object.fromEntries(Object.entries(sample).map(([key,value])=>[key,JSON.stringify(value)])))
const pkg=backup.collectBackup(source)
const json=JSON.stringify(pkg),parsed=backup.parseBackup(json),restored=new MemoryStorage()
backup.restoreBackup(restored,parsed,'replace')
for(const key of backup.BACKUP_KEYS)assert.deepEqual(JSON.parse(restored.getItem(key)),sample[key],`round trip: ${key}`)

const merged=new MemoryStorage({'waseshibu-math-attempts':JSON.stringify([{id:'local'}]),'waseshibu-math-exam-drafts-v2':JSON.stringify({'2024':{answers:{x:'1'}}})})
backup.restoreBackup(merged,parsed,'merge')
assert.deepEqual(JSON.parse(merged.getItem('waseshibu-math-attempts')).map(x=>x.id),['local','a1'])
assert.deepEqual(Object.keys(JSON.parse(merged.getItem('waseshibu-math-exam-drafts-v2'))).sort(),['2024','2025'])

assert.throws(()=>backup.parseBackup('{broken'),/JSON/)
assert.throws(()=>backup.validateBackup({...pkg,data:{unknown:[]}}),/未対応/)
assert.throws(()=>backup.validateBackup({...pkg,dataVersion:99}),/アプリを更新/)
const legacy=backup.validateBackup({app:'waseshibu-math',schemaVersion:1,exportedAt:'2025-01-01T00:00:00.000Z',data:{'waseshibu-math-attempts':sample['waseshibu-math-attempts'],'waseshibu-math-exam-drafts':{'2024':{answers:{old:'1'}}},'waseshibu-math-prep-check-v1':{version:0,index:3,answers:{'prep-1':'6'},tries:{'prep-1':2},completed:true}}})
assert.equal(legacy.schemaVersion,3)
assert.equal(legacy.dataVersion,migration.CURRENT_DATA_VERSION)
assert.deepEqual(legacy.data['waseshibu-math-exam-drafts-v2'],{'2024':{answers:{old:'1'}}})
assert.equal(legacy.data['waseshibu-math-prep-check-v1'].completed,true)
assert.equal(legacy.data['waseshibu-math-prep-check-v1'].answers['prep-1'],'6')
const localLegacy=new MemoryStorage({'waseshibu-math-attempts':JSON.stringify(sample['waseshibu-math-attempts']),'waseshibu-math-exam-drafts':JSON.stringify({'2024':{seconds:15}}),'waseshibu-math-prep-check-v1':JSON.stringify({version:0,index:4,completed:true,answers:{'prep-5':'(2,1)'}})})
const localMigration=migration.runDataMigrations(localLegacy)
assert.equal(localMigration.ok,true)
assert.equal(localLegacy.getItem('waseshibu-math-data-version'),String(migration.CURRENT_DATA_VERSION))
assert.deepEqual(JSON.parse(localLegacy.getItem('waseshibu-math-exam-drafts-v2')),{'2024':{seconds:15}})
assert.equal(JSON.parse(localLegacy.getItem('waseshibu-math-prep-check-v1')).completed,true)
const legacyExportSource=new MemoryStorage({'waseshibu-math-exam-drafts':JSON.stringify({'2024':{seconds:44,answers:{old:'6'}}})})
assert.deepEqual(backup.collectBackup(legacyExportSource).data['waseshibu-math-exam-drafts-v2'],{'2024':{seconds:44,answers:{old:'6'}}})
const migrationBefore={'waseshibu-math-attempts':JSON.stringify([{id:'keep'}]),'waseshibu-math-exam-drafts':JSON.stringify({'2024':{seconds:9}})},migrationFailing=new MemoryStorage(migrationBefore,2)
const failedMigration=migration.runDataMigrations(migrationFailing)
assert.equal(failedMigration.ok,false)
for(const [key,value] of Object.entries(migrationBefore))assert.equal(migrationFailing.getItem(key),value,`migration rollback: ${key}`)
assert.equal(migrationFailing.getItem('waseshibu-math-data-version'),null)
const alreadyCurrent=new MemoryStorage({'waseshibu-math-data-version':String(migration.CURRENT_DATA_VERSION),'waseshibu-math-attempts':JSON.stringify([{id:'untouched'}])})
const currentMigration=migration.runDataMigrations(alreadyCurrent)
assert.equal(currentMigration.ok,true)
assert.equal(alreadyCurrent.writes,0)
const before=Object.fromEntries(backup.BACKUP_KEYS.map(key=>[key,source.getItem(key)])),failing=new MemoryStorage(before,2)
assert.throws(()=>backup.restoreBackup(failing,parsed,'replace'),/元のデータへ戻しました/)
for(const key of backup.BACKUP_KEYS)assert.equal(failing.getItem(key),before[key],`rollback: ${key}`)

const accepted=[
  ['６','6'],['３／４','3/4'],['０．７５','3/4'],['２ｓｑｒｔ（１５）','2√15'],['２×√１５','2√15'],
  ['（－１，－１）','(-1,-1)'],['１５０度','150'],['０≦ｙ≦２７','0<=y<=27'],['ｂ','B'],['３⁄４','3/4']
]
for(const [input,expected] of accepted)assert.equal(answer.isAcceptedAnswer(input,expected),true,`${input} => ${expected}`)
const toFullWidth=value=>value.replace(/[!-~]/g,char=>String.fromCharCode(char.charCodeAt(0)+0xFEE0))
for(const [id,expected] of Object.entries(exam.examAnswers))assert.equal(exam.isExamAnswerCorrect(id,toFullWidth(expected.answer)),true,`full-width canonical: ${id}`)
const integrity=preflight.runExamIntegrityCheck()
assert.equal(integrity.ok,true,integrity.issues.join('\n'))
assert.deepEqual([integrity.questionCount,integrity.answerCount,integrity.year2024Count],[160,160,20])
assert.equal(preflight.prepQuestions.length,5)
for(const q of preflight.prepQuestions)assert.equal(answer.isAcceptedAnswer(toFullWidth(q.answer),q.answer,q.acceptedAnswers),true,`prep full-width: ${q.id}`)
assert.equal(answer.isAcceptedAnswer('7','6'),false)
assert.equal(answer.cleanAnswerInput('６\n＋\t１').includes('\n'),false)

const safetySeed=Object.fromEntries(Object.entries(sample).map(([key,value])=>[key,JSON.stringify(value)]))
safetySeed[version.LAST_APP_VERSION_KEY]='0.8.0'
safetySeed[version.ACTIVE_APP_VERSION_KEY]='0.8.0'
const upgradeStore=new MemoryStorage(safetySeed)
const upgraded=await safetyBootstrap.bootstrapSafety({storage:upgradeStore,useLock:false})
assert.equal(upgraded.mode,'normal')
assert.equal(upgraded.updated,true)
assert.equal(upgradeStore.getItem(version.ACTIVE_APP_VERSION_KEY),version.APP_VERSION)
for(const key of backup.BACKUP_KEYS)assert.deepEqual(JSON.parse(upgradeStore.getItem(key)),sample[key],`safe upgrade preserved: ${key}`)
const upgradePoints=await safetyStorage.listRestorePoints(upgradeStore)
assert.equal(upgradePoints.some(point=>point.reason==='pre_upgrade'&&point.pinned),true)

const currentStore=new MemoryStorage({'waseshibu-math-data-version':'2',[version.LAST_APP_VERSION_KEY]:version.APP_VERSION,[version.ACTIVE_APP_VERSION_KEY]:version.APP_VERSION})
const writesBefore=currentStore.writes,currentBoot=await safetyBootstrap.bootstrapSafety({storage:currentStore,useLock:false})
assert.deepEqual(currentBoot,{mode:'normal',updated:false})
assert.equal(currentStore.writes-writesBefore,1,'current-version empty boot only acquires the short startup lease')

const interruptedStore=new MemoryStorage(safetySeed),checkpoint=await safetyStorage.createRestorePoint('pre_upgrade',interruptedStore,true)
interruptedStore.setItem('waseshibu-math-attempts',JSON.stringify([{id:'damaged'}]))
interruptedStore.setItem(safetyBootstrap.MIGRATION_JOURNAL_KEY,JSON.stringify({appVersion:version.APP_VERSION,stage:'migration_started',checkpointId:checkpoint.id,startedAt:new Date().toISOString(),updatedAt:new Date().toISOString()}))
const interrupted=await safetyBootstrap.bootstrapSafety({storage:interruptedStore,useLock:false})
assert.equal(interrupted.mode,'safe')
assert.deepEqual(JSON.parse(interruptedStore.getItem('waseshibu-math-attempts')),sample['waseshibu-math-attempts'])
assert.equal(version.canWriteLearningData(interruptedStore),false)

const quotaStore=new MemoryStorage(safetySeed),quotaBefore=quotaStore.getItem('waseshibu-math-attempts')
const quotaResult=await safetyBootstrap.bootstrapSafety({storage:quotaStore,useLock:false,createPoint:async()=>{throw new Error('quota test')}})
assert.equal(quotaResult.mode,'safe')
assert.equal(quotaStore.getItem('waseshibu-math-attempts'),quotaBefore)

const newerStore=new MemoryStorage({[version.ACTIVE_APP_VERSION_KEY]:'99.0.0',[version.LAST_APP_VERSION_KEY]:version.APP_VERSION,'waseshibu-math-data-version':'2'})
const newerResult=await safetyBootstrap.bootstrapSafety({storage:newerStore,useLock:false})
assert.equal(newerResult.mode,'safe')
assert.equal(newerResult.temporary,true)
assert.equal(newerStore.getItem(version.ACTIVE_APP_VERSION_KEY),'99.0.0')
assert.equal(version.canWriteLearningData(newerStore),false)

const diagnosticStore=new MemoryStorage(safetySeed),report=await diagnostics.createDiagnosticReport(diagnosticStore),reportText=JSON.stringify(report)
assert.equal(report.version.app,version.APP_VERSION)
assert.equal(report.version.data,migration.CURRENT_DATA_VERSION)
assert.deepEqual([report.learning.attempts,report.learning.scores,report.learning.drafts],[1,1,1])
for(const secret of ['受験生','－１６','2025-Q1-1','prep-1'])assert.equal(reportText.includes(secret),false,`diagnostic excludes learning content: ${secret}`)
assert.equal(report.grading.ok,true)

console.log('CRITICAL VERIFICATION PASSED')
console.log(`backup keys: ${backup.BACKUP_KEYS.length}, round-trip: OK, merge: OK, rollback: OK, safety upgrade/interruption/quota/newer-tab: OK, privacy-safe diagnostics: OK, integrity: 160/160 + 2024 20, prep: 5, input variants: ${accepted.length}+160 full-width answers`)
