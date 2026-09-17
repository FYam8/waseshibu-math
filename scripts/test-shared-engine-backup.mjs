import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root=process.cwd()
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-backup-audit-'))
const out=path.join(temp,'out'),emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',[
  'src/dataMigration.ts','src/dataBackup.ts','src/schools/waseshibu/backupAudit.ts',
  '--outDir',out,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM',
  '--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'
],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`backup audit modules compile failed\n${built.stdout}\n${built.stderr}`)

const backupSource=fs.readFileSync(path.join(root,'src/dataBackup.ts'),'utf8')
const storageSource=fs.readFileSync(path.join(root,'src/storage.ts'),'utf8')
assert.ok(backupSource.includes('LEVEL2_HISTORY_STORAGE_KEY'))
assert.ok(!backupSource.includes("'waseshibu-math-device-id'"))
assert.ok(!backupSource.includes("'waseshibu-math-sync-meta'"))
assert.ok(storageSource.includes("deviceId: String(raw.deviceId || 'legacy-device')"))
assert.ok(storageSource.includes('resetVersion: Number.isInteger(raw.resetVersion) ? raw.resetVersion : meta.attemptsResetVersion'))
assert.ok(storageSource.includes("deviceId: String(x.deviceId || 'legacy-device')"))
assert.ok(storageSource.includes('resetVersion: Number.isInteger(x.resetVersion) ? x.resetVersion : meta.examScoresResetVersion'))
assert.ok(backupSource.includes("if(key.endsWith('attempts')||key.endsWith('exam-scores'))return uniqueById(local,incoming)"))

class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed));this.writes=0}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.writes++;this.map.set(k,String(v))}
  removeItem(k){this.writes++;this.map.delete(k)}
}
const require=createRequire(import.meta.url)
const backup=require(path.join(out,'dataBackup.js'))
const audit=require(path.join(out,'schools/waseshibu/backupAudit.js'))

const source=new MemoryStorage({
  'waseshibu-math-data-version':'8',
  'waseshibu-math-device-id':'source-current-device',
  'waseshibu-math-sync-meta':JSON.stringify({attemptsResetVersion:4,examScoresResetVersion:9}),
  'waseshibu-math-preferences':JSON.stringify({target:70,updatedAt:'2026-09-16T10:00:00.000Z'}),
  'waseshibu-math-attempts':JSON.stringify([{id:'a1',deviceId:'source-a',resetVersion:4,questionId:'2024-Q1-1',status:'wrong',at:'2026-09-16T10:01:00.000Z'}]),
  'waseshibu-math-exam-scores':JSON.stringify([{id:'s1',deviceId:'source-b',resetVersion:9,year:2024,score:65,at:'2026-09-16T10:02:00.000Z'}]),
  'waseshibu-math-level2-history-v1':JSON.stringify({schemaVersion:1,attempts:[],questionStats:{},sessions:{},masteryEvents:[]})
})
const pkg=backup.collectBackup(source),portable=audit.auditWaseShibuPortableBackup(pkg)
assert.equal(portable.ready,true,portable.issues.map(x=>`${x.code}:${x.message}`).join('\n'))
assert.equal('waseshibu-math-device-id' in pkg.data,false)
assert.equal('waseshibu-math-sync-meta' in pkg.data,false)
assert.equal(pkg.data['waseshibu-math-attempts'][0].deviceId,'source-a')
assert.equal(pkg.data['waseshibu-math-attempts'][0].resetVersion,4)

const destination=new MemoryStorage({
  'waseshibu-math-device-id':'destination-current-device',
  'waseshibu-math-sync-meta':JSON.stringify({attemptsResetVersion:88,examScoresResetVersion:99})
})
const deviceBefore=destination.getItem('waseshibu-math-device-id'),metaBefore=destination.getItem('waseshibu-math-sync-meta')
backup.restoreBackup(destination,pkg,'replace')
assert.equal(destination.getItem('waseshibu-math-device-id'),deviceBefore)
assert.equal(destination.getItem('waseshibu-math-sync-meta'),metaBefore)
assert.deepEqual(JSON.parse(destination.getItem('waseshibu-math-attempts')),pkg.data['waseshibu-math-attempts'])
assert.deepEqual(JSON.parse(destination.getItem('waseshibu-math-exam-scores')),pkg.data['waseshibu-math-exam-scores'])
assert.equal(audit.auditWaseShibuPortableBackup(backup.collectBackup(destination)).ready,true)

const legacy=backup.collectBackup(new MemoryStorage({
  'waseshibu-math-data-version':'8',
  'waseshibu-math-sync-meta':JSON.stringify({attemptsResetVersion:4,examScoresResetVersion:9}),
  'waseshibu-math-attempts':JSON.stringify([{id:'legacy-a',questionId:'q',status:'wrong',at:'2026-09-16T00:00:00.000Z'}]),
  'waseshibu-math-exam-scores':JSON.stringify([{id:'legacy-s',year:2024,score:60,at:'2026-09-16T00:00:00.000Z'}])
}))
const legacyAudit=audit.auditWaseShibuPortableBackup(legacy)
assert.equal(legacyAudit.ready,false)
assert.equal(legacyAudit.issues.filter(x=>x.code==='missing-device-provenance').length,2)
assert.equal(legacyAudit.issues.filter(x=>x.code==='missing-reset-epoch').length,2)

const duplicate=structuredClone(pkg)
duplicate.data['waseshibu-math-attempts'].push({...duplicate.data['waseshibu-math-attempts'][0]})
assert.ok(audit.auditWaseShibuPortableBackup(duplicate).issues.some(x=>x.code==='duplicate-record-id'))

const pack=data=>({app:'waseshibu-math',schemaVersion:5,dataVersion:8,exportedAt:'2026-09-16T12:00:00.000Z',data:{'waseshibu-math-data-version':8,...data}})
const local=pack({
  'waseshibu-math-attempts':[{id:'a1',deviceId:'d1',resetVersion:1,questionId:'q1',status:'wrong',at:'2026-09-16T01:00:00.000Z'}],
  'waseshibu-math-exam-scores':[{id:'s1',deviceId:'d1',resetVersion:1,year:2024,score:60,at:'2026-09-16T01:00:00.000Z'}]
})
const incoming=pack({
  'waseshibu-math-attempts':[
    {id:'a1',deviceId:'d1',resetVersion:1,questionId:'q1',status:'wrong',at:'2026-09-16T01:00:00.000Z'},
    {id:'a2',deviceId:'d2',resetVersion:1,questionId:'q2',status:'correct',at:'2026-09-16T02:00:00.000Z'}
  ],
  'waseshibu-math-exam-scores':[{id:'s2',deviceId:'d2',resetVersion:1,year:2025,score:70,at:'2026-09-16T02:00:00.000Z'}]
})
assert.equal(audit.auditWaseShibuBackupMerge(local,incoming).ready,true)
const conflicting=structuredClone(incoming);conflicting.data['waseshibu-math-attempts'][0].status='correct'
const attemptConflict=audit.auditWaseShibuBackupMerge(local,conflicting)
assert.ok(attemptConflict.issues.some(x=>x.code==='merge-record-conflict'&&x.surface.includes('a1')))
assert.equal(backup.mergeBackupValue('waseshibu-math-attempts',local.data['waseshibu-math-attempts'],conflicting.data['waseshibu-math-attempts']).find(x=>x.id==='a1').status,'correct')

const draftConflict=audit.auditWaseShibuBackupMerge(
  pack({'waseshibu-math-exam-drafts-v2':{'2024':{answer:'local'}}}),
  pack({'waseshibu-math-exam-drafts-v2':{'2024':{answer:'incoming'}}})
)
assert.ok(draftConflict.issues.some(x=>x.code==='merge-map-conflict'))
const prefConflict=audit.auditWaseShibuBackupMerge(
  pack({'waseshibu-math-preferences':{target:60}}),
  pack({'waseshibu-math-preferences':{target:75}})
)
assert.ok(prefConflict.issues.some(x=>x.code==='merge-replace-conflict'))

const level2Local=pack({'waseshibu-math-level2-history-v1':{
  schemaVersion:1,attempts:[{attemptId:'l2-a1',questionId:'l2-q1',isCorrect:true}],
  questionStats:{'l2-q1':{attemptCount:3,correctCount:2,qualifyingCorrectCount:2,oldAggregateEvidence:9}},
  sessions:{session:{sessionId:'session',updatedAt:'2026-09-16T01:00:00.000Z',localOnly:true}},masteryEvents:[]
}})
const level2Incoming=pack({'waseshibu-math-level2-history-v1':{
  schemaVersion:1,attempts:[{attemptId:'l2-a1',questionId:'l2-q1',isCorrect:false}],questionStats:{},
  sessions:{session:{sessionId:'session',updatedAt:'2026-09-16T02:00:00.000Z',incomingOnly:true}},masteryEvents:[]
}})
const l2=audit.auditWaseShibuBackupMerge(level2Local,level2Incoming)
assert.ok(l2.issues.some(x=>x.surface.includes('attempts:l2-a1')&&x.code==='merge-record-conflict'))
assert.ok(l2.issues.some(x=>x.surface.includes('sessions.session')&&x.code==='merge-map-conflict'))
assert.ok(l2.issues.some(x=>x.code==='level2-merge-loss-risk'&&x.surface.includes('questionStats')))

console.log('SHARED ENGINE BACKUP TRANSPORT AUDIT TEST PASSED')
console.log('portable identity isolation, self-contained record gate, replace roundtrip, merge-conflict detection: OK')
