import { isAcceptedAnswer, normalizeAnswer } from './answer'
import type { Level2Question } from './data/level2Data'

const gcd=(a:number,b:number):number=>b?gcd(b,a%b):Math.abs(a)
function hasUnreducedFraction(value:string){
  for(const match of value.matchAll(/(-?\d+)\/(\d+)/g)){
    const a=Number(match[1]),b=Number(match[2]);if(b===0||gcd(a,b)!==1)return true
  }
  return false
}
function hasNonSimplestRatio(value:string){
  const m=value.match(/^(-?\d+):(-?\d+)$/);return !!m&&gcd(Number(m[1]),Number(m[2]))!==1
}
function hasRationalizableDenominator(value:string){return /\/[^,]*√/.test(value)}
function hasReducibleRadical(value:string){
  for(const match of value.matchAll(/√\(?([0-9]+)\)?/g)){
    const n=Number(match[1]);for(let k=2;k*k<=n;k++)if(n%(k*k)===0)return true
  }
  return false
}

function unorderedElements(value:string,type:string){
  const cleaned=normalizeAnswer(value).replace(/^[a-z]=/i,'')
  return type==='unorderedChoiceSet'?cleaned.split(/[,*\s]+/).filter(Boolean):cleaned.split(',').map(x=>x.replace(/^[a-z]=/i,'')).filter(Boolean)
}
function sameUnorderedElements(input:string,elements:string[],type:string){
  const actual=unorderedElements(input,type)
  if(actual.length!==elements.length)return false
  const remaining=[...elements]
  for(const value of actual){
    const index=remaining.findIndex(expected=>isAcceptedAnswer(value,expected))
    if(index<0)return false
    remaining.splice(index,1)
  }
  return remaining.length===0
}
function trianglePairKey(left:string[],right:string[]){
  const variants:string[]=[]
  for(let shift=0;shift<3;shift++){
    const a=[...left.slice(shift),...left.slice(0,shift)],b=[...right.slice(shift),...right.slice(0,shift)]
    variants.push(`${a.join('')}~${b.join('')}`,`${b.join('')}~${a.join('')}`)
    const ar=[a[0],a[2],a[1]],br=[b[0],b[2],b[1]]
    variants.push(`${ar.join('')}~${br.join('')}`,`${br.join('')}~${ar.join('')}`)
  }
  return variants.sort()[0]
}
function sameTrianglePairs(input:string,pairs:Array<{left:string[];right:string[]}>) {
  const tokens=input.normalize('NFKC').toUpperCase().replace(/\s|△/g,'').match(/[A-Z]{3}[~∽][A-Z]{3}/g)||[]
  if(tokens.length!==pairs.length)return false
  const actual=tokens.map(token=>{const [left,right]=token.split(/[~∽]/);return trianglePairKey([...left],[...right])}).sort()
  const expected=pairs.map(pair=>trianglePairKey(pair.left,pair.right)).sort()
  return actual.every((value,index)=>value===expected[index])
}

export function isAcceptedLevel2Answer(input:string,question:Level2Question){
  const normalized=normalizeAnswer(input),listed=[question.answer,...(question.acceptedAnswers||[])].map(normalizeAnswer)
  if(listed.includes(normalized))return true
  if(hasUnreducedFraction(normalized)||hasNonSimplestRatio(normalized)||hasRationalizableDenominator(normalized)||hasReducibleRadical(normalized))return false
  const spec=question.answerSpec
  if(spec?.elements&&['unorderedSolutionSet','unorderedSet','unorderedChoiceSet'].includes(spec.type))return sameUnorderedElements(input,spec.elements,spec.type)
  if(spec?.type==='similarTrianglePairs'&&spec.pairs)return sameTrianglePairs(input,spec.pairs)
  return isAcceptedAnswer(input,question.answer,question.acceptedAnswers)
}
