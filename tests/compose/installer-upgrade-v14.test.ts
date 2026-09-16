import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m);}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'musicpro-v14-upgrade-'));fs.mkdirSync(path.join(dir,'scripts'));fs.mkdirSync(path.join(dir,'src/views'),{recursive:true});
fs.copyFileSync('scripts/apply-auto-production-v1.4.1.mjs',path.join(dir,'scripts/apply-auto-production-v1.4.1.mjs'));
fs.writeFileSync(path.join(dir,'server.ts'),`import { prepareComposition, generateLeadSheet, generateArrangement } from "./server/music/composer";\nimport { createAutoProductionStreamHandler } from "./server/music/auto-production-stream";\nasync function x(){\n  // AUTO_PRODUCTION_V1_4 — old\n  app.post("/api/compose/run-stream", createAutoProductionStreamHandler({ prepareComposition, generateLeadSheet, generateArrangement, analyze:()=>({}) }));\n  app.post("/api/compose/prepare", async (req,res)=>{});\n}`);
fs.writeFileSync(path.join(dir,'src/views/RunsView.tsx'),`import { ResultWorkspace } from '../components/ResultWorkspace';\nimport { runArrangementProduction } from '../compose/arrangement-production-run';\nimport { bindProductionSnapshotToRevision } from '../compose/production-certification';\nasync function x(){\n      // PROJECT_ARRANGEMENT_PRODUCTION_V1_4\n      const result = await runArrangementProduction({});\n      const label = 'Bản phối';\n      let next = await projectService.appendRevision(workingBundle, { musicXml: result.finalXml, reason: 'arrange', label });\n      const snapshot = bindProductionSnapshotToRevision({ pipelineVersion: 'project-arrangement-v1.4', qualityContractVersion: 'production-quality-v1.4', generatedAt: Date.now() }, next.project.activeRevisionId);\n      next = { ...next, project: { ...next.project, productionSnapshot: snapshot, updatedAt: Date.now() } };\n      await saveBundle(next);\n}`);
execFileSync(process.execPath,['scripts/apply-auto-production-v1.4.1.mjs'],{cwd:dir,stdio:'pipe'});
const server=fs.readFileSync(path.join(dir,'server.ts'),'utf8'),runs=fs.readFileSync(path.join(dir,'src/views/RunsView.tsx'),'utf8');
assert(server.includes('AUTO_PRODUCTION_V1_4_1')&&!server.includes('AUTO_PRODUCTION_V1_4 —'),'server v1.4 marker must upgrade to v1.4.1');
assert(runs.includes('PROJECT_ARRANGEMENT_PRODUCTION_V1_4_1')&&!runs.includes('PROJECT_ARRANGEMENT_PRODUCTION_V1_4\n'),'RunsView v1.4 marker must upgrade to v1.4.1');
assert(runs.includes("pipelineVersion: 'project-arrangement-v1.4.1'")&&runs.includes("qualityContractVersion: 'production-quality-v1.4.1'"),'provenance must upgrade to v1.4.1');
console.log('PASS installer-upgrade-v14');
