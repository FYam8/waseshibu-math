import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'

const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-year-scope-'))
const emptyTypes=path.join(temp,'types');fs.mkdirSync(emptyTypes)
const built=spawnSync('tsc',['src/data/examConfig.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`examConfig.ts をテスト用にコンパイルできません\n${built.stdout}\n${built.stderr}`)
const require=createRequire(import.meta.url),config=require(path.join(temp,'examConfig.js'))

for(const year of [2019,2020]){
  const note=config.examScopeNote(year)
  assert.match(note,/問題冊子/ ,`S9-SCOPE-001: ${year}年度の根拠が問題冊子だと分からない`)
  assert.match(note,/本試験範囲に三平方の定理は含まれません/,`S9-SCOPE-001: ${year}年度の明示条件が欠落`)
  assert.match(note,/主解法にしません/,`S9-SCOPE-002: ${year}年度で範囲外解法を避ける方針がない`)
}
for(const year of [2021,2022,2023,2024,2025,2026])assert.equal(config.examScopeNote(year),undefined,`S9-SCOPE-003: ${year}年度へ根拠なく条件を拡張している`)

const guidedRaw=JSON.parse(fs.readFileSync('src/data/guidedSolutions.json','utf8'))
const guided=Object.values(guidedRaw.solutions)
const level2=JSON.parse(fs.readFileSync('src/data/level2/level2_master_2019_2026.json','utf8'))
const forbidden=/(三平方の定理|ピタゴラスの定理|Pythagorean theorem)/i
for(const year of [2019,2020]){
  const guidedForYear=guided.filter(item=>item.year===year||item.questionId?.startsWith(`${year}-`))
  const level2ForYear=level2.filter(item=>item.sourceYear===year||item.sourceQuestionId?.startsWith(`${year}-`))
  assert.ok(guidedForYear.length>0,`S9-SCOPE-004: ${year}年度の問題専用解説を特定できない`)
  assert.ok(level2ForYear.length>0,`S9-SCOPE-005: ${year}年度出典の類題を特定できない`)
  assert.ok(guidedForYear.every(item=>!forbidden.test(JSON.stringify(item))),`S9-SCOPE-004: ${year}年度の問題専用解説が範囲外定理を明示使用`)
  assert.ok(level2ForYear.every(item=>!forbidden.test(JSON.stringify(item))),`S9-SCOPE-005: ${year}年度出典の類題が範囲外定理を明示使用`)
}

const uiFiles=['src/pages/PastPapers.tsx','src/pages/GuidedReview.tsx','src/pages/Remediation.tsx','src/pages/Reinforcement.tsx']
for(const file of uiFiles){
  const source=fs.readFileSync(file,'utf8')
  assert.match(source,/examScopeNote/,`S9-SCOPE-006: ${file} が年度条件を参照していない`)
  assert.match(source,/exam-scope-notice/,`S9-SCOPE-007: ${file} が年度条件を画面表示しない`)
}

const oldCompleteness=fs.readFileSync('scripts/test-v0178-completeness.mjs','utf8')
assert.match(oldCompleteness,/scope audit/,'S9-SCOPE-008: 既存の年度範囲回帰が消えている')

console.log('PASS: S9-SCOPE-001..008 2019/2020の明示条件、年度分離、解説・類題・4画面の範囲表示を検証')
console.log('NOTE: 固定合成入力の機能検査であり、AI模擬学習者の転移結果ではありません')
