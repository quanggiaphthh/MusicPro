import { buildProductionReadiness } from '../../src/compose/production-quality.ts';
import type { QualityReport } from '../../src/compose/types.ts';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const composition:QualityReport={status:'PASS',score:94,summary:'ok',checks:[
 {id:'bridge-contrast',label:'Tương phản Bridge',status:'weak',detail:'Không có Bridge trong form.',required:false},
 {id:'chorus-hook',label:'Hook',status:'pass',detail:'ok',required:true},
]};
const arrangement:QualityReport={status:'PASS',score:94,summary:'ok',checks:[
 {id:'importer-part-ids',label:'Part IDs',status:'pass',detail:'ok',required:true},
]};
const readiness=buildProductionReadiness(composition,arrangement);
assert(readiness.status==='PASS',`optional weak must be advisory, not blocker: ${readiness.blockers.join('; ')}`);
assert(readiness.advisories.some(item=>item.includes('Tương phản Bridge')),'optional weak should remain visible as advisory');
console.log('PASS optional-weak-readiness');
