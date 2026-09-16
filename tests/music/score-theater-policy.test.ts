import fs from 'node:fs';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const source = fs.readFileSync('src/components/MusicXMLViewer.tsx', 'utf8');

assert(!source.includes('FollowCursor = true'), 'Score Theater must not enable OSMD FollowCursor');
assert(source.includes('follow: false'), 'OSMD cursors must explicitly disable follow');
assert(source.includes('overflow-y-auto'), 'Score Theater must own a vertical manual-scroll viewport');
assert(source.includes('overscroll-contain'), 'Score Theater must contain score overscroll');
assert(source.includes('Đến vị trí đang phát') === false, 'recenter label belongs in ScorePlayer, not the viewer');
assert(source.includes('GNotesUnderCursor'), 'viewer should use OSMD 2.1.2 graphical notes for best-effort glow');
assert(!source.includes('scrollIntoView'), 'playback must not use scrollIntoView');
assert((source.match(/viewport\.scrollTo\(/g) || []).length === 1, 'viewer may scroll only in the explicit recenter path');
assert(source.includes('musicpro-score-viewport'), 'viewer must expose a dedicated score viewport');


const player = fs.readFileSync('src/components/ScorePlayer.tsx', 'utf8');
const workspace = fs.readFileSync('src/components/ResultWorkspace.tsx', 'utf8');

assert(player.includes('Đến vị trí đang phát'), 'ScorePlayer must expose explicit recenter action');
assert(player.includes('getPlaybackVisualState'), 'ScorePlayer must derive playback visual state from the score timeline');
assert(workspace.includes('recenterToken'), 'ResultWorkspace must bridge one-shot recenter requests');
assert(workspace.includes('playbackVisual'), 'ResultWorkspace must bridge playback visual state to the viewer');

console.log('PASS score-theater-policy');
