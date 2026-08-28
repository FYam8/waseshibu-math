import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = p => fs.readFileSync(path.join(root,p),'utf8')
const fail = msg => { console.error(`FAIL: ${msg}`); process.exitCode = 1 }
const ok = msg => console.log(`OK: ${msg}`)

const q = JSON.parse(read('src/data/questions.json'))
const majors = q.questions || []
if (majors.length === 40) ok('2019-2026の全40大問')
else fail(`大問数 ${majors.length} (expected 40)`)

for (const year of [2019,2020,2021,2022,2023,2024,2025,2026]) {
  const ys = majors.filter(x=>x.year===year)
  if (ys.length!==5) fail(`${year}: 大問数 ${ys.length}`)
}
ok('各年度5大問')

const q1_2019 = majors.find(x=>x.year===2019 && x.major===1)
if (q1_2019?.subquestions?.length===9) ok('2019大問1=9小問')
else fail('2019大問1の小問数')

for (const year of [2020,2021,2022,2023,2024,2025,2026]) {
  const x=majors.find(q=>q.year===year && q.major===1)
  if (x?.subquestions?.length!==8) fail(`${year}大問1の小問数`)
}
ok('2020-2026大問1=各8小問')

const sync = read('src/githubSync.ts')
if (!sync.includes("'X-GitHub-Api-Version'")) ok('ブラウザCORS非対応version headerを送信していない')
else fail('X-GitHub-Api-Versionが残っている')

if (!sync.includes("localStorage.setItem(LEGACY_TOKEN_LOCAL_KEY")) ok('PATをlocalStorageへ保存しない')
else fail('PAT localStorage保存が残っている')

if (sync.includes('clearSyncDirtyIfUnchanged(dirtyRevisionAtStart)')) ok('同期中変更のdirty revision保護')
else fail('dirty revision保護なし')

if (sync.includes('res.status === 409') && sync.includes('i<attempts')) ok('409 retry実装')
else fail('409 retry')

if (sync.includes('repo.private !== true')) ok('Private Repository検証')
else fail('Private Repository検証なし')

const app = read('src/App.tsx')
for (const route of ['"/years"','"/fields"','"/past-papers"','"/mistakes"','"/remediate"','"/practice"','"/report"','"/sync"']) {
  if (!app.includes(route)) fail(`route missing ${route}`)
}
ok('主要route')

const paperPage=read('src/pages/PastPapers.tsx')
if (paperPage.includes('ORIGINAL QUESTION BOOKLET') && paperPage.includes('OFFICIAL ANSWER SHEET') && paperPage.includes('<iframe') && paperPage.includes('saveAttempt(') && paperPage.includes('mistakeTag:')) ok('アプリ内の実過去問・解答入力・小問別採点')
else fail('アプリ内過去問演習')
for(const year of [2019,2020,2021,2022,2023,2024,2025,2026])for(const kind of ['問題','解答']){
  if(!fs.existsSync(path.join(root,`public/past-papers/${year}_数学_${kind}.pdf`)))fail(`${year} ${kind}PDF missing`)
}
ok('2019-2026問題・解答PDFを収録')
const mathInput=read('src/components/MathAnswerInput.tsx')
if (mathInput.includes("text:'√()'") && mathInput.includes("text:'/'") && mathInput.includes("text:'^2'")) ok('数式入力パッド')
else fail('数式入力パッド不足')
const remediation=read('src/pages/Remediation.tsx')
if (remediation.includes('nextStreak>=4') && remediation.includes('mastery-') && remediation.includes('類題は4問')) ok('4問連続正解で克服')
else fail('4問の類題克服ルール')
const remediationData=read('src/data/remediation.ts')
const fieldCount=[...remediationData.matchAll(/^\s{4}id: '[^']+'/gm)].length
const remedyQuestionCount=[...remediationData.matchAll(/\{prompt:/g)].length
if (fieldCount===18 && remedyQuestionCount===72) ok('18分野×4問=72問')
else fail(`類題バンク: ${fieldCount}分野・${remedyQuestionCount}問`)
const layout=read('src/components/Layout.tsx')
if (/<NavLink to="\/past-papers">過去問演習<\/NavLink>\s*<NavLink to="\/sync">/.test(layout)) ok('過去問演習は端末間同期の直前')
else fail('過去問演習タブ位置')
if (!layout.includes('/year-training') && !layout.includes('/multi')) ok('目的が重複する旧演習タブを撤去')
else fail('旧演習タブが残っている')


if (sync.includes('mergeAttempts(loadAttempts(), mergedAll, attemptsReset)')) ok('同期中の新規解答をlocal置換で消さない')
else fail('同期中の新規解答保護なし')

if (sync.includes('mergeScores(loadExamScores(), mergedExam.scores, examReset)')) ok('同期中の新規過去問得点を消さない')
else fail('同期中の新規過去問得点保護なし')

if (sync.includes('const currentPrefs = loadPreferences()') && sync.includes('const currentMeta = loadSyncMeta()')) ok('Profile最終マージで同期中の設定/リセットを再読込')
else fail('Profile最終再読込なし')

const practicePage = read('src/pages/Practice.tsx')
const submitBlock = practicePage.slice(practicePage.indexOf('const submit ='), practicePage.indexOf('const next ='))
if (!submitBlock.includes('saveAttempt(')) ok('復習8問は採点表示時点でattemptを確定しない')
else fail('復習8問 submitでattemptが早期保存される')

if (practicePage.includes("status:result ? 'correct' : 'wrong'")) ok('復習8問 attemptはNextで確定')
else fail('復習8問 Next確定なし')

const storage = read('src/storage.ts')
if (storage.includes('Math.max(current + 1, Date.now())')) ok('stale端末のリセット世代を時刻ベースで前進')
else fail('resetVersion stale端末対策なし')

if (!process.exitCode) console.log('SELF-CHECK PASSED')
