import { questionFocusFor, questionFocusManifest, type FocusRect } from './questionFocusManifest'

export type FocusSlice=FocusRect&{role:'common'|'current'}

export function focusSlicesFor(year:number,major:number,subIndex:number,subCount:number,subNo?:string):FocusSlice[]{
  void subIndex
  void subCount
  if(!subNo)return []
  const entry=questionFocusFor(`${year}-Q${major}-${subNo}`)
  if(!entry)return []
  return [
    ...entry.common.map(slice=>({...slice,role:'common' as const})),
    ...entry.current.map(slice=>({...slice,role:'current' as const}))
  ]
}

export function focusCoverageOk(questionIds:string[]){
  return questionIds.every(id=>{
    const entry=questionFocusFor(id)
    if(!entry||entry.current.length===0)return false
    return [...entry.common,...entry.current].every(slice=>slice.top>=0&&slice.height>0&&slice.top+slice.height<=100)
  })
}

export function hasExactFocusOverride(year:number,major:number,subNo:string){
  return !!questionFocusFor(`${year}-Q${major}-${subNo}`)
}

export function isSharedFocusTask(year:number,major:number,subNo:string){
  return !!questionFocusFor(`${year}-Q${major}-${subNo}`)?.sharedTask
}

export { questionFocusFor, questionFocusManifest }
