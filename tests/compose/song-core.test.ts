import assert from 'node:assert/strict';
import { applySongCorePatch, hookFingerprint, measureTicksForFrame, songCoreFingerprint, validateSongCore, type HookCandidate, type SongCoreV1 } from '../../server/music/song-core.ts';

function core4(): SongCoreV1 {
  return {
    version:'1', title:'T', language:'vi', selectedHookId:'h1',
    frame:{ tempoBpm:72, key:{tonic:'C',mode:'major'}, meter:{beats:4,beatType:4}, divisions:24 },
    sections:[{id:'s1',type:'chorus',label:'Chorus',startMeasure:1,endMeasure:2}],
    measures:[1,2].map(number=>({number,sectionId:'s1',harmony:[{tick:0,rootStep:'C',rootAlter:0,kind:'major'}],vocal:[{tick:0,duration:24,pitch:{step:'C',alter:0,octave:4},lyric:'ma'},{tick:24,duration:24,pitch:{step:'D',alter:0,octave:4},lyric:'má'},{tick:48,duration:48,rest:true}]})),
    accompaniment:[{sectionId:'s1',texture:'half-pulse',density:2,register:'mid',energy:3}],
  };
}
function clone<T>(x:T):T { return JSON.parse(JSON.stringify(x)); }
function hasCode(result:ReturnType<typeof validateSongCore>,code:string){ assert.ok(result.errors.some(e=>e.code===code), `${code}: ${JSON.stringify(result.errors)}`); }

assert.equal(measureTicksForFrame(core4().frame),96);
const six=core4(); six.frame.meter={beats:6,beatType:8}; assert.equal(measureTicksForFrame(six.frame),72);
assert.equal(validateSongCore(core4()).ok,true);

const gap=core4(); gap.measures[1].number=3; hasCode(validateSongCore(gap),'MEASURE_GRID_GAP');
const overlap=core4(); overlap.measures[0].vocal[1].tick=12; hasCode(validateSongCore(overlap),'VOCAL_OVERLAP');
const past=core4(); past.measures[0].vocal=[{tick:72,duration:48,pitch:{step:'C',alter:0,octave:4}}]; hasCode(validateSongCore(past),'EVENT_OUT_OF_BAR');
const unknown=core4(); unknown.measures[0].sectionId='missing'; hasCode(validateSongCore(unknown),'UNKNOWN_SECTION');
const sections=core4(); sections.sections.push({id:'s2',type:'verse',label:'Verse',startMeasure:2,endMeasure:2}); hasCode(validateSongCore(sections),'SECTION_OVERLAP');
const harm=core4(); (harm.measures[0].harmony[0] as any).kind='power'; hasCode(validateSongCore(harm),'UNSUPPORTED_HARMONY');

const badKey=core4(); badKey.frame.key.tonic='H'; hasCode(validateSongCore(badKey),'INVALID_KEY_TONIC');
const wrongSection=core4();
wrongSection.sections=[
  {id:'s1',type:'verse',label:'Verse',startMeasure:1,endMeasure:1},
  {id:'s2',type:'chorus',label:'Chorus',startMeasure:2,endMeasure:2},
];
wrongSection.measures[1].sectionId='s1';
hasCode(validateSongCore(wrongSection),'SECTION_MEASURE_MISMATCH');
const badBassAlter=core4(); (badBassAlter.measures[0].harmony[0] as any).bassStep='C'; (badBassAlter.measures[0].harmony[0] as any).bassAlter=3; hasCode(validateSongCore(badBassAlter),'INVALID_HARMONY_BASS_ALTER');



// Structural validation can enforce the full-song duration floor when the caller requests it.
const durationFloor=validateSongCore(core4(),{minimumDurationSeconds:150});
hasCode(durationFloor,'SONG_TOO_SHORT');
const longCore=core4();
longCore.frame.tempoBpm=80;
longCore.sections=[{id:'s1',type:'chorus',label:'Chorus',startMeasure:1,endMeasure:50}];
longCore.measures=Array.from({length:50},(_,i)=>({
  number:i+1,sectionId:'s1',harmony:[{tick:0,rootStep:'C' as const,rootAlter:0 as const,kind:'major' as const}],
  vocal:[{tick:0,duration:96,rest:true as const}],
}));
assert.equal(validateSongCore(longCore,{minimumDurationSeconds:150}).ok,true,'50 bars at 80 BPM in 4/4 equals the 150-second floor');

const reorder=clone(core4());
reorder.measures[0] = { vocal: reorder.measures[0].vocal, harmony: reorder.measures[0].harmony, sectionId:'s1', number:1 } as any;
assert.equal(songCoreFingerprint(core4()), songCoreFingerprint(reorder));

const hook:HookCandidate={id:'h1',measures:core4().measures};
assert.equal(hookFingerprint(hook),hookFingerprint(clone(hook)));

const patched=applySongCorePatch(core4(),{replaceMeasures:[{...clone(core4().measures[1]),vocal:[{tick:0,duration:96,rest:true}]}]});
assert.equal(patched.measures[0].vocal[0].lyric,'ma');
assert.equal(patched.measures[1].vocal[0].rest,true);
assert.throws(()=>applySongCorePatch(core4(),{replaceMeasures:[{...clone(core4().measures[1]),number:9}]}),/not present|measure/i);
assert.throws(()=>applySongCorePatch(core4(),{replaceMeasures:[],frame:clone(core4().frame)} as any),/immutable/i);

console.log('song-core.test.ts PASS');
