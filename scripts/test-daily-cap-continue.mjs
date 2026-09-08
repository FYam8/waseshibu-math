import fs from 'node:fs'
import path from 'node:path'
const root=process.cwd(), read=p=>fs.readFileSync(path.join(root,p),'utf8')
const daily=read('src/dailyPlan.ts'), home=read('src/pages/Home.tsx'), eta=read('src/targetEta.ts')
const fail=m=>{throw new Error(m)}
for(const token of ['slice(0,10)','limit:10','buildOptionalNextTask','completedIds','pendingIds'])if(!daily.includes(token))fail(`daily cap missing: ${token}`)
for(const token of ['TODAY · MAX 10 TASKS','最大10件','時間があれば','ここで終えても大丈夫です','時間があれば次のアクションへ'])if(!home.includes(token))fail(`home continuation UX missing: ${token}`)
// The stopping guidance must belong to TODAY completion, not only to the
// optional next-day completion panel or a source-code comment elsewhere.
const completionStart=home.indexOf('<div className="today-complete">')
const completionEnd=home.indexOf('{nextDaySummary.started&&',completionStart)
if(completionStart<0||completionEnd<completionStart)fail('today completion section missing')
const completion=home.slice(completionStart,completionEnd)
if(!/<p>ここで終えても大丈夫です。追加の学習は任意です。<\/p>/.test(completion))fail('today completion must explicitly allow stopping and make extra study optional')

if(!daily.includes('buildLearningQueue')||!daily.includes('targetCandidates.find(task=>!completed.has(task.id))'))fail('optional continuation must use the same learning queue')
if(!home.includes('firstUnresolvedSource')||!home.includes('unresolved?.remainingIds.includes(c.key)'))fail('weakness cards must use the same unresolved source as the learning route')
if(!home.includes('現在の未解決元問題はありません')||!home.includes('次のアクションへ'))fail('cleared source mistakes must point to the current next action')

if(!eta.includes('DEFAULT_DAILY_TASK_CAPACITY=10'))fail('ETA capacity must match daily cap 10')
console.log('PASS: 1日最大10課題・完了後は学習サイクルの次アクションへ・弱点表示整合・ETA容量一致')
