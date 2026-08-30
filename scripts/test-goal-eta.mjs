import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd(),read=p=>fs.readFileSync(path.join(root,p),'utf8')
const home=read('src/pages/Home.tsx'),eta=read('src/targetEta.ts'),css=read('src/homeRoute.css')
const fail=msg=>{throw new Error(msg)}

if(!home.includes('buildGoalDayEstimates'))fail('Home does not build goal day estimates')
for(const label of ['学習目標ごとの推定残り日数','約${estimate.days}日','現在の学習履歴','1日最大10課題'])if(!home.includes(label))fail(`Home missing: ${label}`)
for(const token of ["[60,70,75] as TargetScore[]","gradeInTarget(target,q.grade)","Math.ceil(remainingUnits/cap)","DEFAULT_DAILY_TASK_CAPACITY=10","attemptIsNewer","return 2"])if(!eta.includes(token))fail(`ETA logic missing: ${token}`)
if(!css.includes('.goal-eta')||!css.includes('@media(max-width:620px)'))fail('responsive ETA cards missing')
console.log('PASS: A60/B70/C75 推定残り日数・最大10課題/日・レスポンシブ表示')
