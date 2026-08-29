import { backupStats, collectBackup, restoreBackup, type BackupPackage, type StorageLike } from './dataBackup'
import { APP_VERSION } from './version'

export type RestoreReason='pre_upgrade'|'daily'|'exam_complete'|'before_import'|'manual'
export type RestorePoint={id:string;createdAt:string;reason:RestoreReason;appVersion:string;dataVersion:number;checksum:string;payload:BackupPackage;pinned:boolean}
const DB_NAME='waseshibu-math-safety',STORE='restorePoints',FALLBACK_KEY='waseshibu-math-auto-restore-points-v1',DAILY_KEY='waseshibu-math-last-daily-snapshot'

const stable=(value:unknown):string=>{
  if(Array.isArray(value))return `[${value.map(stable).join(',')}]`
  if(value&&typeof value==='object')return `{${Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${stable(v)}`).join(',')}}`
  return JSON.stringify(value)
}
async function checksum(value:unknown){
  const text=stable(value)
  if(typeof crypto!=='undefined'&&crypto.subtle){const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(data)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}return `fnv-${(hash>>>0).toString(16)}`
}
const newId=()=>typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`restore-${Date.now()}-${Math.random().toString(36).slice(2)}`

function openDb():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return}let settled=false;const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'id'})};request.onsuccess=()=>{if(settled){request.result.close();return}settled=true;resolve(request.result)};request.onerror=()=>{if(!settled){settled=true;reject(request.error||new Error('IndexedDB open failed'))}};request.onblocked=()=>{if(!settled){settled=true;reject(new Error('IndexedDB open blocked'))}}})
}
async function idbPut(point:RestorePoint){const db=await openDb();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(point);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('IndexedDB write failed'));tx.onabort=()=>reject(tx.error||new Error('IndexedDB write aborted'))})}finally{db.close()}}
async function idbAll(){const db=await openDb();try{return await new Promise<RestorePoint[]>((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).getAll();request.onsuccess=()=>resolve(request.result as RestorePoint[]);request.onerror=()=>reject(request.error||new Error('IndexedDB read failed'))})}finally{db.close()}}
async function idbDelete(id:string){const db=await openDb();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('IndexedDB delete failed'));tx.onabort=()=>reject(tx.error||new Error('IndexedDB delete aborted'))})}finally{db.close()}}

function fallbackAll(storage:StorageLike=localStorage):RestorePoint[]{try{const parsed=JSON.parse(storage.getItem(FALLBACK_KEY)||'[]');return Array.isArray(parsed)?parsed:[]}catch{return []}}
function fallbackSave(points:RestorePoint[],storage:StorageLike=localStorage){storage.setItem(FALLBACK_KEY,JSON.stringify(points))}
async function allPoints(storage:StorageLike=localStorage){
  const fallback=fallbackAll(storage)
  try{return [...new Map([...(await idbAll()),...fallback].map(point=>[point.id,point])).values()]}catch{return fallback}
}
async function savePoint(point:RestorePoint,storage:StorageLike=localStorage){try{await idbPut(point)}catch{const points=fallbackAll(storage).filter(x=>x.id!==point.id);points.push(point);fallbackSave(points,storage)}}
async function deletePoint(id:string,storage:StorageLike=localStorage){try{await idbDelete(id)}catch{/* fallback still needs cleanup */}fallbackSave(fallbackAll(storage).filter(x=>x.id!==id),storage)}

async function cleanup(storage:StorageLike=localStorage){
  const points=(await allPoints(storage)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),pinned=points.filter(x=>x.pinned).slice(0,2),others=points.filter(x=>!x.pinned),keep=new Set([...pinned,...others].slice(0,5).map(x=>x.id))
  for(const point of points)if(!keep.has(point.id))await deletePoint(point.id,storage)
}

export async function createRestorePoint(reason:RestoreReason,storage:StorageLike=localStorage,pinned=reason==='pre_upgrade'){
  const payload=collectBackup(storage),point:RestorePoint={id:newId(),createdAt:new Date().toISOString(),reason,appVersion:APP_VERSION,dataVersion:payload.dataVersion,checksum:await checksum(payload),payload,pinned}
  await savePoint(point,storage)
  const verified=(await allPoints(storage)).find(x=>x.id===point.id)
  if(!verified||verified.checksum!==await checksum(verified.payload))throw new Error('自動復元ポイントを検証できませんでした')
  await cleanup(storage);return point
}
export async function listRestorePoints(storage:StorageLike=localStorage){return (await allPoints(storage)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}
export async function getRestorePoint(id:string,storage:StorageLike=localStorage){const point=(await allPoints(storage)).find(x=>x.id===id);if(!point)throw new Error('復元ポイントが見つかりません');if(point.checksum!==await checksum(point.payload))throw new Error('復元ポイントが壊れています');return point}
export async function restorePointPayload(id:string,storage:StorageLike=localStorage){const point=await getRestorePoint(id,storage);restoreBackup(storage,point.payload,'replace');return point}
export async function restoreFromPoint(id:string,storage:StorageLike=localStorage){const point=await getRestorePoint(id,storage),current=await createRestorePoint('manual',storage);restoreBackup(storage,point.payload,'replace');return {restored:point,current}}
export async function removeRestorePoint(id:string,storage:StorageLike=localStorage){await deletePoint(id,storage)}
export async function createDailyRestorePoint(storage:StorageLike=localStorage){const today=new Date().toISOString().slice(0,10);if(storage.getItem(DAILY_KEY)===today)return null;const stats=backupStats(collectBackup(storage));if(stats.attempts+stats.scores+stats.drafts===0&&!stats.prepStarted)return null;const point=await createRestorePoint('daily',storage,false);storage.setItem(DAILY_KEY,today);return point}
export function downloadRestorePoint(point:RestorePoint){const blob=new Blob([JSON.stringify(point.payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`waseshibu-math-restore-${point.createdAt.slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
