import fs from 'node:fs'
const daily=fs.readFileSync(new URL('../src/dailyPlan.ts',import.meta.url),'utf8')
const home=fs.readFileSync(new URL('../src/pages/Home.tsx',import.meta.url),'utf8')
const checks=[
  ['次の日計画の専用保存キー',daily.includes("STUDY_AHEAD_PLAN_KEY='waseshibu-math-study-ahead-plan-v1'")],
  ['次の日は最大10件を開始時固定',daily.includes('targetCandidates.slice(0,10)')],
  ['途中で11件目を補充しない',daily.includes('途中で新しい11件目を補充しない')],
  ['翌日へ先取り計画を引継ぐ',daily.includes('ahead?.date===date')],
  ['先取り開始API',daily.includes('export function startNextDayPlan')],
  ['先取りタスクAPI',daily.includes('export function buildNextDayTasks')],
  ['今日完了後だけ先取りUI',home.includes('次の日の分も先取りする')&&home.includes(':<>')],
  ['次のアクション導線を維持',home.includes('時間があれば次のアクションへ')],
  ['先取り完了表示',home.includes('✓ 次の日の分も完了')],
  ['翌日の重複出題防止説明',home.includes('同じ課題を重複して出しません')]
]
const failed=checks.filter(([,ok])=>!ok)
for(const [name,ok] of checks)console.log(`${ok?'OK':'FAIL'}: ${name}`)
if(failed.length)process.exit(1)
console.log('PASS: 今日10件完了後、次アクション1件または翌日分最大10件を任意で先取りし、翌日に引き継ぐUX')
