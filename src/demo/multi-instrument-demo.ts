import type { MusicProjectBundle } from '../projects/types';

const chords = [
  { piano: ['C4','E4','G4','C5'], bass: 'C2', strings: 'G4' },
  { piano: ['A3','C4','E4','A4'], bass: 'A2', strings: 'E4' },
  { piano: ['F3','A3','C4','F4'], bass: 'F2', strings: 'C5' },
  { piano: ['G3','B3','D4','G4'], bass: 'G2', strings: 'D5' },
] as const;

function pitchedNote(pitch:string,duration:number,type:string):string {
  const match=pitch.match(/^([A-G])([#b]?)(-?\d+)$/); if(!match)throw new Error(`Bad demo pitch ${pitch}`);
  const [,step,accidental,octave]=match; const alter=accidental==='#'?1:accidental==='b'?-1:0;
  return `<note><pitch><step>${step}</step>${alter?`<alter>${alter}</alter>`:''}<octave>${octave}</octave></pitch><duration>${duration}</duration><voice>1</voice><type>${type}</type></note>`;
}
function measureAttributes(clefSign:string,clefLine:number):string { return `<attributes><divisions>1</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>${clefSign}</sign><line>${clefLine}</line></clef></attributes>`; }
function pianoMeasure(n:number):string { const chord=chords[(n-1)%4].piano; return `<measure number="${n}">${n===1?measureAttributes('G',2)+'<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>96</per-minute></metronome></direction-type><sound tempo="96"/></direction>':''}${chord.map(p=>pitchedNote(p,1,'quarter')).join('')}</measure>`; }
function bassMeasure(n:number):string { return `<measure number="${n}">${n===1?measureAttributes('F',4):''}${pitchedNote(chords[(n-1)%4].bass,4,'whole')}</measure>`; }
function stringsMeasure(n:number):string { const note=pitchedNote(chords[(n-1)%4].strings,4,'whole'); return `<measure number="${n}">${n===1?measureAttributes('G',2):''}${note}</measure>`; }
function drumNote(displayStep:string,displayOctave:number,instrument:string):string { return `<note><unpitched><display-step>${displayStep}</display-step><display-octave>${displayOctave}</display-octave></unpitched><instrument id="${instrument}"/><duration>1</duration><voice>1</voice><type>quarter</type><stem>up</stem></note>`; }
function drumsMeasure(n:number):string { const notes=[drumNote('C',5,'P4-I1'),drumNote('G',5,'P4-I2'),drumNote('C',5,'P4-I1'),drumNote('G',5,'P4-I2')].join(''); return `<measure number="${n}">${n===1?measureAttributes('percussion',2):''}${notes}</measure>`; }
function measures(builder:(n:number)=>string):string { return Array.from({length:16},(_,i)=>builder(i+1)).join(''); }

export const MULTI_INSTRUMENT_DEMO_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Music-Pro Multi Instrument Demo</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name><score-instrument id="P1-I1"><instrument-name>Acoustic Grand Piano</instrument-name></score-instrument><midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>1</midi-program></midi-instrument></score-part>
    <score-part id="P2"><part-name>Bass</part-name><score-instrument id="P2-I1"><instrument-name>Electric Bass</instrument-name></score-instrument><midi-instrument id="P2-I1"><midi-channel>2</midi-channel><midi-program>34</midi-program></midi-instrument></score-part>
    <score-part id="P3"><part-name>Strings</part-name><score-instrument id="P3-I1"><instrument-name>String Ensemble</instrument-name></score-instrument><midi-instrument id="P3-I1"><midi-channel>3</midi-channel><midi-program>49</midi-program></midi-instrument></score-part>
    <score-part id="P4"><part-name>Drums</part-name><score-instrument id="P4-I1"><instrument-name>Bass Drum</instrument-name></score-instrument><score-instrument id="P4-I2"><instrument-name>Closed Hi-Hat</instrument-name></score-instrument><midi-instrument id="P4-I1"><midi-channel>10</midi-channel><midi-unpitched>37</midi-unpitched></midi-instrument><midi-instrument id="P4-I2"><midi-channel>10</midi-channel><midi-unpitched>43</midi-unpitched></midi-instrument></score-part>
  </part-list>
  <part id="P1">${measures(pianoMeasure)}</part>
  <part id="P2">${measures(bassMeasure)}</part>
  <part id="P3">${measures(stringsMeasure)}</part>
  <part id="P4">${measures(drumsMeasure)}</part>
</score-partwise>`;

export function createMultiInstrumentDemoProject(now=Date.now()):MusicProjectBundle {
  const projectId=`demo-multi-${now}`; const revisionId=`demo-revision-${now}`;
  return {
    project:{
      id:projectId,title:'Demo Piano + Bass + Strings + Drums',idea:'Bản kiểm thử SoundFont và Mixer 4 nhạc cụ',style:'STYLE.VN.VPOP-BALLAD',createdAt:now,updatedAt:now,activeRevisionId:revisionId,leadRevisionId:revisionId,
      mix:{masterGain:1,reverb:.14,normalizeExport:true,parts:{
        P1:{partId:'P1',volume:1,pan:-.22,mute:false,solo:false,midiProgram:1},
        P2:{partId:'P2',volume:.9,pan:0,mute:false,solo:false,midiProgram:34},
        P3:{partId:'P3',volume:.78,pan:.28,mute:false,solo:false,midiProgram:49},
        P4:{partId:'P4',volume:.88,pan:0,mute:false,solo:false},
      }},tags:['demo','qa','soundfont'],
    },
    revisions:[{id:revisionId,projectId,label:'Demo 4 nhạc cụ',reason:'compose',musicXml:MULTI_INSTRUMENT_DEMO_XML,createdAt:now}],
  };
}
