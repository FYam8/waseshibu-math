import fs from 'node:fs'

const questionsJson = JSON.parse(fs.readFileSync('src/data/questions.json','utf8'))
const remediation = fs.readFileSync('src/data/remediation.ts','utf8')
const remediationPage = fs.readFileSync('src/pages/Remediation.tsx','utf8')
const practicePage = fs.readFileSync('src/pages/Practice.tsx','utf8')

const subquestions = questionsJson.questions.flatMap(q =>
  q.subquestions.map(s => ({
    id:`${q.id}-${s.no}`,
    topic:s.topic,
    grade:s.grade
  }))
)

if (subquestions.length !== 160) throw new Error(`expected 160 subquestions, got ${subquestions.length}`)

const fieldRe = /id: '([^']+)', title: '([^']+)', keywords: \/((?:\\\/|[^/])+)\/,/g
const fields = [...remediation.matchAll(fieldRe)].map(m => ({
  id:m[1],
  title:m[2],
  re:new RegExp(m[3].replaceAll('\\/','/'))
}))
if (fields.length !== 18) throw new Error(`expected 18 remediation fields, got ${fields.length}`)

const classify = topic => fields.find(f => f.re.test(topic)) ?? fields[0]

const bankStart = remediation.indexOf('const difficultyBanks')
const bankEnd = remediation.indexOf('const sourceDifficultyMap')
if (bankStart < 0 || bankEnd < 0 || bankEnd <= bankStart) throw new Error('difficulty bank section missing')
const bankText = remediation.slice(bankStart, bankEnd)
const lines = bankText.split(/\r?\n/)
const bankCounts = new Map()
let current = null, level = null
for (const line of lines) {
  let m = line.match(/^  (?:'([^']+)'|([A-Za-z0-9_-]+)): \{$/)
  if (m) { current = m[1] || m[2]; level = null; continue }
  m = line.match(/^    ([ABC]): \[$/)
  if (m) { level = m[1]; continue }
  if (current && level && line.includes('{prompt:')) {
    const key = `${current}:${level}`
    bankCounts.set(key, (bankCounts.get(key) || 0) + 1)
  }
  if (level && /^    \](,)?$/.test(line)) level = null
}

for (const q of subquestions) {
  if (q.grade === 'A') continue
  const field = classify(q.topic)
  const count = bankCounts.get(`${field.id}:${q.grade}`) || 0
  if (count !== 4) {
    throw new Error(`${q.id} ${q.topic} ${q.grade}: ${field.id} bank has ${count}, expected 4`)
  }
}

const mapMatch = remediation.match(/const sourceDifficultyMap:[\s\S]*?= \{([\s\S]*?)\n\}/)
if (!mapMatch) throw new Error('sourceDifficultyMap missing')
const mapEntries = new Map([...mapMatch[1].matchAll(/'([^']+)': '([ABC])'/g)].map(m => [m[1],m[2]]))
if (mapEntries.size !== 160) throw new Error(`sourceDifficultyMap expected 160 entries, got ${mapEntries.size}`)
for (const q of subquestions) {
  if (mapEntries.get(q.id) !== q.grade) throw new Error(`${q.id}: difficulty map mismatch`)
}

if (!remediationPage.includes('getRemediationForSource(topic,sourceQuestion)')) throw new Error('source-linked calibrated remediation not used')
if (!remediationPage.includes('remedy-${field.id}-${difficulty}-${index}')) throw new Error('difficulty not separated in remediation attempt ids')
if (!practicePage.includes("grade:'A'")) throw new Error('foundation bank is not explicitly A')
if (practicePage.includes("index<2?'A':'B'")) throw new Error('arbitrary A/B difficulty labelling remains')
if (!practicePage.includes('過去問と同程度の類題は各問題の弱点補強から出題します')) throw new Error('practice/remediation role distinction missing')

for (const bad of ['不適切','不一致','範囲外','份']) {
  if (remediation.includes(bad)) throw new Error(`suspicious remediation text remains: ${bad}`)
}

const required = [...new Set(subquestions.filter(q=>q.grade!=='A').map(q=>`${classify(q.topic).id}:${q.grade}`))]
for (const key of required) {
  if ((bankCounts.get(key)||0) !== 4) throw new Error(`required bank incomplete: ${key}`)
}

console.log(`PASS: 160 source difficulties mapped; ${required.length} required B/C field-bands each have 4 calibrated questions`)
console.log('PASS: source-linked remediation selects original A/B/C band; foundation practice no longer fabricates B labels')
