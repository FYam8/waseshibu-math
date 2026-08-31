export function normalizeAnswer(value:string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g,'')
    .replace(/[−–—]/g,'-')
    .replace(/[×・]/g,'*')
    .replace(/÷/g,'/')
    .replace(/⁄/g,'/')
    .replace(/\+\/-|－\/－/g,'±')
    .replace(/sqrt\(([^()]+)\)/gi,'√($1)')
    .replace(/sqrt/gi,'√')
    .replace(/√\(([^()]+)\)/g,'√($1)')
    .replace(/\*?√/g,'√')
    .replace(/\^2/g,'²')
    .replace(/[≤≦]/g,'<=')
    .replace(/[≥≧]/g,'>=')
    .replace(/、/g,',')
    .replace(/[＝=]/g,'=')
    .replace(/^[a-z]=/,'')
    .replace(/(?:円|度|°|秒|平方センチメートル|平方cm|cm²|cm2|cm|m²|m2|m)$/i,'')
}

export function cleanAnswerInput(value:string){
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').replace(/[\r\n\t]/g,' ').slice(0,120)
}

type Token={kind:'num'|'var'|'op'|'l'|'r'|'sqrt';value:string}

function tokenizeExpression(value:string):Token[]|null{
  const s=value.replace(/²/g,'^2').replace(/π/g,String(Math.PI))
  const raw:Token[]=[]
  for(let i=0;i<s.length;){
    const ch=s[i]
    if(/[0-9.]/.test(ch)){
      let j=i+1
      while(j<s.length&&/[0-9.]/.test(s[j]))j++
      const v=s.slice(i,j)
      if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(v))return null
      raw.push({kind:'num',value:v});i=j;continue
    }
    if(/[a-z]/.test(ch)){raw.push({kind:'var',value:ch});i++;continue}
    if(ch==='√'){raw.push({kind:'sqrt',value:ch});i++;continue}
    if('+-*/^'.includes(ch)){raw.push({kind:'op',value:ch});i++;continue}
    if(ch==='('){raw.push({kind:'l',value:ch});i++;continue}
    if(ch===')'){raw.push({kind:'r',value:ch});i++;continue}
    return null
  }
  const out:Token[]=[]
  const canEnd=(t:Token)=>t.kind==='num'||t.kind==='var'||t.kind==='r'
  const canStart=(t:Token)=>t.kind==='num'||t.kind==='var'||t.kind==='l'||t.kind==='sqrt'
  for(const token of raw){
    if(out.length&&canEnd(out[out.length-1])&&canStart(token))out.push({kind:'op',value:'*'})
    out.push(token)
  }
  return out
}

function evalExpression(value:string,env:Record<string,number>):number|null{
  const tokens=tokenizeExpression(value)
  if(!tokens)return null
  let i=0
  const primary=():number|null=>{
    const t=tokens[i]
    if(!t)return null
    if(t.kind==='num'){i++;return Number(t.value)}
    if(t.kind==='var'){i++;return env[t.value]??null}
    if(t.kind==='sqrt'){
      i++
      const v=primary()
      return v!==null&&v>=0?Math.sqrt(v):null
    }
    if(t.kind==='l'){
      i++
      const v=add()
      if(tokens[i]?.kind!=='r')return null
      i++;return v
    }
    return null
  }
  const unary=():number|null=>{
    if(tokens[i]?.kind==='op'&&(tokens[i].value==='+'||tokens[i].value==='-')){
      const sign=tokens[i++].value
      const v=unary()
      return v===null?null:(sign==='-'?-v:v)
    }
    return primary()
  }
  const power=():number|null=>{
    let left=unary()
    if(left===null)return null
    if(tokens[i]?.kind==='op'&&tokens[i].value==='^'){
      i++
      const right=power()
      if(right===null)return null
      left=Math.pow(left,right)
    }
    return Number.isFinite(left)?left:null
  }
  const mul=():number|null=>{
    let left=power()
    if(left===null)return null
    while(tokens[i]?.kind==='op'&&(tokens[i].value==='*'||tokens[i].value==='/')){
      const op=tokens[i++].value,right=power()
      if(right===null||(op==='/'&&Math.abs(right)<1e-12))return null
      left=op==='*'?left*right:left/right
      if(!Number.isFinite(left))return null
    }
    return left
  }
  const add=():number|null=>{
    let left=mul()
    if(left===null)return null
    while(tokens[i]?.kind==='op'&&(tokens[i].value==='+'||tokens[i].value==='-')){
      const op=tokens[i++].value,right=mul()
      if(right===null)return null
      left=op==='+'?left+right:left-right
    }
    return left
  }
  const result=add()
  return result!==null&&i===tokens.length&&Number.isFinite(result)?result:null
}

function splitTopLevel(value:string,delimiter:string){
  const parts:string[]=[]
  let depth=0,start=0
  for(let i=0;i<value.length;i++){
    if(value[i]==='(')depth++
    else if(value[i]===')')depth--
    else if(value[i]===delimiter&&depth===0){parts.push(value.slice(start,i));start=i+1}
  }
  parts.push(value.slice(start))
  return parts
}

const close=(a:number,b:number)=>Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b))

function numericEquivalent(a:string,b:string){
  const va=evalExpression(a,{}),vb=evalExpression(b,{})
  return va!==null&&vb!==null&&close(va,vb)
}

function ratioEquivalent(a:string,b:string){
  const aa=splitTopLevel(a,':'),bb=splitTopLevel(b,':')
  if(aa.length!==2||bb.length!==2)return false
  const av=aa.map(x=>evalExpression(x,{})),bv=bb.map(x=>evalExpression(x,{}))
  if(av.some(x=>x===null)||bv.some(x=>x===null))return false
  return close((av[0] as number)*(bv[1] as number),(av[1] as number)*(bv[0] as number))
}

function listEquivalent(a:string,b:string){
  const ordered=/^\(.*\)$/.test(a)||/^\(.*\)$/.test(b)
  const aa=splitTopLevel(a.replace(/^\((.*)\)$/,'$1'),','),bb=splitTopLevel(b.replace(/^\((.*)\)$/,'$1'),',')
  if(aa.length<=1||aa.length!==bb.length)return false
  // 座標など括弧で表す順序付き組は順序を固定する。
  if(aa.every((x,i)=>expressionEquivalent(x,bb[i])))return true
  if(ordered)return false
  // 方程式の複数解など括弧のない列挙は順不同を許容。ただし各要素が数値式として評価できる場合だけ。
  const av=aa.map(x=>evalExpression(x,{})),bv=bb.map(x=>evalExpression(x,{}))
  if(av.some(x=>x===null)||bv.some(x=>x===null))return false
  const as=(av as number[]).sort((x,y)=>x-y),bs=(bv as number[]).sort((x,y)=>x-y)
  return as.every((x,i)=>close(x,bs[i]))
}

function sampledEquivalent(a:string,b:string){
  // 安全に扱える中学数学の代数式だけ。判定不能は false とし、誤った自動正解を避ける。
  if(/[<>=:±,①-⑨アイウエオ]/.test(a+b))return false
  const vars=[...new Set((a+b).match(/[a-z]/g)||[])]
  if(vars.length===0)return numericEquivalent(a,b)
  const samples=[2,3,5,7,11]
  let valid=0
  for(let k=0;k<samples.length;k++){
    const env:Record<string,number>={}
    vars.forEach((v,j)=>env[v]=samples[(k+j)%samples.length]+j)
    const av=evalExpression(a,env),bv=evalExpression(b,env)
    if(av===null||bv===null)continue
    valid++
    if(!close(av,bv))return false
  }
  return valid>=3
}

function expressionEquivalent(a:string,b:string):boolean{
  if(a===b)return true
  if(a.includes(':')||b.includes(':'))return ratioEquivalent(a,b)
  if(a.includes(',')||b.includes(','))return listEquivalent(a,b)
  return sampledEquivalent(a,b)
}

export function isAcceptedAnswer(input:string, answer:string, acceptedAnswers:string[] = []) {
  const normalized = normalizeAnswer(input)
  if(!normalized)return false
  return [answer, ...acceptedAnswers].some(candidate => {
    const expected=normalizeAnswer(candidate)
    if(expected===normalized)return true
    return expressionEquivalent(normalized,expected)
  })
}
