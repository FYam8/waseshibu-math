type Props={sourceQuestionId:string;index:number}
const labelStyle={fontSize:14,fontWeight:700} as const
export default function RemediationFigure({sourceQuestionId,index}:Props){
  if(sourceQuestionId!=='2024-Q1-5')return null
  const common={viewBox:'0 0 320 220',role:'img','aria-label':`2024年度大問1(5)の中心技能に対応する類題${index+1}の模式図`} as const
  return <figure className="remediation-figure">
    {index===0&&<svg {...common}>
      <rect x="60" y="45" width="150" height="150" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M210 45 L80 120 L210 195 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M194 45 v16 h16" fill="none" stroke="currentColor" strokeWidth="2"/>
      <text x="45" y="40" style={labelStyle}>A</text><text x="214" y="40" style={labelStyle}>B</text>
      <text x="214" y="212" style={labelStyle}>C</text><text x="45" y="212" style={labelStyle}>D</text><text x="62" y="124" style={labelStyle}>E</text>
      <text x="160" y="105" style={labelStyle}>60°</text><text x="126" y="66" style={labelStyle}>?</text>
    </svg>}
    {index===1&&<svg {...common}>
      <line x1="35" y1="150" x2="285" y2="150" stroke="currentColor" strokeWidth="2"/>
      <line x1="145" y1="150" x2="80" y2="55" stroke="currentColor" strokeWidth="2"/>
      <line x1="145" y1="150" x2="190" y2="45" stroke="currentColor" strokeWidth="2"/>
      <text x="22" y="168" style={labelStyle}>A</text><text x="140" y="172" style={labelStyle}>B</text><text x="290" y="168" style={labelStyle}>C</text>
      <text x="70" y="48" style={labelStyle}>D</text><text x="194" y="40" style={labelStyle}>E</text>
      <text x="95" y="125" style={labelStyle}>35°</text><text x="135" y="88" style={labelStyle}>60°</text><text x="190" y="130" style={labelStyle}>?</text>
    </svg>}
    {index===2&&<svg {...common}>
      <rect x="60" y="45" width="150" height="150" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M210 45 L80 120 L210 195 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <line x1="210" y1="45" x2="60" y2="195" stroke="currentColor" strokeWidth="2"/>
      <text x="45" y="40" style={labelStyle}>A</text><text x="214" y="40" style={labelStyle}>B</text>
      <text x="214" y="212" style={labelStyle}>C</text><text x="45" y="212" style={labelStyle}>D</text><text x="62" y="124" style={labelStyle}>E</text>
      <text x="150" y="92" style={labelStyle}>45°</text><text x="165" y="115" style={labelStyle}>60°</text><text x="145" y="105" style={labelStyle}>?</text>
    </svg>}
    {index===3&&<svg {...common}>
      <rect x="55" y="55" width="110" height="110" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M55 165 L110 205 L165 165 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <line x1="55" y1="55" x2="110" y2="205" stroke="currentColor" strokeWidth="2"/>
      <text x="42" y="48" style={labelStyle}>A</text><text x="169" y="48" style={labelStyle}>B</text>
      <text x="169" y="162" style={labelStyle}>C</text><text x="42" y="162" style={labelStyle}>D</text><text x="108" y="218" style={labelStyle}>E</text>
      <text x="78" y="181" style={labelStyle}>60°</text><text x="67" y="140" style={labelStyle}>90°</text><text x="48" y="194" style={labelStyle}>?</text>
    </svg>}
    <figcaption>模式図です。長さ・角度・位置は縮尺どおりとは限りません。問題文の条件を基準にしてください。</figcaption>
  </figure>
}
