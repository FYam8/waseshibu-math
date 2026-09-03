import assert from 'node:assert/strict'
import fs from 'node:fs'
const remedy=fs.readFileSync('src/pages/Remediation.tsx','utf8')
assert.match(remedy,/level2FigureUrl/,'Audited v7 figure resolver must be used')
assert.match(remedy,/q\.problemFigure/,'Problem figures must come from the current question record')
const version=fs.readFileSync('src/version.ts','utf8')
const versionJson=JSON.parse(fs.readFileSync('public/version.json','utf8'))
assert.match(version,/APP_VERSION='0\.18\.0'/)
assert.equal(versionJson.appVersion,'0.18.0')
assert.equal(versionJson.version,'0.18.0')
assert.equal(versionJson.dataVersion,7)
assert.equal(versionJson.release,'audited-level2-v7')
console.log('PASS: v0.18.0 renders only audited v7 question-referenced figures')
