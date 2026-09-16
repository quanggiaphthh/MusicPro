import type { ProductionSnapshot } from './types.ts';

export function bindProductionSnapshotToRevision(snapshot:ProductionSnapshot,revisionId:string):ProductionSnapshot {
  const id=String(revisionId||'').trim();
  if(!id)throw new Error('revisionId is required to bind production certification');
  return {
    ...snapshot,
    evaluatedRevisionId:id,
    certifiedRevisionId:snapshot.readiness.status==='PASS'?id:undefined,
  };
}

/** Preserve audit evidence but revoke certification after the active score changes. */
export function invalidateProductionCertification(snapshot:ProductionSnapshot|undefined):ProductionSnapshot|undefined {
  if(!snapshot)return undefined;
  if(!snapshot.certifiedRevisionId)return snapshot;
  return {...snapshot,certifiedRevisionId:undefined};
}

export function isProductionCertificationCurrent(snapshot:ProductionSnapshot|undefined,activeRevisionId:string|undefined):boolean {
  const active=String(activeRevisionId||'').trim();
  return Boolean(active&&snapshot?.readiness.status==='PASS'&&snapshot.certifiedRevisionId===active&&snapshot.evaluatedRevisionId===active);
}

export type ProductionCertificationState='CERTIFIED'|'NOT_CERTIFIED'|'STALE'|'MISSING';
export function getProductionCertificationState(snapshot:ProductionSnapshot|undefined,activeRevisionId:string|undefined):ProductionCertificationState {
  if(!snapshot)return'MISSING';
  const active=String(activeRevisionId||'').trim();
  if(!active||snapshot.evaluatedRevisionId!==active)return'STALE';
  return isProductionCertificationCurrent(snapshot,active)?'CERTIFIED':'NOT_CERTIFIED';
}
