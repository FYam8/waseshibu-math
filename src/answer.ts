export function normalizeAnswer(value:string) {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g,'')
    .replace(/[−–—]/g,'-')
    .replace(/×/g,'*')
    .replace(/sqrt\(([^()]+)\)/gi,'√$1')
    .replace(/sqrt/gi,'√')
    .replace(/\*?√/g,'√')
    .replace(/\^2/g,'²')
    .replace(/[＝=]/g,'=')
    .replace(/^[A-Za-z]=/,'')
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
