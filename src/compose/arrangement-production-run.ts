import { lockLeadMelodyPart } from './master-identity-lock.ts';
import {
  buildProductionReadiness,
  buildQualityRetryFeedback,
  evaluateArrangementQuality,
  evaluateCompositionQuality,
} from './production-quality.ts';
import type { ProductionReadinessReport, QualityReport } from './types.ts';

export interface ArrangementProductionInput {
  leadSheetXml:string;
  arrangePrompt:string;
  arrangeDocRefs:string[];
  songRequest:unknown;
  styleId:string;
  idea:string;
}
export interface ArrangementProductionOptions {
  fetchImpl?:typeof fetch;
  maxQualityRetries?:number;
  signal?:AbortSignal;
  onAttempt?:(info:{attempt:number;phase:'arrange'|'audit'|'retry';detail:string})=>void|Promise<void>;
}
export interface ArrangementProductionResult {
  finalXml:string;
  compositionQuality:QualityReport;
  arrangementQuality:QualityReport;
  readiness:ProductionReadinessReport;
  songDna:unknown;
  blueprint:unknown;
  identityLock:{partId:string;changed:boolean;mode:'lead-part-and-score-part-exact'};
  attempts:number;
}

async function readJson(response:Response):Promise<any>{
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const error:any=new Error(data?.error?.message||data?.error||`HTTP ${response.status}`);error.code=data?.error?.code;throw error;}
  return data;
}
async function post(fetchImpl:typeof fetch,url:string,body:unknown,signal?:AbortSignal):Promise<any>{
  return readJson(await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal}));
}

/** Shared Step-4 runner for Manual Compose and Project Resume. */
export async function runArrangementProduction(input:ArrangementProductionInput,options:ArrangementProductionOptions={}):Promise<ArrangementProductionResult>{
  const fetchImpl=options.fetchImpl||fetch;
  const maxQualityRetries=Math.max(0,Math.min(2,options.maxQualityRetries??1));
  const leadAnalysis=await post(fetchImpl,'/api/music/blueprint',{musicXml:input.leadSheetXml,style:input.styleId,idea:input.idea},options.signal);
  const leadDna=leadAnalysis.songDNA||{};
  const compositionQuality=evaluateCompositionQuality({xml:input.leadSheetXml,songDna:leadDna,songRequest:input.songRequest});
  if(compositionQuality.status!=='PASS')throw Object.assign(new Error('Lead Sheet chưa đạt Composition Quality Gate; dừng trước phối khí.'),{code:'COMPOSITION_QUALITY_FAILED',quality:compositionQuality,xml:input.leadSheetXml});
  const melodyPartId=String(leadDna?.selectedMelodyPartId||'').trim();
  if(!melodyPartId)throw Object.assign(new Error('Không xác định được lead melody part để khóa master identity.'),{code:'MASTER_IDENTITY_PART_NOT_FOUND'});

  const basePrompt=input.arrangePrompt;
  let prompt=basePrompt;
  let finalXml='',finalAnalysis:any=null,arrangementQuality!:QualityReport;
  let identityLock={partId:melodyPartId,changed:false,mode:'lead-part-and-score-part-exact' as const};
  let attempts=0;
  for(let attempt=0;attempt<=maxQualityRetries;attempt++){
    attempts=attempt+1;
    await options.onAttempt?.({attempt:attempt+1,phase:'arrange',detail:attempt?'Đang phối khí lại theo quality feedback.':'Đang tạo bản phối production.'});
    const arranged=await post(fetchImpl,'/api/compose/arrange',{leadSheetXml:input.leadSheetXml,arrangePrompt:prompt,arrangeDocRefs:input.arrangeDocRefs||[],songRequest:input.songRequest,styleId:input.styleId},options.signal);
    const locked=lockLeadMelodyPart({leadXml:input.leadSheetXml,arrangedXml:String(arranged.xml||''),melodyPartId});
    finalXml=locked.xml;identityLock={partId:locked.partId,changed:locked.changed,mode:'lead-part-and-score-part-exact'};
    await options.onAttempt?.({attempt:attempt+1,phase:'audit',detail:'Đang kiểm tra identity, texture, importer safety và production readiness.'});
    finalAnalysis=await post(fetchImpl,'/api/music/blueprint',{musicXml:finalXml,style:input.styleId,idea:input.idea},options.signal);
    arrangementQuality=evaluateArrangementQuality({xml:finalXml,songDna:finalAnalysis.songDNA||{},leadDna,leadXml:input.leadSheetXml,songRequest:input.songRequest});
    if(arrangementQuality.status==='PASS')break;
    if(attempt>=maxQualityRetries)break;
    prompt=`${basePrompt}\n\n${buildQualityRetryFeedback(arrangementQuality)}`;
    await options.onAttempt?.({attempt:attempt+1,phase:'retry',detail:'Bản phối chưa đạt gate; sẽ thử lại toàn bộ Step 4 một lần.'});
  }
  const readiness=buildProductionReadiness(compositionQuality,arrangementQuality);
  return{finalXml,compositionQuality,arrangementQuality,readiness,songDna:finalAnalysis?.songDNA,blueprint:finalAnalysis?.blueprint,identityLock,attempts};
}
