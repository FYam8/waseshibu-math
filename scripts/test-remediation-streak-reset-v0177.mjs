
import fs from 'node:fs'

const remediation=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const guided=fs.readFileSync('src/guidedReview.ts','utf8')

// A newer source-paper attempt must invalidate an older 3/4 streak.
if(!remediation.includes('latestSourceAttemptAt'))throw new Error('latest source attempt is not considered by remediation')
if(!remediation.includes('effectivePracticeStreak(sourceQuestion,latestSourceAttemptAt)'))throw new Error('stale practice streak can still initialize the remediation run')
if(!remediation.includes('resetPracticeIfSourceAttemptIsNewer(sourceQuestion,latestSourceAttemptAt)'))throw new Error('persisted stale streak is not reset before recording a new practice result')
if(!guided.includes("if(latestSourceAttemptAt&&current.updatedAt<latestSourceAttemptAt)return 0"))throw new Error('effective streak does not reset when the exam attempt is newer')
if(!guided.includes("practiceStreak:0,mastery:'attempted'"))throw new Error('newer source mistake does not reopen mastery')

// The progress label should tell the learner how many consecutive correct answers remain,
// not which question-array index happens to be displayed.
if(remediation.includes('類題 {index+1}/4'))throw new Error('misleading question-index progress is still shown')
if(!remediation.includes('連続正解チャレンジ {Math.min(streak+1,4)}/4'))throw new Error('consecutive-correct progress label is missing')

console.log('PASS: stale 3/4 streak is invalidated by a newer source-paper attempt')
console.log('PASS: remediation progress label reflects the 4-consecutive-correct rule')
