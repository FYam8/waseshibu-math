import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const out=path.join(os.tmpdir(),`waseshibu-final-answer-${process.pid}.mjs`)
await build({stdin:{contents:`export * from ${JSON.stringify(path.resolve('src/answer.ts'))};export * from ${JSON.stringify(path.resolve('src/data/examAnswers.ts'))};`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:out})
const mod=await import(pathToFileURL(out).href+`?t=${Date.now()}`)

const cases=[
  {id:'S10-FINAL-001',question:'2019-Q1-8',input:'252/10',expected:false,reason:'未約分の分数を本番答案として受理しない'},
  {id:'S10-FINAL-002',question:'2019-Q1-8',input:'126/5',expected:true,reason:'約分済みの正答を受理する'},
  {id:'S10-FINAL-003',question:'2020-Q1-1',input:'√8',expected:false,reason:'未簡約の根号を本番答案として受理しない'},
  {id:'S10-FINAL-004',question:'2020-Q1-1',input:'2√2',expected:true,reason:'簡約済みの根号を受理する'},
  {id:'S10-FINAL-005',question:'2019-Q2-1',input:'2:18',expected:false,reason:'最も簡単でない整数比を受理しない'},
  {id:'S10-FINAL-006',question:'2019-Q2-1',input:'1:9',expected:true,reason:'最も簡単な整数比を受理する'},
  {id:'S10-FINAL-007',question:'2019-Q2-2',input:'3/(8√3)',expected:false,reason:'根号を含む分母を有理化前の形で受理しない'},
  {id:'S10-FINAL-008',question:'2019-Q2-2',input:'√3/8',expected:true,reason:'有理化済みの正答を受理する'},
  {id:'S10-FINAL-009',question:'2025-Q1-4',input:'-1+√3',expected:false,reason:'複数解の一方だけでは不足'},
  {id:'S10-FINAL-010',question:'2025-Q1-4',input:'-1-√3,-1+√3',expected:true,reason:'解の順序が逆でも全解があれば受理する'},
  {id:'S10-FINAL-011',question:'2025-Q1-4',input:'-1-√3,-1+√3,0',expected:false,reason:'余分な解を含む答案を受理しない'},
  {id:'S10-FINAL-012',question:'2024-Q2-3',input:'3-√13',expected:false,reason:'条件に合わない別解を受理しない'},
  {id:'S10-FINAL-013',question:'2019-Q1-4',input:'50',expected:true,reason:'公式正答データどおり単位なしを受理する'},
  {id:'S10-FINAL-014',question:'2019-Q1-4',input:'50°',expected:true,reason:'登録済みの正しい角度単位を受理する'},
  {id:'S10-FINAL-015',question:'2019-Q1-4',input:'50cm',expected:false,reason:'値が同じでも異なる種類の単位を受理しない'},
  {id:'S10-FINAL-016',question:'2021-Q4-1',input:'Q店,30000円',expected:true,reason:'登録済みの金額単位を含む答案を受理する'},
  {id:'S10-FINAL-017',question:'2021-Q4-1',input:'Q店,30000cm',expected:false,reason:'金額へ長さ単位を付けた答案を受理しない'},
  {id:'S10-FINAL-018',question:'2024-Q2-3',input:'3+√13',expected:true,reason:'条件に合う唯一の正答を受理する'},
]

for(const test of cases){
  assert.equal(mod.isExamAnswerCorrect(test.question,test.input),test.expected,`${test.id}: ${test.reason}`)
}

assert.equal(mod.isAcceptedAnswer('252/10','126/5'),true,'数学的同値性は未約分答案でも成立する')
assert.equal(mod.isAcceptedAnswer('√8','2√2'),true,'数学的同値性は未簡約根号でも成立する')
assert.equal(mod.isAcceptedAnswer('2:18','1:9'),true,'数学的同値性は未簡単比でも成立する')
assert.equal(mod.isExamAnswerCorrect('2019-Q1-8','252/10'),false,'本番答案形式は数学的同値性と分離する')

for(const [questionId,expected] of Object.entries(mod.examAnswers)){
  assert.equal(mod.isExamAnswerCorrect(questionId,expected.answer),true,`${questionId}: canonical answer must pass`)
  for(const accepted of expected.acceptedAnswers||[])assert.equal(mod.isExamAnswerCorrect(questionId,accepted),true,`${questionId}: registered accepted answer must pass: ${accepted}`)
}

const pastPapersUi=fs.readFileSync('src/pages/PastPapers.tsx','utf8')
for(const phrase of ['分数は約分','根号・比は最も簡単な形','複数の解はすべて入力','単位は問題冊子・解答欄の指示']){
  assert.ok(pastPapersUi.includes(phrase),`past-paper answer dock must explain: ${phrase}`)
}

console.log(`最終答案形式 ${cases.length}ケース + 全公式正答・登録別解回帰: PASS`)
