import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-remediation-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',['src/remediationProgress.ts','src/version.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`remediationProgress compile failed\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),rp=require(path.join(temp,'remediationProgress.js'))

class MemoryStorage{
  constructor(seed={}){this.map=new Map(Object.entries(seed))}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
  removeItem(k){this.map.delete(k)}
}
const store=new MemoryStorage()
const source='2024-Q1-2',field='surface-area-triangular-prism',rank='A',at='2026-09-01T10:00:00.000Z'
let p=rp.ensureRemediationProgress(source,field,rank,4,at,store)
if(p.currentIndex!==0||p.streak!==0)throw new Error('fresh progress must start at 0/4, index 0')
p=rp.recordRemediationAttempt(source,field,rank,4,'r0',true,at,store)
p=rp.recordRemediationAttempt(source,field,rank,4,'r1',true,at,store)
if(p.streak!==2||p.currentIndex!==2)throw new Error('after two distinct correct answers should be 2/4 at index 2')

// reload/resume must keep index 2
p=rp.ensureRemediationProgress(source,field,rank,4,at,store)
if(p.streak!==2||p.currentIndex!==2)throw new Error('reload did not resume at third question')

// same counted problem may not advance streak or index
p=rp.recordRemediationAttempt(source,field,rank,4,'r1',true,at,store)
if(p.streak!==2||p.currentIndex!==2)throw new Error('duplicate correct answer advanced progress')

// finish only with two more distinct questions
p=rp.recordRemediationAttempt(source,field,rank,4,'r2',true,at,store)
if(p.streak!==3||p.status!=='in-progress')throw new Error('third distinct answer incorrect state')
p=rp.recordRemediationAttempt(source,field,rank,4,'r3',true,at,store)
if(p.streak!==4||p.status!=='completed')throw new Error('four distinct correct answers must complete')

// a newer correct source-paper attempt must NOT erase completed remediation.
// reset is tied to a newer unresolved (wrong/unanswered) source attempt supplied by the caller.
p=rp.ensureRemediationProgress(source,field,rank,4,undefined,store)
if(p.streak!==4||p.status!=='completed')throw new Error('completed remediation should survive when there is no newer unresolved source attempt')

// a newer unresolved source-paper attempt must reopen at 0/4
const newer='2026-09-02T10:00:00.000Z'
p=rp.ensureRemediationProgress(source,field,rank,4,newer,store)
if(p.streak!==0||p.currentIndex!==0||p.status!=='in-progress')throw new Error('new source attempt did not reset old remediation')

// incorrect answer resets streak and position
rp.recordRemediationAttempt(source,field,rank,4,'r0',true,newer,store)
p=rp.recordRemediationAttempt(source,field,rank,4,'r1',false,newer,store)
if(p.streak!==0||p.currentIndex!==0||p.correctQuestionIdsInCurrentStreak.length!==0)throw new Error('wrong answer did not reset streak sequence')

console.log('PASS: remediation progress persists index/streak and requires four distinct consecutive questions')
