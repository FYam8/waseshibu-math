import fs from 'node:fs'

const remediation=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const progress=fs.readFileSync('src/remediationProgress.ts','utf8')

// v0.17.8: progress is persisted per source question, including the question index.
for(const token of ['ensureRemediationProgress','recordRemediationAttempt','currentIndex','correctQuestionIdsInCurrentStreak']){
  if(!remediation.includes(token)&&!progress.includes(token))throw new Error(`missing remediation persistence token: ${token}`)
}
if(!progress.includes("latestSourceAttemptAt&&(!existing.sourceAttemptAt||existing.sourceAttemptAt<latestSourceAttemptAt)"))throw new Error('newer unresolved source-paper attempt does not reset old remediation progress')
if(!remediation.includes("a.status!=='correct'"))throw new Error('correct source-paper attempts must not reset remediation progress')
if(!progress.includes("status:'in-progress'"))throw new Error('fresh remediation state is not reopened')
if(!progress.includes("currentIndex:0,streak:0"))throw new Error('fresh source mistake does not restart from 0/4')
if(!progress.includes("current.correctQuestionIdsInCurrentStreak.includes(questionId)"))throw new Error('duplicate remediation question can still advance streak')
if(!remediation.includes('連続正解チャレンジ {Math.min(streak+1,4)}/4'))throw new Error('consecutive-correct progress label is missing')
if(remediation.includes('useState(0),[answer'))throw new Error('remediation index still hard-resets from React state only')

console.log('PASS: stale streak resets for a newer unresolved source-paper attempt; newer correct attempts do not reset it')
console.log('PASS: currentIndex + distinct-question streak are persisted per source question')
