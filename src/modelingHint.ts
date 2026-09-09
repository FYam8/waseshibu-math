export const WORD_PROBLEM_MODELING_HINT='【登場する量】問題に出る量を列挙する。【一定の量】問題中で変わらない量を特定する。【変化する量】増減する量を特定する。【ルール】量どうしの関係を言葉で表す。【何を文字で置くか】未知の量を文字で置く。【求めるもの】最後に答える量を確かめる。ここまで整理してから式にしましょう。'

export const PROBABILITY_COUNTING_HINT='【全体の場合の数】まず全体を数える。【順序を区別するか】並ぶ順番を別の場合として数えるか決める。【重複があるか】同じ場合を二重に数えていないか確かめる。【条件を満たす場合】条件に合うものだけを数える。【必要な場合分け】漏れなく重ならない分け方を決める。ここまで確認してから計算しましょう。'

const GENERIC_MODELING_HINT='条件と求めるものを分け、対応する公式・性質を1つずつ確認しましょう。'
const WORD_PROBLEM_TOPIC_PATTERN=/文章題|数量関係|文字を含む式\/方程式|割合|食塩|濃度|売買|収支|単価|貯水|手数料|水位|料金|歩行距離|飲水量|1kmあたり|移動|速さ|追いつき/
const PROBABILITY_COUNTING_TOPIC_PATTERN=/確率|場合の数|数え上げ|順序|重複|コイン|硬貨|サイコロ|カード|スイッチ/
const NON_WORD_PROBLEM_TOPIC_PATTERN=/二次関数の変化の割合|座標の(?:対称|平行)移動/

export type ModelingHintKind='word-problem'|'probability-counting'|'generic'

export function modelingHintKindForField(fieldId:string):ModelingHintKind{
  if(fieldId==='word-problems')return 'word-problem'
  if(fieldId==='probability'||fieldId==='counting')return 'probability-counting'
  return 'generic'
}

export function modelingHintKindForTopic(topic:string):ModelingHintKind{
  if(PROBABILITY_COUNTING_TOPIC_PATTERN.test(topic))return 'probability-counting'
  if(NON_WORD_PROBLEM_TOPIC_PATTERN.test(topic))return 'generic'
  if(WORD_PROBLEM_TOPIC_PATTERN.test(topic))return 'word-problem'
  return 'generic'
}

export function modelingHintForField(fieldId:string){
  const kind=modelingHintKindForField(fieldId)
  return kind==='word-problem'?WORD_PROBLEM_MODELING_HINT:kind==='probability-counting'?PROBABILITY_COUNTING_HINT:GENERIC_MODELING_HINT
}

export function modelingHintForTopic(topic:string){
  const kind=modelingHintKindForTopic(topic)
  return kind==='word-problem'?WORD_PROBLEM_MODELING_HINT:kind==='probability-counting'?PROBABILITY_COUNTING_HINT:GENERIC_MODELING_HINT
}
