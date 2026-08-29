import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd(),read=p=>fs.readFileSync(path.join(root,p),'utf8')
const fail=msg=>{console.error(`FAIL: ${msg}`);process.exitCode=1},ok=msg=>console.log(`OK: ${msg}`)
const q=JSON.parse(read('src/data/questions.json')),majors=q.questions||[]

if(majors.length===40)ok('2019〜2026年度の全40大問');else fail(`大問数 ${majors.length}`)
for(const year of [2019,2020,2021,2022,2023,2024,2025,2026])if(majors.filter(x=>x.year===year).length!==5)fail(`${year}年度が5大問ではない`)
if(majors.reduce((n,x)=>n+x.subquestions.length,0)===160)ok('全8年160小問');else fail('全小問数')
if(majors.find(x=>x.year===2019&&x.major===1)?.subquestions.length===9&&[2020,2021,2022,2023,2024,2025,2026].every(y=>majors.find(x=>x.year===y&&x.major===1)?.subquestions.length===8))ok('大問1の小問数');else fail('大問1の小問数')

let examImages=0,answerImages=0
for(const year of [2019,2020,2021,2022,2023,2024,2025,2026]){
  const examDir=path.join(root,`public/exam-pages/${year}`),answerDir=path.join(root,`public/exam-answers/${year}`)
  examImages+=fs.readdirSync(examDir).filter(x=>x.endsWith('.jpg')).length
  answerImages+=fs.readdirSync(answerDir).filter(x=>x.endsWith('.jpg')).length
  for(const kind of ['問題','解答'])if(!fs.existsSync(path.join(root,`public/past-papers/${year}_数学_${kind}.pdf`)))fail(`${year} ${kind}PDF missing`)
}
if(examImages===47&&answerImages===10)ok('全問題47ページ・公式解答10ページ');else fail(`画像数 ${examImages}/${answerImages}`)

const app=read('src/App.tsx'),layout=read('src/components/Layout.tsx'),home=read('src/pages/Home.tsx')
const html=read('index.html'),robots=read('public/robots.txt')
if(html.includes('noindex, nofollow, noarchive, nosnippet')&&robots.includes('Disallow: /'))ok('検索エンジン非掲載設定');else fail('noindex/robots')
for(const route of ['"/years"','"/past-papers"','"/setup-check"','"/reinforce"','"/remediate"','"/report"','"/data"'])if(!app.includes(route))fail(`route missing ${route}`)
if(['ホーム','学習する','演習ライブラリ','学習記録','データ管理'].every(x=>layout.includes(x))&&!layout.includes('端末間同期</NavLink>'))ok('5タブの学習導線');else fail('ナビゲーション')
if(Array.from({length:8},(_,i)=>`n:${i+1}`).every(x=>home.includes(x))&&home.includes('入力・自動採点チェック5問')&&home.includes('draftResume'))ok('準備5問・途中再開・8段階ルート');else fail('段階ルート')

const route=read('src/learningRoute.ts')
if(route.includes('usedOldQuestionIds')&&route.includes('ensureReinforcementPlan')&&route.includes('reinforcementComplete')&&route.includes('actualDone&&mastered'))ok('未使用過去問の予約と補強完了条件');else fail('補強状態機械')

const paper=read('src/pages/PastPapers.tsx'),styles=read('src/styles.css')
if(paper.includes('className={`exam-workspace')&&paper.includes('problem-pane card')&&paper.includes('answer-dock card')&&paper.includes('OFFICIAL ANSWERS'))ok('問題・入力・公式解答の同画面化');else fail('統合ワークスペース')
const answerData=read('src/data/examAnswers.ts'),answerIds=[...answerData.matchAll(/'(\d{4}-Q[^']+)':E/g)].map(x=>x[1]),questionIds=majors.flatMap(m=>m.subquestions.map(s=>`${m.id}-${s.no}`))
if(answerIds.length===160&&questionIds.every(id=>answerIds.includes(id))&&new Set(answerIds).size===160)ok('全160小問の自動採点正答');else fail(`正答データ ${answerIds.length}/160`)
if(paper.includes('isExamAnswerCorrect')&&paper.includes("'correct'|'wrong'|'unanswered'")&&paper.includes('正解に修正')&&!paper.includes('すぐ立った')&&!paper.includes('考えて立った'))ok('自動採点・未回答判定・誤判定修正');else fail('過去問自動採点')
const preflight=read('src/preflight.ts'),prep=read('src/pages/PrepCheck.tsx')
if(preflight.includes('expected2024')&&preflight.includes('year2024Count!==20')&&preflight.includes('answerIds.length!==160')&&paper.includes('runExamIntegrityCheck')&&prep.includes('prepQuestions.length'))ok('全160問・2024年度20問の実行時安全検査と準備5問');else fail('準備・安全検査')
if(paper.includes('answers,flags')&&paper.includes('overrides,seconds,majorIndex,phase'))ok('途中解答・迷い・採点修正・タイマーの自動保存');else fail('途中状態保存')
if(paper.includes("['分数','/']")&&paper.includes("['√','√()']")&&paper.includes("['x²','^2']"))ok('数式入力パッド');else fail('数式入力パッド')
if(styles.includes('grid-template-columns:minmax(0,1.65fr)')&&styles.includes('.answer-dock{position:sticky')&&styles.includes('.answer-dock{position:fixed')&&styles.includes('.floating-timer{position:fixed'))ok('デスクトップ2ペイン・スマホ解答ドック・小型タイマー');else fail('レスポンシブ試験UI')

const reinforcement=read('src/pages/Reinforcement.tsx'),remediation=read('src/pages/Remediation.tsx')
if(reinforcement.includes('oldQuestionBank()')&&reinforcement.includes('markOldQuestionCompleted')&&reinforcement.includes('isExamAnswerCorrect')&&reinforcement.includes('/remediate?topic='))ok('該当過去問の自動採点から類題への補強画面');else fail('補強画面')
if(remediation.includes('nextStreak>=4')&&remediation.includes('mastery-')&&remediation.includes('/reinforce?source='))ok('類題4問連続正解とルート復帰');else fail('類題克服ルール')
const remedyData=read('src/data/remediation.ts'),fieldCount=[...remedyData.matchAll(/^\s{4}id: '[^']+'/gm)].length,questionCount=[...remedyData.matchAll(/\{prompt:/g)].length
if(fieldCount===18&&questionCount===72)ok('18分野×4問=72問');else fail(`${fieldCount}分野・${questionCount}問`)

const data=read('src/pages/DataManager.tsx')
const backup=read('src/dataBackup.ts')
if(backup.includes("'waseshibu-math-exam-drafts-v2'")&&backup.includes("'waseshibu-math-learning-route-v1'")&&backup.includes("'waseshibu-math-prep-check-v1'")&&backup.includes('restoreBackup')&&backup.includes('best-effort rollback')&&data.includes('download(collectBackup())'))ok('準備を含む全学習状態のバックアップ・検証・復元・ロールバック');else fail('データ管理')
const answer=read('src/answer.ts')
if(answer.includes(".normalize('NFKC')")&&answer.includes('cleanAnswerInput')&&answer.includes(".replace(/[≤≦]/g,'<='")&&paper.includes('全角可'))ok('全角・半角・主要数式表記の揺れを吸収');else fail('入力表記揺れ')
if(!layout.includes('SyncBadge')&&!layout.includes('GitHub Private Repository'))ok('学習データは端末保存へ統一');else fail('旧同期表示が残っている')
const migration=read('src/dataMigration.ts'),main=read('src/main.tsx')
if(migration.includes('CURRENT_DATA_VERSION=2')&&migration.includes('migrateDataRecord')&&migration.includes('normalizePrepRecord')&&main.includes('bootstrapSafety()')&&backup.includes('dataVersion:CURRENT_DATA_VERSION'))ok('データ形式を変えない安全基盤更新と旧データ移行');else fail('データ移行')
const safety=read('src/safetyBootstrap.ts'),restore=read('src/safetyStorage.ts'),version=read('src/version.ts')
if(safety.includes('snapshot_verified')&&safety.includes('migration_validated')&&safety.includes('validateNoLoss')&&safety.includes('navigator.locks')&&restore.includes('IndexedDB')&&restore.includes("'pre_upgrade'")&&data.includes('この端末の復元ポイント'))ok('更新前退避・移行ジャーナル・内容検証・復元ポイント');else fail('更新安全基盤')
if(layout.includes('waseshibu-write-blocked')&&layout.includes('BroadcastChannel')&&version.includes('canWriteLearningData')&&paper.includes('canWriteLearningData'))ok('旧タブの保存停止と更新通知');else fail('複数タブ保護')
if(main.includes('<SafetyMode')&&read('src/SafetyMode.tsx').includes('現在データをJSON保存'))ok('起動前検査失敗時の安全モード');else fail('安全モード')
const diagnostics=read('src/diagnostics.ts')
if(data.includes('学習履歴は保護されています')&&data.includes('診断情報をJSON保存')&&data.includes('最終学習保存')&&data.includes('最新復元ポイント')&&diagnostics.includes('createDiagnosticReport')&&!diagnostics.includes("data['waseshibu-math-attempts']"+'.map'))ok('版・保存日時・復元ポイント・匿名診断情報の可視化');else fail('保護状態表示')
if(layout.includes('update-complete')&&layout.includes('UPDATE_NOTICE_SEEN_KEY')&&layout.includes('学習履歴を引き継ぎ'))ok('一度だけ表示する更新完了通知');else fail('更新完了通知')
const targetStrategy=read('src/targetStrategy.ts'),report=read('src/pages/Report.tsx'),years=read('src/pages/Years.tsx')
if(targetStrategy.includes('buildTargetStrategy')&&targetStrategy.includes('rankWeakFields')&&targetStrategy.includes('gradeInTarget')&&targetStrategy.includes('timePlan')&&paper.includes('目標まであと')&&report.includes('回収目安')&&home.includes('target-impact')&&years.includes('gradeAdvice'))ok('60・70・75点の目標差・回収候補・弱点順位・問題優先度・時間配分');else fail('目標点連動')
if(route.includes('plan.target!==target')&&route.includes('weakFieldsForStoredExam')&&reinforcement.includes('weakFieldsForStoredExam'))ok('目標変更後も補強計画と完了記録を整合');else fail('目標変更時の補強整合')
if(read('src/dataMigration.ts').includes('CURRENT_DATA_VERSION=2')&&read('public/version.json').includes('"dataVersion": 2'))ok('v0.10でもデータ形式v2を維持');else fail('データ形式据え置き')

if(!process.exitCode)console.log('SELF-CHECK PASSED')
