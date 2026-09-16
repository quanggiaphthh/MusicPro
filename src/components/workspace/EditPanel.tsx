import React, { useEffect, useMemo, useState } from 'react';
import { Redo2, RotateCcw, Save, Undo2 } from 'lucide-react';
import { parseMusicXMLToTimeline } from '../../music/score-timeline';
import { setMusicXMLTempo, transposeMusicXML } from '../../music/musicxml-transform';
import { setLyricsInMeasureRange, setMusicXMLTitle, setPartMidiProgram } from '../../music/musicxml-edit';
import { fullMeasureRange } from '../../music/measure-range';

interface Props {
  xmlContent: string;
  onApply: (nextXml: string, label: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  readOnly?: boolean;
}

export const EditPanel: React.FC<Props> = ({ xmlContent, onApply, onUndo, onRedo, onReset, canUndo, canRedo, readOnly }) => {
  const timeline = useMemo(() => { try { return parseMusicXMLToTimeline(xmlContent); } catch { return null; } }, [xmlContent]);
  const fullRange = useMemo(() => { try { return fullMeasureRange(xmlContent); } catch { return null; } }, [xmlContent]);
  const [title, setTitle] = useState(timeline?.title || '');
  const [bpm, setBpm] = useState(String(Math.round(timeline?.tempoMap[0]?.bpm || 120)));
  const [startMeasure, setStartMeasure] = useState(1);
  const [endMeasure, setEndMeasure] = useState(1);
  const [lyrics, setLyrics] = useState('');
  const [partId, setPartId] = useState(timeline?.parts[0]?.partId || '');
  const [program, setProgram] = useState(String(timeline?.parts[0]?.midiProgram || 1));
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setTitle(timeline?.title || '');
    setBpm(String(Math.round(timeline?.tempoMap[0]?.bpm || 120)));
    const firstPart = timeline?.parts[0];
    setPartId(firstPart?.partId || '');
    setProgram(String(firstPart?.midiProgram || 1));
    setMessage(null);
  }, [xmlContent]);

  const apply = (factory: () => string, label: string) => {
    if (readOnly) return;
    try { const next = factory(); onApply(next, label); setMessage(`${label} — đã tạo phiên bản mới.`); }
    catch (cause: any) { setMessage(cause?.message || 'Không thể chỉnh bản nhạc.'); }
  };

  return (
    <div className="space-y-4" id="workspace-panel-edit" role="tabpanel">
      <div className="flex flex-wrap gap-2">
        <button aria-label="Hoàn tác" disabled={!canUndo || readOnly} onClick={onUndo} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-30"><Undo2 className="h-4 w-4" /> Hoàn tác</button>
        <button aria-label="Làm lại" disabled={!canRedo || readOnly} onClick={onRedo} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-30"><Redo2 className="h-4 w-4" /> Làm lại</button>
        <button aria-label="Khôi phục đầu phiên" disabled={readOnly} onClick={onReset} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-30"><RotateCcw className="h-4 w-4" /> Khôi phục đầu phiên</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <h3 className="font-bold">Tiêu đề & tempo</h3>
          <label className="block text-xs text-zinc-400">Tiêu đề<input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white" /></label>
          <button disabled={readOnly} onClick={() => apply(() => setMusicXMLTitle(xmlContent, title), 'Đổi tiêu đề')} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold disabled:opacity-30"><Save className="h-4 w-4" /> Lưu tiêu đề</button>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-zinc-400">BPM<input type="number" min={30} max={240} value={bpm} onChange={e => setBpm(e.target.value)} className="mt-1 block w-24 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm" /></label>
            <button disabled={readOnly} onClick={() => apply(() => setMusicXMLTempo(xmlContent, Number(bpm)), `Tempo ${bpm} BPM`)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold disabled:opacity-30">Áp dụng BPM</button>
            <button disabled={readOnly} onClick={() => apply(() => transposeMusicXML(xmlContent, -1), 'Hạ 1 bán âm')} className="rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-30">−1 bán âm</button>
            <button disabled={readOnly} onClick={() => apply(() => transposeMusicXML(xmlContent, 1), 'Nâng 1 bán âm')} className="rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-30">+1 bán âm</button>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <h3 className="font-bold">Lời ca theo khoảng ô nhịp</h3>
          <div className="flex flex-wrap items-end gap-2"><label className="text-xs text-zinc-400">Từ ô<input type="number" value={startMeasure} onChange={e => setStartMeasure(Number(e.target.value))} className="mt-1 block w-24 rounded-lg border border-white/10 bg-black px-3 py-2" /></label><label className="text-xs text-zinc-400">Đến ô<input type="number" value={endMeasure} onChange={e => setEndMeasure(Number(e.target.value))} className="mt-1 block w-24 rounded-lg border border-white/10 bg-black px-3 py-2" /></label>{fullRange && <button type="button" disabled={readOnly} onClick={() => { setStartMeasure(fullRange.startMeasure); setEndMeasure(fullRange.endMeasure); }} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold disabled:opacity-30">Chọn toàn bộ lời</button>}</div>
          <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder="Nhập các từ theo thứ tự vị trí lời hiện có…" className="min-h-24 w-full rounded-lg border border-white/10 bg-black p-3 text-sm" />
          <button disabled={readOnly} onClick={() => apply(() => setLyricsInMeasureRange(xmlContent, { startMeasure, endMeasure }, lyrics), `Sửa lời ô ${startMeasure}-${endMeasure}`)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold disabled:opacity-30">Áp dụng lời</button>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3 xl:col-span-2">
          <h3 className="font-bold">Nhạc cụ General MIDI</h3>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-zinc-400">Bè<select value={partId} onChange={e => { setPartId(e.target.value); const p=timeline?.parts.find(x=>x.partId===e.target.value); setProgram(String(p?.midiProgram||1)); }} className="mt-1 block rounded-lg border border-white/10 bg-black px-3 py-2 text-sm">{timeline?.parts.map(part => <option key={part.partId} value={part.partId}>{part.name} ({part.partId})</option>)}</select></label>
            <label className="text-xs text-zinc-400">Program 1–128<input type="number" min={1} max={128} value={program} onChange={e => setProgram(e.target.value)} className="mt-1 block w-28 rounded-lg border border-white/10 bg-black px-3 py-2" /></label>
            <button disabled={readOnly || !partId} onClick={() => apply(() => setPartMidiProgram(xmlContent, partId, Number(program)), `Đổi nhạc cụ ${partId}`)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold disabled:opacity-30">Áp dụng nhạc cụ vào bản nhạc</button>
          </div>
        </section>
      </div>
      {message && <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-300">{message}</div>}
    </div>
  );
};
