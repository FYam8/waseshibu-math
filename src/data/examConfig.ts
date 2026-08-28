export const years=[2024,2019,2020,2021,2022,2023,2025,2026]

export const examPages:Record<number,number[][]>={
  2019:[[4,5],[6],[7],[8],[9]], 2020:[[4],[5],[6],[7],[8]],
  2021:[[5],[6],[7],[8],[9]], 2022:[[4,5],[6],[7],[8],[9]],
  2023:[[4,5],[6],[7],[8],[9,10]], 2024:[[4,5],[6],[7],[8],[9]],
  2025:[[4,5],[6],[7],[8],[9]], 2026:[[4,5],[6],[7],[8],[9]]
}

export const answerPages:Record<number,number>={2019:2,2020:2,2021:1,2022:1,2023:1,2024:1,2025:1,2026:1}

export function examRole(year:number){
  if(year===2024)return '診断テスト'
  if(year===2025)return '改善確認テスト'
  if(year===2026)return '仕上がり確認'
  return '弱点補強・全年度演習'
}

export function pointsFor(year:number,major:number,subCount:number){
  const majorPoints=year===2019?(major===1?45:major===2?10:15):(major===1?40:15)
  return majorPoints/subCount
}
