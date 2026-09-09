import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const modelingSource=fs.readFileSync('src/modelingHint.ts','utf8')
const remediationSource=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const practiceSource=fs.readFileSync('src/pages/Practice.tsx','utf8')
const guidedSource=fs.readFileSync('src/pages/GuidedReview.tsx','utf8')

const labels=['登場する量','一定の量','変化する量','ルール','何を文字で置くか','求めるもの']
const hint=modelingSource.match(/export const WORD_PROBLEM_MODELING_HINT='([^']+)'/)?.[1]
const topicPatternSource=modelingSource.match(/const WORD_PROBLEM_TOPIC_PATTERN=\/(.+)\//)?.[1]

assert.ok(hint,'S3-MODEL-001: 専用ヒント定数がない')
for(const label of labels)assert.match(hint,new RegExp(`【${label}】`),`S3-MODEL-001: ${label} がない`)
assert.ok(labels.every((label,index)=>index===0||hint.indexOf(`【${labels[index-1]}】`)<hint.indexOf(`【${label}】`)),'S3-MODEL-001: 6項目の順序が違う')
assert.doesNotMatch(hint,/[=＝]/,'S3-MODEL-002: 最初の整理ヒントに完成式を含めない')
assert.match(modelingSource,/fieldId==='word-problems'/,'S3-MODEL-003/004: 文章題分野の境界がない')
assert.ok(topicPatternSource,'S3-MODEL-005/006: 文章題topicの判定パターンがない')
const topicPattern=new RegExp(topicPatternSource)
for(const topic of ['売買量と収支の方程式','3変数の数量関係','食塩水の置換','移動と速さ'])assert.match(topic,topicPattern,`S3-MODEL-005: ${topic} を文章題として扱う`)
for(const topic of ['因数分解','円周角','確率'])assert.doesNotMatch(topic,topicPattern,`S3-MODEL-006: ${topic} を文章題扱いしない`)
assert.match(remediationSource,/modelingHintForField\(fieldId\)/,'S3-MODEL-003: 固定類題の文章題ヒントに適用されていない')
assert.match(practiceSource,/modelingHintForField\(field\.id\)/,'S3-MODEL-004: 日次練習の文章題ヒントに適用されていない')
assert.match(guidedSource,/modelingHintForTopic\(modelingHintSubject\)/,'S3-MODEL-005: 過去問Guidedのタイトル・topicに適用されていない')
assert.match(guidedSource,/hasStructuredOpening\?modelingHint:solution\.firstNotice/,'S3-MODEL-007: 6項目より先に個別解法を表示している')

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-modeling-hint-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',['src/modelingHint.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{encoding:'utf8'})
if(built.status!==0)throw new Error(`modelingHint compile failed\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),modeling=require(path.join(temp,'modelingHint.js'))

assert.equal(modeling.modelingHintKindForTopic('小問集合（8問） 二次関数の変化の割合'),'generic','S3-MODEL-008: 関数用語の「割合」を文章題扱いしない')
assert.equal(modeling.modelingHintKindForTopic('小問集合（8問） 座標の対称移動'),'generic','S3-MODEL-009: 座標変換の「移動」を文章題扱いしない')
assert.equal(modeling.modelingHintKindForTopic('移動と速さ'),'word-problem','S3-MODEL-010: 速さの文章題を除外しない')
assert.equal(modeling.modelingHintKindForTopic('三角形上の移動ルールと場合の数'),'probability-counting','S3-MODEL-011: 場合の数を文章題へ誤分類しない')
assert.equal(modeling.modelingHintKindForTopic('歩行距離と飲水量 比例関係'),'word-problem','S3-MODEL-012: 実データ2022-Q3-1の数量文章題に適用する')
assert.equal(modeling.modelingHintKindForTopic('歩行距離と飲水量 1kmあたりの量を逆算'),'word-problem','S3-MODEL-013: 実データ2022-Q3-2-iの数量文章題に適用する')

console.log('PASS: S3-MODEL-001..013 文章題は6項目を整理してから立式し、実データへの未適用と非文章題への過剰適用を防ぐ')
