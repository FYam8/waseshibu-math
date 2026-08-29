import { focusSlicesFor, hasExactFocusOverride } from '../data/questionFocus'

const BASE=import.meta.env.BASE_URL
const pad=(n:number)=>String(n).padStart(2,'0')
const paperImage=(year:number,page:number)=>`${BASE}exam-pages/${year}/page-${pad(page)}.jpg`

type Props={year:number;major:number;subIndex:number;subCount:number;subNo:string;topic?:string}

function Slice({year,major,subNo,slice}:{year:number;major:number;subNo:string;slice:ReturnType<typeof focusSlicesFor>[number]}){
  return <figure className={`focus-slice ${slice.role}`} style={{aspectRatio:`1 / ${1.414*slice.height/100}`}}>
    <img src={paperImage(year,slice.page)} alt={slice.role==='common'?`${year}年度 大問${major} 共通条件・図`:`${year}年度 大問${major}（${subNo}）`} style={{transform:`translateY(-${slice.top}%)`}} />
    <figcaption>{slice.role==='common'?'共通条件・図':'今取り組む小問'}</figcaption>
  </figure>
}

export default function FocusedQuestionView({year,major,subIndex,subCount,subNo,topic}:Props){
  const slices=focusSlicesFor(year,major,subIndex,subCount,subNo),current=slices.filter(x=>x.role==='current'),common=slices.filter(x=>x.role==='common')
  const pages=[...new Set(slices.map(x=>x.page))],exact=hasExactFocusOverride(year,major,subNo)
  if(!current.length)return <div className="notice-box">問題画像を表示できません。元の過去問ページから確認してください。</div>
  return <div className="focused-question" aria-label={`${year}年度 大問${major}（${subNo}）`}>
    <div className="focused-question-label"><b>大問{major}（{subNo}）</b>{topic&&<span>{topic}</span>}{exact&&<em>表示位置確認済み</em>}</div>
    {current.map((slice,i)=><Slice key={`current-${slice.page}-${i}`} year={year} major={major} subNo={subNo} slice={slice}/>)}
    {!!common.length&&<details className="common-context"><summary>共通の図・条件が必要なら開く</summary><p>この部分には大問共通の情報が含まれるため、必要なときだけ表示します。</p>{common.map((slice,i)=><Slice key={`common-${slice.page}-${i}`} year={year} major={major} subNo={subNo} slice={slice}/>)}</details>}
    <details className="page-fallback"><summary>問題が切れている・見えない場合はページを広げて確認</summary><p>切り抜き位置が合わない場合だけ使ってください。ここを開くと同じページの他の小問も見えることがあります。</p><div className="fallback-pages">{pages.map(page=><img key={page} src={paperImage(year,page)} alt={`${year}年度 大問${major} 問題ページ${page}`}/>)}</div></details>
    <p className="focus-note">初期表示は現在の小問だけです。ほかの小問・ほかの正答は表示しません。</p>
  </div>
}
