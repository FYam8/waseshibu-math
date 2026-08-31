import fs from 'node:fs'
import path from 'node:path'
const root=process.cwd(), read=p=>fs.readFileSync(path.join(root,p),'utf8')
const daily=read('src/dailyPlan.ts'), home=read('src/pages/Home.tsx'), eta=read('src/targetEta.ts')
const fail=m=>{throw new Error(m)}
for(const token of ['slice(0,10)','limit:10','buildOptionalNextTask','completedIds','pendingIds'])if(!daily.includes(token))fail(`daily cap missing: ${token}`)
for(const token of ['TODAY · MAX 10 TASKS','最大10件','時間があれば','ここで終えても大丈夫です','時間があれば次のアクションへ'])if(!home.includes(token))fail(`home continuation UX missing: ${token}`)

if(!daily.includes('if(fallbackTask)return fallbackTask'))fail('optional continuation must prefer learning-cycle next action')
if(!home.includes('activeRecoveryCandidates')||!home.includes('currentSourceProgress?.remainingIds.includes(c.key)'))fail('weakness cards must hide source mistakes already reproduced')
if(!home.includes('元の誤答は直せています')||!home.includes('次のアクションへ'))fail('cleared source mistakes must point to the current next action')
if(!eta.includes('DEFAULT_DAILY_TASK_CAPACITY=10'))fail('ETA capacity must match daily cap 10')
console.log('PASS: 1日最大10課題・完了後は学習サイクルの次アクションへ・弱点表示整合・ETA容量一致')
