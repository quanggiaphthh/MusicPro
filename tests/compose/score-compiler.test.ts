import assert from 'node:assert/strict';
import type { SongCoreV1, AccompanimentTexture } from '../../server/music/song-core.ts';
import { compileSongCoreToMusicXml, realizePiano } from '../../server/music/score-compiler.ts';

function coreFor(texture:AccompanimentTexture='half-pulse'):SongCoreV1 {
  return {
    version:'1', title:'Mưa & Nắng <3', language:'vi', selectedHookId:'hook-b',
    frame:{tempoBpm:96,key:{tonic:'C',mode:'major'},meter:{beats:4,beatType:4},divisions:24},
    sections:[{id:'chorus',type:'chorus',label:'Điệp khúc & cao trào',startMeasure:1,endMeasure:2}],
    accompaniment:[{sectionId:'chorus',texture,density:3,register:'mid',energy:4}],
    measures:[
      {number:1,sectionId:'chorus',harmony:[
        {tick:0,rootStep:'C',rootAlter:0,kind:'major'},
        {tick:48,rootStep:'G',rootAlter:0,kind:'dominant7'},
      ],vocal:[
        {tick:0,duration:24,pitch:{step:'E',alter:0,octave:4},lyric:'mưa &'},
        {tick:24,duration:24,rest:true},
        {tick:48,duration:48,pitch:{step:'G',alter:0,octave:4},lyric:'nắng <3',tie:'start'},
      ]},
      {number:2,sectionId:'chorus',harmony:[
        {tick:0,rootStep:'F',rootAlter:0,kind:'major7'},
        {tick:24,rootStep:'D',rootAlter:0,kind:'sus2'},
      ],vocal:[
        {tick:0,duration:48,pitch:{step:'G',alter:0,octave:4},lyric:'về',tie:'stop'},
        {tick:72,duration:24,pitch:{step:'E',alter:0,octave:4},lyric:'đây'},
      ]},
    ],
  };
}

for (const texture of ['block','half-pulse','broken-8th','syncopated-pop'] as const) {
  const core=coreFor(texture);
  const piano=realizePiano(core);
  assert.equal(piano.measures.length,2,`${texture}: measure grid`);
  assert.ok(piano.measures.every(m=>m.events.length>=2),`${texture}: non-pad attacks`);
  const xml1=compileSongCoreToMusicXml(core);
  const xml2=compileSongCoreToMusicXml(core);
  assert.equal(xml1,xml2,`${texture}: byte deterministic`);
  assert.match(xml1,/version="4\.0"/);
  assert.match(xml1,/<score-part id="P1">/);
  assert.match(xml1,/<score-part id="P2">/);
  assert.match(xml1,/Mưa &amp; Nắng &lt;3/);
  assert.match(xml1,/mưa &amp;/);
  assert.match(xml1,/nắng &lt;3/);
}

const xml=compileSongCoreToMusicXml(coreFor());
assert.match(xml,/<kind>dominant<\/kind>/,'dominant7 MusicXML mapping');
assert.match(xml,/<kind>major-seventh<\/kind>/,'major7 MusicXML mapping');
assert.match(xml,/<kind>suspended-second<\/kind>/,'sus2 MusicXML mapping');
assert.match(xml,/<offset>48<\/offset>/,'mid-measure harmony offset');
assert.match(xml,/<offset>24<\/offset>/,'second-measure harmony offset');

// MusicXML tie element must precede voice/type; notation follows type/staff.
const tieStart=xml.match(/<note>[^]*?<pitch><step>G<\/step><octave>4<\/octave><\/pitch><duration>48<\/duration>([^]*?)<lyric>/)?.[1] || '';
assert.ok(tieStart.indexOf('<tie type="start"/>')>=0,'tie start emitted');
assert.ok(tieStart.indexOf('<tie type="start"/>') < tieStart.indexOf('<voice>1</voice>'),'tie before voice');
assert.ok(tieStart.indexOf('<notations><tied type="start"/></notations>') > tieStart.indexOf('<type>half</type>'),'tied notation after type');

// Missing vocal span in measure 2 (tick 48..72) must become an explicit rest.
assert.match(xml,/<measure number="2">[^]*?<rest\/><duration>24<\/duration>/,'vocal gaps are filled with rests');

// Every <chord/> note must follow a note in the same voice/staff. This mirrors the
// protected MusicXML validator contract and prevents cross-staff chord encoding.
const p2=xml.match(/<part id="P2">([^]*?)<\/part>/)?.[1] || '';
for (const measureBody of [...p2.matchAll(/<measure number="\d+">([^]*?)<\/measure>/g)].map(m=>m[1])) {
  let previousVoiceStaff='';
  for (const match of measureBody.matchAll(/<note>([^]*?)<\/note>/g)) {
    const body=match[1];
    const voice=body.match(/<voice>(\d+)<\/voice>/)?.[1] || '1';
    const staff=body.match(/<staff>(\d+)<\/staff>/)?.[1] || '1';
    const current=`${voice}-${staff}`;
    if (body.includes('<chord/>')) assert.equal(current,previousVoiceStaff,'chord note must follow same voice/staff');
    previousVoiceStaff=current;
  }
}

// Chord state must reset per attack/measure: first piano note in measure 2 cannot carry <chord/>.
const p2m2=xml.match(/<part id="P2">[^]*?<measure number="2">([^]*?)<\/measure>/)?.[1] || '';
const firstPianoNote=p2m2.match(/<note>([^]*?)<\/note>/)?.[1] || '';
assert.ok(!firstPianoNote.includes('<chord/>'),'no chord-state leak across measures');

// Meter arithmetic: 6/8 bar is 72 ticks and all attacks are clipped inside it.
const sixEight=coreFor('broken-8th');
sixEight.frame={tempoBpm:80,key:{tonic:'A',mode:'minor'},meter:{beats:6,beatType:8},divisions:24};
sixEight.measures=sixEight.measures.map(m=>({...m,harmony:m.harmony.filter(h=>h.tick<72),vocal:[{tick:0,duration:72,rest:true}]}));
const realized68=realizePiano(sixEight);
assert.ok(realized68.measures.every(m=>m.events.every(e=>e.tick>=0 && e.tick+e.duration<=72)),'6/8 events stay inside bar');
assert.match(compileSongCoreToMusicXml(sixEight),/<beats>6<\/beats><beat-type>8<\/beat-type>/);

console.log('score-compiler.test.ts PASS');
