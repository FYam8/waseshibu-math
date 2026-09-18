import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'shared-today-planner-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const compiler=process.platform==='win32'?path.join(root,'node_modules','.bin','tsc.cmd'):path.join(root,'node_modules','.bin','tsc')
const built=spawnSync(compiler,['src/engine/todayPlanner.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`today planner compile failed\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),planner=require(path.join(temp,'todayPlanner.js'))

const candidates=[
  {lane:'practice',value:'practice'},
  {lane:'past-paper',value:'paper'},
  {lane:'due-review',value:'due'},
  {lane:'reinforcement',value:'reinforce'},
  {lane:'optional-resume',value:'optional'},
  {lane:'route-resume',value:'resume'}
]
assert.deepEqual(planner.orderCanonicalTodayCandidates(candidates).map(x=>x.value),['resume','reinforce','due','paper','practice','optional'])
assert.deepEqual(planner.chooseCanonicalTodayTask(candidates),{lane:'route-resume',value:'resume'})
assert.equal(planner.nextIncompleteRouteId(['opaque-B','opaque-A'],new Set(['opaque-B'])),'opaque-A')
assert.equal(planner.nextIncompleteRouteId(['opaque-B'],['opaque-B']),null)

const source=fs.readFileSync(path.join(root,'src/engine/todayPlanner.ts'),'utf8')
assert.doesNotMatch(source,/waseshibu|rikkyo|R\d{2}-MATH|\b20\d{2}\b/i,'shared planner contains a school identity or exam value')
assert.doesNotMatch(source,/\.split\(|\.match\(/,'shared planner must not parse opaque IDs')
const daily=fs.readFileSync(path.join(root,'src/dailyPlan.ts'),'utf8')
assert.match(daily,/orderCanonicalTodayCandidates/,'WaseShibu runtime must consume the shared planner')

const esbuild=process.platform==='win32'?path.join(root,'node_modules','.bin','esbuild.cmd'):path.join(root,'node_modules','.bin','esbuild')
const runtime=path.join(temp,'todayPlanner.runtime.js')
const bundled=spawnSync(esbuild,['src/engine/todayPlanner.ts','--bundle','--format=iife','--global-name=CanonicalTodayPlanner','--platform=browser','--target=es2020',`--outfile=${runtime}`],{cwd:root,encoding:'utf8'})
if(bundled.status!==0)throw new Error(`today planner runtime build failed\n${bundled.stdout}\n${bundled.stderr}`)
assert.equal(fs.readFileSync(runtime,'utf8'),fs.readFileSync(path.join(root,'src/engine/todayPlanner.runtime.js'),'utf8'),'checked-in browser runtime drifted from canonical TypeScript')
console.log('PASS shared Today planner: school-neutral lanes, opaque route IDs, WaseShibu consumer, deterministic browser runtime')

assert.deepEqual(planner.uniqueCanonicalTodayCandidates([{lane:'past-paper',value:{id:'A',action:'start'}},{lane:'route-resume',value:{id:'A',action:'resume'}},{lane:'past-paper',value:{id:'B',action:'start'}}],x=>x.id).map(x=>x.value),[{id:'A',action:'resume'},{id:'B',action:'start'}])
assert.throws(()=>planner.uniqueCanonicalTodayCandidates([{lane:'practice',value:{id:''}}],x=>x.id),/identity/)
