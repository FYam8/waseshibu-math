export const WORD_PROBLEM_MODELING_HINT='【登場する量】問題に出る量を列挙する。【一定の量】問題中で変わらない量を特定する。【変化する量】増減する量を特定する。【ルール】量どうしの関係を言葉で表す。【何を文字で置くか】未知の量を文字で置く。【求めるもの】最後に答える量を確かめる。ここまで整理してから式にしましょう。'

const GENERIC_MODELING_HINT='条件と求めるものを分け、対応する公式・性質を1つずつ確認しましょう。'

export function modelingHintForField(fieldId:string){
  return fieldId==='word-problems'?WORD_PROBLEM_MODELING_HINT:GENERIC_MODELING_HINT
}

export function modelingHintForTopic(topic:string){
  return /文章題|数量関係|文字を含む式\/方程式|割合|食塩|濃度|売買|収支|単価|貯水|手数料|水位|料金|移動|速さ|追いつき/.test(topic)
    ?WORD_PROBLEM_MODELING_HINT
    :GENERIC_MODELING_HINT
}
