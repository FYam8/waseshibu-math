import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const dir=await mkdtemp(path.join(tmpdir(),'math-boundaries-'))
try {
  const outfile=path.join(dir,'test.mjs')
  await build({stdin:{contents:"export * from './src/answer'; export * from './src/data/examAnswers'",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile})
  const {isAcceptedAnswer:a,isExamAnswerCorrect:e}=await import(pathToFileURL(outfile).href)
  const cases=[
    ['fixed-sample collision is not an identity',()=>a('x+(x-2)*(x-3)*(x-5)*(x-7)*(x-11)','x'),false],
    ['zero polynomial at old sample points',()=>a('(x-2)*(x-3)*(x-5)*(x-7)*(x-11)','0'),false],
    ['exact expansion',()=>a('(x+2)*(x-3)','x^2-x-6'),true],
    ['multivariate expansion',()=>a('(a+b)^2','a^2+2ab+b^2'),true],
    ['rational coefficients',()=>a('x/3+x/6','x/2'),true],
    ['decimal coefficients',()=>a('0.1x+0.2x','0.3x'),true],
    ['tiny nonzero difference',()=>a('x+0.0000000001','x'),false],
    ['undefined point cannot be cancelled',()=>a('x/x','1'),false],
    ['variable denominator retains domain',()=>a('(x^2-1)/(x-1)','x+1'),false],
    ['square root is not signed identity',()=>a('√(x^2)','x'),false],
    ['bounded symbolic work',()=>a('(a+b+c)^100000','0'),false],
    ['superscript is an exponent',()=>a('x²','2x'),false],
    ['superscript equivalent',()=>a('x²','x^2'),true],
    ['signed superscript',()=>a('-3²','-9'),true],
    ['unary minus after exponent',()=>a('-3^2','9'),false],
    ['correct negative square',()=>a('-3^2','-9'),true],
    ['parenthesized negative base',()=>a('(-3)^2','9'),true],
    ['negative exponent',()=>a('2^-2','1/4'),true],
    ['right associative exponent',()=>a('2^3^2','512'),true],
    ['signed variable square',()=>a('-x^2','x^2'),false],
    ['equivalent signed expression',()=>a('-x^2','0-x*x'),true],
    ['zero ratio in practice',()=>a('0:0','1:9'),false],
    ['zero ratio as expected',()=>a('1:9','0:0'),false],
    ['valid scaled ratio',()=>a('2:18','1:9'),true],
    ['valid zero numerator',()=>a('0:2','0:1'),true],
    ['coordinate reversal with bare alias',()=>e('2026-Q2-3','12,18'),false],
    ['coordinate equivalent bare alias',()=>e('2026-Q2-3','18.0,12.0'),true],
    ['coordinate bare answer',()=>e('2026-Q2-3','18,12'),true],
    ['coordinate tuple answer',()=>e('2026-Q2-3','(18,12)'),true],
    ['unordered solutions',()=>e('2026-Q2-1','72,37'),true],
    ['inequality endpoints',()=>a('-1<=x<3','-1<x<=3'),false],
    ['equivalent fractions',()=>a('2/4','1/2'),true],
  ]
  const failures=[]
  for(const [label,run,expected] of cases){try{assert.equal(run(),expected,label)}catch(e){failures.push(e.message)}}
  assert.deepEqual(failures,[])
  console.log(`Answer boundary regression: ${cases.length} PASS`)
} finally { await rm(dir,{recursive:true,force:true}) }
