import fs from 'node:fs'
import assert from 'node:assert/strict'

const sync=fs.readFileSync(new URL('../src/progressSync.ts',import.meta.url),'utf8')
const main=fs.readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8')
const deploy=fs.readFileSync(new URL('../.github/workflows/deploy.yml',import.meta.url),'utf8')

assert.match(sync,/SYNC_DB='waseshibu-progress-sync'/)
assert.match(sync,/SYNC_DB_VERSION=7/)
assert.match(sync,/APP_ID='math'/)
assert.match(sync,/state:summary/)
assert.match(sync,/state:latest-exam/)
assert.match(sync,/state:year:/)
assert.match(sync,/completedCoreByTarget/)
assert.match(sync,/scoreValidity/)
assert.match(sync,/VITE_PROGRESS_API_BASE/)
assert.doesNotMatch(sync,/\.answer\b|answerText|rawAnswer|acceptedAnswers/)
assert.doesNotMatch(sync,/localStorage\.clear|indexedDB\.deleteDatabase|deleteDatabase|removeItem\(['"]waseshibu-math/)
assert.match(main,/initMathProgressSync/)
assert.match(deploy,/VITE_PROGRESS_API_BASE:\s*https:\/\/waseshibu-progress-api\.fyam8\.workers\.dev/)

console.log('math cloud progress sync guards: PASS')
