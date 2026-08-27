export type RemedyQuestion={prompt:string;answer:string;acceptedAnswers?:string[];explanation:string}
const banks:Record<string,RemedyQuestion[]>={
  equation:[
    {prompt:'方程式 4x-7=13 を解きなさい。',answer:'5',explanation:'4x=20よりx=5。'},
    {prompt:'連立方程式 x+y=11, x-y=3 のxを求めなさい。',answer:'7',explanation:'2式を足すと2x=14。'},
    {prompt:'方程式 x²-5x+6=0 の大きい方の解を答えなさい。',answer:'3',explanation:'(x-2)(x-3)=0より2,3。'}
  ],
  calculation:[
    {prompt:'3√12-√27 を簡単にしなさい。',answer:'3√3',acceptedAnswers:['3*√3','3sqrt(3)'],explanation:'3√12=6√3、√27=3√3。差は3√3。'},
    {prompt:'x²-7x+10を因数分解しなさい。',answer:'(x-2)(x-5)',acceptedAnswers:['(x-5)(x-2)'],explanation:'積10、和-7の2数は-2,-5。'},
    {prompt:'2a-3(a-4)を簡単にしなさい。',answer:'-a+12',acceptedAnswers:['12-a'],explanation:'2a-3a+12=-a+12。'}
  ],
  function:[
    {prompt:'反比例y=24/xでx=6のときyを求めなさい。',answer:'4',explanation:'24÷6=4。'},
    {prompt:'放物線y=ax²が点(3,18)を通るときaを求めなさい。',answer:'2',explanation:'18=9aよりa=2。'},
    {prompt:'点(1,3)と(5,11)を通る直線の傾きを求めなさい。',answer:'2',explanation:'(11-3)÷(5-1)=2。'}
  ],
  probability:[
    {prompt:'2個のサイコロの和が6になる確率を求めなさい。',answer:'5/36',explanation:'(1,5)〜(5,1)の5通り。'},
    {prompt:'1〜5のカードから2枚を同時に選ぶ方法は何通りですか。',answer:'10',explanation:'5C2=10。'},
    {prompt:'1〜4のカードを2枚順に引くとき、2枚目が1枚目より大きい確率を求めなさい。',answer:'1/2',explanation:'同じ数は出ず、大小は対称。'}
  ],
  integer:[
    {prompt:'Mを6で割っても9で割っても2余ります。2桁で最小のMを求めなさい。',answer:'20',explanation:'M-2は6と9の公倍数。最小公倍数18より20。'},
    {prompt:'84の正の約数の個数を求めなさい。',answer:'12',explanation:'84=2²×3×7より(2+1)(1+1)(1+1)=12。'},
    {prompt:'絶対値が√30より小さい整数は何個ありますか。',answer:'11',explanation:'√30は5と6の間。-5〜5の11個。'}
  ],
  geometry:[
    {prompt:'相似な三角形の辺の比が3:5です。面積比を答えなさい。',answer:'9:25',explanation:'面積比は辺の比の2乗。'},
    {prompt:'直径を見込む円周角は何度ですか。',answer:'90',explanation:'半円に対する円周角は90度。'},
    {prompt:'上底4cm、下底10cm、高さ6cmの台形の面積を求めなさい。',answer:'42',explanation:'(4+10)×6÷2=42。'}
  ],
  solid:[
    {prompt:'底面積24cm²、高さ9cmの三角すいの体積を求めなさい。',answer:'72',explanation:'24×9÷3=72。'},
    {prompt:'1辺5cmの立方体の体積を求めなさい。',answer:'125',explanation:'5³=125。'},
    {prompt:'底面積18cm²、高さ7cmの柱体の体積を求めなさい。',answer:'126',explanation:'18×7=126。'}
  ],
  word:[
    {prompt:'12%の食塩水250gに含まれる食塩は何gですか。',answer:'30',explanation:'250×0.12=30。'},
    {prompt:'毎分15Lずつ水を入れます。8分で何L入りますか。',answer:'120',explanation:'15×8=120。'},
    {prompt:'800円で仕入れた品を1000円で12個売りました。利益はいくらですか。',answer:'2400',explanation:'(1000-800)×12=2400。'}
  ],
  statistics:[
    {prompt:'データ 2,7,4,9,5 の中央値を求めなさい。',answer:'5',explanation:'2,4,5,7,9の中央は5。'},
    {prompt:'データ 3,5,8,10 の中央値を求めなさい。',answer:'6.5',acceptedAnswers:['13/2'],explanation:'中央2数5,8の平均は6.5。'},
    {prompt:'5人の平均点が68点です。合計点を求めなさい。',answer:'340',explanation:'68×5=340。'}
  ]
}

export function getRemediation(topic:string){
  const key=
    /方程式|連立/.test(topic)?'equation':
    /確率|場合|カード|サイコロ|移動|スイッチ/.test(topic)?'probability':
    /放物線|反比例|関数|直線|座標|変域|変化の割合/.test(topic)?'function':
    /整数|余り|約数|倍数|平方数|四捨五入/.test(topic)?'integer':
    /円柱|円すい|立方体|角すい|立体|体積|表面積/.test(topic)?'solid':
    /中央値|平均|データ/.test(topic)?'statistics':
    /食塩|貯水|売買|歩行|割合|濃度|文章|数量|グラフ/.test(topic)?'word':
    /図形|角度|円|相似|平行|三角|四角|台形|面積|長さ|弦/.test(topic)?'geometry':'calculation'
  return banks[key]
}
