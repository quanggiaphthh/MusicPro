import { runAutoComposition, type AutoComposeInput, type AutoComposeOptions, type AutoComposeResult } from './auto-compose.ts';
import type { AutoComposeEvent } from './types.ts';

export interface StreamAutoComposeOptions extends AutoComposeOptions {
  endpoint?: string;
  fallback?: boolean;
}

type StreamMessage =
  | { type:'event'; event:AutoComposeEvent }
  | { type:'result'; result:AutoComposeResult }
  | { type:'error'; error:{ code?:string; message:string; quality?:unknown; xml?:string } };

function streamError(message:{code?:string;message:string;quality?:unknown;xml?:string}):Error {
  return Object.assign(new Error(message.message||'Auto production stream failed.'),message);
}

/** Prefer one streamed server orchestration request; fall back only when the endpoint is unavailable. */
export async function runAutoCompositionStreamed(input:AutoComposeInput,options:StreamAutoComposeOptions={}):Promise<AutoComposeResult>{
  const fetchImpl=options.fetchImpl||fetch;
  const endpoint=options.endpoint||'/api/compose/run-stream';
  const allowFallback=options.fallback!==false;
  const fallbackRun=async(reason:string)=>{
    await options.onEvent?.({kind:'progress',step:1,progress:1,label:'Chế độ tương thích',detail:reason,at:Date.now()});
    return runAutoComposition(input,options);
  };
  let response:Response;
  try {
    response=await fetchImpl(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/x-ndjson'},body:JSON.stringify({idea:input.idea,styleId:input.styleId,maxQualityRetries:Math.max(0,options.maxQualityRetries??1)}),signal:options.signal});
  } catch (error:any) {
    if(error?.name==='AbortError')throw error;
    const transportError:any=new Error('Mất kết nối khi mở stream. Không tự chạy fallback vì không thể biết server đã bắt đầu generation hay chưa; thao tác này tránh tạo bài trùng/lặp chi phí.');
    transportError.code='STREAM_TRANSPORT_ERROR';
    transportError.cause=error;
    throw transportError;
  }
  if(!response.ok){
    if(allowFallback&&[404,405,501].includes(response.status))return fallbackRun('Server streaming chưa khả dụng; chuyển sang orchestration tương thích với cùng quality contract.');
    const data:any=await response.json().catch(()=>({}));
    throw streamError({code:data?.error?.code,message:data?.error?.message||`HTTP ${response.status}`});
  }
  if(!response.body){
    if(allowFallback)return fallbackRun('Response streaming chưa được trình duyệt/môi trường cung cấp; chuyển sang orchestration tương thích.');
    throw streamError({code:'STREAM_UNAVAILABLE',message:'Trình duyệt không cung cấp response stream.'});
  }
  const reader=response.body.getReader();
  const decoder=new TextDecoder();
  let buffer='',result:AutoComposeResult|undefined;
  const handleLine=async(line:string)=>{
    const trimmed=line.trim(); if(!trimmed)return;
    let message:StreamMessage;
    try{message=JSON.parse(trimmed);}catch{throw streamError({code:'STREAM_PROTOCOL_ERROR',message:'Dữ liệu tiến độ từ server không phải NDJSON hợp lệ.'});}
    if(message.type==='event')await options.onEvent?.(message.event);
    else if(message.type==='result')result=message.result;
    else if(message.type==='error')throw streamError(message.error);
  };
  try {
    while(true){
      const {done,value}=await reader.read();
      buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});
      let index:number;
      while((index=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);await handleLine(line);}
      if(done)break;
    }
    if(buffer.trim())await handleLine(buffer);
    if(!result)throw streamError({code:'STREAM_RESULT_MISSING',message:'Server kết thúc stream nhưng không trả kết quả cuối.'});
    return result;
  } catch (error) {
    try { await reader.cancel(error); } catch { /* best-effort cleanup */ }
    throw error;
  } finally {
    try { reader.releaseLock(); } catch { /* already released/cancelled */ }
  }
}
