import assert from 'node:assert/strict'
import { build } from 'esbuild'

async function loadModule(entry){
  const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false})
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}

class MemoryStorage{
  constructor(seed={},failOnWrite=Infinity){this.map=new Map(Object.entries(seed));this.writes=0;this.failOnWrite=failOnWrite}
  getItem(key){return this.map.has(key)?this.map.get(key):null}
  setItem(key,value){this.writes++;if(this.writes===this.failOnWrite)throw new Error('quota test');this.map.set(key,String(value))}
  removeItem(key){this.map.delete(key)}
}

const backup=await loadModule('src/dataBackup.ts')
const answer=await loadModule('src/answer.ts')
const exam=await loadModule('src/data/examAnswers.ts')
const preflight=await loadModule('src/preflight.ts')
const sample={
  'waseshibu-math-attempts':[{id:'a1',questionId:'2024-Q1-1',answer:'６',status:'correct',at:'2026-01-01T00:00:00.000Z'}],
  'waseshibu-math-preferences':{target:70,name:'受験生',updatedAt:'2026-01-01T00:00:00.000Z'},
  'waseshibu-math-daily':{date:'2026-01-01',questionIds:['2024-Q1-1'],completed:false},
  'waseshibu-math-exam-scores':[{id:'s1',year:2024,score:65,correctCount:13,at:'2026-01-01T00:00:00.000Z'}],
  'waseshibu-math-exam-drafts-v2':{'2025':{answers:{'2025-Q1-1':'－１６'},flags:{'2025-Q1-2':true},seconds:321,majorIndex:1,phase:'solve'}},
  'waseshibu-math-learning-route-v1':{solvedYears:[2024],usedOldQuestionIds:['2019-Q1-1'],reinforcement:{'2024':{examId:'s1',completedQuestionIds:['2019-Q1-1']}},updatedAt:'2026-01-01T00:00:00.000Z'}
  ,'waseshibu-math-prep-check-v1':{version:1,index:2,answers:{'prep-1':'６','prep-2':'－３'},tries:{'prep-1':1,'prep-2':1},completed:false,skipped:false,updatedAt:'2026-01-01T00:00:00.000Z'}
}
const source=new MemoryStorage(Object.fromEntries(Object.entries(sample).map(([key,value])=>[key,JSON.stringify(value)])))
const pkg=backup.collectBackup(source)
const json=JSON.stringify(pkg),parsed=backup.parseBackup(json),restored=new MemoryStorage()
backup.restoreBackup(restored,parsed,'replace')
for(const key of backup.BACKUP_KEYS)assert.deepEqual(JSON.parse(restored.getItem(key)),sample[key],`round trip: ${key}`)

const merged=new MemoryStorage({'waseshibu-math-attempts':JSON.stringify([{id:'local'}]),'waseshibu-math-exam-drafts-v2':JSON.stringify({'2024':{answers:{x:'1'}}})})
backup.restoreBackup(merged,parsed,'merge')
assert.deepEqual(JSON.parse(merged.getItem('waseshibu-math-attempts')).map(x=>x.id),['local','a1'])
assert.deepEqual(Object.keys(JSON.parse(merged.getItem('waseshibu-math-exam-drafts-v2'))).sort(),['2024','2025'])

assert.throws(()=>backup.parseBackup('{broken'),/JSON/)
assert.throws(()=>backup.validateBackup({...pkg,data:{unknown:[]}}),/未対応/)
const before=Object.fromEntries(backup.BACKUP_KEYS.map(key=>[key,source.getItem(key)])),failing=new MemoryStorage(before,2)
assert.throws(()=>backup.restoreBackup(failing,parsed,'replace'),/元のデータへ戻しました/)
for(const key of backup.BACKUP_KEYS)assert.equal(failing.getItem(key),before[key],`rollback: ${key}`)

const accepted=[
  ['６','6'],['３／４','3/4'],['０．７５','3/4'],['２ｓｑｒｔ（１５）','2√15'],['２×√１５','2√15'],
  ['（－１，－１）','(-1,-1)'],['１５０度','150'],['０≦ｙ≦２７','0<=y<=27'],['ｂ','B'],['３⁄４','3/4']
]
for(const [input,expected] of accepted)assert.equal(answer.isAcceptedAnswer(input,expected),true,`${input} => ${expected}`)
const toFullWidth=value=>value.replace(/[!-~]/g,char=>String.fromCharCode(char.charCodeAt(0)+0xFEE0))
for(const [id,expected] of Object.entries(exam.examAnswers))assert.equal(exam.isExamAnswerCorrect(id,toFullWidth(expected.answer)),true,`full-width canonical: ${id}`)
const integrity=preflight.runExamIntegrityCheck()
assert.equal(integrity.ok,true,integrity.issues.join('\n'))
assert.deepEqual([integrity.questionCount,integrity.answerCount,integrity.year2024Count],[160,160,20])
assert.equal(preflight.prepQuestions.length,5)
for(const q of preflight.prepQuestions)assert.equal(answer.isAcceptedAnswer(toFullWidth(q.answer),q.answer,q.acceptedAnswers),true,`prep full-width: ${q.id}`)
assert.equal(answer.isAcceptedAnswer('7','6'),false)
assert.equal(answer.cleanAnswerInput('６\n＋\t１').includes('\n'),false)

console.log('CRITICAL VERIFICATION PASSED')
console.log(`backup keys: ${backup.BACKUP_KEYS.length}, round-trip: OK, merge: OK, rollback: OK, integrity: 160/160 + 2024 20, prep: 5, input variants: ${accepted.length}+160 full-width answers`)
