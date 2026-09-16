import { createDefaultMix, resolveAudibleParts, sanitizeMix } from '../../src/audio/mix-state';
import type { ScoreTimeline } from '../../src/music/score-timeline';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const timeline: ScoreTimeline = {
  tempoMap:[{quarter:0,bpm:120}],timeSignatures:[{quarter:0,beats:4,beatType:4}],measureStarts:[{measure:1,quarter:0}],totalQuarters:4,totalDurationSeconds:2,
  parts:[
    {partId:'P1',name:'Piano',midiProgram:1,events:[]},
    {partId:'P2',name:'Bass',midiProgram:34,events:[]},
  ],
};
const defaults = createDefaultMix(timeline);
assert(defaults.parts.P1.volume === 1 && defaults.parts.P1.pan === 0, 'defaults');
let sanitized = sanitizeMix({ ...defaults, masterGain: 9, parts: { ...defaults.parts, P1:{...defaults.parts.P1,volume:3,pan:-4,mute:false,solo:false} } }, timeline);
assert(sanitized.masterGain === 1.5, 'master clamp');
assert(sanitized.parts.P1.volume === 1.5 && sanitized.parts.P1.pan === -1, 'part clamps');
let audible = resolveAudibleParts({ ...sanitized, parts: { ...sanitized.parts, P2:{...sanitized.parts.P2,mute:true,solo:false} } });
assert(audible.has('P1') && !audible.has('P2'), 'mute');
audible = resolveAudibleParts({ ...sanitized, parts: { ...sanitized.parts, P1:{...sanitized.parts.P1,solo:false}, P2:{...sanitized.parts.P2,mute:false,solo:true} } });
assert(!audible.has('P1') && audible.has('P2'), 'solo wins');
console.log('MIX STATE TESTS PASSED');
