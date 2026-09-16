import { getProductionCertificationState } from '../../src/compose/production-certification.ts';
const base:any={compositionQuality:{status:'PASS',score:90,checks:[],summary:'ok'},arrangementQuality:{status:'FAIL',score:70,checks:[],summary:'bad'},readiness:{status:'FAIL',label:'QUALITY REVIEW REQUIRED',score:80,summary:'review',blockers:['x'],advisories:[]},generatedAt:1,evaluatedRevisionId:'r2'};
if(getProductionCertificationState(base,'r2')!=='NOT_CERTIFIED')throw new Error('current FAIL evaluation must be NOT_CERTIFIED');
if(getProductionCertificationState(base,'r3')!=='STALE')throw new Error('old evaluation must be STALE');
const pass={...base,arrangementQuality:{...base.arrangementQuality,status:'PASS'},readiness:{...base.readiness,status:'PASS',label:'READY FOR PRODUCTION'},certifiedRevisionId:'r2'};
if(getProductionCertificationState(pass,'r2')!=='CERTIFIED')throw new Error('current PASS exact revision must be CERTIFIED');
console.log('PASS certification-semantics');
