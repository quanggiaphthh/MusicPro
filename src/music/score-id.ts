/**
 * Deterministic identity for a MusicXML string.
 * Hashes every character so even a one-note/tempo edit invalidates the active playback track.
 */
export function scoreTrackId(xml: string): string {
  let hash = 2166136261;
  for (let index = 0; index < xml.length; index++) {
    hash ^= xml.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `score-${(hash >>> 0).toString(16)}-${xml.length}`;
}
