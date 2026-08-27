export type YearTraining = {
  id: string
  year: number
  major: number
  target: '60' | '70' | '75'
  pastPattern: string
  scorePlan: string
  steps: [string, string, string]
  prompt: string
  answer: string
  acceptedAnswers?: string[]
  explanation: string
}

// 2019〜2026年度の各大問の出題構造を基に、数値・設定を変えて作成した学習用類題。
// 学校公式問題の本文は転載しない。
export const yearTraining: YearTraining[] = [
  {id:'2019-Q1',year:2019,major:1,target:'60',pastPattern:'9問の小問集合：計算・方程式・関数・整数・立体',scorePlan:'45点中35点以上を先に確保',steps:['計算問題から着手','1問3分で区切る','検算して最簡形にする'],prompt:'方程式 2x²-5x-3=0 の大きい方の解を答えなさい。',answer:'3',explanation:'(2x+1)(x-3)=0。解は-1/2, 3なので大きい方は3。'},
  {id:'2019-Q2',year:2019,major:2,target:'60',pastPattern:'円・正三角形・相似から面積比へ進む誘導',scorePlan:'（1）を確実に、（2）は図を分割',steps:['合同・対称を探す','相似比を出す','面積比は相似比の2乗'],prompt:'相似な2つの正三角形の辺の比が2:3です。面積比を最簡整数比で答えなさい。',answer:'4:9',explanation:'相似図形の面積比は辺の比の2乗なので4:9。'},
  {id:'2019-Q3',year:2019,major:3,target:'70',pastPattern:'移動ルール・経由条件・時間制限の場合の数',scorePlan:'条件を1つずつ追加して数える',steps:['全移動回数を式にする','経由点で前後に分ける','重複を除く'],prompt:'1歩または2歩で5段上る方法は何通りありますか。',answer:'8',explanation:'aₙ=aₙ₋₁+aₙ₋₂。1,2,3,5,8より8通り。'},
  {id:'2019-Q4',year:2019,major:4,target:'70',pastPattern:'貯水量グラフ・変化率・周期の逆算',scorePlan:'傾きと1周期を得点源にする',steps:['区間を分ける','傾き=変化量÷時間','増減1周期を作る'],prompt:'水量が毎分12L増え、5分後から毎分8L減ります。5分後の水量が60Lなら、そこから0Lになるまで何分ですか。',answer:'7.5',acceptedAnswers:['15/2'],explanation:'60÷8=7.5分。'},
  {id:'2019-Q5',year:2019,major:5,target:'70',pastPattern:'放物線上の点・直線の傾き・面積比',scorePlan:'座標を1文字で統一',steps:['点を(t,t²)と置く','傾きを式にする','面積は底辺×高さ÷2'],prompt:'放物線y=x²上の点A(1,1),B(3,9)を結ぶ直線の傾きを求めなさい。',answer:'4',explanation:'(9-1)÷(3-1)=4。'},

  {id:'2020-Q1',year:2020,major:1,target:'60',pastPattern:'8問の小問集合：根号・方程式・関数・図形・整数',scorePlan:'40点中30〜35点を安定',steps:['式変形を1行ずつ','図形は公式を先に書く','整数は候補を絞る'],prompt:'√48-√3 を最も簡単な形にしなさい。',answer:'3√3',acceptedAnswers:['3*√3'],explanation:'√48=4√3なので、4√3-√3=3√3。'},
  {id:'2020-Q2',year:2020,major:2,target:'70',pastPattern:'サイコロ複数回・和と積の複合確率',scorePlan:'表か樹形図で漏れを防ぐ',steps:['全事象を決める','条件を順番に絞る','分数を約分'],prompt:'2個のサイコロの積が6になる確率を求めなさい。',answer:'1/9',explanation:'(1,6),(2,3),(3,2),(6,1)の4通り。4/36=1/9。'},
  {id:'2020-Q3',year:2020,major:3,target:'70',pastPattern:'放物線と直線の交点・三角形面積比',scorePlan:'（1）（2）の連立まで回収',steps:['交点を連立','座標を確定','共通の高さで面積比'],prompt:'放物線y=x²と直線y=2xの原点以外の交点のx座標を求めなさい。',answer:'2',explanation:'x²=2xよりx(x-2)=0。原点以外はx=2。'},
  {id:'2020-Q4',year:2020,major:4,target:'70',pastPattern:'時計の時針・分針・角度とおうぎ形',scorePlan:'角速度の差を使う',steps:['分針6度/分','時針0.5度/分','相対速度5.5度/分'],prompt:'3時ちょうどから20分後、時針と分針の小さい方の角は何度ですか。',answer:'20',explanation:'分針120度、時針100度。差は20度。'},
  {id:'2020-Q5',year:2020,major:5,target:'70',pastPattern:'立方体の頂点を結ぶ立体・切断・体積',scorePlan:'元の立方体から引く',steps:['全体体積を出す','切り取る立体を数える','重複なく差を取る'],prompt:'1辺6cmの立方体の体積を求めなさい。',answer:'216',explanation:'6³=216cm³。切断問題でも最初に全体体積を確定する。'},

  {id:'2021-Q1',year:2021,major:1,target:'60',pastPattern:'8問の小問集合：計算・関数・整数・円・統計',scorePlan:'中央値・円周角を落とさない',steps:['並べ替えて中央値','直径なら円周角90度','条件を図に書く'],prompt:'データ 3,8,5,10,4 の中央値を求めなさい。',answer:'5',explanation:'3,4,5,8,10と並べ、中央は5。'},
  {id:'2021-Q2',year:2021,major:2,target:'70',pastPattern:'円柱の水位と沈めた円すいの体積',scorePlan:'水位上昇分=沈んだ体積',steps:['底面積を出す','水位差を掛ける','円すい体積と比較'],prompt:'底面積30cm²の円柱で水位が4cm上がりました。沈めた物体の体積は何cm³ですか。',answer:'120',explanation:'30×4=120cm³。'},
  {id:'2021-Q3',year:2021,major:3,target:'70',pastPattern:'ゲーム規則と2個のサイコロの数え上げ',scorePlan:'規則を式に翻訳',steps:['勝敗条件を書く','36通りを表にする','条件一致を数える'],prompt:'2個のサイコロの和が7なら勝ちです。勝つ確率を求めなさい。',answer:'1/6',explanation:'和7は6通り。6/36=1/6。'},
  {id:'2021-Q4',year:2021,major:4,target:'70',pastPattern:'売買単価・収支・手数料と整数条件',scorePlan:'収入−支出を1本の式にする',steps:['購入費を出す','売上を出す','利益条件を方程式化'],prompt:'1個800円で10個仕入れ、1個1000円で全部売りました。利益はいくらですか。',answer:'2000',explanation:'1000×10-800×10=2000円。'},
  {id:'2021-Q5',year:2021,major:5,target:'70',pastPattern:'反比例と動く直角二等辺三角形・相似',scorePlan:'座標→直線→相似の順',steps:['xy=定数を使う','2点から直線式','対応する辺をそろえる'],prompt:'反比例y=12/x上でx=3の点のy座標を求めなさい。',answer:'4',explanation:'y=12÷3=4。'},

  {id:'2022-Q1',year:2022,major:1,target:'60',pastPattern:'8問の小問集合：計算・方程式・確率・近似・割合・相似',scorePlan:'計算6問以上を確保',steps:['単位をそろえる','範囲は不等号','相似比で長さ'],prompt:'ある長さを小数第1位で四捨五入すると8cmでした。元の長さxの範囲を答えなさい。',answer:'7.5≦x<8.5',acceptedAnswers:['7.5<=x<8.5'],explanation:'8になる範囲は7.5以上8.5未満。'},
  {id:'2022-Q2',year:2022,major:2,target:'70',pastPattern:'放物線・反比例・面積条件・立方体体積',scorePlan:'各式を同じxでつなぐ',steps:['反比例xy=k','面積条件を式化','最後に体積へ変換'],prompt:'反比例y=18/x上でy=3となる点のx座標を求めなさい。',answer:'6',explanation:'3=18/xよりx=6。'},
  {id:'2022-Q3',year:2022,major:3,target:'60',pastPattern:'歩行距離と飲水量の比例・途中で条件変更',scorePlan:'比例定数を先に確定',steps:['1kmあたりを出す','区間ごとに計算','合計する'],prompt:'4km歩くと600mL飲みます。同じ割合で7km歩くと何mLですか。',answer:'1050',explanation:'1kmあたり150mL。150×7=1050mL。'},
  {id:'2022-Q4',year:2022,major:4,target:'70',pastPattern:'スイッチのオン・オフと場合の数',scorePlan:'状態を0/1で追跡',steps:['初期状態を書く','押すたび反転','人の選び方を数える'],prompt:'消灯中の電灯のスイッチを3回押すと、最後は点灯・消灯のどちらですか。',answer:'点灯',explanation:'消灯→点灯→消灯→点灯。'},
  {id:'2022-Q5',year:2022,major:5,target:'70',pastPattern:'立方体の中点・対角線・三角すいと四角すい体積',scorePlan:'底面と高さを固定',steps:['底面積を求める','垂直な高さを選ぶ','角すいは÷3'],prompt:'底面積18cm²、高さ10cmの三角すいの体積を求めなさい。',answer:'60',explanation:'18×10÷3=60cm³。'},

  {id:'2023-Q1',year:2023,major:1,target:'60',pastPattern:'8問の小問集合：文字式・方程式・角度・平方根・中央値・図形条件',scorePlan:'選択問題も根拠を確認',steps:['式の条件を読む','角度関係を図示','統計は並べ替える'],prompt:'√7の整数部分をa、小数部分をbとするとき、aを求めなさい。',answer:'2',explanation:'2<√7<3なので整数部分は2。'},
  {id:'2023-Q2',year:2023,major:2,target:'70',pastPattern:'放物線・直線・座標・面積比',scorePlan:'係数決定を必ず取る',steps:['通る点を代入','交点を連立','面積比は共通部分を消す'],prompt:'放物線y=ax²が点(2,8)を通るときaを求めなさい。',answer:'2',explanation:'8=4aよりa=2。'},
  {id:'2023-Q3',year:2023,major:3,target:'70',pastPattern:'表を読む初見文章題・2〜3変数の数量関係',scorePlan:'表の1行を方程式にする',steps:['単位を確認','既知の行で規則発見','未知の行へ適用'],prompt:'りんご2個とみかん3個で700円、りんご1個が200円です。みかん1個はいくらですか。',answer:'100',explanation:'700-400=300円。300÷3=100円。'},
  {id:'2023-Q4',year:2023,major:4,target:'70',pastPattern:'四角形の成立条件・根号を含む長さ・辺の関係',scorePlan:'定義と十分条件を区別',steps:['図形の定義確認','対角線の性質','必要な条件だけ選ぶ'],prompt:'平行四辺形の対角線は互いにどうなりますか。',answer:'二等分',acceptedAnswers:['互いに二等分する'],explanation:'平行四辺形の対角線は互いの中点で交わる。'},
  {id:'2023-Q5',year:2023,major:5,target:'70',pastPattern:'確率・場合の数を段階的に絞る',scorePlan:'全体数を最初に固定',steps:['全事象を数える','条件別に場合分け','重複を確認'],prompt:'1〜4のカードから2枚を同時に選ぶ方法は何通りですか。',answer:'6',explanation:'4C2=6通り。'},

  {id:'2024-Q1',year:2024,major:1,target:'60',pastPattern:'8問の小問集合：計算・三角柱・反比例・統計・角度・円',scorePlan:'図形小問も公式で即答',steps:['公式を先に書く','与条件を代入','単位を確認'],prompt:'底面が3cm,4cm,5cmの直角三角形、高さ10cmの三角柱の体積を求めなさい。',answer:'60',explanation:'底面積=3×4÷2=6。6×10=60cm³。'},
  {id:'2024-Q2',year:2024,major:2,target:'60',pastPattern:'2つの放物線・直線・等面積条件',scorePlan:'（1）（2）を確実に取る',steps:['係数を代入で決定','交点を連立','等面積は共通底辺を使う'],prompt:'放物線y=ax²が点(-2,4)を通るときaを求めなさい。',answer:'1',explanation:'4=4aよりa=1。'},
  {id:'2024-Q3',year:2024,major:3,target:'60',pastPattern:'1〜5のカードを戻さず引く確率',scorePlan:'順序あり/なしを見分ける',steps:['全体5×4','条件に合う順序対','約分'],prompt:'1〜5のカードを2枚順に引くとき、2枚目が1枚目より大きい確率を求めなさい。',answer:'1/2',explanation:'同じ数は出ず、大小は対称なので1/2。'},
  {id:'2024-Q4',year:2024,major:4,target:'70',pastPattern:'長方形周上の2点の動点・追いつき・面積',scorePlan:'位置を時間tで表す',steps:['各点の進む距離','辺のどこにいるか','面積式を区間別に'],prompt:'同じ点から同方向へ毎秒3cmと毎秒5cmで進む2点の距離が10cmになるのは何秒後ですか。',answer:'5',explanation:'相対速度は2cm/秒。10÷2=5秒。'},
  {id:'2024-Q5',year:2024,major:5,target:'70',pastPattern:'正方形・角度追跡・相似・交点の面積比',scorePlan:'平行線の角から始める',steps:['等しい角に印','相似を確定','辺比→面積比'],prompt:'相似な三角形の面積比が9:16です。対応する辺の比を答えなさい。',answer:'3:4',explanation:'辺の比は面積比の平方根で3:4。'},

  {id:'2025-Q1',year:2025,major:1,target:'60',pastPattern:'8問の小問集合：計算・因数分解・方程式・統計・相似・確率・整数',scorePlan:'標準計算を40点の土台に',steps:['符号を確認','因数分解で検算','整数条件は積に直す'],prompt:'x²-9x+20を因数分解しなさい。',answer:'(x-4)(x-5)',acceptedAnswers:['(x-5)(x-4)'],explanation:'積20、和-9となる-4,-5を使う。'},
  {id:'2025-Q2',year:2025,major:2,target:'70',pastPattern:'放物線・直線・四角形の面積二等分',scorePlan:'座標を出して面積公式へ',steps:['係数決定','切片を求める','全体面積の半分'],prompt:'点(0,3)と(2,7)を通る直線の傾きを求めなさい。',answer:'2',explanation:'(7-3)÷(2-0)=2。'},
  {id:'2025-Q3',year:2025,major:3,target:'60',pastPattern:'表面を塗った立方体の分割と確率',scorePlan:'角・辺・面・内部に分類',steps:['小立方体総数n³','塗られた面数で分類','個数/全体で確率'],prompt:'大立方体を3×3×3に分けます。小立方体は全部で何個ですか。',answer:'27',explanation:'3³=27個。'},
  {id:'2025-Q4',year:2025,major:4,target:'70',pastPattern:'食塩水の置換操作を複数回',scorePlan:'食塩量だけを追う',steps:['初めの食塩量','捨てる割合だけ減らす','加える溶液の食塩を足す'],prompt:'10%の食塩水200gから50g捨て、水50gを加えました。食塩は何g残りますか。',answer:'15',explanation:'初め20g。全体の1/4を捨てるので20×3/4=15g。'},
  {id:'2025-Q5',year:2025,major:5,target:'70',pastPattern:'円に内接する台形・相似・面積二等分',scorePlan:'平行線から相似を作る',steps:['円周角をそろえる','平行線で相似','面積条件を辺比へ'],prompt:'台形の上底4cm、下底8cm、高さ5cmです。面積を求めなさい。',answer:'30',explanation:'(4+8)×5÷2=30cm²。'},

  {id:'2026-Q1',year:2026,major:1,target:'60',pastPattern:'8問の小問集合：方程式・比例・座標・文字式・整数・因数分解・規則性・食塩水',scorePlan:'40点中35点を目標',steps:['短い問題から解く','文章題は未知数を置く','最後に単位・約分'],prompt:'合同な正六角形を1辺ずつ共有して10個一列に並べます。辺の総数を求めなさい。',answer:'51',explanation:'最初6辺、追加1個ごとに共有辺を除き5辺増える。6+5×9=51。'},
  {id:'2026-Q2',year:2026,major:2,target:'60',pastPattern:'2つの数で割って同じ余りになる整数',scorePlan:'M-zを公倍数に変える',steps:['M-zはx,yの倍数','最小公倍数を使う','範囲条件で列挙'],prompt:'Mを6で割っても8で割っても3余ります。2桁で最小のMを求めなさい。',answer:'27',explanation:'M-3は6と8の公倍数。最小公倍数24よりM=27。'},
  {id:'2026-Q3',year:2026,major:3,target:'70',pastPattern:'1〜8のカードを戻さず引き倍数関係を調べる',scorePlan:'順序対を列挙して確実に取る',steps:['全体8×7','Aごとに倍数を列挙','重複なしで数える'],prompt:'1〜4のカードから2枚を順に引きます。2枚目が1枚目の倍数となる確率を求めなさい。',answer:'1/4',explanation:'全12通り中(1,2),(1,3),(1,4)の3通り。3/12=1/4。'},
  {id:'2026-Q4',year:2026,major:4,target:'70',pastPattern:'放物線・直線・動点・直径の円',scorePlan:'（1）（2）を先に確保',steps:['交点の解の関係','面積をtで式化','直角条件は傾きの積-1'],prompt:'直線y=3x+1に垂直な直線の傾きを求めなさい。',answer:'-1/3',explanation:'垂直な2直線の傾きの積は-1なので-1/3。'},
  {id:'2026-Q5',year:2026,major:5,target:'70',pastPattern:'円周角・平行線・相似をつないで長さを求める',scorePlan:'角度→相似→長さの順',steps:['同じ弧の円周角','平行線の錯角','相似比で長さ'],prompt:'相似な三角形で、小さい方の辺3cmに大きい方の辺6cmが対応します。小さい方の別の辺5cmに対応する長さを求めなさい。',answer:'10',explanation:'相似比は1:2。5×2=10cm。'}
]
