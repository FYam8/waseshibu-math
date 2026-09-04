// 類題数は元問題の標準的な作業量に合わせる。開始後はSessionへ保存し、
// 途中の公開更新で必要数が変わらないようにする。
export function requiredPracticeCount(sourceQuestionId:string|null,fieldId:string){
  const major=sourceQuestionId?.match(/^\d{4}-Q(\d+)-/)?.[1]
  if(major==='1')return 4
  if(major==='2'||major==='3')return 3
  if(major==='4'||major==='5')return 2
  if(['quadratic-functions','coordinates','plane-geometry','angles-circles','similarity','solids'].includes(fieldId))return 2
  if(['expressions','factoring','linear-equations','simultaneous-equations','quadratic-equations','square-roots'].includes(fieldId))return 4
  return 3
}
