export interface EtaStorageLike {
  getItem(key:string):string|null;
  setItem(key:string,value:string):void;
}

const KEY='music-pro:auto-compose-eta:v1';
const DEFAULT_SECONDS=240;

interface EtaRecord { samples:number; ewmaSeconds:number; updatedAt:number; }

function safeStorage(storage?:EtaStorageLike):EtaStorageLike|undefined {
  if(storage)return storage;
  try { return typeof localStorage!=='undefined'?localStorage:undefined; } catch { return undefined; }
}
function clampSeconds(value:number):number { return Math.max(60,Math.min(900,Math.round(value))); }

export function readEtaEstimate(storage?:EtaStorageLike):number {
  const target=safeStorage(storage); if(!target)return DEFAULT_SECONDS;
  try { const parsed=JSON.parse(target.getItem(KEY)||'null') as EtaRecord|null; if(!parsed||!Number.isFinite(parsed.ewmaSeconds)||parsed.ewmaSeconds<=0)return DEFAULT_SECONDS; return clampSeconds(parsed.ewmaSeconds); } catch { return DEFAULT_SECONDS; }
}

export function recordEtaSample(seconds:number,storage?:EtaStorageLike):number {
  if(!Number.isFinite(seconds)||seconds<=0)return readEtaEstimate(storage);
  const target=safeStorage(storage); const sample=clampSeconds(seconds); if(!target)return sample;
  let current:EtaRecord|null=null; try { current=JSON.parse(target.getItem(KEY)||'null'); } catch { current=null; }
  const samples=Number(current?.samples||0); const previous=Number(current?.ewmaSeconds||0);
  const alpha=samples<=0?1:.28; const ewma=samples<=0?sample:previous*(1-alpha)+sample*alpha;
  const next:EtaRecord={samples:samples+1,ewmaSeconds:clampSeconds(ewma),updatedAt:Date.now()};
  try { target.setItem(KEY,JSON.stringify(next)); } catch { /* ETA persistence is best-effort and must never fail a successful composition run. */ }
  return next.ewmaSeconds;
}
