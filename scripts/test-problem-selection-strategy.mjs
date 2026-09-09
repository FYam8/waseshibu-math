import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-selection-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',['src/targetStrategy.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`targetStrategy.ts をテスト用にコンパイルできません\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),strategy=require(path.join(temp,'targetStrategy.js'))
const yearsSource=fs.readFileSync('src/pages/Years.tsx','utf8')
const papersSource=fs.readFileSync('src/pages/PastPapers.tsx','utf8')

const labels=['firstRound','defer','returnLast','discard']
for(const target of [60,70,75]){
  const plan=strategy.selectionPlan(target)
  assert.deepEqual(Object.keys(plan),labels,`S6-SELECT-001: ${target}点方針が4区分ではない`)
  assert.ok(labels.every(label=>plan[label].length>=15),`S6-SELECT-001: ${target}点方針の説明が不足`)
  assert.equal(strategy.targetProfile(target).timePlan.reduce((sum,item)=>sum+item.percent,0),100,`S6-SELECT-002: ${target}点の時間配分が100%ではない`)
}

assert.match(strategy.selectionPlan(60).firstRound,/問題ランクA/,'S6-SELECT-003: 60点の1周目がA問題優先ではない')
assert.match(strategy.selectionPlan(60).discard,/問題ランクC/,'S6-SELECT-003: 60点でC問題を捨て候補にしていない')
assert.match(strategy.selectionPlan(70).defer,/問題ランクB/,'S6-SELECT-004: 70点でB問題を後回し判断できない')
assert.match(strategy.selectionPlan(70).discard,/問題ランクC/,'S6-SELECT-004: 70点でC問題を捨て候補にしていない')
assert.match(strategy.selectionPlan(75).firstRound,/問題ランクA・B/,'S6-SELECT-005: 75点でもA・Bを先に回収していない')
assert.match(strategy.selectionPlan(75).defer,/問題ランクC/,'S6-SELECT-005: 75点のC問題を後回しにしていない')
assert.match(strategy.selectionPlan(75).discard,/方針が立たないC問題/,'S6-SELECT-005: 75点でC問題を無条件に深追いさせる')

assert.deepEqual(['A','B','C'].filter(grade=>strategy.gradeInTarget(60,grade)),['A'],'S6-SELECT-006: 60点範囲がAのみではない')
assert.deepEqual(['A','B','C'].filter(grade=>strategy.gradeInTarget(70,grade)),['A','B'],'S6-SELECT-006: 70点範囲がA・Bではない')
assert.deepEqual(['A','B','C'].filter(grade=>strategy.gradeInTarget(75,grade)),['A','B','C'],'S6-SELECT-006: 75点範囲がA・B・Cではない')

for(const label of ['1周目で解く','後回し','最後に戻る','現時点では捨ててもよい'])assert.match(yearsSource,new RegExp(label),`S6-SELECT-007: UIに「${label}」がない`)
assert.match(yearsSource,/学習目標のA\/B\/C（60\/70\/75点）と、各小問の問題ランクA\/B\/Cは別/,'S6-SELECT-008: 得点目標と問題ランクを混同させる')
assert.match(papersSource,/seconds:questionSeconds\[x\.key\]/,'S6-SELECT-009: 小問別の入力欄フォーカス時間を保存していない')
assert.doesNotMatch(yearsSource,/C問題に使った時間/,'S6-SELECT-010: 不完全なフォーカス時間をC問題の総時間として表示している')

console.log('PASS: S6-SELECT-001..010 目標別4区分、A/B/C範囲、時間配分100%、表示上の区別を検証')
console.log('HOLD: C問題の総時間・未着手A問題の比較は、問題閲覧時間を正確に取得する計測仕様が必要')
