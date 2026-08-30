import questions from './data/questions.json'
import type { MajorQuestion } from './types'
import { classifyRemediationField } from './data/remediation'
import { loadAttempts, loadExamScores, loadPreferences } from './storage'
import { loadGuidedProgressState } from './guidedReview'
import { gradeInTarget, type TargetScore } from './targetStrategy'

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

export function buildTodayTasks(target:TargetScore, now=new Date()):TodayTask[]{
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
    if(!meta||attempt.status==='correct'||!gradeInTarget(target,meta.grade))continue
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
    if(!meta||!gradeInTarget(target,meta.grade))return false
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

  // 今日の必須課題は最大5件。弱点が多くても無限に増やさない。
  return unique.slice(0,5)
}

export function todayPlanSummary(target:TargetScore,now=new Date()){
  const tasks=buildTodayTasks(target,now)
  return {date:localDateKey(now),tasks,complete:tasks.length===0,limit:5}
}
