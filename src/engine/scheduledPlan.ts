import type { CanonicalScheduledTaskPlan } from './learnerState'

/** Candidate only: explicit evidence replaces inference from disappearing UI tasks. */
export type ScheduledCompletionEvidence = {taskId:string;recordId:string}
function validate(plan:CanonicalScheduledTaskPlan){
  const ids=[...plan.pendingTaskIds,...plan.completedTaskIds]
  if(!plan.date||!plan.targetId||ids.some(id=>!id)||new Set(ids).size!==ids.length)throw new Error('REVIEW_REQUIRED: invalid or overlapping scheduled task identities')
  // Legacy fallback snapshots require a school-owned identity mapping before writes.
  if(plan.fallbackTask)throw new Error('REVIEW_REQUIRED: fallback task mapping is not proven')
}
export function createCanonicalScheduledPlan(input:{planKind:CanonicalScheduledTaskPlan['planKind'];date:string;targetId:string;orderedTaskIds:readonly string[];limit:number}):CanonicalScheduledTaskPlan{
  if(!Number.isInteger(input.limit)||input.limit<1)throw new Error('invalid task limit')
  if(input.orderedTaskIds.some(id=>!id)||new Set(input.orderedTaskIds).size!==input.orderedTaskIds.length)throw new Error('duplicate or empty candidate identity')
  const plan:CanonicalScheduledTaskPlan={planKind:input.planKind,date:input.date,targetId:input.targetId,pendingTaskIds:input.orderedTaskIds.slice(0,input.limit),completedTaskIds:[]}
  validate(plan);return plan
}
export function reconcileCanonicalScheduledPlan(plan:CanonicalScheduledTaskPlan,input:{availableTaskIds:readonly string[];completionEvidence:readonly ScheduledCompletionEvidence[]}){
  validate(plan)
  const assigned=new Set([...plan.pendingTaskIds,...plan.completedTaskIds]),done=new Set(plan.completedTaskIds)
  for(const evidence of input.completionEvidence){
    if(!evidence.recordId||!assigned.has(evidence.taskId))throw new Error('REVIEW_REQUIRED: completion evidence is missing or unrelated')
    done.add(evidence.taskId)
  }
  const next=structuredClone(plan)
  next.completedTaskIds=[...plan.completedTaskIds,...plan.pendingTaskIds.filter(id=>done.has(id))]
  next.pendingTaskIds=plan.pendingTaskIds.filter(id=>!done.has(id))
  const available=new Set(input.availableTaskIds)
  return {plan:next,visibleTaskIds:next.pendingTaskIds.filter(id=>available.has(id)),unresolvedTaskIds:next.pendingTaskIds.filter(id=>!available.has(id)),complete:next.pendingTaskIds.length===0&&next.completedTaskIds.length>0}
}
/** School adapter supplies its local date. Never reset completed tasks on promotion. */
export function promoteCanonicalStudyAhead(plan:CanonicalScheduledTaskPlan,date:string,current:CanonicalScheduledTaskPlan|null):CanonicalScheduledTaskPlan{
  validate(plan)
  if(plan.planKind!=='study-ahead'||plan.date!==date)throw new Error('study-ahead date or kind mismatch')
  if(current)throw new Error('REVIEW_REQUIRED: existing daily plan must not be overwritten')
  return {...structuredClone(plan),planKind:'today-required'}
}
