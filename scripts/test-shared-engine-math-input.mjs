import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import os from 'node:os'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'math-input-'))
const runtime=path.join(temp,'mathInput.runtime.js')
execFileSync('node_modules/.bin/esbuild',['src/engine/mathInput.ts','--bundle','--format=iife','--global-name=CanonicalMathInput','--platform=browser','--target=es2020',`--outfile=${runtime}`])
assert.equal(fs.readFileSync(runtime,'utf8'),fs.readFileSync('src/engine/mathInput.runtime.js','utf8'))
const context={};vm.runInNewContext(fs.readFileSync(runtime,'utf8'),context)
const engine=context.CanonicalMathInput
// Independent pre-extraction component behavior, exhaustively across selection ranges.
for(const value of ['', '0≦y≦32','3√2','(4,3)','１２＋３'])for(let start=0;start<=value.length+2;start++)for(let end=start;end<=value.length+2;end++){
  const a=Math.min(start,value.length),b=Math.min(end,value.length)
  for(const {text} of engine.canonicalMathKeys){
    const expected={value:value.slice(0,a)+text+value.slice(b),position:a+text.length-(text.endsWith('()')?1:0)}
    assert.equal(JSON.stringify(engine.insertCanonicalMathText(value,{start,end},text)),JSON.stringify(expected))
  }
  let result=value,pos=a
  if(a!==b)result=value.slice(0,a)+value.slice(b)
  else if(a>0){result=value.slice(0,a-1)+value.slice(a);pos=a-1}
  assert.equal(JSON.stringify(engine.deleteCanonicalMathText(value,{start,end})),JSON.stringify({value:result,position:pos}))
}
assert.equal(engine.insertCanonicalMathText('',{start:0,end:0},'√()').position,2)
assert.equal(engine.insertCanonicalMathText('',{start:0,end:0},'()').position,1)
assert.match(fs.readFileSync('src/components/MathAnswerInput.tsx','utf8'),/insertCanonicalMathText/)
assert.doesNotMatch(fs.readFileSync('src/engine/mathInput.ts','utf8'),/localStorage|fetch\(|waseshibu|rikkyo/)
console.log('PASS shared math input: keys, insertion, deletion, selection and legacy cursor parity')
