import type { Grade } from '../types'

type Props={
  kind:'past-paper'|'original'
  grade:Grade
  year?:number
  major?:number
  subNo?:string
  label?:string
  compact?:boolean
}

const gradeMeaning:Record<Grade,string>={
  A:'60点目標で優先',
  B:'70点目標で追加',
  C:'75点目標で選択'
}

export default function QuestionProvenance({kind,grade,year,major,subNo,label,compact=false}:Props){
  const location=year?([year+'年度',major?('大問'+major):'',subNo?('（'+subNo+'）'):''].filter(Boolean).join(' ')):''
  const origin=kind==='past-paper'?'過去問':label||'オリジナル類題'
  const description=kind==='past-paper'
    ? location
    : location?('基準：'+location+'の過去問'):'2019〜2026年度の過去問分析をもとに作成'
  return <div className={`question-provenance ${kind} ${compact?'compact':''}`}>
    <strong>{origin}</strong>
    <span>{description}</span>
    <em className={`grade-${grade}`}>問題ランク {grade}</em>
    {!compact&&<small>{gradeMeaning[grade]}</small>}
  </div>
}
