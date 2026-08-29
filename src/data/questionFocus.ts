import { examPages } from './examConfig'

export type FocusSlice={page:number;top:number;height:number;role:'common'|'current'}

type FocusOverride={common?:FocusSlice[];current:FocusSlice[]}

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))

/*
 * 小問位置は問題冊子のレイアウトで均等ではありません。
 * 位置確認済みの問題はここで小問ごとに指定し、均等配分の推定を上書きします。
 */
const FOCUS_OVERRIDES:Record<string,FocusOverride>={
  '2024-Q2-1':{
    common:[{page:6,top:5,height:20,role:'common'}],
    current:[{page:6,top:23,height:9,role:'current'}]
  },
  '2024-Q2-2':{
    common:[{page:6,top:5,height:25,role:'common'}],
    current:[{page:6,top:29,height:9,role:'current'}]
  },
  '2024-Q2-3':{
    common:[{page:6,top:5,height:31,role:'common'}],
    current:[{page:6,top:35,height:18,role:'current'}]
  }
}

function pageDistribution(total:number,pageCount:number){
  const base=Math.floor(total/pageCount),extra=total%pageCount
  return Array.from({length:pageCount},(_,i)=>base+(i<extra?1:0))
}

function assignedPage(index:number,counts:number[]){
  let start=0
  for(let pageIndex=0;pageIndex<counts.length;pageIndex++){
    const count=counts[pageIndex]
    if(index<start+count)return {pageIndex,localIndex:index-start,count}
    start+=count
  }
  return {pageIndex:Math.max(0,counts.length-1),localIndex:0,count:Math.max(1,counts.at(-1)||1)}
}

export function focusSlicesFor(year:number,major:number,subIndex:number,subCount:number,subNo?:string):FocusSlice[]{
  const override=subNo?FOCUS_OVERRIDES[`${year}-Q${major}-${subNo}`]:undefined
  if(override)return [...(override.common||[]),...override.current]

  const pages=examPages[year]?.[major-1]||[]
  if(!pages.length)return []
  const safeCount=Math.max(1,subCount),safeIndex=clamp(subIndex,0,safeCount-1)
  if(safeCount===1)return [{page:pages[0],top:3,height:88,role:'current'}]

  const counts=pageDistribution(safeCount,pages.length),assigned=assignedPage(safeIndex,counts)
  const page=pages[assigned.pageIndex]

  if(major===1){
    const start=6,usable=88,slot=usable/Math.max(1,assigned.count)
    return [{page,top:clamp(start+slot*assigned.localIndex-1,0,94),height:clamp(slot+3,9,30),role:'current'}]
  }

  /*
   * 大問2〜5は、共通条件と小問がページ上半分〜中段に集中する年度が多い。
   * 以前の「51%から小問開始」は下余白を切り抜くケースがあったため、
   * 推定範囲を上へ寄せ、多少広めに取る。位置確認済み問題は上のoverrideを使う。
   */
  const result:FocusSlice[]=[]
  const commonPage=pages[0]
  result.push({page:commonPage,top:4,height:30,role:'common'})

  const questionStart=assigned.pageIndex===0?25:6
  const questionUsable=assigned.pageIndex===0?62:86
  const slot=questionUsable/Math.max(1,assigned.count)
  result.push({
    page,
    top:clamp(questionStart+slot*assigned.localIndex-2,0,92),
    height:clamp(slot*.72+5,12,34),
    role:'current'
  })
  return result
}

export function focusCoverageOk(year:number,major:number,subCount:number){
  if(subCount<1)return false
  for(let i=0;i<subCount;i++){
    const slices=focusSlicesFor(year,major,i,subCount)
    if(!slices.some(x=>x.role==='current'))return false
    if(slices.some(x=>x.top<0||x.height<=0||x.top+x.height>103))return false
  }
  return true
}

export function hasExactFocusOverride(year:number,major:number,subNo:string){
  return !!FOCUS_OVERRIDES[`${year}-Q${major}-${subNo}`]
}
