import { requiredPracticeCount } from './practiceLoad'

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
      const completed=[...new Set(Array.isArray(session.completedQuestionIds)?session.completedQuestionIds.map(String):Array.isArray(session.currentStreakQuestionIds)?session.currentStreakQuestionIds.map(String):[])]
      const triggerSourceQuestionId=typeof session.triggerSourceQuestionId==='string'?session.triggerSourceQuestionId:null
      const fieldIdAtSessionStart=typeof session.fieldIdAtSessionStart==='string'?session.fieldIdAtSessionStart:''
      return [{
        triggerSourceQuestionId,
        sourceAttemptAt:typeof session.sourceAttemptAt==='string'?session.sourceAttemptAt:undefined,
        // 旧セッションも、実際に開いたときと同じ負荷判定で表示する。
        requiredCount:Math.max(1,Math.min(4,Number(session.requiredCount)||requiredPracticeCount(triggerSourceQuestionId,fieldIdAtSessionStart))),
        completedQuestionIds:completed,
        status:session.status==='completed'?'completed':'active',
        updatedAt:typeof session.updatedAt==='string'?session.updatedAt:new Date(0).toISOString()
      }]
    })
  }catch{return []}
}
