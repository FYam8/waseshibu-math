import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-score-plan-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',['src/targetStrategy.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--resolveJsonModule','--esModuleInterop','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`targetStrategy.ts をテスト用にコンパイルできません\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),strategy=require(path.join(temp,'targetStrategy.js'))
const reportSource=fs.readFileSync('src/pages/Report.tsx','utf8')
const papersSource=fs.readFileSync('src/pages/PastPapers.tsx','utf8')

const item=(key,major,subNo,grade,status,cause)=>({key,major,subNo:String(subNo),topic:`検査${key}`,grade,status,points:5,cause})
const score60Items=[
  item('2024-Q1-1',1,1,'A','wrong','計算ミス'),
  item('2024-Q1-2',1,2,'A','wrong','符号ミス'),
  item('2024-Q1-3',1,3,'A','wrong','答え方の不備'),
  item('2024-Q2-2',2,2,'B','wrong','解法未習得'),
  item('2024-Q3-2',3,2,'B','unanswered','時間不足'),
  item('2024-Q4-2',4,2,'B','wrong','条件読み落とし'),
  item('2024-Q5-2',5,2,'C','wrong','現時点では難しい')
]
const plan=strategy.buildTargetStrategy(70,60,score60Items)

assert.equal(plan.candidates.length,3,'S8-PLAN-001: 次に確認する3問が作られない')
assert.ok(plan.candidates.every(candidate=>candidate.label.startsWith('大問1')),'S8-PLAN-001: 回収しやすい大問1より他大問を優先している')
assert.deepEqual(plan.candidates.map(candidate=>candidate.points),[5,5,5],'S8-PLAN-002: 優先3問の配点が不正確')
assert.equal(plan.projectedScore,75,'S8-PLAN-002: 60点+優先3問の条件付き上限が75点ではない')
assert.ok(plan.candidates.every(candidate=>candidate.grade!=='C'),'S8-PLAN-003: 70点目標で大問5のC問題を優先している')
assert.match(plan.summary,/すべて正解した場合/,'S8-PLAN-004: 条件付き上限を回収確定のように説明している')
assert.doesNotMatch(plan.summary,/届く見込み|回収可能です|回収できます/,'S8-PLAN-004: 未確認の回収可能性を断定している')

const scoreOnly=strategy.buildTargetStrategy(70,60,[])
assert.equal(scoreOnly.candidates.length,0,'S8-PLAN-005: 得点だけから具体的な回収候補を生成している')
assert.match(scoreOnly.summary,/得点だけの記録では回収問題を特定できません/,'S8-PLAN-005: 得点内訳だけでは回収可能点を断定できない説明がない')

const onlyHard=strategy.buildTargetStrategy(70,60,[item('2024-Q5-3',5,3,'C','wrong','現時点では難しい')])
assert.equal(onlyHard.candidates.length,0,'S8-PLAN-006: 大問5の低得点だけでC問題を優先している')

for(const source of [reportSource,papersSource]){
  assert.match(source,/優先\$\{[^}]+\.candidates\.length\}問をすべて正解した場合 約\$\{[^}]+\.projectedScore\}点/,'S8-PLAN-007: 条件付き上限のラベルがない')
  assert.match(source,/すでに回収可能と確認された点ではありません/,'S8-PLAN-007: 回収可能点の未確認表示がない')
  assert.match(source,/1〜2週間後にも未見の別年度または異設定問題を補助なしで再測定/,'S8-PLAN-008: 1〜2週間後の別問題による再測定がない')
  assert.doesNotMatch(source,/回収目安 約/,'S8-PLAN-007: 未確認点を回収目安と表示している')
}
assert.match(reportSource,/次に確認する3問（未解決・学習中）/,'S8-PLAN-009: レポートに次の3問が明示されない')
assert.match(papersSource,/>次に確認する3問</,'S8-PLAN-009: 採点結果に次の3問が明示されない')

console.log('PASS: S8-PLAN-001..009 大問1優先、C問題後回し、次の3問、条件付き上限、1〜2週間後の無支援再測定を検証')
console.log('HOLD: 原因別の回収可能性判定と4区分（実力点・本来取れた点・難しい点・追加点）の自動算出は学習設計変更が必要')
