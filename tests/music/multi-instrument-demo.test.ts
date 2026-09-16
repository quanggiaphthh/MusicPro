import { MULTI_INSTRUMENT_DEMO_XML, createMultiInstrumentDemoProject } from '../../src/demo/multi-instrument-demo';
function assert(condition: unknown, message: string): asserts condition { if(!condition)throw new Error(message); }

const measureCount = (MULTI_INSTRUMENT_DEMO_XML.match(/<measure number=/g) || []).length;
assert(measureCount === 64, '16 measures x 4 parts expected');
assert(MULTI_INSTRUMENT_DEMO_XML.includes('<per-minute>96</per-minute>'), 'demo tempo must be 96 BPM');
const approximateSeconds = 16 * 4 * (60 / 96);
assert(approximateSeconds >= 30 && approximateSeconds <= 60, 'demo duration must be 30-60 seconds');
assert((MULTI_INSTRUMENT_DEMO_XML.match(/<note>/g) || []).length >= 64, 'demo must contain audible note events');
for(const name of ['Piano','Bass','Strings','Drums']) assert(MULTI_INSTRUMENT_DEMO_XML.includes(`<part-name>${name}</part-name>`),`missing ${name}`);
assert((MULTI_INSTRUMENT_DEMO_XML.match(/<measure number=/g)||[]).length>=32,'multi-part fixture has many measures');
assert(MULTI_INSTRUMENT_DEMO_XML.includes('<midi-program>1</midi-program>'),'piano program');
assert(MULTI_INSTRUMENT_DEMO_XML.includes('<midi-program>34</midi-program>'),'bass program');
assert(MULTI_INSTRUMENT_DEMO_XML.includes('<midi-program>49</midi-program>'),'strings program');
assert(MULTI_INSTRUMENT_DEMO_XML.includes('<midi-channel>10</midi-channel>'),'drums channel 10');
assert(!/<voice>1<\/voice><notations>[\s\S]*?<type>/.test(MULTI_INSTRUMENT_DEMO_XML), 'notations must not appear before note type');
assert(!MULTI_INSTRUMENT_DEMO_XML.includes('<slur'), 'demo must not contain unmatched slur markers');
assert(MULTI_INSTRUMENT_DEMO_XML.includes('<midi-unpitched>37</midi-unpitched>'),'kick midi-unpitched 37 -> MIDI36');
const bundle=createMultiInstrumentDemoProject(1000);
assert(bundle.project.mix.parts.P1.midiProgram===1&&bundle.project.mix.parts.P2.midiProgram===34,'mix instrument programs');
assert(bundle.revisions[0].musicXml===MULTI_INSTRUMENT_DEMO_XML,'demo revision uses fixture');
console.log('MULTI INSTRUMENT DEMO TESTS PASSED');
