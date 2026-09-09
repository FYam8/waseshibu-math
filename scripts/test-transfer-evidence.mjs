import assert from 'node:assert/strict'
import fs from 'node:fs'

const ui=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const core=JSON.parse(fs.readFileSync('src/data/level2/level2_master_2019_2026.json','utf8'))

assert.match(ui,/このセットは解法の再現・同型練習の確認用です/,'S7-TRANSFER-001: 固定類題の目的を同型練習として明示する')
assert.match(ui,/数字だけを変えた問題の正解を「転移できた」とは判定しません/,'S7-TRANSFER-002: 数値変更だけで転移認定しない')
assert.match(ui,/異なる設定への転移は、次の未見問題を補助なしで解いて別に確認します/,'S7-TRANSFER-003: 転移は未見・補助なしで別測定する')
assert.doesNotMatch(ui,/固定セット完了(?:で|により).*転移できた/,'S7-TRANSFER-004: 固定セット完了を転移成功と表示しない')

const active=core.filter(q=>q.status==='final'&&q.selectable!==false)
assert.equal(active.length,100,'S7-TRANSFER-005: 現行Level2母集団を欠落なく監査する')
assert.equal(active.every(q=>typeof q.sourceQuestionId==='string'&&q.sourceQuestionId.length>0),true,'S7-TRANSFER-006: 類題と出典小問の対応を追跡できる')
assert.equal(new Set(active.map(q=>`${q.context||''}\n${q.prompt}`)).size,active.length,'S7-TRANSFER-007: 出題文の完全重複を許可しない')

console.log('PASS: S7-TRANSFER-001..007 — fixed-set completion is separated from unseen transfer evidence')
console.log('Synthetic feature checks only: not an isolated AI learner comparison or human learning outcome.')
