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
const migration=await loadModule('src/dataMigration.ts')
const guided=await loadModule('src/guidedReview.ts')
const focus=await loadModule('src/data/questionFocus.ts')
const targetStrategy=await loadModule('src/targetStrategy.ts')
const version=await loadModule('src/version.ts')

assert.equal(version.APP_VERSION,'0.12.0')
assert.equal(migration.CURRENT_DATA_VERSION,3)
assert.equal(guided.GUIDED_REVIEW_KEY,'waseshibu-math-guided-review-v1')

const sample={
  'waseshibu-math-attempts':[{id:'a1',questionId:'exam-2024-Q1-1',answer:'６',status:'wrong',at:'2026-01-01T00:00:00.000Z'}],
  'waseshibu-math-preferences':{target:70,name:'受験生',updatedAt:'2026-01-01T00:00:00.000Z'},
  'waseshibu-math-daily':{date:'2026-01-01',questionIds:['2024-Q1-1'],completed:false},
  'waseshibu-math-exam-scores':[{id:'s1',year:2024,score:65,correctCount:13,at:'2026-01-01T00:00:00.000Z'}],
  'waseshibu-math-exam-drafts-v2':{'2025':{answers:{'2025-Q1-1':'－１６'},flags:{'2025-Q1-2':true},seconds:321,majorIndex:1,phase:'solve'}},
  'waseshibu-math-learning-route-v1':{solvedYears:[2024],usedOldQuestionIds:['2019-Q1-1'],reinforcement:{'2024':{examId:'s1',completedQuestionIds:['2019-Q1-1']}},updatedAt:'2026-01-01T00:00:00.000Z'},
  'waseshibu-math-prep-check-v1':{version:1,index:2,answers:{'prep-1':'６'},tries:{'prep-1':1},completed:false,skipped:false,updatedAt:'2026-01-01T00:00:00.000Z'},
  'waseshibu-math-guided-review-v1':{'2024-Q1-1':{questionId:'2024-Q1-1',step1:'整理',step2:'途中式',finalAnswer:'6',hintUsed:true,answerSeen:false,outcome:'guided',updatedAt:'2026-01-01T00:00:00.000Z'}},
  'waseshibu-math-data-version':3
}
const source=new MemoryStorage(Object.fromEntries(Object.entries(sample).map(([key,value])=>[key,JSON.stringify(value)])))
const pkg=backup.collectBackup(source),parsed=backup.parseBackup(JSON.stringify(pkg)),restored=new MemoryStorage()
backup.restoreBackup(restored,parsed,'replace')
for(const key of backup.BACKUP_KEYS)assert.deepEqual(JSON.parse(restored.getItem(key)),sample[key],`round trip: ${key}`)

const v2Seed={
  'waseshibu-math-attempts':JSON.stringify([{id:'keep',questionId:'exam-2024-Q1-1',status:'wrong',at:'2026-01-01'}]),
  'waseshibu-math-exam-scores':JSON.stringify([{id:'score',year:2024,score:60,at:'2026-01-01'}]),
  'waseshibu-math-data-version':'2'
}
const v2=new MemoryStorage(v2Seed),migrated=migration.runDataMigrations(v2)
assert.equal(migrated.ok,true)
assert.equal(v2.getItem('waseshibu-math-data-version'),'3')
assert.deepEqual(JSON.parse(v2.getItem('waseshibu-math-attempts')),JSON.parse(v2Seed['waseshibu-math-attempts']))
assert.deepEqual(JSON.parse(v2.getItem('waseshibu-math-exam-scores')),JSON.parse(v2Seed['waseshibu-math-exam-scores']))
assert.deepEqual(JSON.parse(v2.getItem('waseshibu-math-guided-review-v1')),{})

const merged=new MemoryStorage({'waseshibu-math-guided-review-v1':JSON.stringify({'2024-Q1-2':{questionId:'2024-Q1-2'}})})
backup.restoreBackup(merged,parsed,'merge')
assert.deepEqual(Object.keys(JSON.parse(merged.getItem('waseshibu-math-guided-review-v1'))).sort(),['2024-Q1-1','2024-Q1-2'])

const failing=new MemoryStorage(Object.fromEntries(backup.BACKUP_KEYS.map(key=>[key,source.getItem(key)])),2)
assert.throws(()=>backup.restoreBackup(failing,parsed,'replace'),/元のデータへ戻しました/)
for(const key of backup.BACKUP_KEYS)assert.equal(failing.getItem(key),source.getItem(key),`rollback: ${key}`)

const guide=guided.guidedQuestion('exam-2024-Q1-1')
assert.equal(guide.id,'2024-Q1-1')
assert.equal(guide.year,2024)
assert.equal(guide.answer.answer,exam.examAnswers['2024-Q1-1'].answer)
assert.equal(guided.guidedQuestion('2024-Q2-2').previousId,'2024-Q2-1')
assert.equal(guide.subCount>0,true)
const guideStore=new MemoryStorage()
guided.saveGuidedReview({questionId:'exam-2024-Q1-1',step1:'a',step2:'b',finalAnswer:'6',hintUsed:false,answerSeen:false,outcome:'independent',updatedAt:'x'},guideStore)
assert.equal(guided.loadGuidedReview('2024-Q1-1',guideStore).outcome,'independent')

const questions=(await import('../src/data/questions.json',{with:{type:'json'}})).default.questions
let focusCount=0
for(const major of questions){
  assert.equal(focus.focusCoverageOk(major.year,major.major,major.subquestions.length),true,`focus coverage ${major.id}`)
  for(let i=0;i<major.subquestions.length;i++){
    const slices=focus.focusSlicesFor(major.year,major.major,i,major.subquestions.length)
    assert.equal(slices.filter(x=>x.role==='current').length>=1,true,`current focus ${major.id}-${major.subquestions[i].no}`)
    focusCount++
  }
}
assert.equal(focusCount,160)

const accepted=[['６','6'],['３／４','3/4'],['２×√１５','2√15'],['（－１，－１）','(-1,-1)']]
for(const [input,expected] of accepted)assert.equal(answer.isAcceptedAnswer(input,expected),true,`${input} => ${expected}`)
const toFullWidth=value=>value.replace(/[!-~]/g,char=>String.fromCharCode(char.charCodeAt(0)+0xFEE0))
for(const [id,expected] of Object.entries(exam.examAnswers))assert.equal(exam.isExamAnswerCorrect(id,toFullWidth(expected.answer)),true,`full-width canonical: ${id}`)
const integrity=preflight.runExamIntegrityCheck()
assert.equal(integrity.ok,true,integrity.issues.join('\n'))
assert.deepEqual([integrity.questionCount,integrity.answerCount,integrity.year2024Count],[160,160,20])

const strategyItems=[
  {key:'a',major:1,subNo:'1',topic:'数式計算',grade:'A',status:'wrong',points:5,cause:'計算ミス'},
  {key:'b',major:2,subNo:'1',topic:'放物線',grade:'B',status:'wrong',points:5},
  {key:'c',major:5,subNo:'3',topic:'相似・面積比',grade:'C',status:'wrong',points:5}
]
assert.deepEqual([targetStrategy.gradeInTarget(60,'A'),targetStrategy.gradeInTarget(60,'B'),targetStrategy.gradeInTarget(70,'B'),targetStrategy.gradeInTarget(75,'C')],[true,false,true,true])
for(const target of [60,70,75])assert.equal(targetStrategy.targetProfile(target).timePlan.reduce((sum,x)=>sum+x.percent,0),100)

console.log('CRITICAL VERIFICATION PASSED')
console.log(`v0.12.0, data v3, focus: ${focusCount}/160, backup/no-loss migration: OK, integrity: 160/160`)
