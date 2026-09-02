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
      {prompt:'大きい図形と小さい図形の相似比が3:2です。小さい図形の周の長さが20cmのとき、大きい図形の周の長さを求めなさい。',answer:'30',explanation:'20×3/2=30。'}
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


export type SourceRemediationProfile = {
  coreSkill: string
  questions: RemedyQuestion[]
}

/**
 * 元問題と「同じ単元」ではなく、同じ中心発想・立式・場合分けで解くための問題別バンク。
 * ここに登録された問題は分野共通バンクより優先する。
 */
const sourceSpecificBanks: Record<string, SourceRemediationProfile> = {
  '2024-Q1-2': {
    coreSkill: '三角柱の表面積=底面2枚+側面3枚。5-12-13の直角三角形。',
    questions: [
      {prompt:'底面が辺6cm,8cm,10cmの直角三角形で、柱の長さが5cmの三角柱があります。表面積を求めなさい。',answer:'168',explanation:'底面積は6×8÷2=24。底面2枚で48、側面は(6+8+10)×5=120。合計168。'},
      {prompt:'底面が辺5cm,12cm,13cmの直角三角形で、柱の長さが4cmの三角柱があります。表面積を求めなさい。',answer:'180',explanation:'底面積30が2枚で60。側面は(5+12+13)×4=120。合計180。'},
      {prompt:'底面が辺9cm,12cm,15cmの直角三角形で、柱の長さが7cmの三角柱があります。表面積を求めなさい。',answer:'360',explanation:'底面積54が2枚で108。側面は(9+12+15)×7=252。合計360。'},
      {prompt:'底面が辺8cm,15cm,17cmの直角三角形で、柱の長さが6cmの三角柱があります。表面積を求めなさい。',answer:'360',explanation:'底面積60が2枚で120。側面は(8+15+17)×6=240。合計360。'}
    ]
  },
  '2024-Q1-3': {
    coreSkill: '反比例では積xyが一定。符号まで保持する。',
    questions: [
      {prompt:'yはxに反比例し、x=4のときy=6です。x=8のときのyを求めなさい。',answer:'3',explanation:'xy=24なのでy=24/8=3。'},
      {prompt:'yはxに反比例し、x=-3のときy=10です。x=5のときのyを求めなさい。',answer:'-6',explanation:'xy=-30なのでy=-30/5=-6。'},
      {prompt:'yはxに反比例し、x=6のときy=-4です。y=8のときのxを求めなさい。',answer:'-3',explanation:'xy=-24。8x=-24よりx=-3。'},
      {prompt:'yはxに反比例し、x=2のときy=15です。y=5のときのxを求めなさい。',answer:'6',explanation:'xy=30。5x=30よりx=6。'}
    ]
  },
  '2024-Q1-4': {
    coreSkill: '奇数個の中央値は並べた中央1個。',
    questions: [
      {prompt:'データ 7,12,4,9,15,5 の中央値を求めなさい。',answer:'8',explanation:'4,5,7,9,12,15。中央の7と9の平均は8。'},
      {prompt:'データ 18,11,6,13,9,15,7,10 の中央値を求めなさい。',answer:'10.5',acceptedAnswers:['21/2'],explanation:'6,7,9,10,11,13,15,18。中央10と11の平均は10.5。'},
      {prompt:'データ 3,14,8,5,12,6 の中央値を求めなさい。',answer:'7',explanation:'3,5,6,8,12,14。中央6と8の平均は7。'},
      {prompt:'データ 20,4,16,8,12,10,6,14 の中央値を求めなさい。',answer:'11',explanation:'4,6,8,10,12,14,16,20。中央10と12の平均は11。'}
    ]
  },
  '2024-Q1-7': {
    coreSkill: '面積を等置し、長さなので正の平方根を取る。',
    questions: [
      {prompt:'面積が98cm²の正方形の1辺の長さを求めなさい。',answer:'7√2',acceptedAnswers:['7sqrt(2)','7*√2'],explanation:'x²=98よりx=√98=7√2。長さなので正の値を取る。'},
      {prompt:'面積が75cm²の正方形の1辺の長さを求めなさい。',answer:'5√3',acceptedAnswers:['5sqrt(3)','5*√3'],explanation:'x²=75よりx=√75=5√3。'},
      {prompt:'面積が128cm²の正方形の1辺の長さを求めなさい。',answer:'8√2',acceptedAnswers:['8sqrt(2)','8*√2'],explanation:'x²=128よりx=√128=8√2。'},
      {prompt:'面積が147cm²の正方形の1辺の長さを求めなさい。',answer:'7√3',acceptedAnswers:['7sqrt(3)','7*√3'],explanation:'x²=147よりx=√147=7√3。'}
    ]
  },
  '2024-Q2-1': {
    coreSkill: '放物線上の点は座標を式へ直接代入する。',
    questions: [
      {prompt:'放物線y=ax²が点(2,6)を通ります。aを求めなさい。',answer:'3/2',acceptedAnswers:['1.5'],explanation:'6=4aよりa=3/2。'},
      {prompt:'放物線y=ax²が点(-4,8)を通ります。aを求めなさい。',answer:'1/2',acceptedAnswers:['0.5'],explanation:'8=16aよりa=1/2。'},
      {prompt:'放物線y=ax²が点(3,-6)を通ります。aを求めなさい。',answer:'-2/3',explanation:'-6=9aよりa=-2/3。'},
      {prompt:'放物線y=ax²が点(-2,-5)を通ります。aを求めなさい。',answer:'-5/4',explanation:'-5=4aよりa=-5/4。'}
    ]
  },
  '2024-Q2-2': {
    coreSkill: '直線の式を先に確定し、放物線と連立する。',
    questions: [
      {prompt:'放物線y=x²と直線y=x+2の交点のうち、x座標が正の点のx座標を求めなさい。',answer:'2',explanation:'x²=x+2より(x-2)(x+1)=0。正の解は2。'},
      {prompt:'放物線y=x²と、点(0,2),(1,3)を通る直線の交点のうち、x座標が負の点のx座標を求めなさい。',answer:'-1',explanation:'直線はy=x+2。x²=x+2より(x-2)(x+1)=0。負の解は-1。'},
      {prompt:'放物線y=2x²と直線y=6x-4の交点のx座標をすべて求めなさい。',answer:'1,2',acceptedAnswers:['2,1','1と2','2と1'],explanation:'2x²=6x-4よりx²-3x+2=0。(x-1)(x-2)=0。'},
      {prompt:'放物線y=x²と、点(0,0),(3,3)を通る直線の交点のx座標をすべて求めなさい。',answer:'0,1',acceptedAnswers:['1,0','0と1','1と0'],explanation:'直線はy=x。x²=xよりx(x-1)=0。x=0,1。'}
    ]
  },
  '2024-Q3-1': {
    coreSkill: '条件付きで残った4枚だけを母集団にする。',
    questions: [
      {prompt:'1〜6のカードが1枚ずつあります。1枚取り除いたところ、それが偶数だと分かりました。残った5枚から1枚を無作為に引くとき、奇数を引く確率を求めなさい。',answer:'3/5',explanation:'取り除かれたのは偶数なので、奇数1,3,5の3枚はすべて残る。残り5枚中3枚。'},
      {prompt:'赤玉3個、白玉2個があります。白玉1個を先に取り除き、残りから1個選ぶとき赤玉である確率を求めなさい。',answer:'3/4',explanation:'残りは赤3、白1の計4個。赤は3個。'},
      {prompt:'1〜8のカードが1枚ずつあります。奇数のカード1枚を先に取り除き、残りから1枚選ぶとき偶数である確率を求めなさい。',answer:'4/7',explanation:'偶数4枚はすべて残り、全体は7枚。4/7。'},
      {prompt:'青玉2個、黄玉3個、緑玉1個があります。黄玉1個を先に取り除き、残りから1個選ぶとき青玉または緑玉である確率を求めなさい。',answer:'3/5',explanation:'残り5個のうち青2+緑1=3個。'}
    ]
  },
  '2024-Q3-2': {
    coreSkill: '大小関係の対称性を使うと60通りを列挙しなくてよい。',
    questions: [
      {prompt:'異なる2枚の数カードを無作為にA,Bへ1枚ずつ配ります。Aの数がBの数より大きい確率を求めなさい。',answer:'1/2',explanation:'同点はなく、A>BとA<Bは入れ替えで1対1に対応する。'},
      {prompt:'1〜7から異なる2数を順に選びx,yとします。x<yとなる確率を求めなさい。',answer:'1/2',explanation:'各(x,y)に(y,x)が対応し、大小は必ずどちらか一方。'},
      {prompt:'異なる点数のカード4枚から2枚を順に引き、1枚目をP、2枚目をQとします。P>Qとなる確率を求めなさい。',answer:'1/2',explanation:'順序を逆にした組と対になり、P>QとP<Qが同数。'},
      {prompt:'異なる6個の整数から2個を無作為に順に選びa,bとします。a-bが正になる確率を求めなさい。',answer:'1/2',explanation:'a-b>0はa>bと同じ。順序交換でa>bとa<bが同数。'}
    ]
  }
,
  '2025-Q1-1': {
    coreSkill: '指数・乗除を先に処理し、分数で割るときは逆数を掛ける。',
    questions: [
      {prompt:'(-3)^2-5×2を計算しなさい。',answer:'-1',explanation:'9-10=-1。'},
      {prompt:'4-(-2)^3÷2を計算しなさい。',answer:'8',explanation:'(-2)^3=-8、-8÷2=-4なので4-(-4)=8。'},
      {prompt:'(-5+2)^2-7を計算しなさい。',answer:'2',explanation:'(-3)^2-7=9-7=2。'},
      {prompt:'18÷(-3)-2×(-4)を計算しなさい。',answer:'2',explanation:'-6+8=2。'}
    ]
  },
  '2025-Q1-2': {
    coreSkill: '積と和から整数の組を探す。',
    questions: [
      {prompt:'x²-11x+24を因数分解しなさい。',answer:'(x-3)(x-8)',acceptedAnswers:['(x-8)(x-3)'],explanation:'積24、和-11より-3,-8。'},
      {prompt:'2x²-10x-12を因数分解しなさい。',answer:'2(x-6)(x+1)',acceptedAnswers:['2(x+1)(x-6)'],explanation:'2でくくり、x²-5x-6=(x-6)(x+1)。'},
      {prompt:'3x²+12xを因数分解しなさい。',answer:'3x(x+4)',acceptedAnswers:['3(x+4)x'],explanation:'共通因数3xでくくる。'},
      {prompt:'x²-16を因数分解しなさい。',answer:'(x-4)(x+4)',acceptedAnswers:['(x+4)(x-4)'],explanation:'平方の差。'}
    ]
  },
  '2025-Q1-3': {
    coreSkill: '片方の式からxを表し、√2を含んだまま正確に代入する。',
    questions: [
      {prompt:'連立方程式 x+y=7, x-y=1 を解き、(x,y)で答えなさい。',answer:'(4,3)',acceptedAnswers:['4,3'],explanation:'2式を足して2x=8。'},
      {prompt:'連立方程式 x/2+y=5, x-y=1 を解き、(x,y)で答えなさい。',answer:'(4,3)',acceptedAnswers:['4,3'],explanation:'x= y+1を代入。'},
      {prompt:'連立方程式 2x+3y=13, x-y=1 を解き、(x,y)で答えなさい。',answer:'(16/5,11/5)',acceptedAnswers:['16/5,11/5'],explanation:'x=y+1を代入して5y=11。'},
      {prompt:'連立方程式 3x-y=7, x+2y=7 を解き、(x,y)で答えなさい。',answer:'(3,2)',acceptedAnswers:['3,2'],explanation:'y=3x-7を第2式へ代入。'}
    ]
  },
  '2025-Q1-4': {
    coreSkill: '平方を外すとき±を忘れない。',
    questions: [
      {prompt:'(x+2)²=16を解きなさい。',answer:'2,-6',acceptedAnswers:['-6,2','x=2,-6','x=-6,2'],explanation:'x+2=±4よりx=2,-6。'},
      {prompt:'(2x-1)²=9を解きなさい。',answer:'2,-1',acceptedAnswers:['-1,2'],explanation:'2x-1=±3。'},
      {prompt:'(x-3)²=5を解きなさい。',answer:'3±√5',acceptedAnswers:['x=3±√5'],explanation:'x-3=±√5。'},
      {prompt:'(x+1)²=12を解きなさい。',answer:'-1±2√3',acceptedAnswers:['x=-1±2√3'],explanation:'x+1=±√12=±2√3。'}
    ]
  },
  '2025-Q1-5': {
    coreSkill: '偶数個の中央値は中央2値の平均。Aをどこへ挿入するか確認する。',
    questions: [
      {prompt:'データ 10,20,30,40,60,70,80,90,100 に数aを1つ加えると中央値が50になります。aとして可能な最大値を求めなさい。',answer:'40',explanation:'a≦40なら中央2個は40と60で中央値50。したがって最大は40。'},
      {prompt:'データ 12,18,25,31,45,50,60,70,80 に数aを1つ加えると中央値が38になります。aとして可能な最大値を求めなさい。',answer:'31',explanation:'a≦31なら中央2個は31と45で中央値38。最大は31。'},
      {prompt:'データ 5,15,20,35,55,65,75,85,95 に数aを1つ加えると中央値が45になります。aとして可能な最大値を求めなさい。',answer:'35',explanation:'a≦35なら中央2個は35と55で中央値45。最大は35。'},
      {prompt:'データ 14,22,28,36,52,60,68,76,84 に数aを1つ加えると中央値が44になります。aとして可能な最大値を求めなさい。',answer:'36',explanation:'a≦36なら中央2個は36と52で中央値44。最大は36。'}
    ]
  },
  '2025-Q1-6': {
    coreSkill: '相似の対応辺から「中項の平方=両端の積」を作る。',
    questions: [
      {prompt:'△ABC∽△DEFで、AB=6, BC=9, DE=10です。EFを求めなさい。',answer:'15',explanation:'AB:DE=BC:EFより6:10=9:EF。'},
      {prompt:'△ABC∽△ADCで、AB=8, AC=12, AD=6です。ABとAD、ACとDCが対応するときDCを求めなさい。',answer:'9',explanation:'8:6=12:DCよりDC=9。'},
      {prompt:'相似な2三角形の相似比が3:5です。小さい方の対応辺が12cmなら大きい方は何cmですか。',answer:'20',explanation:'12×5/3=20。'},
      {prompt:'△PQR∽△XYZでPQ=7, QR=14, XY=9です。YZを求めなさい。',answer:'18',explanation:'7:9=14:YZ。'}
    ]
  },
  '2025-Q1-7': {
    coreSkill: '3で割った余りで分類すると漏れなく数えられる。',
    questions: [
      {prompt:'1〜5のカードから同時に2枚取ります。和が偶数となる確率を求めなさい。',answer:'2/5',explanation:'全10組。奇奇3組、偶偶1組で4/10=2/5。'},
      {prompt:'1〜6のカードから同時に2枚取ります。和が5の倍数となる確率を求めなさい。',answer:'1/5',explanation:'全15組。(1,4),(4,6),(2,3)の3組で3/15。'},
      {prompt:'1〜7のカードから同時に2枚取ります。和が4の倍数となる確率を求めなさい。',answer:'5/21',explanation:'全21組。(1,3),(1,7),(2,6),(3,5),(5,7)の5組。'},
      {prompt:'1〜8のカードから同時に2枚取ります。積が偶数となる確率を求めなさい。',answer:'11/14',explanation:'全28組。積が奇数は奇数4枚から2枚で6組。22/28=11/14。'}
    ]
  },
  '2025-Q1-8': {
    coreSkill: '積一定の2数の和は2数が近いほど小さい。ただし異なる自然数。',
    questions: [
      {prompt:'72を異なる2つの自然数の積で表すとき、2数の和の最小値を求めなさい。',answer:'17',explanation:'因数対は1×72,2×36,3×24,4×18,6×12,8×9。最小和17。'},
      {prompt:'180を異なる2つの自然数の積で表すとき、2数の和の最小値を求めなさい。',answer:'27',explanation:'√180に近い因数対12×15で和27。'},
      {prompt:'96を異なる2つの自然数の積で表すとき、2数の和の最小値を求めなさい。',answer:'20',explanation:'8×12で和20。'},
      {prompt:'150を異なる2つの自然数の積で表すとき、2数の和の最小値を求めなさい。',answer:'25',explanation:'10×15で和25。'}
    ]
  },
  '2026-Q1-1': {
    coreSkill: '分母2,3の最小公倍数6を掛けて分数を消す。',
    questions: [
      {prompt:'(2x+1)/3=(x-2)/2 を解きなさい。',answer:'-8',explanation:'2(2x+1)=3(x-2)よりx=-8。'},
      {prompt:'(x-3)/4+(x+1)/2=2 を解きなさい。',answer:'3',explanation:'x-3+2x+2=8より3x=9。'},
      {prompt:'(3x+2)/5=2x-1 を解きなさい。',answer:'7/7',acceptedAnswers:['1'],explanation:'3x+2=10x-5より7x=7。'},
      {prompt:'2-(x+1)/3=x/2 を解きなさい。',answer:'2',explanation:'12-2x-2=3xより5x=10でx=2。'}
    ]
  },
  '2026-Q1-2': {
    coreSkill: '「y-2がxに比例」を y-2=kx と式にする。',
    questions: [
      {prompt:'y-3はxに比例し、x=4のときy=11です。yをxの式で表しなさい。',answer:'y=2x+3',acceptedAnswers:['2x+3'],explanation:'8=4kよりk=2。'},
      {prompt:'y+1はxに比例し、x=3のときy=8です。yをxの式で表しなさい。',answer:'y=3x-1',acceptedAnswers:['3x-1'],explanation:'9=3kよりk=3。'},
      {prompt:'y-5はxに比例し、x=-2のときy=1です。yをxの式で表しなさい。',answer:'y=2x+5',acceptedAnswers:['2x+5'],explanation:'-4=-2kよりk=2。'},
      {prompt:'y+4はxに比例し、x=2のときy=-2です。yをxの式で表しなさい。',answer:'y=x-4',acceptedAnswers:['x-4'],explanation:'2=2kよりk=1。'}
    ]
  },
  '2026-Q1-3': {
    coreSkill: 'x軸対称は (x,y)→(x,-y)。',
    questions: [
      {prompt:'x軸に関して点(5,-2)と対称な点を求めなさい。',answer:'(5,2)',acceptedAnswers:['5,2'],explanation:'x座標はそのまま、y座標の符号を反転。'},
      {prompt:'y軸に関して点(-3,7)と対称な点を求めなさい。',answer:'(3,7)',acceptedAnswers:['3,7'],explanation:'x座標の符号を反転。'},
      {prompt:'x軸に関して点(-6,4)と対称な点を求めなさい。',answer:'(-6,-4)',acceptedAnswers:['-6,-4'],explanation:'y座標の符号だけ反転。'},
      {prompt:'y軸に関して点(8,-1)と対称な点を求めなさい。',answer:'(-8,-1)',acceptedAnswers:['-8,-1'],explanation:'x座標の符号だけ反転。'}
    ]
  },
  '2026-Q1-4': {
    coreSkill: '求めたい文字cを含む項だけを一方へ集める。',
    questions: [
      {prompt:'a=(2b-3c)/5 をcについて解きなさい。',answer:'c=(2b-5a)/3',acceptedAnswers:['(2b-5a)/3'],explanation:'5a=2b-3cより3c=2b-5a。'},
      {prompt:'p=(4q+r)/3 をrについて解きなさい。',answer:'r=3p-4q',acceptedAnswers:['3p-4q'],explanation:'3p=4q+r。'},
      {prompt:'x=(y-2z)/7 をzについて解きなさい。',answer:'z=(y-7x)/2',acceptedAnswers:['(y-7x)/2'],explanation:'7x=y-2z。'},
      {prompt:'m=(5n+2k)/4 をkについて解きなさい。',answer:'k=(4m-5n)/2',acceptedAnswers:['(4m-5n)/2'],explanation:'4m=5n+2k。'}
    ]
  },
  '2026-Q1-5': {
    coreSkill: '境界3√2が4と5の間にあることだけ確認すればよい。',
    questions: [
      {prompt:'|x|<4を満たす整数xは何個ありますか。',answer:'7',explanation:'-3〜3の7個。'},
      {prompt:'|x|<√10を満たす整数xは何個ありますか。',answer:'7',explanation:'√10は3より大きく4より小さいので-3〜3。'},
      {prompt:'|x|<5/2を満たす整数xは何個ありますか。',answer:'5',explanation:'-2〜2の5個。'},
      {prompt:'|x|<2√3を満たす整数xは何個ありますか。',answer:'7',explanation:'2√3≈3.46より-3〜3。'}
    ]
  },
  '2026-Q1-6': {
    coreSkill: 'xとyを含む項を見て、(x-2)を共通因子に作る。',
    questions: [
      {prompt:'x²+3x+2xy+6yを因数分解しなさい。',answer:'(x+3)(x+2y)',acceptedAnswers:['(x+2y)(x+3)'],explanation:'x(x+3)+2y(x+3)。'},
      {prompt:'a²-4a+3ab-12bを因数分解しなさい。',answer:'(a-4)(a+3b)',acceptedAnswers:['(a+3b)(a-4)'],explanation:'a(a-4)+3b(a-4)。'},
      {prompt:'x²-5x+xy-5yを因数分解しなさい。',answer:'(x-5)(x+y)',acceptedAnswers:['(x+y)(x-5)'],explanation:'x(x-5)+y(x-5)。'},
      {prompt:'m²+2m-4mn-8nを因数分解しなさい。',answer:'(m+2)(m-4n)',acceptedAnswers:['(m-4n)(m+2)'],explanation:'m(m+2)-4n(m+2)。'}
    ]
  },
  '2026-Q1-7': {
    coreSkill: '最初の1個と、追加1個あたりの増加数を分ける。',
    questions: [
      {prompt:'正方形を隣り合う2個が1辺だけ共有するよう一列に10個並べます。異なる辺の総数を求めなさい。',answer:'31',explanation:'最初4本、1個増えるごとに3本増えるので4+9×3=31。'},
      {prompt:'正六角形を、隣り合う2個がちょうど1辺を共有するように8個一列に並べます。異なる辺の総数を求めなさい。',answer:'41',explanation:'6+7×5=41。'},
      {prompt:'正五角形を、隣り合う2個がちょうど1辺を共有するように12個一列に並べます。異なる辺の総数を求めなさい。',answer:'49',explanation:'5+11×4=49。'},
      {prompt:'正六角形を、隣り合う2個がちょうど1辺を共有するようにn個一列に並べます。異なる辺の総数をnの式で表しなさい。',answer:'5n+1',acceptedAnswers:['1+5n'],explanation:'6+5(n-1)=5n+1。'}
    ]
  },
  '2026-Q1-8': {
    coreSkill: '濃度条件で最初の量の比を出し、その後は液体の全量だけ追う。',
    questions: [
      {prompt:'10%食塩水100gと20%食塩水150gを全部混ぜたときの濃度を求めなさい。',answer:'16%',acceptedAnswers:['16'],explanation:'食塩10+30=40g、全体250gなので16%。'},
      {prompt:'12%食塩水200gから50g取り出した後、同量の水を加えます。濃度を求めなさい。',answer:'9%',acceptedAnswers:['9'],explanation:'取り出す食塩3g。残り21gを200gに戻すので10.5%ではなく、50g中食塩6gなので18g/200=9%。'},
      {prompt:'15%食塩水120gの半分を別容器へ移しました。移した食塩水に含まれる食塩は何gですか。',answer:'9',explanation:'60gの15%で9g。'},
      {prompt:'10%食塩水x gと20%食塩水100gを混ぜると15%になりました。xを求めなさい。',answer:'100',explanation:'0.1x+20=0.15(x+100)よりx=100。'}
    ]
  },
  '2019-Q1-1': {
    coreSkill: '平方の展開と √60=2√15 を使い、根号項を打ち消す。',
    questions: [
      {prompt:'(√5)²+3を計算しなさい。',answer:'8',explanation:'5+3=8。'},
      {prompt:'(2√3)²-5を計算しなさい。',answer:'7',explanation:'12-5=7。'},
      {prompt:'(√7-2)(√7+2)を計算しなさい。',answer:'3',explanation:'7-4=3。'},
      {prompt:'(3-√2)(3+√2)を計算しなさい。',answer:'7',explanation:'9-2=7。'}
    ]
  },
  '2019-Q1-2': {
    coreSkill: '小数の式を先に整数係数に直して消去する。',
    questions: [
      {prompt:'連立方程式 2x-y=5, 0.5x+0.5y=4 を解き、(x,y)で答えなさい。',answer:'(13/3,11/3)',acceptedAnswers:['13/3,11/3'],explanation:'第2式を2倍してx+y=8。'},
      {prompt:'連立方程式 x+2y=1, 0.2x-0.4y=2 を解き、(x,y)で答えなさい。',answer:'(11,-5)',acceptedAnswers:['11,-5'],explanation:'第2式を5倍してx-2y=10。'},
      {prompt:'連立方程式 3x+y=7, 0.3x-0.1y=0.5 を解き、(x,y)で答えなさい。',answer:'(2,1)',acceptedAnswers:['2,1'],explanation:'第2式を10倍して3x-y=5。'},
      {prompt:'連立方程式 x-y=4, 0.25x+0.25y=3 を解き、(x,y)で答えなさい。',answer:'(8,4)',acceptedAnswers:['8,4'],explanation:'第2式を4倍してx+y=12。'}
    ]
  },
  '2019-Q1-3': {
    coreSkill: '因数分解して2つの解を両方残す。',
    questions: [
      {prompt:'2x²-5x+2=0を解きなさい。',answer:'2,1/2',acceptedAnswers:['1/2,2'],explanation:'(2x-1)(x-2)=0。'},
      {prompt:'3x²-10x+3=0を解きなさい。',answer:'3,1/3',acceptedAnswers:['1/3,3'],explanation:'(3x-1)(x-3)=0。'},
      {prompt:'2x²-x-6=0を解きなさい。',answer:'2,-3/2',acceptedAnswers:['-3/2,2'],explanation:'(2x+3)(x-2)=0。'},
      {prompt:'4x²-12x+5=0を解きなさい。',answer:'5/2,1/2',acceptedAnswers:['1/2,5/2'],explanation:'(2x-1)(2x-5)=0。'}
    ]
  },
  '2019-Q1-4': {
    coreSkill: '図の右側だけを直角三角形として見る。',
    questions: [
      {prompt:'右側が直角三角形で、鋭角がy°と(x+35)°です。x+yを求めなさい。',answer:'55',explanation:'直角三角形なのでy+(x+35)=90。'},
      {prompt:'右側の直角三角形の2鋭角が(x+20)°とy°です。x+yを求めなさい。',answer:'70',explanation:'(x+20)+y=90。'},
      {prompt:'垂線でできる右側の直角三角形で2鋭角がx°と(y+42)°です。x+yを求めなさい。',answer:'48',explanation:'x+y+42=90。'},
      {prompt:'右側だけを見た直角三角形で2鋭角が(x+17)°と(y+8)°です。x+yを求めなさい。',answer:'65',explanation:'x+y+25=90。'}
    ]
  },
  '2019-Q1-5': {
    coreSkill: '下に開く放物線なので頂点と端点を調べる。',
    questions: [
      {prompt:'y=x²-4で -1≦x≦3 のときyの最小値と最大値を(最小,最大)で答えなさい。',answer:'(-4,5)',acceptedAnswers:['-4,5'],explanation:'頂点x=0で-4、端点x=3で5。'},
      {prompt:'y=-x²+9で -2≦x≦4 のときyの最小値と最大値を答えなさい。',answer:'(-7,9)',acceptedAnswers:['-7,9'],explanation:'最大は頂点9、最小はx=4で-7。'},
      {prompt:'y=2x²-1で 1≦x≦3 のときyの変域を答えなさい。',answer:'1≦y≦17',acceptedAnswers:['1<=y<=17'],explanation:'この範囲では増加。'},
      {prompt:'y=-2x²+8で -3≦x≦1 のときyの変域を答えなさい。',answer:'-10≦y≦8',acceptedAnswers:['-10<=y<=8'],explanation:'最大はx=0、最小はx=-3。'}
    ]
  },
  '2019-Q1-6': {
    coreSkill: '交点のx座標が分かれば、両直線のy座標を一致させる。',
    questions: [
      {prompt:'直線y=3x-1とy=x+aの交点のx座標が2です。aを求めなさい。',answer:'3',explanation:'x=2でy=5。5=2+a。'},
      {prompt:'直線y=-2x+4とy=x+bの交点のx座標が-1です。bを求めなさい。',answer:'7',explanation:'y=6。6=-1+b。'},
      {prompt:'直線y=4x+1とy=-x+cの交点のx座標が3です。cを求めなさい。',answer:'16',explanation:'y=13。13=-3+c。'},
      {prompt:'直線y=x-5とy=2x+dの交点のx座標が4です。dを求めなさい。',answer:'-9',explanation:'y=-1。-1=8+d。'}
    ]
  },
  '2019-Q1-7': {
    coreSkill: '根号の中身を平方数にするため、1080の平方数の約数を調べる。',
    questions: [
      {prompt:'360/nが整数となる自然数nのうち、nが30の倍数で100以下のものをすべて求めなさい。',answer:'30,60,90',explanation:'30,60,90はいずれも360を割り切るか確認する。'},
      {prompt:'72/nが整数となる自然数nをすべて求めなさい。',answer:'1,2,3,4,6,8,9,12,18,24,36,72',explanation:'72の正の約数を列挙する。'},
      {prompt:'180/nが整数となる自然数nのうち20以上のものをすべて求めなさい。',answer:'20,30,36,45,60,90,180',explanation:'180の約数から20以上を選ぶ。'},
      {prompt:'120/nが整数となる自然数nのうちnが10の倍数であるものをすべて求めなさい。',answer:'10,20,30,40,60,120',explanation:'120の約数かつ10の倍数。'}
    ]
  },
  '2019-Q1-8': {
    coreSkill: '正方形の面積=対角線^2/2 を使ってから角すいの体積公式へ。',
    questions: [
      {prompt:'正方形の対角線が6cmです。この正方形の面積を求めなさい。',answer:'18',explanation:'正方形の面積は対角線²÷2=36÷2=18。'},
      {prompt:'底面積18cm²、高さ10cmの四角すいの体積を求めなさい。',answer:'60',explanation:'18×10÷3=60。'},
      {prompt:'正四角すいの体積が96cm³、底面の正方形の対角線が8cmです。高さを求めなさい。',answer:'9',explanation:'底面積=8²÷2=32。96=32h/3よりh=9。'},
      {prompt:'正四角すいの体積が50cm³、底面の正方形の対角線が5cmです。高さを求めなさい。',answer:'12',explanation:'底面積=25/2。50=(25/2)h/3よりh=12。'}
    ]
  },
  '2019-Q1-9': {
    coreSkill: '解を r と 2r と置き、解と係数の関係を2本使う。',
    questions: [
      {prompt:'二次方程式x²-6x+a=0の2解が2倍の関係にあります。aを求めなさい。',answer:'8',explanation:'解をr,2rとすると和3r=6よりr=2、積a=8。'},
      {prompt:'二次方程式x²+9x+a=0の2解が2倍の関係にあります。aを求めなさい。',answer:'18',explanation:'r+2r=-9よりr=-3、積a=18。'},
      {prompt:'二次方程式x²-12x+a=0の2解が3倍の関係にあります。aを求めなさい。',answer:'27',explanation:'r+3r=12よりr=3、積3r²=27。'},
      {prompt:'二次方程式x²+8x+a=0の2解が3倍の関係にあります。aを求めなさい。',answer:'12',explanation:'4r=-8よりr=-2、積3r²=12。'}
    ]
  }

,
  '2025-Q2-1': {
    coreSkill: '点Pの座標を放物線へ代入する。',
    questions: [
      {prompt:'放物線y=ax²が点(4,8)を通ります。aを求めなさい。',answer:'1/2',explanation:'8=16aよりa=1/2。'},
      {prompt:'放物線y=ax²が点(-3,6)を通ります。aを求めなさい。',answer:'2/3',explanation:'6=9aよりa=2/3。'},
      {prompt:'放物線y=ax²が点(2,-3)を通ります。aを求めなさい。',answer:'-3/4',explanation:'-3=4a。'},
      {prompt:'放物線y=ax²が点(-5,10)を通ります。aを求めなさい。',answer:'2/5',explanation:'10=25a。'}
    ]
  },
  '2025-Q2-2': {
    coreSkill: '縦線PS,RTはそのまま放物線上のy座標。Rの符号条件を使う。',
    questions: [
      {prompt:'放物線y=x²と直線lが点P(2,4), R(-1,1)で交わります。lとy軸の交点Qのy座標を求めなさい。',answer:'2',explanation:'P,Rを通る直線の傾きは1、y=x+2。'},
      {prompt:'放物線y=x²と直線lが点P(3,9), R(-2,4)で交わります。lとy軸の交点Qのy座標を求めなさい。',answer:'6',explanation:'傾き1なのでy=x+6。'},
      {prompt:'放物線y=2x²と直線lが点P(2,8), R(-1,2)で交わります。lとy軸の交点Qを求めなさい。',answer:'(0,4)',acceptedAnswers:['0,4'],explanation:'傾き2、直線y=2x+4。'},
      {prompt:'放物線y=x²/2と直線lが点P(4,8), R(-2,2)で交わります。lとy軸の交点Qを求めなさい。',answer:'(0,4)',acceptedAnswers:['0,4'],explanation:'傾き1、y=x+4。'}
    ]
  },
  '2025-Q2-3': {
    coreSkill: '台形の半分を、Qと左辺でできる三角形の面積として設定する。',
    questions: [
      {prompt:'平行な辺の長さが2と6、間隔8の台形がある。点Qから長さ6の辺までの距離は4。Qからその辺上のUへ線を引き、△RQUが台形面積の半分になるようにする。RUを求めなさい。',answer:'8',explanation:'台形面積=(2+6)×8/2=32、半分16。△RQU=RU×4/2=16よりRU=8。'},
      {prompt:'平行な辺3と5、間隔6の台形。Qから左辺までの水平距離3。△RQUを台形面積の半分にするときRUを求めなさい。',answer:'8',explanation:'台形面積24、半分12。RU×3/2=12。'},
      {prompt:'平行な辺1と4、間隔6√2の台形。Qから左辺まで4√2。△RQUを台形面積の半分にするときRUを求めなさい。',answer:'15/4',explanation:'台形面積15√2、半分15√2/2。RU·4√2/2=15√2/2。'},
      {prompt:'Q=(0,2)、左辺がx=-4で上端R=(-4,5)です。点Uは左辺上でRU=3です。Uの座標と直線QUの式を求めなさい。',answer:'U=(-4,2), y=2',explanation:'Rから下へ3なのでU=(-4,2)。Qと同じy。'}
    ]
  },
  '2025-Q3-1': {
    coreSkill: '3次元なので分割数を3乗する。',
    questions: [
      {prompt:'1辺12cmの立方体を1辺3cmの小立方体に分けます。小立方体は何個できますか。',answer:'64',explanation:'1辺4個なので4³=64。'},
      {prompt:'1辺10cmの立方体を1辺2cmの小立方体に分けます。何個できますか。',answer:'125',explanation:'1辺5個なので5³=125。'},
      {prompt:'1辺15cmの立方体を1辺5cmの小立方体に分けます。何個できますか。',answer:'27',explanation:'1辺3個なので27個。'},
      {prompt:'1辺18cmの立方体を1辺3cmの小立方体に分けます。何個できますか。',answer:'216',explanation:'1辺6個なので6³=216。'}
    ]
  },
  '2025-Q3-2': {
    coreSkill: '角は3面、辺の中央は2面、面中央は1面と分類する。',
    questions: [
      {prompt:'全面を塗った立方体を4×4×4に分けます。ちょうど2面が塗られた小立方体の個数を求めなさい。',answer:'24',explanation:'12(n-2)=12×2=24。'},
      {prompt:'全面を塗った立方体を5×5×5に分けます。ちょうど2面が塗られた小立方体の個数を求めなさい。',answer:'36',explanation:'12×3=36。'},
      {prompt:'全面を塗った立方体を3×3×3に分けます。ちょうど2面が塗られたものを1個選ぶ確率を求めなさい。',answer:'4/9',explanation:'2面塗りは12個、全27個。'},
      {prompt:'全面を塗った立方体を6×6×6に分けます。ちょうど2面が塗られた小立方体は何個ですか。',answer:'48',explanation:'12×4=48。'}
    ]
  },
  '2025-Q3-3': {
    coreSkill: '赤面数ごとの個数を先に表にする。2個は同時抽出なので順序なし。',
    questions: [
      {prompt:'3×3×3に分けた全面塗装立方体から2個選びます。塗られた面数の和が3となる組は何通りありますか。',answer:'80',explanation:'0面×3面は1×8=8、1面×2面は6×12=72、合計80。'},
      {prompt:'3×3×3の全面塗装立方体で、2個選ぶ全組合せは何通りですか。',answer:'351',explanation:'27個から2個なので27×26÷2=351。'},
      {prompt:'3×3×3の全面塗装立方体から2個選び、塗られた面数の和が3となる確率を求めなさい。',answer:'80/351',explanation:'有利80通り、全351通り。'},
      {prompt:'4×4×4の全面塗装立方体で、3面塗りと0面塗りを1個ずつ選ぶ組合せは何通りですか。',answer:'64',explanation:'3面塗り8個、0面塗り(4-2)³=8個なので8×8=64。'}
    ]
  },
  '2025-Q4-1': {
    coreSkill: '食塩の質量を足してから全体質量で割る。',
    questions: [
      {prompt:'6%食塩水50gと10%食塩水50gを混ぜると何%ですか。',answer:'8%',acceptedAnswers:['8'],explanation:'食塩3+5=8g、全体100g。'},
      {prompt:'5%食塩水20gと15%食塩水30gを混ぜると何%ですか。',answer:'11%',acceptedAnswers:['11'],explanation:'食塩1+4.5=5.5g、全体50gで11%。'},
      {prompt:'8%食塩水25gと12%食塩水75gを混ぜると何%ですか。',answer:'11%',acceptedAnswers:['11'],explanation:'2+9=11g/100g。'},
      {prompt:'4%食塩水40gと14%食塩水60gを混ぜると何%ですか。',answer:'10%',acceptedAnswers:['10'],explanation:'1.6+8.4=10g/100g。'}
    ]
  },
  '2025-Q4-2': {
    coreSkill: '同じ操作の繰り返しは食塩量に同じ残存率を掛ける。',
    questions: [
      {prompt:'10%食塩水200gから毎回50g捨てて50gの水を加える操作を2回します。最後の食塩量を求めなさい。',answer:'11.25',explanation:'初め20g。1回ごとに3/4残るので20×(3/4)²=11.25。'},
      {prompt:'12%食塩水300gから毎回60g捨てて水60gを加える操作を2回します。最後の食塩量を求めなさい。',answer:'23.04',explanation:'36×(4/5)²=23.04。'},
      {prompt:'8%食塩水250gから毎回50g捨てて水50gを加える操作を3回します。最後の食塩量を求めなさい。',answer:'10.24',explanation:'20×(4/5)³=10.24。'},
      {prompt:'10%食塩水100gに対し、毎回b g捨てて水b gを加える操作を2回したら食塩量が6.4gになりました。bを求めなさい。',answer:'20',explanation:'10(1-b/100)²=6.4より1-b/100=0.8。'}
    ]
  },
  '2025-Q4-3': {
    coreSkill: '誤って加えた5%食塩水の食塩0.05cを最後に足す。',
    questions: [
      {prompt:'10%食塩水100gから20g捨てた後、20gの5%食塩水を加えました。最終濃度を求めなさい。',answer:'9%',acceptedAnswers:['9'],explanation:'残る食塩8g、加える食塩1g、合計9g/100g。'},
      {prompt:'12%食塩水200gから50g捨てた後、50gの4%食塩水を加えました。最終濃度を求めなさい。',answer:'10%',acceptedAnswers:['10'],explanation:'残る食塩18g、加える2g、20g/200g。'},
      {prompt:'8%食塩水150gから30g捨てた後、30gの3%食塩水を加えました。最終濃度を求めなさい。',answer:'7%',acceptedAnswers:['7'],explanation:'残る9.6g、加える0.9g、10.5/150=7%。'},
      {prompt:'10%食塩水100gからc g捨て、同量の5%食塩水を加えたら9%になりました。cを求めなさい。',answer:'20',explanation:'10-0.1c+0.05c=9よりc=20。'}
    ]
  },
  '2026-Q2-1': {
    coreSkill: '同じ余りzならM-zが両方の割る数の公倍数。',
    questions: [
      {prompt:'Mを4で割っても6で割っても1余ります。2桁のMをすべて求めなさい。',answer:'13,25,37,49,61,73,85,97',explanation:'M-1は4と6の公倍数、つまり12の倍数。'},
      {prompt:'Mを5で割っても7で割っても2余ります。2桁のMをすべて求めなさい。',answer:'37,72',explanation:'M-2は35の倍数。'},
      {prompt:'Mを3で割っても8で割っても2余ります。2桁のMをすべて求めなさい。',answer:'26,50,74,98',explanation:'M-2は24の倍数。'},
      {prompt:'Mを6で割っても9で割っても4余ります。50以下の正のMをすべて求めなさい。',answer:'22,40',explanation:'M-4は18の倍数で、余り4は各除数より小さい。'}
    ]
  },
  '2026-Q2-2': {
    coreSkill: '和と積からx,yを求め、Mを実際に割って共通の余りを確認する。',
    questions: [
      {prompt:'x+y=14, xy=45, M=92で、Mをxでもyでも割った余りがzです。zを求めなさい。',answer:'2',explanation:'x,yは5,9。92はどちらでも2余る。'},
      {prompt:'x+y=17, xy=60, M=123で、共通の余りzを求めなさい。',answer:'3',explanation:'x,yは5,12。123は5で3余るが12で3余る。'},
      {prompt:'x+y=13, xy=36, M=75で、共通の余りzを求めなさい。',answer:'3',explanation:'x,yは4,9。75は両方で3余る。'},
      {prompt:'x+y=19, xy=84, M=170で、共通の余りzを求めなさい。',answer:'2',explanation:'x,yは7,12。170は7でも12でも2余る。'}
    ]
  },
  '2026-Q2-3': {
    coreSkill: '共通余りを引いたM-z=36の約数条件にする。',
    questions: [
      {prompt:'x:y=3:2, x+y=25, z=1, M=61です。(x,y)を求めなさい。',answer:'(15,10)',acceptedAnswers:['15,10'],explanation:'x=3k,y=2kより5k=25、k=5。60は15と10の両方で割り切れる。'},
      {prompt:'x:y=2:1, x+y=18, z=2, M=50です。(x,y)を求めなさい。',answer:'(12,6)',acceptedAnswers:['12,6'],explanation:'x=2k,y=k、3k=18よりk=6。48は12と6の両方で割り切れる。'},
      {prompt:'x:y=4:3, x+y=14, z=1, M=49です。(x,y)を求めなさい。',answer:'(8,6)',acceptedAnswers:['8,6'],explanation:'x=4k,y=3k、7k=14よりk=2。48は8と6の公倍数。'},
      {prompt:'x:y=5:3, x+y=16, z=2, M=62です。(x,y)を求めなさい。',answer:'(10,6)',acceptedAnswers:['10,6'],explanation:'x=5k,y=3k、8k=16よりk=2。60は10と6で割り切れる。'}
    ]
  },
  '2026-Q3-1': {
    coreSkill: '該当カードを直接数える。',
    questions: [
      {prompt:'1〜10のカードから1枚引きます。3の倍数を引く確率を求めなさい。',answer:'3/10',explanation:'3,6,9の3枚。'},
      {prompt:'1〜9のカードから1枚引きます。偶数を引く確率を求めなさい。',answer:'4/9',explanation:'2,4,6,8の4枚。'},
      {prompt:'1〜12のカードから1枚引きます。4の倍数を引く確率を求めなさい。',answer:'1/4',explanation:'4,8,12の3枚で3/12。'},
      {prompt:'1〜8のカードから1枚引きます。素数を引く確率を求めなさい。',answer:'1/2',explanation:'2,3,5,7の4枚。'}
    ]
  },
  '2026-Q3-2': {
    coreSkill: 'Aの値ごとに「Aの倍数でA自身を除くB」を数える。',
    questions: [
      {prompt:'1〜6から戻さず順に2枚引きます。2枚目が1枚目の倍数となる確率を求めなさい。',answer:'4/15',explanation:'有利は(1,2〜6)5組+(2,4),(2,6),(3,6)3組=8組。全30組なので4/15。'},
      {prompt:'1〜5から戻さず順に2枚引きます。2枚目が1枚目の倍数となる順序付き組は何組ですか。',answer:'5',explanation:'(1,2),(1,3),(1,4),(1,5),(2,4)。'},
      {prompt:'1〜8から戻さず順に2枚引きます。1枚目が4のとき、2枚目がその倍数となる確率を求めなさい。',answer:'1/7',explanation:'残り7枚のうち8だけ。'},
      {prompt:'1〜8から戻さず順に2枚引きます。1枚目が3のとき、2枚目がその倍数となる確率を求めなさい。',answer:'1/7',explanation:'残り7枚のうち3の倍数は6だけ。'}
    ]
  },
  '2026-Q3-3': {
    coreSkill: 'Cを先に固定し、Cの真の約数からA,Bを順序付きで2つ選ぶ。',
    questions: [
      {prompt:'1〜6からA,B,Cの順に戻さず1枚ずつ引きます。CがAとBの両方の倍数となる例を1組(A,B,C)で答えなさい。',answer:'(1,2,4)',acceptedAnswers:['1,2,4'],explanation:'4は1と2の両方の倍数。'},
      {prompt:'A=2,B=3のとき、1〜8の残りカードからCを引きます。Cが両方の倍数となる確率を求めなさい。',answer:'1/6',explanation:'残り6枚のうち6だけが2と3の公倍数。'},
      {prompt:'A=1,B=4のとき、1〜8の残りカードからCを引きます。Cが両方の倍数となる確率を求めなさい。',answer:'1/6',explanation:'残り6枚のうち8だけ。'},
      {prompt:'A=2,B=4のとき、1〜8の残りカードからCを引きます。Cが両方の倍数となる確率を求めなさい。',answer:'1/6',explanation:'残り6枚のうち8だけ。'}
    ]
  }
,
  '2019-Q2-1': {
    coreSkill: '相似な正三角形の辺の比を面積比の2乗へつなげる。',
    questions: [
      {prompt:'相似な2つの正三角形の対応辺の比が1:3です。面積比を最簡整数比で答えなさい。',answer:'1:9',explanation:'相似図形の面積比は辺の比の2乗。'},
      {prompt:'相似な2つの正三角形の面積比が4:25です。対応辺の比を答えなさい。',answer:'2:5',explanation:'面積比の平方根を取る。'},
      {prompt:'相似な2つの三角形で小さい方の辺が6、大きい方が15です。小さい方の面積が12のとき大きい方の面積を求めなさい。',answer:'75',explanation:'辺比2:5なので面積比4:25。12×25/4=75。'},
      {prompt:'相似な2つの正三角形の辺の比が3:4です。面積の差が35のとき小さい方の面積を求めなさい。',answer:'45',explanation:'面積比9:16、差7部分=35より1部分5、小さい方45。'}
    ]
  },
  '2019-Q2-2': {
    coreSkill: '中央六角形を6個の正三角形に分ける。',
    questions: [
      {prompt:'正六角形を中心から6個の合同な正三角形に分けました。1個の三角形の面積が5のとき正六角形の面積を求めなさい。',answer:'30',explanation:'6個分で30。'},
      {prompt:'正六角形の面積が42です。中心から分けた合同な正三角形1個の面積を求めなさい。',answer:'7',explanation:'42÷6=7。'},
      {prompt:'正六角形を6個の合同な正三角形に分け、そのうち2個を除いた部分の面積が32です。正六角形全体の面積を求めなさい。',answer:'48',explanation:'残り4個で32なので1個8、全体48。'},
      {prompt:'中心から6等分した正六角形で、3個分の面積が27です。全体の面積を求めなさい。',answer:'54',explanation:'1個9、6個で54。'}
    ]
  },
  '2019-Q3-1': {
    coreSkill: '同じX4個とY1個の並べ方に直す。',
    questions: [
      {prompt:'Xを4個、Yを1個並べてできる異なる文字列は何通りですか。',answer:'5',explanation:'Yの位置を5か所から選ぶ。'},
      {prompt:'Aを3個、Bを2個並べる異なる並べ方は何通りですか。',answer:'10',explanation:'5!/(3!2!)=10。'},
      {prompt:'Xを5個、Yを2個並べる異なる並べ方は何通りですか。',answer:'21',explanation:'7C2=21。'},
      {prompt:'Pを4個、Qを2個、Rを1個並べる異なる並べ方は何通りですか。',answer:'105',explanation:'7!/(4!2!)=105。'}
    ]
  },
  '2019-Q3-2': {
    coreSkill: '『必ずCに止まる』条件を、Cまでの移動列で場合分けする。',
    questions: [
      {prompt:'右へ3回、上へ2回進んで目的地へ行きます。途中の点(1,1)を必ず通る最短経路は何通りですか。',answer:'6',explanation:'(0,0)→(1,1)が2通り、(1,1)→(3,2)が3通りで6。'},
      {prompt:'右へ4回、上へ2回。点(2,1)を必ず通る最短経路は何通りですか。',answer:'9',explanation:'前半3通り、後半3通りで9。'},
      {prompt:'右へ5回、上へ3回。点(2,2)を必ず通る最短経路は何通りですか。',answer:'24',explanation:'前半6通り、後半4通りで24。'},
      {prompt:'右へ3回、上へ3回。点(1,2)を必ず通る最短経路は何通りですか。',answer:'9',explanation:'前半3通り、後半3通りで9。'}
    ]
  },
  '2019-Q3-3': {
    coreSkill: '距離条件と時間条件で可能な(X,Y)回数を絞ってから数える。',
    questions: [
      {prompt:'Xは1回2分、Yは1回3分かかります。合計5回動き、12分以内となる(X回数,Y回数)をすべて答えなさい。',answer:'(3,2),(4,1),(5,0)',explanation:'x+y=5,2x+3y≤12を満たす整数組。'},
      {prompt:'Xは1回1分、Yは1回4分。合計4回で10分以内のときYは最大何回ですか。',answer:'2',explanation:'4-y+4y=4+3y≤10。'},
      {prompt:'Xは2分、Yは5分。合計6回で18分ちょうどのときYの回数を求めなさい。',answer:'2',explanation:'2(6-y)+5y=18よりy=2。'},
      {prompt:'Xは3分、Yは4分。合計5回で17分以下となるYの最大回数を求めなさい。',answer:'2',explanation:'15+y≤17。'}
    ]
  },
  '2019-Q4-1': {
    coreSkill: 'グラフの直線部分を比例配分する。',
    questions: [
      {prompt:'直線グラフで時刻2の値が10、時刻8の値が40です。時刻5の値を求めなさい。',answer:'25',explanation:'直線なので3/6だけ進み、10+(40-10)×3/6=25。'},
      {prompt:'時刻0で12、時刻6で30の直線変化です。時刻4の値を求めなさい。',answer:'24',explanation:'1あたり3増える。'},
      {prompt:'時刻3で20、時刻7で8の直線変化です。時刻5の値を求めなさい。',answer:'14',explanation:'中点なので平均14。'},
      {prompt:'時刻1で5、時刻9で37の直線変化です。値が25になる時刻を求めなさい。',answer:'6',explanation:'傾き4、5+4(t-1)=25。'}
    ]
  },
  '2019-Q4-2': {
    coreSkill: '放水中の傾きから『放水量』を分離する。',
    questions: [
      {prompt:'貯水量が毎分3増える流入中に毎分8放水すると、貯水量は毎分5減ります。放水量を求めなさい。',answer:'8',explanation:'正味-5=流入3-放水量。'},
      {prompt:'毎分4の流入があり、放水中の貯水量が毎分7減ります。毎分の放水量を求めなさい。',answer:'11',explanation:'4-r=-7。'},
      {prompt:'放水を止めると毎分6増え、放水中は毎分2減ります。放水量を求めなさい。',answer:'8',explanation:'6-r=-2。'},
      {prompt:'毎分5流入するタンクを毎分12放水します。貯水量の1分あたりの変化を求めなさい。',answer:'-7',explanation:'5-12=-7。'}
    ]
  },
  '2019-Q4-3': {
    coreSkill: '『20になる瞬間が1周期に2回』を周期数へ変換する。',
    questions: [
      {prompt:'1周期10分の周期運動で、ある値を1周期に2回通過します。40分間では何回通過しますか。',answer:'8',explanation:'4周期×2回。'},
      {prompt:'1周期12分で1周期に2回通過する値があります。60分では何回ですか。',answer:'10',explanation:'5周期×2。'},
      {prompt:'1周期8分の運動で、ある値を合計6回通過するのに要する時間を、周期の端点を数えない設定で求めなさい。',answer:'24',explanation:'1周期2回なので3周期。'},
      {prompt:'1周期15分で1周期に2回ある高さを通ります。90分間の通過回数を求めなさい。',answer:'12',explanation:'6周期×2。'}
    ]
  },
  '2019-Q5-1': {
    coreSkill: 'y=x^2上の2点を結ぶ傾きはx座標の和になる。',
    questions: [
      {prompt:'y=x²上のx座標1と4の2点を結ぶ直線の傾きを求めなさい。',answer:'5',explanation:'傾き=(16-1)/(4-1)=5=1+4。'},
      {prompt:'y=x²上のx座標-2と5の2点を結ぶ直線の傾きを求めなさい。',answer:'3',explanation:'x座標の和-2+5=3。'},
      {prompt:'y=x²上の2点のx座標がaと3で、弦の傾きが7です。aを求めなさい。',answer:'4',explanation:'a+3=7。'},
      {prompt:'y=x²上のx座標p,qの2点を結ぶ弦の傾きが10でp=4です。qを求めなさい。',answer:'6',explanation:'p+q=10。'}
    ]
  },
  '2019-Q5-2': {
    coreSkill: '連続する2点のx座標の和が、その弦の傾きになる。',
    questions: [
      {prompt:'y=x²上の3点A,B,Cのx座標をa<b<cとし、ABの傾きが5、BCの傾きが9です。a+bとb+cを答えなさい。',answer:'5,9',explanation:'弦の傾きは端点のx座標の和。'},
      {prompt:'y=x²上でABの傾き7、BCの傾き11、b=4のときa,cを答えなさい。',answer:'3,7',explanation:'a+4=7,4+c=11。'},
      {prompt:'y=x²上でAのx座標-1、ABの傾き3、BCの傾き9です。B,Cのx座標を答えなさい。',answer:'4,5',explanation:'b=4、b+c=9よりc=5。'},
      {prompt:'y=x²上でA,B,Cのx座標が1,b,6、ABの傾き5のときbを求めなさい。',answer:'4',explanation:'1+b=5。'}
    ]
  },
  '2019-Q5-3': {
    coreSkill: '比からaを確定し、座標で交点と面積を計算する。',
    questions: [
      {prompt:'B=(-a,0), C=(6,6)。EはBCをBE:EC=1:2に内分しy軸上にある。A=(3,8), D=(0,6)とし、直線AEとCDの交点をFとする。a、F、△OEFの面積を求めなさい。',answer:'a=3, F=(2,6), 面積2',explanation:'内分点E=((2B+C)/3)=(0,2)よりa=3。AEはy=2x+2、CDはy=6なのでF=(2,6)。'},
      {prompt:'B=(-a,0), C=(12,9)。EはBCを1:2に内分しy軸上。A=(4,11), D=(0,9)。AEとCDの交点Fと△OEFの面積を求めなさい。',answer:'a=6, F=(3,9), 面積9/2',explanation:'E=(0,3)よりa=6。AE:y=2x+3、CD:y=9、F=(3,9)。△OEF=3×3÷2。'},
      {prompt:'B=(-a,0), C=(6,6)。EはBCを2:1に内分しy軸上。A=(4,12), D=(0,9)。AEとCDの交点Fと△OEFの面積を求めなさい。',answer:'a=12, F=(2,8), 面積4',explanation:'E=(0,4)よりa=12。AE:y=2x+4。CDはC(6,6),D(0,9)を通りF=(2,8)。面積は4。'},
      {prompt:'B=(-a,0), C=(10,5)。EはBCを3:2に内分しy軸上。A=(5,13), D=(-4,13)。AEとCDの交点Fと△OEFの面積を求めなさい。',answer:'a=15, F=(3,9), 面積9/2',explanation:'E=(0,3)よりa=15。AE:y=2x+3。CDと連立してF=(3,9)。△OEF=3×3÷2。'}
    ]
  },
  '2020-Q1-1': {
    coreSkill: '平方の展開と和差積を別々に処理する。',
    questions: [
      {prompt:'（√3+2）²-(√3-2)²を計算しなさい。',answer:'8√3',explanation:'展開または(a+b)^2-(a-b)^2=4ab。'},
      {prompt:'（√5+1）（√5-1）を計算しなさい。',answer:'4',explanation:'平方の差。'},
      {prompt:'（2+√2）²を計算しなさい。',answer:'6+4√2',explanation:'4+4√2+2。'},
      {prompt:'（3√2-1）（3√2+1）を計算しなさい。',answer:'17',explanation:'18-1。'}
    ]
  },
  '2020-Q1-2': {
    coreSkill: '分母を払ってから加減法で解く。',
    questions: [
      {prompt:'x/2+y/3=4, x-y=1を解き(x,y)で答えなさい。',answer:'(26/5,21/5)',explanation:'第1式を6倍して3x+2y=24。'},
      {prompt:'x/3-y/2=1, x+y=7を解き(x,y)で答えなさい。',answer:'(27/5,8/5)',explanation:'第1式を6倍して2x-3y=6。'},
      {prompt:'x/4+y/2=3, x-y=3を解き(x,y)で答えなさい。',answer:'(6,3)',explanation:'第1式を4倍してx+2y=12。'},
      {prompt:'x/5-y/3=1, x+y=9を解き(x,y)で答えなさい。',answer:'(15/2,3/2)',explanation:'15倍して3x-5y=15。'}
    ]
  },
  '2020-Q1-3': {
    coreSkill: '解の公式で判別式49-20=29を丁寧に計算する。',
    questions: [
      {prompt:'2x²+3x-1=0を解きなさい。',answer:'(-3±√17)/4',explanation:'解の公式を使う。'},
      {prompt:'3x²-2x-2=0を解きなさい。',answer:'(1±√7)/3',explanation:'判別式4+24=28。'},
      {prompt:'5x²+x-1=0を解きなさい。',answer:'(-1±√21)/10',explanation:'判別式1+20=21。'},
      {prompt:'2x²-5x-1=0を解きなさい。',answer:'(5±√33)/4',explanation:'判別式25+8=33。'}
    ]
  },
  '2020-Q1-4': {
    coreSkill: '変化の割合はyの増加量÷xの増加量。',
    questions: [
      {prompt:'y=x²でx=1からx=5までの変化の割合を求めなさい。',answer:'6',explanation:'(25-1)/(5-1)=6。'},
      {prompt:'y=2x²でx=-1からx=3までの変化の割合を求めなさい。',answer:'4',explanation:'(18-2)/4=4。'},
      {prompt:'y=-x²でx=-3からx=1までの変化の割合を求めなさい。',answer:'2',explanation:'(-1+9)/4=2。'},
      {prompt:'y=3x²でx=2からx=4までの変化の割合を求めなさい。',answer:'18',explanation:'(48-12)/2=18。'}
    ]
  },
  '2020-Q1-5': {
    coreSkill: '展開図では側面の弧の長さ=底面の円周。',
    questions: [
      {prompt:'底面半径3cm、母線9cmの円すいの展開図で、側面のおうぎ形の中心角を求めなさい。',answer:'120',explanation:'弧長6π、半径9の円周18πの1/3。'},
      {prompt:'底面半径4cm、母線10cmの円すいの展開図の中心角を求めなさい。',answer:'144',explanation:'弧長8π、全周20πの2/5。'},
      {prompt:'展開図のおうぎ形の半径12cm、中心角150°の円すいがあります。底面半径を求めなさい。',answer:'5',explanation:'弧長=2π×12×150/360=10π=2πr。'},
      {prompt:'母線15cm、底面半径5cmの円すいの展開図の中心角を求めなさい。',answer:'120',explanation:'半径比5/15=1/3なので120°。'}
    ]
  },
  '2020-Q1-6': {
    coreSkill: '円の部分は「扇形−三角形」で表し、πを含む面積を最後に打ち消す。',
    questions: [
      {prompt:'半径2、中心角90°のおうぎ形から、2本の半径を辺とする直角三角形を除いた部分の面積を求めなさい。',answer:'π-2',explanation:'扇形π、三角形2。'},
      {prompt:'半径4、中心角90°のおうぎ形から直角三角形を除いた面積を求めなさい。',answer:'4π-8',explanation:'扇形4π、三角形8。'},
      {prompt:'半径6、中心角60°のおうぎ形の面積を求めなさい。',answer:'6π',explanation:'36π×1/6。'},
      {prompt:'半径3、中心角120°のおうぎ形の面積を求めなさい。',answer:'3π',explanation:'9π×1/3。'}
    ]
  },
  '2020-Q1-7': {
    coreSkill: '素因数の指数をすべて偶数にする。',
    questions: [
      {prompt:'72nが平方数となる最小の正の整数nを求めなさい。',answer:'2',explanation:'72=2³×3²、2を補う。'},
      {prompt:'50nが平方数となる最小の正の整数nを求めなさい。',answer:'2',explanation:'50=2×5²、2を補う。'},
      {prompt:'108nが平方数となる最小の正の整数nを求めなさい。',answer:'3',explanation:'108=2²×3³、3を補う。'},
      {prompt:'45nが平方数となる最小の正の整数nを求めなさい。',answer:'5',explanation:'45=3²×5、5を補う。'}
    ]
  },
  '2020-Q1-8': {
    coreSkill: '平行四辺形では面積比だけを見るため、座標を簡単な形に置き換える。',
    questions: [
      {prompt:'平行四辺形ABCDでMはABの中点です。△AMDと△MBCの面積比を求めなさい。',answer:'1:1',explanation:'どちらも底辺がABの半分で高さが同じ。'},
      {prompt:'平行四辺形ABCDでMはABを1:3に内分します。△AMD:△MBCを求めなさい。',answer:'1:3',explanation:'共通高さなので底辺比。'},
      {prompt:'平行四辺形ABCDの面積が40、MはABの中点です。△AMDの面積を求めなさい。',answer:'10',explanation:'△ABDが20、その半分。'},
      {prompt:'平行四辺形ABCDでMはABを2:3に内分し、平行四辺形の面積が50です。△AMDの面積を求めなさい。',answer:'10',explanation:'△ABD=25、その2/5。'}
    ]
  },
  '2020-Q2-1': {
    coreSkill: '順序を区別して36通りから数える。',
    questions: [
      {prompt:'2個のサイコロの和が8になる確率を求めなさい。',answer:'5/36',explanation:'順序付き36通り中5通り。'},
      {prompt:'2個のサイコロの和が5になる確率を求めなさい。',answer:'1/9',explanation:'4/36。'},
      {prompt:'2個のサイコロの和が10以上になる確率を求めなさい。',answer:'1/6',explanation:'和10,11,12は3+2+1=6通り。'},
      {prompt:'2個のサイコロの和が4以下になる確率を求めなさい。',answer:'1/6',explanation:'和2,3,4は1+2+3=6通り。'}
    ]
  },
  '2020-Q2-2': {
    coreSkill: 'まず(a,b)の積が1〜6になる組を数え、cはその積で一意に決まる。',
    questions: [
      {prompt:'サイコロを3回投げ、3回目の目が1回目と2回目の積になる確率を求めなさい。',answer:'7/108',explanation:'(a,b)でab≤6は14組、全216。'},
      {prompt:'1〜4の目のサイコロを3回投げ、3回目が最初2回の積になる組は何通りですか。',answer:'8',explanation:'ab≤4の順序付き(a,b)は8組。'},
      {prompt:'1〜6の目でa×b=6となる順序付き(a,b)は何組ですか。',answer:'4',explanation:'(1,6),(2,3),(3,2),(6,1)。'},
      {prompt:'1〜6の目でa×b≤6となる順序付き(a,b)は何組ですか。',answer:'14',explanation:'a=1で6、2で3、3で2、4,5,6で各1。'}
    ]
  },
  '2020-Q2-3': {
    coreSkill: '積の値ごとの出現数を表にして畳み込む。',
    questions: [
      {prompt:'2個のサイコロの積が6となる順序付き組は何通りですか。',answer:'4',explanation:'(1,6),(2,3),(3,2),(6,1)。'},
      {prompt:'2個のサイコロの積が12となる順序付き組は何通りですか。',answer:'4',explanation:'(2,6),(3,4),(4,3),(6,2)。'},
      {prompt:'4回のサイコロを(a,b,c,d)とし、ab=cd=6となる組は何通りですか。',answer:'16',explanation:'各4通りなので4×4。'},
      {prompt:'4回のサイコロでab=4かつcd=6となる順序付き四つ組は何通りですか。',answer:'12',explanation:'ab=4は3通り、cd=6は4通り。'}
    ]
  },
  '2020-Q3-1': {
    coreSkill: '交点は放物線と直線の両方を満たす。',
    questions: [
      {prompt:'放物線y=ax²と直線y=2x+3が点(1,5)で交わります。aを求めなさい。',answer:'5',explanation:'交点は両式を満たす。'},
      {prompt:'y=ax²とy=-x+6が点(2,4)で交わるときaを求めなさい。',answer:'1',explanation:'4=4a。'},
      {prompt:'y=ax²とy=3x-2が点(2,4)で交わるときaを求めなさい。',answer:'1',explanation:'4=4a。'},
      {prompt:'y=ax²と直線y=x+2が点(-1,1)で交わるときaを求めなさい。',answer:'1',explanation:'1=a。'}
    ]
  },
  '2020-Q3-2': {
    coreSkill: '共通底辺OPを使い、高さ=|x座標|だけ比べる。',
    questions: [
      {prompt:'三角形OAPとOBPが共通底辺OPをもち、A,BのOPへの高さが2:5です。面積比を求めなさい。',answer:'2:5',explanation:'共通底辺なら面積比=高さ比。'},
      {prompt:'共通底辺をもつ2三角形の面積比が3:7です。高さ比を求めなさい。',answer:'3:7',explanation:'底辺共通。'},
      {prompt:'座標平面でOPがy軸上にあり、Aのx座標が-2、Bのx座標が6です。△OAP:△OBPを求めなさい。',answer:'1:3',explanation:'y軸への高さは|x|。'},
      {prompt:'同じ底辺PQをもつ△APQと△BPQの面積が12,30です。高さ比を求めなさい。',answer:'2:5',explanation:'12:30=2:5。'}
    ]
  },
  '2020-Q3-3': {
    coreSkill: '面積比を交点のx座標比に置き換え、二次方程式の解と係数を使う。',
    questions: [
      {prompt:'二次方程式x²-2x-k=0の2解をα<0<βとする。面積比から(-α):β=1:3と分かった。kを求めなさい。',answer:'3',explanation:'α=-u,β=3u。和2u=2よりu=1、積=-3=-k。'},
      {prompt:'x²-3x-k=0の2解α<0<βが(-α):β=1:2です。kを求めなさい。',answer:'18',explanation:'α=-u,β=2u、和u=3よりu=3。αβ=-18=-k。'},
      {prompt:'x²-x-k=0の2解α<0<βが(-α):β=2:3です。kを求めなさい。',answer:'6',explanation:'α=-2u,β=3u、和u=1。積=-6=-k。'},
      {prompt:'x²-4x-k=0の2解α<0<βが(-α):β=1:5です。kを求めなさい。',answer:'5',explanation:'α=-u,β=5u、和4u=4よりu=1。積=-5=-k。'}
    ]
  },
  '2020-Q4-1': {
    coreSkill: '分針の角速度は6°/分。',
    questions: [
      {prompt:'分針は20分で何度進みますか。',answer:'120',explanation:'6°/分。'},
      {prompt:'分針が210°進むのに何分かかりますか。',answer:'35',explanation:'210÷6。'},
      {prompt:'15分間で分針と時針はそれぞれ何度進みますか。',answer:'90,7.5',explanation:'分針6°/分、時針0.5°/分。'},
      {prompt:'分針が半周するのに何分かかりますか。',answer:'30',explanation:'180÷6。'}
    ]
  },
  '2020-Q4-2': {
    coreSkill: '時針も1分に0.5°動くことを忘れない。',
    questions: [
      {prompt:'3時ちょうどから何分後に時針と分針が重なりますか。',answer:'180/11',explanation:'初期差90°、相対速度5.5°/分。'},
      {prompt:'2時ちょうどから何分後に初めて重なりますか。',answer:'120/11',explanation:'初期差60°÷5.5。'},
      {prompt:'6時ちょうどから何分後に初めて重なりますか。',answer:'360/11',explanation:'180÷5.5。'},
      {prompt:'1時ちょうどから何分後に初めて重なりますか。',answer:'60/11',explanation:'30÷5.5。'}
    ]
  },
  '2020-Q4-3': {
    coreSkill: '面積から中心角200°を先に出し、2本の針の位置を照合する。',
    questions: [
      {prompt:'半径3のおうぎ形の面積が5πです。中心角を求め、その角を9時台の長針と短針の時計回りの差として作る時刻9時b分のbを求めなさい。',answer:'200°,20',explanation:'面積より中心角200°。9時20分では長針120°、短針280°で時計回りの差は200°。'},
      {prompt:'半径6のおうぎ形の面積が15πです。中心角を求め、その角が3時20分の長針と短針の小さい方の角に一致するか答えなさい。',answer:'150°,一致しない',explanation:'中心角は150°。3時20分では長針120°、短針100°なので小さい角は20°。'},
      {prompt:'半径4のおうぎ形の面積が8πです。中心角を求め、6時00分の2本の針のなす小さい角と一致するか答えなさい。',answer:'180°,一致する',explanation:'16π×θ/360=8πよりθ=180°。6時ちょうども180°。'},
      {prompt:'半径5のおうぎ形の面積が25π/3です。中心角を求め、2時00分の2本の針の小さい角と比較しなさい。',answer:'120°,時計の角は60°',explanation:'中心角120°。2時ちょうどの針の角は60°。'}
    ]
  },
  '2020-Q5-1': {
    coreSkill: '立方体の面中心を頂点にした立体は正八面体。',
    questions: [
      {prompt:'立方体の6つの面の中心を頂点としてできる立体の頂点数を求めなさい。',answer:'6',explanation:'各面中心が1頂点。'},
      {prompt:'正八面体の面の数を求めなさい。',answer:'8',explanation:'正三角形8面。'},
      {prompt:'正八面体の辺の数を求めなさい。',answer:'12',explanation:'オイラーの多面体公式でも確認できる。'},
      {prompt:'立方体の面中心を結んでできる正八面体は、合同な四角すい何個に分けられますか。',answer:'2',explanation:'中央の正方形を共通底面に上下2個。'}
    ]
  },
  '2020-Q5-2': {
    coreSkill: '正八面体を同じ四角すい2個に分ける。',
    questions: [
      {prompt:'底面積18、高さ4の四角すい2個を底面で貼り合わせた立体の体積を求めなさい。',answer:'48',explanation:'1個24、2個48。'},
      {prompt:'底面積30、高さ6の合同な四角すい2個の合計体積を求めなさい。',answer:'120',explanation:'各60。'},
      {prompt:'正八面体を底面積16、高さ3の合同な四角すい2個とみると体積はいくつですか。',answer:'32',explanation:'16×3÷3×2。'},
      {prompt:'合同な2個の四角すいからなる立体の体積が90です。1個の体積を求めなさい。',answer:'45',explanation:'半分。'}
    ]
  },
  '2020-Q5-3': {
    coreSkill: 'Yから6個の合同な小四角すいを引く。',
    questions: [
      {prompt:'大きな立体の体積120から合同な小四角すい6個（各4）を切り取ります。残りの体積を求めなさい。',answer:'96',explanation:'120-24。'},
      {prompt:'体積90の立体から合同な小立体6個（各5/2）を除きます。残りを求めなさい。',answer:'75',explanation:'90-15。'},
      {prompt:'体積144から合同な小四角すい6個を除いて120になりました。小四角すい1個の体積を求めなさい。',answer:'4',explanation:'差24÷6。'},
      {prompt:'体積200の立体から合同な小立体8個（各7）を除いた残りを求めなさい。',answer:'144',explanation:'200-56。'}
    ]
  },
  '2021-Q1-1': {
    coreSkill: '根号の中の平方を先に処理し、√9=3とする。',
    questions: [
      {prompt:'√((-7)²)を求めなさい。',answer:'7',explanation:'√(a²)=|a|。'},
      {prompt:'√(5²)を求めなさい。',answer:'5',explanation:'平方根は非負。'},
      {prompt:'√((-12)²)を求めなさい。',answer:'12',explanation:'|-12|=12。'},
      {prompt:'√(a²)をa<0のときaを使って表しなさい。',answer:'-a',explanation:'|a|=-a。'}
    ]
  },
  '2021-Q1-2': {
    coreSkill: '分数の式から一方の文字を表して代入する。',
    questions: [
      {prompt:'x=2y+1, x/2+y=9/2を解き(x,y)で答えなさい。',answer:'(5,2)',explanation:'xを代入して分母を払う。'},
      {prompt:'y=x-2, x/2+y=7を解き(x,y)で答えなさい。',answer:'(6,4)',explanation:'yを代入。'},
      {prompt:'x=3y-1, x+y/2=6を解き(x,y)で答えなさい。',answer:'(5,2)',explanation:'xを代入して解く。'},
      {prompt:'y=2x+1, x+y/3=4を解き(x,y)で答えなさい。',answer:'(11/5,27/5)',explanation:'代入して分母を払う。'}
    ]
  },
  '2021-Q1-3': {
    coreSkill: '判別式9-4=5。',
    questions: [
      {prompt:'2x²+3x-1=0を解きなさい。',answer:'(-3±√17)/4',explanation:'解の公式を使う。'},
      {prompt:'3x²-2x-2=0を解きなさい。',answer:'(1±√7)/3',explanation:'判別式4+24=28。'},
      {prompt:'5x²+x-1=0を解きなさい。',answer:'(-1±√21)/10',explanation:'判別式1+20=21。'},
      {prompt:'2x²-5x-1=0を解きなさい。',answer:'(5±√33)/4',explanation:'判別式25+8=33。'}
    ]
  },
  '2021-Q1-4': {
    coreSkill: '頂点は最大値側。最小値は端点を比較する。',
    questions: [
      {prompt:'y=-x²+9で-2≦x≦4の変域を求めなさい。',answer:'-7≦y≦9',explanation:'頂点x=0と端点を比較。'},
      {prompt:'y=x²-4で-3≦x≦1の変域を求めなさい。',answer:'-4≦y≦5',explanation:'頂点と端点。'},
      {prompt:'y=-2x²+8で-1≦x≦3の変域を求めなさい。',answer:'-10≦y≦8',explanation:'頂点最大、x=3で最小。'},
      {prompt:'y=2x²-1で-2≦x≦3の変域を求めなさい。',answer:'-1≦y≦17',explanation:'頂点と|x|最大端点。'}
    ]
  },
  '2021-Q1-5': {
    coreSkill: '素因数の奇数指数を補った基本形に平方数を掛ける。',
    questions: [
      {prompt:'72nが平方数となる最小の正の整数nを求めなさい。',answer:'2',explanation:'72=2³×3²、2を補う。'},
      {prompt:'50nが平方数となる最小の正の整数nを求めなさい。',answer:'2',explanation:'50=2×5²、2を補う。'},
      {prompt:'108nが平方数となる最小の正の整数nを求めなさい。',answer:'3',explanation:'108=2²×3³、3を補う。'},
      {prompt:'45nが平方数となる最小の正の整数nを求めなさい。',answer:'5',explanation:'45=3²×5、5を補う。'}
    ]
  },
  '2021-Q1-6': {
    coreSkill: '直径の半円180°と、交わる弦・円周角の2種類の角度関係を使う。',
    questions: [
      {prompt:'直径ACの円で、上半円上にE,Dがこの順にある。弧AE+弧DC=120°のとき弧EDを求め、弧EDを見込む円周角∠EBDを求めなさい。',answer:'60°,30°',explanation:'半円180°から弧ED=60°。円周角は弧EDの半分。'},
      {prompt:'直径PQの円で、上半円上にR,Sがこの順にある。弧PR+弧SQ=130°のとき弧RSと、弧RSを見込む円周角を求めなさい。',answer:'50°,25°',explanation:'半円180°から残り50°、円周角はその半分。'},
      {prompt:'直径ABの円で上半円の弧AC=70°、弧DB=50°である。C,Dはこの順にある。弧CDと∠CBDを求めなさい。',answer:'60°,30°',explanation:'上半円180°から70°と50°を引く。∠CBDは弧CDの半分。'},
      {prompt:'直径XYの円で上半円の弧XP=40°、弧QY=80°である。P,Qはこの順にある。弧PQと、弧PQを見込む円周角を求めなさい。',answer:'60°,30°',explanation:'40+弧PQ+80=180。円周角は弧の半分。'}
    ]
  },
  '2021-Q1-7': {
    coreSkill: '偶数個の中央値は中央2個の平均。',
    questions: [
      {prompt:'データ2,4,7,9の中央値を求めなさい。',answer:'11/2',explanation:'中央2数4,7の平均。'},
      {prompt:'データ1,3,5,8,10,14の中央値を求めなさい。',answer:'13/2',explanation:'中央5,8の平均。'},
      {prompt:'データ6,2,9,4の中央値を求めなさい。',answer:'5',explanation:'並べて4,6の平均。'},
      {prompt:'データ3,11,7,15,5,9の中央値を求めなさい。',answer:'8',explanation:'並べて7,9の平均。'}
    ]
  },
  '2021-Q1-8': {
    coreSkill: '三角形の合同条件に対応する情報かを確認する。',
    questions: [
      {prompt:'2つの三角形で3辺がそれぞれ等しいとき、合同といえますか。',answer:'はい',explanation:'三辺相等。'},
      {prompt:'2辺とその間の角がそれぞれ等しいとき合同といえますか。',answer:'はい',explanation:'二辺夾角相等。'},
      {prompt:'1辺とその両端の角がそれぞれ等しいとき合同といえますか。',answer:'はい',explanation:'一辺両端角相等。'},
      {prompt:'3つの角がそれぞれ等しいだけで合同といえますか。',answer:'いいえ',explanation:'相似は決まるが大きさは決まらない。'}
    ]
  },
  '2021-Q2-1': {
    coreSkill: '円柱の体積=底面積×高さ。',
    questions: [
      {prompt:'半径3、高さ8の円柱の体積を求めなさい。',answer:'72π',explanation:'πr²h。'},
      {prompt:'底面積20、高さ7の円柱の体積を求めなさい。',answer:'140',explanation:'底面積×高さ。'},
      {prompt:'体積96π、高さ6の円柱の底面積を求めなさい。',answer:'16π',explanation:'96π÷6。'},
      {prompt:'半径4、高さ5の円柱の体積を求めなさい。',answer:'80π',explanation:'16π×5。'}
    ]
  },
  '2021-Q2-2': {
    coreSkill: '沈んだ物体の体積=水位上昇分の円柱体積。',
    questions: [
      {prompt:'底面積30cm²の円柱容器で水位が4cm上がりました。沈めた物体の体積を求めなさい。',answer:'120',explanation:'底面積×上昇高さ。'},
      {prompt:'底面積25cm²の容器に体積75cm³の物体を完全に沈めます。水位上昇を求めなさい。',answer:'3',explanation:'75÷25。'},
      {prompt:'底面半径2cmの円柱で水位が5cm上がりました。物体体積をπで答えなさい。',answer:'20π',explanation:'底面積4π×5。'},
      {prompt:'体積180cm³の物体を底面積45cm²の容器に沈めます。水位は何cm上がりますか。',answer:'4',explanation:'180÷45。'}
    ]
  },
  '2021-Q2-3': {
    coreSkill: '前2問の体積を比に直す。',
    questions: [
      {prompt:'体積72と120の比を最簡整数比で答えなさい。',answer:'3:5',explanation:'24で割る。'},
      {prompt:'同じ円柱容器で水体積90、沈めた物体体積30です。水:物体の体積比を答えなさい。',answer:'3:1',explanation:'90:30。'},
      {prompt:'2つの立体の体積が45πと75πです。比を答えなさい。',answer:'3:5',explanation:'共通πを消す。'},
      {prompt:'体積比が4:7で小さい方が36です。大きい方を求めなさい。',answer:'63',explanation:'36×7/4。'}
    ]
  },
  '2021-Q3-1': {
    coreSkill: '状態を集合で追跡する。',
    questions: [
      {prompt:'3人A,B,Cのうち最初はAだけONです。操作でA,Bを反転するとONは誰ですか。',answer:'B',explanation:'AはOFF、BはON。'},
      {prompt:'最初にA,BがON。B,Cを反転するとONは誰ですか。',answer:'A,C',explanation:'BがOFF、CがON。'},
      {prompt:'最初は全員OFF。A,Cを反転し、次にCを反転するとONは誰ですか。',answer:'A',explanation:'Cは2回反転。'},
      {prompt:'A,B,CがON。A,B,Cをすべて反転するとONは何人ですか。',answer:'0',explanation:'全員OFF。'}
    ]
  },
  '2021-Q3-2': {
    coreSkill: 'ちょうど1人だけ悪魔を増やす出目を、同目と異目に分ける。',
    questions: [
      {prompt:'2個のサイコロで、ちょうど1個だけが6となる出方は何通りですか。',answer:'10',explanation:'(6,1〜5),(1〜5,6)。'},
      {prompt:'2個のサイコロで、ちょうど1個だけが偶数となる出方は何通りですか。',answer:'18',explanation:'偶奇または奇偶、3×3×2。'},
      {prompt:'2個のサイコロで、ちょうど1個だけが3の倍数となる出方は何通りですか。',answer:'16',explanation:'2×4×2。'},
      {prompt:'2個のサイコロで同じ目が出る場合と異なる目が出る場合の通り数を順に答えなさい。',answer:'6,30',explanation:'同目6、全36-6。'}
    ]
  },
  '2021-Q3-3': {
    coreSkill: '1回目で悪魔が2人になった場合だけ、2回目に3人へ増やせる。',
    questions: [
      {prompt:'1回目は36通り中15通りで状態Xになり、Xのときだけ2回目36通り中20通りで成功します。2回の順序付き結果で成功は何通りですか。',answer:'300',explanation:'15×20=300。'},
      {prompt:'1回目は25通り中10通りで状態Xになり、Xのときだけ2回目25通り中12通りで成功します。成功する2段階結果は何通りですか。',answer:'120',explanation:'10×12。'},
      {prompt:'1回目は16通り中6通りで条件を満たし、その場合だけ2回目16通り中8通りが最終成功です。成功する組は何通りですか。',answer:'48',explanation:'6×8。'},
      {prompt:'1回目は49通り中14通りで中間状態になり、その状態から2回目49通り中21通りで最終状態になります。成功する組は何通りですか。',answer:'294',explanation:'14×21。'}
    ]
  },
  '2021-Q4-1': {
    coreSkill: '1gあたりの買取価格の差150円を200gに掛けてもよい。',
    questions: [
      {prompt:'A店は1gあたり4200円、B店は4350円で買い取ります。200gで差はいくらですか。',answer:'30000',explanation:'150×200。'},
      {prompt:'1個あたり80円差の商品を35個売ると売上差はいくらですか。',answer:'2800',explanation:'80×35。'},
      {prompt:'1kgあたり120円高い店で7.5kg売ると差額はいくらですか。',answer:'900',explanation:'120×7.5。'},
      {prompt:'1mあたり45円差の材料を18m買うと差額を求めなさい。',answer:'810',explanation:'45×18。'}
    ]
  },
  '2021-Q4-2': {
    coreSkill: '収支=販売額-買取額。',
    questions: [
      {prompt:'1個500円でx個仕入れ、1個650円で全部売って利益3000円でした。xを求めなさい。',answer:'20',explanation:'150x=3000。'},
      {prompt:'1g4000円でxg買い、1g4300円で売って利益15000円でした。xを求めなさい。',answer:'50',explanation:'300x=15000。'},
      {prompt:'1個800円で30個仕入れ、総利益6000円になる売価を求めなさい。',answer:'1000',explanation:'売上30000円÷30。'},
      {prompt:'1個300円でx個仕入れ、合計12000円でした。xを求めなさい。',answer:'40',explanation:'300x=12000。'}
    ]
  },
  '2021-Q4-3': {
    coreSkill: 'yを最小にするには、条件を満たす手数料人数nを最大にする。',
    questions: [
      {prompt:'合計360個をn人に等分します。nは偶数で18以下、1人分を最小にするときnを求めなさい。',answer:'18',explanation:'人数を最大にする。'},
      {prompt:'合計420をn人に等分。nは7の倍数で30以下。1人分を最小にするnを求めなさい。',answer:'28',explanation:'条件内最大の7の倍数。'},
      {prompt:'合計300を偶数n人で分け、n≤24かつ300/nが整数です。1人分最小となるnを求めなさい。',answer:'20',explanation:'24以下の偶数約数で最大は20。'},
      {prompt:'合計540をn人に等分。nは9の倍数で40以下かつ540/n整数。nを最大にしなさい。',answer:'36',explanation:'36が条件内最大。'}
    ]
  },
  '2021-Q5-1': {
    coreSkill: '直角二等辺三角形の縦辺AC=13を座標にそのまま使う。',
    questions: [
      {prompt:'直角二等辺三角形ABCで直角はA、ACは縦線、AC=8です。Aのy座標が2ならCのy座標を求めなさい。',answer:'10',explanation:'縦に8。'},
      {prompt:'A(x,3),C(x,16)でACの長さを求めなさい。',answer:'13',explanation:'縦の差。'},
      {prompt:'直角二等辺三角形でAC=13、A=(t,0)、CがAの真上です。Cの座標を答えなさい。',answer:'(t,13)',explanation:'x同じ、yが13増える。'},
      {prompt:'A=(5,-2),CがAの真上でAC=7です。Cの座標を求めなさい。',answer:'(5,5)',explanation:'y=-2+7。'}
    ]
  },
  '2021-Q5-2': {
    coreSkill: 'Pのy座標からまず縦線ACのx座標を確定する。',
    questions: [
      {prompt:'点P(4,7)を通るx軸に垂直な直線の式を求めなさい。',answer:'x=4',explanation:'縦線はx一定。'},
      {prompt:'点P(-3,5)を通る縦線上の点Aのx座標を求めなさい。',answer:'-3',explanation:'同じx座標。'},
      {prompt:'縦線AC上にP(8,2)があります。A,Cのx座標を答えなさい。',answer:'8',explanation:'縦線なのでx=8。'},
      {prompt:'点Pのy座標が6で、Pが反比例y=24/x上です。Pのx座標を求めなさい。',answer:'4',explanation:'6=24/x。'}
    ]
  },
  '2021-Q5-3': {
    coreSkill: '相似条件を『ABの傾き1に対してPQの傾き-1』へ翻訳する。',
    questions: [
      {prompt:'傾き1の直線に垂直な直線の傾きを求めなさい。',answer:'-1',explanation:'傾きの積-1。'},
      {prompt:'傾き2の直線に垂直な直線の傾きを求めなさい。',answer:'-1/2',explanation:'積-1。'},
      {prompt:'点P(2,5)を通り傾き-1の直線の式を求めなさい。',answer:'y=-x+7',explanation:'点傾き式。'},
      {prompt:'傾き3/4の直線に垂直な直線の傾きを求めなさい。',answer:'-4/3',explanation:'逆数にして符号を反転。'}
    ]
  },
  '2022-Q1-1': {
    coreSkill: '√(a^2)=|a|。負数でも平方根は正の値になる。',
    questions: [
      {prompt:'√((-7)²)を求めなさい。',answer:'7',explanation:'√(a²)=|a|。'},
      {prompt:'√(5²)を求めなさい。',answer:'5',explanation:'平方根は非負。'},
      {prompt:'√((-12)²)を求めなさい。',answer:'12',explanation:'|-12|=12。'},
      {prompt:'√(a²)をa<0のときaを使って表しなさい。',answer:'-a',explanation:'|a|=-a。'}
    ]
  },
  '2022-Q1-2': {
    coreSkill: '二次式を積が-12、和が4になる2数で因数分解する。',
    questions: [
      {prompt:'x²-4x-12=0を解きなさい。',answer:'-2,6',explanation:'(x-6)(x+2)=0。'},
      {prompt:'x²+5x-14=0を解きなさい。',answer:'-7,2',explanation:'(x+7)(x-2)=0。'},
      {prompt:'2x²+x-6=0を解きなさい。',answer:'-2,3/2',explanation:'(2x-3)(x+2)=0。'},
      {prompt:'3x²-10x+3=0を解きなさい。',answer:'1/3,3',explanation:'(3x-1)(x-3)=0。'}
    ]
  },
  '2022-Q1-3': {
    coreSkill: '連立方程式は一方を1文字で表して代入する。',
    questions: [
      {prompt:'x=2y+1, x/2+y=9/2を解き(x,y)で答えなさい。',answer:'(5,2)',explanation:'xを代入して分母を払う。'},
      {prompt:'y=x-2, x/2+y=7を解き(x,y)で答えなさい。',answer:'(6,4)',explanation:'yを代入。'},
      {prompt:'x=3y-1, x+y/2=6を解き(x,y)で答えなさい。',answer:'(5,2)',explanation:'xを代入して解く。'},
      {prompt:'y=2x+1, x+y/3=4を解き(x,y)で答えなさい。',answer:'(11/5,27/5)',explanation:'代入して分母を払う。'}
    ]
  },
  '2022-Q1-4': {
    coreSkill: '二次関数の変域では端点だけでなく頂点x=0も確認する。',
    questions: [
      {prompt:'y=-x²+9で-2≦x≦4の変域を求めなさい。',answer:'-7≦y≦9',explanation:'頂点x=0と端点を比較。'},
      {prompt:'y=x²-4で-3≦x≦1の変域を求めなさい。',answer:'-4≦y≦5',explanation:'頂点と端点。'},
      {prompt:'y=-2x²+8で-1≦x≦3の変域を求めなさい。',answer:'-10≦y≦8',explanation:'頂点最大、x=3で最小。'},
      {prompt:'y=2x²-1で-2≦x≦3の変域を求めなさい。',answer:'-1≦y≦17',explanation:'頂点と|x|最大端点。'}
    ]
  },
  '2022-Q1-5': {
    coreSkill: '等確率な全8通りから条件に合う3通りを数える。',
    questions: [
      {prompt:'硬貨を3回投げるとき、表がちょうど2回出る確率を求めなさい。',answer:'3/8',explanation:'全8通り中3通り。'},
      {prompt:'硬貨を3回投げるとき、表が1回だけ出る確率を求めなさい。',answer:'3/8',explanation:'全8通り中3通り。'},
      {prompt:'硬貨を3回投げるとき、少なくとも1回表が出る確率を求めなさい。',answer:'7/8',explanation:'余事象は全部裏1通り。'},
      {prompt:'硬貨を3回投げるとき、3回とも同じ面が出る確率を求めなさい。',answer:'1/4',explanation:'表表表と裏裏裏の2/8。'}
    ]
  },
  '2022-Q1-6': {
    coreSkill: '四捨五入の範囲では下端を含み上端を含まない。',
    questions: [
      {prompt:'整数に四捨五入して62になる実数aの範囲を求めなさい。',answer:'61.5≦a<62.5',explanation:'下端含む、上端含まない。'},
      {prompt:'小数第1位を四捨五入して10になる実数xの範囲を求めなさい。',answer:'9.5≦x<10.5',explanation:'四捨五入の境界。'},
      {prompt:'10の位まで四捨五入して120になる整数nの範囲を求めなさい。',answer:'115≦n<125',explanation:'115〜124。'},
      {prompt:'小数第2位を四捨五入して3.4になるxの範囲を求めなさい。',answer:'3.35≦x<3.45',explanation:'0.05幅。'}
    ]
  },
  '2022-Q1-7': {
    coreSkill: '割合を人数に直すときは「全体×割合」。',
    questions: [
      {prompt:'全体320人の55%は何人ですか。',answer:'176',explanation:'320×0.55。'},
      {prompt:'240人の35%は何人ですか。',answer:'84',explanation:'240×0.35。'},
      {prompt:'500個の12%は何個ですか。',answer:'60',explanation:'500×0.12。'},
      {prompt:'ある学校の40%が120人です。全体人数を求めなさい。',answer:'300',explanation:'120÷0.4。'}
    ]
  },
  '2022-Q1-8': {
    coreSkill: '角が2組等しい相似を作り、対応辺を取り違えない。',
    questions: [
      {prompt:'相似な2三角形で対応辺の比が3:5、小さい方の辺が12です。対応する大きい辺を求めなさい。',answer:'20',explanation:'12×5/3。'},
      {prompt:'△ABC∽△DEFでAB:DE=2:3、BC=10です。EFを求めなさい。',answer:'15',explanation:'10×3/2。'},
      {prompt:'平行線でできる相似三角形の比が4:7。小さい方の対応辺8なら大きい方を求めなさい。',answer:'14',explanation:'8×7/4。'},
      {prompt:'相似比5:2で大きい方の対応辺が25です。小さい方を求めなさい。',answer:'10',explanation:'25×2/5。'}
    ]
  },
  '2022-Q2-1': {
    coreSkill: 'Bは曲線m上にあり、x座標がAと同じt。',
    questions: [
      {prompt:'A(t,t²)と同じx座標をもつ点Bが反比例y=12/x上です。Bの座標をtで表しなさい。',answer:'(t,12/t)',explanation:'x=tを反比例へ代入。'},
      {prompt:'点Bはy=18/x上でx座標が3tです。Bのy座標をtで表しなさい。',answer:'6/t',explanation:'18/(3t)。'},
      {prompt:'Aのx座標が4で、同じx座標のBがy=20/x上です。Bの座標を求めなさい。',answer:'(4,5)',explanation:'20÷4。'},
      {prompt:'点B(t,y)がxy=15を満たします。yをtで表しなさい。',answer:'15/t',explanation:'反比例。'}
    ]
  },
  '2022-Q2-2': {
    coreSkill: '共通の底辺ABを消して水平距離だけ比べる。',
    questions: [
      {prompt:'縦の共通底辺ABをもつ長方形ABCDの横幅がt。△ABQの面積が長方形と等しく、Qは放物線y=x²/4上、Qのy座標は候補中大きい方です。ABの直線はx=t。Qをtで表しなさい。',answer:'(3t,9t²/4)',explanation:'共通底辺ABを消すとQからx=tまでの距離は2t。x=3t,-t。yが大きい3tを選ぶ。'},
      {prompt:'縦の共通底辺ABをもつ長方形ABCDの横幅がt。△ABQの面積が長方形と等しく、ABの直線はx=t、Qは放物線y=x²/2上にあります。候補中y座標が大きいQをtで表しなさい。',answer:'(3t,9t²/2)',explanation:'水平距離条件は|x-t|=2t。x=3t,-tで、放物線上のyを比較。'},
      {prompt:'縦の共通底辺ABをもつ長方形ABCDの横幅がt。△ABQの面積が長方形と等しく、ABの直線はx=t、Qは放物線y=x²上にあります。候補中y座標が大きいQを求めなさい。',answer:'(3t,9t²)',explanation:'面積等置から|x-t|=2t、x=3t,-t。'},
      {prompt:'縦の共通底辺ABをもつ長方形ABCDの横幅がt。△ABQの面積が長方形と等しく、ABの直線はx=t、Qは放物線y=x²/9上にあります。候補中y座標が大きいQを求めなさい。',answer:'(3t,t²)',explanation:'x=3tならy=9t²/9=t²、x=-tならt²/9。'}
    ]
  },
  '2022-Q2-3': {
    coreSkill: '交点のxを無理に立方根で出さず、欲しい体積x^3を直接求める。',
    questions: [
      {prompt:'x>0でx³=64です。xを求めなさい。',answer:'4',explanation:'立方根。'},
      {prompt:'一辺xの立方体の体積が125です。xを求めなさい。',answer:'5',explanation:'x³=125。'},
      {prompt:'ある式からx³=48と分かりました。立方体体積を求める問題では答えはいくつですか。',answer:'48',explanation:'x自体を求める必要はない。'},
      {prompt:'一辺がxの立方体でx³=216です。体積を求めなさい。',answer:'216',explanation:'欲しい量がx³なら直接使う。'}
    ]
  },
  '2022-Q3-1': {
    coreSkill: '比例関係B=1.5Aをそのまま使う。',
    questions: [
      {prompt:'BはAの1.5倍です。A=200のときBを求めなさい。',answer:'300',explanation:'1.5×200。'},
      {prompt:'yはxに比例しy=2.5xです。x=40のときyを求めなさい。',answer:'100',explanation:'比例式へ代入。'},
      {prompt:'B=3A/2でB=270のときAを求めなさい。',answer:'180',explanation:'270×2/3。'},
      {prompt:'A:B=2:3でA=80のときBを求めなさい。',answer:'120',explanation:'80×3/2。'}
    ]
  },
  '2022-Q3-2-i': {
    coreSkill: 'まず1kmあたりのAの量を求める。',
    questions: [
      {prompt:'12kmで300mL飲む人の1kmあたりの飲水量を求めなさい。',answer:'25',explanation:'300÷12。'},
      {prompt:'8kmで240mL使います。1kmあたりを求めなさい。',answer:'30',explanation:'240÷8。'},
      {prompt:'1kmあたり40mL必要です。13kmで何mLですか。',answer:'520',explanation:'40×13。'},
      {prompt:'15kmで450mL必要です。7kmでは何mLですか。',answer:'210',explanation:'1km30mL×7。'}
    ]
  },
  '2022-Q3-2-ii': {
    coreSkill: '10.5km以降の「飲む回数」は5回であることを数える。',
    questions: [
      {prompt:'2kmごとに水を飲みます。10km地点を過ぎて20kmまでに飲む回数を求めなさい。ただし12,14,16,18,20kmで飲みます。',answer:'5',explanation:'対象地点を列挙。'},
      {prompt:'3kmごとに飲み、9kmより後18kmまでに飲む回数を求めなさい。',answer:'3',explanation:'12,15,18の3回。'},
      {prompt:'2.5kmごとに補給し、5kmより後15kmまでの回数を求めなさい。',answer:'4',explanation:'7.5,10,12.5,15。'},
      {prompt:'4kmごとに休み、8kmより後24kmまで何回休みますか。',answer:'4',explanation:'12,16,20,24。'}
    ]
  },
  '2022-Q4-1': {
    coreSkill: '同じ廊下は2回切り替わると元の状態に戻る。',
    questions: [
      {prompt:'スイッチAを2回押すと初期状態に戻りますか。',answer:'はい',explanation:'反転2回で元通り。'},
      {prompt:'OFFのスイッチを3回押した後の状態を答えなさい。',answer:'ON',explanation:'奇数回反転。'},
      {prompt:'ONのスイッチを4回押した後の状態を答えなさい。',answer:'ON',explanation:'偶数回反転。'},
      {prompt:'同じ廊下の照明を5回切り替え、最初OFFでした。最後の状態を答えなさい。',answer:'ON',explanation:'奇数回。'}
    ]
  },
  '2022-Q4-2': {
    coreSkill: 'オン集合はスイッチ集合の対称差で求める。順序を区別する。',
    questions: [
      {prompt:'集合A={1,2}, B={2,3}です。対称差A△Bを答えなさい。',answer:'{1,3}',explanation:'片方だけに含まれる要素。'},
      {prompt:'4個の異なるスイッチから2人が異なる1個ずつを順に選びます。何通りですか。',answer:'12',explanation:'4×3。'},
      {prompt:'5個のスイッチからA,Bが異なるものを1個ずつ順に選ぶ方法は何通りですか。',answer:'20',explanation:'5P2。'},
      {prompt:'集合{a,b,c}と{b,c,d}の対称差を答えなさい。',answer:'{a,d}',explanation:'共通部分は消える。'}
    ]
  },
  '2022-Q4-3': {
    coreSkill: '重複可・順序あり。各スイッチを0/1の切替として漏れなく列挙する。',
    questions: [
      {prompt:'3人がそれぞれ3個のスイッチから1個選びます。重複可・順序ありで何通りですか。',answer:'27',explanation:'3³。'},
      {prompt:'A,B,Cがそれぞれ4個から1個選ぶ方法は何通りですか。',answer:'64',explanation:'4³。'},
      {prompt:'同じスイッチを2回押す操作は、そのスイッチについて何回押したのと同じ状態ですか。',answer:'0',explanation:'偶数回は相殺。'},
      {prompt:'3回の選択(1,2,1)で最終的に奇数回押されたスイッチを答えなさい。',answer:'2',explanation:'1は2回で相殺、2は1回。'}
    ]
  },
  '2022-Q5-1': {
    coreSkill: '立方体の互いに垂直な3方向を使って底面積と高さを取る。',
    questions: [
      {prompt:'互いに直交する3辺OA=3,OB=4,OC=6をもつ三角すいOABCの体積を求めなさい。',answer:'12',explanation:'底面OAB=6、高さ6、6×6÷3=12。'},
      {prompt:'直交する3辺2,5,9をもつ三角すいの体積を求めなさい。',answer:'15',explanation:'2×5×9÷6。'},
      {prompt:'直交3辺4,6,8の三角すいの体積を求めなさい。',answer:'32',explanation:'4×6×8÷6。'},
      {prompt:'直交3辺3,3,10の三角すいの体積を求めなさい。',answer:'15',explanation:'3×3×10÷6。'}
    ]
  },
  '2022-Q5-2': {
    coreSkill: '座標化すると平面との交点比を1本の式で出せる。',
    questions: [
      {prompt:'線分ABを点PがAP:PB=1:3に内分します。AP/ABを求めなさい。',answer:'1/4',explanation:'全体4部分。'},
      {prompt:'座標A(0,0,0),B(8,0,0)で平面x=2との交点PについてAP:PBを求めなさい。',answer:'1:3',explanation:'2:6。'},
      {prompt:'A(0,0,0),B(10,10,10)と平面x+y+z=12の交点PでAP:PBを求めなさい。',answer:'2:3',explanation:'P=tB、30t=12→t=2/5。'},
      {prompt:'線分のパラメータP=(1-t)A+tBでt=3/7です。AP:PBを求めなさい。',answer:'3:4',explanation:'t:(1-t)。'}
    ]
  },
  '2022-Q5-3': {
    coreSkill: '四角形の底面は三角形2つに分け、四面体2個の体積を足す。',
    questions: [
      {prompt:'四角形の底面を2つの三角形に分け、それぞれの面積が12,18、高さ6の四角すいの体積を求めなさい。',answer:'60',explanation:'底面合計30×6÷3。'},
      {prompt:'底面を面積10と14の2三角形に分けられ、高さ9です。体積を求めなさい。',answer:'72',explanation:'24×9÷3。'},
      {prompt:'同じ頂点・高さをもつ2三角すいの底面積が5:7です。体積比を求めなさい。',answer:'5:7',explanation:'高さ共通。'},
      {prompt:'2個の三角すいの体積が20,30で、合わせて1つの四角すいになります。全体体積を求めなさい。',answer:'50',explanation:'足す。'}
    ]
  },
  '2023-Q1-1': {
    coreSkill: '平方してから割り算を逆数の掛け算にする。a,bの指数を引く。',
    questions: [
      {prompt:'a³b²÷(ab)を簡単にしなさい。',answer:'a²b',explanation:'指数を引く。'},
      {prompt:'6a²b³÷3abを簡単にしなさい。',answer:'2ab²',explanation:'係数と指数。'},
      {prompt:'(2ab)²÷4aを簡単にしなさい。',answer:'ab²',explanation:'4a²b²÷4a。'},
      {prompt:'9a³b²÷3a²bを簡単にしなさい。',answer:'3ab',explanation:'指数を引く。'}
    ]
  },
  '2023-Q1-2': {
    coreSkill: '係数をそろえて加減法を使う。',
    questions: [
      {prompt:'x/2+y/3=4, x-y=1を解き(x,y)で答えなさい。',answer:'(26/5,21/5)',explanation:'第1式を6倍して3x+2y=24。'},
      {prompt:'x/3-y/2=1, x+y=7を解き(x,y)で答えなさい。',answer:'(27/5,8/5)',explanation:'第1式を6倍して2x-3y=6。'},
      {prompt:'x/4+y/2=3, x-y=3を解き(x,y)で答えなさい。',answer:'(6,3)',explanation:'第1式を4倍してx+2y=12。'},
      {prompt:'x/5-y/3=1, x+y=9を解き(x,y)で答えなさい。',answer:'(15/2,3/2)',explanation:'15倍して3x-5y=15。'}
    ]
  },
  '2023-Q1-3': {
    coreSkill: '文章をそのまま方程式に翻訳する。',
    questions: [
      {prompt:'ある数aの4倍に3を足すと23です。aを求めなさい。',answer:'5',explanation:'4a+3=23。'},
      {prompt:'ある数xの3倍から7を引くと20です。xを求めなさい。',answer:'9',explanation:'3x-7=20。'},
      {prompt:'aの5倍と2の和がaの9倍に等しいときaを求めなさい。',answer:'1/2',explanation:'5a+2=9a。'},
      {prompt:'ある数bの2倍に5を加えた数が17です。bを求めなさい。',answer:'6',explanation:'2b+5=17。'}
    ]
  },
  '2023-Q1-4': {
    coreSkill: '余事象「和が11または12」を数えると速い。',
    questions: [
      {prompt:'2個のサイコロの和が10以下となる確率を求めなさい。',answer:'11/12',explanation:'余事象は和11,12の3通り。'},
      {prompt:'2個のサイコロの和が11未満となる確率を求めなさい。',answer:'11/12',explanation:'余事象は和11,12の3通り。'},
      {prompt:'2個のサイコロの和が3以上となる確率を求めなさい。',answer:'35/36',explanation:'余事象は和2のみ。'},
      {prompt:'2個のサイコロの和が5以上となる確率を求めなさい。',answer:'5/6',explanation:'余事象和2,3,4は6/36。'}
    ]
  },
  '2023-Q1-5': {
    coreSkill: '交点の一直線の角と三角形の内角和を順に使う。',
    questions: [
      {prompt:'三角形で2角が43°と58°です。残りの角を求めなさい。',answer:'79',explanation:'180-101。'},
      {prompt:'一直線上の隣り合う角の一方が122°です。もう一方を求めなさい。',answer:'58',explanation:'180-122。'},
      {prompt:'三角形の外角が130°、それと隣り合わない内角の1つが55°です。もう1つの内角を求めなさい。',answer:'75',explanation:'外角=遠い2内角の和。'},
      {prompt:'2直線が交わり、1つの角が64°です。対頂角を求めなさい。',answer:'64',explanation:'対頂角は等しい。'}
    ]
  },
  '2023-Q1-6': {
    coreSkill: 'aを直接小数化せず、平方完成して√11をそのまま使う。',
    questions: [
      {prompt:'√10の小数部分をaとするとき、a²+6aを求めなさい。',answer:'1',explanation:'a=√10-3、a²+6a=(√10-3)²+6(√10-3)=1。'},
      {prompt:'√17の小数部分をaとするとき、a²+8aを求めなさい。',answer:'1',explanation:'a=√17-4。'},
      {prompt:'√26の小数部分をaとするとき、a²+10aを求めなさい。',answer:'1',explanation:'a=√26-5。'},
      {prompt:'√11の小数部分をaとするとき、a²+6aを求めなさい。',answer:'2',explanation:'a=√11-3より11-9=2。'}
    ]
  },
  '2023-Q1-7': {
    coreSkill: '偶数個の中央値は中央2個の平均。',
    questions: [
      {prompt:'データ2,4,7,9の中央値を求めなさい。',answer:'11/2',explanation:'中央2数4,7の平均。'},
      {prompt:'データ1,3,5,8,10,14の中央値を求めなさい。',answer:'13/2',explanation:'中央5,8の平均。'},
      {prompt:'データ6,2,9,4の中央値を求めなさい。',answer:'5',explanation:'並べて4,6の平均。'},
      {prompt:'データ3,11,7,15,5,9の中央値を求めなさい。',answer:'8',explanation:'並べて7,9の平均。'}
    ]
  },
  '2023-Q1-8': {
    coreSkill: '平行四辺形の辺の等しさと平行線の角を使う。',
    questions: [
      {prompt:'平行四辺形ABCDでABとCDの関係を答えなさい。',answer:'AB=CD',explanation:'向かい合う辺は等しい。'},
      {prompt:'平行四辺形ABCDでAB∥CDですか。',answer:'はい',explanation:'対辺は平行。'},
      {prompt:'平行四辺形ABCDで∠A=70°のとき∠Cを求めなさい。',answer:'70',explanation:'対角は等しい。'},
      {prompt:'平行四辺形ABCDで∠A=70°のとき∠Bを求めなさい。',answer:'110',explanation:'隣角の和180°。'}
    ]
  },
  '2023-Q2-1': {
    coreSkill: 'FはAからx軸へ下ろした垂線の足なのでx座標が同じ。',
    questions: [
      {prompt:'放物線y=ax²上の点Aのx座標が3で、Aからx軸へ下ろした垂線の足Fが(3,0)、AF=6です。aを求めなさい。',answer:'2/3',explanation:'A=(3,6)なので6=9a。'},
      {prompt:'y=ax²上のAからx軸への垂線の足がF(-2,0)、AF=8です。aを求めなさい。',answer:'2',explanation:'A=(-2,8)、8=4a。'},
      {prompt:'放物線y=ax²上の点Aのx座標4、y座標12です。aを求めなさい。',answer:'3/4',explanation:'12=16a。'},
      {prompt:'F=(5,0)、AF=10でAがy=ax²上です。aを求めなさい。',answer:'2/5',explanation:'10=25a。'}
    ]
  },
  '2023-Q2-2': {
    coreSkill: '相似比を、座標から出した縦横の長さの比に結びつける。',
    questions: [
      {prompt:'相似な三角形で縦の長さが6:9、横の長さが4:cです。cを求めなさい。',answer:'6',explanation:'4:c=6:9。'},
      {prompt:'相似比2:5で小さい方の横幅が6です。大きい方を求めなさい。',answer:'15',explanation:'6×5/2。'},
      {prompt:'座標差から一方の縦:横=3:4、相似な他方の縦が9です。横を求めなさい。',answer:'12',explanation:'3:4=9:x。'},
      {prompt:'相似な2つの直角三角形で高さ5,15、底辺が7,cです。cを求めなさい。',answer:'21',explanation:'3倍。'}
    ]
  },
  '2023-Q2-3': {
    coreSkill: '座標をすべて確定し、三角形面積を行列式（底辺×高さでも可）で比較する。',
    questions: [
      {prompt:'O(0,0),A(4,1),B(2,5)の三角形OABの面積を求めなさい。',answer:'9',explanation:'|4×5-1×2|/2=9。'},
      {prompt:'O(0,0),A(3,0),B(1,4)の面積を求めなさい。',answer:'6',explanation:'|3×4|/2。'},
      {prompt:'A(1,1),B(5,1),C(2,7)の三角形面積を求めなさい。',answer:'12',explanation:'底辺4、高さ6。'},
      {prompt:'O(0,0),A(-2,3),B(4,1)の面積を求めなさい。',answer:'7',explanation:'|-2×1-3×4|/2=7。'}
    ]
  },
  '2023-Q3-1': {
    coreSkill: '成分量は重量に比例する。',
    questions: [
      {prompt:'食品Aは100gあたり成分20gです。150gの食品Aに含まれる成分量を求めなさい。',answer:'30',explanation:'150×20/100。'},
      {prompt:'200gあたり成分30gの食品を80g使います。成分量を求めなさい。',answer:'12',explanation:'30/200×80。'},
      {prompt:'1gあたり0.18gの成分を含む食品を120g使います。成分量を求めなさい。',answer:'21.6',explanation:'0.18×120。'},
      {prompt:'150g中45gが成分です。この食品300gでは成分は何gですか。',answer:'90',explanation:'2倍。'}
    ]
  },
  '2023-Q3-2': {
    coreSkill: '糖質がBだけに含まれるので先にbを決める。',
    questions: [
      {prompt:'食品Aは糖質を含まず、食品Bは1gあたり0.2gの糖質を含みます。合計糖質24gならBは何gですか。',answer:'120',explanation:'0.2b=24。'},
      {prompt:'Aは成分Xを含まず、Bは1gあたり0.15g含みます。Xが18gならBを求めなさい。',answer:'120',explanation:'0.15b=18。'},
      {prompt:'A,B合わせて300g、Bだけが1gあたり0.1gの糖質を含み、糖質12gです。Aを求めなさい。',answer:'180',explanation:'B=120、A=180。'},
      {prompt:'A+B=250g、Bだけが20%の成分を含み成分量30gです。Aを求めなさい。',answer:'100',explanation:'B=150。'}
    ]
  },
  '2023-Q3-3': {
    coreSkill: '各食品の「1gあたり成分量」を係数にして3元連立方程式を作る。',
    questions: [
      {prompt:'a+b+c=300, a+2b=250, b+2c=400を解きなさい。',answer:'(50,100,150)',explanation:'3つの式から順に文字を消去する。'},
      {prompt:'a+b+c=240, a+2b=150, b+2c=300を解きなさい。',answer:'(70,40,130)',explanation:'3つの式から順に文字を消去する。'},
      {prompt:'a+b+c=180, a+2b=200, b+2c=200を解きなさい。',answer:'(40,80,60)',explanation:'3つの式から順に文字を消去する。'},
      {prompt:'a+b+c=360, a+2b=300, b+2c=360を解きなさい。',answer:'(140,80,140)',explanation:'3つの式から順に文字を消去する。'}
    ]
  },
  '2023-Q4-1': {
    coreSkill: '相似から「積の形」を2本作り、共通因子ACでくくる証明。',
    questions: [
      {prompt:'△ABC∽△ACDでAB:AC=AC:ADです。この相似から得られる積の関係を答えなさい。',answer:'AB·AD=AC²',explanation:'比例式を交差に掛ける。'},
      {prompt:'AB/AC=AC/AEのとき積の関係を答えなさい。',answer:'AB·AE=AC²',explanation:'外項の積=内項の積。'},
      {prompt:'AC²=AB·ADかつAC²=AE·AFです。AB·ADとAE·AFの関係を答えなさい。',answer:'AB·AD=AE·AF',explanation:'共通してAC²に等しい。'},
      {prompt:'AC·x=AC·yでAC≠0のときxとyの関係を答えなさい。',answer:'x=y',explanation:'共通因子ACで割る。'}
    ]
  },
  '2023-Q4-2': {
    coreSkill: '円に内接する4点では和子の定理（Ptolemy）をそのまま使う。',
    questions: [
      {prompt:'円に内接する四角形で対角線AC=5、AB=3,BC=4,CD=6,DA=2です。BDを求めなさい。',answer:'26/5',explanation:'5BD=3×6+4×2=26。'},
      {prompt:'円に内接する四角形でAC=4、AB=2,BC=5,CD=3,DA=2です。BDを求めなさい。',answer:'4',explanation:'4BD=6+10=16。'},
      {prompt:'円に内接する長方形の辺が6,8です。対角線の長さをPtolemyから求めなさい。',answer:'10',explanation:'d²=36+64=100。'},
      {prompt:'円に内接する四角形でAC=7,BD=5,AB·CD=14です。BC·DAを求めなさい。',answer:'21',explanation:'35=14+21。'}
    ]
  },
  '2023-Q4-3': {
    coreSkill: 'Ptolemyで積の関係を作り、最後にabcで割って逆数の式にする。',
    questions: [
      {prompt:'abc≠0で ab+bc+ca=abc·d です。dをa,b,cで表しなさい。',answer:'1/a+1/b+1/c',explanation:'abcで割る。'},
      {prompt:'xy+xz+yz=xyz·k のときkを表しなさい。',answer:'1/x+1/y+1/z',explanation:'xyzで割る。'},
      {prompt:'pq+qr= pqr·m のときmを表しなさい。',answer:'1/p+1/r',explanation:'pqrで割る。'},
      {prompt:'ab+ac=abc·n のときnを表しなさい。',answer:'1/b+1/c',explanation:'abcで割る。'}
    ]
  },
  '2023-Q5-1': {
    coreSkill: '自己カードは無効なので、毎回「他の3人のどれか」に1/3ずつ移る。',
    questions: [
      {prompt:'4人のうち自分以外の3人へ等確率でカードを渡します。指定された1人へ渡る確率を求めなさい。',answer:'1/3',explanation:'他の3人から1人。'},
      {prompt:'5人で自分以外の4人へ等確率で渡すとき、指定1人への確率を求めなさい。',answer:'1/4',explanation:'4択。'},
      {prompt:'4人のゲームでAからBへ1回でカードが移る確率を求めなさい。',answer:'1/3',explanation:'A以外3人。'},
      {prompt:'4人のゲームでAが1回後もAにカードを持つ確率を求めなさい。',answer:'0',explanation:'自己へは渡せない。'}
    ]
  },
  '2023-Q5-2': {
    coreSkill: 'BからBへは直接残れない。直前がB以外の確率だけ数える。',
    questions: [
      {prompt:'4人のゲームで現在B以外がカードを持つ確率が2/3です。次にBへ来る確率を求めなさい。',answer:'2/9',explanation:'B以外からBへ1/3。'},
      {prompt:'現在Bがカードを持つ確率1/3です。自己へは渡せず、他3人へ等確率なら次にBが持つ確率を求めなさい。',answer:'2/9',explanation:'B以外2/3×1/3。'},
      {prompt:'現在Aが持つ確率1/4、他の3人のどれか3/4。次にAが持つ確率を求めなさい。',answer:'1/4',explanation:'3/4×1/3。'},
      {prompt:'4人で自己移動不可。ある人が現在持つ確率pなら次にその人が持つ確率をpで表しなさい。',answer:'(1-p)/3',explanation:'他の誰かから1/3。'}
    ]
  },
  '2023-Q5-3': {
    coreSkill: '漸化式 p_{n+1}=(1-p_n)/3 を使うと簡潔。',
    questions: [
      {prompt:'p1=1/3, p_{n+1}=(1-p_n)/3 のときp2を求めなさい。',answer:'2/9',explanation:'(1-1/3)/3。'},
      {prompt:'p1=1/3, p_{n+1}=(1-p_n)/3 のときp3を求めなさい。',answer:'7/27',explanation:'(1-2/9)/3。'},
      {prompt:'p=1/4を漸化式p\'=(1-p)/3に入れた値を求めなさい。',answer:'1/4',explanation:'(3/4)/3。'},
      {prompt:'p=7/27をp\'=(1-p)/3に入れた値を求めなさい。',answer:'20/81',explanation:'20/27÷3。'}
    ]
  },
  '2024-Q1-1': {
    coreSkill: '内側のかっこから計算し、「負の数を引く＝足す」に変える。',
    questions: [
      {prompt:'18-3×4を計算しなさい。',answer:'6',explanation:'乗算を先に。'},
      {prompt:'5-(2-7)を計算しなさい。',answer:'10',explanation:'負の数を引く。'},
      {prompt:'12-(-8)を計算しなさい。',answer:'20',explanation:'負を引く=足す。'},
      {prompt:'7+3×(5-2)を計算しなさい。',answer:'16',explanation:'括弧→乗算→加算。'}
    ]
  },
  '2024-Q1-5': {
    coreSkill: '正方形・正三角形などの既知角を図から読み取り、一直線180°や角の差で未知角を求める。',
    questions: [
      {prompt:'正方形ABCDの辺BCを1辺として、正方形の内側に正三角形BCEを作ります。∠ABEを求めなさい。',answer:'30',explanation:'∠ABC=90°、∠CBE=60°なので、∠ABE=90°-60°=30°。'},
      {prompt:'一直線A-B-Cの同じ側に、∠DBA=35°、∠EBD=60°があります。∠EBCを求めなさい。',answer:'85',explanation:'一直線なので∠ABC=180°。35°+60°+∠EBC=180°より85°。'},
      {prompt:'正方形ABCDの辺BCを1辺として、正方形の内側に正三角形BCEを作り、対角線BDを引きます。∠DBEを求めなさい。',answer:'15',explanation:'正方形の対角線より∠DBC=45°、正三角形より∠CBE=60°。差は15°。'},
      {prompt:'正方形ABCDの辺CDの外側に正三角形CDEを作り、AとEを結びます。∠ADEを求めなさい。',answer:'150',explanation:'∠ADC=90°、正三角形より∠CDE=60°。Dで外側に開く角は90°+60°=150°。'}
    ]
  },
  '2024-Q1-6': {
    coreSkill: '第1式を整理するとすぐy=xになる。',
    questions: [
      {prompt:'2(x+y)=3x+y, 3x-4y=1 を解きなさい。',answer:'(-1,-1)',explanation:'第1式を整理するとy=x。第2式へ代入。'},
      {prompt:'3(x+y)=4x+2y, 5x-2y=9 を解きなさい。',answer:'(3,3)',explanation:'第1式はy=x。5x-2x=9。'},
      {prompt:'4x+2y=3x+3y, 2x+5y=21 を解きなさい。',answer:'(3,3)',explanation:'第1式からx=y。7x=21。'},
      {prompt:'5(x-y)=4x-4y, 3x+y=16 を解きなさい。',answer:'(4,4)',explanation:'第1式を整理するとx=y。4x=16。'}
    ]
  },
  '2024-Q1-8': {
    coreSkill: '弦の積を等しくし、最後にAP>BPで解を絞る。',
    questions: [
      {prompt:'円内で弦AB,CDがPで交わる。PB=4, CP=5, PD=8で、AP>PBである。APを求めなさい。',answer:'10',explanation:'AP×4=5×8よりAP=10、条件も満たす。'},
      {prompt:'AP=x+1, PB=x-1, CP=3, PD=5 (x>1) のときxを求め、AP>PBを確認しなさい。',answer:'x=4, AP>PB',explanation:'(x+1)(x-1)=15よりx²=16、x>1から4。'},
      {prompt:'AP=x, PB=12-x, CP=4, PD=8, AP>PB のときAPを求めなさい。',answer:'8',explanation:'x(12-x)=32よりx=4,8。AP>PBよりx=8。'},
      {prompt:'AP=x, PB=10-x, CP=3, PD=7, AP>PB のときAPを求めなさい。',answer:'7',explanation:'x(10-x)=21よりx=3,7。AP>PBよりx=7。'}
    ]
  },
  '2024-Q2-3': {
    coreSkill: '面積条件から絶対値方程式を作り、最後にy>9で候補を絞る。',
    questions: [
      {prompt:'点O=(0,0), A=(4,4)。点C=(x,x²)は放物線y=x²上にあり、△OACの面積が4、かつCのy座標は1より大きい。xを求めなさい。',answer:'2',explanation:'面積は|4x²-4x|/2=2|x²-x|。=4よりx=2,-1が候補。y>1よりx=2。'},
      {prompt:'点O=(0,0), A=(2,2)。C=(x,x²)がy=x²上にあり、△OACの面積が2、かつy>1のときxを求めなさい。',answer:'2',explanation:'面積=|2x²-2x|/2=|x²-x|=2。x=2,-1、y>1より2。'},
      {prompt:'点O=(0,0), A=(6,6)。C=(x,x²)がy=x²上にあり、△OACの面積が6、かつy>1のときxを求めなさい。',answer:'2',explanation:'面積=3|x²-x|=6より|x²-x|=2。候補2,-1、y>1より2。'},
      {prompt:'点O=(0,0), A=(8,8)。C=(x,x²)がy=x²上にあり、△OACの面積が8、かつy>1のときxを求めなさい。',answer:'2',explanation:'面積=4|x²-x|=8より|x²-x|=2。候補2,-1、y>1より2。'}
    ]
  },
  '2024-Q3-3': {
    coreSkill: '「AまたはB」は重複を引く。順序付き全60通りを基準にする。',
    questions: [
      {prompt:'1〜5のカードから戻さず3枚を順に引く。A:1枚目>2枚目<3枚目、B:3枚の和が偶数。AまたはBの確率を求めなさい。',answer:'11/15',explanation:'全60通り。A=20、B=36、A∩B=12なので(20+36-12)/60=44/60。'},
      {prompt:'1〜4のカードから戻さず2枚を順に引く。A:1枚目<2枚目、B:2枚の和が奇数。AまたはBの確率を求めなさい。',answer:'5/6',explanation:'全12通り。A=6、B=8、A∩B=4。よって10/12。'},
      {prompt:'1〜5のカードから戻さず2枚を順に引く。A:1枚目が偶数、B:2枚目が3以上。AまたはBの確率を求めなさい。',answer:'3/4',explanation:'全20通り。A=8、B=12、A∩B=5。和集合15通り。'},
      {prompt:'1〜6のカードから戻さず2枚を順に引く。A:1枚目<2枚目、B:和が奇数。AまたはBの確率を求めなさい。',answer:'4/5',explanation:'全30通り。A=15、B=18、A∩B=9。和集合24通り。'}
    ]
  },
  '2024-Q4-1': {
    coreSkill: '同じ周上を同方向なので、初期間隔÷相対速度。',
    questions: [
      {prompt:'1周100mの道を同方向にAは毎秒5m、Bは毎秒8mで進みます。BがAより30m後ろから出ると何秒で追いつきますか。',answer:'10',explanation:'相対速度3m/s、30÷3。'},
      {prompt:'同方向に毎分60mと90m、初期間隔150mです。何分で追いつきますか。',answer:'5',explanation:'150÷30。'},
      {prompt:'1周240mでA毎秒4m、B毎秒10m、Bが60m後方です。何秒で追いつきますか。',answer:'10',explanation:'60÷6。'},
      {prompt:'同方向の2点の速さが7,11、距離差48です。追いつく時間を求めなさい。',answer:'12',explanation:'48÷4。'}
    ]
  },
  '2024-Q4-2': {
    coreSkill: '動点がどの辺にいるか区間を決めてから、ベクトルの平行条件を使う。',
    questions: [
      {prompt:'点P=(t,0),Q=(0,2t)です。線分PQの傾きを求めなさい(t>0)。',answer:'-2',explanation:'(2t-0)/(0-t)=-2。'},
      {prompt:'ベクトル(3,6)と(x,8)が平行です。xを求めなさい。',answer:'4',explanation:'3:6=x:8。'},
      {prompt:'ベクトル(2,-3)と(6,y)が平行です。yを求めなさい。',answer:'-9',explanation:'3倍。'},
      {prompt:'点P=(t,0),Q=(8,4)でPQが傾き1の直線に平行です。tを求めなさい。',answer:'4',explanation:'4/(8-t)=1。'}
    ]
  },
  '2024-Q4-3': {
    coreSkill: '動点問題は辺が変わる時刻で場合分けし、各区間で座標面積を作る。',
    questions: [
      {prompt:'点Pがx軸上をP=(t,0)で動き、A=(0,0),C=(0,6)です。△APCの面積をtで表しなさい。',answer:'3t',explanation:'底辺AP=t、高さ6。'},
      {prompt:'P=(4,t),A=(0,0),B=(8,0)のとき△ABPの面積をtで表しなさい(t≥0)。',answer:'4t',explanation:'底辺8、高さt。'},
      {prompt:'Pが辺上を動き、0≤t≤3で三角形面積S=5t、3≤t≤7でS=15-2(t-3)です。S=10となるtをすべて求めなさい。',answer:'2,11/2',explanation:'前半t=2、後半15-2(t-3)=10。'},
      {prompt:'0≤t≤4でS=4t、4≤t≤8でS=32-4tです。S=8となるtをすべて求めなさい。',answer:'2,6',explanation:'区間ごとに解く。'}
    ]
  },
  '2024-Q5-1': {
    coreSkill: '正方形の一辺とAF=CEから2つの直角三角形を合同にする。',
    questions: [
      {prompt:'正方形ABCDでAB=BC=6、辺上にE,Fを取りAE=CF=2です。直角三角形の合同を示すとき使う等しい辺はAEと何ですか。',answer:'CF',explanation:'条件AE=CF。'},
      {prompt:'2つの直角三角形で斜辺5、1辺3がそれぞれ等しいとき合同といえますか。',answer:'はい',explanation:'直角三角形の斜辺と他の1辺。'},
      {prompt:'正方形の1辺が8、辺上でAE=CF=3です。EBとFDを求めなさい。',answer:'5,5',explanation:'8-3。'},
      {prompt:'直角三角形2つが合同なら対応する鋭角は等しいですか。',answer:'はい',explanation:'合同図形の対応角。'}
    ]
  },
  '2024-Q5-2': {
    coreSkill: 'Q1の15°を使い、座標・傾きでGEの方向を確定する。',
    questions: [
      {prompt:'正方形ABCDをB=(0,0),A=(0,s),D=(s,s),C=(s,0)と置く。EはBC上で∠CDE=30°、GはAB上で∠GDA=15°。E,Gの座標を求め、GEの傾きから∠DGEを求めなさい。',answer:'E=(s-s/√3,0), G=(0,s(√3-1)), ∠DGE=75°',explanation:'tan30°,tan15°でE,Gを置く。GEの傾きは-√3、GEは水平となす角60°、GDは15°なので75°。'},
      {prompt:'正方形ABCDをB=(0,0),A=(0,2),D=(2,2),C=(2,0)と置く。EはBC上で∠CDE=30°、GはAB上で∠GDA=15°。E,Gの座標と∠DGEを求めなさい。',answer:'E=(2-2/√3,0), G=(0,2(√3-1)), 75°',explanation:'一辺s=2を代入して座標化。傾き比ではsが消える。'},
      {prompt:'正方形ABCDをB=(0,0),A=(0,√3),D=(√3,√3),C=(√3,0)と置く。EはBC上で∠CDE=30°、GはAB上で∠GDA=15°。GEの傾きと∠DGEを求めなさい。',answer:'傾き-√3, 75°',explanation:'E=(√3-1,0), G=(0,3-√3)。傾き=-√3。'},
      {prompt:'正方形ABCDをB=(0,0),A=(0,s),D=(s,s),C=(s,0)と置き、EはBC上で∠CDE=30°、GはAB上で∠GDA=15°とします。一辺をsから2sへ拡大してもGEの傾きと∠DGEは変わらないことを確認し、値を答えなさい。',answer:'変わらない。傾き-√3、∠DGE=75°',explanation:'E,Gの両座標が同じ倍率で拡大されるため傾きと角度は不変。'}
    ]
  },
  '2024-Q5-3': {
    coreSkill: '具体的な長さが与えられたら座標化し、交点と面積を厳密に計算する。',
    questions: [
      {prompt:'B=(0,0),E=(2,0),G=(0,4),D=(4,4),F=(0,6)。直線DGとEFの交点Oを求め、△GBEと△DOEの面積を求めなさい。',answer:'O=(2/3,4), △GBE=4, △DOE=20/3',explanation:'DG:y=4、EF:y=6-3x。O=(2/3,4)。面積を座標から計算。'},
      {prompt:'B=(0,0),E=(3,0),G=(0,6),D=(6,6),F=(0,9)。直線DGとEFの交点Oを求め、△GBEと△DOEの面積を求めなさい。',answer:'O=(1,6), △GBE=9, △DOE=15',explanation:'EF:y=9-3x、DG:y=6。O=(1,6)。'},
      {prompt:'B=(0,0),E=(2,0),G=(0,3),D=(4,3),F=(0,5)。直線DGとEFの交点Oを求め、△GBEと△DOEの面積を求めなさい。',answer:'O=(4/5,3), △GBE=3, △DOE=24/5',explanation:'EF:y=5-(5/2)x、DG:y=3。△DOEは座標の行列式で24/5。'},
      {prompt:'B=(0,0),E=(1,0),G=(0,2),D=(3,2),F=(0,4)。直線DGとEFの交点Oを求め、△GBEと△DOEの面積を求めなさい。',answer:'O=(1/2,2), △GBE=1, △DOE=5/2',explanation:'EF:y=4-4x、DG:y=2。座標で面積を計算。'}
    ]
  },
  '2025-Q5-1': {
    coreSkill: '直径BCをx軸に置くと、円と高さAHからA,Dの座標が決まる。',
    questions: [
      {prompt:'中心O=(0,0)、半径5の円で、BCはx軸上の直径、ADはBCに平行な弦です。Aのy座標が3のとき台形ABCDの面積を求めなさい。',answer:'27',explanation:'A,Dのx座標は±4。AD=8, BC=10, 高さ3より(8+10)×3÷2=27。'},
      {prompt:'中心O=(0,0)、半径5の円で、BCはx軸上の直径、AD∥BC、Aのy座標が4です。台形ABCDの面積を求めなさい。',answer:'32',explanation:'x²+4²=25より|x|=3。AD=6, BC=10, 高さ4。'},
      {prompt:'中心O=(0,0)、半径13の円で、BCは直径、AD∥BC、Aのy座標が5です。台形ABCDの面積を求めなさい。',answer:'125',explanation:'|x|=12なのでAD=24, BC=26。面積=(24+26)×5÷2。'},
      {prompt:'中心O=(0,0)、半径10の円で、BCは直径、AD∥BC、Aのy座標が6です。台形ABCDの面積を求めなさい。',answer:'108',explanation:'|x|=8。AD=16, BC=20, 高さ6より108。'}
    ]
  },
  '2025-Q5-2': {
    coreSkill: '座標で交点Eを求め、OCを底辺にする。',
    questions: [
      {prompt:'O=(0,0), C=(5,0)。直線AC:y=-x+4とOD:y=2xの交点をEとする。Eを求め、△EOCの面積を求めなさい。',answer:'E=(4/3,8/3), 面積20/3',explanation:'連立でE。OC=5、高さ8/3なので面積=5×8/3÷2。'},
      {prompt:'O=(0,0), C=(6,0)。直線AC:y=-x/2+3とOD:y=xの交点Eと△EOCの面積を求めなさい。',answer:'E=(2,2), 面積6',explanation:'連立でx=2。底辺6、高さ2。'},
      {prompt:'O=(0,0), C=(4,0)。直線AC:y=-2x+6とOD:y=x/2の交点Eと△EOCの面積を求めなさい。',answer:'E=(12/5,6/5), 面積12/5',explanation:'-2x+6=x/2よりx=12/5。面積=4×6/5÷2。'},
      {prompt:'O=(0,0), C=(9,0)。直線AC:y=-x+6とOD:y=x/2の交点Eと△EOCの面積を求めなさい。',answer:'E=(4,2), 面積9',explanation:'連立でE=(4,2)。底辺9、高さ2。'}
    ]
  },
  '2025-Q5-3': {
    coreSkill: 'QをDF上の比uで表し、分割された四角形の面積をuの一次式にする。',
    questions: [
      {prompt:'四角形の面積が40で、点Qの位置をu(0≤u≤1)とすると片側面積が10+20uです。2等分するuを求めなさい。',answer:'1/2',explanation:'10+20u=20。'},
      {prompt:'全体60、片側面積12+36uです。2等分条件のuを求めなさい。',answer:'1/2',explanation:'12+36u=30。'},
      {prompt:'線分DQ=12u、面積2等分からu=2/3と分かりました。DQを求めなさい。',answer:'8',explanation:'12×2/3。'},
      {prompt:'線分長さ20でQがDからu=3/5の位置です。DQを求めなさい。',answer:'12',explanation:'20×3/5。'}
    ]
  },
  '2026-Q4-1': {
    coreSkill: '交点のx座標を二次方程式の2解として、距離比と解の和・積を使う。',
    questions: [
      {prompt:'ax²-x-6=0の2解がα<0,β>0で-α:β=1:2です。aを求めなさい。',answer:'1/3',explanation:'β=-2α、和1/a、積-6/aから解く。'},
      {prompt:'ax²-2x-8=0の2解が-α:β=1:2です(α<0<β)。aを求めなさい。',answer:'1',explanation:'β=-2α、解の和と積を使う。'},
      {prompt:'x²-kx-8=0の2解が-α:β=1:2です。k>0としてkを求めなさい。',answer:'2',explanation:'解-2,4なら積-8、和2。'},
      {prompt:'x²-kx-18=0の2解が-α:β=1:2です。k>0としてkを求めなさい。',answer:'3',explanation:'解-3,6、和3。'}
    ]
  },
  '2026-Q4-2': {
    coreSkill: '交点座標を確定し、三角形面積を2本のベクトルの行列式で表す。',
    questions: [
      {prompt:'A=(-2,2),B=(4,8),P=(t,t²/2), -2<t<4。△ABPの面積Sをtで表しなさい。',answer:'S=-3t²/2+3t+12',explanation:'AB=(6,6), AP=(t+2,t²/2-2)。行列式の符号を区間で確定する。'},
      {prompt:'A=(-1,1),B=(3,9),P=(t,t²), -1<t<3。△ABPの面積Sをtで表しなさい。',answer:'S=-2t²+4t+6',explanation:'行列式は4(t-3)(t+1)で区間内は負。絶対値を外す。'},
      {prompt:'A=(-2,4),B=(2,4),P=(t,t²), -2<t<2。△ABPの面積Sをtで表しなさい。',answer:'S=8-2t²',explanation:'底辺AB=4、高さ4-t²でも、行列式でもよい。'},
      {prompt:'A=(-3,9),B=(1,1),P=(t,t²), -3<t<1。△ABPの面積Sをtで表しなさい。',answer:'S=-2t²-4t+6',explanation:'行列式=4(t+3)(t-1)で区間内は負。'}
    ]
  },
  '2026-Q4-3': {
    coreSkill: '直径に対する円周角90°を使い、参考内容の傾きの積=-1へつなぐ。',
    questions: [
      {prompt:'放物線y=x²上のA=(-2,4),B=(2,4),P=(t,t²)で、Pは直径ABの円上にある。t>0としてtを求めなさい。',answer:'√3',explanation:'∠APB=90°。傾き(t-2)(t+2)=-1よりt²=3。'},
      {prompt:'y=x²上のA=(-3,9),B=(3,9),P=(t,t²)が直径ABの円上。t>0として求めなさい。',answer:'2√2',explanation:'傾きの積(t-3)(t+3)=-1よりt²=8。'},
      {prompt:'y=x²上のA=(-5,25),B=(5,25),P=(t,t²)が直径ABの円上。t>0として求めなさい。',answer:'2√6',explanation:'t²-25=-1よりt²=24。'},
      {prompt:'y=x²上のA=(-4,16),B=(4,16),P=(t,t²)が直径ABの円上。t>0として求めなさい。',answer:'√15',explanation:'(t-4)(t+4)=-1よりt²=15。'}
    ]
  },
  '2026-Q5-1': {
    coreSkill: '等しい辺から底角をそろえ、同じ弦ABの円周角へ移す。',
    questions: [
      {prompt:'AB=BDの二等辺三角形ABDで∠BAD=35°です。∠ADBを求めなさい。',answer:'35',explanation:'底角が等しい。'},
      {prompt:'同じ弦ABに対する円周角∠ADB=42°です。∠AEBを求めなさい。',answer:'42',explanation:'同じ弧の円周角。'},
      {prompt:'円周上A,B,D,Eで∠ADB=xです。D,Eが同じ弧AB側にあるとき∠AEBをxで表しなさい。',answer:'x',explanation:'同じ弦AB。'},
      {prompt:'二等辺三角形で底角が28°ずつです。頂角を求めなさい。',answer:'124',explanation:'180-56。'}
    ]
  },
  '2026-Q5-2': {
    coreSkill: '平行線の相似比と、点Cの方べきCA·CD=CB·CEを組み合わせる。',
    questions: [
      {prompt:'点Cから円への2本の割線でCA=9,CD=5,CB=9,CE=5です。CA·CDとCB·CEを求めなさい。',answer:'45,45',explanation:'方べき。'},
      {prompt:'CA·CD=CB·CE、CA=12,CD=3,CB=9のときCEを求めなさい。',answer:'4',explanation:'36=9CE。'},
      {prompt:'相似△CDE∽△CABでCE:CB=5:9、CD=10です。CAを求めなさい。',answer:'18',explanation:'CD:CA=5:9。'},
      {prompt:'CA·CD=45かつCA:CD=9:5です。CDを求めなさい。',answer:'5',explanation:'CA=(9/5)CD、積45。'}
    ]
  },
  '2026-Q5-3': {
    coreSkill: 'Q2の相似を継続利用し、AB=BDで尺度を決めてから、最後に△BDE∽△BFCでCFを出す。',
    questions: [
      {prompt:'△CDE∽△CABでCE:CB=5:9、AB=6です。さらに△BDE∽△BFCでBC:BE=9:4です。最初の相似からDEを求め、それを使ってCFを求めなさい。',answer:'DE=10/3, CF=15/2',explanation:'DE/AB=5/9よりDE=10/3。CF/DE=9/4よりCF=15/2。'},
      {prompt:'△CDE∽△CABでCE:CB=2:3、AB=9。△BDE∽△BFCでBC:BE=3:2。DE,CFを求めなさい。',answer:'DE=6, CF=9',explanation:'DE=9×2/3=6、CF=6×3/2=9。'},
      {prompt:'△CDE∽△CABでCE:CB=3:5、AB=10。△BDE∽△BFCでBC:BE=5:4。DE,CFを求めなさい。',answer:'DE=6, CF=15/2',explanation:'DE=10×3/5=6、CF=6×5/4。'},
      {prompt:'最初の相似比CE:CB=4:7、AB=14、次の相似比BC:BE=7:3です。DEを経由してCFを求めなさい。',answer:'CF=56/3',explanation:'DE=14×4/7=8、CF=8×7/3=56/3。'}
    ]
  },
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
  const sourceProfile = sourceQuestion ? sourceSpecificBanks[sourceQuestion] : undefined
  const bank = sourceProfile?.questions ?? (difficulty === 'A'
    ? field.questions
    : (difficultyBanks[field.id]?.[difficulty] ?? field.questions))
  return { field, difficulty, questions: bank, coreSkill: sourceProfile?.coreSkill }
}

export function sourceSpecificRemediationCount() {
  return Object.keys(sourceSpecificBanks).length
}

export function sourceRemediationCoreSkill(sourceQuestion: string) {
  return sourceSpecificBanks[sourceQuestion]?.coreSkill
}
