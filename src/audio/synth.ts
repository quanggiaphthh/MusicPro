import type { ScoreNoteEvent, ScorePartTimeline } from '../music/score-timeline';

export type AudioContextLike = AudioContext | OfflineAudioContext;

type SynthPart = Pick<ScorePartTimeline, 'name' | 'midiProgram' | 'isPercussion'>;

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function instrumentProfile(part: SynthPart): {
  type: OscillatorType;
  attack: number;
  release: number;
  level: number;
} {
  const name = part.name.toLowerCase();
  const program = Math.max(1, Math.min(128, Math.round(part.midiProgram || 1)));

  if (part.isPercussion || /drum|percussion|kit|trống|bộ gõ/.test(name)) {
    return { type: 'square', attack: 0.002, release: 0.045, level: 0.028 };
  }
  if (/bass|contrabass|cello|trầm/.test(name) || (program >= 33 && program <= 40)) {
    return { type: 'triangle', attack: 0.012, release: 0.12, level: 0.11 };
  }
  if (/string|violin|viola|orchestra|dây/.test(name) || (program >= 41 && program <= 56)) {
    return { type: 'sawtooth', attack: 0.09, release: 0.28, level: 0.045 };
  }
  if (/guitar|acoustic|guit/.test(name) || (program >= 25 && program <= 32)) {
    return { type: 'triangle', attack: 0.005, release: 0.12, level: 0.075 };
  }
  if (/vocal|voice|melody|singer|giọng/.test(name)) {
    return { type: 'sine', attack: 0.025, release: 0.16, level: 0.085 };
  }
  if (program >= 57 && program <= 72) {
    return { type: 'square', attack: 0.018, release: 0.16, level: 0.045 };
  }
  if (program >= 73 && program <= 80) {
    return { type: 'sine', attack: 0.03, release: 0.18, level: 0.07 };
  }
  return { type: 'triangle', attack: 0.008, release: 0.14, level: 0.075 };
}

export function scheduleSynthNote(
  context: AudioContextLike,
  destination: AudioNode,
  note: ScoreNoteEvent,
  part: SynthPart,
  startTime: number,
  durationSeconds: number,
  masterScale = 1,
): OscillatorNode {
  const profile = instrumentProfile(part);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequency = midiToFrequency(note.midi);
  const duration = Math.max(0.03, durationSeconds);
  const attack = Math.min(profile.attack, duration * 0.35);
  const release = Math.min(profile.release, duration * 0.45);
  const peak = Math.max(0.002, profile.level * (note.velocity / 127) * masterScale);
  const sustain = peak * 0.68;
  const releaseStart = Math.max(startTime + attack, startTime + duration - release);

  oscillator.type = profile.type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), startTime + attack);
  if (releaseStart > startTime + attack) {
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, sustain), releaseStart);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
  oscillator.addEventListener('ended', () => {
    try { oscillator.disconnect(); } catch { /* already disconnected */ }
    try { gain.disconnect(); } catch { /* already disconnected */ }
  }, { once: true });
  return oscillator;
}
