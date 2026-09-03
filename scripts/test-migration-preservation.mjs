
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd()
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-migration-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
const tsc=fs.existsSync(compiler)?compiler:'tsc'
const built=spawnSync(tsc,['src/dataMigration.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`dataMigration.ts をテスト用にコンパイルできません\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url)
const migration=require(path.join(temp,'dataMigration.js'))

class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed))}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
  removeItem(k){this.map.delete(k)}
}
const seed={
  'waseshibu-math-data-version':'3',
  'waseshibu-math-attempts':JSON.stringify([{id:'a1',questionId:'2024-Q1-1',status:'wrong',answer:'5'}]),
  'waseshibu-math-preferences':JSON.stringify({target:70}),
  'waseshibu-math-daily':JSON.stringify({date:'2026-08-30',count:8}),
  'waseshibu-math-exam-scores':JSON.stringify([{id:'e1',year:2024,score:65}]),
  'waseshibu-math-exam-drafts-v2':JSON.stringify({'2025':{answers:{'2025-Q1-1':'-16'}}}),
  'waseshibu-math-learning-route-v1':JSON.stringify({solvedYears:[2024],usedOldQuestionIds:['2021-Q2-1']}),
  'waseshibu-math-prep-check-v1':JSON.stringify({version:1,index:3,answers:{p1:'4'},tries:{p1:1},completed:false}),
  'waseshibu-math-guided-review-v1':JSON.stringify({
    '2024-Q1-1':{questionId:'2024-Q1-1',step1:'条件',step2:'式',finalAnswer:'6',hintUsed:true,answerSeen:false,outcome:'guided',updatedAt:'2026-08-30T00:00:00.000Z'},
    '2025-Q1-1':{questionId:'2025-Q1-1',step1:'',step2:'',finalAnswer:'-16',hintUsed:false,answerSeen:true,outcome:'reproduced',updatedAt:'2026-08-30T00:00:01.000Z'}
  })
}
const storage=new MemoryStorage(seed)
const before=Object.fromEntries([...storage.map.entries()].map(([k,v])=>[k,JSON.parse(v)]))
const result=migration.runDataMigrations(storage)
if(!result.ok||result.fromVersion!==3||result.toVersion!==7)throw new Error('v3→v7 migration result is invalid')
for(const [key,value] of Object.entries(before)){
  if(key==='waseshibu-math-data-version')continue
  const after=JSON.parse(storage.getItem(key))
  if(JSON.stringify(after)!==JSON.stringify(value))throw new Error(`既存データが変化しました: ${key}`)
}
if(storage.getItem('waseshibu-math-data-version')!=='7')throw new Error('dataVersion is not 7')
const migrationBackup=JSON.parse(storage.getItem('waseshibu-math-migration-backup-v1'))
if(migrationBackup.fromVersion!==3||!migrationBackup.raw['waseshibu-math-attempts'])throw new Error('migration前バックアップが保存されていません')
const progress=JSON.parse(storage.getItem('waseshibu-math-guided-progress-v2'))
if(progress['2024-Q1-1'].mastery!=='guided')throw new Error('guided history migration failed')
if(progress['2025-Q1-1'].mastery!=='reproduced'||progress['2025-Q1-1'].finalAnswerSeen!==true)throw new Error('reproduced history migration failed')

// v5 practiceStreak は旧不具合で同一類題の再正解を含む可能性がある。
// Guided履歴は保持するが、v6 mastery の「異なる4問」証拠としては信用しない。
const v5Storage=new MemoryStorage({
  'waseshibu-math-data-version':'5',
  'waseshibu-math-guided-progress-v2':JSON.stringify({
    '2024-Q1-2':{questionId:'2024-Q1-2',practiceStreak:4,mastery:'consolidated',updatedAt:'2026-08-31T00:00:00.000Z'}
  })
})
const v5Result=migration.runDataMigrations(v5Storage)
if(!v5Result.ok||v5Result.toVersion!==7)throw new Error('v5→v7 migration result is invalid')
const v5Guided=JSON.parse(v5Storage.getItem('waseshibu-math-guided-progress-v2'))
if(v5Guided['2024-Q1-2'].practiceStreak!==4)throw new Error('legacy Guided practiceStreak should be preserved as history')
const v6Remediation=JSON.parse(v5Storage.getItem('waseshibu-math-remediation-progress-v1'))
if(Object.keys(v6Remediation).length!==0)throw new Error('legacy practiceStreak must not certify v6 distinct-question remediation mastery')
const level2=JSON.parse(v5Storage.getItem('waseshibu-math-level2-history-v1'))
if(level2.attempts.length||Object.keys(level2.questionStats).length||Object.keys(level2.sessions).length||level2.masteryEvents.length)throw new Error('legacy history must not be guessed onto new Level2 identities')

console.log('PASS: v3→v7を非破壊移行し、全旧キーを保持。旧streak・旧類題履歴を新Level2 identityへ推測移行しない')
