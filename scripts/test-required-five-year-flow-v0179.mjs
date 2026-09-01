import fs from 'node:fs'
import assert from 'node:assert/strict'

const route=fs.readFileSync('src/learningRoute.ts','utf8')
const eta=fs.readFileSync('src/targetEta.ts','utf8')
const home=fs.readFileSync('src/pages/Home.tsx','utf8')
const years=fs.readFileSync('src/pages/Years.tsx','utf8')
const report=fs.readFileSync('src/pages/Report.tsx','utf8')
const layout=fs.readFileSync('src/components/Layout.tsx','utf8')
const past=fs.readFileSync('src/pages/PastPapers.tsx','utf8')
const reinforce=fs.readFileSync('src/pages/Reinforcement.tsx','utf8')

assert.ok(route.includes('REQUIRED_MAIN_YEAR_SEQUENCE=[2024,2023,2022,2025,2026]'),'required five-year sequence drift')
for(const [year,purpose] of [[2024,'診断'],[2023,'改善確認①'],[2022,'改善確認②'],[2025,'実戦確認'],[2026,'最終確認']]){
  assert.ok(route.includes(`year===${year}`)&&route.includes(`'${purpose}'`),`${year} purpose missing`)
}
assert.ok(route.includes('filter(q=>q.year>=2019&&q.year<=2021)'),'old reinforcement pool must be 2019-2021 only')
assert.ok(route.includes("if(year>=2020&&year<=2021)return 'reinforcement-pool'"),'2022/2023 must no longer be reinforcement-pool years')
assert.ok(route.includes('return year>=2022&&year<=2026'),'main-check years must be 2022-2026')
assert.ok(route.includes('for(const year of REQUIRED_MAIN_YEAR_SEQUENCE)'), 'next action must iterate canonical sequence')
assert.ok(route.includes('if(!exam)')&&route.includes('sourceMistakeProgress(year,target)')&&route.includes('reinforcementComplete(year,target)'),'each required year must gate on exam + source repair + reinforcement')
assert.ok(route.includes('Number(year)>=2019&&Number(year)<=2021'),'optional draft range must be 2019-2021')
assert.ok(route.includes('const [year,draft]=entry,isOptional=Number(year)>=2019&&Number(year)<=2021'),'draft purpose must not classify required 2022/2023 as optional')
assert.ok(!route.includes('isOptional=Number(year)<=2023'),'required 2022/2023 drafts must never be labeled optional')
assert.ok(eta.includes('for(const year of REQUIRED_MAIN_YEAR_SEQUENCE)'),'ETA must include all required full years')
assert.ok(eta.includes('for(const sourceYear of REQUIRED_MAIN_YEAR_SEQUENCE)'),'ETA must include reinforcement for all required years')
assert.ok(home.includes('2023年度で改善確認①')&&home.includes('2022年度で改善確認②')&&home.includes('2025年度で実戦確認')&&home.includes('2026年度で最終確認'),'Home phase labels drift')
assert.ok(years.includes('必須学習用の2022〜2026年度5年分'),'Years page must explain five-year requirement')
assert.ok(report.includes('2022〜2026年度は必須5年度の学習サイクル'),'Report must treat 2022/2023 as core')
assert.ok(layout.includes('nextLearningAction().to'),'global 学ぶ link must use canonical route')
assert.ok(past.includes('nextRequiredStageYear()')&&past.includes('requestedStage>activeStage'),'opening a later required year must warn')
assert.ok(reinforce.includes('2019〜2021'),'reinforcement UI must preserve 2022/2023 first-look value')
assert.ok(reinforce.includes('rawSource>=2022&&rawSource<=2026?rawSource:2024'),'reinforcement source router must accept required 2022/2023 years')
const guided=fs.readFileSync('src/pages/GuidedReview.tsx','utf8')
assert.ok(guided.includes('q.year>=2022&&q.year<=2026'),'Guided remediation back-link must preserve 2022/2023 source context')
assert.ok(!reinforce.includes('2019〜2023'),'reinforcement UI still exposes 2022/2023 as old pool')

console.log('PASS: v0.17.9 required five-year learning route')
console.log('2024診断 → 2023改善① → 2022改善② → 2025実戦 → 2026最終, with per-year repair/reinforcement gates')
