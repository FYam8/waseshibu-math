import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root=process.cwd()
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-local-restore-'))
const out=path.join(temp,'out'),emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',[
  'src/dataMigration.ts','src/dataBackup.ts','src/version.ts',
  'src/engine/localRestoreContract.ts','src/schools/waseshibu/localRestoreProfile.ts','src/safetyStorage.ts',
  '--outDir',out,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM',
  '--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'
],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`local restore modules compile failed\n${built.stdout}\n${built.stderr}`)

const require=createRequire(import.meta.url)
const contract=require(path.join(out,'engine/localRestoreContract.js'))
const profileModule=require(path.join(out,'schools/waseshibu/localRestoreProfile.js'))
const safety=require(path.join(out,'safetyStorage.js'))
const profile=profileModule.WASESHIBU_LOCAL_RESTORE_PROFILE

class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed));this.writes=0;this.failAt=Infinity}
  getItem(key){return this.map.has(key)?this.map.get(key):null}
  setItem(key,value){this.writes++;if(this.writes===this.failAt)throw new Error('quota test');this.map.set(key,String(value))}
  removeItem(key){this.writes++;if(this.writes===this.failAt)throw new Error('quota test');this.map.delete(key)}
  failOnceAfter(writes){this.failAt=this.writes+writes}
}

const profileAudit=contract.auditLocalRestoreProfile(profile)
assert.equal(profileAudit.ready,true,profileAudit.issues.join('\n'))
for(const key of ['waseshibu-math-device-id','waseshibu-math-sync-meta']){
  assert.ok(profile.keys.includes(key),`${key} must be restored locally`)
  assert.ok(profile.portableExcludedKeys.includes(key),`${key} must remain non-portable`)
}

const seed={
  'waseshibu-math-data-version':'7',
  'waseshibu-math-device-id':'device-before',
  'waseshibu-math-sync-meta':JSON.stringify({attemptsResetVersion:111,examScoresResetVersion:222,lastSyncAt:'2026-09-16T10:00:00.000Z'}),
  'waseshibu-math-attempts':'[{"id":"legacy-a","rawOnly":true}]',
  'waseshibu-math-exam-scores':'not-json',
  'waseshibu-math-exam-draft-v1':'legacy-draft-raw'
}
const source=new MemoryStorage(seed)
const snapshot=contract.captureExactLocalSnapshot(profile,source,'2026-09-17T00:00:00.000Z')
assert.equal(snapshot.values['waseshibu-math-device-id'],'device-before')
assert.equal(snapshot.values['waseshibu-math-sync-meta'],seed['waseshibu-math-sync-meta'])
assert.equal(snapshot.values['waseshibu-math-exam-scores'],'not-json','local restore must preserve exact raw strings')
assert.equal(snapshot.values['waseshibu-math-preferences'],null,'absence must be preserved explicitly')

const changed=new MemoryStorage({
  'waseshibu-math-device-id':'device-after',
  'waseshibu-math-sync-meta':JSON.stringify({attemptsResetVersion:999,examScoresResetVersion:999}),
  'waseshibu-math-preferences':'{"target":75}'
})
contract.restoreExactLocalSnapshot(profile,snapshot,changed)
for(const key of profile.keys)assert.equal(changed.getItem(key),snapshot.values[key],`exact restore: ${key}`)

const rollbackSeed=Object.fromEntries(profile.keys.map((key,index)=>[key,`before-${index}`]))
const failing=new MemoryStorage(rollbackSeed)
failing.failOnceAfter(4)
assert.throws(()=>contract.restoreExactLocalSnapshot(profile,snapshot,failing),/直前の状態へ戻しました/)
for(const key of profile.keys)assert.equal(failing.getItem(key),rollbackSeed[key],`verified rollback: ${key}`)

const pointStorage=new MemoryStorage(seed)
const point=await safety.createRestorePoint('manual',pointStorage)
assert.ok(point.localSnapshot,'new restore points must contain a device-local exact snapshot')
assert.equal(point.localSnapshot.values['waseshibu-math-device-id'],'device-before')
assert.equal('waseshibu-math-device-id' in point.payload.data,false,'portable payload must exclude current device identity')
assert.equal('waseshibu-math-sync-meta' in point.payload.data,false,'portable payload must exclude sync reset/tombstone state')
pointStorage.setItem('waseshibu-math-device-id','mutated-device')
pointStorage.setItem('waseshibu-math-sync-meta','{"attemptsResetVersion":999,"examScoresResetVersion":999}')
pointStorage.setItem('waseshibu-math-attempts','[]')
await safety.restorePointPayload(point.id,pointStorage)
for(const key of profile.keys)assert.equal(pointStorage.getItem(key),point.localSnapshot.values[key],`stored restore point: ${key}`)

const safetySource=fs.readFileSync(path.join(root,'src/safetyStorage.ts'),'utf8')
assert.ok(safetySource.includes('JSON.stringify(point.payload,null,2)'),'restore-point download must serialize only the portable payload')
assert.ok(!safetySource.includes('JSON.stringify(point.localSnapshot'),'local snapshot must not have an export path')

console.log('SHARED ENGINE LOCAL RESTORE POINT TEST PASSED')
console.log('exact raw snapshot, device/sync-meta recovery, verified rollback, portable export isolation: OK')
