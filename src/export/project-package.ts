import type { MusicProjectBundle } from '../projects/types';
import { activeRevision } from '../projects/revision-utils';
import { getProductionCertificationState, isProductionCertificationCurrent } from '../compose/production-certification';
import { parseMusicXMLToTimeline } from '../music/score-timeline';
import { timelineToMidiBlob } from '../music/midi-export';
import { createStoreZip, type StoreZipEntry } from './zip-store';

const encoder = new TextEncoder();
function json(value:unknown):Uint8Array { return encoder.encode(JSON.stringify(value,null,2)); }
function text(value:string):Uint8Array { return encoder.encode(value); }

function readinessMarkdown(bundle:MusicProjectBundle):string {
  const snapshot=bundle.project.productionSnapshot;
  if(!snapshot)return '# Production Readiness\n\nChưa có production quality snapshot.\n';
  const certificationState=getProductionCertificationState(snapshot,bundle.project.activeRevisionId);
  const current=certificationState==='CERTIFIED';
  const evaluationCurrent=certificationState==='CERTIFIED'||certificationState==='NOT_CERTIFIED';
  const lines=[
    '# Production Readiness', '',
    `- certification: ${certificationState}`,
    `- status: ${certificationState==='STALE'?'CERTIFICATION STALE':snapshot.readiness.status}`,
    `- evaluated_revision: ${snapshot.evaluatedRevisionId||'unknown'}`,
    `- certified_revision: ${snapshot.certifiedRevisionId||'none'}`,
    `- active_revision: ${bundle.project.activeRevisionId}`,
    `- label: ${current?snapshot.readiness.label:'QUALITY REVIEW REQUIRED'}`,
    `- score: ${snapshot.readiness.score}/100`,
    `- composition_quality: ${snapshot.compositionQuality.status} (${snapshot.compositionQuality.score}/100)`,
    `- arrangement_quality: ${snapshot.arrangementQuality.status} (${snapshot.arrangementQuality.score}/100)`,
    '', current?snapshot.readiness.summary:evaluationCurrent?snapshot.readiness.summary:'Quality evidence được giữ lại để audit nhưng evaluation/certification cũ không còn áp dụng cho active revision.', '',
    ...(snapshot.readiness.blockers?.length ? ['## Blockers', ...snapshot.readiness.blockers.map(item=>`- ${item}`), ''] : []),
    ...(snapshot.readiness.advisories?.length ? ['## Advisories', ...snapshot.readiness.advisories.map(item=>`- ${item}`), ''] : []),
    'Final MusicXML là MASTER COMPOSITION. SoundFont/reference audio không phải commercial audio master.',
  ];
  return lines.join('\n');
}

function extractLyrics(snapshot:MusicProjectBundle['project']['productionSnapshot']):string {
  const dna:any=snapshot?.songDna;
  return String(dna?.lyrics?.assembledLyric||'').trim();
}

function chordChart(snapshot:MusicProjectBundle['project']['productionSnapshot']):string {
  const blueprint:any=snapshot?.blueprint;
  const harmony=Array.isArray(blueprint?.harmony)?blueprint.harmony:[];
  if(!harmony.length)return '# Chord Chart\n\nKhông có dữ liệu hòa âm trong production snapshot.\n';
  return ['# Chord Chart','',...harmony.map((item:any)=>`## ${item.section||'Section'}\n${Array.isArray(item.progression)?item.progression.join(' | '):''}`),''].join('\n');
}

export async function buildProjectPackageBytes(bundle:MusicProjectBundle):Promise<Uint8Array>{
  const current=activeRevision(bundle);
  const lead=bundle.project.leadRevisionId?bundle.revisions.find(r=>r.id===bundle.project.leadRevisionId):undefined;
  const entries:StoreZipEntry[]=[
    {name:'project.json',data:json({format:'music-pro-project',version:2,project:bundle.project})},
    {name:'current.musicxml',data:text(current.musicXml)},
    {name:'MASTER.musicxml',data:text(current.musicXml)},
    {name:'revisions/index.json',data:json(bundle.revisions.map(({musicXml,...meta})=>meta))},
    {name:'README.txt',data:text('Music-Pro Production Handoff Package v2\nFinal MusicXML is the canonical master composition.\ncurrent.musicxml and MASTER.musicxml contain the active master.\nSoundFont/reference audio is for preview and is not a commercial audio master.\n')},
    {name:'PRODUCTION-READINESS.md',data:text(readinessMarkdown(bundle))},
  ];
  if(lead){entries.push({name:'lead.musicxml',data:text(lead.musicXml)});entries.push({name:'LEAD-SHEET.musicxml',data:text(lead.musicXml)});}
  for(const revision of bundle.revisions)entries.push({name:`revisions/${revision.id}.musicxml`,data:text(revision.musicXml)});

  const snapshot=bundle.project.productionSnapshot;
  if(snapshot){
    const certificationState=getProductionCertificationState(snapshot,bundle.project.activeRevisionId);
    const certificationCurrent=isProductionCertificationCurrent(snapshot,bundle.project.activeRevisionId);
    const evidencePrefix=certificationState==='STALE'?'production/stale-evidence':'production';
    entries.push({name:'production/provenance.json',data:json({pipelineVersion:snapshot.pipelineVersion,qualityContractVersion:snapshot.qualityContractVersion,sourceHead:snapshot.sourceHead,input:snapshot.input,generatedAt:snapshot.generatedAt,identityLock:snapshot.identityLock,evaluatedRevisionId:snapshot.evaluatedRevisionId,certifiedRevisionId:snapshot.certifiedRevisionId,activeRevisionId:bundle.project.activeRevisionId,certificationState,certificationCurrent,evidencePrefix})});
    entries.push({name:`${evidencePrefix}/composition-quality.json`,data:json(snapshot.compositionQuality)});
    entries.push({name:`${evidencePrefix}/arrangement-quality.json`,data:json(snapshot.arrangementQuality)});
    entries.push({name:'production/readiness.json',data:json({...snapshot.readiness,certificationCurrent,evaluatedRevisionId:snapshot.evaluatedRevisionId,certifiedRevisionId:snapshot.certifiedRevisionId,activeRevisionId:bundle.project.activeRevisionId,certificationState,evidencePrefix})});
    if(snapshot.songDna)entries.push({name:`${evidencePrefix}/song-dna.json`,data:json(snapshot.songDna)});
    if(snapshot.blueprint)entries.push({name:`${evidencePrefix}/production-blueprint.json`,data:json(snapshot.blueprint)});
    const lyrics=extractLyrics(snapshot); if(lyrics)entries.push({name:`${evidencePrefix}/lyrics.txt`,data:text(lyrics+'\n')});
    entries.push({name:`${evidencePrefix}/chord-chart.md`,data:text(chordChart(snapshot))});
  }

  try {
    const timeline=parseMusicXMLToTimeline(current.musicXml);
    const midi=timelineToMidiBlob(timeline,480,bundle.project.mix);
    entries.push({name:'MASTER.mid',data:new Uint8Array(await midi.arrayBuffer())});
  } catch {
    // A project package remains exportable even if a legacy/recovered XML cannot be converted to MIDI.
  }
  return createStoreZip(entries);
}

export async function buildProjectPackage(bundle:MusicProjectBundle):Promise<Blob>{
  return new Blob([await buildProjectPackageBytes(bundle)],{type:'application/zip'});
}
