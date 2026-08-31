import fs from 'node:fs'

const reinforce=fs.readFileSync('src/pages/Reinforcement.tsx','utf8')

// 1) 不正解では旧年度補強を完了扱いにしない
if(!reinforce.includes("if(correct)markOldQuestionCompleted(source,id)"))throw new Error('wrong reinforcement answer can still complete the reserved old question')
if(reinforce.includes("const mark=(id:string,topic:string,correct:boolean)=>{\n    markOldQuestionCompleted(source,id)"))throw new Error('completion still happens before correctness check')
console.log('PASS: wrong reinforcement answer stays incomplete')

// 2) 正答表示中は自動採点できない
if(!reinforce.includes("disabled={isDone||showAnswer[item.id]||!(answers[item.id]||'').trim()}"))throw new Error('user can auto-grade while the answer is visible')
console.log('PASS: answer-visible copying cannot be auto-graded')

// 3) 正答を見た後は入力と直前採点をリセットして再現を要求
if(!reinforce.includes("setAnswers(v=>({...v,[item.id]:''}))"))throw new Error('answer reveal does not reset copied input before reproduction')
if(!reinforce.includes("delete next[item.id]"))throw new Error('previous grading result is not cleared before reproduction')
if(!reinforce.includes("正答を隠して自力で再現"))throw new Error('UI does not explain the reproduction gate')
console.log('PASS: reveal -> hide -> fresh reproduction is enforced')

// 4) 完了条件の説明が実装と一致
if(!reinforce.includes("もう一度正解したときだけ完了になります"))throw new Error('user-facing completion explanation is missing')
console.log('PASS: reinforcement completion wording matches behavior')

console.log('PASS: v0.17.7 reinforcement user-flow scenarios')
