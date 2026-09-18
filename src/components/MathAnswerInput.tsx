import { useEffect, useRef } from 'react'
import { cleanAnswerInput } from '../answer'
import { canonicalMathKeys, insertCanonicalMathText, deleteCanonicalMathText } from '../engine/mathInput'

type Props={value:string;onChange:(value:string)=>void;onEnter?:()=>void;disabled?:boolean;autoFocus?:boolean;placeholder?:string}
const keys=canonicalMathKeys

export default function MathAnswerInput({value,onChange,onEnter,disabled,autoFocus,placeholder='答えを入力'}:Props){
  const ref=useRef<HTMLInputElement>(null)
  const selectionRef=useRef({start:value.length,end:value.length})
  useEffect(()=>{if(autoFocus&&!disabled)ref.current?.focus()},[autoFocus,disabled])
  const rememberSelection=(input:HTMLInputElement)=>{
    selectionRef.current={start:input.selectionStart??input.value.length,end:input.selectionEnd??input.value.length}
  }
  const insert=(text:string)=>{
    const input=ref.current
    const edit=insertCanonicalMathText(value,selectionRef.current,text)
    onChange(cleanAnswerInput(edit.value))
    const pos=edit.position
    selectionRef.current={start:pos,end:pos}
    requestAnimationFrame(()=>{input?.focus();input?.setSelectionRange(pos,pos)})
  }
  const backspace=()=>{
    const input=ref.current
    const edit=deleteCanonicalMathText(value,selectionRef.current)
    if(edit.value!==value)onChange(edit.value)
    const pos=edit.position
    selectionRef.current={start:pos,end:pos}
    requestAnimationFrame(()=>{input?.focus();input?.setSelectionRange(pos,pos)})
  }
  const clear=()=>{
    selectionRef.current={start:0,end:0}
    onChange('')
    requestAnimationFrame(()=>{ref.current?.focus();ref.current?.setSelectionRange(0,0)})
  }
  return <div className="math-answer">
    <input ref={ref} className="answer-input" value={value} maxLength={120} onChange={e=>{const cleaned=cleanAnswerInput(e.target.value);const pos=e.target.selectionStart??cleaned.length;selectionRef.current={start:pos,end:e.target.selectionEnd??pos};onChange(cleaned)}} onSelect={e=>rememberSelection(e.currentTarget)} onKeyUp={e=>rememberSelection(e.currentTarget)} onClick={e=>rememberSelection(e.currentTarget)} onKeyDown={e=>{if(e.key==='Enter')onEnter?.()}} placeholder={placeholder} disabled={disabled} autoCapitalize="off" autoCorrect="off" spellCheck={false}/>
    {!disabled&&<div className="math-keypad" aria-label="数式入力補助">{keys.map(k=><button type="button" key={k.label} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(k.text)}>{k.label}</button>)}<button type="button" onPointerDown={e=>e.preventDefault()} onClick={backspace}>⌫</button><button type="button" onPointerDown={e=>e.preventDefault()} onClick={clear}>クリア</button></div>}
    <p className="math-help">入力例：分数 <b>3/5</b>　根号 <b>3√2</b>　座標 <b>(4,3)</b>　比 <b>2:3</b>　範囲 <b>0≦y≦32</b>　<span>全角数字・記号、≤・≥・&lt;=・&gt;=でも採点できます</span></p>
  </div>
}
