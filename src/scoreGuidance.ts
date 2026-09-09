import type { ExamScore } from './types'

export type ScoreStabilityAssessment={
  kind:'insufficient'|'seventy-to-seventy-five'|'other'
  scores:number[]
  low?:number
  high?:number
  spread?:number
  stretchGoalNote:string
  checks:string[]
  dataLimitNote:string
}

const checks=[
  '安定性：別年度でも70〜75点帯を再現できるか',
  '大問1：計算・符号・読み落とし・答案形式の優先失点を残していないか',
  '時間配分：C問題を深追いせず、A・Bの回収と見直し時間を残せたか',
  '本番再現：制限時間・問題冊子・答案形式を本番条件にそろえたか',
  '3教科配分：数学の追加点と、国語・英語へ同じ時間を使う効果を比較したか'
]

export function assessScoreStability(scores:ExamScore[]):ScoreStabilityAssessment{
  const recent=scores
    .filter(item=>item.completed!==false&&item.year>=2022&&item.year<=2026)
    .sort((a,b)=>b.at.localeCompare(a.at))
    .slice(0,4)
  const chronological=[...recent].reverse().map(item=>item.score)
  const base={
    scores:chronological,
    stretchGoalNote:'90点などさらに上を目指す場合も、難問を増やす前に次の確認を優先します。',
    checks:[...checks],
    dataLimitNote:'これらは得点履歴だけでは判定できません。大問1の失点原因・問題別時間・本番条件は、小問別採点と実施条件も確認してください。'
  }
  if(recent.length<4)return {kind:'insufficient',...base}
  const low=Math.min(...chronological),high=Math.max(...chronological),spread=high-low
  return {
    kind:low>=70&&high<=75?'seventy-to-seventy-five':'other',
    low,high,spread,
    ...base
  }
}
