import fs from 'node:fs';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const compose=fs.readFileSync('src/views/ComposeView.tsx','utf8');
const installer=fs.readFileSync('scripts/apply-auto-production-v1.4.1.mjs','utf8');
assert(compose.includes('runCompositionProduction'),'manual Step 3 must use shared composition quality runner');
assert(compose.includes('runArrangementProduction'),'manual Step 4 must use shared production arrangement runner');
assert(compose.includes("pipelineVersion:'manual-arrangement-v1.4.1'"),'manual arrangement must persist v1.4.1 production provenance');
assert(installer.includes('PROJECT_ARRANGEMENT_PRODUCTION_V1_4_1'),'installer must harden Project/History arrangement entrypoint');
assert(installer.includes('runArrangementProduction'),'RunsView patch must use shared production arrangement runner');
assert(installer.includes('bindProductionSnapshotToRevision'),'RunsView patch must bind certification to exact revision');
assert(installer.includes("pipelineVersion: 'project-arrangement-v1.4.1'"),'project arrangement must persist v1.4.1 provenance');
console.log('PASS arrangement-entrypoints-policy');
