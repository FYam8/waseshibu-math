export function normalizeAnswer(value:string) {
  return value
    // Preserve the exponent before NFKC turns the superscript into a plain digit.
    .replace(/²/g,'^2')
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
    return power()
  }
  const power=():number|null=>{
    let left=primary()
    if(left===null)return null
    if(tokens[i]?.kind==='op'&&tokens[i].value==='^'){
      i++
      const right=unary()
      if(right===null)return null
      left=Math.pow(left,right)
    }
    return Number.isFinite(left)?left:null
  }
  const mul=():number|null=>{
    let left=unary()
    if(left===null)return null
    while(tokens[i]?.kind==='op'&&(tokens[i].value==='*'||tokens[i].value==='/')){
      const op=tokens[i++].value,right=unary()
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

const gcd=(a:number,b:number):number=>b?gcd(b,a%b):Math.abs(a)

export function hasNonCanonicalFinalForm(value:string){
  const normalized=normalizeAnswer(value)
  for(const match of normalized.matchAll(/(-?\d+)\/(\d+)/g)){
    const a=Number(match[1]),b=Number(match[2])
    if(b===0||gcd(a,b)!==1)return true
  }
  const ratio=normalized.match(/^(-?\d+):(-?\d+)$/)
  if(ratio&&gcd(Number(ratio[1]),Number(ratio[2]))!==1)return true
  if(/\/[^,]*√/.test(normalized))return true
  for(const match of normalized.matchAll(/√\(?([0-9]+)\)?/g)){
    const n=Number(match[1])
    for(let k=2;k*k<=n;k++)if(n%(k*k)===0)return true
  }
  return false
}

const trailingUnitPattern=/(平方センチメートル|平方cm|cm[²2]|m[²2]|cm|m|円|度|°|秒)$/i
export function trailingAnswerUnit(value:string){
  const match=value.normalize('NFKC').toLowerCase().trim().replace(/\s+/g,'').match(trailingUnitPattern)
  if(!match)return null
  const unit=match[1].toLowerCase()
  if(unit==='度'||unit==='°')return '°'
  if(unit==='平方センチメートル'||unit==='平方cm'||unit==='cm2'||unit==='cm²')return 'cm²'
  if(unit==='m2'||unit==='m²')return 'm²'
  return unit
}

function numericEquivalent(a:string,b:string){
  const va=evalExpression(a,{}),vb=evalExpression(b,{})
  return va!==null&&vb!==null&&close(va,vb)
}

function ratioEquivalent(a:string,b:string){
  const aa=splitTopLevel(a,':'),bb=splitTopLevel(b,':')
  if(aa.length!==2||bb.length!==2)return false
  const av=aa.map(x=>evalExpression(x,{})),bv=bb.map(x=>evalExpression(x,{}))
  if(av.some(x=>x===null)||bv.some(x=>x===null))return false
  // 0:0 has no defined ratio; cross multiplication alone accepts every ratio.
  if((av[0]===0&&av[1]===0)||(bv[0]===0&&bv[1]===0))return false
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

// Compare coefficients exactly. A finite collection of substitutions cannot
// establish an identity. Unsupported forms must use an explicit accepted alias.
type Fraction={n:bigint;d:bigint}
type Polynomial=Map<string,Fraction>
function exactPolynomial(value:string):Polynomial|null{
  if(value.length>240)return null
  const tokens=tokenizeExpression(value)
  if(!tokens||tokens.length>160)return null
  const abs=(n:bigint)=>n<0n?-n:n
  const gcdBig=(a:bigint,b:bigint):bigint=>b?gcdBig(b,a%b):abs(a)
  const fraction=(n:bigint,d=1n):Fraction=>{
    if(!d)throw Error('zero denominator')
    if(d<0n){n=-n;d=-d}
    const g=gcdBig(n,d);return {n:n/g,d:d/g}
  }
  const scalar=(v:Fraction):Polynomial=>new Map(v.n?[['',v]]:[])
  const one=()=>scalar(fraction(1n))
  const add=(a:Polynomial,b:Polynomial,sign=1n):Polynomial=>{
    const out=new Map(a)
    for(const[k,v]of b){const u=out.get(k)||fraction(0n),w=fraction(u.n*v.d+sign*v.n*u.d,u.d*v.d);if(w.n)out.set(k,w);else out.delete(k)}
    if(out.size>128)throw Error('too many terms')
    return out
  }
  const multiply=(a:Polynomial,b:Polynomial):Polynomial=>{
    let out:Polynomial=new Map()
    for(const[ka,u]of a)for(const[kb,v]of b){const k=(ka+kb).split('').sort().join('');if(k.length>12)throw Error('degree limit');out=add(out,new Map([[k,fraction(u.n*v.n,u.d*v.d)]]))}
    return out
  }
  const constant=(p:Polynomial):Fraction=>{
    if([...p.keys()].some(k=>k!==''))throw Error('nonconstant divisor or exponent')
    return p.get('')||fraction(0n)
  }
  let i=0
  const primary=():Polynomial=>{
    const t=tokens[i++]
    if(!t)throw Error('missing operand')
    if(t.kind==='num'){const [whole,decimal='']=t.value.split('.');return scalar(fraction(BigInt((whole||'0')+decimal),10n**BigInt(decimal.length)))}
    if(t.kind==='var')return new Map([[t.value,fraction(1n)]])
    if(t.kind==='l'){const p=sum();if(tokens[i++]?.kind!=='r')throw Error('unclosed group');return p}
    throw Error('unsupported operand')
  }
  const unary=():Polynomial=>{
    if(tokens[i]?.kind==='op'&&['+','-'].includes(tokens[i].value)){const s=tokens[i++].value;const p=unary();return s==='-'?multiply(scalar(fraction(-1n)),p):p}
    return power()
  }
  const power=():Polynomial=>{
    let p=primary()
    if(tokens[i]?.value==='^'){i++;const e=constant(unary());if(e.d!==1n||e.n<0n||e.n>12n)throw Error('unsupported exponent');const base=p;p=one();for(let n=0n;n<e.n;n++)p=multiply(p,base)}
    return p
  }
  const product=():Polynomial=>{
    let p=unary()
    while(tokens[i]?.kind==='op'&&['*','/'].includes(tokens[i].value)){const op=tokens[i++].value,q=unary();if(op==='*')p=multiply(p,q);else{const d=constant(q);p=multiply(p,scalar(fraction(d.d,d.n)))}}
    return p
  }
  const sum=():Polynomial=>{
    let p=product()
    while(tokens[i]?.kind==='op'&&['+','-'].includes(tokens[i].value)){const sign=tokens[i++].value==='+'?1n:-1n;p=add(p,product(),sign)}
    return p
  }
  try{const p=sum();return i===tokens.length?p:null}catch{return null}
}

function algebraicallyEquivalent(a:string,b:string){
  if(/[<>=:±,①-⑨アイウエオ]/.test(a+b))return false
  if(!/[a-z]/.test(a+b))return numericEquivalent(a,b)
  const left=exactPolynomial(a),right=exactPolynomial(b)
  return left!==null&&right!==null&&left.size===right.size&&[...left].every(([k,v])=>{const w=right.get(k);return w!==undefined&&v.n===w.n&&v.d===w.d})
}


function expressionEquivalent(a:string,b:string):boolean{
  if(a===b)return true
  if(a.includes(':')||b.includes(':'))return ratioEquivalent(a,b)
  if(a.includes(',')||b.includes(','))return listEquivalent(a,b)
  return algebraicallyEquivalent(a,b)
}

export function isAcceptedAnswer(input:string, answer:string, acceptedAnswers:string[] = []) {
  const normalized = normalizeAnswer(input)
  if(!normalized)return false
  return [answer, ...acceptedAnswers].some(candidate => {
    const expected=normalizeAnswer(candidate)
    if(expected===normalized)return true
    // A bare accepted alias must not turn an ordered coordinate into a solution set.
    const canonical=normalizeAnswer(answer)
    if(/^\(.*,.+\)$/.test(canonical)){
      const tuple=(value:string)=>value.startsWith('(')&&value.endsWith(')')?value:`(${value})`
      return expressionEquivalent(tuple(normalized),tuple(expected))
    }
    return expressionEquivalent(normalized,expected)
  })
}
