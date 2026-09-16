import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileAudio, FileMusic, Loader2, LocateFixed, Pause, Play, Square } from 'lucide-react';
import { mixFingerprint } from '../audio/mix-state';
import { renderTimelineToWavBlob } from '../audio/offline-render';
import { useAudio } from '../contexts/AudioContext';
import { timelineToMidiBlob } from '../music/midi-export';
import { parseMusicXMLToTimeline } from '../music/score-timeline';
import { getPlaybackVisualState, type ScorePlaybackVisualState } from '../music/score-playback-visuals';
import { scoreTrackId } from '../music/score-id';
import type { MixState } from '../projects/types';
import { settingsService } from '../services/settings';
import { downloadBlob, sanitizeFilename } from '../utils/download';
import { productErrorText } from '../utils/product-errors';

interface ScorePlayerProps {
  xmlContent: string;
  title: string;
  artist?: string;
  filenameBase?: string;
  showMusicXmlDownload?: boolean;
  onCurrentMeasureChange?: (measure: number | undefined) => void;
  onPlaybackVisualChange?: (state: ScorePlaybackVisualState | undefined) => void;
  onRequestRecenter?: () => void;
  mix?: MixState;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const rounded = Math.floor(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

export const ScorePlayer: React.FC<ScorePlayerProps> = ({
  xmlContent,
  title,
  artist = 'Music-Pro Score Preview',
  filenameBase,
  showMusicXmlDownload = true,
  onCurrentMeasureChange,
  onPlaybackVisualChange,
  onRequestRecenter,
  mix,
}) => {
  const audio = useAudio();
  const [renderingWav, setRenderingWav] = useState(false);
  const [preparingAudio, setPreparingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timelineResult = useMemo(() => {
    try { return { timeline: parseMusicXMLToTimeline(xmlContent), error: null as string | null }; }
    catch (cause: any) { return { timeline: null, error: cause?.message || 'Không thể đọc MusicXML để phát.' }; }
  }, [xmlContent]);
  const timeline = timelineResult.timeline;
  const baseScoreId = useMemo(() => scoreTrackId(xmlContent), [xmlContent]);
  const playbackQuality = settingsService.getSettings().playbackQuality;
  const trackId = useMemo(() => timeline ? `${baseScoreId}:${mixFingerprint(mix, timeline)}:${playbackQuality}` : `${baseScoreId}:${playbackQuality}`, [baseScoreId, mix, playbackQuality, timeline]);
  const active = audio.currentTrackId === trackId;
  const progress = active ? audio.progress : 0;
  const playbackVisual = useMemo(() => {
    if (!timeline || !active) return undefined;
    return getPlaybackVisualState(timeline, progress);
  }, [active, progress, timeline]);
  const currentMeasure = playbackVisual?.measure;
  const base = sanitizeFilename(filenameBase || title || timeline?.title || 'music-pro-song');

  useEffect(() => {
    let cancelled = false;
    if (!timeline || audio.currentTrackId === trackId) { setPreparingAudio(false); return; }
    setPreparingAudio(true); setError(null);
    void audio.loadMusicXml(xmlContent, title || timeline.title || 'Music-Pro', artist, false, trackId, mix, playbackQuality)
      .catch((cause: any) => { if (!cancelled) setError(productErrorText(cause, 'Không thể chuẩn bị âm thanh để phát.')); })
      .finally(() => { if (!cancelled) setPreparingAudio(false); });
    return () => { cancelled = true; };
  }, [artist, audio.currentTrackId, audio.loadMusicXml, mix, playbackQuality, timeline, title, trackId, xmlContent]);

  useEffect(() => {
    onPlaybackVisualChange?.(playbackVisual);
  }, [onPlaybackVisualChange, playbackVisual]);

  useEffect(() => { onCurrentMeasureChange?.(currentMeasure); }, [currentMeasure, onCurrentMeasureChange]);

  const handlePlayPause = async () => {
    setError(null);
    try {
      if (!timeline) throw new Error(timelineResult.error || 'MusicXML không hợp lệ.');
      if (active) await audio.togglePlay();
      else await audio.loadMusicXml(xmlContent, title || timeline.title || 'Music-Pro', artist, true, trackId, mix, playbackQuality);
    } catch (cause: any) { setError(productErrorText(cause, 'Không thể phát bản nhạc.')); }
  };
  const handleMidi = () => {
    setError(null);
    try { if (!timeline) throw new Error(timelineResult.error || 'MusicXML không hợp lệ.'); downloadBlob(timelineToMidiBlob(timeline, 480, mix), `${base}.mid`); }
    catch (cause: any) { setError(productErrorText(cause, 'Không thể xuất MIDI.')); }
  };
  const handleWav = async () => {
    setRenderingWav(true); setError(null);
    try {
      if (!timeline) throw new Error(timelineResult.error || 'MusicXML không hợp lệ.');
      const settings = settingsService.getSettings();
      const blob = await renderTimelineToWavBlob(timeline, { sampleRate: settings.playbackQuality === 'high' ? 44100 : 32000, mix: mix ? { ...mix, normalizeExport: settings.normalizeWav && mix.normalizeExport } : mix });
      downloadBlob(blob, `${base}.wav`);
    } catch (cause: any) { setError(productErrorText(cause, 'Không thể kết xuất WAV.')); }
    finally { setRenderingWav(false); }
  };
  const handleMusicXml = () => downloadBlob(new Blob([xmlContent], { type: 'application/vnd.recordare.musicxml+xml' }), `${base}.musicxml`);

  if (!timeline) return <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{timelineResult.error}</div>;
  const bpm = Math.round(timeline.tempoMap[0]?.bpm || 120);

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-4 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="font-bold text-white truncate">{title || timeline.title || 'Bản nhạc Music-Pro'}</div>
          <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-3 gap-y-1"><span>{bpm} BPM</span><span>{timeline.parts.length} bè/nhạc cụ</span><span>{formatTime(timeline.totalDurationSeconds)}</span>{active && audio.renderer && <span>Bộ phát: {audio.renderer === 'soundfont' ? 'SoundFont' : audio.renderer === 'basic' ? 'Synth dự phòng' : 'Tùy chỉnh'}</span>}{currentMeasure !== undefined && <span>Ô nhịp {currentMeasure}</span>}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handlePlayPause} disabled={preparingAudio} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60">
            {preparingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : active && audio.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {preparingAudio ? 'Đang chuẩn bị…' : active && audio.isPlaying ? 'Tạm dừng' : 'Nghe bản nhạc'}
          </button>
          <button onClick={() => active && audio.stop()} disabled={!active} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 disabled:opacity-40"><Square className="w-4 h-4" /> Dừng</button>
          {active && onRequestRecenter && (
            <button
              type="button"
              onClick={onRequestRecenter}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-200 hover:bg-indigo-500/15"
              aria-label="Đến vị trí đang phát trong bản nhạc"
            >
              <LocateFixed className="h-4 w-4" />
              Đến vị trí đang phát
            </button>
          )}
          <button onClick={handleMidi} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200"><FileMusic className="w-4 h-4" /> MIDI</button>
          <button onClick={handleWav} disabled={renderingWav} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 disabled:opacity-50">{renderingWav ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileAudio className="w-4 h-4" />} WAV</button>
          {showMusicXmlDownload && <button onClick={handleMusicXml} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200"><Download className="w-4 h-4" /> MusicXML</button>}
        </div>
      </div>
      {active && <div className="flex items-center gap-3 text-[11px] text-zinc-500"><span className="tabular-nums">{formatTime(audio.progress)}</span><input aria-label="Vị trí phát" type="range" min={0} max={Math.max(.01,audio.duration)} step={.05} value={Math.min(audio.progress,Math.max(.01,audio.duration))} onChange={e => void audio.seek(Number(e.target.value))} className="flex-1 accent-indigo-500"/><span className="tabular-nums">{formatTime(audio.duration)}</span></div>}
      {(error || timelineResult.error) && <div className="text-xs text-red-300">{error || timelineResult.error}</div>}
      <p className="text-[11px] leading-relaxed text-zinc-600">Score Preview phát từ MusicXML master qua SoundFont khi khả dụng; fallback synth chỉ dùng khi bộ nhạc cụ mẫu không tải được.</p>
    </div>
  );
};
