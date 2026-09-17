import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-contract-v1-')),out=path.join(temp,'out'),types=path.join(temp,'types');fs.mkdirSync(types)
const built=spawnSync('tsc',['src/engine/contentContract.ts','src/engine/noLossTransport.ts','src/engine/localRestoreContract.ts','src/engine/candidateWriteContract.ts','--outDir',out,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--typeRoots',types,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`contract v1 compile failed\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),content=require(path.join(out,'contentContract.js')),transport=require(path.join(out,'noLossTransport.js')),writer=require(path.join(out,'candidateWriteContract.js'))

const sample={contractVersion:1,schoolId:'sample',exams:[{examId:'EX-A',year:2026,form:'A',label:'A',role:'diagnostic',scoreAuthority:'not-available'}],problems:[{problemId:'opaque-1',sourceProblemId:'opaque-1',sourceKind:'past-paper',examId:'EX-A',location:{year:2026,form:'A',major:1,minor:1,label:'1(1)'},role:'diagnostic',fieldId:'ALGEBRA',topicIds:[],difficultyId:'A',targetRelevance:{stable:'MUST'},answerSpec:{type:'numeric',expected:1},responseSlots:['value'],hints:[],explanationSteps:['step'],answerAuthority:{scoreAuthority:'not-available',model:'independent',verificationStatus:'checked'},qualityFlags:[],contentVersion:1,gradingVersion:1}]}
assert.equal(content.auditCanonicalMathContent(sample).ready,true)
assert.equal(content.auditCanonicalMathContent({...sample,problems:[sample.problems[0],sample.problems[0]]}).ready,false)

const materialized=transport.materializePortableProvenance({id:'a'}, {deviceId:'source-device',resetVersion:4})
assert.deepEqual(materialized,{id:'a',deviceId:'source-device',resetVersion:4})
const ok=transport.mergeRecordsNoLoss('attempts',[{id:'a',value:1}],[{value:1,id:'a'},{id:'b',value:2}],x=>x.id)
assert.equal(ok.ready,true);assert.deepEqual(ok.merged,[{id:'a',value:1},{id:'b',value:2}])
const conflict=transport.mergeRecordsNoLoss('attempts',[{id:'a',value:1}],[{id:'a',value:2}],x=>x.id)
assert.equal(conflict.ready,false);assert.equal(conflict.merged,null)
assert.equal(transport.mergeMapNoLoss('sessions',{s:{value:1}},{s:{value:2}}).ready,false)

class MemoryStorage{constructor(seed={}){this.map=new Map(Object.entries(seed));this.breakWrite=false}getItem(k){return this.map.has(k)?this.map.get(k):null}setItem(k,v){if(this.breakWrite&&k==='canonical'){this.breakWrite=false;this.map.set(k,'corrupt')}else this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}
const store=new MemoryStorage({legacy:'exact-source'}),profile={targetKey:'canonical',restoreProfile:{profileId:'test',schemaVersion:1,keys:['legacy','canonical'],portableExcludedKeys:[]}}
writer.writeCanonicalCandidateWithRollback(profile,{contractVersion:1},x=>{if(x?.contractVersion!==1)throw new Error('bad candidate')},store)
assert.equal(store.getItem('legacy'),'exact-source');assert.equal(store.getItem('canonical'),'{"contractVersion":1}')
store.breakWrite=true
assert.throws(()=>writer.writeCanonicalCandidateWithRollback(profile,{contractVersion:2},()=>{},store))
assert.equal(store.getItem('legacy'),'exact-source');assert.equal(store.getItem('canonical'),'{"contractVersion":1}')

console.log('SHARED ENGINE CONTRACT V1 TEST PASSED')
console.log('leaf content, no-loss merge policy, provenance materialization and verified candidate rollback: OK')
