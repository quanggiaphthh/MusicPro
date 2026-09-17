import assert from 'node:assert/strict';
import { compileSongCoreToMusicXml } from '../../server/music/score-compiler.ts';
import type { SongCoreV1 } from '../../server/music/song-core.ts';
import { validateLeadSheet } from '../../server/music/musicxml-validator.ts';
import { extractSongDNA } from '../../server/music/song-dna.ts';
import { evaluateCompositionQuality } from '../../src/compose/production-quality.ts';
import { parseMusicXMLToTimeline } from '../../src/music/score-timeline.ts';

const core:SongCoreV1={
  version:'1',title:'Compatibility',language:'vi',selectedHookId:'hook-a',
  frame:{tempoBpm:96,key:{tonic:'C',mode:'major'},meter:{beats:4,beatType:4},divisions:24},
  sections:[{id:'verse',type:'verse',label:'Verse',startMeasure:1,endMeasure:1},{id:'chorus',type:'chorus',label:'Chorus',startMeasure:2,endMeasure:2}],
  accompaniment:[{sectionId:'verse',texture:'broken-8th',density:2,register:'mid',energy:2},{sectionId:'chorus',texture:'half-pulse',density:3,register:'mid',energy:4}],
  measures:[
    {number:1,sectionId:'verse',harmony:[{tick:0,rootStep:'C',rootAlter:0,kind:'major'}],vocal:[{tick:0,duration:24,pitch:{step:'C',alter:0,octave:4},lyric:'một'},{tick:24,duration:24,pitch:{step:'D',alter:0,octave:4},lyric:'ngày'},{tick:48,duration:24,pitch:{step:'E',alter:0,octave:4},lyric:'ta'},{tick:72,duration:24,pitch:{step:'D',alter:0,octave:4},lyric:'về'}]},
    {number:2,sectionId:'chorus',harmony:[{tick:0,rootStep:'F',rootAlter:0,kind:'major'},{tick:48,rootStep:'G',rootAlter:0,kind:'dominant7'}],vocal:[{tick:0,duration:24,pitch:{step:'G',alter:0,octave:4},lyric:'nghe'},{tick:24,duration:24,pitch:{step:'A',alter:0,octave:4},lyric:'mùa'},{tick:48,duration:24,pitch:{step:'B',alter:0,octave:4},lyric:'thương'},{tick:72,duration:24,pitch:{step:'G',alter:0,octave:4},lyric:'gọi'}]},
  ],
};
const songRequest={songForm:'short demo',language:'vi',vocalDirection:'Vocal',harmonyDirection:'Chords'};
const xml=compileSongCoreToMusicXml(core);
const validation=validateLeadSheet(xml,songRequest);
assert.equal(validation.isValid,true,`compiled r3 score must pass existing validator: ${validation.errors.join(', ')}`);
const dna=extractSongDNA(xml);
assert.ok(Number(dna.musical.approximateDuration||0)>0,'SongDNA must extract positive duration');
if(typeof DOMParser!=='undefined'){
  const timeline=parseMusicXMLToTimeline(xml);
  assert.ok(timeline.parts.length>=2,'timeline must parse Vocal + Piano parts');
  assert.ok(timeline.totalQuarters>0,'timeline duration must be positive');
}
const quality=evaluateCompositionQuality({xml,songDna:dna,songRequest});
const texture=quality.checks.find(item=>item.id==='accompaniment-texture');
assert.ok(texture && texture.status!=='fail',`r3 piano must not fail accompaniment-texture: ${texture?.detail||'missing check'}`);
console.log('r3-score-compatibility.test.ts PASS');
