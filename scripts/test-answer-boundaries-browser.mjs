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
const base=`http://127.0.0.1:${server.address().port}/waseshibu-math/`
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']})
try{
  for(const width of [390,1280]){
    const context=await browser.newContext({viewport:{width,height:844}})
    // No synthetic learning record may leave this isolated localhost context.
    await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort())
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)))
    await page.goto(base+'#/past-papers?year=2026')
    await page.getByRole('button',{name:'理解して開始する',exact:true}).click()
    if(width===390)await page.locator('.answer-dock-toggle').click()
    const inputs=page.getByPlaceholder('答えを入力（全角可）')
    await inputs.nth(4).fill('-3^2')
    await page.getByRole('button',{name:/大問2/}).click()
    await inputs.nth(2).fill('12,18')
    await page.reload()
    await page.getByRole('button',{name:'理解して開始する',exact:true}).click()
    if(width===390)await page.locator('.answer-dock-toggle').click()
    assert.equal(await inputs.nth(2).inputValue(),'12,18')
    await page.getByRole('button',{name:/大問5/}).click()
    await page.getByRole('button',{name:'解答を終了して自動採点',exact:true}).click()
    await page.locator('.mark-status.wrong').waitFor()
    assert.equal(await page.locator('.mark-cause select').count(),0)
    assert.match(await page.locator('.one-question-banner').innerText(),/大問1（5）/)
    await page.getByRole('button',{name:'次の小問 →',exact:true}).click()
    assert.match(await page.locator('.one-question-banner').innerText(),/大問2（3）/)
    assert.equal(await page.locator('.mark-status.wrong').count(),1)
    while(await page.getByRole('button',{name:'次の小問 →',exact:true}).count())await page.getByRole('button',{name:'次の小問 →',exact:true}).click()
    await page.getByRole('button',{name:'採点結果を保存',exact:true}).click()
    await page.locator('.result-scores').waitFor()
    const saved=await page.evaluate(()=>({scores:localStorage.getItem('waseshibu-math-exam-scores'),attempts:localStorage.getItem('waseshibu-math-attempts')}))
    const records=JSON.parse(saved.attempts)
    for(const [id,answer] of [['exam-2026-Q1-5','-3^2'],['exam-2026-Q2-3','12,18']]){
      const r=records.find(r=>r.questionId===id);assert.equal(r.status,'wrong');assert.equal(r.answer,answer);assert.equal(r.mistakeTag,'原因未確定');assert.equal(r.diagnosis,undefined)
    }
    await page.reload();await page.getByRole('heading').first().waitFor()
    assert.equal(await page.evaluate(()=>localStorage.getItem('waseshibu-math-exam-scores')),saved.scores)
    await page.goto(base+'#/practice')
    await page.getByPlaceholder('答えを入力',{exact:true}).fill('999999')
    await page.getByRole('button',{name:'採点する',exact:true}).click()
    await page.locator('.result.ng').waitFor()
    assert.equal(await page.locator('.mistake-row select').count(),0)
    await page.getByRole('button',{name:'次へ',exact:true}).click()
    const practice=await page.evaluate(()=>JSON.parse(localStorage.getItem('waseshibu-math-attempts')).find(x=>x.answer==='999999'))
    assert.equal(practice.mistakeTag,'原因未確定');assert.equal(practice.status,'wrong')
    assert.deepEqual(errors,[])
    console.log(`PASS ${width}px: real exam input, two incorrect grades, draft reload, persisted answers/score; no cause self-report, unknown cause persisted, practice answer saved; external requests blocked`)
    await context.close()
  }
}finally{await browser.close();server.close()}
