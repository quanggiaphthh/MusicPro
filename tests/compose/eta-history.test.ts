import { readEtaEstimate, recordEtaSample } from '../../src/compose/eta-history.ts';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
class MemoryStorage { data=new Map<string,string>(); getItem(k:string){return this.data.get(k)??null;} setItem(k:string,v:string){this.data.set(k,v);} }
const storage:any=new MemoryStorage();
assert(readEtaEstimate(storage)===240,'default ETA should be 240s');
const first=recordEtaSample(180,storage);
assert(first===180,'first successful run should seed ETA');
const second=recordEtaSample(300,storage);
assert(second>180 && second<300,'subsequent ETA should adapt smoothly instead of jumping');
assert(readEtaEstimate(storage)===second,'stored ETA must be reusable on next run');
console.log('PASS eta-history');
