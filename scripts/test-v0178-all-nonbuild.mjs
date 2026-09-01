import {spawnSync} from 'node:child_process'

const names=[
  'self-check','verify-critical','test:migration','test:mastery','test:today','test:eta','test:eta:runtime',
  'audit:remediation','test:v017','test:year-role','test:user-scenarios','test:user-perspective',
  'test:user-perspective:v0176','test:remediation-streak','test:remediation-progress','test:guided-validation',
  'test:v0178-state','audit:core-skill','audit:remediation-content','test:v0178-required20','test:v0178-completeness'
]
for(const name of names){
  const r=spawnSync('npm',['run',name],{encoding:'utf8',stdio:'inherit'})
  if(r.status!==0)process.exit(r.status||1)
}
console.log(`PASS: ${names.length} non-build v0.17.8 test commands`)
