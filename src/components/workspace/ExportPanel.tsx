import React, { useMemo, useState } from 'react';
import { Download, FileArchive, FileAudio, FileMusic, Loader2, ShieldCheck } from 'lucide-react';
import { renderTimelineToWavBlob } from '../../audio/offline-render';
import { getProductionCertificationState } from '../../compose/production-certification';
import { buildProjectPackage } from '../../export/project-package';
import { timelineToMidiBlob } from '../../music/midi-export';
import { parseMusicXMLToTimeline } from '../../music/score-timeline';
import type { MixState, MusicProjectBundle } from '../../projects/types';
import { settingsService } from '../../services/settings';
import { downloadBlob, sanitizeFilename } from '../../utils/download';
import { productErrorText } from '../../utils/product-errors';

interface Props { xmlContent:string; title:string; filenameBase?:string; mix?:MixState; bundle?:MusicProjectBundle; }

export const ExportPanel:React.FC<Props>=({xmlContent,title,filenameBase,mix,bundle})=>{
  const [rendering,setRendering]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const timeline=useMemo(()=>parseMusicXMLToTimeline(xmlContent),[xmlContent]);
  const base=sanitizeFilename(filenameBase||title);
  const defaultFormat=settingsService.getSettings().defaultExportFormat;
  const snapshot=bundle?.project.productionSnapshot;
  const readiness=snapshot?.readiness;
  const certificationState=snapshot&&bundle?getProductionCertificationState(snapshot,bundle.project.activeRevisionId):'MISSING';
  const readinessDisplay=certificationState==='CERTIFIED'?'PASS':certificationState==='STALE'?'STALE':certificationState==='NOT_CERTIFIED'?'FAIL':'MISSING';
  const defaultBadge=(format:'wav'|'midi'|'musicxml')=>defaultFormat===format?<small className="ml-2 rounded bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">MẶC ĐỊNH</small>:null;
  const xml=()=>downloadBlob(new Blob([xmlContent],{type:'application/vnd.recordare.musicxml+xml'}),`${base}.musicxml`);
  const midi=()=>downloadBlob(timelineToMidiBlob(timeline,480,mix),`${base}.mid`);
  const wav=async()=>{setRendering(true);setError(null);try{const settings=settingsService.getSettings();const blob=await renderTimelineToWavBlob(timeline,{sampleRate:settings.playbackQuality==='high'?44100:32000,mix:mix?{...mix,normalizeExport:settings.normalizeWav&&mix.normalizeExport}:mix});downloadBlob(blob,`${base}.wav`);}catch(e){setError(productErrorText(e,'Không thể xuất WAV.'));}finally{setRendering(false);}};
  const pack=async()=>{if(!bundle)return;setError(null);try{downloadBlob(await buildProjectPackage(bundle),`${base}.musicpro-production.zip`);}catch(e){setError(productErrorText(e,'Không thể đóng gói production package.'));}};
  return <div id="workspace-panel-export" role="tabpanel" className="space-y-4">
    {readiness&&<div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${certificationState==='CERTIFIED'?'border-emerald-500/25 bg-emerald-500/10 text-emerald-300':'border-amber-500/25 bg-amber-500/10 text-amber-300'}`}><ShieldCheck className="h-4 w-4"/>Production Readiness: {readinessDisplay} · {readiness.score}/100</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <button onClick={xml} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left"><Download className="h-5 w-5 text-indigo-400"/><span><b className="block">MusicXML{defaultBadge('musicxml')}</b><small className="text-zinc-500">Master composition</small></span></button>
      <button onClick={midi} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left"><FileMusic className="h-5 w-5 text-emerald-400"/><span><b className="block">MIDI{defaultBadge('midi')}</b><small className="text-zinc-500">Có program/mix override</small></span></button>
      <button onClick={()=>void wav()} disabled={rendering} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left disabled:opacity-50">{rendering?<Loader2 className="h-5 w-5 animate-spin"/>:<FileAudio className="h-5 w-5 text-sky-400"/>}<span><b className="block">WAV{defaultBadge('wav')}</b><small className="text-zinc-500">Reference stereo SoundFont</small></span></button>
      <button onClick={()=>void pack()} disabled={!bundle} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left disabled:opacity-30"><FileArchive className="h-5 w-5 text-amber-400"/><span><b className="block">Production ZIP</b><small className="text-zinc-500">Master + revisions + quality + handoff</small></span></button>
    </div>
    {error&&<div className="text-xs text-red-300">{error}</div>}
    <p className="text-xs text-zinc-500">WAV SoundFont là reference audio, không phải commercial audio master. Production ZIP không chứa API key, bộ SoundFont hoặc dữ liệu riêng tư ngoài metadata của dự án.</p>
  </div>;
};
