import fs from 'node:fs'
const route=fs.readFileSync('src/learningRoute.ts','utf8')
const home=fs.readFileSync('src/pages/Home.tsx','utf8')
const reinforce=fs.readFileSync('src/pages/Reinforcement.tsx','utf8')
const past=fs.readFileSync('src/pages/PastPapers.tsx','utf8')
const types=fs.readFileSync('src/types.ts','utf8')
const checks=[
 ['2019 different structure',route.includes("if(year===2019)return 'different-structure'")],
 ['2020-23 reinforcement pool',route.includes("year>=2020&&year<=2023")],
 ['old draft optional',route.includes('optionalOldYearDraftAction')&&home.includes('中断中の任意演習')],
 ['core draft 2024+',route.includes('coreResumeDraftAction')&&home.includes('coreResumeDraftAction')],
 ['cycle wording',home.includes('診断 → 元問題修正 → 類題・旧年度補強 → 改善確認 → 再補強 → 仕上がり確認')],
 ['selective old-year note',home.includes('2019〜2023年度は必要な小問だけを弱点補強に使います')],
 ['2019 UI label',reinforce.includes('構成が異なる年度')],
 ['reinforcement purpose',reinforce.includes('年度の「{fieldName}」補強')],
 ['score validity type',types.includes("scoreValidity?: 'first-look' | 'reference'")],
 ['score validity save',past.includes("scoreValidity:!prior&&firstLookEligible?'first-look':'reference'")],
 ['reference score UI',past.includes("?'参考スコア':'初見スコア'")],
 ['untouched checkpoint priority',route.includes("const untouched=remaining.find(year=>yearExposureState(year)==='untouched')")],
 ['optional old attempts stay out of required queue',fs.readFileSync('src/dailyPlan.ts','utf8').includes('!isMainCheckYear(meta.year)')],
 ['reservation separated from completion',route.includes("OldQuestionAssignmentState='none'|'reserved'|'completed'|'exposed'")],
 ['home current score ignores old-year optional exams',home.includes('const latest=latestMainCheckExam()')],
]
const failed=checks.filter(([,ok])=>!ok)
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'}: ${name}`)
if(failed.length)process.exit(1)
console.log('PASS: year role / exposure / optional old-year flow')
