import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd(),read=p=>fs.readFileSync(path.join(root,p),'utf8')
const home=read('src/pages/Home.tsx'),eta=read('src/targetEta.ts'),route=read('src/learningRoute.ts'),css=read('src/homeRoute.css')
const fail=msg=>{throw new Error(msg)}

if(!home.includes('buildGoalDayEstimates'))fail('Home does not build goal day estimates')
for(const label of ['学習目標ごとの残り問題数','残り {estimate.remainingQuestions}問｜1日10問ペース','`あと${estimate.days}日`','別枠の2019〜2021年度追加演習は含みません'])if(!home.includes(label))fail(`Home missing: ${label}`)
for(const token of ['reservedQuestionCount','1+(gradeInTarget(target,grade)?1+reservedPracticeCount(questionId):0)','isRequiredYearLocked(year,target)','remainingQuestions+=1','Math.ceil(remainingQuestions/cap)','DEFAULT_DAILY_TASK_CAPACITY=10'])if(!eta.includes(token))fail(`ETA logic missing: ${token}`)
for(const token of ['completedCoreByTarget','markRequiredYearComplete','sourcePracticeProgress','元問題修正・固定類題'])if(!route.includes(token))fail(`route completion guard missing: ${token}`)
if(eta.includes('remainingOld.length'))fail('optional old-year reinforcement must not be counted directly in ETA')
if(eta.includes("age>=7*24*60*60*1000"))fail('7-day refresher must not reopen core ETA')
if(!css.includes('.goal-eta')||!css.includes('@media(max-width:620px)'))fail('responsive ETA cards missing')
console.log('PASS: simple monotonic ETA = remaining questions / 10; reserved repair+fixed practice; optional old-year extras excluded')
