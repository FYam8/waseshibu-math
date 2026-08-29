import { useEffect, useRef } from 'react'
import { cleanAnswerInput } from '../answer'

type Props={value:string;onChange:(value:string)=>void;onEnter?:()=>void;disabled?:boolean;autoFocus?:boolean;placeholder?:string}
const keys=[{label:'分数 a/b',text:'/'},{label:'√',text:'√()'},{label:'x²',text:'^2'},{label:'( )',text:'()'},{label:'−',text:'-'},{label:'±',text:'±'},{label:'π',text:'π'},{label:':',text:':'},{label:',',text:','}]

export default function MathAnswerInput({value,onChange,onEnter,disabled,autoFocus,placeholder='答えを入力'}:Props){
  const ref=useRef<HTMLInputElement>(null)
  useEffect(()=>{if(autoFocus&&!disabled)ref.current?.focus()},[autoFocus,disabled])
  const insert=(text:string)=>{
    const input=ref.current,start=input?.selectionStart??value.length,end=input?.selectionEnd??value.length
    onChange(cleanAnswerInput(value.slice(0,start)+text+value.slice(end)))
    const pos=start+text.length-(text.endsWith('()')?1:0)
    requestAnimationFrame(()=>{input?.focus();input?.setSelectionRange(pos,pos)})
  }
  const backspace=()=>{
    const input=ref.current,start=input?.selectionStart??value.length,end=input?.selectionEnd??value.length
    if(start!==end)onChange(value.slice(0,start)+value.slice(end));else if(start>0)onChange(value.slice(0,start-1)+value.slice(start))
    requestAnimationFrame(()=>{input?.focus();input?.setSelectionRange(Math.max(0,start-1),Math.max(0,start-1))})
  }
  return <div className="math-answer">
    <input ref={ref} className="answer-input" value={value} maxLength={120} onChange={e=>onChange(cleanAnswerInput(e.target.value))} onKeyDown={e=>{if(e.key==='Enter')onEnter?.()}} placeholder={placeholder} disabled={disabled} autoCapitalize="off" autoCorrect="off" spellCheck={false}/>
    {!disabled&&<div className="math-keypad" aria-label="数式入力補助">{keys.map(k=><button type="button" key={k.label} onClick={()=>insert(k.text)}>{k.label}</button>)}<button type="button" onClick={backspace}>⌫</button><button type="button" onClick={()=>onChange('')}>クリア</button></div>}
    <p className="math-help">入力例：分数 <b>3/5</b>　根号 <b>3√2</b>　座標 <b>(4,3)</b>　比 <b>2:3</b>　<span>全角数字・記号でも採点できます</span></p>
  </div>
}
