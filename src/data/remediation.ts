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
    id: 'expressions', title: '式の計算・文字式', keywords: /数式計算|文字式|式の計算|式の変形|数・分数の処理/,
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
    id: 'coordinates', title: '座標・直線・面積', keywords: /座標|直線|交点|傾き|y軸|対称移動|座標関係/,
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
    id: 'similarity', title: '相似・面積比', keywords: /相似|面積比|辺の比|辺の関係|平行四辺形|平行条件|平行線|台形|平面図形|正方形|三角形の決定条件/,
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
