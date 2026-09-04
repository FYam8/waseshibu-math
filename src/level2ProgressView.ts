export type Level2SessionSummary={
  triggerSourceQuestionId:string|null
  sourceAttemptAt?:string
  requiredCount:number
  completedQuestionIds:string[]
  status:'active'|'completed'
  updatedAt:string
}

export function loadLevel2SessionSummaries(storage:Pick<Storage,'getItem'>=localStorage):Level2SessionSummary[]{
  try{
    const raw=JSON.parse(storage.getItem('waseshibu-math-level2-history-v1')||'null')
    if(!raw?.sessions||typeof raw.sessions!=='object')return []
    return Object.values(raw.sessions).flatMap(value=>{
      if(!value||typeof value!=='object')return []
      const session=value as Record<string,unknown>
      const completed=Array.isArray(session.completedQuestionIds)?session.completedQuestionIds.map(String):Array.isArray(session.currentStreakQuestionIds)?session.currentStreakQuestionIds.map(String):[]
      return [{
        triggerSourceQuestionId:typeof session.triggerSourceQuestionId==='string'?session.triggerSourceQuestionId:null,
        sourceAttemptAt:typeof session.sourceAttemptAt==='string'?session.sourceAttemptAt:undefined,
        requiredCount:Math.max(1,Math.min(4,Number(session.requiredCount)||4)),
        completedQuestionIds:completed,
        status:session.status==='completed'?'completed':'active',
        updatedAt:typeof session.updatedAt==='string'?session.updatedAt:new Date(0).toISOString()
      }]
    })
  }catch{return []}
}
