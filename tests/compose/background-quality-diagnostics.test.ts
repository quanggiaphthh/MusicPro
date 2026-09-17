import { createBackgroundRunRegistry } from '../../server/music/auto-production-runs.ts';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

const quality={
  status:'FAIL' as const,
  score:74,
  summary:'Composition Quality Gate: FAIL · 74/100',
  checks:[
    {id:'section-contrast',label:'Tương phản Verse/Chorus',status:'weak' as const,detail:'Khác biệt Verse/Chorus còn yếu.',required:true},
    {id:'accompaniment-texture',label:'Piano / lớp hòa âm',status:'pass' as const,detail:'Piano: 8.0 nốt/ô hát; whole-note 0%.',required:true},
  ],
};

const deps:any={
  prepareComposition:async()=>({
    songRequest:{language:'vi',songForm:'Verse Chorus Bridge Final Chorus'},
    metaPlan:'m',composePrompt:'c',arrangePrompt:'a',composeDocRefs:[],arrangeDocRefs:[],planSummary:'p',style:{displayName:'V-Pop'},
  }),
  generateLeadSheet:async()=>{
    const error:any=new Error('QUALITY_GATE_FAILED_AFTER_PATCH');
    error.code='QUALITY_GATE_FAILED_AFTER_PATCH';
    error.quality=quality;
    error.tone={score:58,status:'FAIL',evaluatedPairs:7,contraryPairs:[{measure:12,tick:24,fromLyric:'bí mật A',toLyric:'bí mật B',melodicInterval:-4,weight:2}]};
    error.xml='<score-partwise>SECRET_XML</score-partwise>';
    throw error;
  },
  generateArrangement:async()=>{throw new Error('must not reach arrangement');},
  analyze:async()=>{throw new Error('must not analyze failed lead');},
};

const registry=createBackgroundRunRegistry(deps,{terminalTtlMs:1000});
const created=registry.create({idea:'forensic',styleId:'STYLE.VN.VPOP-BALLAD'});
for(let i=0;i<50 && registry.get(created.id)?.status!=='failed';i++) await sleep(2);
const snapshot=registry.get(created.id)!;
assert(snapshot.status==='failed','quality failure must end background run as failed');
assert(snapshot.error?.code==='QUALITY_GATE_FAILED_AFTER_PATCH','error code must survive background boundary');
assert(snapshot.error?.quality?.score===74,'quality score must survive background boundary');
assert(snapshot.error?.quality?.checks?.[0]?.id==='section-contrast','quality checks must survive background boundary');
assert(snapshot.error?.tone?.score===58,'tone score must survive background boundary');
assert(snapshot.error?.tone?.status==='FAIL','tone status must survive background boundary');
assert(snapshot.error?.tone?.evaluatedPairs===7,'tone evaluated pair count must survive background boundary');
assert(snapshot.error?.tone?.contraryPairCount===1,'tone contrary pair count must be retained without lyric content');
const serialized=JSON.stringify(snapshot.error);
assert(!serialized.includes('bí mật A')&&!serialized.includes('bí mật B'),'failure diagnostics must not expose lyrics');
assert(!serialized.includes('SECRET_XML'),'failure diagnostics must not expose full MusicXML');
registry.dispose();
console.log('PASS background-quality-diagnostics');
