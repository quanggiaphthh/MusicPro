import type { MixState } from '../projects/types';

export function equalPowerPan(pan: number): { left: number; right: number } {
  const clamped = Math.max(-1, Math.min(1, Number.isFinite(pan) ? pan : 0));
  const angle = (clamped + 1) * Math.PI / 4;
  return { left: Math.cos(angle), right: Math.sin(angle) };
}

function normalizePeak(left: Float32Array, right: Float32Array, ceiling = 0.94): void {
  let peak = 0;
  for (let i = 0; i < left.length; i++) peak = Math.max(peak, Math.abs(left[i] || 0), Math.abs(right[i] || 0));
  if (peak <= 0 || peak <= ceiling) return;
  const scale = ceiling / peak;
  for (let i = 0; i < left.length; i++) {
    left[i] *= scale;
    right[i] *= scale;
  }
}

/** Deterministic, light ambience suited to score preview rather than mastering. */
function applyShortReverb(left: Float32Array, right: Float32Array, sampleRate: number, amount: number): void {
  if (amount <= 0) return;
  const delayA = Math.max(1, Math.round(sampleRate * 0.031));
  const delayB = Math.max(1, Math.round(sampleRate * 0.047));
  const wet = Math.min(0.35, amount * 0.32);
  const feedback = 0.23 + amount * 0.12;
  for (let i = 0; i < left.length; i++) {
    const lA = i >= delayA ? left[i - delayA] : 0;
    const lB = i >= delayB ? left[i - delayB] : 0;
    const rA = i >= delayA ? right[i - delayA] : 0;
    const rB = i >= delayB ? right[i - delayB] : 0;
    left[i] += (rA * 0.6 + lB * 0.4) * wet * feedback;
    right[i] += (lA * 0.6 + rB * 0.4) * wet * feedback;
  }
}

export function applyMasterMix(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  mix: Pick<MixState, 'masterGain' | 'reverb' | 'normalizeExport'>,
): void {
  const master = Math.max(0, Math.min(1.5, mix.masterGain));
  for (let i = 0; i < left.length; i++) {
    left[i] *= master;
    right[i] *= master;
  }
  applyShortReverb(left, right, sampleRate, Math.max(0, Math.min(1, mix.reverb)));
  if (mix.normalizeExport) normalizePeak(left, right);
}
