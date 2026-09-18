import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {build} from 'esbuild'
const out=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'scheduled-plan-')),'engine.mjs')
await build({entryPoints:['src/engine/scheduledPlan.ts'],outfile:out,bundle:true,platform:'node',format:'esm'})
const {createCanonicalScheduledPlan:create,reconcileCanonicalScheduledPlan:reconcile,promoteCanonicalStudyAhead:promote}=await import(pathToFileURL(out))
const initial=create({planKind:'today-required',date:'2026-09-18',targetId:'stable',orderedTaskIds:['exam-A','exam-B','review'],limit:2})
const before=JSON.stringify(initial)
// Starting/resuming a task changes UI availability, not completion evidence.
let result=reconcile(initial,{availableTaskIds:['resume-A'],completionEvidence:[]})
assert.equal(result.complete,false);assert.deepEqual(result.plan.pendingTaskIds,['exam-A','exam-B']);assert.deepEqual(result.unresolvedTaskIds,['exam-A','exam-B'])
// New candidates do not refill the frozen quota. A/B remain separate opaque IDs.
result=reconcile(initial,{availableTaskIds:['exam-B','new-task'],completionEvidence:[{taskId:'exam-A',recordId:'finished-session-A'}]})
assert.deepEqual(result.plan.completedTaskIds,['exam-A']);assert.deepEqual(result.plan.pendingTaskIds,['exam-B'])
assert.deepEqual(reconcile(result.plan,{availableTaskIds:[],completionEvidence:[]}).plan,result.plan)
assert.deepEqual(reconcile(result.plan,{availableTaskIds:[],completionEvidence:[{taskId:'exam-A',recordId:'finished-session-A'}]}).plan,result.plan)
assert.throws(()=>reconcile(initial,{availableTaskIds:[],completionEvidence:[{taskId:'unknown',recordId:'record'}]}),/REVIEW_REQUIRED/)
assert.throws(()=>reconcile(initial,{availableTaskIds:[],completionEvidence:[{taskId:'exam-A',recordId:''}]}),/REVIEW_REQUIRED/)
assert.throws(()=>reconcile({...initial,completedTaskIds:['exam-A']},{availableTaskIds:[],completionEvidence:[]}),/REVIEW_REQUIRED/)
assert.throws(()=>reconcile({...initial,fallbackTask:{taskId:'legacy'}},{availableTaskIds:[],completionEvidence:[]}),/fallback/)
const ahead={...result.plan,planKind:'study-ahead',schoolEvidence:{preserve:['opaque']}}
assert.deepEqual(promote(ahead,ahead.date,null),{...ahead,planKind:'today-required'})
assert.throws(()=>promote(ahead,'another-date',null),/mismatch/)
assert.throws(()=>promote(ahead,ahead.date,initial),/overwritten/)
assert.equal(JSON.stringify(initial),before)
assert.deepEqual(ahead.schoolEvidence,{preserve:['opaque']})
const complete=reconcile(result.plan,{availableTaskIds:[],completionEvidence:[{taskId:'exam-B',recordId:'finished-session-B'}]})
assert.equal(complete.complete,true)
assert.equal(reconcile(create({planKind:'today-required',date:'date',targetId:'opaque',orderedTaskIds:[],limit:10}),{availableTaskIds:[],completionEvidence:[]}).complete,false)
console.log('PASS candidate scheduled plan: explicit completion, no refill, opaque IDs, unresolved preservation, ahead promotion; zero production wiring')
