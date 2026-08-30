
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
if(!result.ok||result.fromVersion!==3||result.toVersion!==5)throw new Error('v3→v5 migration result is invalid')
for(const [key,value] of Object.entries(before)){
  if(key==='waseshibu-math-data-version')continue
  const after=JSON.parse(storage.getItem(key))
  if(JSON.stringify(after)!==JSON.stringify(value))throw new Error(`既存データが変化しました: ${key}`)
}
if(storage.getItem('waseshibu-math-data-version')!=='5')throw new Error('dataVersion is not 5')
const migrationBackup=JSON.parse(storage.getItem('waseshibu-math-migration-backup-v1'))
if(migrationBackup.fromVersion!==3||!migrationBackup.raw['waseshibu-math-attempts'])throw new Error('migration前バックアップが保存されていません')
const progress=JSON.parse(storage.getItem('waseshibu-math-guided-progress-v2'))
if(progress['2024-Q1-1'].mastery!=='guided')throw new Error('guided history migration failed')
if(progress['2025-Q1-1'].mastery!=='reproduced'||progress['2025-Q1-1'].finalAnswerSeen!==true)throw new Error('reproduced history migration failed')
console.log('PASS: エクスポートなしのv3 localStorageをv5へ非破壊移行し、全旧キーとGuided Review履歴を保持')
