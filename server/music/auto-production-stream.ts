import { runAutoComposition, type AutoComposeInput, type AutoComposeResult } from '../../src/compose/auto-compose.ts';
import type { AutoComposeEvent } from '../../src/compose/types.ts';

export interface ServerAutoProductionDeps {
  prepareComposition:(idea:string,styleId:string)=>Promise<any>;
  generateLeadSheet:(composePrompt:string,composeDocRefs:string[],metaPlan:string,songRequest:unknown,styleId:string)=>Promise<string>;
  generateArrangement:(leadSheetXml:string,arrangePrompt:string,arrangeDocRefs:string[],songRequest:unknown,styleId:string)=>Promise<string>;
  analyze:(musicXml:string,styleId:string,idea:string)=>Promise<any>|any;
}

export interface ServerAutoProductionOptions {
  maxQualityRetries?:number;
  signal?:AbortSignal;
  onEvent?:(event:AutoComposeEvent)=>void|Promise<void>;
}

function jsonResponse(data:unknown,status=200):Response{
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
}

/** Run the same quality-enforced orchestration server-side without HTTP hops between steps. */
export async function runServerAutoProduction(input:AutoComposeInput,deps:ServerAutoProductionDeps,options:ServerAutoProductionOptions={}):Promise<AutoComposeResult>{
  const fakeFetch:any=async(url:string,init?:RequestInit)=>{
    if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
    const body=typeof init?.body==='string'?JSON.parse(init.body):{};
    try{
      if(url==='/api/compose/prepare')return jsonResponse(await deps.prepareComposition(body.idea,body.styleId));
      if(url==='/api/compose/lead-sheet')return jsonResponse({xml:await deps.generateLeadSheet(body.composePrompt,body.composeDocRefs||[],body.metaPlan||'',body.songRequest,body.styleId)});
      if(url==='/api/compose/arrange')return jsonResponse({xml:await deps.generateArrangement(body.leadSheetXml,body.arrangePrompt,body.arrangeDocRefs||[],body.songRequest,body.styleId)});
      if(url==='/api/music/blueprint')return jsonResponse(await deps.analyze(body.musicXml,body.style,body.idea));
      return jsonResponse({error:{code:'AUTO_STREAM_ROUTE_UNKNOWN',message:`Unsupported internal route ${url}`}},404);
    }catch(error:any){return jsonResponse({error:{code:error?.code||'AUTO_STREAM_OPERATION_FAILED',message:error?.message||'Auto production operation failed.'}},500);}
  };
  return runAutoComposition(input,{fetchImpl:fakeFetch,onEvent:options.onEvent,maxQualityRetries:options.maxQualityRetries,signal:options.signal});
}

function writeLine(res:any,message:unknown):void{
  if(res.writableEnded||res.destroyed)return;
  res.write(`${JSON.stringify(message)}\n`);
  if(typeof res.flush==='function')res.flush();
}

/** Express-compatible streamed endpoint using newline-delimited JSON (NDJSON). */
export function createAutoProductionStreamHandler(deps:ServerAutoProductionDeps){
  return async(req:any,res:any)=>{
    const idea=String(req.body?.idea||'').trim();
    const styleId=String(req.body?.styleId||'STYLE.VN.VPOP-BALLAD');
    const maxQualityRetries=Math.max(0,Math.min(2,Number(req.body?.maxQualityRetries??1)||0));
    if(!idea)return res.status(400).json({error:{code:'IDEA_REQUIRED',message:'Idea is required'}});
    res.status(200);
    res.setHeader('Content-Type','application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control','no-cache, no-transform');
    res.setHeader('Connection','keep-alive');
    res.setHeader('X-Accel-Buffering','no');
    if(typeof res.flushHeaders==='function')res.flushHeaders();
    const abort=new AbortController();
    res.on?.('close',()=>{if(!res.writableEnded)abort.abort();});
    try{
      const result=await runServerAutoProduction({idea,styleId},deps,{maxQualityRetries,signal:abort.signal,onEvent:event=>writeLine(res,{type:'event',event})});
      writeLine(res,{type:'result',result});
    }catch(error:any){
      writeLine(res,{type:'error',error:{code:error?.code||'AUTO_PRODUCTION_FAILED',message:error?.message||'Auto production failed.',quality:error?.quality,xml:error?.xml}});
    }finally{
      if(!res.writableEnded)res.end();
    }
  };
}
