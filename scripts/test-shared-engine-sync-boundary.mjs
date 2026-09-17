import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root=process.cwd()
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-sync-boundary-'))
const out=path.join(temp,'out'),emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',[
  'src/engine/externalSyncContract.ts','src/schools/waseshibu/syncProfile.ts',
  '--outDir',out,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM',
  '--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'
],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`sync-boundary modules compile failed\n${built.stdout}\n${built.stderr}`)

const require=createRequire(import.meta.url)
const {WASESHIBU_SYNC_PROFILE,WASESHIBU_SYNC_PROJECTION}=require(path.join(out,'schools/waseshibu/syncProfile.js'))
assert.deepEqual(WASESHIBU_SYNC_PROFILE,{
  schoolId:'waseshibu',
  localDatabaseName:'waseshibu-progress-sync',
  localDatabaseVersion:7,
  appId:'math',
  apiEnvironmentKey:'VITE_PROGRESS_API_BASE',
  browserApiOverrideKey:'__WASESHIBU_PROGRESS_API__',
  deploymentApiBase:'https://waseshibu-progress-api.fyam8.workers.dev',
  transportKind:'summary-events',
  projectionOwner:'school'
})
assert.deepEqual(WASESHIBU_SYNC_PROJECTION.sourceRecordIds,['state:summary','state:latest-exam'])
assert.deepEqual(WASESHIBU_SYNC_PROJECTION.yearRange,{from:2019,to:2026})
assert.deepEqual(WASESHIBU_SYNC_PROJECTION.targetIds,['60','70','75'])
assert.equal(WASESHIBU_SYNC_PROJECTION.sendsRawAnswers,false)
assert.equal(WASESHIBU_SYNC_PROJECTION.sendsProblemContent,false)

const sync=fs.readFileSync(path.join(root,'src/progressSync.ts'),'utf8')
const deploy=fs.readFileSync(path.join(root,'.github/workflows/deploy.yml'),'utf8')
assert.ok(sync.includes("import { WASESHIBU_SYNC_PROFILE } from './schools/waseshibu/syncProfile'"),'active sync adapter must use the school profile')
assert.ok(sync.includes('const SYNC_DB=WASESHIBU_SYNC_PROFILE.localDatabaseName'),'active IndexedDB identity is not profile-routed')
assert.ok(sync.includes('const SYNC_DB_VERSION=WASESHIBU_SYNC_PROFILE.localDatabaseVersion'),'active IndexedDB version is not profile-routed')
assert.ok(sync.includes('const APP_ID=WASESHIBU_SYNC_PROFILE.appId'),'active cloud app identity is not profile-routed')
assert.ok(sync.includes('[WASESHIBU_SYNC_PROFILE.apiEnvironmentKey]:import.meta.env.VITE_PROGRESS_API_BASE'),'active API env value is not bound to the profile key')
assert.ok(sync.includes('(window as any)[WASESHIBU_SYNC_PROFILE.browserApiOverrideKey]'),'active browser API override is not profile-routed')
assert.equal((sync.match(/waseshibu-progress-sync/g)||[]).length,0,'active adapter must not duplicate the IndexedDB literal')
assert.equal((sync.match(/__WASESHIBU_PROGRESS_API__/g)||[]).length,0,'active adapter must not duplicate the browser override literal')
assert.ok(deploy.includes('VITE_PROGRESS_API_BASE: https://waseshibu-progress-api.fyam8.workers.dev'),'deployed WaseShibu endpoint drifted')

// These are intentionally school-owned projections, not generic-engine rules.
assert.ok(sync.includes('for(let year=2019;year<=2026;year++)'),'WaseShibu year projection changed; review school-owned sync adapter')
assert.ok(sync.includes('route.completedCoreByTarget[String(prefs.target)'),'WaseShibu target projection changed')
assert.ok(sync.includes("sourceRecordId:'state:summary'"))
assert.ok(sync.includes("sourceRecordId:'state:latest-exam'"))
assert.ok(sync.includes('progressLabel:`math target ${loadPreferences().target}`'))

// External sync is a projection of learner progress. It must not become a raw
// answer/content replication path as a side effect of engine extraction.
for(const forbidden of [
  /answer\s*:/,
  /finalAnswer\s*:/,
  /stepProgress\s*:/,
  /acceptedAnswers\s*:/,
  /questionText\s*:/,
  /prompt\s*:/,
  /explanation\s*:/
]) assert.equal(forbidden.test(sync),false,`progress sync contains forbidden raw learner/content field: ${forbidden}`)

// Current sync reads learner state and owns its own IDB/control queue. It does
// not import cloud state back through local learner-state writers.
for(const forbiddenWriter of ['saveAttempt','replaceAttempts','saveExamScore','replaceExamScores','savePreferences','restoreBackup']){
  assert.equal(sync.includes(forbiddenWriter),false,`progress sync unexpectedly references learner writer ${forbiddenWriter}`)
}
assert.ok(sync.includes("indexedDB.open(SYNC_DB,SYNC_DB_VERSION)"))
assert.ok(sync.includes("body:JSON.stringify({appId:APP_ID,generation:1,payload})"))
assert.ok(sync.includes("body:JSON.stringify({events:batch.map(({queuedAt,...e})=>e)})"))
assert.equal(sync.includes('rikkyo'),false,'WaseShibu sync adapter must not contain Rikkyo identity')

// Shared contract must remain identity-shaped; school-specific year/target
// projection stays outside src/engine.
const engineContract=fs.readFileSync(path.join(root,'src/engine/externalSyncContract.ts'),'utf8')
assert.equal(engineContract.includes('2019'),false)
assert.equal(engineContract.includes("'60'"),false)
assert.equal(engineContract.includes('waseshibu-progress-sync'),false)
assert.equal(engineContract.includes('fyam8.workers.dev'),false)

console.log('SHARED ENGINE SYNC BOUNDARY TEST PASSED')
console.log('WaseShibu sync identity profile-routed, school-owned projection isolated, raw answers/content excluded: OK')
