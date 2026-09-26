// Synthetic state transitions and curriculum audit, NOT predicted learner scores.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {build} from 'esbuild'
import {createRequire} from 'node:module'

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'math-attainment-'))
try {
  await build({entryPoints:['dailyPlan','learningRoute','storage','guidedReview','level2History','level2Answer','dataBackup','targetStrategy','targetEta','examExposure','data/level2Data','data/examAnswers'].map(n=>'src/'+n+'.ts'),outdir:temp,outbase:'src',bundle:true,platform:'node',format:'cjs',define:{'import.meta.env.BASE_URL':'"/"'},logLevel:'silent'})
  const require=createRequire(import.meta.url),read=name=>require(path.join(temp,name+'.js'))
  class MemoryStorage {
    map=new Map()
    getItem(k){return this.map.get(k)??null}
    setItem(k,v){this.map.set(k,String(v))}
    removeItem(k){this.map.delete(k)}
  }
  global.window={dispatchEvent(){}}
  global.CustomEvent=class {constructor(type){this.type=type}}
  global.localStorage=new MemoryStorage()
  const route=read('learningRoute'),daily=read('dailyPlan'),storage=read('storage'),guided=read('guidedReview'),l2=read('level2History'),bank=read('data/level2Data'),grading=read('level2Answer'),answers=read('data/examAnswers'),strategy=read('targetStrategy'),backup=read('dataBackup')
  const majors=JSON.parse(fs.readFileSync('src/data/questions.json','utf8')).questions
  const rows=year=>majors.filter(q=>q.year===year).flatMap(q=>q.subquestions.map(s=>({key:`${q.id}-${s.no}`,major:q.major,subNo:s.no,topic:s.topic,grade:s.grade,points:(q.major===1?40:15)/q.subquestions.length})))
  const findings=[],observations=[],scenarios=[]
  const at='2026-09-01T00:00:00.000Z',now=new Date()
  for(const target of [60,70,75])for(const initialScore of [25,40,55,65]){
    global.localStorage=new MemoryStorage()
    storage.savePreferences({target})
    const items=rows(2024).map((q,i)=>({...q,status:i<initialScore/5?'correct':i%2?'wrong':'unanswered'}))
    const score=items.filter(q=>q.status==='correct').reduce((s,q)=>s+q.points,0)
    assert.equal(score,initialScore)
    storage.saveExamScore({id:'diagnostic',year:2024,score,completed:true,at,correctCount:initialScore/5})
    for(const q of items)storage.saveAttempt({id:q.key,questionId:`exam-${q.key}`,mode:'multi',topic:q.topic,status:q.status==='unanswered'?'deferred':q.status,at})
    const needed=items.filter(q=>q.status!=='correct'&&strategy.gradeInTarget(target,q.grade,q.key))
    const action=route.nextLearningAction(target)
    assert.match(action.to,/mistakes\?year=2024/)
    const fallback={id:'route',kind:'review',title:action.label,detail:'',to:action.to,priority:0}
    const queue=daily.buildLearningQueue(target,now,fallback)
    assert.equal(queue[0].grade,'A',`${target}/${score}: A before B/C`)
    assert.equal(new Set(queue.map(q=>q.questionId)).size,queue.length)
    assert.ok(queue.every(q=>!q.questionId.startsWith('2026-')))
    assert.ok(daily.buildTodayTasks(target,now,fallback).length<=10)
    const picked=[],sets=[]
    for(const q of needed){
      const result=guided.recordGuidedFinal(q.key,answers.getExamAnswer(q.key).answer,'retry')
      assert.equal(result.correct,true)
      assert.ok(route.sourceMistakeProgress(2024,target).completedIds.includes(q.key))
      let done=false,iterations=0
      while(!done&&iterations<12){
        const p=l2.selectLevel2Question(q.key,'expressions',localStorage,at)
        sets.push(...p.session.fixedQuestionIds)
        picked.push(p.question.id)
        const correct=iterations!==0 // First attempt wrong; then deterministic registered answers.
        if(correct)assert.ok(grading.isAcceptedLevel2Answer(p.question.answer,p.question),p.question.id)
        const outcome=l2.recordLevel2Attempt({key:p.key,sessionId:p.session.sessionId,question:p.question,presentationId:p.presentationId,answer:correct?p.question.answer:'wrong',correct,usedHint:false,usedExplanation:false,revealedAnswer:false,firstSubmission:true,practiceFieldId:null})
        if(!correct)assert.equal(outcome.completed,false)
        done=outcome.completed;iterations++
      }
      assert.ok(done,`${q.key}: fixed set terminates`)
      assert.ok(route.sourcePracticeProgress(2024,target).completedIds.includes(q.key))
    }
    assert.equal(route.requiredYearComplete(2024,target),true)
    assert.match(route.nextLearningAction(target).to,/past-papers\?year=2023/)
    assert.equal(daily.buildTodayTaskCandidates(target,now).length,0,'completed work must not return immediately')
    const saved=backup.collectBackup(),restored=new MemoryStorage()
    backup.restoreBackup(restored,backup.parseBackup(JSON.stringify(saved)),'replace')
    assert.deepEqual(JSON.parse(restored.getItem('waseshibu-math-level2-history-v1')),JSON.parse(localStorage.getItem('waseshibu-math-level2-history-v1')))
    const leaks=[...new Set(picked.filter(id=>bank.level2QuestionById.get(id)?.sourceYear===2026))]
    if(leaks.length)observations.push({kind:'related-practice-exposure',target,initialScore,ids:leaks})
    assert.equal(route.yearExposureState(2026),leaks.length?'partially_exposed':'untouched')
    scenarios.push({target,initialScore,sourceRepairs:needed.length,practiceSubmissions:picked.length,uniqueFixedIds:new Set(sets).size,nextYear:2023,holdout2026:route.yearExposureState(2026),leaks})
  }
  // Run the complete required route using fixed 25-point diagnostic inputs.
  // Subsequent registered answers drive state transitions, not a learning model.
  global.localStorage=new MemoryStorage()
  storage.savePreferences({target:70})
  const fullRoute=[]
  for(const year of [2024,2023,2022,2025,2026]){
    assert.equal(route.nextLearningAction(70).to,`/past-papers?year=${year}`)
    const exposureBefore=route.yearExposureState(year),items=rows(year)
    storage.saveExamScore({id:`route-${year}`,year,score:25,completed:true,at,correctCount:5})
    for(const [i,q] of items.entries())storage.saveAttempt({id:`route-${q.key}`,questionId:`exam-${q.key}`,mode:'multi',topic:q.topic,status:i<5?'correct':'wrong',at})
    let submissions=0
    for(const q of items.slice(5).filter(q=>strategy.gradeInTarget(70,q.grade,q.key))){
      assert.equal(guided.recordGuidedFinal(q.key,answers.getExamAnswer(q.key).answer,'retry').correct,true)
      let complete=false
      for(let i=0;i<8&&!complete;i++){
        const selected=l2.selectLevel2Question(q.key,'expressions',localStorage,at)
        assert.ok(grading.isAcceptedLevel2Answer(selected.question.answer,selected.question))
        complete=l2.recordLevel2Attempt({key:selected.key,sessionId:selected.session.sessionId,question:selected.question,presentationId:selected.presentationId,answer:selected.question.answer,correct:true,usedHint:false,usedExplanation:false,revealedAnswer:false,firstSubmission:true,practiceFieldId:null}).completed
        submissions++
      }
      assert.ok(complete,`full route ${q.key}`)
    }
    assert.equal(route.requiredYearComplete(year,70),true)
    fullRoute.push({year,inputScore:25,exposureBefore,practiceSubmissions:submissions,stageCompleted:true})
  }
  assert.equal(route.nextLearningAction(70).to,'/years')
  // Every main-route source and standalone field must still have a full fixed set.
  for(const q of [2024,2023,2022,2025,2026].flatMap(rows)){
    global.localStorage=new MemoryStorage()
    const selected=l2.selectLevel2Question(q.key,'expressions')
    assert.equal(selected.session.fixedQuestionIds.length,selected.session.requiredCount,q.key)
    assert.equal(selected.session.requiredCount,q.major===1?4:q.major<=3?3:2,q.key)
  }
  for(const field of bank.level2Fields){
    global.localStorage=new MemoryStorage()
    const selected=l2.selectLevel2Question(null,field.fieldId)
    assert.equal(selected.session.fixedQuestionIds.length,selected.session.requiredCount,field.fieldId)
  }
  const exposure=read('examExposure')
  assert.equal(exposure.inferFirstLookEligible(false,{},true),true)
  assert.equal(exposure.inferFirstLookEligible(false,{answers:{q:'old'}},true),false)
  assert.equal(exposure.inferFirstLookEligible(false,{firstLookEligible:true},false),true)
  assert.equal(exposure.inferFirstLookEligible(false,{firstLookEligible:true},false,true),false)
  assert.equal(exposure.inferFirstLookEligible(true,{firstLookEligible:true},true),false)
  for(const history of [
    {attempts:[{questionId:'L2-2026-Q5-1'}]},
    {questionStats:{'L2-2026-Q5-1':{attemptCount:1}}},
    {sessions:{old:{lastPresentedIds:['L2-2026-Q5-1']}}},
    {sessions:{old:{pendingAssistance:{questionId:'L2-2026-Q5-1'}}}}
  ]){
    global.localStorage=new MemoryStorage()
    localStorage.setItem('waseshibu-math-level2-history-v1',JSON.stringify(history))
    assert.equal(route.yearExposureState(2026),'partially_exposed')
    assert.equal(route.hasRelatedStudyExposure(2026),true)
  }
  global.localStorage=new MemoryStorage()
  localStorage.setItem('waseshibu-math-level2-history-v1',JSON.stringify({sessions:{reserved:{fixedQuestionIds:['L2-2026-Q5-1']}}}))
  assert.equal(route.yearExposureState(2026),'untouched','reserved is not presented')
  // The selected B problems must flow through every 60-point gate.
  const eta=read('targetEta'),supplementCases=[]
  const extraByYear={2023:['2023-Q1-5','2023-Q1-6'],2026:['2026-Q3-2']}
  for(const year of [2023,2026])for(const legacyLock of [false,true]){
    global.localStorage=new MemoryStorage()
    storage.savePreferences({target:60})
    const items=rows(year),extra=extraByYear[year]
    const locked=[2024,2023,2022,2025,2026].filter(y=>legacyLock||y!==year)
    localStorage.setItem('waseshibu-math-learning-route-v1',JSON.stringify({solvedYears:locked,usedOldQuestionIds:[],reinforcement:{},completedCoreByTarget:{'60':locked},updatedAt:at}))
    const originalLock=localStorage.getItem('waseshibu-math-learning-route-v1')
    storage.saveExamScore({id:`supplement-${year}`,year,score:year===2023?50:55,completed:true,at,correctCount:items.filter(q=>q.grade==='A').length})
    for(const q of items)storage.saveAttempt({id:q.key,questionId:`exam-${q.key}`,mode:'multi',topic:q.topic,status:q.grade==='A'&&!(legacyLock&&q.subNo==='1')?'correct':'wrong',at})
    assert.deepEqual(route.sourceMistakeProgress(year,60).requiredIds.sort(),[...extra].sort())
    assert.equal(route.requiredYearComplete(year,60),false)
    assert.match(route.nextLearningAction(60).to,new RegExp(`mistakes\\?year=${year}`))
    const tasks=daily.buildTodayTaskCandidates(60)
    assert.deepEqual(tasks.map(t=>t.questionId).sort(),[...extra].sort())
    const expectedExtraWork=year===2023?10:4 // repair + 4/4 or 3/3 fixed practice
    assert.equal(eta.buildGoalDayEstimates().find(x=>x.target===60).remainingQuestions,expectedExtraWork)
    if(legacyLock)assert.equal(localStorage.getItem('waseshibu-math-learning-route-v1'),originalLock)
    for(const id of extra){
      assert.equal(guided.recordGuidedFinal(id,answers.getExamAnswer(id).answer,'retry').correct,true)
      assert.equal(route.requiredYearComplete(year,60),false,'source repair alone is not completion')
      let complete=false
      for(let i=0;i<5&&!complete;i++){
        const p=l2.selectLevel2Question(id,'expressions',localStorage,at)
        assert.ok(grading.isAcceptedLevel2Answer(p.question.answer,p.question))
        complete=l2.recordLevel2Attempt({key:p.key,sessionId:p.session.sessionId,question:p.question,presentationId:p.presentationId,answer:p.question.answer,correct:true,usedHint:false,usedExplanation:false,revealedAnswer:false,firstSubmission:true,practiceFieldId:null}).completed
      }
      assert.ok(complete)
    }
    assert.equal(route.requiredYearComplete(year,60),true)
    assert.equal(eta.buildGoalDayEstimates().find(x=>x.target===60).remainingQuestions,0)
    assert.equal(daily.buildTodayTaskCandidates(60).length,0)
    const restored=new MemoryStorage(),exported=backup.collectBackup()
    backup.restoreBackup(restored,backup.parseBackup(JSON.stringify(exported)),'replace')
    global.localStorage=restored
    assert.equal(route.requiredYearComplete(year,60),true,'completion preserved through import')
    supplementCases.push({year,legacyLock,extra,additionalWorkBeforeRepair:expectedExtraWork,completeAfterPractice:true})
  }
  // Independent calculations for selected source questions, using inspected source pages.
  assert.equal(answers.getExamAnswer('2023-Q1-5').answer,String(180-(180-(180-43-58))-21))
  assert.ok(Math.abs((Math.sqrt(11)-3)**2+6*(Math.sqrt(11)-3)-2)<1e-12)
  assert.equal(answers.getExamAnswer('2023-Q1-6').answer,'2')
  let favorable=0,total=0
  for(let a=1;a<=8;a++)for(let b=1;b<=8;b++)if(a!==b){total++;if(b%a===0)favorable++}
  assert.deepEqual([favorable,total],[12,56])
  assert.equal(answers.getExamAnswer('2026-Q3-2').answer,'3/14')
  const ceilings=[]
  for(const year of [2024,2023,2022,2025,2026])for(const target of [60,70,75]){
    const eligible=rows(year).filter(q=>strategy.gradeInTarget(target,q.grade,q.key)),ceiling=eligible.reduce((s,q)=>s+q.points,0)
    ceilings.push({year,target,eligibleQuestions:eligible.length,ceiling})
    if(ceiling<target)findings.push({kind:'target-ceiling-shortfall',year,target,ceiling,gap:target-ceiling})
  }
  console.log(JSON.stringify({evidence:'Synthetic transitions using registered answers; ceilings use app estimated weights, not official subquestion marks.',scenarios,fullRoute,supplementCases,ceilings,observations,findings},null,2))
  console.log('PASS: 12 diagnostic → source repair → fixed practice → next-year flows, priority, daily cap, termination, backup restoration')
  console.log(findings.length?'HOLD: attainment criteria have unresolved findings':'PASS: audited target coverage and state transitions; not evidence of learning outcomes')
  if(process.argv.includes('--strict')&&findings.length)process.exitCode=1
} finally {fs.rmSync(temp,{recursive:true,force:true})}
