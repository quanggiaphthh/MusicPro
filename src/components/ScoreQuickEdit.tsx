import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { parseMusicXMLToTimeline } from '../music/score-timeline';
import { setMusicXMLTempo, transposeMusicXML } from '../music/musicxml-transform';

interface ScoreQuickEditProps {
  xmlContent: string;
  onChange: (nextXml: string) => void;
}

export const ScoreQuickEdit: React.FC<ScoreQuickEditProps> = ({ xmlContent, onChange }) => {
  const undoStack = useRef<string[]>([]);
  const lastInternalXml = useRef<string | null>(null);
  const timeline = useMemo(() => {
    try {
      return parseMusicXMLToTimeline(xmlContent);
    } catch {
      return null;
    }
  }, [xmlContent]);
  const currentBpm = Math.round(timeline?.tempoMap[0]?.bpm || 120);
  const [tempoInput, setTempoInput] = useState(() => String(currentBpm));
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setTempoInput(String(currentBpm));
    if (lastInternalXml.current === xmlContent) {
      lastInternalXml.current = null;
      return;
    }
    undoStack.current = [];
    setMessage(null);
  }, [currentBpm, xmlContent]);

  const apply = (transform: () => string, label: string) => {
    try {
      const next = transform();
      if (next === xmlContent) return;
      undoStack.current.push(xmlContent);
      if (undoStack.current.length > 20) undoStack.current.shift();
      lastInternalXml.current = next;
      onChange(next);
      setMessage(label);
    } catch (cause: any) {
      setMessage(cause?.message || 'Không thể chỉnh bản nhạc.');
    }
  };

  const undo = () => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    lastInternalXml.current = previous;
    onChange(previous);
    setMessage('Đã hoàn tác chỉnh sửa gần nhất.');
  };

  const applyTempo = () => {
    const parsed = Number(tempoInput);
    if (!Number.isFinite(parsed) || parsed < 30 || parsed > 240) {
      setMessage('BPM phải nằm trong khoảng 30–240.');
      return;
    }
    const bpm = Math.round(parsed);
    apply(() => setMusicXMLTempo(xmlContent, bpm), `Đã đổi tempo thành ${bpm} BPM.`);
  };

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-sm font-bold text-white">Chỉnh nhanh bản nhạc</div>
          <div className="text-xs text-zinc-500 mt-1">Thay đổi được áp dụng trực tiếp lên MusicXML hiện tại và cập nhật cả Playback/MIDI/WAV.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Tông</span>
          <button onClick={() => apply(() => transposeMusicXML(xmlContent, -1), 'Đã hạ tông 1 bán âm.')} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold hover:bg-white/10">−1 bán âm</button>
          <button onClick={() => apply(() => transposeMusicXML(xmlContent, 1), 'Đã nâng tông 1 bán âm.')} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold hover:bg-white/10">+1 bán âm</button>
          <span className="ml-2 text-xs text-zinc-500">BPM</span>
          <input
            type="number"
            min={30}
            max={240}
            value={tempoInput}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTempoInput(event.target.value)}
            className="w-20 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white"
          />
          <button onClick={applyTempo} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">Áp dụng</button>
          <button onClick={undo} disabled={undoStack.current.length === 0} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold disabled:opacity-30">
            <RotateCcw className="h-3.5 w-3.5" /> Hoàn tác
          </button>
        </div>
      </div>
      {message && <div className="mt-2 text-xs text-zinc-400">{message}</div>}
    </div>
  );
};
