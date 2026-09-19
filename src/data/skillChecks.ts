export type CheckItem={id:string;prompt:string;answer:string;choices?:string[];explanation:string}
export type CheckBank={id:string;label:string;sourceIds:string[];checks:CheckItem[];support:CheckItem[];transfer:CheckItem}
export const skillCheckBanks:CheckBank[]=[{
 id:'signed-calculation-v1',label:'符号と計算の順序',sourceIds:['2024-Q1-1'],
 checks:[
 {id:'sign',prompt:'8−(−5) を計算してください。',answer:'13',explanation:'負の数を引くときは足し算に変わります。8−(−5)=8+5=13。'},
 {id:'order',prompt:'20−{4−(6−9)×2} を計算してください。',answer:'10',explanation:'6−9=−3、−3×2=−6、4−(−6)=10、20−10=10。'}],
 support:[
 {id:'sign-practice',prompt:'−7−(−12) を計算してください。',answer:'5',explanation:'−7+12=5。引く数全体の符号を変えます。'},
 {id:'order-practice',prompt:'12−{3−(5−8)×2} を計算してください。',answer:'3',explanation:'5−8=−3、−3×2=−6、3−(−6)=9、12−9=3。'}],
 transfer:{id:'transfer',prompt:'式の値が18になるように、□に入る数を求めてください。30−{□−(4−7)×2}=18',answer:'6',explanation:'4−7=−3なので30−(□+6)=18。□+6=12より□=6。'}
},{
 id:'proportional-model-v1',label:'数量の関係と立式',sourceIds:['2022-Q3-2-i'],
 checks:[
 {id:'model',prompt:'Aは1箱x円、Bは1箱がAの2倍の値段です。AとBをそれぞれ3箱買い、合計900円でした。正しい式を選んでください。',answer:'3(x+2x)=900',choices:['3x+2x=900','3(x+2x)=900','3(x+2)=900'],explanation:'Bの1箱は2x円。AとBを1箱ずつでx+2x円、それを3組買うので3(x+2x)=900。'},
 {id:'solve',prompt:'4(x+2x)=1440 を解いて、xの値を答えてください。',answer:'120',explanation:'かっこ内は3x。4×3x=12x=1440よりx=120。'}],
 support:[
 {id:'model-practice',prompt:'Aは1個x円、Bは1個がAの3倍です。それぞれ2個ずつで800円でした。正しい式を選んでください。',answer:'2(x+3x)=800',choices:['2x+3x=800','2(x+3)=800','2(x+3x)=800'],explanation:'1組がx+3x円、2組で2(x+3x)=800。'},
 {id:'solve-practice',prompt:'2(x+3x)=800 を解いて、xの値を答えてください。',answer:'100',explanation:'2×4x=8x=800よりx=100。'}],
 transfer:{id:'transfer',prompt:'短いリボン1本の長さは長いリボンの半分です。短いもの3本と長いもの2本で合計140cmでした。短いリボン1本は何cmですか。',answer:'20',explanation:'短いものをx cmとすると長いものは2x cm。3x+2×2x=140より7x=140、x=20。'}
}]
export const bankForSource=(source:string)=>skillCheckBanks.find(bank=>bank.sourceIds.includes(source))
