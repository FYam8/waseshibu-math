import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd(),read=p=>fs.readFileSync(path.join(root,p),'utf8')
const fail=msg=>{console.error(`FAIL: ${msg}`);process.exitCode=1},ok=msg=>console.log(`OK: ${msg}`)
const q=JSON.parse(read('src/data/questions.json')),majors=q.questions||[]
const questionIds=majors.flatMap(m=>m.subquestions.map(s=>`${m.id}-${s.no}`))

if(majors.length===40&&questionIds.length===160)ok('2019〜2026 全40大問・160小問');else fail(`問題数 ${majors.length}/${questionIds.length}`)
for(const year of [2019,2020,2021,2022,2023,2024,2025,2026])if(majors.filter(x=>x.year===year).length!==5)fail(`${year}年度が5大問ではない`)

const app=read('src/App.tsx'),paper=read('src/pages/PastPapers.tsx'),guided=read('src/pages/GuidedReview.tsx'),mark=read('src/components/ExamMarkReview.tsx'),focus=read('src/components/FocusedQuestionView.tsx'),focusRules=read('src/data/questionFocus.ts'),styles=read('src/guidedReview.css')
if(app.includes('"/guided-review"')&&paper.includes('ExamMarkReview')&&guided.includes('FocusedQuestionView'))ok('小問別復習ルート接続');else fail('小問別復習ルート')
if(paper.includes('PROBLEM · EXAM MODE')&&paper.includes('本番演習中は、実際の試験と同じように問題ページ全体を表示します'))ok('本番演習はページ全体表示');else fail('本番表示')
if(mark.includes('ONE QUESTION MARKING')&&mark.includes('公式解答ページ全体は表示しません')&&mark.includes('この小問の正答')&&!mark.includes('exam-answers'))ok('採点後は1小問・1正答だけ');else fail('採点1問フォーカス')
if(guided.includes('ONE QUESTION REVIEW')&&guided.includes('ほかの小問・ほかの正答は表示しません')&&guided.includes('この小問の正答だけを表示'))ok('解説は1小問・1正答だけ');else fail('解説1問フォーカス')
if(focus.includes("slices.filter(x=>x.role==='current')")&&focus.includes('<details className="common-context">')&&focus.includes('初期表示は現在の小問だけです'))ok('共通図は必要時のみ展開');else fail('共通図折りたたみ')
if(focusRules.includes('focusSlicesFor')&&focusRules.includes("role:'current'")&&styles.includes('.focus-slice')&&styles.includes('.mark-focus-grid'))ok('小問フォーカス表示ルール・レスポンシブUI');else fail('フォーカス表示基盤')
if(paper.includes('今回間違えた問題から直す')&&paper.includes('/guided-review?q='))ok('採点結果は間違い小問を先に表示');else fail('結果→1問復習導線')
if(!paper.includes('OFFICIAL ANSWERS')&&!paper.includes('answerImage(')&&!paper.includes('answerPages'))ok('公式解答ページ全体の自動表示を廃止');else fail('公式解答全体が残っている')

const answerData=read('src/data/examAnswers.ts'),answerIds=[...answerData.matchAll(/'(\d{4}-Q[^']+)':E/g)].map(x=>x[1])
if(answerIds.length===160&&questionIds.every(id=>answerIds.includes(id))&&new Set(answerIds).size===160)ok('全160小問の正答データ');else fail(`正答データ ${answerIds.length}/160`)

const backup=read('src/dataBackup.ts'),migration=read('src/dataMigration.ts'),version=read('src/version.ts'),publicVersion=read('public/version.json')
if(migration.includes('CURRENT_DATA_VERSION=3')&&backup.includes('GUIDED_REVIEW_STORAGE_KEY')&&version.includes("APP_VERSION='0.12.0'")&&publicVersion.includes('"appVersion": "0.12.0"')&&publicVersion.includes('"dataVersion": 3'))ok('v0.12.0・data v3・既存学習データ保護');else fail('版・データ形式整合')

const html=read('index.html'),robots=read('public/robots.txt')
if(html.includes('noindex, nofollow, noarchive, nosnippet')&&robots.includes('Disallow: /'))ok('検索エンジン非掲載設定');else fail('noindex/robots')
if(read('src/main.tsx').includes('bootstrapSafety()')&&read('src/safetyStorage.ts').includes("'pre_upgrade'")&&backup.includes('best-effort rollback'))ok('更新前退避・ロールバック');else fail('更新安全基盤')

if(!process.exitCode)console.log('SELF-CHECK PASSED')
