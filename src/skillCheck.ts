import { isAcceptedAnswer } from './answer'
import { canWriteLearningData, notifyWriteBlocked } from './version'
import type { CheckBank, CheckItem } from './data/skillChecks'
export const SKILL_CHECK_KEY='waseshibu-math-skill-checks-v1'
export type CheckResult={answer:string;correct:boolean;at:string}
export type CheckRecords=Record<string,CheckResult>
export const checkKey=(source:string,item:CheckItem)=>`${source}::${item.id}`
export function loadChecks():CheckRecords{
 try {const data=JSON.parse(localStorage.getItem(SKILL_CHECK_KEY)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?Object.fromEntries(Object.entries(data).filter(([,v]:[string,any])=>v&&typeof v.answer==='string'&&typeof v.correct==='boolean'&&typeof v.at==='string')) as CheckRecords:{} }catch{return {}}
}
export function saveCheck(source:string,item:CheckItem,answer:string):boolean{
 if(!canWriteLearningData()){notifyWriteBlocked();return false}
 const records=loadChecks(),key=checkKey(source,item)
 if(records[key])return true
 const correct=item.choices?answer===item.answer:isAcceptedAnswer(answer,item.answer)
 records[key]={answer,correct,at:new Date().toISOString()}
 try{localStorage.setItem(SKILL_CHECK_KEY,JSON.stringify(records));return true}catch{return false}
}
export function nextCheck(bank:CheckBank,source:string,records:CheckRecords):CheckItem|null{
 for(let i=0;i<bank.checks.length;i++){
  const result=records[checkKey(source,bank.checks[i])]
  if(!result)return bank.checks[i]
  if(!result.correct)return records[checkKey(source,bank.support[i])]?null:bank.support[i]
 }
 return records[checkKey(source,bank.transfer)]?null:bank.transfer
}
export function checkSummary(bank:CheckBank,source:string,records:CheckRecords){
 const failed=bank.checks.findIndex(item=>records[checkKey(source,item)]?.correct===false)
 if(failed>=0)return `${bank.label}の確認${failed+1}で誤答がありました。${records[checkKey(source,bank.support[failed])]?.correct?'説明後の別問題は正解しました。':'問題の手順を一つずつ確認しましょう。'}元の誤答原因は断定せず、この手順を補強します。`
 const transfer=records[checkKey(source,bank.transfer)]
 return transfer?.correct?'今回の短い確認と別設定の問題は正解しました。元の問題を補助なしで解き直しましょう。初見入試や長期定着の評価ではありません。':'短い確認は正解しましたが、別設定の問題で誤答がありました。条件を式へ置き換える手順から確認しましょう。'
}
