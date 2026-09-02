import assert from 'node:assert/strict'
import fs from 'node:fs'
const remedy=fs.readFileSync('src/pages/Remediation.tsx','utf8')
assert.doesNotMatch(remedy,/RemediationFigure/,'RemediationFigure must not be imported or rendered')
assert.doesNotMatch(remedy,/remediation-figure/,'No remediation figure markup should be rendered from Remediation')
const version=fs.readFileSync('src/version.ts','utf8')
const versionJson=JSON.parse(fs.readFileSync('public/version.json','utf8'))
assert.match(version,/APP_VERSION='0\.17\.11'/)
assert.equal(versionJson.appVersion,'0.17.11')
assert.equal(versionJson.version,'0.17.11')
assert.equal(versionJson.dataVersion,6)
assert.equal(versionJson.release,'remediation-figures-hidden')
console.log('PASS: v0.17.11 remediation figures are hidden from the user UI')
