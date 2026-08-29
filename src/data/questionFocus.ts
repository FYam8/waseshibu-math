import { examPages } from './examConfig'

export type FocusSlice={page:number;top:number;height:number;role:'common'|'current'}

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))

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

export function focusSlicesFor(year:number,major:number,subIndex:number,subCount:number):FocusSlice[]{
  const pages=examPages[year]?.[major-1]||[]
  if(!pages.length)return []
  const safeCount=Math.max(1,subCount),safeIndex=clamp(subIndex,0,safeCount-1)
  if(safeCount===1)return [{page:pages[0],top:4,height:92,role:'current'}]

  const counts=pageDistribution(safeCount,pages.length),assigned=assignedPage(safeIndex,counts)
  const page=pages[assigned.pageIndex]

  if(major===1){
    const start=8,usable=88,slot=usable/Math.max(1,assigned.count)
    return [{page,top:clamp(start+slot*assigned.localIndex-1,0,94),height:clamp(slot+2.5,8,30),role:'current'}]
  }

  const result:FocusSlice[]=[]
  const commonPage=pages[0]
  result.push({page:commonPage,top:5,height:46,role:'common'})

  const questionStart=assigned.pageIndex===0?51:7
  const questionUsable=assigned.pageIndex===0?45:89
  const slot=questionUsable/Math.max(1,assigned.count)
  result.push({page,top:clamp(questionStart+slot*assigned.localIndex-1.5,0,94),height:clamp(slot+3,10,38),role:'current'})
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
