import assert from 'node:assert/strict'
import fs from 'node:fs'
import {build} from 'esbuild'

const output=await build({
  entryPoints:['src/preflight.ts'],bundle:true,platform:'node',format:'esm',write:false
})
const prep=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'))
const q=id=>{const item=prep.prepQuestions.find(q=>q.id===id);assert.ok(item);return item}
const cases=[
  ['S10-PREP-R01','prep-4','√12',false],
  ['S10-PREP-R02','prep-4','sqrt(12)',false],
  ['S10-PREP-R03','prep-4','√(4*3)',false],
  ['S10-PREP-R04','prep-4','2√3',true],
  ['S10-PREP-R05','prep-4','2sqrt(3)',true],
  ['S10-PREP-R06','prep-4','2*√3',true],
  ['S10-PREP-R07','prep-4','２＊ｓｑｒｔ（３）',true],
  ['S10-PREP-R08','prep-4',' 2 √(3) ',true],
  ['S10-PREP-R09','prep-4','3.4641016151377544',false],
  ['S10-PREP-R10','prep-4','√3*2',false],
  ['S10-PREP-R11','prep-4','4√3/2',false],
  ['S10-PREP-R12','prep-4','2√12',false],
  ['S10-PREP-R13','prep-4','',false],
  ['S10-PREP-R14','prep-4','−2√3',false],
  ['S10-PREP-I01','prep-1','６',true],
  ['S10-PREP-I02','prep-1','7',false],
  ['S10-PREP-N01','prep-2','−３',true],
  ['S10-PREP-N02','prep-2','3',false],
  ['S10-PREP-F01','prep-3','3/4',true],
  ['S10-PREP-F02','prep-3','0.75',true],
  // Characterization only: no new requirement to simplify the fraction here.
  ['S10-PREP-F03','prep-3','6/8',true],
  ['S10-PREP-C01','prep-5','（２，１）',true],
  ['S10-PREP-C02','prep-5','x=2,y=1',true],
  ['S10-PREP-C03','prep-5','(1,2)',false]
]
const before=JSON.stringify(prep.prepQuestions)
for(const [id,questionId,input,expected] of cases){
  assert.equal(prep.isAcceptedPrepAnswer(input,q(questionId)),expected,`${id}: ${input}`)
}
assert.equal(JSON.stringify(prep.prepQuestions),before,'grading must not mutate question data')
assert.equal(prep.PREP_KEY,'waseshibu-math-prep-check-v1')
assert.equal(prep.PREP_VERSION,1)
const ui=fs.readFileSync('src/pages/PrepCheck.tsx','utf8')
assert.match(ui,/const correct=isAcceptedPrepAnswer\(answer,q\)/,'UI must use the tested grader')
assert.doesNotMatch(ui,/isAcceptedAnswer\(answer/,'UI must not bypass the form check')
console.log(`PASS: ${cases.length} preparation input/form cases + UI wiring + immutable questions + unchanged storage identity`)
console.log('Synthetic-input feature checks only: not AI learner transfer or human learning outcomes.')
