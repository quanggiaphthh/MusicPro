export type AudioRenderQuality = 'auto' | 'soundfont' | 'basic';

export interface AudioRenderResult<T> {
  value: T;
  renderer: 'soundfont' | 'basic';
  fallbackError?: unknown;
}

/**
 * Prefer the sampled SoundFont renderer while keeping the existing lightweight
 * renderer as a resilient fallback. Explicit soundfont mode surfaces failures
 * so callers/tests can distinguish configuration errors from normal fallback.
 */
export async function renderWithAudioFallback<T>(
  quality: AudioRenderQuality,
  renderSoundFont: () => Promise<T>,
  renderBasic: () => Promise<T>,
): Promise<AudioRenderResult<T>> {
  if (quality === 'basic') {
    return { value: await renderBasic(), renderer: 'basic' };
  }

  try {
    return { value: await renderSoundFont(), renderer: 'soundfont' };
  } catch (error) {
    if (quality === 'soundfont') throw error;
    return {
      value: await renderBasic(),
      renderer: 'basic',
      fallbackError: error,
    };
  }
}
