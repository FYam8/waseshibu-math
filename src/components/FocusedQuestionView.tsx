import { focusSlicesFor } from '../data/questionFocus'

const BASE=import.meta.env.BASE_URL
const pad=(n:number)=>String(n).padStart(2,'0')
const paperImage=(year:number,page:number)=>`${BASE}exam-pages/${year}/page-${pad(page)}.jpg`

type Props={year:number;major:number;subIndex:number;subCount:number;subNo:string;topic?:string}

export default function FocusedQuestionView({year,major,subIndex,subCount,subNo,topic}:Props){
  const slices=focusSlicesFor(year,major,subIndex,subCount)
  if(!slices.length)return <div className="notice-box">問題画像を表示できません。元の過去問ページから確認してください。</div>
  return <div className="focused-question" aria-label={`${year}年度 大問${major}（${subNo}）`}>
    <div className="focused-question-label"><b>大問{major}（{subNo}）</b>{topic&&<span>{topic}</span>}</div>
    {slices.map((slice,i)=><figure className={`focus-slice ${slice.role}`} style={{aspectRatio:`1 / ${1.414*slice.height/100}`}} key={`${slice.page}-${slice.role}-${i}`}>
      <img src={paperImage(year,slice.page)} alt={slice.role==='common'?`${year}年度 大問${major} 共通条件・図`:`${year}年度 大問${major}（${subNo}）`} style={{transform:`translateY(-${slice.top}%)`}} />
      <figcaption>{slice.role==='common'?'共通条件・図':'今取り組む小問'}</figcaption>
    </figure>)}
    <p className="focus-note">他の小問は隠しています。必要な共通条件・図だけを残して表示しています。</p>
  </div>
}
