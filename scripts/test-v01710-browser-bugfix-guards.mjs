import assert from 'node:assert/strict'
import fs from 'node:fs'

const app=fs.readFileSync('src/App.tsx','utf8')
const home=fs.readFileSync('src/pages/Home.tsx','utf8')
const report=fs.readFileSync('src/pages/Report.tsx','utf8')
const remedy=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const data=fs.readFileSync('src/data/remediation.ts','utf8')
const version=fs.readFileSync('src/version.ts','utf8')

assert.match(app,/GuidedReview key=\{location\.pathname\+location\.search\}/,'Guided route must remount per route identity')
assert.match(app,/Remediation key=\{location\.pathname\+location\.search\}/,'Remediation route must remount per route identity')
assert.match(app,/Reinforcement key=\{location\.pathname\+location\.search\}/,'Reinforcement route must remount per route identity')

assert.match(home,/inProgressRemediations/,'Home must inspect persisted remediation progress')
assert.match(home,/類題 \{preferredRemediation\?\.streak\}\/4 の続きから/,'Home must show direct remediation resume CTA')
assert.match(home,/今日の予定分は完了しました/,'Today completion wording must not imply all learning is finished while remediation continues')

assert.match(report,/未解決・学習中の得点回収候補/,'Unresolved recovery candidates must be labeled accurately')
assert.match(report,/克服済み・定着確認候補/,'Consolidated candidates must be separated')
assert.match(report,/任意演習 参考スコア/,'2019-2021 optional full-year scores must display as reference')

assert.match(data,/大きい図形と小さい図形の相似比が3:2/,'Similarity prompt must define ratio order')
assert.match(data,/'2024-Q1-5'[\s\S]*正方形ABCDの辺BCを1辺として、正方形の内側に正三角形BCE/,'2024-Q1-5 must keep square/equilateral visual-reading skill')
assert.doesNotMatch(remedy,/RemediationFigure/,'Remediation must keep experimental geometry figures hidden')

assert.match(home,/item\.streak>0\|\|item\.attemptCount>0/,'Started remediation at 0/4 after a wrong attempt must remain resumable from Home')
assert.match(data,/正方形ABCDの辺BCを1辺として、正方形の内側に正三角形BCEを作ります。∠ABEを求めなさい。',answer:'30'/,'2024-Q1-5 variant 1 must place the equilateral triangle inside the square for the 30 degree answer')
assert.match(data,/正方形ABCDの辺BCを1辺として、正方形の内側に正三角形BCEを作り、対角線BDを引きます。∠DBEを求めなさい。',answer:'15'/,'2024-Q1-5 variant 3 must place the equilateral triangle inside the square for the 15 degree answer')
assert.match(version,/APP_VERSION='0\.17\.11'/,'Version must be 0.17.10')

console.log('PASS: v0.17.11 browser-reported bugfix guards (01-08 + remediation figures hidden)')
