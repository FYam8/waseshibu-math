import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const component=read('src/components/QuestionProvenance.tsx')
const route=read('src/learningRoute.ts')
const reinforcement=read('src/pages/Reinforcement.tsx')
const remediation=read('src/pages/Remediation.tsx')
const guided=read('src/pages/GuidedReview.tsx')
const practice=read('src/pages/Practice.tsx')
const css=read('src/styles.css')

for(const text of ['過去問','オリジナル類題','問題ランク','60点目標で優先','70点目標で追加','75点目標で選択']){
  if(!component.includes(text))throw new Error(`provenance component missing: ${text}`)
}
if(!route.includes('grade:Grade')||!route.includes('grade:s.grade'))throw new Error('old past-paper items do not carry A/B/C grade')
if(!reinforcement.includes('kind="past-paper"')||!reinforcement.includes('grade={item.grade}'))throw new Error('past-paper reinforcement provenance missing')
if(!reinforcement.includes('storedExamItems(exam,attempts)')||!reinforcement.includes('&q=${encodeURIComponent(sourceItem.key)}'))throw new Error('reinforcement does not pass the source question into remediation')
if(!remediation.includes('kind="original"')||!remediation.includes('grade={difficulty}'))throw new Error('original remediation provenance missing')
if(!remediation.includes('過去問本文の転載ではなく'))throw new Error('original-question explanation missing')
if(!guided.includes('kind="past-paper"')||!guided.includes('grade={q.grade}'))throw new Error('guided past-paper provenance missing')
if(!practice.includes('label="オリジナル基礎問題"'))throw new Error('foundation problem provenance missing')
for(const selector of ['.question-provenance','.question-provenance.past-paper','.question-provenance.original','.target-question-summary']){
  if(!css.includes(selector))throw new Error(`provenance CSS missing: ${selector}`)
}
if(remediation.includes('過去問基準の難易度：'))throw new Error('ambiguous provenance wording remains')

console.log('PASS: past-paper reinforcement shows source year/question and A/B/C rank')
console.log('PASS: original remediation is explicitly labelled and keeps its source question difficulty')
