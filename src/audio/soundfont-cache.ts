import { openDB } from 'idb';

const CACHE_DB = 'music-pro-audio-assets';
const CACHE_STORE = 'soundfonts';
const CACHE_VERSION = 1;
const MIN_SOUNDFONT_BYTES = 1_000_000;

// Pinned upstream asset. Production deployments may override this with a
// self-hosted URL through VITE_SOUNDFONT_URL without changing application code.
export const DEFAULT_SOUNDFONT_URL =
  'https://raw.githubusercontent.com/spessasus/SpessaSynth/5bef3d230d63e73946d4c77342eef953d6542fee/soundfonts/GeneralUserGS.sf3';

let inMemoryPromise: Promise<ArrayBuffer> | null = null;
let inMemoryUrl: string | null = null;

export function resolveSoundFontUrl(): string {
  const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
  const configured = meta.env?.VITE_SOUNDFONT_URL?.trim();
  return configured || DEFAULT_SOUNDFONT_URL;
}

async function openCache() {
  return openDB(CACHE_DB, CACHE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CACHE_STORE)) db.createObjectStore(CACHE_STORE);
    },
  });
}

async function readCached(url: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openCache();
    const value = await db.get(CACHE_STORE, url);
    if (value instanceof ArrayBuffer && value.byteLength >= MIN_SOUNDFONT_BYTES) return value;
  } catch {
    // IndexedDB may be unavailable in private/embedded environments. Network
    // loading remains usable and the browser HTTP cache can still help.
  }
  return null;
}

async function writeCached(url: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await openCache();
    await db.put(CACHE_STORE, buffer.slice(0), url);
  } catch {
    // Caching is best-effort and must never prevent playback.
  }
}

async function fetchSoundFont(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'force-cache',
      mode: 'cors',
    });
    if (!response.ok) throw new Error(`Không tải được bộ nhạc cụ (${response.status}).`);
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < MIN_SOUNDFONT_BYTES) {
      throw new Error('Bộ nhạc cụ tải về không hợp lệ hoặc chưa đầy đủ.');
    }
    void writeCached(url, buffer);
    return buffer;
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Load the sampled General MIDI bank, preferring IndexedDB after first use. */
export function loadSoundFontBuffer(url = resolveSoundFontUrl()): Promise<ArrayBuffer> {
  if (inMemoryPromise && inMemoryUrl === url) return inMemoryPromise;
  inMemoryUrl = url;
  inMemoryPromise = (async () => {
    const cached = await readCached(url);
    if (cached) return cached;
    return fetchSoundFont(url);
  })().catch(error => {
    inMemoryPromise = null;
    inMemoryUrl = null;
    throw error;
  });
  return inMemoryPromise;
}
