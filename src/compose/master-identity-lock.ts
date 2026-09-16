export interface MasterIdentityLockInput {
  leadXml: string;
  arrangedXml: string;
  melodyPartId: string;
}

export interface MasterIdentityLockResult {
  xml: string;
  changed: boolean;
  partId: string;
}

function escapeRegExp(value:string):string {
  return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
}

function partPattern(partId:string):RegExp {
  const id=escapeRegExp(partId);
  return new RegExp(`<part\\b[^>]*\\bid=(['"])${id}\\1[^>]*>[\\s\\S]*?<\\/part\\s*>`,'i');
}

function scorePartPattern(partId:string):RegExp {
  const id=escapeRegExp(partId);
  return new RegExp(`<score-part\\b[^>]*\\bid=(['"])${id}\\1[^>]*>[\\s\\S]*?<\\/score-part\\s*>`,'i');
}

function find(xml:string,pattern:RegExp):string|undefined {
  return xml.match(pattern)?.[0];
}

/**
 * Deterministically preserves the canonical lead identity during arrangement.
 * Both the actual lead <part> and its <score-part> metadata are copied byte-for-byte
 * from the accepted Lead Sheet before quality audit. Accompaniment parts remain free
 * for the arranger to create or rewrite.
 */
export function lockLeadMelodyPart(input:MasterIdentityLockInput):MasterIdentityLockResult {
  const partId=String(input.melodyPartId||'').trim();
  if(!partId){
    throw Object.assign(new Error('Không xác định được part giai điệu cần khóa.'),{code:'MASTER_IDENTITY_PART_NOT_FOUND'});
  }
  const leadPart=find(input.leadXml,partPattern(partId));
  const arrangedPart=find(input.arrangedXml,partPattern(partId));
  const leadScorePart=find(input.leadXml,scorePartPattern(partId));
  const arrangedScorePart=find(input.arrangedXml,scorePartPattern(partId));
  if(!leadPart||!arrangedPart||!leadScorePart||!arrangedScorePart){
    throw Object.assign(new Error(`Không tìm thấy đầy đủ part/score-part ${partId} ở Lead Sheet và bản phối để áp dụng master identity lock.`),{code:'MASTER_IDENTITY_PART_NOT_FOUND',partId});
  }
  let xml=input.arrangedXml;
  let changed=false;
  if(arrangedPart!==leadPart){xml=xml.replace(partPattern(partId),leadPart);changed=true;}
  if(arrangedScorePart!==leadScorePart){xml=xml.replace(scorePartPattern(partId),leadScorePart);changed=true;}
  return{xml,changed,partId};
}
