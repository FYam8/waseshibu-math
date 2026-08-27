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
  return [answer, ...acceptedAnswers].some(candidate => normalizeAnswer(candidate) === normalized)
}
