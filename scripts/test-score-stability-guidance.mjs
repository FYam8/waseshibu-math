import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const root=process.cwd()
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-s11-'))
const emptyTypes=fs.mkdtempSync(path.join(os.tmpdir(),'waseshibu-s11-types-'))
const tsc=path.join(root,'node_modules','typescript','bin','tsc')
const built=spawnSync(tsc,['src/scoreGuidance.ts','--outDir',temp,'--module','commonjs','--target','ES2022','--lib','ES2022,DOM','--typeRoots',emptyTypes,'--skipLibCheck','--strict'],{cwd:root,encoding:'utf8'})
if(built.status!==0)throw new Error(`scoreGuidance.ts をテスト用にコンパイルできません\n${built.stdout}\n${built.stderr}`)

const require=createRequire(import.meta.url)
const { assessScoreStability }=require(path.join(temp,'scoreGuidance.js'))
const score=(id,year,value,at,extra={})=>({id,year,score:value,at,...extra})
const exact=[
  score('a',2022,73,'2026-09-01T00:00:00.000Z'),
  score('b',2023,74,'2026-09-02T00:00:00.000Z'),
  score('c',2024,72,'2026-09-03T00:00:00.000Z'),
  score('d',2025,75,'2026-09-04T00:00:00.000Z')
]
const result=assessScoreStability(exact)

assert.equal(result.kind,'seventy-to-seventy-five','S11-GOAL-001: 73/74/72/75を70〜75点帯として扱わない')
assert.deepEqual(result.scores,[73,74,72,75],'S11-GOAL-002: 直近4回を古い順に表示できない')
assert.equal(result.low,72,'S11-GOAL-003: 最低点が違う')
assert.equal(result.high,75,'S11-GOAL-003: 最高点が違う')
assert.equal(result.spread,3,'S11-GOAL-003: 得点幅が違う')
assert.match(result.stretchGoalNote,/90点/,'S11-GOAL-004: 90点要求時の注意がない')
assert.match(result.stretchGoalNote,/難問を増やす前/,'S11-GOAL-004: 難問を無条件に薦める')
assert.ok(result.checks.some(x=>x.includes('安定性')),'S11-GOAL-005: 安定性確認がない')
assert.ok(result.checks.some(x=>x.includes('大問1')),'S11-GOAL-006: 大問1確認がない')
assert.ok(result.checks.some(x=>x.includes('時間配分')),'S11-GOAL-007: 時間配分確認がない')
assert.ok(result.checks.some(x=>x.includes('本番再現')),'S11-GOAL-008: 本番再現確認がない')
assert.ok(result.checks.some(x=>x.includes('国語・英語')),'S11-GOAL-009: 3教科配分確認がない')
assert.match(result.dataLimitNote,/得点履歴だけでは判定できません/,'S11-GOAL-010: 得点だけで詳細を断定する')

const insufficient=assessScoreStability(exact.slice(0,3))
assert.equal(insufficient.kind,'insufficient','S11-GOAL-011: 3回だけで安定と断定する')
const outlier=assessScoreStability([...exact.slice(0,3),score('x',2025,65,'2026-09-04T00:00:00.000Z')])
assert.equal(outlier.kind,'other','S11-GOAL-012: 65点を含む履歴を70〜75点帯と断定する')
const ignored=assessScoreStability([
  ...exact,
  score('old',2021,100,'2026-09-06T00:00:00.000Z'),
  score('incomplete',2026,10,'2026-09-05T00:00:00.000Z',{completed:false})
])
assert.deepEqual(ignored.scores,[73,74,72,75],'S11-GOAL-013: 任意旧年度または未完了記録が主確認4回へ混入する')

const report=fs.readFileSync('src/pages/Report.tsx','utf8')
const storage=fs.readFileSync('src/storage.ts','utf8')
assert.match(report,/assessScoreStability\(examScores\)/,'S11-GOAL-014: 得点履歴から安定性表示を作っていない')
assert.match(report,/score-stability-guidance/,'S11-GOAL-015: レポートに安定性確認欄がない')
assert.match(storage,/target:\s*60\s*\|\s*70\s*\|\s*75/,'S11-GOAL-016: 90点を既存の主目標へ無条件追加している')

console.log('PASS: S11-GOAL-001..016 直近4回、安定性、大問1、時間、本番再現、国英配分、90点要求の境界を検証')
