import assert from 'node:assert/strict';
import fs from 'node:fs';
import { detectVietnameseTone, evaluateVietnameseToneGuard } from '../../server/music/vietnamese-tone-guard.ts';
import type { SongCoreV1 } from '../../server/music/song-core.ts';

assert.equal(detectVietnameseTone('ma'),'ngang');
assert.equal(detectVietnameseTone('má'),'sắc');
assert.equal(detectVietnameseTone('mà'),'huyền');
assert.equal(detectVietnameseTone('mả'),'hỏi');
assert.equal(detectVietnameseTone('mã'),'ngã');
assert.equal(detectVietnameseTone('mạ'),'nặng');
assert.equal(detectVietnameseTone('phượng'),'nặng');

function pair(fromLyric:string,toLyric:string,fromMidi:number,toMidi:number, type:'chorus'|'verse'='chorus'):SongCoreV1 {
  const pitch=(m:number)=>{ const pc=((m%12)+12)%12; const map:any=[['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]][pc]; return {step:map[0],alter:map[1],octave:Math.floor(m/12)-1}; };
  return {version:'1',title:'x',language:'vi',selectedHookId:'h',frame:{tempoBpm:80,key:{tonic:'C',mode:'major'},meter:{beats:4,beatType:4},divisions:24},sections:[{id:'s',type,label:type,startMeasure:1,endMeasure:1}],measures:[{number:1,sectionId:'s',harmony:[],vocal:[{tick:0,duration:24,pitch:pitch(fromMidi),lyric:fromLyric},{tick:24,duration:24,pitch:pitch(toMidi),lyric:toLyric},{tick:48,duration:48,rest:true}]}],accompaniment:[{sectionId:'s',texture:'block',density:1,register:'mid',energy:2}]};
}
const up=evaluateVietnameseToneGuard(pair('ma','má',60,64)); assert.equal(up.contraryPairs.length,0); assert.equal(up.status,'PASS');
const downBad=evaluateVietnameseToneGuard(pair('ma','má',64,59)); assert.equal(downBad.contraryPairs.length,1); assert.ok(downBad.score<75);
const fall=evaluateVietnameseToneGuard(pair('ma','mà',64,60)); assert.equal(fall.contraryPairs.length,0);
const lowToHigh=evaluateVietnameseToneGuard(pair('mà','má',60,64)); assert.equal(lowToHigh.contraryPairs.length,0);
const oblique=evaluateVietnameseToneGuard(pair('má','mã',60,60)); assert.equal(oblique.contraryPairs.length,0); assert.equal(oblique.status,'PASS');
const english=pair('love','you',60,64); english.language='en'; const na=evaluateVietnameseToneGuard(english); assert.equal(na.status,'NOT_APPLICABLE'); assert.equal(na.evaluatedPairs,0);

// Consecutive lyric-bearing notes remain consecutive across a barline inside the
// same section. The guard must not reset merely because the measure changed.
const crossBar=pair('ma','má',64,59);
crossBar.sections[0].endMeasure=2;
crossBar.measures=[
  {number:1,sectionId:'s',harmony:[],vocal:[{tick:72,duration:24,pitch:{step:'E',alter:0,octave:4},lyric:'ma'}]},
  {number:2,sectionId:'s',harmony:[],vocal:[{tick:0,duration:24,pitch:{step:'B',alter:0,octave:3},lyric:'má'},{tick:24,duration:72,rest:true}]},
];
const crossReport=evaluateVietnameseToneGuard(crossBar);
assert.equal(crossReport.evaluatedPairs,1,'ToneGuard must evaluate a lyric transition across a barline');
assert.equal(crossReport.contraryPairs.length,1,'cross-bar contrary tone/melody motion must be detected');




const source=fs.readFileSync(new URL('../../server/music/vietnamese-tone-guard.ts', import.meta.url),'utf8');
assert.ok(!source.includes('generation-telemetry'), 'ToneGuard must not emit telemetry containing lyric details');
console.log('vietnamese-tone-guard.test.ts PASS');
