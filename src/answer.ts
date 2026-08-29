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
    .replace(/sqrt\(([^()]+)\)/gi,'√$1')
    .replace(/sqrt/gi,'√')
    .replace(/√\(([^()]+)\)/g,'√$1')
    .replace(/\*?√/g,'√')
    .replace(/\^2/g,'²')
    .replace(/[≤≦]/g,'<=' )
    .replace(/[≥≧]/g,'>=')
    .replace(/、/g,',')
    .replace(/[＝=]/g,'=')
    .replace(/^[a-z]=/,'')
    .replace(/(?:円|度|°|秒|平方センチメートル|平方cm|cm²|cm2|cm|m²|m2|m)$/i,'')
}

export function cleanAnswerInput(value:string){
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').replace(/[\r\n\t]/g,' ').slice(0,120)
}

export function isAcceptedAnswer(input:string, answer:string, acceptedAnswers:string[] = []) {
  const normalized = normalizeAnswer(input)
  return [answer, ...acceptedAnswers].some(candidate => {
    const expected=normalizeAnswer(candidate)
    if(expected===normalized)return true
    const numeric=(value:string)=>{
      if(/^[-+]?\d+(?:\.\d+)?$/.test(value))return Number(value)
      const fraction=value.match(/^([-+]?\d+(?:\.\d+)?)\/([-+]?\d+(?:\.\d+)?)$/)
      if(fraction&&Number(fraction[2])!==0)return Number(fraction[1])/Number(fraction[2])
      return null
    }
    const a=numeric(normalized),b=numeric(expected)
    return a!==null&&b!==null&&Math.abs(a-b)<1e-10
  })
}
