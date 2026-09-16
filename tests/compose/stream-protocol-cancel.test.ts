import { runAutoCompositionStreamed } from '../../src/compose/stream-auto-compose.ts';
let cancelled=false,released=false;
const reader={
  async read(){return {done:false,value:new TextEncoder().encode('{broken}\n')}} ,
  async cancel(){cancelled=true},
  releaseLock(){released=true},
};
const fakeFetch:any=async()=>({ok:true,status:200,body:{getReader:()=>reader}});
let failed=false;try{await runAutoCompositionStreamed({idea:'x',styleId:'STYLE.VN.VPOP-BALLAD'},{fetchImpl:fakeFetch,fallback:false})}catch{failed=true}
if(!failed)throw new Error('invalid protocol must fail');
if(!cancelled||!released)throw new Error(`reader cleanup missing cancel=${cancelled} release=${released}`);
console.log('PASS stream-protocol-cancel');
