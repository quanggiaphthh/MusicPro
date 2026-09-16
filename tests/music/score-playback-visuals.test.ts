import {
  getPlaybackVisualState,
  syncOsmdCursorToQuarter,
} from '../../src/music/score-playback-visuals.ts';
import type { ScoreTimeline } from '../../src/music/score-timeline.ts';

const timeline: ScoreTimeline = {
  tempoMap: [{ quarter: 0, bpm: 60 }],
  timeSignatures: [{ quarter: 0, beats: 4, beatType: 4 }],
  measureStarts: [
    { measure: 1, quarter: 0 },
    { measure: 2, quarter: 4 },
  ],
  totalQuarters: 8,
  totalDurationSeconds: 8,
  parts: [{
    partId: 'P1',
    name: 'Piano',
    events: [
      { id: 'c', partId: 'P1', midi: 60, startQuarter: 0, durationQuarter: 1, velocity: 84, measure: 1, voice: '1', staff: '1' },
      { id: 'e', partId: 'P1', midi: 64, startQuarter: 1, durationQuarter: 1, velocity: 84, measure: 1, voice: '1', staff: '1' },
      { id: 'g', partId: 'P1', midi: 67, startQuarter: 1, durationQuarter: 1, velocity: 84, measure: 1, voice: '1', staff: '1' },
      { id: 'd', partId: 'P1', midi: 62, startQuarter: 4, durationQuarter: 1, velocity: 84, measure: 2, voice: '1', staff: '1' },
    ],
  }],
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const atHalf = getPlaybackVisualState(timeline, 0.5);
assert(atHalf.quarter === 0.5, `expected quarter 0.5, got ${atHalf.quarter}`);
assert(atHalf.measure === 1, `expected measure 1, got ${atHalf.measure}`);
assert(atHalf.measureStartQuarter === 0, `expected measure start 0, got ${atHalf.measureStartQuarter}`);
assert(atHalf.activeOnsetQuarter === 0, `expected active onset 0, got ${atHalf.activeOnsetQuarter}`);
assert(atHalf.activeEvents.map(event => event.id).join(',') === 'c', 'C4 should be active');

const chord = getPlaybackVisualState(timeline, 1.25);
assert(chord.activeEvents.map(event => event.id).sort().join(',') === 'e,g', 'chord notes should be active together');
assert(chord.activeOnsetQuarter === 1, `expected chord onset 1, got ${chord.activeOnsetQuarter}`);

const boundary = getPlaybackVisualState(timeline, 2);
assert(boundary.activeEvents.length === 0, 'events end exclusively at start + duration');

const fakeIterator: any = {
  currentTimeStamp: { realValue: 0 },
  endReached: false,
};
const fakeCursor: any = {
  iterator: fakeIterator,
  reset() { fakeIterator.currentTimeStamp.realValue = 0; },
  next() { fakeIterator.currentTimeStamp.realValue += 0.25; },
};

const moved = syncOsmdCursorToQuarter(fakeCursor, 2);
assert(moved === 2, `cursor should advance to quarter 2, got ${moved}`);

fakeIterator.currentTimeStamp.realValue = 1;
const rewound = syncOsmdCursorToQuarter(fakeCursor, 1, 4);
assert(rewound === 1, `cursor should reset and move to quarter 1, got ${rewound}`);

console.log('PASS score-playback-visuals');
