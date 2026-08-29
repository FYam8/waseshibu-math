import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd(),read=p=>fs.readFileSync(path.join(root,p),'utf8')
const fail=msg=>{console.error(`FAIL: ${msg}`);process.exitCode=1},ok=msg=>console.log(`OK: ${msg}`)
const q=JSON.parse(read('src/data/questions.json')),majors=q.questions||[]
const questionIds=majors.flatMap(m=>m.subquestions.map(s=>`${m.id}-${s.no}`))

if(majors.length===40&&questionIds.length===160)ok('2019〜2026 全40大問・160小問');else fail(`問題数 ${majors.length}/${questionIds.length}`)
for(const year of [2019,2020,2021,2022,2023,2024,2025,2026])if(majors.filter(x=>x.year===year).length!==5)fail(`${year}年度が5大問ではない`)

const app=read('src/App.tsx'),home=read('src/pages/Home.tsx'),paper=read('src/pages/PastPapers.tsx'),guided=read('src/pages/GuidedReview.tsx'),mark=read('src/components/ExamMarkReview.tsx'),reinforcement=read('src/pages/Reinforcement.tsx'),focus=read('src/components/FocusedQuestionView.tsx'),focusRules=read('src/data/questionFocus.ts'),manifest=read('src/data/questionFocusManifest.ts'),examConfig=read('src/data/examConfig.ts'),styles=read('src/guidedReview.css')
if(app.includes('"/guided-review"')&&paper.includes('ExamMarkReview')&&guided.includes('FocusedQuestionView')&&reinforcement.includes('FocusedQuestionView'))ok('採点・解説・弱点補強を同じ1問表示へ統一');else fail('1問表示ルート統一')
if(paper.includes('PROBLEM · EXAM MODE')&&paper.includes('本番演習中は、実際の試験と同じように問題ページ全体を表示します'))ok('本番演習はページ全体表示');else fail('本番表示')
if(mark.includes('ONE QUESTION MARKING')&&mark.includes('公式解答ページ全体は表示しません')&&mark.includes('この小問の正答')&&!mark.includes('exam-answers'))ok('採点後は1小問・1正答だけ');else fail('採点1問フォーカス')
if(guided.includes('ONE QUESTION REVIEW')&&guided.includes('ほかの小問・ほかの正答は表示しません')&&guided.includes('の正答だけを表示'))ok('解説は1小問・1正答だけ');else fail('解説1問フォーカス')
if(reinforcement.includes('この小問の正答だけ見る')&&reinforcement.includes('別小問や公式解答ページ全体は表示しません')&&!reinforcement.includes('answerPages')&&!reinforcement.includes('answerImage(')&&!reinforcement.includes('exam-images'))ok('弱点補強も1小問・1正答だけ');else fail('弱点補強に旧全体表示が残っている')
if(home.includes("if(n===3&&done)return {to:'/reinforce?source=2024',label:'弱点問題を解く'}")&&home.includes('弱点分析を見る')&&styles.includes('.route-secondary-link'))ok('完了済み弱点抽出カードから問題演習へ直行');else fail('STEP3完了後の問題演習導線')

const manifestIds=[...manifest.matchAll(/'(\d{4}-Q[^']+)':/g)].map(x=>x[1])
if(manifestIds.length===160&&new Set(manifestIds).size===160&&questionIds.every(id=>manifestIds.includes(id)))ok('全160小問に固定表示マップ');else fail(`固定表示マップ ${manifestIds.length}/160`)
if(!focusRules.includes('pageDistribution')&&!focusRules.includes('questionStart')&&focusRules.includes('questionFocusManifest')&&focusRules.includes('questionFocusFor'))ok('均等配分・位置推定を廃止');else fail('位置推定ロジックが残っている')
if(focus.includes('全年度・位置確認済み')&&focus.includes('focus-common-block')&&focus.includes('focus-current-block')&&focus.includes('原本ページ全体を確認')&&styles.includes('.shared-task-note'))ok('確認済み小問・共通条件・原本フォールバック');else fail('固定表示UI')
if(!focus.includes('<figcaption')&&!styles.includes('.focus-slice figcaption')&&focus.includes('問題文の上にはUIを重ねません'))ok('問題画像上にラベル・UIを重ねない');else fail('問題文に重なる画像内UIが残っている')
if(manifest.includes("'2021-Q2-1'")&&manifest.includes('"sharedTask":true')&&manifest.includes("'2022-Q3-2-i'")&&manifest.includes("'2022-Q3-2-ii'"))ok('共通文章型・枝番小問を個別管理');else fail('特殊小問マップ')
if(examConfig.includes('2023:[[4,5],[6],[7],[8,9],[10]]'))ok('2023年度 大問4=8・9頁 / 大問5=10頁');else fail('2023ページ割り当て')
if(manifest.includes("'2023-Q5-1':{\"common\":[{\"page\":10")&&manifest.includes("'2023-Q5-3':{\"common\":[{\"page\":10"))ok('2023大問5は10頁だけ');else fail('2023大問5マップ')
if(paper.includes('今回間違えた問題から直す')&&paper.includes('/guided-review?q='))ok('採点結果は間違い小問を先に表示');else fail('結果→1問復習導線')
if(!paper.includes('OFFICIAL ANSWERS')&&!paper.includes('answerImage(')&&!paper.includes('answerPages'))ok('過去問採点の公式解答ページ全体表示を廃止');else fail('公式解答全体が残っている')

const answerData=read('src/data/examAnswers.ts'),answerIds=[...answerData.matchAll(/'(\d{4}-Q[^']+)':E/g)].map(x=>x[1])
if(answerIds.length===160&&questionIds.every(id=>answerIds.includes(id))&&new Set(answerIds).size===160)ok('全160小問の正答データ');else fail(`正答データ ${answerIds.length}/160`)

const backup=read('src/dataBackup.ts'),migration=read('src/dataMigration.ts'),version=read('src/version.ts'),publicVersion=read('public/version.json')
if(migration.includes('CURRENT_DATA_VERSION=3')&&backup.includes('GUIDED_REVIEW_STORAGE_KEY')&&version.includes("APP_VERSION='0.13.1'")&&publicVersion.includes('"appVersion": "0.13.1"')&&publicVersion.includes('"dataVersion": 3'))ok('v0.13.1・data v3・既存学習データ保護');else fail('版・データ形式整合')

const html=read('index.html'),robots=read('public/robots.txt')
if(html.includes('noindex, nofollow, noarchive, nosnippet')&&robots.includes('Disallow: /'))ok('検索エンジン非掲載設定');else fail('noindex/robots')
if(read('src/main.tsx').includes('bootstrapSafety()')&&read('src/safetyStorage.ts').includes("'pre_upgrade'")&&backup.includes('best-effort rollback'))ok('更新前退避・ロールバック');else fail('更新安全基盤')

if(!process.exitCode)console.log('SELF-CHECK PASSED')
