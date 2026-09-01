import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd(),read=p=>fs.readFileSync(path.join(root,p),'utf8')
const fail=msg=>{console.error(`FAIL: ${msg}`);process.exitCode=1},ok=msg=>console.log(`OK: ${msg}`)
const q=JSON.parse(read('src/data/questions.json')),majors=q.questions||[]
const questionIds=majors.flatMap(m=>m.subquestions.map(s=>`${m.id}-${s.no}`))

if(majors.length===40&&questionIds.length===160)ok('2019〜2026 全40大問・160小問');else fail(`問題数 ${majors.length}/${questionIds.length}`)
for(const year of [2019,2020,2021,2022,2023,2024,2025,2026])if(majors.filter(x=>x.year===year).length!==5)fail(`${year}年度が5大問ではない`)

const app=read('src/App.tsx'),home=read('src/pages/Home.tsx'),route=read('src/learningRoute.ts'),mistake=read('src/pages/MistakeReview.tsx'),paper=read('src/pages/PastPapers.tsx'),guided=read('src/pages/GuidedReview.tsx'),mark=read('src/components/ExamMarkReview.tsx'),reinforcement=read('src/pages/Reinforcement.tsx'),focus=read('src/components/FocusedQuestionView.tsx'),focusRules=read('src/data/questionFocus.ts'),manifest=read('src/data/questionFocusManifest.ts'),examConfig=read('src/data/examConfig.ts'),styles=read('src/guidedReview.css'),homeStyles=read('src/homeRoute.css')
if(app.includes('"/guided-review"')&&paper.includes('ExamMarkReview')&&guided.includes('FocusedQuestionView')&&reinforcement.includes('FocusedQuestionView'))ok('採点・解説・弱点補強を同じ1問表示へ統一');else fail('1問表示ルート統一')
if(paper.includes('PROBLEM · EXAM MODE')&&paper.includes('本番演習中は、実際の試験と同じように問題ページ全体を表示します'))ok('本番演習はページ全体表示');else fail('本番表示')
if(mark.includes('ONE QUESTION MARKING')&&mark.includes('公式解答ページ全体は表示しません')&&mark.includes('この小問の正答')&&!mark.includes('exam-answers'))ok('採点後は1小問・1正答だけ');else fail('採点1問フォーカス')
if(guided.includes('GUIDED SOLUTION')&&guided.includes('ほかの小問・ほかの正答は表示しません')&&guided.includes('の正答だけを表示'))ok('解説は1小問・1正答だけ');else fail('解説1問フォーカス')
if(reinforcement.includes('この小問の正答だけ見る')&&reinforcement.includes('別小問や公式解答ページ全体は表示しません')&&!reinforcement.includes('answerPages')&&!reinforcement.includes('answerImage(')&&!reinforcement.includes('exam-images'))ok('弱点補強も1小問・1正答だけ');else fail('弱点補強に旧全体表示が残っている')
if(home.includes('今日やること')&&home.includes('MAX 10 TASKS')&&home.includes('buildTodayTasks')&&home.includes('この1問を直す')&&home.includes('A＝60点、B＝70点、C＝75点'))ok('今日やること・弱点直結・A60/B70/C75ホームUX');else fail('ホーム共通UX')
if(route.includes('currentLearningPhase')&&route.includes('routePhaseDone')&&route.includes('sourceMistakeProgress')&&route.includes('requiresSourceReview')&&route.includes('旧方式の補強を完了'))ok('6フェーズ進捗・元誤答先行・旧完了者保護');else fail('新学習フェーズ進捗')
if(reinforcement.includes('まず')&&reinforcement.includes('元の未解決問題を直す')&&reinforcement.includes('sourceMistakeProgress')&&reinforcement.includes('SOURCE QUESTION FIRST'))ok('補強前に元の誤答を再現');else fail('元誤答→補強の順序')
if(mistake.includes('gradeInTarget(prefs.target,meta.grade)')&&mistake.includes('weakFieldsForStoredExam(prefs.target,latestExam,attempts)')&&mistake.includes('QUESTION BY QUESTION · TARGET ONLY')&&mistake.includes('今は後回しの問題'))ok('間違い直しを60=A / 70=A+B / 75=A+B+Cに限定');else fail('間違い直しの目標点フィルタ')
if(paper.includes('今直す問題')&&paper.includes('gradeInTarget(strategy.target,item.grade)')&&paper.includes('今は後回しの問題')&&paper.includes('nextLearningAction(strategy.target)'))ok('採点直後も共通次アクションで目標範囲を先に直す');else fail('採点直後の目標点フィルタ')

const manifestIds=[...manifest.matchAll(/'(\d{4}-Q[^']+)':/g)].map(x=>x[1])
if(manifestIds.length===160&&new Set(manifestIds).size===160&&questionIds.every(id=>manifestIds.includes(id)))ok('全160小問に固定表示マップ');else fail(`固定表示マップ ${manifestIds.length}/160`)
if(!focusRules.includes('pageDistribution')&&!focusRules.includes('questionStart')&&focusRules.includes('questionFocusManifest')&&focusRules.includes('questionFocusFor'))ok('均等配分・位置推定を廃止');else fail('位置推定ロジックが残っている')
if(focus.includes('全年度・位置確認済み')&&focus.includes('focus-common-block')&&focus.includes('focus-current-block')&&focus.includes('原本ページ全体を確認')&&styles.includes('.shared-task-note'))ok('確認済み小問・共通条件・原本フォールバック');else fail('固定表示UI')
if(!focus.includes('<figcaption')&&!styles.includes('.focus-slice figcaption')&&focus.includes('問題文の上にはUIを重ねません'))ok('問題画像上にラベル・UIを重ねない');else fail('問題文に重なる画像内UIが残っている')
if(manifest.includes("'2021-Q2-1'")&&manifest.includes('"sharedTask":true')&&manifest.includes("'2022-Q3-2-i'")&&manifest.includes("'2022-Q3-2-ii'"))ok('共通文章型・枝番小問を個別管理');else fail('特殊小問マップ')
if(examConfig.includes('2023:[[4,5],[6],[7],[8,9],[10]]'))ok('2023年度 大問4=8・9頁 / 大問5=10頁');else fail('2023ページ割り当て')
if(manifest.includes("'2023-Q5-1':{\"common\":[{\"page\":10")&&manifest.includes("'2023-Q5-3':{\"common\":[{\"page\":10"))ok('2023大問5は10頁だけ');else fail('2023大問5マップ')
if(!paper.includes('OFFICIAL ANSWERS')&&!paper.includes('answerImage(')&&!paper.includes('answerPages'))ok('過去問採点の公式解答ページ全体表示を廃止');else fail('公式解答全体が残っている')

const answerData=read('src/data/examAnswers.ts'),answerIds=[...answerData.matchAll(/'(\d{4}-Q[^']+)':E/g)].map(x=>x[1])
if(answerIds.length===160&&questionIds.every(id=>answerIds.includes(id))&&new Set(answerIds).size===160)ok('全160小問の正答データ');else fail(`正答データ ${answerIds.length}/160`)

const backup=read('src/dataBackup.ts'),migration=read('src/dataMigration.ts'),version=read('src/version.ts'),publicVersion=read('public/version.json')
if(migration.includes('CURRENT_DATA_VERSION=6')&&backup.includes('GUIDED_PROGRESS_STORAGE_KEY')&&migration.includes('MIGRATION_BACKUP_STORAGE_KEY')&&migration.includes('更新前バックアップ')&&version.includes("APP_VERSION='0.17.8'")&&publicVersion.includes('"appVersion": "0.17.8"')&&publicVersion.includes('"dataVersion": 6'))ok('v0.17.8・data v6・migration前バックアップ');else fail('版・データ形式整合')

const guidedData=JSON.parse(read('src/data/guidedSolutions.json')),guidedIds=Object.keys(guidedData.solutions||{})
if(guidedData.count===160&&guidedIds.length===160&&questionIds.every(id=>guidedIds.includes(id))&&guidedIds.every(id=>Array.isArray(guidedData.solutions[id].steps)&&guidedData.solutions[id].steps.length>=2))ok('160小問すべてに問題専用GuidedSolution');else fail(`GuidedSolution ${guidedIds.length}/160`)
if(guided.includes('ヒント1')&&guided.includes('さらにヒント')&&guided.includes('STEPの答え')&&guided.includes('解説を閉じて自力再現へ'))ok('3段階ヒント・自力再現UX');else fail('GuidedSolution UX')
if(read('src/pages/Remediation.tsx').includes('recordRemediationAttempt')&&read('src/pages/Remediation.tsx').includes('ensureRemediationProgress')&&guided.includes('&q=${encodeURIComponent(q.id)}'))ok('類題4問連続正解を元問題の習得状態へ接続');else fail('類題4問の習得接続')


const eta=read('src/targetEta.ts')
if(home.includes('goalDayEstimates')&&home.includes('約${estimate.days}日')&&home.includes('1日最大10課題')&&eta.includes('DEFAULT_DAILY_TASK_CAPACITY=10')&&eta.includes('targetGoalLabel(target)')&&eta.includes('Math.ceil(remainingUnits/cap)'))ok('A60/B70/C75の推定残り日数UX');else fail('目標別残り日数UX')

const dailyPlan=read('src/dailyPlan.ts')
if(dailyPlan.includes('slice(0,10)')&&dailyPlan.includes("grade==='A'")&&dailyPlan.includes("target>=70")&&dailyPlan.includes("target>=75")&&dailyPlan.includes('practiceStreak')&&dailyPlan.includes('completedIds')&&dailyPlan.includes('buildOptionalNextTask'))ok('今日やることは最大10件・目標帯・定着進捗を反映');else fail('今日やることロジック')
if(read('src/targetStrategy.ts').includes("target===60?'A 60点':target===70?'B 70点':'C 75点'")&&read('src/targetStrategy.ts').includes("grade==='A'||(grade==='B'&&target>=70)||(grade==='C'&&target>=75)"))ok('学習目標A60/B70/C75と問題帯A/A+B/A+B+Cを維持');else fail('学習目標ロジック')

const html=read('index.html'),robots=read('public/robots.txt')
if(html.includes('noindex, nofollow, noarchive, nosnippet')&&robots.includes('Disallow: /'))ok('検索エンジン非掲載設定');else fail('noindex/robots')
if(read('src/main.tsx').includes('bootstrapSafety()')&&read('src/main.tsx').includes("'./homeRoute.css'")&&read('src/safetyStorage.ts').includes("'pre_upgrade'")&&backup.includes('best-effort rollback'))ok('更新前退避・新UI・ロールバック');else fail('更新安全基盤')

if(!process.exitCode)console.log('SELF-CHECK PASSED')

if(home.includes('時間があれば先へ進む')&&home.includes('最大10件')&&dailyPlan.includes('slice(0,10)')&&dailyPlan.includes('limit:10'))ok('1日最大10課題＋完了後の任意継続UX');else fail('10課題＋任意継続UX')
