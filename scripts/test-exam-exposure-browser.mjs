import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
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
  for(const width of [390,1280])for(const scenario of [
    {name:'new',draft:null,validity:'first-look'},
    {name:'legacy draft',draft:{answers:{'2024-Q1-1':'old-answer'},seconds:30},validity:'reference'},
    {name:'resumed first look',draft:{answers:{},firstLookEligible:true,seconds:30},validity:'first-look'},
    {name:'related L2 shown',draft:null,l2:{sessions:{test:{lastPresentedIds:['L2-2024-Q1-1']}}},validity:'reference'},
    {name:'assistance during resumed exam',draft:{answers:{},firstLookEligible:true},l2:{attempts:[{questionId:'L2-2024-Q1-1'}]},validity:'reference'},
    {name:'reserved only',draft:null,l2:{sessions:{test:{fixedQuestionIds:['L2-2024-Q1-1']}}},validity:'first-look'}
  ]){
    const context=await browser.newContext({viewport:{width,height:844}})
    await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort())
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)))
    await page.goto(base);await page.getByRole('heading').first().waitFor()
    await page.evaluate(s=>{
      if(s.draft)localStorage.setItem('waseshibu-math-exam-drafts-v2',JSON.stringify({'2024':s.draft}))
      if(s.l2)localStorage.setItem('waseshibu-math-level2-history-v1',JSON.stringify(s.l2))
    },scenario)
    await page.goto(base+'#/past-papers?year=2024')
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
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('waseshibu-math-exam-scores')))
    assert.equal(saved[0].scoreValidity,scenario.validity,scenario.name)
    if(scenario.name==='legacy draft')assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('waseshibu-math-attempts')).find(a=>a.questionId==='exam-2024-Q1-1').answer),'old-answer')
    await page.reload();await page.getByRole('heading').first().waitFor()
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('waseshibu-math-exam-scores'))[0].scoreValidity),scenario.validity)
    assert.deepEqual(errors,[])
    console.log(`PASS ${width}px ${scenario.name}: ${scenario.validity}; answer and result survive reload`)
    await context.close()
  }
}finally{await browser.close();server.close()}
