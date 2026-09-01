
import fs from 'node:fs'
const src = fs.readFileSync(new URL('../src/data/remediation.ts', import.meta.url), 'utf8')
const guided = JSON.parse(fs.readFileSync(new URL('../src/data/guidedSolutions.json', import.meta.url), 'utf8')).solutions
const block = src.slice(src.indexOf('const sourceSpecificBanks'), src.indexOf('const sourceDifficultyMap'))
const keyMatches = [...block.matchAll(/'(\d{4}-Q[^']+)'\s*:\s*\{/g)]
const ids = keyMatches.map(m => m[1])
const unique = new Set(ids)
if (ids.length !== unique.size) throw new Error(`duplicate source-specific bank id: ${ids.length} vs ${unique.size}`)
const guidedIds = Object.keys(guided)
if (ids.length !== guidedIds.length) throw new Error(`coverage mismatch: banks=${ids.length}, guided=${guidedIds.length}`)
if ([...ids].sort().join('|') !== [...guidedIds].sort().join('|')) throw new Error('source-specific bank ids do not match the 160 Guided Solution ids')

for (let i=0;i<keyMatches.length;i++) {
  const start = keyMatches[i].index
  const end = i+1<keyMatches.length ? keyMatches[i+1].index : block.length
  const chunk = block.slice(start,end)
  const skillMatch = chunk.match(/coreSkill:\s*'((?:\\'|[^'])+)'/)
  if (!skillMatch) throw new Error(`missing coreSkill: ${ids[i]}`)
  const storedSkill = skillMatch[1].replace(/\\'/g,"'")
  const canonicalSkill = guided[ids[i]]?.takeaway?.pattern
  if (!canonicalSkill) throw new Error(`Guided Solution has no takeaway pattern: ${ids[i]}`)
  if (storedSkill !== canonicalSkill) throw new Error(`coreSkill drift: ${ids[i]}\n bank=${storedSkill}\n guided=${canonicalSkill}`)
  const qCount = (chunk.match(/\{prompt:/g)||[]).length
  if (qCount !== 4) throw new Error(`${ids[i]} has ${qCount} remediation questions (expected 4)`)
  const prompts=[...chunk.matchAll(/\{prompt:'((?:\\'|[^'])+)'/g)].map(m=>m[1])
  if(new Set(prompts).size!==4) throw new Error(`${ids[i]} contains duplicate remediation prompts`)
  if (/不採用|曖昧|不適切|TODO|TBD/.test(chunk)) throw new Error(`${ids[i]} contains rejected/ambiguous placeholder text`)
}
console.log(`PASS: ${ids.length}/160 source questions have dedicated core-skill banks; all have 4 distinct usable questions.`)
console.log('PASS: bank ids exactly match the 160 Guided Solution ids; canonical takeaway patterns are synchronized for newly audited banks.')
