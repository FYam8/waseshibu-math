import assert from 'node:assert/strict'
import fs from 'node:fs'

const questions=JSON.parse(fs.readFileSync('src/data/questions.json','utf8')).questions
const reviewSource=fs.readFileSync('src/components/ExamMarkReview.tsx','utf8')
const papersSource=fs.readFileSync('src/pages/PastPapers.tsx','utf8')
const homeSource=fs.readFileSync('src/pages/Home.tsx','utf8')
const strategySource=fs.readFileSync('src/targetStrategy.ts','utf8')

const q1For=year=>questions.find(question=>question.year===year&&question.major===1)

for(const year of [2020,2021,2022,2023,2024,2025,2026]){
  const q1=q1For(year)
  assert.ok(q1,`S5-Q1-001: ${year}年度の大問1がない`)
  assert.equal(q1.subquestions.length,8,`S5-Q1-001: ${year}年度の大問1が8問ではない`)
  assert.deepEqual(q1.subquestions.map(item=>item.no),['1','2','3','4','5','6','7','8'],`S5-Q1-001: ${year}年度の小問番号が不連続`)
}

const q1_2019=q1For(2019)
assert.ok(q1_2019,'S5-Q1-002: 2019年度の大問1がない')
assert.equal(q1_2019.subquestions.length,9,'S5-Q1-002: 構成が異なる2019年度を8問に丸めている')
assert.match(papersSource,/q\.major===1\?\(year===2019\?45:40\)/,'S5-Q1-002: 2019年度大問1の45点境界がない')

assert.doesNotMatch(reviewSource,/<select|setCauseMap/,'原因を自己申告する操作を復活させない')
assert.match(reviewSource,/誤答だけで原因を決めつけません/,'推定の限界を示す')

assert.match(papersSource,/mistakeTag:cause\|\|undefined/,'S5-Q1-006: 小問別の失点原因を保存していない')
assert.match(papersSource,/seconds:questionSeconds\[x\.key\]/,'S5-Q1-006: 小問別時間を保存していない')
assert.match(papersSource,/item\.status==='unanswered'\?'未回答':'不正解'/,'S5-Q1-007: 未回答と不正解を結果で区別していない')
assert.match(homeSource,/x\.major===1&&x\.status!=='correct'&&gradeInTarget/,'S5-Q1-008: 大問1の目標範囲内失点を数えていない')
assert.match(strategySource,/\(item\.major===1\?-1:0\)/,'S5-Q1-008: 回収候補で大問1を優先していない')
assert.match(strategySource,/easyCauses\.has\(item\.cause\|\|''\)\?-1:0/,'S5-Q1-008: 本来取れた原因を回収候補で優先していない')
assert.match(strategySource,/得点だけの記録では回収問題を特定できません/,'S5-Q1-009: 得点内訳なしに回収可能な問題を断定している')
assert.match(papersSource,/表示点は優先問題の配点合計から出した条件付き上限/,'S5-Q1-010: 回収点を公式配点・保証値のように表示している')

console.log('PASS: S5-Q1-001..010 大問1の8問構成、2019境界、自己申告操作の廃止、小問時間、回収候補の根拠を検証')
