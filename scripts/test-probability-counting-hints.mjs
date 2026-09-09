import assert from 'node:assert/strict'
import fs from 'node:fs'

const modelingSource=fs.readFileSync('src/modelingHint.ts','utf8')
const remediationSource=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const practiceSource=fs.readFileSync('src/pages/Practice.tsx','utf8')
const guidedSource=fs.readFileSync('src/pages/GuidedReview.tsx','utf8')
const guidedData=JSON.parse(fs.readFileSync('src/data/guidedSolutions.json','utf8'))

const labels=['全体の場合の数','順序を区別するか','重複があるか','条件を満たす場合','必要な場合分け']
const hint=modelingSource.match(/export const PROBABILITY_COUNTING_HINT='([^']+)'/)?.[1]
const topicPatternSource=modelingSource.match(/const PROBABILITY_COUNTING_TOPIC_PATTERN=\/(.+)\//)?.[1]

assert.ok(hint,'S4-COUNT-001: 専用ヒント定数がない')
for(const label of labels)assert.match(hint,new RegExp(`【${label}】`),`S4-COUNT-001: ${label} がない`)
assert.ok(labels.every((label,index)=>index===0||hint.indexOf(`【${labels[index-1]}】`)<hint.indexOf(`【${label}】`)),'S4-COUNT-002: 5項目の順序が違う')
assert.doesNotMatch(hint,/[=＝]|\d+\s*[×÷/]/,'S4-COUNT-003: 最初の確認で個別問題の計算を始めている')
assert.match(modelingSource,/fieldId==='probability'\|\|fieldId==='counting'/,'S4-COUNT-004: 確率・場合の数の両分野に適用されていない')
assert.ok(topicPatternSource,'S4-COUNT-005: topic判定パターンがない')
const topicPattern=new RegExp(topicPatternSource)
for(const topic of ['確率','コイン確率','サイコロと積・和の確率','三角形上の移動ルールと場合の数','2人が異なるスイッチを選ぶ場合の数'])assert.match(topic,topicPattern,`S4-COUNT-005: ${topic} を対象にしていない`)
for(const topic of ['因数分解','円周角','売買量と収支の方程式'])assert.doesNotMatch(topic,topicPattern,`S4-COUNT-006: ${topic} を確率・場合の数扱いしている`)
assert.match(remediationSource,/modelingHintForField\(fieldId\)/,'S4-COUNT-007: 固定類題に適用されていない')
assert.match(practiceSource,/modelingHintForField\(field\.id\)/,'S4-COUNT-007: 日次練習に適用されていない')
assert.match(guidedSource,/hasStructuredOpening\?modelingHint:solution\.firstNotice/,'S4-COUNT-008: 5項目より先に個別解法を表示している')
assert.match(guidedSource,/modelingHintSubject=`\$\{q\.title\} \$\{q\.topic\}`/,'S4-COUNT-009: Guidedが実データのタイトルを判定に使っていない')
for(const id of ['2020-Q2-1','2022-Q1-5','2023-Q5-1','2024-Q3-1','2026-Q3-1']){
  const question=guidedData.solutions[id]
  assert.ok(question,`S4-COUNT-009: 実データ ${id} がない`)
  assert.match(`${question.title} ${question.topic}`,topicPattern,`S4-COUNT-009: 実データ ${id} が専用支援の対象外`)
}

console.log('PASS: S4-COUNT-001..009 確率・場合の数は実データIDでも5項目を確認してから数え始め、個別問題の答え・計算を先に示さない')
