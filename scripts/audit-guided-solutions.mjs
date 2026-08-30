
import fs from 'node:fs'
const path=new URL('../src/data/guidedSolutions.json', import.meta.url)
const data=JSON.parse(fs.readFileSync(path,'utf8'))
const solutions=data.solutions||{}
const ids=Object.keys(solutions)
const failures=[]
const assert=(cond,msg)=>{if(!cond)failures.push(msg)}
assert(data.count===160,`count=${data.count}`)
assert(ids.length===160,`solutions=${ids.length}`)
const corrected={
 '2019-Q1-3':'2,3/2',
 '2019-Q2-2':'√3/8',
 '2022-Q1-2':'-6,2',
 '2022-Q2-2':'(3t,9t²/4)',
 '2024-Q2-2':'(2,4)',
 '2024-Q2-3':'3+√13'
}
for(const [id,s] of Object.entries(solutions)){
  assert(s.questionId===id,`${id}: questionId mismatch`)
  assert(Array.isArray(s.steps)&&s.steps.length>=2,`${id}: insufficient steps`)
  assert(s.firstNotice&&s.firstNotice.length>=8,`${id}: firstNotice too short`)
  assert(s.finalAnswer&&s.finalAnswer.answer,`${id}: no final answer`)
  assert(s.audit?.status==='approved',`${id}: audit not approved`)
  assert(s.audit?.contentVersion===2,`${id}: contentVersion not 2`)
  assert(s.audit?.answerChecked&&s.audit?.stepsChecked&&s.audit?.scopeChecked&&s.audit?.figureChecked,`${id}: audit flags incomplete`)
  const oldGeneric=(s.steps||[]).some(st=>/求めるものと条件を特定|最初の1手を決める|推奨の入口/.test(st.reveal||''))
  assert(!oldGeneric,`${id}: old generic guided text remains`)
  for(const [i,st] of (s.steps||[]).entries()){
    assert(st.id===`calc-${i+1}`,`${id}: step id ${st.id}`)
    assert(typeof st.reveal==='string'&&st.reveal.length>=4,`${id}: empty reveal ${i+1}`)
    assert(/[0-9A-Za-z√π°△∠=:<>±²アイウエオカキ]/.test(st.reveal),`${id}: reveal lacks mathematical specificity ${i+1}`)
    assert(st.hint1&&st.hint2,`${id}: missing hint ${i+1}`)
    assert(st.response?.type==='self-check',`${id}: response not self-check ${i+1}`)
  }
  const exp=corrected[id]
  if(exp)assert(s.finalAnswer.answer===exp,`${id}: corrected official answer expected ${exp}, got ${s.finalAnswer.answer}`)
  for(const st of s.steps)assert(s.fullExplanation.includes(st.reveal),`${id}: full explanation missing reveal`)
}
if(failures.length){
 console.error(`FAIL ${failures.length}`)
 for(const f of failures)console.error(f)
 process.exit(1)
}
console.log(`PASS guided math audit: ${ids.length}/160 solutions, all contentVersion=2, all approved, all numeric/symbolic step reveals present.`)
