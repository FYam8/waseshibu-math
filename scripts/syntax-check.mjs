import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url),ts=require('typescript')
let failed=0,count=0
function walk(dir){
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name),stat=fs.statSync(p)
    if(stat.isDirectory())walk(p)
    else if(/\.(ts|tsx)$/.test(name)&&!name.endsWith('.d.ts')){
      count++
      const result=ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,moduleResolution:ts.ModuleResolutionKind.Bundler},reportDiagnostics:true,fileName:p})
      for(const d of result.diagnostics||[])if(d.category===ts.DiagnosticCategory.Error){failed++;console.error(`${p}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`)}
    }
  }
}
walk('src')
if(failed)process.exit(1)
console.log(`PASS: syntax ${count} TS/TSX files`)
