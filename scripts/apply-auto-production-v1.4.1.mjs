import fs from 'node:fs';

const SERVER_MARKER='AUTO_PRODUCTION_V1_4_1';
const RUNS_MARKER='PROJECT_ARRANGEMENT_PRODUCTION_V1_4_1';
const LEGACY_SERVER_MARKERS=['AUTO_PRODUCTION_V1_4','AUTO_PRODUCTION_V1_3','AUTO_PRODUCTION_V1_2'];
const LEGACY_RUNS_MARKERS=['PROJECT_ARRANGEMENT_PRODUCTION_V1_4','PROJECT_ARRANGEMENT_PRODUCTION_V1_3','PROJECT_ARRANGEMENT_PRODUCTION_V1_2'];

function patchServer(){
  const path='server.ts';
  if(!fs.existsSync(path))throw new Error('server.ts not found. Run this script from the Music-Pro repository root.');
  let source=fs.readFileSync(path,'utf8');
  const composerImport='import { prepareComposition, generateLeadSheet, generateArrangement } from "./server/music/composer";';
  const streamImport='import { createAutoProductionStreamHandler } from "./server/music/auto-production-stream";';
  if(!source.includes(composerImport))throw new Error('Expected Composer import anchor not found; stop and audit server.ts instead of guessing.');
  if(!source.includes(streamImport))source=source.replace(composerImport,`${composerImport}\n${streamImport}`);

  if(source.includes(SERVER_MARKER)){
    const expectedRoute='app.post("/api/compose/run-stream", createAutoProductionStreamHandler({';
    if(!source.includes(expectedRoute))throw new Error(`${SERVER_MARKER} marker exists but the expected createAutoProductionStreamHandler route is missing; stop and audit possible tampering/drift.`);
    fs.writeFileSync(path,source);console.log(`${SERVER_MARKER} already installed and verified in server.ts`);return;
  }
  if(source.includes('app.post("/api/compose/run-stream"')){
    let upgraded=false;
    for(const marker of LEGACY_SERVER_MARKERS){
      if(source.includes(marker)){source=source.replace(marker,SERVER_MARKER);upgraded=true;break;}
    }
    if(!upgraded){
      throw new Error('Existing /api/compose/run-stream route has no recognized Music-Pro marker; stop and audit instead of adopting an unknown handler.');
    }
    fs.writeFileSync(path,source);console.log(`${SERVER_MARKER} upgraded existing stream route`);return;
  }
  const routeAnchor='  app.post("/api/compose/prepare", async (req, res) => {';
  if(!source.includes(routeAnchor))throw new Error('Expected /api/compose/prepare anchor not found; stop and audit server.ts instead of guessing.');
  const block=`  // ${SERVER_MARKER} — one streamed, quality-enforced 4-step orchestration endpoint\n  app.post("/api/compose/run-stream", createAutoProductionStreamHandler({\n    prepareComposition,\n    generateLeadSheet,\n    generateArrangement,\n    analyze: (musicXml, styleId, idea) => {\n      const songDNA = extractSongDNA(musicXml);\n      const mappedStyle = getStyleDisplayName(styleId);\n      const blueprint = buildProductionBlueprint(songDNA, { style: mappedStyle, idea });\n      return { songDNA, blueprint };\n    },\n  }));\n\n`;
  source=source.replace(routeAnchor,block+routeAnchor);
  fs.writeFileSync(path,source);
  console.log(`${SERVER_MARKER} installed in server.ts`);
}

function findRunsBlockStart(source){
  if(source.includes(RUNS_MARKER))return source.indexOf(`      // ${RUNS_MARKER}`);
  for(const marker of LEGACY_RUNS_MARKERS){
    if(source.includes(marker))return source.indexOf(`      // ${marker}`);
  }
  return source.indexOf("      const arrangeResponse = await fetch('/api/compose/arrange', {");
}

function patchRunsView(){
  const path='src/views/RunsView.tsx';
  if(!fs.existsSync(path))throw new Error('src/views/RunsView.tsx not found; stop instead of guessing.');
  let source=fs.readFileSync(path,'utf8');
  const importAnchor="import { ResultWorkspace } from '../components/ResultWorkspace';";
  if(!source.includes(importAnchor))throw new Error('RunsView import anchor not found; stop and audit instead of guessing.');
  const arrangementImport="import { runArrangementProduction } from '../compose/arrangement-production-run';";
  const certificationImport="import { bindProductionSnapshotToRevision } from '../compose/production-certification';";
  if(!source.includes(arrangementImport))source=source.replace(importAnchor,`${importAnchor}\n${arrangementImport}`);
  if(!source.includes(certificationImport))source=source.replace(arrangementImport,`${arrangementImport}\n${certificationImport}`);

  // Already v1.4.1: verify the integration block before treating it as installed.
  if(source.includes(RUNS_MARKER)){
    source=source.replaceAll("'project-arrangement-v1.4'","'project-arrangement-v1.4.1'").replaceAll("'project-arrangement-v1.3'","'project-arrangement-v1.4.1'").replaceAll("'production-quality-v1.4'","'production-quality-v1.4.1'").replaceAll("'production-quality-v1.3'","'production-quality-v1.4.1'");
    const requiredTokens=[
      'const result = await runArrangementProduction({',
      'bindProductionSnapshotToRevision({',
      "pipelineVersion: 'project-arrangement-v1.4.1'",
      "qualityContractVersion: 'production-quality-v1.4.1'",
    ];
    if(requiredTokens.some(token=>!source.includes(token)))throw new Error(`${RUNS_MARKER} marker exists but the expected production arrangement block is incomplete; stop and audit possible tampering/drift.`);
    fs.writeFileSync(path,source);console.log(`${RUNS_MARKER} already installed and verified`);return;
  }

  const start=findRunsBlockStart(source);
  const endAnchor='      await saveBundle(next);';
  const endStart=start>=0?source.indexOf(endAnchor,start):-1;
  if(start<0||endStart<0)throw new Error('RunsView arrangement block changed; stop and audit instead of guessing.');
  const end=endStart+endAnchor.length;
  const replacement=`      // ${RUNS_MARKER}\n      const result = await runArrangementProduction({\n        leadSheetXml: leadRevision.musicXml,\n        arrangePrompt: context.arrangePrompt,\n        arrangeDocRefs: context.arrangeDocRefs,\n        songRequest: context.songRequest,\n        styleId: workingBundle.project.style,\n        idea: workingBundle.project.idea,\n      }, { maxQualityRetries: 1 });\n\n      const label = result.readiness.status === 'PASS' ? 'Bản phối' : 'Bản phối cần rà soát';\n      let next = await projectService.appendRevision(workingBundle, {\n        musicXml: result.finalXml,\n        reason: 'arrange',\n        label,\n      });\n      const snapshot = bindProductionSnapshotToRevision({\n        pipelineVersion: 'project-arrangement-v1.4.1',\n        qualityContractVersion: 'production-quality-v1.4.1',\n        sourceHead: '6608e1e2fa620fd71f3356e063bac862ede6fdc5',\n        input: { idea: workingBundle.project.idea, styleId: workingBundle.project.style },\n        compositionQuality: result.compositionQuality,\n        arrangementQuality: result.arrangementQuality,\n        readiness: result.readiness,\n        songDna: result.songDna,\n        blueprint: result.blueprint,\n        identityLock: result.identityLock,\n        generatedAt: Date.now(),\n      }, next.project.activeRevisionId);\n      next = {\n        ...next,\n        project: {\n          ...next.project,\n          productionSnapshot: snapshot,\n          updatedAt: Date.now(),\n        },\n      };\n      await saveBundle(next);`;
  source=source.slice(0,start)+replacement+source.slice(end);
  fs.writeFileSync(path,source);
  console.log(`${RUNS_MARKER} installed in RunsView.tsx`);
}

patchServer();
patchRunsView();
