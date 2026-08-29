import { examPages } from '../data/examConfig'
import { focusSlicesFor, isSharedFocusTask } from '../data/questionFocus'

const BASE=import.meta.env.BASE_URL
const pad=(n:number)=>String(n).padStart(2,'0')
const paperImage=(year:number,page:number)=>`${BASE}exam-pages/${year}/page-${pad(page)}.jpg`

type Props={year:number;major:number;subIndex:number;subCount:number;subNo:string;topic?:string}

function Slice({year,major,subNo,slice}:{year:number;major:number;subNo:string;slice:ReturnType<typeof focusSlicesFor>[number]}){
  return <figure className={`focus-slice ${slice.role}`} style={{aspectRatio:`1 / ${1.414*slice.height/100}`}}>
    <img src={paperImage(year,slice.page)} alt={slice.role==='common'?`${year}年度 大問${major} 共通条件・図`:`${year}年度 大問${major}（${subNo}）`} style={{transform:`translateY(-${slice.top}%)`}} />
    <figcaption>{slice.role==='common'?'この小問に必要な共通条件・図':'今取り組む小問'}</figcaption>
  </figure>
}

export default function FocusedQuestionView({year,major,subIndex,subCount,subNo,topic}:Props){
  const slices=focusSlicesFor(year,major,subIndex,subCount,subNo),current=slices.filter(x=>x.role==='current'),common=slices.filter(x=>x.role==='common')
  const fallbackPages=examPages[year]?.[major-1]||[],shared=isSharedFocusTask(year,major,subNo)
  if(!current.length)return <div className="notice-box">この小問の確認済み表示領域がありません。問題冊子の原本を確認してください。</div>
  return <div className="focused-question" aria-label={`${year}年度 大問${major}（${subNo}）`}>
    <div className="focused-question-label"><b>大問{major}（{subNo}）</b>{topic&&<span>{topic}</span>}<em>全年度・位置確認済み</em></div>
    {shared&&<div className="shared-task-note"><b>この問題は共通文章型です</b><span>原本では a・b・c の答えを同じ文章・図から求める形式のため、必要な共通問題部分をまとめて表示しています。</span></div>}
    {!!common.length&&<div className="focus-common-block"><span className="focus-block-label">まずここを読む</span>{common.map((slice,i)=><Slice key={`common-${slice.page}-${i}`} year={year} major={major} subNo={subNo} slice={slice}/>)}</div>}
    <div className="focus-current-block"><span className="focus-block-label">この小問だけ解く</span>{current.map((slice,i)=><Slice key={`current-${slice.page}-${i}`} year={year} major={major} subNo={subNo} slice={slice}/>)}</div>
    <details className="page-fallback"><summary>原本ページ全体を確認する</summary><p>切り抜きで図や条件が足りないと感じた場合だけ開いてください。原本なので、同じページの別小問が見えることがあります。</p><div className="fallback-pages">{fallbackPages.map(page=><img key={page} src={paperImage(year,page)} alt={`${year}年度 大問${major} 問題ページ${page}`}/>)}</div></details>
    <p className="focus-note">通常表示では、この小問に必要な条件と対象小問だけを表示しています。別の小問・別の正答は表示しません。</p>
  </div>
}
