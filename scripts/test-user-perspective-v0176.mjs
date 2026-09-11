import fs from 'node:fs'

const reinforce=fs.readFileSync('src/pages/Reinforcement.tsx','utf8')
const remediation=fs.readFileSync('src/pages/Remediation.tsx','utf8')
const history=fs.readFileSync('src/level2History.ts','utf8')

// 1) 旧年度の別枠演習を本線完了条件にせず、元問題ごとの固定類題へ直接進む。
if(!reinforce.includes('sourcePracticeProgress(source,target)'))throw new Error('fixed-practice progress is not the reinforcement source of truth')
if(!reinforce.includes('2019〜2021年度の追加演習')||!reinforce.includes('残日数には含めません'))throw new Error('old-year full-paper extras are not clearly optional')
if(!reinforce.includes('/remediate?topic=${encodeURIComponent(item.topic)}&source=${source}&q=${encodeURIComponent(item.key)}'))throw new Error('source question does not route directly to its fixed practice set')
if(reinforce.includes('markOldQuestionCompleted('))throw new Error('optional old-year completion is still a required reinforcement gate')
console.log('PASS: source repair -> fixed practice is the required flow; separate 2019-2021 work is optional')

// 2) 固定類題で不正解でも完了数を増やさず、未正解問題だけを再挑戦する。
if(!/qualifying\s*=\s*!stale\s*&&\s*input\.firstSubmission\s*&&\s*input\.correct\s*&&\s*!usedHint\s*&&\s*!usedExplanation\s*&&\s*!revealedAnswer/.test(history))throw new Error('wrong/assisted fixed-practice answers can qualify as completed')
if(!/completedIds\s*=\s*qualifying/.test(history))throw new Error('fixed-practice completion does not depend on a qualifying correct answer')
if(!remediation.includes('誤答や補助利用があっても正解済み問題は維持し、未正解問題だけを周回します'))throw new Error('fixed-practice retry behavior is not explained to the learner')
console.log('PASS: wrong fixed-practice answers stay unresolved without resetting completed questions')

// 3) 正答・解説を見た後の正解は独立正解として数えず、後で再挑戦する。
if(!remediation.includes('setRevealedAnswer(true)'))throw new Error('answer reveal is not tracked')
if(!remediation.includes('補助を使ったため、この問題は後でもう一度出題します'))throw new Error('assisted answer does not tell the learner that a fresh retry is required')
if(!/!usedHint\s*&&\s*!usedExplanation\s*&&\s*!revealedAnswer/.test(history))throw new Error('assistance flags are not enforced in fixed-practice qualification')
console.log('PASS: reveal/hint use requires a later independent retry')

// 4) 必須セット完了後の再練習は任意で、本線ETAを再開しない前提をUIに明示する。
if(!reinforce.includes('完了後の再練習はエクストラ扱いで、残日数には戻しません'))throw new Error('post-completion re-practice is not clearly separated from core ETA')
if(!remediation.includes('新しいセットで再練習'))throw new Error('optional re-practice entry point is missing')
console.log('PASS: post-completion re-practice is optional and separated from core countdown')

console.log('PASS: v0.18.1 reinforcement user-flow scenarios')
