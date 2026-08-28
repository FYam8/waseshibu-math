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
for(const route of ['"/years"','"/past-papers"','"/reinforce"','"/remediate"','"/report"','"/data"'])if(!app.includes(route))fail(`route missing ${route}`)
if(['ホーム','学習する','演習ライブラリ','学習記録','データ管理'].every(x=>layout.includes(x))&&!layout.includes('端末間同期</NavLink>'))ok('5タブの学習導線');else fail('ナビゲーション')
if(Array.from({length:8},(_,i)=>`n:${i+1}`).every(x=>home.includes(x))&&home.includes('2019〜2023該当問題＋類題4問'))ok('ホームに8段階ルート');else fail('8段階ルート')

const route=read('src/learningRoute.ts')
if(route.includes('usedOldQuestionIds')&&route.includes('ensureReinforcementPlan')&&route.includes('reinforcementComplete')&&route.includes('actualDone&&mastered'))ok('未使用過去問の予約と補強完了条件');else fail('補強状態機械')

const paper=read('src/pages/PastPapers.tsx'),styles=read('src/styles.css')
if(paper.includes('className={`exam-workspace')&&paper.includes('problem-pane card')&&paper.includes('answer-dock card')&&paper.includes('OFFICIAL ANSWERS'))ok('問題・入力・公式解答の同画面化');else fail('統合ワークスペース')
if(paper.includes("['recoverable','本来取れた']")&&paper.includes("['difficult','今は難しい']")&&paper.includes("['time','時間があれば']")&&paper.includes('reproducibleScore'))ok('4分類と3種類の得点');else fail('診断指標')
if(paper.includes('answers,approaches,flags,diagnoses')&&paper.includes('seconds,majorIndex,phase'))ok('途中解答・迷い・タイマーの自動保存');else fail('途中状態保存')
if(paper.includes("['分数','/']")&&paper.includes("['√','√()']")&&paper.includes("['x²','^2']"))ok('数式入力パッド');else fail('数式入力パッド')
if(styles.includes('grid-template-columns:minmax(0,1.65fr)')&&styles.includes('.answer-dock{position:sticky')&&styles.includes('.answer-dock{position:fixed')&&styles.includes('.floating-timer{position:fixed'))ok('デスクトップ2ペイン・スマホ解答ドック・小型タイマー');else fail('レスポンシブ試験UI')

const reinforcement=read('src/pages/Reinforcement.tsx'),remediation=read('src/pages/Remediation.tsx')
if(reinforcement.includes('oldQuestionBank()')&&reinforcement.includes('markOldQuestionCompleted')&&reinforcement.includes('examPages[item.year]')&&reinforcement.includes('/remediate?topic='))ok('該当過去問から類題への補強画面');else fail('補強画面')
if(remediation.includes('nextStreak>=4')&&remediation.includes('mastery-')&&remediation.includes('/reinforce?source='))ok('類題4問連続正解とルート復帰');else fail('類題克服ルール')
const remedyData=read('src/data/remediation.ts'),fieldCount=[...remedyData.matchAll(/^\s{4}id: '[^']+'/gm)].length,questionCount=[...remedyData.matchAll(/\{prompt:/g)].length
if(fieldCount===18&&questionCount===72)ok('18分野×4問=72問');else fail(`${fieldCount}分野・${questionCount}問`)

const data=read('src/pages/DataManager.tsx')
if(data.includes("'waseshibu-math-exam-drafts-v2'")&&data.includes("'waseshibu-math-learning-route-v1'")&&data.includes('download(collect())')&&data.includes("mode==='replace'")&&data.includes("mode==='merge'"))ok('全学習状態のローカル書き出し・入れ替え・統合');else fail('データ管理')
if(!layout.includes('SyncBadge')&&!layout.includes('GitHub Private Repository'))ok('学習データは端末保存へ統一');else fail('旧同期表示が残っている')

if(!process.exitCode)console.log('SELF-CHECK PASSED')
