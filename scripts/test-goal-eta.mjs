import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd(),read=p=>fs.readFileSync(path.join(root,p),'utf8')
const home=read('src/pages/Home.tsx'),eta=read('src/targetEta.ts'),route=read('src/learningRoute.ts'),main=read('src/main.tsx'),storage=read('src/storage.ts'),dataManager=read('src/pages/DataManager.tsx'),paper=read('src/pages/PastPapers.tsx'),remediation=read('src/pages/Remediation.tsx'),css=read('src/homeRoute.css')
const fail=msg=>{throw new Error(msg)}

if(!home.includes('buildGoalDayEstimates'))fail('Home does not build goal day estimates')
for(const label of ['学習目標ごとの残り問題数','残り {estimate.remainingQuestions}問｜1日10問ペース','`あと${estimate.days}日`','別枠の2019〜2021年度追加演習は含みません'])if(!home.includes(label))fail(`Home missing: ${label}`)
for(const token of ['reservedQuestionCount','1+(gradeInTarget(target,grade)?1+reservedPracticeCount(questionId):0)','requiredYearComplete(year,target)','remainingQuestions+=1','Math.ceil(remainingQuestions/cap)','DEFAULT_DAILY_TASK_CAPACITY=10'])if(!eta.includes(token))fail(`ETA logic missing: ${token}`)
for(const token of ['completedCoreByTarget','markRequiredYearComplete','sourcePracticeProgress','requiredYearComplete(year,target)','syncRequiredYearCompletionLocks'])if(!route.includes(token))fail(`route completion guard missing: ${token}`)
const completionBody=route.match(/export function requiredYearComplete[\s\S]*?\n}\n\nexport function syncRequiredYearCompletionLocks/)?.[0]||''
if(!completionBody)fail('requiredYearComplete body not found')
if(completionBody.includes('markRequiredYearComplete('))fail('requiredYearComplete must stay side-effect free during render')
if(!main.includes('syncRequiredYearCompletionLocks()'))fail('legacy completion locks must be persisted before React render')
if(!storage.includes("new CustomEvent('waseshibu-preferences-change')"))fail('target changes must announce a completion-lock resync')
if(!main.includes("addEventListener('waseshibu-preferences-change'"))fail('target-change completion-lock resync listener missing')
if(!dataManager.includes('restoreBackup(localStorage,incoming,mode);syncRequiredYearCompletionLocks()'))fail('import must resync legacy completion locks')
if(!dataManager.includes('await restoreFromPoint(point.id);syncRequiredYearCompletionLocks()'))fail('restore point must resync legacy completion locks')
if(!paper.includes('!targetWrong)markRequiredYearComplete(year,target)'))fail('clean required-year exam must lock completion before an optional retake')
if(!remediation.includes('sourcePracticeProgress(sourceYear,target).complete)markRequiredYearComplete(sourceYear,target)'))fail('final fixed-practice completion must lock the core year before optional repractice')
if(eta.includes('remainingOld.length'))fail('optional old-year reinforcement must not be counted directly in ETA')
if(eta.includes("age>=7*24*60*60*1000"))fail('7-day refresher must not reopen core ETA')
if(!css.includes('.goal-eta')||!css.includes('@media(max-width:620px)'))fail('responsive ETA cards missing')
console.log('PASS: simple monotonic ETA is render-pure, locks before retake/repractice/restore/target-change boundaries, and excludes optional old-year extras')
