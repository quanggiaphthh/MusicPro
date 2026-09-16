import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { HtmlMediaPlaybackEngine, type PreviewQuality } from '../audio/media-playback-engine';
import type { MixState } from '../projects/types';
import { parseMusicXMLToTimeline } from '../music/score-timeline';

interface AudioState {
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTrackTitle: string;
  currentTrackArtist: string;
  hasTrack: boolean;
  currentTrackId: string | null;
  renderer: 'soundfont' | 'basic' | 'custom' | null;
}

interface AudioContextType extends AudioState {
  togglePlay: () => Promise<void>;
  seek: (value: number) => Promise<void>;
  stop: () => void;
  setTrack: (title: string, artist: string) => void;
  loadMusicXml: (xml: string, title: string, artist?: string, autoPlay?: boolean, trackId?: string, mix?: MixState, quality?: PreviewQuality) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engineRef = useRef<HtmlMediaPlaybackEngine | null>(null);
  const timerRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrackTitle, setCurrentTrackTitle] = useState('Chưa có bài hát');
  const [currentTrackArtist, setCurrentTrackArtist] = useState('Chọn một bản nhạc để phát');
  const [hasTrack, setHasTrack] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [renderer, setRenderer] = useState<'soundfont' | 'basic' | 'custom' | null>(null);

  if (!engineRef.current) engineRef.current = new HtmlMediaPlaybackEngine();

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const pollProgress = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const next = engine.getPosition();
    setProgress(next);
    if (!engine.isPlaying || next >= engine.duration) {
      setIsPlaying(false);
      stopTimer();
    }
  }, [stopTimer]);

  useEffect(() => {
    if (isPlaying) {
      stopTimer();
      timerRef.current = window.setInterval(pollProgress, 100);
    } else stopTimer();
    return stopTimer;
  }, [isPlaying, pollProgress, stopTimer]);

  useEffect(() => () => {
    stopTimer();
    engineRef.current?.dispose();
  }, [stopTimer]);

  const loadMusicXml = useCallback(async (
    xml: string,
    title: string,
    artist = 'Music-Pro Score Preview',
    autoPlay = false,
    trackId?: string,
    mix?: MixState,
    quality: PreviewQuality = 'standard',
  ) => {
    const engine = engineRef.current;
    if (!engine) return;
    const timeline = parseMusicXMLToTimeline(xml);
    const resolvedTrackId = trackId || `${title || timeline.title || 'score'}:${xml.length}`;
    await engine.load(timeline, resolvedTrackId, mix, quality);
    setCurrentTrackTitle(title || timeline.title || 'Bản nhạc Music-Pro');
    setCurrentTrackArtist(artist);
    setDuration(timeline.totalDurationSeconds);
    setProgress(engine.getPosition());
    setHasTrack(true);
    setCurrentTrackId(resolvedTrackId);
    setRenderer(engine.renderer);
    setIsPlaying(false);
    if (autoPlay) {
      await engine.play(0);
      setIsPlaying(engine.isPlaying);
      setProgress(engine.getPosition());
    }
  }, []);

  const togglePlay = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || !hasTrack) return;
    await engine.toggle();
    setIsPlaying(engine.isPlaying);
    setProgress(engine.getPosition());
  }, [hasTrack]);

  const seek = useCallback(async (value: number) => {
    const engine = engineRef.current;
    if (!engine || !hasTrack) return;
    await engine.seek(value);
    setProgress(engine.getPosition());
    setIsPlaying(engine.isPlaying);
  }, [hasTrack]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setProgress(0);
    setIsPlaying(false);
  }, []);

  const setTrack = useCallback((title: string, artist: string) => {
    setCurrentTrackTitle(title);
    setCurrentTrackArtist(artist);
  }, []);

  return (
    <AudioContext.Provider value={{
      isPlaying, progress, duration, currentTrackTitle, currentTrackArtist, hasTrack, currentTrackId, renderer,
      togglePlay, seek, stop, setTrack, loadMusicXml,
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) throw new Error('useAudio must be used within an AudioProvider');
  return context;
};
