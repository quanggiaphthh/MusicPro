import React from 'react';
import { Menu, Music2, Pause, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useAudio } from '../contexts/AudioContext';

interface NowPlayingBarProps {
  onMenuClick: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export const NowPlayingBar: React.FC<NowPlayingBarProps> = ({ onMenuClick }) => {
  const {
    isPlaying,
    progress,
    duration,
    currentTrackTitle,
    currentTrackArtist,
    hasTrack,
    togglePlay,
    seek,
  } = useAudio();
  const percent = duration > 0 ? Math.max(0, Math.min(100, (progress / duration) * 100)) : 0;

  return (
    <div className="h-16 flex items-center justify-between px-3 md:px-4 bg-zinc-950/70 backdrop-blur-xl border-b border-white/5 shrink-0 z-40">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <Music2 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <h4 className="text-xs font-bold text-white truncate max-w-[240px]">{currentTrackTitle}</h4>
            <p className="text-[10px] text-zinc-500 truncate max-w-[240px]">{currentTrackArtist}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-3 px-2 min-w-0">
        <button
          onClick={() => void togglePlay()}
          disabled={!hasTrack}
          className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0 disabled:opacity-30 disabled:hover:scale-100"
          aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <div className="hidden md:flex flex-1 items-center gap-2 max-w-md">
          <span className="w-10 text-right text-[10px] tabular-nums text-zinc-500">{formatTime(progress)}</span>
          <div className="flex-1 h-1 bg-zinc-800 rounded-full relative group overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-white rounded-full pointer-events-none"
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
            />
            <input
              type="range"
              min="0"
              max={Math.max(0.01, duration)}
              step="0.05"
              value={Math.min(progress, Math.max(0.01, duration))}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => void seek(Number(event.target.value))}
              disabled={!hasTrack}
              className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-default"
              aria-label="Vị trí phát"
            />
          </div>
          <span className="w-10 text-[10px] tabular-nums text-zinc-500">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="w-10" />
    </div>
  );
};
