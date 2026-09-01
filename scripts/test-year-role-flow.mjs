import fs from 'node:fs'
const route=fs.readFileSync('src/learningRoute.ts','utf8')
const home=fs.readFileSync('src/pages/Home.tsx','utf8')
const reinforce=fs.readFileSync('src/pages/Reinforcement.tsx','utf8')
const past=fs.readFileSync('src/pages/PastPapers.tsx','utf8')
const types=fs.readFileSync('src/types.ts','utf8')
const eta=fs.readFileSync('src/targetEta.ts','utf8')
const checks=[
 ['2019 different structure',route.includes("if(year===2019)return 'different-structure'")],
 ['2020-21 reinforcement pool',route.includes("year>=2020&&year<=2021")],
 ['2022-26 main-check',route.includes('return year>=2022&&year<=2026')],
 ['required five-year order',route.includes('REQUIRED_MAIN_YEAR_SEQUENCE=[2024,2023,2022,2025,2026]')],
 ['old draft optional',route.includes('optionalOldYearDraftAction')&&home.includes('中断中の任意演習')],
 ['core draft required years',route.includes('REQUIRED_MAIN_YEAR_SEQUENCE.includes(Number(year) as RequiredMainYear)')&&home.includes('nextLearningAction')],
 ['cycle wording',home.includes('2024診断 → 2023改善確認① → 2022改善確認② → 2025実戦確認 → 2026最終確認')],
 ['selective old-year note',home.includes('2019〜2021年度は必要な小問だけを弱点補強に使います')],
 ['2019 UI label',reinforce.includes('構成が異なる年度')],
 ['reinforcement purpose',reinforce.includes('年度の「{fieldName}」補強')],
 ['score validity type',types.includes("scoreValidity?: 'first-look' | 'reference'")],
 ['score validity save',past.includes("scoreValidity:!prior&&firstLookEligible?'first-look':'reference'")],
 ['reference score UI',past.includes("?'参考スコア':'初見スコア'")],
 ['later-year warning',past.includes('nextRequiredStageYear()')&&past.includes('requestedStage>activeStage')],
 ['optional old attempts stay out of required queue',fs.readFileSync('src/dailyPlan.ts','utf8').includes('!isMainCheckYear(meta.year)')],
 ['reservation separated from completion',route.includes("OldQuestionAssignmentState='none'|'reserved'|'completed'|'exposed'")],
 ['home current score uses 2022-26 main years',route.includes('x.year>=2022&&x.year<=2026')],
 ['eta covers required five',eta.includes('for(const year of REQUIRED_MAIN_YEAR_SEQUENCE)')],
]
const failed=checks.filter(([,ok])=>!ok)
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'}: ${name}`)
if(failed.length)process.exit(1)
console.log('PASS: year role / required five-year / exposure / optional old-year flow')
