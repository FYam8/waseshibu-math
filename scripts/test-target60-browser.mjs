import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {createRequire} from 'node:module'
import {build} from 'esbuild'
const fixtureDir=fs.mkdtempSync(path.join(os.tmpdir(),'math-target60-browser-'))
await build({entryPoints:['src/data/examAnswers.ts'],outfile:path.join(fixtureDir,'answers.cjs'),bundle:true,platform:'node',format:'cjs',logLevel:'silent'})
const answers=createRequire(import.meta.url)(path.join(fixtureDir,'answers.cjs'))
const majors=JSON.parse(fs.readFileSync('src/data/questions.json','utf8')).questions
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const root=path.resolve('dist')
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/waseshibu-math\//,'/')
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname))
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return}
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg'}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)
})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const base=process.env.TEST_BASE_URL || `http://127.0.0.1:${server.address().port}/waseshibu-math/`
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']})
try{
  for(const width of [390,1280])for(const year of [2023,2026]){
    const extra=year===2023?['2023-Q1-5','2023-Q1-6']:['2026-Q3-2']
    const draftAnswers=Object.fromEntries(majors.filter(q=>q.year===year).flatMap(q=>q.subquestions.filter(s=>s.grade==='A').map(s=>{const id=`${q.id}-${s.no}`;return [id,answers.getExamAnswer(id).answer]})))
    const context=await browser.newContext({viewport:{width,height:844}})
    await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort())
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)))
    await page.goto(base);await page.getByRole('heading').first().waitFor()
    await page.evaluate(({year,draftAnswers})=>{
      localStorage.setItem('waseshibu-math-preferences',JSON.stringify({target:60,updatedAt:new Date().toISOString()}))
      const locked=[2024,2023,2022,2025,2026].filter(y=>y!==year)
      localStorage.setItem('waseshibu-math-learning-route-v1',JSON.stringify({solvedYears:locked,usedOldQuestionIds:[],reinforcement:{},completedCoreByTarget:{'60':locked},updatedAt:new Date().toISOString()}))
      localStorage.setItem('waseshibu-math-exam-drafts-v2',JSON.stringify({[year]:{answers:draftAnswers,phase:'solve',firstLookEligible:false}}))
    },{year,draftAnswers})
    await page.goto(base+`#/past-papers?year=${year}`)
    if(width===390)await page.locator('.answer-dock-toggle').click()
    await page.getByRole('button',{name:/大問5/}).click()
    await page.getByRole('button',{name:'解答を終了して自動採点',exact:true}).click()
    let guard=0
    while(await page.getByRole('button',{name:'次の小問 →',exact:true}).count()){
      assert.ok(++guard<=20)
      await page.getByRole('button',{name:'次の小問 →',exact:true}).click()
    }
    await page.getByRole('button',{name:'採点結果を保存',exact:true}).click()
    await page.locator('.result-scores').waitFor()
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('waseshibu-math-exam-scores'))[0].score),year===2023?50:55)
    const priorityLinks=await page.locator('.result-wrong-first a').evaluateAll(links=>links.map(a=>new URL(a.href).hash.split('q=')[1]))
    assert.deepEqual(priorityLinks.sort(),extra)
    await page.goto(base+`#/mistakes?year=${year}`)
    const targetCard=page.locator('section.card').filter({has:page.getByRole('heading',{name:'今直す小問',exact:true})})
    await targetCard.waitFor()
    const ids=await targetCard.locator('a').evaluateAll(links=>links.map(a=>new URLSearchParams(new URL(a.href).hash.split('?')[1]).get('q')))
    assert.deepEqual(ids.sort(),extra)
    assert.match(await page.locator('.target-review-policy').innerText(),/指定B問題/)
    await targetCard.locator(`a[href*="${extra[0]}"]`).click()
    await page.getByRole('button',{name:'もう一度自力で解く',exact:true}).click()
    await page.getByPlaceholder('この小問の最終答案を入力').fill(answers.getExamAnswer(extra[0]).answer)
    await page.getByRole('button',{name:'この1問を採点する',exact:true}).click()
    await page.getByRole('link',{name:'固定類題セットへ',exact:true}).click()
    assert.match(page.url(),/remediate/)
    await page.getByRole('heading').first().waitFor()
    assert.match(await page.locator('body').innerText(),/固定|類題/)
    assert.deepEqual(errors,[])
    console.log(`PASS ${width}px ${year}: real score ${year===2023?50:55}, specified B priority, mistake list, source retry, fixed practice link`)
    await context.close()
  }
}finally{await browser.close();server.close();fs.rmSync(fixtureDir,{recursive:true,force:true})}
