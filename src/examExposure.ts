import core from './data/level2/level2_master_2019_2026.json'

const sourceYearById=new Map(core.map(q=>[q.id,q.sourceYear]))
// Related practice is conservative exposure evidence, even when its numbers differ.
// Reservations alone are not evidence that a problem has been displayed.
export function hasLevel2YearExposure(year:number,storage:Pick<Storage,'getItem'>=localStorage){
  try{
    const raw=JSON.parse(storage.getItem('waseshibu-math-level2-history-v1')||'null')
    const ids=new Set<string>()
    const add=(id:unknown)=>{if(typeof id==='string')ids.add(id)}
    for(const attempt of Array.isArray(raw?.attempts)?raw.attempts:[])add(attempt?.questionId)
    for(const [id,stats] of Object.entries(raw?.questionStats||{}))if(Number((stats as {attemptCount?:number})?.attemptCount)>0)add(id)
    for(const session of Object.values(raw?.sessions||{}) as Array<Record<string,unknown>>){
      if(!session||typeof session!=='object')continue
      add(session.lastQuestionId)
      for(const key of ['lastPresentedIds','completedQuestionIds','currentStreakQuestionIds'])if(Array.isArray(session[key]))for(const id of session[key])add(id)
      add((session.pendingAssistance as {questionId?:string}|null)?.questionId)
    }
    return [...ids].some(id=>sourceYearById.get(id)===year||id.startsWith(`${year}-Q`))
  }catch{return false}
}

export function inferFirstLookEligible(hasPriorCompleted:boolean,draft:Record<string,unknown>,untouched:boolean,relatedStudyExposure=false){
  if(hasPriorCompleted||relatedStudyExposure)return false
  // Old drafts have no provenance: retain answers, but do not invent first-look status.
  if(Object.keys(draft).length)return draft.firstLookEligible===true
  return untouched
}
