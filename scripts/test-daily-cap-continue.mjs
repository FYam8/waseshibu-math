import fs from 'node:fs'
import path from 'node:path'
const root=process.cwd(), read=p=>fs.readFileSync(path.join(root,p),'utf8')
const daily=read('src/dailyPlan.ts'), home=read('src/pages/Home.tsx'), eta=read('src/targetEta.ts')
const fail=m=>{throw new Error(m)}
for(const token of ['slice(0,10)','limit:10','buildOptionalNextTask','completedIds','pendingIds'])if(!daily.includes(token))fail(`daily cap missing: ${token}`)
for(const token of ['TODAY · MAX 10 TASKS','最大10件','時間があれば','ここで終えても大丈夫です','時間があれば次の1件へ'])if(!home.includes(token))fail(`home continuation UX missing: ${token}`)
if(!eta.includes('DEFAULT_DAILY_TASK_CAPACITY=10'))fail('ETA capacity must match daily cap 10')
console.log('PASS: 1日最大10課題・必須完了後の任意継続・ETA容量一致')
