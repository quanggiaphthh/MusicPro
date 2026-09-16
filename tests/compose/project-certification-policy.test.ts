import fs from 'node:fs';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message)}
const service=fs.readFileSync('src/projects/project-service.ts','utf8');
const repo=fs.readFileSync('src/projects/local-project-repository.ts','utf8');
for(const source of [service,repo])assert(source.includes('invalidateProductionCertification'),'all persistence entry points that create/copy score revisions must revoke current certification');
assert(service.includes('withCurrentCertificationState'),'ordinary save must normalize a stale active revision without deleting audit evidence');
assert(service.includes('next.project.productionSnapshot = invalidateProductionCertification(next.project.productionSnapshot)'),'appendRevision must preserve evidence but revoke certification after score changes');
assert(repo.includes('duplicate.project.productionSnapshot = invalidateProductionCertification(duplicate.project.productionSnapshot)'),'whole-project duplicate must not inherit READY certification');
console.log('PASS project-certification-policy');
