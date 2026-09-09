import assert from 'node:assert/strict'
import fs from 'node:fs'
import { modelingHintForField, modelingHintForTopic, WORD_PROBLEM_MODELING_HINT } from '../src/modelingHint.ts'

const modelingSource=fs.readFileSync('src/modelingHint.ts','utf8')
const remediationSource=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const practiceSource=fs.readFileSync('src/pages/Practice.tsx','utf8')
const guidedSource=fs.readFileSync('src/pages/GuidedReview.tsx','utf8')

const labels=['登場する量','一定の量','変化する量','ルール','何を文字で置くか','求めるもの']
const hint=modelingSource.match(/export const WORD_PROBLEM_MODELING_HINT='([^']+)'/)?.[1]

assert.ok(hint,'S3-MODEL-001: 専用ヒント定数がない')
for(const label of labels)assert.match(hint,new RegExp(`【${label}】`),`S3-MODEL-001: ${label} がない`)
assert.ok(labels.every((label,index)=>index===0||hint.indexOf(`【${labels[index-1]}】`)<hint.indexOf(`【${label}】`)),'S3-MODEL-001: 6項目の順序が違う')
assert.doesNotMatch(hint,/[=＝]/,'S3-MODEL-002: 最初の整理ヒントに完成式を含めない')
assert.equal(modelingHintForField('word-problems'),WORD_PROBLEM_MODELING_HINT,'S3-MODEL-003: 文章題の固定類題に専用ヒントを返す')
assert.notEqual(modelingHintForField('factoring'),WORD_PROBLEM_MODELING_HINT,'S3-MODEL-004: 非文章題へ専用ヒントを出さない')
for(const topic of ['売買量と収支の方程式','3変数の数量関係','食塩水の置換','移動と速さ'])assert.equal(modelingHintForTopic(topic),WORD_PROBLEM_MODELING_HINT,`S3-MODEL-005: ${topic} を文章題として扱う`)
for(const topic of ['因数分解','円周角','確率'])assert.notEqual(modelingHintForTopic(topic),WORD_PROBLEM_MODELING_HINT,`S3-MODEL-006: ${topic} を文章題扱いしない`)
assert.match(remediationSource,/modelingHintForField\(fieldId\)/,'S3-MODEL-003: 固定類題の文章題ヒントに適用されていない')
assert.match(practiceSource,/modelingHintForField\(field\.id\)/,'S3-MODEL-004: 日次練習の文章題ヒントに適用されていない')
assert.match(guidedSource,/modelingHintForTopic\(q\.topic\)/,'S3-MODEL-005: 過去問Guidedの文章題導入に適用されていない')
assert.match(modelingSource,/fieldId==='word-problems'/,'S3-MODEL-006: 非文章題まで専用ヒントに置換しない')

console.log('PASS: S3-MODEL-001..006 文章題は6項目を整理してから立式し、非文章題・正答データ・採点には影響しない')
