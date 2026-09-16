import { bindProductionSnapshotToRevision, isProductionCertificationCurrent, invalidateProductionCertification } from '../../src/compose/production-certification.ts';
const snapshot:any={compositionQuality:{status:'PASS',score:90,checks:[],summary:'ok'},arrangementQuality:{status:'PASS',score:90,checks:[],summary:'ok'},readiness:{status:'PASS',label:'READY FOR PRODUCTION',score:90,summary:'ok',blockers:[],advisories:[]},generatedAt:1};
const bound=bindProductionSnapshotToRevision(snapshot,'r1');
if(bound.evaluatedRevisionId!=='r1'||bound.certifiedRevisionId!=='r1'||!isProductionCertificationCurrent(bound,'r1'))throw new Error('PASS snapshot must certify exact revision');
const stale=invalidateProductionCertification(bound);
if(stale.certifiedRevisionId!==undefined||stale.evaluatedRevisionId!=='r1'||isProductionCertificationCurrent(stale,'r2'))throw new Error('invalidation must preserve evidence but revoke current certification');
console.log('PASS certification-state');
