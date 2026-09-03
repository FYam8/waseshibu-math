import assert from 'node:assert/strict'
import fs from 'node:fs'

const questions=JSON.parse(fs.readFileSync('src/data/questions.json','utf8')).questions
const source=fs.readFileSync('src/data/questionFocusManifest.ts','utf8')
const manifest={}
for(const match of source.matchAll(/^\s*'([^']+)':(\{.*\}),?$/gm))manifest[match[1]]=JSON.parse(match[2])

const candidates=questions.filter(q=>q.year>=2019&&q.year<=2021).flatMap(q=>q.subquestions.map(s=>`${q.id}-${s.no}`))
assert.equal(candidates.length,60,'reinforcement past-paper pool must remain the 60 questions from 2019-2021')
for(const id of candidates){
  const entry=manifest[id]
  assert.ok(entry?.current?.length,`${id} must have an exact current-question crop`)
  for(const slice of [...entry.common,...entry.current]){
    const file=`public/exam-pages/${id.slice(0,4)}/page-${String(slice.page).padStart(2,'0')}.jpg`
    assert.ok(fs.existsSync(file),`${id} source page is missing: ${file}`)
    assert.ok(slice.top>=0&&slice.height>0&&slice.top+slice.height<=100,`${id} crop is outside its source page`)
  }
}

const commonVisualGroups=[
  ['2019-Q2',2],['2019-Q3',3],['2019-Q4',3],['2019-Q5',3],
  ['2020-Q3',3],['2020-Q4',3],['2020-Q5',3],
  ['2021-Q3',3],['2021-Q4',3],['2021-Q5',3]
]
for(const [prefix,count] of commonVisualGroups)for(let sub=1;sub<=count;sub++)assert.ok(manifest[`${prefix}-${sub}`].common.length,`${prefix}-${sub} must show its official common conditions/figure`)
for(const id of ['2019-Q1-4','2020-Q1-6','2021-Q1-6','2021-Q1-7'])assert.ok(manifest[id].current.length,`${id} must show its official visual in the current crop`)
for(const id of ['2021-Q2-1','2021-Q2-2','2021-Q2-3'])assert.equal(manifest[id].sharedTask,true,`${id} must retain its official shared problem and figure`)

const q115=manifest['2021-Q1-5'].current[0]
assert.ok(q115.height<=5.9,'2021-Q1-5 must exclude the unrelated Q1(6) circle placed high in the right column')
const view=fs.readFileSync('src/components/FocusedQuestionView.tsx','utf8')
assert.match(view,/exam-pages\/\$\{year\}/,'past questions must render from official question-page images')
assert.doesNotMatch(view,/exam-answers/,'past-question display must not use answer-page images')

console.log('PASS: 60 reinforcement past-paper crops use question pages; required common/current figures are present and Q1(5) no longer leaks Q1(6)')
