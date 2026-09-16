import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m);}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'musicpro-foreign-stream-'));
fs.mkdirSync(path.join(dir,'scripts'));fs.mkdirSync(path.join(dir,'src/views'),{recursive:true});
fs.copyFileSync('scripts/apply-auto-production-v1.4.1.mjs',path.join(dir,'scripts/apply-auto-production-v1.4.1.mjs'));
fs.writeFileSync(path.join(dir,'server.ts'),`import { prepareComposition, generateLeadSheet, generateArrangement } from "./server/music/composer";\nasync function x(){\n  app.post("/api/compose/run-stream", foreignHandler);\n  app.post("/api/compose/prepare", async (req,res)=>{});\n}`);
fs.writeFileSync(path.join(dir,'src/views/RunsView.tsx'),`import { ResultWorkspace } from '../components/ResultWorkspace';\nasync function x(){\n      const arrangeResponse = await fetch('/api/compose/arrange', { method: 'POST' });\n      const arrangeData = await arrangeResponse.json();\n      const next = await projectService.appendRevision(workingBundle, { musicXml: arrangeData.xml, reason: 'arrange', label: 'Bản phối' });\n      await saveBundle(next);\n}`);
let failed=false;try{execFileSync(process.execPath,['scripts/apply-auto-production-v1.4.1.mjs'],{cwd:dir,stdio:'pipe'});}catch{failed=true;}
assert(failed,'installer must fail closed when an unmarked foreign run-stream route already exists');
const server=fs.readFileSync(path.join(dir,'server.ts'),'utf8');
assert(server.includes('foreignHandler')&&!server.includes('AUTO_PRODUCTION_V1_4_1'),'foreign route must remain untouched after guarded failure');
console.log('PASS installer-foreign-stream-route');
