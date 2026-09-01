import fs from 'node:fs'

const src = fs.readFileSync(new URL('../src/data/remediation.ts', import.meta.url), 'utf8')
const start = src.indexOf('const sourceSpecificBanks')
const end = src.indexOf('const sourceDifficultyMap')
if (start < 0 || end < 0 || end <= start) throw new Error('sourceSpecificBanks block not found')
const block = src.slice(start, end)
const bankMatches = [...block.matchAll(/'(\d{4}-Q[^']+)'\s*:\s*\{/g)]
const issues = []
let total = 0
const norm = s => s.replace(/\s+/g,'').replace(/[−–—]/g,'-').toLowerCase()

for (let i=0;i<bankMatches.length;i++) {
  const id = bankMatches[i][1]
  const chunk = block.slice(bankMatches[i].index, i+1<bankMatches.length ? bankMatches[i+1].index : block.length)
  const qMatches = [...chunk.matchAll(/\{prompt:'((?:\\'|[^'])*)',answer:'((?:\\'|[^'])*)'(?:,acceptedAnswers:\[([^\]]*)\])?,explanation:'((?:\\'|[^'])*)'\}/g)]
  if (qMatches.length !== 4) issues.push(`${id}: expected 4 questions, found ${qMatches.length}`)
  const local = new Set()
  qMatches.forEach((m, idx) => {
    total++
    const prompt = m[1].replace(/\\'/g,"'")
    const answer = m[2].replace(/\\'/g,"'")
    const explanation = m[4].replace(/\\'/g,"'")
    if (!prompt.trim()) issues.push(`${id} #${idx+1}: empty prompt`)
    if (!answer.trim()) issues.push(`${id} #${idx+1}: empty answer`)
    if (!explanation.trim()) issues.push(`${id} #${idx+1}: empty explanation`)
    if (/TODO|TBD|不採用|曖昧|不適切|要確認|placeholder/i.test(prompt+answer+explanation)) issues.push(`${id} #${idx+1}: placeholder/rejected text`)
    const np = norm(prompt)
    if (local.has(np)) issues.push(`${id} #${idx+1}: duplicate prompt in same bank`)
    local.add(np)
  })
}

if (bankMatches.length !== 160) issues.push(`bank count: expected 160, found ${bankMatches.length}`)
if (total !== 640) issues.push(`question count: expected 640, found ${total}`)

if (issues.length) {
  console.error('REMEDIATION CONTENT AUDIT FAILED')
  issues.forEach(x=>console.error('-',x))
  process.exit(1)
}
console.log(`PASS: remediation content audit ${bankMatches.length} banks / ${total} questions`)
console.log('PASS: all 640 have nonempty prompt/answer/explanation; no placeholders; 4 distinct prompts inside every source bank')
