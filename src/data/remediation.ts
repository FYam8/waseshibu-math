export type RemedyQuestion = {
  prompt: string
  answer: string
  acceptedAnswers?: string[]
  explanation: string
}

export type RemediationField = {
  id: string
  title: string
  keywords: RegExp
  questions: RemedyQuestion[]
}

export const remediationFields: RemediationField[] = [
  {
    id: 'expressions', title: '式の計算・文字式', keywords: /数式計算|文字式の計算|文字式の変形|式の計算|式の変形|数・分数の処理/,
    questions: [
      {prompt:'3a-2(a-4)を簡単にしなさい。',answer:'a+8',acceptedAnswers:['8+a'],explanation:'3a-2a+8=a+8。'},
      {prompt:'2x+3y-(x-2y)を簡単にしなさい。',answer:'x+5y',acceptedAnswers:['5y+x'],explanation:'かっこを外すと2x+3y-x+2y=x+5y。'},
      {prompt:'4(2x-3)-5xを簡単にしなさい。',answer:'3x-12',acceptedAnswers:['-12+3x'],explanation:'8x-12-5x=3x-12。'},
      {prompt:'5(x-2)-3(x+1)を簡単にしなさい。',answer:'2x-13',acceptedAnswers:['-13+2x'],explanation:'5x-10-3x-3=2x-13。'}
    ]
  },
  {
    id: 'factoring', title: '因数分解', keywords: /因数分解/,
    questions: [
      {prompt:'x²-7x+12を因数分解しなさい。',answer:'(x-3)(x-4)',acceptedAnswers:['(x-4)(x-3)'],explanation:'積が12、和が-7になる-3と-4を使います。'},
      {prompt:'x²+x-12を因数分解しなさい。',answer:'(x+4)(x-3)',acceptedAnswers:['(x-3)(x+4)'],explanation:'積が-12、和が1になる4と-3を使います。'},
      {prompt:'2x²-8xを因数分解しなさい。',answer:'2x(x-4)',acceptedAnswers:['2(x-4)x'],explanation:'共通因数2xでくくります。'},
      {prompt:'x²-25を因数分解しなさい。',answer:'(x-5)(x+5)',acceptedAnswers:['(x+5)(x-5)'],explanation:'平方の差 x²-5² を使います。'}
    ]
  },
  {
    id: 'linear-equations', title: '一次方程式・式変形', keywords: /一次方程式|文字を含む式\/方程式|比例関係から一次式/,
    questions: [
      {prompt:'方程式 3x+5=20 を解きなさい。',answer:'5',explanation:'3x=15よりx=5。'},
      {prompt:'方程式 4(x-2)=2x+6 を解きなさい。',answer:'7',explanation:'4x-8=2x+6より2x=14。'},
      {prompt:'方程式 x/3+2=5 を解きなさい。',answer:'9',explanation:'x/3=3よりx=9。'},
      {prompt:'方程式 0.4x-1=3 を解きなさい。',answer:'10',explanation:'0.4x=4よりx=10。'}
    ]
  },
  {
    id: 'simultaneous-equations', title: '連立方程式', keywords: /連立方程式|2変数の数量関係|3変数の数量関係/,
    questions: [
      {prompt:'連立方程式 x+y=11, x-y=3 を解き、xを答えなさい。',answer:'7',explanation:'2式を足すと2x=14。'},
      {prompt:'連立方程式 2x+y=11, x-y=1 を解き、xを答えなさい。',answer:'4',explanation:'2式を足すと3x=12。'},
      {prompt:'連立方程式 x+2y=8, 3x-y=3 を解き、(x,y)で答えなさい。',answer:'(2,3)',explanation:'第2式からy=3x-3。第1式へ代入してx=2,y=3。'},
      {prompt:'連立方程式 3x+2y=16, x-y=2 を解き、(x,y)で答えなさい。',answer:'(4,2)',explanation:'x=y+2を第1式へ代入して5y=10。'}
    ]
  },
  {
    id: 'quadratic-equations', title: '二次方程式', keywords: /二次方程式|2解/,
    questions: [
      {prompt:'方程式 x²-5x+6=0 の大きい方の解を答えなさい。',answer:'3',explanation:'(x-2)(x-3)=0より解は2,3。'},
      {prompt:'方程式 x²-9=0 の正の解を答えなさい。',answer:'3',explanation:'(x-3)(x+3)=0。'},
      {prompt:'方程式 x²+2x-8=0 の小さい方の解を答えなさい。',answer:'-4',explanation:'(x+4)(x-2)=0より解は-4,2。'},
      {prompt:'方程式 2x²-7x+3=0 の大きい方の解を答えなさい。',answer:'3',explanation:'(2x-1)(x-3)=0より解は1/2,3。'}
    ]
  },
  {
    id: 'radicals', title: '平方根・近似値', keywords: /平方根|根号|近似|小数部分/,
    questions: [
      {prompt:'√50を簡単にしなさい。',answer:'5√2',acceptedAnswers:['5*√2','5sqrt(2)'],explanation:'√50=√(25×2)=5√2。'},
      {prompt:'3√8-√18を簡単にしなさい。',answer:'3√2',acceptedAnswers:['3*√2','3sqrt(2)'],explanation:'3√8=6√2、√18=3√2。'},
      {prompt:'4/√2 の分母を有理化しなさい。',answer:'2√2',acceptedAnswers:['2*√2','2sqrt(2)'],explanation:'4√2/2=2√2。'},
      {prompt:'(√3+1)(√3-1)を計算しなさい。',answer:'2',explanation:'平方の差より3-1=2。'}
    ]
  },
  {
    id: 'integers', title: '整数・約数・余り', keywords: /整数|余り|約数|因数|倍数|平方数|四捨五入/,
    questions: [
      {prompt:'84の正の約数の個数を求めなさい。',answer:'12',explanation:'84=2²×3×7より(2+1)(1+1)(1+1)=12。'},
      {prompt:'84と126の最大公約数を求めなさい。',answer:'42',explanation:'84=2×42、126=3×42。'},
      {prompt:'12と18の最小公倍数を求めなさい。',answer:'36',explanation:'12=2²×3、18=2×3²なので2²×3²=36。'},
      {prompt:'Mを6で割っても9で割っても2余ります。2桁で最小のMを求めなさい。',answer:'20',explanation:'M-2は6と9の公倍数。最小公倍数18よりM=20。'}
    ]
  },
  {
    id: 'proportion', title: '比例・反比例', keywords: /比例|反比例|1kmあたり/,
    questions: [
      {prompt:'y=3xでx=4のとき、yを求めなさい。',answer:'12',explanation:'y=3×4=12。'},
      {prompt:'反比例y=20/xでx=5のとき、yを求めなさい。',answer:'4',explanation:'20÷5=4。'},
      {prompt:'yはxに比例し、x=4のときy=10です。x=6のときのyを求めなさい。',answer:'15',explanation:'比例定数は10/4=5/2。6×5/2=15。'},
      {prompt:'y=12/xでy=3のとき、xを求めなさい。',answer:'4',explanation:'3=12/xより3x=12。'}
    ]
  },
  {
    id: 'quadratic-functions', title: '二次関数・放物線', keywords: /二次関数|放物線|曲線上/,
    questions: [
      {prompt:'放物線y=ax²が点(3,18)を通るとき、aを求めなさい。',answer:'2',explanation:'18=9aよりa=2。'},
      {prompt:'y=2x²でx=-3のとき、yを求めなさい。',answer:'18',explanation:'2×(-3)²=18。'},
      {prompt:'y=x²でxが1から3まで増えるときの変化の割合を求めなさい。',answer:'4',explanation:'(9-1)/(3-1)=4。'},
      {prompt:'y=x²で-2≦x≦3のとき、yの最大値を求めなさい。',answer:'9',explanation:'|x|が最大のx=3でy=9。'}
    ]
  },
  {
    id: 'coordinates', title: '座標・直線・面積', keywords: /座標|直線|交点|傾き|y軸|対称移動|座標関係|座標関係を文字式化/,
    questions: [
      {prompt:'点(4,-3)をx軸について対称移動した点を(x,y)で答えなさい。',answer:'(4,3)',explanation:'x座標は同じで、y座標の符号が変わります。'},
      {prompt:'点(1,3)と(5,11)を通る直線の傾きを求めなさい。',answer:'2',explanation:'(11-3)/(5-1)=2。'},
      {prompt:'直線y=2x-1とy軸の交点のy座標を求めなさい。',answer:'-1',explanation:'y軸上ではx=0。'},
      {prompt:'3点(0,0),(4,0),(0,3)を頂点とする三角形の面積を求めなさい。',answer:'6',explanation:'底辺4、高さ3なので4×3÷2=6。'}
    ]
  },
  {
    id: 'probability', title: '確率', keywords: /確率|コイン|サイコロ|カード|和条件|積の条件|複合条件|順序比較|AまたはB|取り出し/,
    questions: [
      {prompt:'2個のサイコロの和が7になる確率を求めなさい。',answer:'1/6',acceptedAnswers:['6/36'],explanation:'該当6通り、全36通りなので1/6。'},
      {prompt:'硬貨を2回投げるとき、2回とも表になる確率を求めなさい。',answer:'1/4',explanation:'表表は、表裏・裏表・裏裏と合わせた4通り中1通り。'},
      {prompt:'1〜5のカードから1枚選ぶとき、偶数である確率を求めなさい。',answer:'2/5',explanation:'偶数は2,4の2枚、全体は5枚。'},
      {prompt:'赤玉3個、白玉2個から戻さず2個取るとき、2個とも赤玉である確率を求めなさい。',answer:'3/10',explanation:'3/5×2/4=3/10。'}
    ]
  },
  {
    id: 'counting', title: '場合の数・規則性', keywords: /場合|並べ|数え上げ|規則|スイッチ|ルール|選ぶ方法|条件選択|状態の追跡/,
    questions: [
      {prompt:'1〜5のカードから2枚を同時に選ぶ方法は何通りですか。',answer:'10',explanation:'5C2=10。'},
      {prompt:'1,2,3を1回ずつ使って3桁の整数を作るとき、何個できますか。',answer:'6',explanation:'3×2×1=6。'},
      {prompt:'AからBへ3通り、BからCへ4通りの道があります。AからBを経てCへ行く方法は何通りですか。',answer:'12',explanation:'3×4=12。'},
      {prompt:'4個のスイッチをそれぞれオンかオフにするとき、状態は全部で何通りですか。',answer:'16',explanation:'各スイッチ2通りなので2⁴=16。'}
    ]
  },
  {
    id: 'statistics', title: 'データ・中央値', keywords: /中央値|平均|データ/,
    questions: [
      {prompt:'データ2,7,4,9,5の中央値を求めなさい。',answer:'5',explanation:'2,4,5,7,9の中央は5。'},
      {prompt:'データ3,5,8,10の中央値を求めなさい。',answer:'6.5',acceptedAnswers:['13/2'],explanation:'中央2数5,8の平均は6.5。'},
      {prompt:'5人の平均点が68点です。合計点を求めなさい。',answer:'340',explanation:'68×5=340。'},
      {prompt:'4人の平均点が70点です。3人の得点が65,72,68点のとき、残り1人の得点を求めなさい。',answer:'75',explanation:'合計280点から65+72+68=205点を引きます。'}
    ]
  },
  {
    id: 'angles-circles', title: '角度・円', keywords: /角度|円周角|直径|円(?!すい|柱)|おうぎ形|弦|針|六角形/,
    questions: [
      {prompt:'三角形の2つの内角が48°と67°です。残りの角を求めなさい。',answer:'65',explanation:'180-48-67=65。'},
      {prompt:'直径を見込む円周角は何度ですか。',answer:'90',explanation:'半円に対する円周角は90°。'},
      {prompt:'同じ弧に対する中心角が100°のとき、円周角を求めなさい。',answer:'50',explanation:'円周角は中心角の半分。'},
      {prompt:'半径3cmの円周の長さをπを使って答えなさい。',answer:'6π',acceptedAnswers:['6*pi','6pi'],explanation:'2πr=2π×3=6π。'}
    ]
  },
  {
    id: 'similarity', title: '相似・面積比', keywords: /相似|面積比|辺の比|辺の関係|辺の関係を文字式化|平行四辺形|平行条件|平行線|台形|平面図形|正方形|三角形の決定条件/,
    questions: [
      {prompt:'相似な三角形の辺の比が2:3です。面積比を答えなさい。',answer:'4:9',explanation:'面積比は辺の比の2乗。'},
      {prompt:'相似な図形で、短い図形の対応する辺6cm、長い図形では9cmです。短い図形の別の辺10cmに対応する長さを求めなさい。',answer:'15',explanation:'拡大率は9/6=3/2。10×3/2=15。'},
      {prompt:'相似な図形の面積比が25:49です。対応する辺の比を答えなさい。',answer:'5:7',explanation:'面積比の平方根を取ります。'},
      {prompt:'相似比が3:2です。小さい図形の周の長さが20cmのとき、大きい図形の周の長さを求めなさい。',answer:'30',explanation:'20×3/2=30。'}
    ]
  },
  {
    id: 'solids', title: '立体・体積・切断', keywords: /円柱|円すい|立方体|角すい|三角すい|四角すい|立体|体積|表面積|切断|三角柱|柱体|頂点・面/,
    questions: [
      {prompt:'1辺5cmの立方体の体積を求めなさい。',answer:'125',explanation:'5³=125。'},
      {prompt:'底面積18cm²、高さ7cmの柱体の体積を求めなさい。',answer:'126',explanation:'18×7=126。'},
      {prompt:'底面積24cm²、高さ9cmの角すいの体積を求めなさい。',answer:'72',explanation:'24×9÷3=72。'},
      {prompt:'1辺4cmの立方体の表面積を求めなさい。',answer:'96',explanation:'1面16cm²が6面なので16×6=96。'}
    ]
  },
  {
    id: 'motion', title: '動点・速さ・グラフ', keywords: /動点|速さ|追いつき|歩行|グラフ|時刻|周期|一定変化率|移動/,
    questions: [
      {prompt:'時速60kmで1.5時間進むと、何km進みますか。',answer:'90',explanation:'60×1.5=90。'},
      {prompt:'12kmの道のりを時速4kmで進むと、何時間かかりますか。',answer:'3',explanation:'12÷4=3。'},
      {prompt:'先に進む人との距離が40kmあります。時速80kmで時速60kmの人を追うと、何時間で追いつきますか。',answer:'2',explanation:'速さの差20km/hで40kmを縮めるので2時間。'},
      {prompt:'毎分5m進む点が、出発して8分後までに進む距離を求めなさい。',answer:'40',explanation:'5×8=40。'}
    ]
  },
  {
    id: 'word-problems', title: '割合・食塩水・数量文章題', keywords: /割合|食塩|濃度|売買|収支|単価|貯水|手数料|数量|文章題|水位|量が変わる|未知数を決定|捨て水/,
    questions: [
      {prompt:'12%の食塩水250gに含まれる食塩は何gですか。',answer:'30',explanation:'250×0.12=30。'},
      {prompt:'定価2000円の商品を15%引きで買います。代金はいくらですか。',answer:'1700',explanation:'2000×0.85=1700。'},
      {prompt:'800円で仕入れた品を1000円で12個売りました。利益はいくらですか。',answer:'2400',explanation:'(1000-800)×12=2400。'},
      {prompt:'10%の食塩水200gと20%の食塩水100gを混ぜます。食塩は全部で何gですか。',answer:'40',explanation:'200×0.10+100×0.20=40。'}
    ]
  }
]

export function classifyRemediationField(topic: string): RemediationField {
  return remediationFields.find(field => field.keywords.test(topic)) ?? remediationFields[0]
}

export function getRemediation(topic: string) {
  return classifyRemediationField(topic).questions
}


export type RemediationDifficulty = 'A' | 'B' | 'C'

type DifficultyBank = Partial<Record<RemediationDifficulty, RemedyQuestion[]>>

const difficultyBanks: Record<string, DifficultyBank> = {
  factoring: {
    B: [
      {prompt:'整数nについて n²-9n+20=0 を満たすnをすべて求めなさい。',answer:'4,5',acceptedAnswers:['5,4','4と5','5と4'],explanation:'n²-9n+20=(n-4)(n-5)。よってn=4,5。'},
      {prompt:'x²-11x+24=(x-a)(x-b) と因数分解でき、a<bです。b-aを求めなさい。',answer:'5',explanation:'積24、和11よりa=3,b=8。したがってb-a=5。'},
      {prompt:'x²-13x+40を因数分解し、2つの解の差を求めなさい。',answer:'3',explanation:'(x-5)(x-8)=0。解は5,8なので差は3。'},
      {prompt:'n²+3n-28=0を満たす正の整数nを求めなさい。',answer:'4',explanation:'(n+7)(n-4)=0より正の整数は4。'}
    ]
  },
  'simultaneous-equations': {
    B: [
      {prompt:'x+y=13, 2x+3y=34 を満たすとき、xyを求めなさい。',answer:'40',explanation:'x=5,y=8なのでxy=40。'},
      {prompt:'2x-y=1, x+2y=13 を満たすとき、x+yを求めなさい。',answer:'8',explanation:'x=3,y=5なので8。'},
      {prompt:'x+y+z=13, x-y=2, y-z=1 のときxを求めなさい。',answer:'6',explanation:'x=y+2,z=y-1。3y+1=13よりy=4、x=6。'},
      {prompt:'3x+2y=19, x-y=3 のとき、2x-yを求めなさい。',answer:'8',explanation:'x=y+3。5y+9=19よりy=2,x=5。2x-y=8。'}
    ]
  },
  'quadratic-equations': {
    B: [
      {prompt:'二次方程式 x²-8x+12=0 の2つの解をa<bとするとき、b-aを求めなさい。',answer:'4',explanation:'解は2,6なので差は4。'},
      {prompt:'x²-7x+k=0 の解が3と4であるとき、kを求めなさい。',answer:'12',explanation:'(x-3)(x-4)=x²-7x+12よりk=12。'},
      {prompt:'x²-5x-14=0 の2解のうち正の解を求めなさい。',answer:'7',explanation:'(x-7)(x+2)=0より正の解は7。'},
      {prompt:'2x²-9x+4=0 の2つの解の積を求めなさい。',answer:'2',explanation:'(2x-1)(x-4)=0。解は1/2,4で積は2。'}
    ]
  },
  'angles-circles': {
    B: [
      {prompt:'同じ弧ABに対する中心角∠AOBが136°です。同じ弧ABに対する円周角を求めなさい。',answer:'68',explanation:'円周角は中心角の半分で68°。'},
      {prompt:'円に内接する四角形ABCDで∠A=72°です。∠Cを求めなさい。',answer:'108',explanation:'円に内接する四角形の対角の和は180°。'},
      {prompt:'正六角形の1辺を半径とする円で、中心角120°のおうぎ形の面積を、半径を6cmとして求めなさい。πを用いて答えなさい。',answer:'12π',acceptedAnswers:['12pi','12*pi'],explanation:'36π×120/360=12π。'},
      {prompt:'直径ABの円周上に点Cがあり、∠CAB=34°です。∠ABCを求めなさい。',answer:'56',explanation:'∠ACB=90°なので180-90-34=56°。'}
    ]
  },
  'quadratic-functions': {
    B: [
      {prompt:'放物線y=ax²が点P(4,8)を通ります。この放物線上でx=6の点のy座標を求めなさい。',answer:'18',explanation:'8=16aよりa=1/2。x=6でy=18。'},
      {prompt:'y=x²上の点Q(t,t²)とx軸上の点A(t,0)があります。三角形OAQの面積が32のとき、t>0としてtを求めなさい。',answer:'4',explanation:'面積はt×t²÷2=t³/2。t³=64よりt=4。'},
      {prompt:'y=2x²と直線y=8が交わる2点のx座標の差を求めなさい。',answer:'4',explanation:'2x²=8よりx=±2。差は4。'},
      {prompt:'y=x²上の点P(3,9)と原点Oを通る直線の傾きを求めなさい。',answer:'3',explanation:'9/3=3。'}
    ]
  },
  coordinates: {
    B: [
      {prompt:'直線y=2x+1とy=-x+7の交点Pの座標を求めなさい。',answer:'(2,5)',explanation:'2x+1=-x+7よりx=2,y=5。'},
      {prompt:'点A(0,6), B(4,0)を結ぶ直線とx軸・y軸でできる三角形の面積を求めなさい。',answer:'12',explanation:'底辺4、高さ6なので12。'},
      {prompt:'直線y=ax+2が点(3,11)を通ります。aを求めなさい。',answer:'3',explanation:'11=3a+2よりa=3。'},
      {prompt:'点A(-2,0),B(4,0),C(1,6)の三角形ABCの面積を求めなさい。',answer:'18',explanation:'AB=6、高さ6なので18。'}
    ],
    C: [
      {prompt:'放物線y=x²と直線y=kx+3の交点の1つのx座標が-1です。もう1つの交点をBとするとき、原点Oと2交点でできる三角形の面積を求めなさい。',answer:'6',explanation:'x=-1を代入して1=-k+3よりk=2。交点はx=-1,3でA(-1,1),B(3,9)。△OABの面積は|(-1)×9-1×3|÷2=6。'},
      {prompt:'点A(0,6),B(6,0)と、直線y=x上の点P(t,t)があります。三角形ABPの面積が9のとき、tをすべて求めなさい。',answer:'3/2,9/2',acceptedAnswers:['9/2,3/2'],explanation:'座標から面積は6|t-3|。6|t-3|=9より|t-3|=3/2なのでt=3/2,9/2。'},
      {prompt:'直線y=x+2とy=-2x+8の交点Pを通り、傾き3の直線ℓを引きます。ℓとx軸・y軸でできる三角形の面積を求めなさい。',answer:'2/3',explanation:'P=(2,4)。ℓはy=3x-2。x切片は2/3、y切片は-2なので面積は(2/3)×2÷2=2/3。'},
      {prompt:'点A(0,0),B(8,0),C(0,6)があります。辺AB上の点Pで△APCの面積が△PBCの3倍です。直線CPと直線x=2の交点のy座標を求めなさい。',answer:'4',explanation:'面積比よりAP:PB=3:1なのでP=(6,0)。CPはC(0,6)とP(6,0)を通りy=-x+6。x=2でy=4。'}
    ]
  },
  integers: {
    B: [
      {prompt:'正の整数nについて、nを6で割ると4余り、nを5で割ると3余ります。最小のnを求めなさい。',answer:'28',explanation:'6で4余る数を調べると28は5で3余る。'},
      {prompt:'72nが平方数になるような最小の正の整数nを求めなさい。',answer:'2',explanation:'72=2³×3²。2を掛ければ2⁴×3²で平方数。'},
      {prompt:'2桁の整数nで、nを7で割ると3余り、nを5で割ると1余ります。最小のnを求めなさい。',answer:'31',explanation:'31は7で3余り、5で1余る。'},
      {prompt:'正の整数x,yがx+y=10, xy=21を満たすとき、x,yを小さい順に答えなさい。',answer:'3,7',acceptedAnswers:['(3,7)','3と7'],explanation:'t²-10t+21=(t-3)(t-7)。'}
    ],
    C: [
      {prompt:'正の整数nは4で割ると1余り、6で割ると3余り、5で割ると4余ります。最小のnを求めなさい。',answer:'9',explanation:'9は各条件を満たす。'},
      {prompt:'正の整数A<B<Cで、BはAの2倍、CはAとBの両方の倍数のうちBより大きい最小の数、A+B+C=42です。Aを求めなさい。',answer:'6',explanation:'B=2A。Bより大きい最小の共通倍数はC=4A。合計7A=42よりA=6。'},
      {prompt:'正の整数x,yがx:y=2:3、xyが216の約数で、x+yが最大となるときx+yを求めなさい。',answer:'30',explanation:'x=2k,y=3k、6k²が216の約数。最大k=6で和30。'},
      {prompt:'2桁の正の整数nで、nを8で割ると5余り、nを9で割ると6余ります。最小のnを求めなさい。',answer:'69',explanation:'13,21,29,37,45,53,61,69のうち69は9で6余る。'}
    ]
  },
  solids: {
    B: [
      {prompt:'底面が1辺6cmの正方形、高さ8cmの四角すいの体積を求めなさい。',answer:'96',explanation:'36×8÷3=96。'},
      {prompt:'底面積30cm²の柱体に体積120cm³の物体を完全に沈めると、水位は何cm上がりますか。',answer:'4',explanation:'120÷30=4。'},
      {prompt:'相似な2つの立体の相似比が2:3です。小さい立体の体積が40cm³のとき大きい立体の体積を求めなさい。',answer:'135',explanation:'体積比8:27。40×27/8=135。'},
      {prompt:'底面積48cm²、高さ10cmの角すいを高さの半分の位置で底面に平行に切ります。上の小さい角すいの体積を求めなさい。',answer:'20',explanation:'全体160。相似比1:2なので体積比1:8、20。'}
    ],
    C: [
      {prompt:'高さ12cmの四角すいを、頂点から高さ4cmの位置で底面に平行に切ります。元の体積が324cm³のとき、切り取られる小さい四角すいの体積を求めなさい。',answer:'12',explanation:'相似比1:3、体積比1:27。324÷27=12。'},
      {prompt:'底面積54cm²、高さ12cmの角すいを頂点から高さ8cmの位置で底面に平行に切ります。上側の小さい角すいの体積を求めなさい。',answer:'64',explanation:'全体216。相似比2:3、体積比8:27。216×8/27=64。'},
      {prompt:'底面積40cm²の容器で、水位が3cm上がりました。沈めた物体の体積の3/5だけが水中にあるとき、物体全体の体積を求めなさい。',answer:'200',explanation:'押しのけた体積120=全体の3/5。120×5/3=200。'},
      {prompt:'相似な2つの角すいの体積比が27:64です。対応する高さの差が5cmで、大きい方の高さを求めなさい。',answer:'20',explanation:'相似比3:4。高さを15,20とすれば差5。'}
    ]
  },
  similarity: {
    B: [
      {prompt:'△ABCでDE∥BC、DはAB上、EはAC上です。AD:DB=2:3、AC=15cmのときAEを求めなさい。',answer:'6',explanation:'AD:AB=2:5なのでAE:AC=2:5。15×2/5=6。'},
      {prompt:'相似な2つの三角形の面積比が9:25で、大きい三角形の対応辺が20cmです。小さい方の対応辺を求めなさい。',answer:'12',explanation:'辺の比3:5。20×3/5=12。'},
      {prompt:'△ABCでD,EはそれぞれAB,AC上、DE∥BCです。AD=4,DB=6,DE=8のときBCを求めなさい。',answer:'20',explanation:'AD:AB=4:10=2:5。DE:BC=2:5よりBC=20。'},
      {prompt:'相似な図形の周の長さの比が4:7、面積の差が99cm²です。小さい図形の面積を求めなさい。',answer:'48',explanation:'面積比16:49、差33部分=99より1部分=3。16×3=48。'}
    ],
    C: [
      {prompt:'△ABCでDはABの中点、Dを通りBCに平行な直線とACの交点をEとします。△ADEの面積が18cm²のとき四角形DBCEの面積を求めなさい。',answer:'54',explanation:'相似比1:2、面積比1:4。全体72なので残り54。'},
      {prompt:'△ABCでDE∥BC。AD:DB=3:2です。四角形DBCEの面積が64cm²のとき△ADEの面積を求めなさい。',answer:'36',explanation:'AD:AB=3:5。面積比9:25。残り16部分=64で1部分=4、9部分=36。'},
      {prompt:'相似な2つの三角形の辺の比が3:5で、面積の差が128cm²です。大きい三角形の面積を求めなさい。',answer:'200',explanation:'面積比9:25、差16部分=128で1部分=8。大は200。'},
      {prompt:'△ABCでDはAB上、EはAC上、DE∥BC。AD=6,DB=4、△ADEと四角形DBCEの面積差が28cm²のとき△ABCの面積を求めなさい。',answer:'100',explanation:'相似比3:5、面積比9:25。四角形DBCEは16部分なので、四角形と小三角形の差は7部分。7部分=28より1部分=4、全体25部分=100。'}
    ]
  },
  counting: {
    B: [
      {prompt:'1,2,3,4,5から異なる3個を選んで3桁の整数を作ります。偶数は何個できますか。',answer:'24',explanation:'一の位2または4の2通り。残り4×3通りで24。'},
      {prompt:'A,B,C,D,Eの5人を一列に並べるとき、AとBが隣り合う並べ方は何通りですか。',answer:'48',explanation:'ABを1組とみて4!×2=48。'},
      {prompt:'6個のスイッチから異なる2個を選んで同時に押す方法は何通りですか。',answer:'15',explanation:'6C2=15。'},
      {prompt:'1〜6のカードから異なる2枚を順に引くとき、和が7になる順序つきの組は何通りですか。',answer:'6',explanation:'(1,6),(2,5),(3,4)と逆順の6通り。'}
    ],
    C: [
      {prompt:'1,2,3,4,5を1回ずつ並べるとき、1が2より左、2が3より左にある並べ方は何通りですか。',answer:'20',explanation:'1,2,3の相対順序6通りのうち1通り。5!/6=20。'},
      {prompt:'6個の異なるスイッチからA,B,Cの3人が1個ずつ選び、3人とも異なるスイッチを選ぶ方法は何通りですか。',answer:'120',explanation:'6×5×4=120。'},
      {prompt:'1〜6のカードから異なる3枚を順に引くとき、最初のカードが残り2枚より小さい並びは何通りですか。',answer:'40',explanation:'3枚の選び方20通りごとに最小が先頭、残り2枚の順序2通り。40。'},
      {prompt:'A,B,C,D,E,Fを一列に並べるとき、AとBが隣り合わず、CとDが隣り合う並べ方は何通りですか。',answer:'144',explanation:'CDを組にすると5!×2=240。さらにABも組になるもの4!×2×2=96を引き144。'}
    ]
  },
  motion: {
    B: [
      {prompt:'毎分60mで進むAが出発して5分後、同じ地点から毎分90mでBが追います。Bは何分後に追いつきますか。',answer:'10',explanation:'先行300m、速さの差30m/分。300÷30=10。'},
      {prompt:'点Pが毎秒2cmで長さ20cmの辺上を動きます。出発からt秒後の進んだ距離をtで表しなさい。',answer:'2t',acceptedAnswers:['2*t'],explanation:'速さ×時間で2t。'},
      {prompt:'長方形ABCDでAB=12cm,AD=8cm。PがAからBへ毎秒3cmで動くとき、△ADPの面積をtで表しなさい。0≦t≦4。',answer:'12t',acceptedAnswers:['12*t'],explanation:'AP=3t、高さAD=8。面積=3t×8÷2=12t。'},
      {prompt:'時速4kmで歩く人が30分先に出発し、後から時速6kmで追う人は何時間後に追いつきますか。',answer:'1',explanation:'先行2km、速さの差2km/hなので1時間。'}
    ],
    C: [
      {prompt:'長方形ABCDでAB=12cm,AD=8cm。PはAからBへ毎秒2cmで進み、Bに着いた後はBからCへ毎秒1cmで進みます。0<t<14で△APCの面積が24cm²になる時刻tをすべて求めなさい。',answer:'3,10',acceptedAnswers:['10,3'],explanation:'AB上ではP=(2t,0)なので面積は8t、よってt=3。BC上ではP=(12,t-6)なので面積は6(14-t)、よってt=10。'},
      {prompt:'正方形ABCDの周上をPがAから毎秒1cmで動きます。1辺4cmとして、出発後0<t<8で△APCの面積が4cm²になるtをすべて求めなさい。',answer:'2,6',acceptedAnswers:['6,2'],explanation:'AB上では面積=t×4÷2=2tよりt=2。BC上では高さが8-tとなり2(8-t)=4よりt=6。'},
      {prompt:'Aは毎分80m、Bは毎分120mで円周1000mの同じ地点から同時に同じ方向へ出発します。速いBが初めてAに追いつくのは何分後ですか。',answer:'25',explanation:'相対速度は120-80=40m/分。1周1000mの差がつくまで1000÷40=25分。'},
      {prompt:'長方形ABCDでAB=8cm,AD=6cm。PはAからBへ毎秒1cm、QはDからCへ毎秒2cmで同時に動きます。0<t<4で線分PQが長方形の中心Oを通る時刻tを求めなさい。',answer:'8/3',explanation:'P=(t,0),Q=(2t,6)。PQ上でy=3となる点はPとQの中点なので、そのx座標は3t/2。中心Oのx座標4に等しいから3t/2=4、t=8/3。'}
    ]
  },
  radicals: {
    B: [
      {prompt:'√45の小数部分をaとするとき、a(√45+6)を求めなさい。',answer:'9',explanation:'√45=3√5は6と7の間なのでa=√45-6。積は45-36=9。'},
      {prompt:'√28の小数部分をaとするとき、a(√28+5)を求めなさい。',answer:'3',explanation:'√28は5と6の間。a=√28-5、積=28-25=3。'},
      {prompt:'(√6+√2)(√6-√2)を求めなさい。',answer:'4',explanation:'6-2=4。'},
      {prompt:'√12:√27を最簡整数比で表しなさい。',answer:'2:3',explanation:'2√3:3√3=2:3。'}
    ]
  },
  probability: {
    B: [
      {prompt:'サイコロを3回投げるとき、3回の積が偶数になる確率を求めなさい。',answer:'7/8',explanation:'積が奇数は3回とも奇数で(1/2)^3=1/8。余事象で7/8。'},
      {prompt:'1〜5のカードから戻さず2枚を順に引くとき、2枚の和が偶数になる確率を求めなさい。',answer:'2/5',explanation:'奇奇は3P2=6、偶偶は2P2=2、全20通り中8通りで2/5。'},
      {prompt:'2個のサイコロを投げ、和が9以上になる確率を求めなさい。',answer:'5/18',explanation:'和9,10,11,12は4+3+2+1=10通り。10/36=5/18。'},
      {prompt:'赤3個、白2個、青1個から戻さず2個取るとき、同じ色になる確率を求めなさい。',answer:'4/15',explanation:'赤赤3C2=3、白白2C2=1。全6C2=15で4/15。'}
    ],
    C: [
      {prompt:'サイコロを4回投げるとき、少なくとも1回は6が出る確率を求めなさい。',answer:'671/1296',explanation:'1-(5/6)^4=1-625/1296=671/1296。'},
      {prompt:'1〜6のカードから戻さず3枚を順に引くとき、3枚がすべて偶数またはすべて奇数になる確率を求めなさい。',answer:'1/10',explanation:'有利は3!+3!=12、全6P3=120。1/10。'},
      {prompt:'2個のサイコロを2回投げるとき、1回目の和が7または2回目の和が7となる確率を求めなさい。',answer:'11/36',explanation:'1-(5/6)^2=11/36。'},
      {prompt:'1〜5のカードから戻さず3枚を順に引くとき、1枚目<2枚目<3枚目となる確率を求めなさい。',answer:'1/6',explanation:'選んだ3枚の並び6通りのうち昇順は1通り。'}
    ]
  },
  'word-problems': {
    B: [
      {prompt:'10%の食塩水300gから60gを捨て、同量の水を加えました。新しい濃度を求めなさい。',answer:'8%',acceptedAnswers:['0.08','8/100','2/25'],explanation:'食塩30gのうち60/300を捨てるので24g残る。24/300=8%。'},
      {prompt:'原価800円の商品に25%の利益を見込んで定価をつけ、その定価の10%引きで売りました。利益を求めなさい。',answer:'100',explanation:'定価1000円、売価900円、利益100円。'},
      {prompt:'12%の食塩水200gに水を40g加えた後、60g捨てます。残る食塩の量を求めなさい。',answer:'18',explanation:'食塩24g、全体240g。60gは全体の1/4なので食塩も1/4減り18g。'},
      {prompt:'A商品を1個300円、B商品を1個500円で合計20個買い、代金が7600円でした。A商品の個数を求めなさい。',answer:'12',explanation:'300x+500(20-x)=7600よりx=12。'}
    ],
    C: [
      {prompt:'10%の食塩水300gから60gを捨て、60gの水を加える操作を2回行います。最後の食塩の量を求めなさい。',answer:'96/5',acceptedAnswers:['19.2'],explanation:'毎回食塩は4/5倍。30×(4/5)²=96/5g。'},
      {prompt:'20%の食塩水200gから50gを捨て、50gの水を加えた後、再び50gを捨てて50gの40%食塩水を加えます。最後の食塩の量を求めなさい。',answer:'85/2',acceptedAnswers:['42.5'],explanation:'40→30→22.5gとなり、最後に20g加えて42.5g。'},
      {prompt:'原価600円の商品を何個か仕入れ、20%の利益を見込んで定価をつけました。3個売れ残り、残りを定価で売ったところ全体で600円の利益でした。仕入れ個数を求めなさい。',answer:'23',explanation:'720(n-3)-600n=600。120n-2160=600よりn=23。'},
      {prompt:'ある品を1個400円で仕入れ、半分を25%の利益、残り半分を10%の損失で売りました。全体の利益率を求めなさい。',answer:'7.5%',acceptedAnswers:['0.075','3/40'],explanation:'平均売価は(500+360)/2=430円。利益30円で7.5%。'}
    ]
  }
}

const sourceDifficultyMap: Record<string, RemediationDifficulty> = {
  '2019-Q1-1': 'A',
  '2019-Q1-2': 'A',
  '2019-Q1-3': 'A',
  '2019-Q1-4': 'A',
  '2019-Q1-5': 'A',
  '2019-Q1-6': 'A',
  '2019-Q1-7': 'B',
  '2019-Q1-8': 'B',
  '2019-Q1-9': 'B',
  '2019-Q2-1': 'A',
  '2019-Q2-2': 'B',
  '2019-Q3-1': 'A',
  '2019-Q3-2': 'B',
  '2019-Q3-3': 'B',
  '2019-Q4-1': 'A',
  '2019-Q4-2': 'B',
  '2019-Q4-3': 'C',
  '2019-Q5-1': 'A',
  '2019-Q5-2': 'B',
  '2019-Q5-3': 'C',
  '2020-Q1-1': 'A',
  '2020-Q1-2': 'A',
  '2020-Q1-3': 'A',
  '2020-Q1-4': 'A',
  '2020-Q1-5': 'A',
  '2020-Q1-6': 'B',
  '2020-Q1-7': 'B',
  '2020-Q1-8': 'B',
  '2020-Q2-1': 'A',
  '2020-Q2-2': 'B',
  '2020-Q2-3': 'C',
  '2020-Q3-1': 'A',
  '2020-Q3-2': 'B',
  '2020-Q3-3': 'C',
  '2020-Q4-1': 'A',
  '2020-Q4-2': 'B',
  '2020-Q4-3': 'B',
  '2020-Q5-1': 'A',
  '2020-Q5-2': 'B',
  '2020-Q5-3': 'C',
  '2021-Q1-1': 'A',
  '2021-Q1-2': 'A',
  '2021-Q1-3': 'A',
  '2021-Q1-4': 'A',
  '2021-Q1-5': 'B',
  '2021-Q1-6': 'A',
  '2021-Q1-7': 'A',
  '2021-Q1-8': 'A',
  '2021-Q2-1': 'A',
  '2021-Q2-2': 'B',
  '2021-Q2-3': 'B',
  '2021-Q3-1': 'A',
  '2021-Q3-2': 'B',
  '2021-Q3-3': 'C',
  '2021-Q4-1': 'A',
  '2021-Q4-2': 'B',
  '2021-Q4-3': 'C',
  '2021-Q5-1': 'A',
  '2021-Q5-2': 'B',
  '2021-Q5-3': 'C',
  '2022-Q1-1': 'A',
  '2022-Q1-2': 'A',
  '2022-Q1-3': 'A',
  '2022-Q1-4': 'A',
  '2022-Q1-5': 'A',
  '2022-Q1-6': 'A',
  '2022-Q1-7': 'A',
  '2022-Q1-8': 'B',
  '2022-Q2-1': 'A',
  '2022-Q2-2': 'B',
  '2022-Q2-3': 'B',
  '2022-Q3-1': 'A',
  '2022-Q3-2-i': 'A',
  '2022-Q3-2-ii': 'B',
  '2022-Q4-1': 'A',
  '2022-Q4-2': 'B',
  '2022-Q4-3': 'C',
  '2022-Q5-1': 'A',
  '2022-Q5-2': 'B',
  '2022-Q5-3': 'B',
  '2023-Q1-1': 'A',
  '2023-Q1-2': 'A',
  '2023-Q1-3': 'A',
  '2023-Q1-4': 'A',
  '2023-Q1-5': 'B',
  '2023-Q1-6': 'B',
  '2023-Q1-7': 'A',
  '2023-Q1-8': 'A',
  '2023-Q2-1': 'A',
  '2023-Q2-2': 'B',
  '2023-Q2-3': 'C',
  '2023-Q3-1': 'A',
  '2023-Q3-2': 'B',
  '2023-Q3-3': 'B',
  '2023-Q4-1': 'A',
  '2023-Q4-2': 'B',
  '2023-Q4-3': 'B',
  '2023-Q5-1': 'A',
  '2023-Q5-2': 'B',
  '2023-Q5-3': 'B',
  '2024-Q1-1': 'A',
  '2024-Q1-2': 'A',
  '2024-Q1-3': 'A',
  '2024-Q1-4': 'A',
  '2024-Q1-5': 'B',
  '2024-Q1-6': 'A',
  '2024-Q1-7': 'A',
  '2024-Q1-8': 'B',
  '2024-Q2-1': 'A',
  '2024-Q2-2': 'A',
  '2024-Q2-3': 'B',
  '2024-Q3-1': 'A',
  '2024-Q3-2': 'A',
  '2024-Q3-3': 'B',
  '2024-Q4-1': 'A',
  '2024-Q4-2': 'B',
  '2024-Q4-3': 'C',
  '2024-Q5-1': 'A',
  '2024-Q5-2': 'B',
  '2024-Q5-3': 'C',
  '2025-Q1-1': 'A',
  '2025-Q1-2': 'A',
  '2025-Q1-3': 'A',
  '2025-Q1-4': 'A',
  '2025-Q1-5': 'A',
  '2025-Q1-6': 'A',
  '2025-Q1-7': 'A',
  '2025-Q1-8': 'B',
  '2025-Q2-1': 'A',
  '2025-Q2-2': 'A',
  '2025-Q2-3': 'C',
  '2025-Q3-1': 'A',
  '2025-Q3-2': 'A',
  '2025-Q3-3': 'B',
  '2025-Q4-1': 'A',
  '2025-Q4-2': 'B',
  '2025-Q4-3': 'C',
  '2025-Q5-1': 'A',
  '2025-Q5-2': 'B',
  '2025-Q5-3': 'C',
  '2026-Q1-1': 'A',
  '2026-Q1-2': 'A',
  '2026-Q1-3': 'A',
  '2026-Q1-4': 'A',
  '2026-Q1-5': 'A',
  '2026-Q1-6': 'A',
  '2026-Q1-7': 'A',
  '2026-Q1-8': 'B',
  '2026-Q2-1': 'A',
  '2026-Q2-2': 'B',
  '2026-Q2-3': 'B',
  '2026-Q3-1': 'A',
  '2026-Q3-2': 'B',
  '2026-Q3-3': 'C',
  '2026-Q4-1': 'A',
  '2026-Q4-2': 'B',
  '2026-Q4-3': 'C',
  '2026-Q5-1': 'A',
  '2026-Q5-2': 'B',
  '2026-Q5-3': 'B',
}

export function getRemediationDifficulty(sourceQuestion?: string): RemediationDifficulty {
  return sourceQuestion ? (sourceDifficultyMap[sourceQuestion] ?? 'A') : 'A'
}

export function getRemediationForSource(topic: string, sourceQuestion?: string) {
  const field = classifyRemediationField(topic)
  const difficulty = getRemediationDifficulty(sourceQuestion)
  const bank = difficulty === 'A'
    ? field.questions
    : (difficultyBanks[field.id]?.[difficulty] ?? field.questions)
  return { field, difficulty, questions: bank }
}
