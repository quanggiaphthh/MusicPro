import { evaluateCompositionQuality } from './production-quality.ts';
import type { QualityReport } from './types.ts';

export interface CompositionProductionInput {
  composePrompt:string;
  composeDocRefs:string[];
  metaPlan:string;
  songRequest:unknown;
  styleId:string;
  idea:string;
}
export interface CompositionProductionOptions {
  fetchImpl?:typeof fetch;
  maxQualityRetries?:number;
  signal?:AbortSignal;
  onAttempt?:(info:{attempt:number;phase:'compose'|'audit'|'retry';detail:string})=>void|Promise<void>;
}
export interface CompositionProductionResult {
  leadSheetXml:string;
  compositionQuality:QualityReport;
  songDna:unknown;
  blueprint:unknown;
  attempts:number;
}

async function readJson(response:Response):Promise<any>{
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const error:any=new Error(data?.error?.message||data?.error||`HTTP ${response.status}`);error.code=data?.error?.code;error.diagnostics=data?.error?.diagnostics;throw error;}
  return data;
}
async function post(fetchImpl:typeof fetch,url:string,body:unknown,signal?:AbortSignal):Promise<any>{
  return readJson(await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal}));
}

/** Shared Step-3 production runner for Manual Compose. Returns the best final candidate even when the quality gate stays FAIL. */
export async function runCompositionProduction(input:CompositionProductionInput,options:CompositionProductionOptions={}):Promise<CompositionProductionResult>{
  const fetchImpl=options.fetchImpl||fetch;
  const prompt=input.composePrompt;
  await options.onAttempt?.({attempt:1,phase:'compose',detail:'Đang tạo Lead Sheet production.'});
  const lead=await post(fetchImpl,'/api/compose/lead-sheet',{
    composePrompt:prompt,composeDocRefs:input.composeDocRefs||[],metaPlan:input.metaPlan||'',songRequest:input.songRequest,styleId:input.styleId,
  },options.signal);
  const leadSheetXml=String(lead.xml||'');
  await options.onAttempt?.({attempt:1,phase:'audit',detail:'Đang trích SongDNA và kiểm Composition Quality Gate.'});
  const analysis=await post(fetchImpl,'/api/music/blueprint',{musicXml:leadSheetXml,style:input.styleId,idea:input.idea},options.signal);
  const compositionQuality=evaluateCompositionQuality({xml:leadSheetXml,songDna:analysis.songDNA||{},songRequest:input.songRequest});
  return{leadSheetXml,compositionQuality,songDna:analysis?.songDNA,blueprint:analysis?.blueprint,attempts:1};
}
