export type MultiPart = {
  id:string
  pattern:string
  title:string
  grade:'A'|'B'|'C'
  prompt:string
  answer:string
  acceptedAnswers?:string[]
  hint1:string
  hint2:string
  connection:string
  explanation:string
}
export type MultiSet = {
  id:string
  title:string
  basedOn:string
  domain:string
  parts:MultiPart[]
}

export const multiSets: MultiSet[] = [
  {
    id:'function-01',
    title:'放物線・直線・面積',
    basedOn:'2020・2024・2025・2026年度で確認できる関数/座標の誘導構造を参考にした自作問題',
    domain:'関数・座標',
    parts:[
      {
        id:'f1', pattern:'係数決定', title:'（1）係数を決める', grade:'A',
        prompt:'放物線 y=ax² が点A(2,2)を通る。aを求めなさい。',
        answer:'1/2',
        hint1:'点Aの座標を y=ax² に代入します。',
        hint2:'2=4a です。',
        connection:'ここで決めたaを（2）（3）でも使います。',
        explanation:'2=4a より a=1/2。'
      },
      {
        id:'f2', pattern:'交点', title:'（2）交点を求める', grade:'A',
        prompt:'（1）の放物線と直線 y=x の、原点以外の交点Pのx座標を求めなさい。',
        answer:'2',
        hint1:'y=x と y=x²/2 を連立します。',
        hint2:'x=x²/2 → x(x-2)=0。',
        connection:'交点の座標を確定し、（3）で面積を作ります。',
        explanation:'x=0,2。原点以外なのでx=2。'
      },
      {
        id:'f3', pattern:'面積条件', title:'（3）面積を式にする', grade:'B',
        prompt:'P=(2,2)とする。x軸上の点Q=(t,0)について、三角形OPQの面積が3になるとき、t>0としてtを求めなさい。',
        answer:'3',
        hint1:'OQを底辺にすると長さはt、高さはPのy座標2です。',
        hint2:'面積は t×2÷2=t。',
        connection:'「座標→長さ/高さ→面積式」の流れが関数融合問題の基本です。',
        explanation:'面積=t。よってt=3。'
      }
    ]
  },
  {
    id:'probability-01',
    title:'戻さないカード・順序・複合条件',
    basedOn:'2024・2026年度で確認できるカード確率の段階構造を参考にした自作問題',
    domain:'確率・場合の数',
    parts:[
      {
        id:'p1', pattern:'基本確率', title:'（1）基本事象', grade:'A',
        prompt:'1〜6のカードから1枚引く。偶数である確率を求めなさい。',
        answer:'1/2',
        hint1:'全体6枚のうち偶数は何枚か数えます。',
        hint2:'2,4,6の3枚です。',
        connection:'まず全体と条件に合う場合を正確に数えます。',
        explanation:'3/6=1/2。'
      },
      {
        id:'p2', pattern:'順序比較', title:'（2）順序を区別する', grade:'A',
        prompt:'1〜6のカードから2枚を順に戻さず引く。2枚目が1枚目より大きい確率を求めなさい。',
        answer:'1/2',
        hint1:'同じ数は出ません。',
        hint2:'大小2つの場合は対称です。',
        connection:'（3）ではこの「順序つきの組」をさらに条件で絞ります。',
        explanation:'大・小の関係は対称なので1/2。'
      },
      {
        id:'p3', pattern:'倍数関係', title:'（3）複合条件', grade:'B',
        prompt:'1〜6のカードから2枚を順に戻さず引く。2枚目が1枚目の2倍になる確率を求めなさい。',
        answer:'1/10',
        hint1:'順序つきの全体は6×5=30通り。',
        hint2:'条件を満たすのは(1,2),(2,4),(3,6)。',
        connection:'倍数条件は、先に成立する組を規則的に列挙すると漏れにくくなります。',
        explanation:'3/30=1/10。'
      }
    ]
  },
  {
    id:'word-01',
    title:'食塩水・量の保存',
    basedOn:'2025・2026年度で確認できる食塩水/量の保存型を参考にした自作問題',
    domain:'文章題',
    parts:[
      {
        id:'w1', pattern:'濃度', title:'（1）食塩量', grade:'A',
        prompt:'濃度12%の食塩水250gに含まれる食塩は何gですか。',
        answer:'30',
        hint1:'全体×濃度です。',
        hint2:'250×0.12。',
        connection:'（2）では、この食塩量を基準に水を加えます。',
        explanation:'250×0.12=30g。'
      },
      {
        id:'w2', pattern:'希釈', title:'（2）水を加える', grade:'A',
        prompt:'（1）の食塩水に水50gを加えた。濃度を分数で求めなさい。',
        answer:'1/10',
        hint1:'食塩は30gのままです。',
        hint2:'全体は300g。',
        connection:'「変わらない量」と「変わる量」を分けるのが重要です。',
        explanation:'30/300=1/10。'
      },
      {
        id:'w3', pattern:'置換', title:'（3）一部を捨てて戻す', grade:'B',
        prompt:'（2）の食塩水300gから60gを捨て、同じ60gの水を加えた。食塩は何g残りますか。',
        answer:'24',
        hint1:'60g捨てるので、全体の1/5を捨てます。',
        hint2:'食塩も1/5減ります。',
        connection:'反復操作では「1回で何倍残るか」を作ると整理できます。',
        explanation:'30×(4/5)=24g。'
      }
    ]
  }
]
