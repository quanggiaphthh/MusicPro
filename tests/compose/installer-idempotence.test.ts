import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'musicpro-installer-v13-'));
const server=`import { prepareComposition, generateLeadSheet, generateArrangement } from "./server/music/composer";\nasync function x(){\n  app.post("/api/compose/prepare", async (req, res) => {\n  });\n}\n`;
const runs=`import { ResultWorkspace } from '../components/ResultWorkspace';\nasync function arrangeSelectedProject(){\n      const arrangeResponse = await fetch('/api/compose/arrange', {\n        method: 'POST',\n      });\n      const arrangeData = await arrangeResponse.json();\n      if (!arrangeResponse.ok) throw new Error('x');\n      const next = await projectService.appendRevision(workingBundle, { musicXml: arrangeData.xml, reason: 'arrange', label: 'Bản phối' });\n      await saveBundle(next);\n}\n`;
fs.writeFileSync(path.join(dir,'server.ts'),server);
fs.mkdirSync(path.join(dir,'src/views'),{recursive:true});fs.writeFileSync(path.join(dir,'src/views/RunsView.tsx'),runs);
fs.mkdirSync(path.join(dir,'scripts'));fs.copyFileSync('scripts/apply-auto-production-v1.4.1.mjs',path.join(dir,'scripts/apply-auto-production-v1.4.1.mjs'));
execFileSync(process.execPath,['scripts/apply-auto-production-v1.4.1.mjs'],{cwd:dir,stdio:'pipe'});
const serverOnce=fs.readFileSync(path.join(dir,'server.ts'),'utf8');const runsOnce=fs.readFileSync(path.join(dir,'src/views/RunsView.tsx'),'utf8');
execFileSync(process.execPath,['scripts/apply-auto-production-v1.4.1.mjs'],{cwd:dir,stdio:'pipe'});
const serverTwice=fs.readFileSync(path.join(dir,'server.ts'),'utf8');const runsTwice=fs.readFileSync(path.join(dir,'src/views/RunsView.tsx'),'utf8');
assert(serverOnce===serverTwice,'server installer must be idempotent');assert(runsOnce===runsTwice,'RunsView installer must be idempotent');
assert((serverOnce.match(/AUTO_PRODUCTION_V1_4_1/g)||[]).length===1,'server marker must appear exactly once');
assert((serverOnce.match(/\/api\/compose\/run-stream/g)||[]).length===1,'stream route must be registered exactly once');
assert((runsOnce.match(/PROJECT_ARRANGEMENT_PRODUCTION_V1_4_1/g)||[]).length===1,'project arrangement marker must appear exactly once');
assert(runsOnce.includes('bindProductionSnapshotToRevision'),'RunsView patch must bind certification to exact revision');
console.log('PASS installer-idempotence');
