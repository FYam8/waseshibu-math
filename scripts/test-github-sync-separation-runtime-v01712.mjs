import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd()
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-sync-separation-'))
const out=path.join(temp,'out')
const emptyTypes=path.join(temp,'types')
fs.mkdirSync(emptyTypes)

const compiled=spawnSync('tsc',[
  'src/storage.ts','src/version.ts','src/types.ts',
  '--outDir',out,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM',
  '--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'
],{cwd:root,encoding:'utf8'})
if(compiled.status!==0)throw new Error(`storage runtime compile failed\n${compiled.stdout}\n${compiled.stderr}`)

class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed))}
  getItem(key){return this.map.has(key)?this.map.get(key):null}
  setItem(key,value){this.map.set(key,String(value))}
  removeItem(key){this.map.delete(key)}
}

const legacyLocal={
  'waseshibu-math-attempts':JSON.stringify([{id:'old-a',deviceId:'old-device',resetVersion:11,questionId:'2024-Q1-1',mode:'q1',topic:'数式計算',status:'wrong',at:'2026-09-01T10:00:00.000Z'}]),
  'waseshibu-math-preferences':JSON.stringify({target:70,updatedAt:'2026-09-01T10:00:00.000Z'}),
  'waseshibu-math-daily':JSON.stringify({date:'2026-09-01',questionIds:['2024-Q1-1'],completed:false}),
  'waseshibu-math-exam-scores':JSON.stringify([{id:'old-s',deviceId:'old-device',resetVersion:12,year:2024,score:55,at:'2026-09-01T10:00:00.000Z'}]),
  'waseshibu-math-device-id':'old-device',
  'waseshibu-math-sync-meta':JSON.stringify({attemptsResetVersion:11,examScoresResetVersion:12,lastSyncAt:'2026-09-01T09:00:00.000Z'}),
  'waseshibu-math-sync-dirty':'1',
  'waseshibu-math-sync-dirty-revision':'7',
  'waseshibu-github-sync-config':JSON.stringify({owner:'legacy-owner',repo:'legacy-repo',branch:'main'}),
  'waseshibu-github-token-local':'legacy-token-placeholder',
  'waseshibu-math-active-app-version':'0.18.0'
}
const legacySession={
  'waseshibu-github-token-session':'legacy-session-token-placeholder'
}

global.localStorage=new MemoryStorage(legacyLocal)
global.sessionStorage=new MemoryStorage(legacySession)
global.window={dispatchEvent(){}}
global.CustomEvent=class{constructor(type){this.type=type}}

const require=createRequire(import.meta.url)
const storage=require(path.join(out,'storage.js'))

const untouchedLocalKeys=[
  'waseshibu-math-sync-dirty','waseshibu-math-sync-dirty-revision',
  'waseshibu-github-sync-config','waseshibu-github-token-local'
]
const beforeLocal=Object.fromEntries(untouchedLocalKeys.map(key=>[key,global.localStorage.getItem(key)]))
const beforeSession=global.sessionStorage.getItem('waseshibu-github-token-session')
const beforeMeta=global.localStorage.getItem('waseshibu-math-sync-meta')

assert.equal(storage.loadAttempts().length,1)
assert.equal(storage.loadExamScores().length,1)
assert.equal(storage.loadPreferences().target,70)
assert.equal(storage.loadDaily().date,'2026-09-01')

storage.saveAttempt({id:'new-a',questionId:'2024-Q1-2',mode:'q1',topic:'数式計算',status:'correct',at:'2026-09-02T10:00:00.000Z'})
storage.savePreferences({target:75})
storage.saveDaily({date:'2026-09-02',questionIds:['2024-Q1-2'],completed:false})
storage.saveExamScore({id:'new-s',year:2025,score:70,at:'2026-09-02T10:00:00.000Z'})

const newAttempt=storage.loadAttempts().find(x=>x.id==='new-a')
const newScore=storage.loadExamScores().find(x=>x.id==='new-s')
assert.ok(newAttempt)
assert.ok(newScore)
assert.equal(newAttempt.deviceId,'old-device')
assert.equal(newAttempt.resetVersion,11,'existing attempts resetVersion generation must be preserved')
assert.equal(newScore.deviceId,'old-device')
assert.equal(newScore.resetVersion,12,'existing exam resetVersion generation must be preserved')
assert.equal(global.localStorage.getItem('waseshibu-math-sync-meta'),beforeMeta,'normal local saves must not rewrite legacy sync meta')
for(const [key,value] of Object.entries(beforeLocal))assert.equal(global.localStorage.getItem(key),value,`${key} must not be changed by normal learning saves`)
assert.equal(global.sessionStorage.getItem('waseshibu-github-token-session'),beforeSession,'legacy session token must not be auto-deleted')

storage.clearAttempts()
let meta=JSON.parse(global.localStorage.getItem('waseshibu-math-sync-meta'))
assert.ok(meta.attemptsResetVersion>11,'clearAttempts must preserve monotonic resetVersion compatibility')
assert.equal(meta.examScoresResetVersion,12)
assert.equal(meta.lastSyncAt,'2026-09-01T09:00:00.000Z')

storage.clearExamScores()
meta=JSON.parse(global.localStorage.getItem('waseshibu-math-sync-meta'))
assert.ok(meta.examScoresResetVersion>12,'clearExamScores must preserve monotonic resetVersion compatibility')
assert.equal(meta.lastSyncAt,'2026-09-01T09:00:00.000Z')
for(const [key,value] of Object.entries(beforeLocal))assert.equal(global.localStorage.getItem(key),value,`${key} must survive history reset unchanged`)
assert.equal(global.sessionStorage.getItem('waseshibu-github-token-session'),beforeSession,'legacy session token must survive history reset unchanged')

console.log('SYNC SEPARATION RUNTIME PASSED: local learning saves work, dirty/config/token state is untouched, resetVersion compatibility is preserved')
