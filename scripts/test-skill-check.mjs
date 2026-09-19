import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdtempSync,rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const temp=mkdtempSync(path.join(tmpdir(),'skill-check-'))
try{
const outfile=path.join(temp,'test.mjs')
await build({stdin:{contents:"export * from './src/skillCheck';export * from './src/data/skillChecks';export * from './src/dataBackup';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile})
const m=await import(pathToFileURL(outfile).href)
class MemoryStorage{data=new Map();getItem(k){return this.data.get(k)??null}setItem(k,v){this.data.set(k,String(v))}removeItem(k){this.data.delete(k)}}
globalThis.localStorage=new MemoryStorage()
for(const bank of m.skillCheckBanks){
 const source=bank.sourceIds[0]
 for(const wrongAt of [-1,0,1]){
  const records={}
  assert.equal(m.nextCheck(bank,source,records).id,bank.checks[0].id)
  for(let i=0;i<bank.checks.length;i++){
   records[m.checkKey(source,bank.checks[i])]={answer:'fixture',correct:i!==wrongAt,at:'2026-09-19T00:00:00Z'}
   if(i===wrongAt){assert.equal(m.nextCheck(bank,source,records).id,bank.support[i].id);records[m.checkKey(source,bank.support[i])]={answer:'fixture',correct:true,at:'2026-09-19T00:00:01Z'};assert.equal(m.nextCheck(bank,source,records),null);assert.match(m.checkSummary(bank,source,records),/断定せず/);break}
  }
  if(wrongAt<0){assert.equal(m.nextCheck(bank,source,records).id,bank.transfer.id);records[m.checkKey(source,bank.transfer)]={answer:'fixture',correct:true,at:'2026-09-19T00:00:02Z'};assert.equal(m.nextCheck(bank,source,records),null);assert.match(m.checkSummary(bank,source,records),/長期定着の評価ではありません/)}
 }
}
const bank=m.skillCheckBanks[0],source=bank.sourceIds[0],item=bank.checks[0]
assert(m.saveCheck(source,item,'-13'));assert.equal(m.loadChecks()[m.checkKey(source,item)].correct,false)
assert(m.saveCheck(source,item,'13'));assert.equal(m.loadChecks()[m.checkKey(source,item)].answer,'-13','first response immutable')
const exported=m.collectBackup();const restored=new MemoryStorage();m.restoreBackup(restored,exported,'replace');assert.equal(restored.getItem(m.SKILL_CHECK_KEY),localStorage.getItem(m.SKILL_CHECK_KEY))
const before=JSON.parse(restored.getItem(m.SKILL_CHECK_KEY));const incoming={...exported,data:{...exported.data,[m.SKILL_CHECK_KEY]:{extra:{answer:'13',correct:true,at:'2026-09-19T00:00:00Z'}}}};m.restoreBackup(restored,incoming,'merge');assert.deepEqual(JSON.parse(restored.getItem(m.SKILL_CHECK_KEY)),{extra:incoming.data[m.SKILL_CHECK_KEY].extra,...before})
assert.equal(localStorage.getItem('waseshibu-math-attempts'),null);assert.equal(localStorage.getItem('waseshibu-math-exam-scores'),null)
localStorage.setItem('waseshibu-math-safe-mode-v1','1');assert.equal(m.saveCheck(source,bank.checks[1],'10'),false)
// Independent calculations for all numeric items, not a copy of the grading key.
assert.deepEqual(m.skillCheckBanks[0].checks.map(q=>Number(q.answer)),[8-(-5),20-(4-(6-9)*2)])
assert.deepEqual(m.skillCheckBanks[0].support.map(q=>Number(q.answer)),[-7-(-12),12-(3-(5-8)*2)])
assert.equal(Number(m.skillCheckBanks[0].transfer.answer),30-18+(4-7)*2)
assert.equal(Number(m.skillCheckBanks[1].checks[1].answer),1440/(4*(1+2)))
assert.equal(Number(m.skillCheckBanks[1].support[1].answer),800/(2*(1+3)))
assert.equal(Number(m.skillCheckBanks[1].transfer.answer),140/(3+2*2))
console.log('PASS skill checks: both branches, targeted support, transfer, first answer, backup/merge, score isolation, write protection and arithmetic verification')
}finally{rmSync(temp,{recursive:true,force:true})}
