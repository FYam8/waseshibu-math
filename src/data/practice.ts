export type PracticeQuestion = {
  id: string
  prompt: string
  answer: string
  acceptedAnswers?: string[]
  topic: string
  grade: 'A' | 'B'
  sourcePattern: string
  hint1: string
  hint2: string
  explanation: string
}

export const practiceQuestions: PracticeQuestion[] = [
  {
    id: 'p1',
    prompt: '方程式 3(2x-1)-5=x+8 を解きなさい。',
    answer: '16/5',
    topic: '一次方程式',
    grade: 'A',
    sourcePattern: '大問1・方程式',
    hint1: 'まず左辺のかっこを外します。',
    hint2: 'xの項を左、数の項を右に集めます。',
    explanation: '6x-3-5=x+8 → 5x=16 → x=16/5。'
  },
  {
    id: 'p2',
    prompt: 'x²-7x+12 を因数分解しなさい。',
    answer: '(x-3)(x-4)',
    acceptedAnswers: ['(x-4)(x-3)'],
    topic: '因数分解',
    grade: 'A',
    sourcePattern: '大問1・因数分解',
    hint1: '積が12、和が-7になる2数を探します。',
    hint2: '-3と-4を使います。',
    explanation: 'x²-7x+12=(x-3)(x-4)。'
  },
  {
    id: 'p3',
    prompt: 'y-1 は x に比例し、x=4 のとき y=7 です。yをxの式で表しなさい。',
    answer: '3/2x+1',
    acceptedAnswers: ['3x/2+1','1+3/2x','1+3x/2'],
    topic: '比例・一次式',
    grade: 'A',
    sourcePattern: '大問1・関数',
    hint1: 'y-1=kx とおきます。',
    hint2: 'x=4, y=7を代入してkを求めます。',
    explanation: '6=4k より k=3/2。よって y=3x/2+1。'
  },
  {
    id: 'p4',
    prompt: '2個のサイコロを同時に投げるとき、出た目の和が8になる確率を求めなさい。',
    answer: '5/36',
    topic: '確率',
    grade: 'A',
    sourcePattern: '大問2〜5・確率',
    hint1: '全体は36通りです。',
    hint2: '(2,6),(3,5),(4,4),(5,3),(6,2)を数えます。',
    explanation: '条件を満たすのは5通りなので5/36。'
  },
  {
    id: 'p5',
    prompt: '1,2,3,4,5 のカードから2枚を順に戻さず引くとき、2枚目が1枚目より大きい確率を求めなさい。',
    answer: '1/2',
    topic: '確率・順序',
    grade: 'A',
    sourcePattern: '2024/2026型・戻さないカード',
    hint1: '順序つきで全体は5×4通りです。',
    hint2: '大小関係は対称です。',
    explanation: '同じ数は出ないため、「2枚目>1枚目」と「2枚目<1枚目」は同数。よって1/2。'
  },
  {
    id: 'p6',
    prompt: '底面積が24cm²、高さが9cmの三角すいの体積を求めなさい。',
    answer: '72',
    topic: '立体図形',
    grade: 'A',
    sourcePattern: '大問1/立体',
    hint1: '角すいの体積は 底面積×高さ÷3 です。',
    hint2: '24×9÷3を計算します。',
    explanation: '24×9÷3=72cm³。'
  },
  {
    id: 'p7',
    prompt: '絶対値が√20より小さい整数は何個ありますか。',
    answer: '9',
    topic: '平方根・整数',
    grade: 'A',
    sourcePattern: '2026型・絶対値と整数',
    hint1: '√20は4と5の間です。',
    hint2: '-4から4までを数えます。',
    explanation: '-4,-3,-2,-1,0,1,2,3,4 の9個。'
  },
  {
    id: 'p8',
    prompt: '濃度10%の食塩水300gに水を50g加えました。新しい濃度を分数で求めなさい。',
    answer: '3/35',
    topic: '食塩水',
    grade: 'B',
    sourcePattern: '2025/2026型・量の保存',
    hint1: '食塩の量は変わりません。',
    hint2: '食塩30g、全体350gです。',
    explanation: '30/350=3/35。'
  },
  {
    id: 'p9',
    prompt: '点(4,-3)をx軸について対称移動した点の座標を求めなさい。答えは (x,y) の形で。',
    answer: '(4,3)',
    topic: '座標',
    grade: 'A',
    sourcePattern: '2026型・座標対称',
    hint1: 'x軸対称ではx座標はそのままです。',
    hint2: 'y座標の符号だけ変わります。',
    explanation: '(4,-3) → (4,3)。'
  },
  {
    id: 'p10',
    prompt: '1辺3cmの正方形の面積は何cm²ですか。',
    answer: '9',
    topic: '平面図形',
    grade: 'A',
    sourcePattern: '大問1・面積',
    hint1: '正方形の面積は1辺×1辺です。',
    hint2: '3×3を計算します。',
    explanation: '3×3=9。'
  },
  {
    id: 'p11',
    prompt: '連立方程式 x+y=10, x-y=4 を解き、xの値を答えなさい。',
    answer: '7',
    topic: '連立方程式',
    grade: 'A',
    sourcePattern: '大問1・連立',
    hint1: '2式を足すとyが消えます。',
    hint2: '2x=14です。',
    explanation: '2x=14よりx=7。'
  },
  {
    id: 'p12',
    prompt: 'ある数nを5で割ると2余ります。n+8を5で割った余りを求めなさい。',
    answer: '0',
    topic: '整数・余り',
    grade: 'A',
    sourcePattern: '2026型・余り',
    hint1: 'n=5k+2 と置きます。',
    hint2: 'n+8=5k+10です。',
    explanation: '5の倍数になるので余りは0。'
  }
]
