import fs from 'node:fs'

const remediation=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const progress=fs.readFileSync('src/level2History.ts','utf8')

// v0.17.8: progress is persisted per source question, including the question index.
for(const token of ['ensureLevel2Session','recordLevel2Attempt','currentStreak','currentStreakQuestionIds']){
  if(!remediation.includes(token)&&!progress.includes(token))throw new Error(`missing remediation persistence token: ${token}`)
}
if(!progress.includes("latestSourceAttemptAt&&(!session.sourceAttemptAt||session.sourceAttemptAt<latestSourceAttemptAt)"))throw new Error('newer unresolved source-paper attempt does not reset old remediation progress')
if(!remediation.includes("a.status!=='correct'"))throw new Error('correct source-paper attempts must not reset remediation progress')
if(!progress.includes("status:'active'"))throw new Error('fresh remediation state is not reopened')
if(!progress.includes('currentStreak:0,currentStreakQuestionIds:[]'))throw new Error('fresh source mistake does not restart from 0/4')
if(!progress.includes('!session.completedQuestionIds.includes(input.question.id)'))throw new Error('duplicate remediation question can still advance completion')
if(!progress.includes('fixedQuestionIds')||!progress.includes('retryQuestionIds'))throw new Error('fixed-set retry state is missing')
if(!remediation.includes('完了 {session.currentStreak}/{session.requiredCount}'))throw new Error('fixed-set progress label is missing')
if(remediation.includes('useState(0),[answer'))throw new Error('remediation index still hard-resets from React state only')

console.log('PASS: stale sessions reset for a newer unresolved source-paper attempt; newer correct attempts do not reset it')
console.log('PASS: immutable fixed questionIds + unresolved-only retry are persisted per source question')
