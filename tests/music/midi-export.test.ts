import { encodeVariableLength, timelineToMidiBytes } from '../../src/music/midi-export';
import type { ScoreTimeline } from '../../src/music/score-timeline';
import type { MixState } from '../../src/projects/types';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
assert(JSON.stringify(encodeVariableLength(128)) === JSON.stringify([0x81,0x00]), 'VLQ 128');
const timeline: ScoreTimeline = {
  title:'Test',tempoMap:[{quarter:0,bpm:120}],timeSignatures:[{quarter:0,beats:4,beatType:4}],measureStarts:[{measure:1,quarter:0}],totalQuarters:4,totalDurationSeconds:2,
  parts:[
    {partId:'P1',name:'Piano',midiProgram:1,events:[{id:'n',partId:'P1',midi:60,startQuarter:0,durationQuarter:1,velocity:90,measure:1,voice:'1',staff:'1'}]},
    {partId:'P10',name:'Drums',isPercussion:true,events:[{id:'d',partId:'P10',midi:36,startQuarter:0,durationQuarter:.25,velocity:100,measure:1,voice:'1',staff:'1'}]},
  ],
};
const mix: MixState = { masterGain:1,reverb:0,normalizeExport:true,parts:{
  P1:{partId:'P1',volume:.8,pan:.25,mute:false,solo:false,midiProgram:34},
  P10:{partId:'P10',volume:1,pan:0,mute:false,solo:false,midiProgram:99},
}};
const bytes = Array.from(timelineToMidiBytes(timeline,480,mix));
assert(bytes.some((value,index,all)=>value===0xC0 && all[index+1]===33), 'mixer program 34 emits zero-based 33');
assert(bytes.some((value,index,all)=>value===0x99 && all[index+1]===36), 'drums channel 10');
assert(!bytes.some((value,index,all)=>value===0xC9 && all[index+1]===98), 'percussion ignores melodic program override');
assert(bytes.some((value,index)=>value===0xB0 && (bytes[index+1]===7 || bytes[index+1]===10)), 'volume/pan controller emitted');
console.log('MIDI EXPORT TESTS PASSED');
