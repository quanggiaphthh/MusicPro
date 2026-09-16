import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'musicpro-installer-upgrade-'));
const server=`import { prepareComposition, generateLeadSheet, generateArrangement } from "./server/music/composer";\nimport { createAutoProductionStreamHandler } from "./server/music/auto-production-stream";\nasync function x(){\n  // AUTO_PRODUCTION_V1_2 — old\n  app.post("/api/compose/run-stream", createAutoProductionStreamHandler({}));\n  app.post("/api/compose/prepare", async (req,res)=>{});\n}`;
const runs=`import { ResultWorkspace } from '../components/ResultWorkspace';\nimport { runArrangementProduction } from '../compose/arrangement-production-run';\nasync function x(){\n      // PROJECT_ARRANGEMENT_PRODUCTION_V1_2\n      const result = await runArrangementProduction({});\n      let next = await projectService.appendRevision(workingBundle,{musicXml:result.finalXml,reason:'arrange'});\n      await saveBundle(next);\n}`;
fs.writeFileSync(path.join(dir,'server.ts'),server);fs.mkdirSync(path.join(dir,'src/views'),{recursive:true});fs.writeFileSync(path.join(dir,'src/views/RunsView.tsx'),runs);fs.mkdirSync(path.join(dir,'scripts'));fs.copyFileSync('scripts/apply-auto-production-v1.4.1.mjs',path.join(dir,'scripts/apply-auto-production-v1.4.1.mjs'));
execFileSync(process.execPath,['scripts/apply-auto-production-v1.4.1.mjs'],{cwd:dir,stdio:'pipe'});
const a=fs.readFileSync(path.join(dir,'server.ts'),'utf8'),b=fs.readFileSync(path.join(dir,'src/views/RunsView.tsx'),'utf8');
assert(a.includes('AUTO_PRODUCTION_V1_4_1')&&!a.includes('AUTO_PRODUCTION_V1_2'),'server v1.2 marker must upgrade without duplicate route');
assert((a.match(/\/api\/compose\/run-stream/g)||[]).length===1,'upgrade must keep one stream route');
assert(b.includes('PROJECT_ARRANGEMENT_PRODUCTION_V1_4_1')&&!b.includes('PROJECT_ARRANGEMENT_PRODUCTION_V1_2'),'RunsView block must upgrade to v1.4.1');
assert(b.includes("pipelineVersion: 'project-arrangement-v1.4.1'"),'upgraded RunsView must use v1.4.1 provenance');
console.log('PASS installer-upgrade-v12');
