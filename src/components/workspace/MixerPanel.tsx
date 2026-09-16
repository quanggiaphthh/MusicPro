import React, { useMemo } from 'react';
import type { ScoreTimeline } from '../../music/score-timeline';
import type { MixState } from '../../projects/types';
import { sanitizeMix } from '../../audio/mix-state';
import { GENERAL_MIDI_PROGRAMS } from '../../music/general-midi';

interface Props {
  timeline: ScoreTimeline;
  mix: MixState;
  onChange: (mix: MixState) => void;
  onApplyInstrument?: (partId: string, midiProgram: number) => void;
  readOnly?: boolean;
}

export const MixerPanel: React.FC<Props> = ({ timeline, mix, onChange, onApplyInstrument, readOnly }) => {
  const clean = useMemo(() => sanitizeMix(mix, timeline), [mix, timeline]);
  const updatePart = (partId: string, patch: Partial<MixState['parts'][string]>) => {
    if (readOnly) return;
    onChange({ ...clean, parts: { ...clean.parts, [partId]: { ...clean.parts[partId], ...patch } } });
  };
  return (
    <div className="space-y-4" id="workspace-panel-mixer" role="tabpanel">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-400">Master {clean.masterGain.toFixed(2)}<input aria-label="Âm lượng master" type="range" min={0} max={1.5} step={0.01} value={clean.masterGain} disabled={readOnly} onChange={e => onChange({ ...clean, masterGain: Number(e.target.value) })} className="mt-2 w-full accent-indigo-500" /></label>
        <label className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-400">Reverb {Math.round(clean.reverb * 100)}%<input aria-label="Mức reverb" type="range" min={0} max={1} step={0.01} value={clean.reverb} disabled={readOnly} onChange={e => onChange({ ...clean, reverb: Number(e.target.value) })} className="mt-2 w-full accent-indigo-500" /></label>
        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm"><input type="checkbox" checked={clean.normalizeExport} disabled={readOnly} onChange={e => onChange({ ...clean, normalizeExport: e.target.checked })} /> Chuẩn hóa WAV</label>
      </div>

      <div className="space-y-3">
        {timeline.parts.map(part => {
          const state = clean.parts[part.partId];
          const percussion = part.isPercussion === true || /drum|percussion|trống|bộ gõ/i.test(part.name);
          return (
            <div key={part.partId} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="min-w-40 flex-1"><div className="font-bold">{part.name}</div><div className="text-[11px] text-zinc-500">{part.partId}{percussion ? ' · Percussion' : ''}</div></div>
                <div className="flex gap-2"><button disabled={readOnly} aria-pressed={state.mute} onClick={() => updatePart(part.partId,{mute:!state.mute})} className={`rounded-lg px-3 py-2 text-xs font-bold ${state.mute?'bg-red-500/20 text-red-300':'bg-white/5 text-zinc-300'}`}>Mute</button><button disabled={readOnly} aria-pressed={state.solo} onClick={() => updatePart(part.partId,{solo:!state.solo})} className={`rounded-lg px-3 py-2 text-xs font-bold ${state.solo?'bg-amber-500/20 text-amber-300':'bg-white/5 text-zinc-300'}`}>Solo</button></div>
                <label className="text-[11px] text-zinc-500 min-w-36">Volume {state.volume.toFixed(2)}<input aria-label={`Âm lượng ${part.name}`} type="range" min={0} max={1.5} step={0.01} value={state.volume} disabled={readOnly} onChange={e=>updatePart(part.partId,{volume:Number(e.target.value)})} className="block w-full accent-indigo-500" /></label>
                <label className="text-[11px] text-zinc-500 min-w-36">Pan {state.pan.toFixed(2)}<input aria-label={`Pan ${part.name}`} type="range" min={-1} max={1} step={0.01} value={state.pan} disabled={readOnly} onChange={e=>updatePart(part.partId,{pan:Number(e.target.value)})} className="block w-full accent-indigo-500" /></label>
                {!percussion && <div className="flex flex-wrap items-end gap-2"><label className="text-[11px] text-zinc-500">Nhạc cụ<select value={state.midiProgram || part.midiProgram || 1} disabled={readOnly} onChange={e=>updatePart(part.partId,{midiProgram:Number(e.target.value)})} className="mt-1 block max-w-44 rounded-lg border border-white/10 bg-black px-2 py-2 text-xs text-white">{GENERAL_MIDI_PROGRAMS.map(item=><option key={item.program} value={item.program}>{item.program}. {item.name}</option>)}</select></label><button disabled={readOnly} onClick={()=>onApplyInstrument?.(part.partId,state.midiProgram||part.midiProgram||1)} className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-300">Áp dụng nhạc cụ vào bản nhạc</button></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
