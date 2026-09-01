import fs from 'node:fs'
import {spawnSync} from 'node:child_process'

const run=name=>{
  const r=spawnSync('npm',['run',name],{encoding:'utf8',stdio:'pipe'})
  if(r.status!==0)throw new Error(`${name} failed\n${r.stdout}\n${r.stderr}`)
}
for(const name of [
  'test:remediation-progress','test:guided-validation','test:v0178-state',
  'test:today','test:user-perspective','test:user-perspective:v0176',
  'test:migration','test:mastery','audit:core-skill'
]) run(name)

const remediation=fs.readFileSync('src/data/remediation.ts','utf8')
const remediationPage=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const daily=fs.readFileSync('src/dailyPlan.ts','utf8')
const past=fs.readFileSync('src/pages/PastPapers.tsx','utf8')
const guided=fs.readFileSync('src/guidedReview.ts','utf8')
const home=fs.readFileSync('src/pages/Home.tsx','utf8')
const report=fs.readFileSync('src/pages/Report.tsx','utf8')

const q12=remediation.slice(remediation.indexOf("'2024-Q1-2': {"),remediation.indexOf("'2024-Q1-3': {"))
if((q12.match(/prompt:/g)||[]).length!==4)throw new Error('13: 2024-Q1-2 must have four variants')
if(!q12.includes('三角柱')||!q12.includes('表面積'))throw new Error('13: triangular-prism surface-area bank drifted')
if(/体積を求め/.test(q12))throw new Error('13: volume task leaked into triangular-prism surface-area bank')

if(!daily.includes('const REQUIRED_DAILY_LIMIT=10') && !daily.includes('limit:10'))throw new Error('15: daily cap 10 missing')
if(!daily.includes("kind:'review'")||!daily.includes("kind:'practice'"))throw new Error('15: question-unit task kinds missing')
if(!daily.includes("if(!meta||!isMainCheckYear(meta.year)"))throw new Error('16: old/full-year work can leak into required daily queue')
if(!daily.includes('/guided-review?q=') && !daily.includes('/remediation?'))throw new Error('17: question-specific destination missing')

if(!report.includes('latestMainCheckExam') && !home.includes('latestMainCheckExam'))throw new Error('18: optional old-year scores can overwrite current main score')
if(!past.includes("if(phase!=='solve'||(needsWarning&&!warningAccepted))return"))throw new Error('19: warning-only exposure guard missing')
if(!guided.includes('finalAnswerSeen'))throw new Error('20: answer-seen state missing')
if(!guided.includes("'consolidated'"))throw new Error('20: mastery gate missing')
if(!remediationPage.includes("a.status!=='correct'"))throw new Error('6: remediation reset must be driven only by a newer unresolved source attempt')

console.log('PASS: v0.17.8 required regression set 1-20 is covered by runtime tests + focused source guards')
console.log('1-6 remediation persistence/distinct streak/reset; 7-8 Guided validation; 9-12 route/optional/ETA; 13-14 core-skill; 15-17 daily question units/routes; 18-20 score/exposure/mastery guards')
