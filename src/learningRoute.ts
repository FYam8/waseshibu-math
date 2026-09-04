import questions from './data/questions.json'
import type { ExamScore, MajorQuestion } from './types'
import { classifyRemediationField } from './data/remediation'
import { loadAttempts, loadExamScores, loadPreferences } from './storage'
import { canWriteLearningData, notifyWriteBlocked } from './version'
import { loadGuidedProgressState, loadGuidedReviews } from './guidedReview'
import { gradeInTarget, storedExamItems, weakFieldsForStoredExam, type TargetScore } from './targetStrategy'

const ROUTE_KEY='waseshibu-math-learning-route-v1'
const LEVEL2_HISTORY_KEY='waseshibu-math-level2-history-v1'

export function hasCurrentPracticeMastery(field:string,after:string){
  try{
    const fieldId=(()=>{const id=classifyRemediationField(field).id;return id==='radicals'?'square-roots':id==='motion'?'coordinates':id})()
    const raw=JSON.parse(localStorage.getItem(LEVEL2_HISTORY_KEY)||'null') as {masteryEvents?:Array<{fieldId?:string;achievedAt?:string;questionIds?:string[];requiredCount?:number}>}|null
    return !!raw?.masteryEvents?.some(event=>event.fieldId===fieldId&&(event.achievedAt||'')>after&&(event.questionIds?.length||0)>=(event.requiredCount||4)&&event.questionIds!.every(id=>!/^L2-20(?:19|20|21)-/.test(id)))
  }catch{return false}
}

// v0.17.9: 2022〜2026の5年度を必須の学習サイクルにする。
// 年代順ではなく、診断→2段階の改善確認→実戦確認→最終確認の役割順で進める。
export const REQUIRED_MAIN_YEAR_SEQUENCE=[2024,2023,2022,2025,2026] as const
export type RequiredMainYear=(typeof REQUIRED_MAIN_YEAR_SEQUENCE)[number]

export function requiredYearPurpose(year:number){
  if(year===2024)return '診断'
  if(year===2023)return '改善確認①'
  if(year===2022)return '改善確認②'
  if(year===2025)return '実戦確認'
  if(year===2026)return '最終確認'
  return '任意演習'
}

export type ReinforcementPlan={
  examId:string
  sourceYear:number
  target?:TargetScore
  fields:Record<string,string[]>
  completedQuestionIds:string[]
  createdAt:string
  requiresSourceReview?:boolean
}

export type LearningRouteState={
  solvedYears:number[]
  usedOldQuestionIds:string[]
  reinforcement:Record<string,ReinforcementPlan>
  updatedAt:string
}

export type SourceMistakeProgress={requiredIds:string[];completedIds:string[];remainingIds:string[];complete:boolean}

const empty=():LearningRouteState=>({solvedYears:[],usedOldQuestionIds:[],reinforcement:{},updatedAt:new Date(0).toISOString()})

export function loadLearningRoute():LearningRouteState{
  try{
    const raw=JSON.parse(localStorage.getItem(ROUTE_KEY)||'null')
    if(!raw)return empty()
    return {
      solvedYears:Array.isArray(raw.solvedYears)?raw.solvedYears.filter(Number.isInteger):[],
      usedOldQuestionIds:Array.isArray(raw.usedOldQuestionIds)?raw.usedOldQuestionIds.map(String):[],
      reinforcement:raw.reinforcement&&typeof raw.reinforcement==='object'?raw.reinforcement:{},
      updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:new Date(0).toISOString()
    }
  }catch{return empty()}
}

export function saveLearningRoute(state:LearningRouteState){
  if(!canWriteLearningData()){notifyWriteBlocked();return}
  localStorage.setItem(ROUTE_KEY,JSON.stringify({...state,updatedAt:new Date().toISOString()}))
  window.dispatchEvent(new CustomEvent('waseshibu-route-change'))
}

export function markYearSolved(year:number){
  const state=loadLearningRoute()
  if(state.solvedYears.includes(year))return
  saveLearningRoute({...state,solvedYears:[...state.solvedYears,year]})
}

export type OldQuestionItem={id:string,year:number,major:number,subNo:string,topic:string,title:string,field:string}

export function oldQuestionBank():OldQuestionItem[]{
  return (questions.questions as MajorQuestion[]).filter(q=>q.year>=2019&&q.year<=2021).flatMap(q=>q.subquestions.map(s=>({
    id:`${q.id}-${s.no}`,year:q.year,major:q.major,subNo:s.no,topic:s.topic,title:q.title,field:classifyRemediationField(s.topic).title
  })))
}

function hasQuestionLevelExamDetail(exam:ExamScore){
  if(exam.correctCount!==undefined||exam.wrongCount!==undefined||exam.unansweredCount!==undefined)return true
  return loadAttempts().some(a=>a.at===exam.at&&a.questionId.startsWith(`exam-${exam.year}-Q`))
}

// 学習ルート・弱点補強は「得点だけの手入力」では進めない。
// 小問別の正誤が保存された年度だけを、診断済みの過去問として扱う。
export function latestExam(year:number){
  return loadExamScores().filter(x=>x.year===year&&x.completed!==false&&hasQuestionLevelExamDetail(x)).sort((a,b)=>b.at.localeCompare(a.at))[0]
}

// Home/得点履歴の「最新得点」は、手入力も含む主確認年度の最新記録を表示してよい。
// ただし学習ルート判定には latestExam() を使う。
export function latestMainCheckExam(){
  return loadExamScores().filter(x=>x.completed!==false&&x.year>=2022&&x.year<=2026).sort((a,b)=>b.at.localeCompare(a.at))[0]
}

export function isMainCheckYear(year:number){
  return year>=2022&&year<=2026
}

function actualOldQuestionExposureIds(){
  const ids=new Set<string>()
  const openedYears=new Set<number>()
  for(const attempt of loadAttempts()){
    const exposure=attempt.questionId.match(/^exposure-(20(?:19|2[0-1]))$/)
    if(exposure)openedYears.add(Number(exposure[1]))
    const raw=attempt.questionId.startsWith('exam-')?attempt.questionId.slice(5):attempt.questionId.startsWith('target-')?attempt.questionId.slice(7):''
    if(/^20(19|2[0-1])-Q\d+-/.test(raw))ids.add(raw)
  }
  // 年度通し画面はその年度の問題全体を表示するため、開いた時点で全小問を露出済みとみなす。
  for(const item of oldQuestionBank())if(openedYears.has(item.year))ids.add(item.id)
  const guided=loadGuidedProgressState()
  for(const [id,state] of Object.entries(guided)){
    if(/^20(19|2[0-1])-Q\d+-/.test(id)&&state?.mastery!=='unseen')ids.add(id)
  }
  return ids
}

// 閲覧しただけでは補強候補から除外しない。年度演習・補強・ステップ解説の
// 最新結果が成功の問題だけを「原則再出題しない」対象にする。
function successfullyUsedOldQuestionIds(){
  const latest=new Map<string,{at:string;success:boolean}>()
  const set=(id:string,at:string,success:boolean)=>{const old=latest.get(id);if(!old||at>old.at)latest.set(id,{at,success})}
  for(const attempt of loadAttempts()){
    const raw=attempt.questionId.startsWith('exam-')?attempt.questionId.slice(5):attempt.questionId.startsWith('target-')?attempt.questionId.slice(7):''
    if(/^20(?:19|20|21)-Q\d+-/.test(raw))set(raw,attempt.at,attempt.status==='correct')
  }
  for(const [id,state] of Object.entries(loadGuidedProgressState()))if(/^20(?:19|20|21)-Q\d+-/.test(id))set(id,state.updatedAt,['reproduced','independent','consolidated'].includes(state.mastery))
  return new Set([...latest].filter(([,value])=>value.success).map(([id])=>id))
}

export type OldQuestionAssignmentState='none'|'reserved'|'completed'|'exposed'
export function oldQuestionAssignmentState(id:string):OldQuestionAssignmentState{
  const state=loadLearningRoute()
  for(const plan of Object.values(state.reinforcement)){
    if(plan.completedQuestionIds.includes(id))return 'completed'
  }
  for(const plan of Object.values(state.reinforcement)){
    if(Object.values(plan.fields).some(ids=>ids.includes(id)))return 'reserved'
  }
  if(actualOldQuestionExposureIds().has(id))return 'exposed'
  return 'none'
}

export function sourceMistakeProgress(year:number,target:TargetScore=loadPreferences().target):SourceMistakeProgress{
  const exam=latestExam(year)
  if(!exam)return {requiredIds:[],completedIds:[],remainingIds:[],complete:false}
  const attempts=loadAttempts(),reviews=loadGuidedReviews(),progress=loadGuidedProgressState()
  const requiredIds=storedExamItems(exam,attempts).filter(item=>item.status!=='correct'&&gradeInTarget(target,item.grade)).map(item=>item.key)
  const completedIds=requiredIds.filter(id=>{
    const current=progress[id]
    if(current&&current.updatedAt>=exam.at&&['reproduced','independent','consolidated'].includes(current.mastery))return true
    // v0.15以前の学習履歴も完了判定に残す。
    const legacy=reviews[id]
    return !!legacy&&legacy.updatedAt>=exam.at&&(legacy.outcome==='independent'||legacy.outcome==='reproduced')
  })
  const completed=new Set(completedIds),remainingIds=requiredIds.filter(id=>!completed.has(id))
  return {requiredIds,completedIds,remainingIds,complete:remainingIds.length===0}
}

export type UnresolvedSourceSummary={
  year:number
  total:number
  wrong:number
  unanswered:number
  remainingIds:string[]
}

export function unresolvedSourceSummary(year:number,target:TargetScore=loadPreferences().target):UnresolvedSourceSummary|null{
  const exam=latestExam(year)
  if(!exam)return null
  const attempts=loadAttempts(),source=sourceMistakeProgress(year,target),remaining=new Set(source.remainingIds)
  const items=storedExamItems(exam,attempts).filter(item=>remaining.has(item.key))
  return {
    year,
    total:items.length,
    wrong:items.filter(item=>item.status==='wrong').length,
    unanswered:items.filter(item=>item.status==='unanswered').length,
    remainingIds:source.remainingIds
  }
}

export function firstUnresolvedSource(target:TargetScore=loadPreferences().target):UnresolvedSourceSummary|null{
  for(const year of REQUIRED_MAIN_YEAR_SEQUENCE){
    const summary=unresolvedSourceSummary(year,target)
    if(summary&&summary.total>0)return summary
  }
  return null
}


function practicePlanComplete(exam:ExamScore,target:TargetScore,plan:ReinforcementPlan|undefined,attempts=loadAttempts(),fields=weakFieldsForStoredExam(target,exam,attempts)){
  if(!fields.length)return true
  if(!plan||plan.examId!==exam.id||plan.target!==target)return false
  const completed=new Set(plan.completedQuestionIds)
  return fields.every(field=>{
    const actualDone=(plan.fields[field]||[]).every(id=>completed.has(id))
    const mastered=hasCurrentPracticeMastery(field,exam.at)
    return actualDone&&mastered
  })
}

export function ensureReinforcementPlan(exam:ExamScore,target:TargetScore=loadPreferences().target):ReinforcementPlan{
  const state=loadLearningRoute(),key=String(exam.year),existing=state.reinforcement[key],attempts=loadAttempts()
  const bank=oldQuestionBank(),activeOldIds=new Set(bank.map(item=>item.id))
  const successfullyUsed=successfullyUsedOldQuestionIds()
  const explicitlyAttempted=new Set(attempts.flatMap(attempt=>{
    const raw=attempt.questionId.startsWith('exam-')?attempt.questionId.slice(5):attempt.questionId.startsWith('target-')?attempt.questionId.slice(7):''
    return /^20(?:19|20|21)-Q\d+-/.test(raw)?[raw]:[]
  }))
  const desired=weakFieldsForStoredExam(target,exam,attempts)
  const sameFields=existing&&Object.keys(existing.fields).length===desired.length&&desired.every(field=>
    field in existing.fields&&(existing.fields[field]||[]).every(id=>activeOldIds.has(id))
  )
  if(existing?.examId===exam.id&&existing.target===target&&sameFields){
    const assigned=new Set(Object.values(existing.fields).flat())
    const reconciledCompleted=[...assigned].filter(id=>successfullyUsed.has(id)||(existing.completedQuestionIds.includes(id)&&!explicitlyAttempted.has(id)))
    const completionChanged=reconciledCompleted.length!==existing.completedQuestionIds.length||reconciledCompleted.some(id=>!existing.completedQuestionIds.includes(id))
    if(existing.requiresSourceReview!==undefined){
      if(!completionChanged)return existing
      const reconciled={...existing,completedQuestionIds:reconciledCompleted}
      saveLearningRoute({...state,usedOldQuestionIds:[...new Set([...state.usedOldQuestionIds,...reconciledCompleted])],reinforcement:{...state.reinforcement,[key]:reconciled}})
      return reconciled
    }
    const legacyDone=practicePlanComplete(exam,target,existing,attempts,desired)
    const stamped={...existing,requiresSourceReview:!legacyDone}
    saveLearningRoute({...state,reinforcement:{...state.reinforcement,[key]:stamped}})
    return stamped
  }

  // 「予約」と「実際に解いた」を分離する。
  // 他の現行補強プランに予約されている問題、または実際に露出した問題だけを候補から外す。
  // 目標変更で現在プランから外れた未実施予約は、再び候補へ戻せる。
  const reservedByOther=new Set<string>()
  for(const [planKey,plan] of Object.entries(state.reinforcement)){
    if(planKey===key)continue
    for(const ids of Object.values(plan.fields))for(const id of ids)reservedByOther.add(id)
  }
  const completedAnywhere=new Set<string>()
  for(const plan of Object.values(state.reinforcement))for(const id of plan.completedQuestionIds)completedAnywhere.add(id)

  const fields:Record<string,string[]>={}
  for(const field of desired){
    const retained=existing?.examId===exam.id?(existing.fields[field]||[]).filter(id=>(!completedAnywhere.has(id)||existing.completedQuestionIds.includes(id))&&!(!existing.completedQuestionIds.includes(id)&&successfullyUsed.has(id))):[]
    const candidates=bank.filter(x=>x.field===field&&!reservedByOther.has(x.id)&&(!completedAnywhere.has(x.id)||!successfullyUsed.has(x.id))&&!successfullyUsed.has(x.id)).sort((a,b)=>b.year-a.year||a.major-b.major)
    const selected:OldQuestionItem[]=retained.map(id=>bank.find(x=>x.id===id)).filter(Boolean) as OldQuestionItem[]
    for(const item of candidates){
      if(selected.length>=4)break
      if(!selected.some(x=>x.id===item.id)&&(!selected.some(x=>x.year===item.year)||candidates.length<=4))selected.push(item)
    }
    for(const item of candidates)if(selected.length<Math.min(4,candidates.length)&&!selected.some(x=>x.id===item.id))selected.push(item)
    fields[field]=selected.map(x=>x.id)
  }

  const legacyDone=!!existing&&existing.examId===exam.id&&existing.target===target&&existing.requiresSourceReview===undefined&&practicePlanComplete(exam,target,existing,attempts,desired)
  const activeSelectedIds=new Set(Object.values(fields).flat())
  const retainedCompleted=existing?.examId===exam.id?existing.completedQuestionIds.filter(id=>activeSelectedIds.has(id)&&successfullyUsed.has(id)):[]
  const plan:ReinforcementPlan={examId:exam.id,sourceYear:exam.year,target,fields,completedQuestionIds:retainedCompleted,createdAt:new Date().toISOString(),requiresSourceReview:!legacyDone}
  // 旧版で2022/2023を補強問題として使った履歴も消さない。ただし今後の予約候補は2019〜2021だけ。
  const completedHistory=new Set(state.usedOldQuestionIds)
  for(const id of plan.completedQuestionIds)completedHistory.add(id)
  saveLearningRoute({...state,usedOldQuestionIds:[...completedHistory],reinforcement:{...state.reinforcement,[key]:plan}})
  return plan
}

export function markOldQuestionCompleted(sourceYear:number,id:string){
  const state=loadLearningRoute(),key=String(sourceYear),plan=state.reinforcement[key]
  if(!plan||plan.completedQuestionIds.includes(id))return
  saveLearningRoute({
    ...state,
    usedOldQuestionIds:[...new Set([...state.usedOldQuestionIds,id])],
    reinforcement:{...state.reinforcement,[key]:{...plan,completedQuestionIds:[...plan.completedQuestionIds,id]}}
  })
}

export function reinforcementPracticeComplete(year:number,target:TargetScore=loadPreferences().target){
  const exam=latestExam(year)
  if(!exam)return false
  const attempts=loadAttempts(),fields=weakFieldsForStoredExam(target,exam,attempts)
  return practicePlanComplete(exam,target,loadLearningRoute().reinforcement[String(year)],attempts,fields)
}

export function reinforcementComplete(year:number,target:TargetScore=loadPreferences().target){
  const exam=latestExam(year)
  if(!exam)return false
  const attempts=loadAttempts(),fields=weakFieldsForStoredExam(target,exam,attempts)
  if(!fields.length)return true
  const plan=loadLearningRoute().reinforcement[String(year)]
  if(!practicePlanComplete(exam,target,plan,attempts,fields))return false
  // v0.13以前ですでに旧方式の補強を完了していた利用者は完了のまま維持します。
  if(plan?.requiresSourceReview===false||plan?.requiresSourceReview===undefined)return true
  return sourceMistakeProgress(year,target).complete
}

// 2022〜2026の必須5年度。各年度は「年度通し → 未解決元問題 → 補強」を完了してから次へ進む。
export function requiredYearComplete(year:number,target:TargetScore=loadPreferences().target){
  const exam=latestExam(year)
  return !!exam&&sourceMistakeProgress(year,target).complete&&reinforcementComplete(year,target)
}

function completedCheckpointYears(target:TargetScore=loadPreferences().target){
  return REQUIRED_MAIN_YEAR_SEQUENCE.slice(1).filter(year=>requiredYearComplete(year,target))
}

// 互換API。次にまだ年度通しを実施していない必須年度を返す。
export function nextCheckpointYear(){
  for(const year of REQUIRED_MAIN_YEAR_SEQUENCE.slice(1)){
    if(!latestExam(year))return year
  }
  return null
}

// 現在の必須年度。未実施だけでなく、元問題修正・補強が残る年度もここに留まる。
export function nextRequiredStageYear(target:TargetScore=loadPreferences().target):RequiredMainYear|null{
  for(const year of REQUIRED_MAIN_YEAR_SEQUENCE){
    if(!requiredYearComplete(year,target))return year
  }
  return null
}

// 旧API名は維持するが、v0.17.9では必須5年度の進行位置（1〜12）を表す。
export function currentLearningStep(){
  const target=loadPreferences().target
  for(let i=0;i<REQUIRED_MAIN_YEAR_SEQUENCE.length;i++){
    const year=REQUIRED_MAIN_YEAR_SEQUENCE[i]
    const exam=latestExam(year)
    const base=i===0?1:4+(i-1)*2
    if(!exam)return base
    if(!sourceMistakeProgress(year,target).complete||!reinforcementComplete(year,target))return base+1
  }
  return 12
}

// Homeでは6フェーズ：2024診断、2024補強、2023、2022、2025、2026。
export function currentLearningPhase(){
  const target=loadPreferences().target
  if(!latestExam(2024))return 1
  if(!requiredYearComplete(2024,target))return 2
  if(!requiredYearComplete(2023,target))return 3
  if(!requiredYearComplete(2022,target))return 4
  if(!requiredYearComplete(2025,target))return 5
  return 6
}

export function routeStepDone(step:number){
  const target=loadPreferences().target
  if(step===1)return !!latestExam(2024)
  if(step===2)return requiredYearComplete(2024,target)
  if(step===3)return requiredYearComplete(2023,target)
  if(step===4)return requiredYearComplete(2022,target)
  if(step===5)return requiredYearComplete(2025,target)
  if(step===6)return requiredYearComplete(2026,target)
  return false
}


export type YearExposureState='untouched'|'partially_exposed'|'fully_attempted'
export type YearRole='main-check'|'reinforcement-pool'|'different-structure'

export function yearRole(year:number):YearRole{
  if(year===2019)return 'different-structure'
  if(year>=2020&&year<=2021)return 'reinforcement-pool'
  return 'main-check'
}

export function yearExposureState(year:number):YearExposureState{
  const exam=latestExam(year)
  if(exam)return 'fully_attempted'
  const attempts=loadAttempts()
  // 過去問ページでは年度全体の問題が表示されるため、開いた履歴だけでも初見性は失われる。
  const opened=attempts.some(a=>a.questionId===`exposure-${year}`)
  const attemptedIds=new Set(attempts.flatMap(a=>{
    if(a.questionId.startsWith('target-')){
      const id=a.questionId.slice(7)
      return id.startsWith(`${year}-Q`)?[id]:[]
    }
    if(a.questionId.startsWith('exam-')){
      const id=a.questionId.slice(5)
      return id.startsWith(`${year}-Q`)?[id]:[]
    }
    return []
  }))
  const guided=loadGuidedProgressState()
  const guidedExposure=Object.keys(guided).some(id=>id.startsWith(`${year}-Q`)&&guided[id]?.mastery!=='unseen')
  return opened||attemptedIds.size||guidedExposure?'partially_exposed':'untouched'
}

export function scoreInterpretation(year:number){
  return yearExposureState(year)==='untouched'?'初見スコア候補':'参考スコア'
}

export type LearningAction={to:string;label:string;purpose?:string}

type ExamDraftLike={phase?:'solve'|'mark';answers?:Record<string,string>;seconds?:number;updatedAt?:string}
function draftEntries(){
  try{
    const drafts=JSON.parse(localStorage.getItem('waseshibu-math-exam-drafts-v2')||'{}') as Record<string,ExamDraftLike>
    return Object.entries(drafts).filter(([,draft])=>draft&&(draft.phase==='mark'||(draft.phase==='solve'&&(Number(draft.seconds)>0||Object.values(draft.answers||{}).some(Boolean))))).sort((a,b)=>String(b[1].updatedAt||'').localeCompare(String(a[1].updatedAt||'')))
  }catch{return [] as [string,ExamDraftLike][]}
}
function actionForDraft(entry:[string,ExamDraftLike]):LearningAction{
  const [year,draft]=entry,isOptional=Number(year)>=2019&&Number(year)<=2021
  return draft.phase==='mark'
    ?{to:`/past-papers?year=${year}&review=1`,label:`${year}年度の採点を続ける`,purpose:isOptional?'中断中の任意演習':'学習サイクル'}
    :{to:`/past-papers?year=${year}`,label:`${year}年度の続きから`,purpose:isOptional?'中断中の任意演習':'学習サイクル'}
}
export function resumeDraftAction():LearningAction|null{
  const entry=draftEntries()[0]
  return entry?actionForDraft(entry):null
}
export function coreResumeDraftAction():LearningAction|null{
  const entry=draftEntries().find(([year])=>REQUIRED_MAIN_YEAR_SEQUENCE.includes(Number(year) as RequiredMainYear))
  return entry?actionForDraft(entry):null
}
export function optionalOldYearDraftAction():LearningAction|null{
  const entry=draftEntries().find(([year])=>Number(year)>=2019&&Number(year)<=2021)
  return entry?actionForDraft(entry):null
}

export function nextLearningAction(target:TargetScore=loadPreferences().target):LearningAction{
  const drafts=draftEntries()
  const draftFor=(year:number)=>{
    const entry=drafts.find(([y])=>Number(y)===year)
    return entry?actionForDraft(entry):null
  }

  // 年度の新しさではなく、固定された学習上の役割順を正本にする。
  // 後の年度を先に開いたドラフトがあっても、手前の必須年度・未解決・補強を飛ばさない。
  for(const year of REQUIRED_MAIN_YEAR_SEQUENCE){
    const exam=latestExam(year)
    const purpose=requiredYearPurpose(year)

    if(!exam){
      const matchingDraft=draftFor(year)
      if(matchingDraft)return {...matchingDraft,purpose}
      const exposure=yearExposureState(year)
      return {
        to:`/past-papers?year=${year}`,
        label:`${year}年度を${purpose}${exposure==='untouched'?'':'（参考確認）'}として解く`,
        purpose
      }
    }

    const source=sourceMistakeProgress(year,target)
    if(source.remainingIds.length){
      return {
        to:`/mistakes?year=${year}`,
        label:`${year}年度の未解決問題 ${source.remainingIds.length}問を直す`,
        purpose:`${purpose}後の元問題修正`
      }
    }
    if(!reinforcementComplete(year,target)){
      return {
        to:`/reinforce?source=${year}`,
        label:`${year}年度の類題・2019〜2021年度で補強する`,
        purpose:`${purpose}後の弱点補強`
      }
    }
  }

  // 必須5年度完了後だけ、任意年度や残存ドラフトへ進む。
  const coreDraft=drafts.find(([year])=>REQUIRED_MAIN_YEAR_SEQUENCE.includes(Number(year) as RequiredMainYear))
  return coreDraft?actionForDraft(coreDraft):{to:'/years',label:'2022〜2026年度の必須5年完了・任意演習へ進む',purpose:'維持・追加演習'}
}

export function routePhaseDone(phase:number){
  return routeStepDone(phase)
}

export const learningRouteStorageKey=ROUTE_KEY
