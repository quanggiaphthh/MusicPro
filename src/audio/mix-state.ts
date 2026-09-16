import type { ScoreTimeline } from '../music/score-timeline';
import type { MixPartState, MixState } from '../projects/types';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export function createDefaultMix(timeline: ScoreTimeline): MixState {
  const parts: Record<string, MixPartState> = {};
  for (const part of timeline.parts) {
    parts[part.partId] = {
      partId: part.partId,
      volume: 1,
      pan: 0,
      mute: false,
      solo: false,
      midiProgram: part.midiProgram,
    };
  }
  return { parts, masterGain: 1, reverb: 0.12, normalizeExport: true };
}

export function sanitizeMix(mix: MixState | undefined, timeline: ScoreTimeline): MixState {
  const fallback = createDefaultMix(timeline);
  const source = mix || fallback;
  const parts: Record<string, MixPartState> = {};
  for (const part of timeline.parts) {
    const current = source.parts?.[part.partId];
    const midiProgram = current?.midiProgram ?? part.midiProgram;
    parts[part.partId] = {
      partId: part.partId,
      volume: clamp(Number(current?.volume ?? 1), 0, 1.5),
      pan: clamp(Number(current?.pan ?? 0), -1, 1),
      mute: current?.mute === true,
      solo: current?.solo === true,
      midiProgram: Number.isFinite(midiProgram) ? Math.max(1, Math.min(128, Math.round(midiProgram as number))) : undefined,
    };
  }
  return {
    parts,
    masterGain: clamp(Number(source.masterGain ?? 1), 0, 1.5),
    reverb: clamp(Number(source.reverb ?? 0.12), 0, 1),
    normalizeExport: source.normalizeExport !== false,
  };
}

export function resolveAudibleParts(mix: MixState): Set<string> {
  const entries = Object.values(mix.parts || {});
  const hasSolo = entries.some(part => part.solo && !part.mute);
  return new Set(
    entries
      .filter(part => !part.mute && (!hasSolo || part.solo))
      .map(part => part.partId),
  );
}

export function mixFingerprint(mix: MixState | undefined, timeline: ScoreTimeline): string {
  const clean = sanitizeMix(mix, timeline);
  const parts = Object.keys(clean.parts).sort().map(partId => {
    const part = clean.parts[partId];
    return [partId, part.volume, part.pan, part.mute ? 1 : 0, part.solo ? 1 : 0, part.midiProgram ?? 0].join(':');
  });
  return [clean.masterGain, clean.reverb, clean.normalizeExport ? 1 : 0, ...parts].join('|');
}
