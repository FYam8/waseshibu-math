import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-mastery-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
const tsc=fs.existsSync(compiler)?compiler:'tsc'
const built=spawnSync(tsc,['src/guidedReview.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`guidedReview.ts をテスト用にコンパイルできません\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),g=require(path.join(temp,'guidedReview.js'))
class MemoryStorage{
  constructor(){this.map=new Map()}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
  removeItem(k){this.map.delete(k)}
}
const s=new MemoryStorage()
g.updateGuidedProgress('2024-Q1-1',{mastery:'consolidated',practiceStreak:4,independentSucceeded:true},s)
let result=g.recordGuidedFinal('2024-Q1-1','6','retry',s)
if(result.mastery!=='consolidated')throw new Error('定着済みの再確認正解で mastery が下がりました')
result=g.recordGuidedFinal('2024-Q1-1','999','retry',s)
let p=g.loadGuidedProgress('2024-Q1-1',s)
if(result.mastery!=='attempted'||p.practiceStreak!==0)throw new Error('再確認で間違えても弱点が再開されません')
g.updateGuidedProgress('2024-Q1-1',{mastery:'consolidated',practiceStreak:4,independentSucceeded:true},s)
g.recordPracticeStreak('2024-Q1-1',false,s)
p=g.loadGuidedProgress('2024-Q1-1',s)
if(p.mastery==='consolidated'||p.practiceStreak!==0)throw new Error('類題で再度間違えても consolidated のままです')
console.log('PASS: 定着済み→再確認正解は維持、再誤答は弱点を再開')
