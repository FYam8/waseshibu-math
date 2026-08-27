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
  const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a
  const fraction=(a:number,b:number)=>{const g=gcd(a,b);return `${a/g}/${b/g}`}
  const generated:Record<string,()=>RemedyQuestion[]>={
    equation:()=>[
      ...Array.from({length:4},(_,i)=>{const a=i+2,n=i+3,b=i+1,c=a*n+b;return {prompt:`方程式 ${a}x+${b}=${c} を解きなさい。`,answer:String(n),explanation:`${a}x=${c-b}よりx=${n}。`}}),
      ...Array.from({length:4},(_,i)=>{const x=i+4,y=i+1,s=x+y,d=x-y;return {prompt:`連立方程式 x+y=${s}, x-y=${d} のxを求めなさい。`,answer:String(x),explanation:`2式を足すと2x=${2*x}。`}}),
      ...Array.from({length:4},(_,i)=>{const r1=i+1,r2=i+4;return {prompt:`方程式 x²-${r1+r2}x+${r1*r2}=0 の大きい方の解を答えなさい。`,answer:String(r2),explanation:`(x-${r1})(x-${r2})=0。`}})
    ],
    calculation:()=>[
      ...Array.from({length:4},(_,i)=>{const a=i+2,b=i+5;return {prompt:`x²-${a+b}x+${a*b}を因数分解しなさい。`,answer:`(x-${a})(x-${b})`,acceptedAnswers:[`(x-${b})(x-${a})`],explanation:`積${a*b}、和-${a+b}の2数は-${a},-${b}。`}}),
      ...Array.from({length:4},(_,i)=>{const k=i+2,b=i+3,n=(k+1)*b;return {prompt:`${k}x-${k+1}(x-${b})を簡単にしなさい。`,answer:`-x+${n}`,acceptedAnswers:[`${n}-x`],explanation:`${k}x-${k+1}x+${n}=-x+${n}。`}}),
      ...Array.from({length:4},(_,i)=>{const m=i+3;return {prompt:`√${m*m*2}-√2 を簡単にしなさい。`,answer:`${m-1}√2`,acceptedAnswers:[`${m-1}*√2`,`${m-1}sqrt(2)`],explanation:`√${m*m*2}=${m}√2。`}})
    ],
    function:()=>[
      ...Array.from({length:4},(_,i)=>{const x=i+2,y=i+3;return {prompt:`反比例y=${x*y}/xでx=${x}のときyを求めなさい。`,answer:String(y),explanation:`${x*y}÷${x}=${y}。`}}),
      ...Array.from({length:4},(_,i)=>{const a=i+1,x=i+2,y=a*x*x;return {prompt:`放物線y=ax²が点(${x},${y})を通るときaを求めなさい。`,answer:String(a),explanation:`${y}=${x*x}aよりa=${a}。`}}),
      ...Array.from({length:4},(_,i)=>{const m=i+1,y2=2+3*m;return {prompt:`点(1,2)と(4,${y2})を通る直線の傾きを求めなさい。`,answer:String(m),explanation:`(${y2}-2)÷3=${m}。`}})
    ],
    probability:()=>[
      ...[4,5,6,7].map(sum=>({prompt:`2個のサイコロの和が${sum}になる確率を求めなさい。`,answer:fraction(sum-1,36),explanation:`条件に合うのは${sum-1}通り。全36通り。`})),
      ...[4,5,6,7].map(n=>({prompt:`1〜${n}のカードから2枚を同時に選ぶ方法は何通りですか。`,answer:String(n*(n-1)/2),explanation:`${n}C2=${n*(n-1)/2}。`})),
      ...[5,6,7,8].map(n=>({prompt:`1〜${n}から1つ選ぶとき偶数である確率を求めなさい。`,answer:fraction(Math.floor(n/2),n),explanation:`偶数は${Math.floor(n/2)}個、全体は${n}個。`}))
    ],
    integer:()=>[
      ...[[6,8,3],[4,10,1],[6,9,2],[8,12,5]].map(([a,b,r])=>{const l=a*b/gcd(a,b);return {prompt:`Mを${a}で割っても${b}で割っても${r}余ります。最小の2桁のMを求めなさい。`,answer:String(l+r),explanation:`M-${r}は最小公倍数${l}の倍数。`}}),
      ...[12,18,20,28].map(n=>{let count=0;for(let i=1;i<=n;i++)if(n%i===0)count++;return {prompt:`${n}の正の約数の個数を求めなさい。`,answer:String(count),explanation:`約数を積の組で漏れなく数えると${count}個。`}}),
      ...[3,4,5,6].map(k=>({prompt:`絶対値が√${k*k+2}より小さい整数は何個ありますか。`,answer:String(2*k+1),explanation:`√${k*k+2}は${k}と${k+1}の間。-${k}〜${k}の${2*k+1}個。`}))
    ],
    geometry:()=>[
      ...[[2,3],[3,4],[3,5],[4,5]].map(([a,b])=>({prompt:`相似な三角形の辺の比が${a}:${b}です。面積比を答えなさい。`,answer:`${a*a}:${b*b}`,explanation:'面積比は辺の比の2乗。'})),
      ...[[3,7,4],[4,8,5],[5,9,6],[6,10,7]].map(([a,b,h])=>({prompt:`上底${a}cm、下底${b}cm、高さ${h}cmの台形の面積を求めなさい。`,answer:String((a+b)*h/2),explanation:`(${a}+${b})×${h}÷2。`})),
      ...[6,8,10,12].map(d=>({prompt:`直径${d}cmの円で、直径を見込む円周角は何度ですか。`,answer:'90',explanation:'直径を見込む円周角は常に90度。'}))
    ],
    solid:()=>[
      ...[[18,8],[24,9],[30,7],[36,10]].map(([base,h])=>({prompt:`底面積${base}cm²、高さ${h}cmの角すいの体積を求めなさい。`,answer:String(base*h/3),explanation:`${base}×${h}÷3。`})),
      ...[3,4,5,6].map(a=>({prompt:`1辺${a}cmの立方体の体積を求めなさい。`,answer:String(a**3),explanation:`${a}³=${a**3}。`})),
      ...[[12,5],[15,6],[18,7],[21,8]].map(([base,h])=>({prompt:`底面積${base}cm²、高さ${h}cmの柱体の体積を求めなさい。`,answer:String(base*h),explanation:`${base}×${h}。`}))
    ],
    word:()=>[
      ...[[10,240],[12,250],[15,200],[20,180]].map(([p,g])=>({prompt:`${p}%の食塩水${g}gに含まれる食塩は何gですか。`,answer:String(p*g/100),explanation:`${g}×${p/100}。`})),
      ...[[12,8],[15,9],[18,7],[20,6]].map(([rate,t])=>({prompt:`毎分${rate}Lずつ水を入れます。${t}分で何L入りますか。`,answer:String(rate*t),explanation:`${rate}×${t}。`})),
      ...[[700,900,10],[800,1050,8],[900,1200,12],[650,850,15]].map(([buy,sell,n])=>({prompt:`${buy}円で仕入れた品を${sell}円で${n}個売りました。利益はいくらですか。`,answer:String((sell-buy)*n),explanation:`(${sell}-${buy})×${n}。`}))
    ],
    statistics:()=>[
      ...[[2,4,5,8,9],[1,3,6,7,10],[4,5,8,11,13],[3,7,9,12,15]].map(xs=>({prompt:`データ ${xs.join(',')} の中央値を求めなさい。`,answer:String(xs[2]),explanation:`並べた中央の値は${xs[2]}。`})),
      ...[[3,5,8,10],[2,6,9,11],[4,8,10,14],[5,7,12,16]].map(xs=>({prompt:`データ ${xs.join(',')} の中央値を求めなさい。`,answer:String((xs[1]+xs[2])/2),explanation:`中央2数の平均。`})),
      ...[[5,68],[6,72],[8,65],[10,74]].map(([n,avg])=>({prompt:`${n}人の平均点が${avg}点です。合計点を求めなさい。`,answer:String(n*avg),explanation:`${avg}×${n}。`}))
    ]
  }
  return generated[key]?.()||banks[key]
}
