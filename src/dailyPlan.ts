import questions from './data/questions.json'
import type { MajorQuestion } from './types'
import { classifyRemediationField } from './data/remediation'
import { loadAttempts, loadExamScores, loadPreferences } from './storage'
import { loadGuidedProgressState } from './guidedReview'
import { gradeInTarget, type TargetScore } from './targetStrategy'
import { isMainCheckYear } from './learningRoute'

export type TodayTaskKind='review'|'practice'|'past-paper'
export type TodayTask={
  id:string
  kind:TodayTaskKind
  title:string
  detail:string
  to:string
  priority:number
  questionId?:string
  grade?:'A'|'B'|'C'
}

const majors=questions.questions as MajorQuestion[]
const questionMap=new Map<string,{id:string;year:number;major:number;subNo:string;topic:string;grade:'A'|'B'|'C'}>(majors.flatMap(major=>major.subquestions.map(sub=>[
  `${major.id}-${sub.no}`,
  {id:`${major.id}-${sub.no}`,year:major.year,major:major.major,subNo:sub.no,topic:sub.topic,grade:sub.grade}
] as const)))

const priorityByGrade=(target:TargetScore,grade:'A'|'B'|'C')=>{
  if(grade==='A')return 100
  if(grade==='B')return target>=70?75:20
  return target>=75?45:5
}

const localDateKey=(d=new Date())=>{
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}
export const todayDateKey=localDateKey

export function buildTodayTaskCandidates(target:TargetScore, now=new Date()):TodayTask[]{
  const attempts=loadAttempts(),scores=loadExamScores(),progress=loadGuidedProgressState()
  const latest=scores.find(x=>x.completed!==false)
  const latestByQuestion=new Map<string,(typeof attempts)[number]>()
  for(const attempt of attempts){
    if(!attempt.questionId.startsWith('exam-'))continue
    const qid=attempt.questionId.slice(5)
    if(!latestByQuestion.has(qid))latestByQuestion.set(qid,attempt)
  }

  const tasks:TodayTask[]=[]
  for(const [qid,attempt] of latestByQuestion){
    const meta=questionMap.get(qid)
    // 2019〜2023年度の任意通し演習は履歴には残すが、必須10課題へ自動昇格させない。
    // 旧年度を正式な補強に使う場合は Reinforcement の学習ルートから扱う。
    if(!meta||!isMainCheckYear(meta.year)||attempt.status==='correct'||!gradeInTarget(target,meta.grade))continue
    const p=progress[qid]
    // 過去の「克服済み」より新しい過去問誤答があれば、弱点を再開する。
    const progressIsCurrent=!!p&&p.updatedAt>=attempt.at
    const mastery=progressIsCurrent?p.mastery:'attempted'
    const base=priorityByGrade(target,meta.grade)
    const easy=['計算ミス','符号ミス','条件読み落とし','読み落とし','答え方の不備'].includes(attempt.mistakeTag||'')
    if(!['reproduced','independent','consolidated'].includes(mastery)){
      tasks.push({
        id:`review-${qid}`,kind:'review',questionId:qid,grade:meta.grade,
        title:`${meta.year}年度 大問${meta.major}（${meta.subNo}）を直す`,
        detail:`${meta.topic}${attempt.mistakeTag?`・${attempt.mistakeTag}`:''}／問題${meta.grade}`,
        to:`/guided-review?q=${encodeURIComponent(qid)}`,
        priority:base+(easy?30:0)+(meta.major===1?15:0)
      })
    }else if(mastery!=='consolidated'&&(p?.practiceStreak||0)<4){
      const field=classifyRemediationField(meta.topic).title
      tasks.push({
        id:`practice-${qid}`,kind:'practice',questionId:qid,grade:meta.grade,
        title:`${field}の類題で定着`,
        detail:`${meta.year}年度 大問${meta.major}（${meta.subNo}）から・連続 ${progressIsCurrent?(p?.practiceStreak||0):0}/4`,
        to:`/remediate?topic=${encodeURIComponent(meta.topic)}&source=${meta.year}&q=${encodeURIComponent(qid)}`,
        priority:base+10
      })
    }
  }

  // 一度自力化した問題も、7日以上空いていれば1問だけ忘却防止候補にする。
  const stale=Object.values(progress).filter(p=>{
    if(!['independent','consolidated'].includes(p.mastery))return false
    const meta=questionMap.get(p.questionId)
    if(!meta||!isMainCheckYear(meta.year)||!gradeInTarget(target,meta.grade))return false
    const age=now.getTime()-Date.parse(p.updatedAt||'')
    return Number.isFinite(age)&&age>=7*24*60*60*1000
  }).sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt))[0]
  if(stale){
    const meta=questionMap.get(stale.questionId)!
    tasks.push({
      id:`refresh-${meta.id}`,kind:'review',questionId:meta.id,grade:meta.grade,
      title:`${meta.year}年度 大問${meta.major}（${meta.subNo}）を忘却防止で確認`,
      detail:`${meta.topic}・ヒントなしで再確認`,
      to:`/guided-review?q=${encodeURIComponent(meta.id)}`,
      priority:35
    })
  }

  // 同じ小問の「直し」と「類題」が同日に重複しないよう一意化。
  const seenQuestion=new Set<string>(),unique=tasks.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)).filter(task=>{
    if(!task.questionId)return true
    if(seenQuestion.has(task.questionId))return false
    seenQuestion.add(task.questionId);return true
  })

  return unique
}

export function buildLearningQueue(target:TargetScore,now=new Date(),nextActionTask?:TodayTask):TodayTask[]{
  const base=buildTodayTaskCandidates(target,now)
  if(!nextActionTask)return base

  // 途中の採点・過去問・準備問題は、弱点候補よりも先に「今続けるべき作業」として扱う。
  const isResume=/\/past-papers\?year=\d+(?:&review=1)?$/.test(nextActionTask.to)||nextActionTask.to==='/setup-check'
  if(isResume){
    return [nextActionTask,...base.filter(task=>task.id!==nextActionTask.id)]
  }

  // 未解決問題の一覧を指す場合は、その年度の具体的な1問を先頭に並べる。
  const mistakeYear=nextActionTask.to.match(/^\/mistakes\?year=(\d{4})$/)?.[1]
  if(mistakeYear){
    const year=Number(mistakeYear)
    const same=base.filter(task=>task.questionId&&questionMap.get(task.questionId)?.year===year)
    const rest=base.filter(task=>!same.some(x=>x.id===task.id))
    return same.length?[...same,...rest]:[nextActionTask,...rest]
  }

  // 類題・旧年度補強では、その出典年度に紐づくpractice課題を先頭にする。
  const reinforceYear=nextActionTask.to.match(/^\/reinforce\?source=(\d{4})$/)?.[1]
  if(reinforceYear){
    const token=`source=${reinforceYear}`
    const same=base.filter(task=>task.kind==='practice'&&task.to.includes(token))
    const rest=base.filter(task=>!same.some(x=>x.id===task.id))
    return same.length?[...same,...rest]:[nextActionTask,...rest]
  }

  // 新しい過去問・仕上げなど具体候補に置き換えられない行動は共通キューの先頭に置く。
  return [nextActionTask,...base.filter(task=>task.id!==nextActionTask.id)]
}

const DAILY_REQUIRED_PLAN_KEY='waseshibu-math-daily-required-plan-v2'
type DailyRequiredPlan={date:string;target:TargetScore;pendingIds:string[];completedIds:string[];fallbackTask?:TodayTask;queueVersion?:number}
function loadDailyRequiredPlan(date:string,target:TargetScore):DailyRequiredPlan{
  try{
    const parsed=JSON.parse(localStorage.getItem(DAILY_REQUIRED_PLAN_KEY)||'null') as DailyRequiredPlan|null
    if(parsed&&parsed.date===date&&Array.isArray(parsed.pendingIds)&&Array.isArray(parsed.completedIds)){
      return {...parsed,target:parsed.target===60||parsed.target===70||parsed.target===75?parsed.target:target}
    }
  }catch{/* regenerate safely */}
  return {date,target,pendingIds:[],completedIds:[]}
}
function saveDailyRequiredPlan(plan:DailyRequiredPlan){
  try{localStorage.setItem(DAILY_REQUIRED_PLAN_KEY,JSON.stringify(plan))}catch{/* learning can continue without freezing */}
}

function reconcileDailyPlan(target:TargetScore,now=new Date(),fallbackTask?:TodayTask){
  const date=localDateKey(now)
  let plan=loadDailyRequiredPlan(date,target)
  // 前日に「次の日の分」として先取りした計画は、その日になったらそのまま今日の計画として引き継ぐ。
  // 先取り済みの課題を翌日にもう一度10件課すことを防ぐ。
  const ahead=loadStudyAheadPlan()
  if(!plan.pendingIds.length&&!plan.completedIds.length&&!plan.fallbackTask&&ahead?.date===date){
    plan={date,target:ahead.target,pendingIds:[...ahead.pendingIds],completedIds:[...ahead.completedIds],...(ahead.fallbackTask?{fallbackTask:ahead.fallbackTask}:{})}
  }
  const targetCandidates=buildLearningQueue(target,now,fallbackTask)
  const allCandidates=buildLearningQueue(75,now,fallbackTask)
  const allCandidateIds=new Set(allCandidates.map(task=>task.id))

  // v0.17.1以前に別ロジックで固定された当日計画は、共通キュー順へ一度だけ再整列する。
  // 完了済み件数は保持し、学習履歴そのものは変更しない。
  if(plan.queueVersion!==3){
    const completed=new Set(plan.completedIds)
    const slots=Math.max(0,10-plan.completedIds.length)
    plan={...plan,pendingIds:targetCandidates.filter(task=>!completed.has(task.id)).slice(0,slots).map(task=>task.id),fallbackTask:undefined,queueVersion:3}
  }

  // 過去問開始など候補外の1件を今日の必須にした場合、次回来訪時に進行先が変われば完了扱い。
  let storedFallback=plan.fallbackTask
  const fallbackCompleted=!!storedFallback&&(!fallbackTask||fallbackTask.id!==storedFallback.id)
  const fallbackCompletedIds=fallbackCompleted&&storedFallback?[`fallback:${storedFallback.id}`]:[]
  if(fallbackCompleted)storedFallback=undefined

  // 以前の必須課題が候補から消えた = その課題を完了した、とみなす。
  // 「直し」が終わって「類題」が新候補になっても、同日に11件目として自動補充しない。
  const newlyCompleted=plan.pendingIds.filter(id=>!allCandidateIds.has(id))
  const completedIds=[...new Set([...plan.completedIds,...newlyCompleted,...fallbackCompletedIds])].slice(0,10)
  const targetCandidateIds=new Set(targetCandidates.map(task=>task.id))
  let pendingIds=plan.pendingIds.filter(id=>allCandidateIds.has(id)&&targetCandidateIds.has(id))

  // 目標A/B/Cを途中で変えても、1日の必須総数は「完了済み + 現在の必須」で最大10件。
  // 目標外になった未完了課題は枠を消費せず、新しい目標に合う課題へ置き換える。
  const remainingSlots=Math.max(0,10-completedIds.length)
  if(plan.target!==target||(!pendingIds.length&&!completedIds.length)){
    const keep=new Set(pendingIds)
    const fill=targetCandidates.filter(task=>!keep.has(task.id)).slice(0,Math.max(0,remainingSlots-pendingIds.length)).map(task=>task.id)
    pendingIds=[...pendingIds,...fill].slice(0,remainingSlots)
  }

  // 初回生成。通常候補がなければ、過去問開始など「学習サイクルの次の1件」を1件だけ固定する。
  // 完了後は同日に次フェーズを11件目として自動補充しない。
  if(!pendingIds.length&&!completedIds.length&&!storedFallback){
    pendingIds=targetCandidates.slice(0,10).map(task=>task.id)
  }

  const next:DailyRequiredPlan={date,target,pendingIds,completedIds,queueVersion:3,...(storedFallback?{fallbackTask:storedFallback}:{})}
  saveDailyRequiredPlan(next)
  return {plan:next,targetCandidates}
}


const STUDY_AHEAD_PLAN_KEY='waseshibu-math-study-ahead-plan-v1'
type StudyAheadPlan={date:string;target:TargetScore;pendingIds:string[];completedIds:string[];fallbackTask?:TodayTask;queueVersion?:number}

function addLocalDays(now:Date,days:number){
  const d=new Date(now)
  d.setDate(d.getDate()+days)
  return d
}
function loadStudyAheadPlan():StudyAheadPlan|null{
  try{
    const parsed=JSON.parse(localStorage.getItem(STUDY_AHEAD_PLAN_KEY)||'null') as StudyAheadPlan|null
    if(parsed&&typeof parsed.date==='string'&&Array.isArray(parsed.pendingIds)&&Array.isArray(parsed.completedIds))return parsed
  }catch{/* ignore broken optional plan */}
  return null
}
function saveStudyAheadPlan(plan:StudyAheadPlan){
  try{localStorage.setItem(STUDY_AHEAD_PLAN_KEY,JSON.stringify(plan))}catch{/* optional study-ahead must not block learning */}
}

function reconcileStudyAheadPlan(target:TargetScore,now=new Date(),fallbackTask?:TodayTask,create=false){
  const nextDate=addLocalDays(now,1),date=localDateKey(nextDate)
  let plan=loadStudyAheadPlan()
  if(!plan||plan.date!==date){
    if(!create)return {plan:null as StudyAheadPlan|null,targetCandidates:[] as TodayTask[]}
    plan={date,target,pendingIds:[],completedIds:[]}
  }
  const targetCandidates=buildLearningQueue(target,nextDate,fallbackTask)
  const allCandidates=buildLearningQueue(75,nextDate,fallbackTask)
  const allCandidateIds=new Set(allCandidates.map(task=>task.id))

  if(plan.queueVersion!==3){
    const completed=new Set(plan.completedIds)
    const slots=Math.max(0,10-plan.completedIds.length)
    plan={...plan,pendingIds:targetCandidates.filter(task=>!completed.has(task.id)).slice(0,slots).map(task=>task.id),fallbackTask:undefined,queueVersion:3}
  }

  let storedFallback=plan.fallbackTask
  const fallbackCompleted=!!storedFallback&&(!fallbackTask||fallbackTask.id!==storedFallback.id)
  const fallbackCompletedIds=fallbackCompleted&&storedFallback?[`fallback:${storedFallback.id}`]:[]
  if(fallbackCompleted)storedFallback=undefined

  const newlyCompleted=plan.pendingIds.filter(id=>!allCandidateIds.has(id))
  const completedIds=[...new Set([...plan.completedIds,...newlyCompleted,...fallbackCompletedIds])].slice(0,10)
  const targetIds=new Set(targetCandidates.map(task=>task.id))
  let pendingIds=plan.pendingIds.filter(id=>allCandidateIds.has(id)&&targetIds.has(id))

  // 先取り開始後にA/B/C目標を変更しても、完了済みを保持しつつ現在目標の最大10件へ再調整する。
  // 今日の必須課題と同様、目標外になった未完了課題は枠を消費しない。
  const remainingSlots=Math.max(0,10-completedIds.length)
  if(plan.target!==target){
    const keep=new Set(pendingIds)
    const fill=targetCandidates.filter(task=>!keep.has(task.id)).slice(0,Math.max(0,remainingSlots-pendingIds.length)).map(task=>task.id)
    pendingIds=[...pendingIds,...fill].slice(0,remainingSlots)
  }

  // 「次の日の分」は開始時に最大10件を固定し、途中で新しい11件目を補充しない。
  if(create&&!pendingIds.length&&!completedIds.length&&!storedFallback){
    pendingIds=targetCandidates.slice(0,10).map(task=>task.id)
  }

  const next:StudyAheadPlan={date,target,pendingIds,completedIds,queueVersion:3,...(storedFallback?{fallbackTask:storedFallback}:{})}
  saveStudyAheadPlan(next)
  return {plan:next,targetCandidates}
}

export function startNextDayPlan(target:TargetScore,now=new Date(),fallbackTask?:TodayTask){
  return reconcileStudyAheadPlan(target,now,fallbackTask,true).plan
}

export function buildNextDayTasks(target:TargetScore,now=new Date(),fallbackTask?:TodayTask):TodayTask[]{
  const {plan,targetCandidates}=reconcileStudyAheadPlan(target,now,fallbackTask,false)
  if(!plan)return []
  const assigned=new Set(plan.pendingIds)
  const tasks=targetCandidates.filter(task=>assigned.has(task.id))
  if(plan.fallbackTask)tasks.push(plan.fallbackTask)
  return tasks
}

export function nextDayPlanSummary(target:TargetScore,now=new Date(),fallbackTask?:TodayTask){
  const {plan}=reconcileStudyAheadPlan(target,now,fallbackTask,false)
  const tasks=buildNextDayTasks(target,now,fallbackTask)
  return {
    started:!!plan,
    date:plan?.date||localDateKey(addLocalDays(now,1)),
    tasks,
    complete:!!plan&&(plan.pendingIds.length+Number(!!plan.fallbackTask)>0?tasks.length===0:plan.completedIds.length>0),
    completedCount:plan?.completedIds.length||0,
    limit:10
  }
}

export function buildTodayTasks(target:TargetScore, now=new Date(),fallbackTask?:TodayTask):TodayTask[]{
  const {plan,targetCandidates}=reconcileDailyPlan(target,now,fallbackTask)
  const assigned=new Set(plan.pendingIds)
  const tasks=targetCandidates.filter(task=>assigned.has(task.id))
  if(plan.fallbackTask)tasks.push(plan.fallbackTask)
  return tasks
}

export function buildOptionalNextTask(target:TargetScore,now=new Date(),fallbackTask?:TodayTask):TodayTask|null{
  const {plan,targetCandidates}=reconcileDailyPlan(target,now,fallbackTask)
  // 必須が残っている間は追加演習へ誘導しない。
  if(plan.pendingIds.length>0)return null
  // 必須課題を終えた後も、今日・先取りと同じ共通キューの先頭を1件だけ返す。
  // これにより「次のアクション」と「次の日の先取り」の先頭が食い違わない。
  const completed=new Set(plan.completedIds)
  return targetCandidates.find(task=>!completed.has(task.id))||null
}

export function todayPlanSummary(target:TargetScore,now=new Date(),fallbackTask?:TodayTask){
  const tasks=buildTodayTasks(target,now,fallbackTask)
  const plan=loadDailyRequiredPlan(localDateKey(now),target)
  const plannedCount=plan.pendingIds.length+plan.completedIds.length+(plan.fallbackTask?1:0)
  return {
    date:localDateKey(now),tasks,complete:plannedCount>0&&tasks.length===0,limit:10,
    planned:plannedCount>0,completedCount:plan.completedIds.length
  }
}
