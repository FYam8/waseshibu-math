import fs from 'node:fs'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'

const read=p=>fs.readFileSync(p,'utf8')
const pkg=JSON.parse(read('package.json'))
const lock=JSON.parse(read('package-lock.json'))
const version=read('src/version.ts')
const migration=read('src/dataMigration.ts')
const backup=read('src/dataBackup.ts')
const storage=read('src/storage.ts')
const past=read('src/pages/PastPapers.tsx')
const home=read('src/pages/Home.tsx')
const route=read('src/learningRoute.ts')
const eta=read('src/targetEta.ts')
const remediation=read('src/data/remediation.ts')
const guided=read('src/data/guidedSolutions.json')
const preflight=read('src/preflight.ts')

const fail=(message)=>{throw new Error(message)}

// Version consistency.
assert.equal(pkg.version,'0.18.0','package.json version')
assert.equal(lock.version,'0.18.0','package-lock top version')
assert.equal(lock.packages?.['']?.version,'0.18.0','package-lock root package version')
assert.match(version,/APP_VERSION='0\.18\.0'/,'APP_VERSION')

// Migration/data protection.
assert.match(migration,/CURRENT_DATA_VERSION=7/,'dataVersion 7')
for(const token of [
  'waseshibu-math-attempts','waseshibu-math-preferences','waseshibu-math-daily',
  'waseshibu-math-exam-scores','waseshibu-math-exam-drafts-v2','waseshibu-math-learning-route-v1',
  'waseshibu-math-guided-review-v1','waseshibu-math-guided-progress-v2',
  'waseshibu-math-remediation-progress-v1','waseshibu-math-level2-history-v1'
]) assert.ok(migration.includes(token),`migration key missing: ${token}`)
assert.ok(migration.includes('MIGRATION_BACKUP_STORAGE_KEY'),'pre-migration backup missing')
assert.ok(migration.includes('for(const [key,value] of before)'),'migration rollback missing')
assert.ok(backup.includes('REMEDIATION_PROGRESS_STORAGE_KEY'),'remediation progress missing from backup/export')
assert.match(backup,/GUIDED_PROGRESS_STORAGE_KEY,REMEDIATION_PROGRESS_STORAGE_KEY/,'remediation progress type validation missing')

// Goal switching must be preference-only and Home explicitly promises history preservation.
assert.match(storage,/export function savePreferences[\s\S]*localStorage\.setItem\(PREF_KEY/,'preference writer missing')
const prefFn=storage.slice(storage.indexOf('export function savePreferences'),storage.indexOf('export function loadDaily'))
for(const forbidden of ['ATTEMPT_KEY','EXAM_KEY','GUIDED','REMEDIATION','removeItem'])assert.ok(!prefFn.includes(forbidden),`target switch can mutate learning history: ${forbidden}`)
assert.ok(home.includes('目標を変えても、これまでの得点・正誤・GuidedSolution・類題履歴は消しません。'),'goal-change preservation message missing')

// First-look/reference behavior.
assert.match(past,/const inferredFirstLook=!hasPriorCompleted&&\(initial\.firstLookEligible\?\?\(Object\.keys\(initial\)\.length>0\|\|yearExposureState\(year\)==='untouched'\)\)/,'first-look continuity guard changed')
assert.match(past,/scoreValidity:!prior&&firstLookEligible\?'first-look':'reference'/,'first-look/reference save rule changed')
assert.match(past,/if\(phase!=='solve'\|\|\(needsWarning&&!warningAccepted\)\)return;const id=`exposure-\$\{year\}`/,'warning-only exposure guard changed')

// Year roles / required-vs-optional routing.
assert.ok(route.includes('REQUIRED_MAIN_YEAR_SEQUENCE=[2024,2023,2022,2025,2026]'),'required five-year sequence missing')
assert.ok(route.includes("Number(year)>=2019&&Number(year)<=2021"),'optional old-year draft separation missing')
assert.ok(route.includes('後の年度を先に開いたドラフトがあっても、手前の必須年度・未解決・補強を飛ばさない。'),'required task precedence missing')

// ETA monotonicity and old-year exclusion.
assert.ok(eta.includes('2019〜2021年度は「全問題」を数えない。'),'optional old-year ETA exclusion missing')
assert.ok(eta.includes('Math.max(floor,item.remainingUnits)'),'A<=B<=C monotonic ETA guard missing')

// 2019/2020 scope: no Pythagorean theorem as primary remedy/guided method.
const scopeText=[remediation,guided].join('\n')
for(const year of [2019,2020]){
  const ids=[...scopeText.matchAll(new RegExp(`"${year}-Q[^"]+"|'${year}-Q[^']+'`,'g'))]
  assert.ok(ids.length>0,`${year} items not found`)
}
assert.ok(!scopeText.includes('三平方の定理'),'2019/2020 scope audit: explicit Pythagorean theorem found in learning content')

// Critical official answers called out in handoff.
for(const [id,value] of [
  ['2024-Q2-2',"'(2,4)'"],
  ['2024-Q2-3',"'3+√13'"],
  ['2022-Q1-2',"'(-6,2)'"],
]) assert.ok(preflight.includes(id)||read('src/data/examAnswers.ts').includes(id),`critical answer id missing: ${id}`)
const answers=read('src/data/examAnswers.ts')
assert.ok(answers.includes("'2024-Q2-2'")&&answers.includes('(2,4)'),'2024-Q2-2 official answer drift')
assert.ok(answers.includes("'2024-Q2-3'")&&answers.includes('3+√13'),'2024-Q2-3 official answer drift')
assert.ok(answers.includes("'2022-Q1-2'")&&answers.includes('-6,2'),'2022-Q1-2 official answer drift')
assert.ok(answers.includes("'2022-Q2-2'")&&answers.includes('3t')&&answers.includes('9t²/4'),'2022-Q2-2 official answer drift')

// Terminology.
assert.ok(home.includes('未解決'),'Home should use 未解決 terminology')
assert.ok(!home.includes('元の誤答'),'Home contains misleading 元の誤答 wording')

console.log('PASS: v0.17.11 completeness supplements')
console.log('version / migration+backup / goal-switch preservation / first-look-reference / year-role / ETA / 2019-2020 scope / critical answers / terminology')
