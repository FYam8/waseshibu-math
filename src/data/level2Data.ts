import coreJson from './level2/level2_master_2019_2026.json'
import supportJson from './level2/field_support_questions.json'
import assignmentsJson from './level2/level2_field_assignments.json'
import poolJson from './level2/practice_pool_index.json'
import sourceMapJson from './level2/source_to_level2_map.json'
import questionsJson from './questions.json'
import guidedJson from './guidedSolutions.json'
import { getExamAnswer } from './examAnswers'
import type { MajorQuestion } from '../types'

export type Level2Question={
  id:string
  sourceYear?:number
  sourceQuestionId:string|null
  suggestedFieldId?:string
  fieldId?:string
  status:string
  selectable?:boolean
  backlogReason?:string
  contentVerified:boolean
  materialized:boolean
  context?:string
  prompt:string
  answer:string
  acceptedAnswers?:string[]
  explanation:string
  problemFigure?:string|null
  hintFigure?:string|null
  explanationFigure?:string|null
  problemTable?:{
    caption?:string
    headers:string[]
    rows:string[][]
  }
  contentRevision?:number
  gradingRevision?:number
  answerSpec?:{
    type:string
    elements?:string[]
    orderIndependent?:boolean
    pairs?:Array<{left:string[];right:string[]}>
    allowEquivalentCyclicOrReversedNotation?:boolean
  }
  bankType?:string
  officialYear?:number
  officialMajor?:number
  officialSubNo?:string
  officialSubIndex?:number
  officialSubCount?:number
}

export type Level2Field={
  fieldId:string
  label:string
  coreQuestionIds:string[]
  officialPastQuestionIds?:string[]
  supportQuestionIds:string[]
  masteryEligibleQuestionIds:string[]
  masteryEligibleCount:number
  fourStreakReady:boolean
}

type Assignment={questionId:string;fieldId:string;assignmentRevision:number;practiceFieldIds:string[]}

const explanationOverrides:Record<string,string>={
  'L2-2022-Q1-2':'x²−5x−14を因数分解する。積が−14、和が−5になる2数は−7と2なので、x²−5x−14=(x−7)(x+2)。したがって(x−7)(x+2)=0より、x=7またはx=−2。',
  'L2-2022-Q2-2':'Aはl上、Bはm上なのでA=(t,t²/3)、B=(t,10/t)。したがってC=(0,10/t)、D=(0,t²/3)で、ABCDは幅t、縦CD=10/t−t²/3の長方形。Q=(q,q²/3)(q>0)とおくと、△CDQは底辺CD、高さqだから面積は(1/2)×CD×q。一方、四角形ABCDの面積はt×CD。両者が等しいので(1/2)×CD×q=t×CDよりq=2t。よってQ=(2t,(4/3)t²)。',
  'L2-2022-Q4-2':'各スイッチに隣接する廊下は①が2本、②が3本、③が3本、④が4本、⑤が4本。2つのスイッチを押すと、両方に接する廊下があればその廊下は2回反転して消灯に戻り、それ以外の隣接廊下は1回反転して点灯する。したがって点灯数は「2つの隣接本数の和」から、2つを直接結ぶ廊下があるとき2を引けばよい。これが4になる組は{①,④},{①,⑤},{②,③}の3組。順序を区別するため各組2通りあり、3×2=6通り。',
  'L2-2022-Q4-3':'電灯は反転回数が奇数のときだけ点灯するので、同じ3つのスイッチを1回ずつ押すなら順序を変えても最終状態は同じ。3つを押したとき、点灯するのは「押した側と押していない側を結ぶ廊下」だけである。そこで押さない2つのスイッチを見る。①〜⑤の隣接本数は2,3,3,4,4本で、押さない2つを直接結ぶ廊下がある場合はその1本を2回数えているので2を引く。点灯数が4になる押さない組は{①,④},{①,⑤},{②,③}の3組。したがって押す3個の組は{②,③,⑤},{②,③,④},{①,④,⑤}の3組。各組の押す順序は3!=6通りなので、3×6=18通り。',
  'L2-2022-Q5-2':'対角面ACGEで考える。P,Qは△ABDのAB,ADの中点なのでPQ∥BDで、PQはBDをA中心に1/2に縮めた位置にある。BDとACの交点をM、PQとACの交点をJとすると、Mは正方形ABCDの中心だからAM=AC/2、したがってAJ=AM/2=AC/4。次に立方体ではBD∥FHなのでPQ∥FH。Fは平面PQF上にあるから、Fを通りPQに平行な直線FHも平面PQF上にある。FHとEGの交点をKとすると、FHとEGは正方形EFGHの対角線なのでKはEGの中点、よってGK=EG/2=AC/2。J,Kはともに平面PQFと対角面ACGE上にあるため、その2平面の交線はJK。IはAGと平面PQFの交点なのでIはJK上にある。AC∥EGより△IAJ∽△IGK。したがってAI:IG=AJ:GK=(AC/4):(AC/2)=1:2。',
  'L2-2023-Q3-2':'食品A 1gあたりのタンパク質は40/200=0.2g、脂質は20/200=0.1g。食品Bはタンパク質25/250=0.1g、脂質15/250=0.06g。したがって0.2a+0.1b=35、0.1a+0.06b=19。小数を消すと2a+b=350、5a+3b=950。1式を3倍して6a+3b=1050とし、2式を引くとa=100。2a+b=350に戻してb=150。よって(a,b)=(100,150)。',
  'L2-2023-Q3-3':'1gあたりの成分量から、0.2a+0.1b+0.05c=32、0.1a+0.06b+0.1c=26、0.05a+0.12b+0.4c=64。小数を消して整理すると①4a+2b+c=640、②5a+3b+5c=1300、③5a+12b+40c=6400。①よりc=640−4a−2b。これを②へ代入すると15a+7b=1900、③へ代入すると155a+68b=19200。後式から前式の10倍を引くと5a−2b=200。これを3倍して15a−6b=600とし、15a+7b=1900との差をとると13b=1300なのでb=100。5a−2b=200よりa=80、①よりc=120。よって(a,b,c)=(80,100,120)。',
  'L2-2024-Q1-5':'正方形の1辺をsとする。AD=AB=AE=sなので△ADEはAD=AEの二等辺三角形。∠DAE=90°−60°=30°だから、∠ADE=(180°−30°)/2=75°。よって∠CDE=90°−75°=15°。また正三角形ABEでEA=EBだからEはABの垂直二等分線上にある。正方形ではABとCDは平行で同じ長さなので、この直線はCDの垂直二等分線でもある。したがってCE=DE。△CDEは二等辺三角形だから∠ECD=∠CDE=15°。',
  'L2-2024-Q2-3':'A=(4,8)、B=(1,1)なので△OABの面積は|4×1−8×1|/2=2。C=(t,t²/2)とおくと、△OACの面積は|4×(t²/2)−8t|/2=|t²−4t|。したがって|t²−4t|=2。絶対値を外して、①t²−4t=2よりt=2±√6、②t²−4t=−2よりt=2±√2。Cのy座標が8より大きいのでt²/2>8、すなわち|t|>4。4つの候補でこれを満たすのはt=2+√6だけ。よってCのx座標は2+√6。',
  'L2-2024-Q3-3':'順に引く3枚を(p,q,r)とすると全体は6×5×4=120通り。Aは「qが3数の最大値」であることと同じ。3枚の数字の選び方は6C3=20通りで、各組について最大値をqに置いた後、残る2数をp,rへ置く方法が2通りあるのでAは20×2=40通り。Bは3数の和が奇数。1〜6には奇数3枚、偶数3枚があり、和が奇数になるのは「奇数1枚・偶数2枚」または「奇数3枚」。前者は3×3C2×3!=54通り、後者は3C3×3!=6通り、合計60通り。AかつBについて、Bを満たす順不同の3枚組は60÷3!=10組あり、各組で最大値をqに置き、残る2数をp,rへ置く2通りがあるので20通り。したがってAまたはBは40+60−20=80通り、確率は80/120=2/3。',
  'L2-2024-Q4-2':'A=(0,0),B=(10,0),C=(10,6),D=(0,6)と置く。対角線BDの傾きは−3/5。0<t<2ではP=(4t,0)、Q=(10,3t)でPQの傾きは正なのでBDと平行にならない。2≤t≤5/2ではP=(4t,0)、Q=(16−3t,6)。PQの傾き6/(16−7t)を−3/5とするとt=26/7となり、この区間に入らない。したがって最初に可能性があるのは5/2<t<4。ここではP=(10,4t−10)、Q=(16−3t,6)なので、PQの傾きは(16−4t)/(6−3t)。これを−3/5に等しくして5(16−4t)=−3(6−3t)。整理すると98=29t、よってt=98/29。これは5/2<t<4を満たすので、最初の時刻は98/29秒後。',
  'L2-2024-Q4-3':'A=(0,0),B=(10,0),C=(10,6),D=(0,6)と置く。P=(x1,y1),Q=(x2,y2)なら△APQの面積は(1/2)|x1y2−y1x2|で求められる。P,Qがいる辺が変わる時刻で区間を分ける。①0<t<2ではP=(4t,0),Q=(10,3t)なので面積6t²。6t²=18よりt=√3。②2≤t≤5/2ではP=(4t,0),Q=(16−3t,6)なので面積12t≥24で18にならない。③5/2<t≤4ではP=(10,4t−10),Q=(16−3t,6)。面積は(1/2)|60−(4t−10)(16−3t)|=6t²−47t+110。これを18とすると6t²−47t+92=0よりt=23/6,4。④4<t≤16/3ではP,QともCD上で、P=(26−4t,6),Q=(16−3t,6)。面積は3(10−t)<18。⑤16/3<t≤13/2ではP=(26−4t,6),Q=(0,22−3t)なので面積は(1/2)(26−4t)(22−3t)。両因子はこの区間で減少し、左端でも面積14なので18未満。⑥13/2<t≤22/3ではP,QともDA上だから面積0。⑦22/3<t≤8ではP=(0,32−4t),Q=(3t−22,0)なので面積は(1/2)(32−4t)(3t−22)。ここでは0≤32−4t≤8/3、0≤3t−22≤2だから面積は高くても8/3<18。⑧8<t<10ではP,QともAB上なので面積0。したがって求める時刻はt=√3,23/6,4。',
  'L2-2024-Q5-2':'正方形の1辺をsとする。∠CDE=30°の直角三角形DCEよりCE=s/√3。したがってAF=3CE=√3sで、直角三角形ADFはAD:AF=1:√3だから∠ADF=60°。条件∠ADF=2∠GDAより∠GDA=30°。△ADGは∠A=90°の30°・60°・90°三角形なのでAG=s/√3。よってBG=AB−AG=s−s/√3。一方、BE=BC−CE=s−s/√3だからBG=BE。AB⊥BCより△BGEはBを直角とする直角二等辺三角形で、∠BGE=45°。また△ADGで∠AGD=60°、GAとGBは反対向きなので∠DGB=180°−60°=120°。したがって∠DGE=120°−45°=75°。',
  'L2-2024-Q5-3':'B=(0,0),C=(√3,0),A=(0,√3),D=(√3,√3)と置く。前問までよりCE=1、AG=1なのでE=(√3−1,0)、G=(0,√3−1)。またAF=3よりF=(0,√3+3)。直線DGの傾きは1/√3=√3/3なので、DG:y=(√3/3)x+√3−1。直線EFの傾きは−(√3+3)/(√3−1)=−(3+2√3)なので、EF:y=−(3+2√3)x+√3+3。連立するとO=((14√3−18)/11,(3+5√3)/11)。△GBEはBで直角、GB=BE=√3−1だから面積は(√3−1)²/2=2−√3。△DOEは座標の面積公式より(1/2)|det(O−D,E−D)|=(6√3−3)/11。したがって△GBE:△DOE=(2−√3):((6√3−3)/11)。比を整理すると(3√3−4):3。',
  'L2-2025-Q1-8':'1764=42²なので、積が1764となる正の2数の和は2数が42に近いほど小さくなる。ただし42×42は同じ数なので使えない。そこで42より小さい約数を42に近い方から調べる。41,40,39,38,37はいずれも1764を割り切らず、36は1764を割り切って1764=36×49となる。したがって異なる2数で最も42に近い組は36と49で、和の最小値は36+49=85。',
  'L2-2025-Q5-1':'BCは中心Oを通る直径なのでBC=10。座標をO=(0,0)、BCをx軸と考える。AH=3よりAのy座標は3で、OA=5だからx座標は±√(25−9)=±4。図の位置に合わせてA=(4,3)とすると、AD∥BCなのでADは水平な弦で、もう一方の円との交点はD=(−4,3)。よってAD=4−(−4)=8。台形ABCDの高さは3だから、面積は(10+8)×3÷2=27。',
  'L2-2025-Q5-2':'O=(0,0),B=(5,0),C=(−5,0)と置くと、AH=3、OA=5よりA=(4,3)、AD∥BCよりD=(−4,3)。直線ACの傾きは(3−0)/(4−(−5))=1/3なのでAC:y=(x+5)/3。直線ODの傾きは3/(−4)=−3/4なのでOD:y=−3x/4。交点Eでは(x+5)/3=−3x/4だから4x+20=−9x、13x=−20よりx=−20/13、y=15/13。したがってE=(−20/13,15/13)。Oを原点とする三角形の面積公式より、△AOEの面積は|4×15/13−3×(−20/13)|÷2=60/13。',
  'L2-2025-Q5-3':'座標をA=(4,3),B=(5,0),C=(−5,0),D=(−4,3)と置くと、Dを通りACに平行な直線とx軸の交点はF=(−13,0)。AD=8、BF=18、高さ3の台形ADFBだから面積は(8+18)×3÷2=39。PはABの中点なのでP=(9/2,3/2)。△ADPは底辺AD=8、高さ3−3/2=3/2より面積6。さらに△DFPは座標の面積公式で(1/2)|det(F−D,P−D)|=39/2。DQ/DF=uとおく。△DQPと△DFPは頂点Pから直線DFへの高さが共通なので、面積比もDQ:DF=u:1、したがって△DQPの面積はu×39/2。PQが四角形ADFBを2等分するので、片側の面積は39/2。よって6+(39/2)u=39/2からu=9/13。AD∥CFかつDF∥ACなのでADFCは平行四辺形で、DF=AC=3√10。したがってDQ=(9/13)×3√10=27√10/13。',
  'L2-2026-Q1-6':'−4xを2x−6xと分けると、x²−xy−4x+6y−12=x²−xy+2x−6x+6y−12。前半3項はx(x−y+2)、後半3項は−6(x−y+2)とくくれる。したがってx(x−y+2)−6(x−y+2)=(x−6)(x−y+2)。',
  'L2-2026-Q1-8':'最初の量をA=a g、B=b gとする。1回目にBからb/3 gをAへ移すので、Aの食塩量は0.12a+0.24×(b/3)=0.12a+0.08b、全体量はa+b/3。これが18%だから(0.12a+0.08b)/(a+b/3)=0.18。整理すると0.12a+0.08b=0.18a+0.06b、0.02b=0.06aよりb=3a。1回目後のBは2b/3、Aはa+b/3である。次にAの4分の1をBへ戻すので、Bの量は2b/3+(a+b/3)/4=200。b=3aを代入すると2a+(2a)/4=200、(5/2)a=200よりa=80。したがってb=240。'
}

export const LEVEL2_ASSIGNMENT_SET_REVISION=Number(assignmentsJson.assignmentSetRevision||1)
export const level2Assignments=assignmentsJson.assignments as Assignment[]
const assignmentById=new Map(level2Assignments.map(x=>[x.questionId,x]))

const allCore=(coreJson as Level2Question[]).map(q=>({...q,explanation:explanationOverrides[q.id]??q.explanation,sourceQuestionId:q.sourceQuestionId??null,bankType:'core160'}))
export const backlogLevel2Questions=allCore.filter(q=>q.status==='backlog'||q.selectable===false)
const core=allCore.filter(q=>!backlogLevel2Questions.includes(q))
const support=(supportJson as Level2Question[]).map(q=>({...q,sourceQuestionId:null,bankType:'field-support'}))
const guidedSolutions=(guidedJson as unknown as {solutions:Record<string,{fullExplanation?:string[]}>}).solutions
const officialPast=(questionsJson.questions as MajorQuestion[]).filter(major=>major.year>=2019&&major.year<=2021).flatMap(major=>major.subquestions.map((sub,subIndex)=>{
  const id=`${major.id}-${sub.no}`,expected=getExamAnswer(id),solution=guidedSolutions[id]
  if(!expected)throw new Error(`公式過去問 ${id} の正答がありません`)
  return {
    id,sourceYear:major.year,sourceQuestionId:id,suggestedFieldId:currentFieldIdForStoredId(`L2-${id}`),status:'final',contentVerified:true,materialized:true,
    prompt:'',answer:expected.answer,acceptedAnswers:expected.acceptedAnswers,explanation:solution?.fullExplanation?.join(' ')||'公式解答とステップ解説を確認してください。',
    problemFigure:null,hintFigure:null,explanationFigure:null,contentRevision:1,gradingRevision:1,bankType:'past-paper',
    officialYear:major.year,officialMajor:major.major,officialSubNo:sub.no,officialSubIndex:subIndex,officialSubCount:major.subquestions.length
  } satisfies Level2Question
}))
export const level2Questions:Level2Question[]=[...core,...officialPast,...support]
export const level2QuestionById=new Map(level2Questions.map(q=>[q.id,q]))
export const level2Fields=poolJson.fields as Level2Field[]
export const level2FieldById=new Map(level2Fields.map(f=>[f.fieldId,f]))
export const directLevel2BySource=new Map(sourceMapJson.map.map(x=>[x.sourceQuestionId,x.level2QuestionId]))

function storedAssignmentId(questionId:string){return /^20(?:19|20|21)-Q/.test(questionId)?`L2-${questionId}`:questionId}
function currentFieldIdForStoredId(questionId:string){return assignmentById.get(questionId)?.fieldId||allCore.find(q=>q.id===questionId)?.fieldId||allCore.find(q=>q.id===questionId)?.suggestedFieldId||''}
export function currentFieldId(questionId:string){
  const storedId=storedAssignmentId(questionId)
  return currentFieldIdForStoredId(storedId)||level2QuestionById.get(questionId)?.fieldId||level2QuestionById.get(questionId)?.suggestedFieldId||''
}

export function assignmentRevision(questionId:string){return assignmentById.get(storedAssignmentId(questionId))?.assignmentRevision||1}

export function level2FigureUrl(path?:string|null){
  if(!path)return null
  return `${import.meta.env.BASE_URL}level2/${path}`
}

export function directQuestionForSource(sourceQuestionId:string){
  const id=directLevel2BySource.get(sourceQuestionId)
  return id?level2QuestionById.get(id):undefined
}

export function resolveLevel2FieldId(topicOrId:string){
  if(level2FieldById.has(topicOrId))return topicOrId
  const byLabel=level2Fields.find(f=>f.label===topicOrId)
  if(byLabel)return byLabel.fieldId
  if(/平方根|根号|近似|小数部分/.test(topicOrId))return 'square-roots'
  if(/動点|速さ|追いつき|歩行|移動|グラフ/.test(topicOrId))return 'coordinates'
  return ''
}
