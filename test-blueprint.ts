import { extractSongDNA } from './server/music/song-dna';
import { buildProductionBlueprint } from './server/music/production-blueprint';
import { buildGeminiMusicBrief } from './server/music/gemini-music-brief';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error("❌ ASSERTION FAILED:", message);
        process.exit(1);
    }
}

console.log("--- Running Targeted Tests ---");

// 1. REGRESSION: C major and A minor
const cMajorXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <key><fifths>0</fifths><mode>major</mode></key>
      </attributes>
    </measure>
  </part>
</score-partwise>`;
const dnaC = extractSongDNA(cMajorXML);
assert(dnaC.musical.key === 'C', '0 fifths + major should be C major');

const aMinorXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <key><fifths>0</fifths><mode>minor</mode></key>
      </attributes>
    </measure>
  </part>
</score-partwise>`;
const dnaA = extractSongDNA(aMinorXML);
assert(dnaA.musical.key === 'A', '0 fifths + minor should be A minor');

// 2. REGRESSION: Vocal + Piano Selection
const selectionXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
    <score-part id="P2"><part-name>Vocal</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1"><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note></measure>
  </part>
  <part id="P2">
    <measure number="1">
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><lyric><text>Hi</text></lyric></note>
    </measure>
  </part>
</score-partwise>`;
const dnaSelection = extractSongDNA(selectionXML);
assert(dnaSelection.selectedMelodyPartId === 'P2', 'Should select Vocal part (P2) because it has lyrics');

// 3. REGRESSION: INVALID_XML
try {
  extractSongDNA("<<<<invalid");
  assert(false, 'Should throw for malformed XML');
} catch (e: any) {
  assert(e.code === 'INVALID_XML', 'Should return INVALID_XML for malformed string');
}

// 4. POLYPHONIC DURATION & CHORD PER VOICE
const polyphonicXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <direction><sound tempo="60"/></direction>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice></note>
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>4</duration><voice>2</voice></note>
      <note><chord/><pitch><step>G</step><octave>3</octave></pitch><duration>4</duration><voice>2</voice></note>
    </measure>
  </part>
</score-partwise>`;
const polyDNA = extractSongDNA(polyphonicXML);
assert(polyDNA.musical.approximateDuration === 4, 'Measure duration should be max of voices, not sum');

// Test CHORD PER VOICE positioning
const voice2Notes = polyDNA.melody.filter(n => n.pitch.startsWith('C3') || n.pitch.startsWith('G3'));
assert(voice2Notes[0].beatPosition === 0, 'Voice 2 C3 beatPosition should be 0');
assert(voice2Notes[1].beatPosition === 0, 'Voice 2 G3 (chord) beatPosition should be 0');

// 5. TEMPO CHANGE
const tempoXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <direction><sound tempo="60"/></direction>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>
    </measure>
    <measure number="2">
      <direction><sound tempo="120"/></direction>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration></note>
    </measure>
  </part>
</score-partwise>`;
const tempoDNA = extractSongDNA(tempoXML);
assert(tempoDNA.musical.tempoChanges!.length === 2, 'Should have 2 tempo changes');
assert(tempoDNA.musical.approximateDuration === 6, 'Total duration should reflect tempo map (4s + 2s)');

// 6. STRUCTURE FILTER & CHORUS MOTIF
const structureXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <direction><sound tempo="120"/></direction>
      <direction><direction-type><words>rit.</words></direction-type></direction>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
    </measure>
    <measure number="2">
      <direction><direction-type><words>Chorus</words></direction-type></direction>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration></note>
    </measure>
  </part>
</score-partwise>`;
const structDNA = extractSongDNA(structureXML);
assert(structDNA.structure.find(s => s.sectionName === 'rit.') === undefined, 'rit. is not a section');
assert(structDNA.structure.find(s => s.sectionName === 'Chorus') !== undefined, 'Chorus is a section');
assert(structDNA.fingerprint.chorusMotif !== undefined, 'Chorus motif should exist when Chorus section exists');

// 7. SECTIONED LYRICS & OVERRIDE
const lyricsBp = buildProductionBlueprint(structDNA, { lyrics: "[Verse 1]\nHello\n[Chorus]\nWorld" });
assert(lyricsBp.lyrics.sections.length === 2, 'Should parse 2 lyric sections');
assert(lyricsBp.lyrics.sections[0].name === 'Verse 1', 'Section name is Verse 1');
assert(lyricsBp.lyrics.sections[1].text === 'World', 'Chorus text is World');
assert(lyricsBp.lyrics.exactLyrics === "[Verse 1]\nHello\n[Chorus]\nWorld", 'Should override lyrics');

// 8. GEMINI BRIEF
const brief = buildGeminiMusicBrief(lyricsBp);
assert(brief.includes('Giọng (Key/Mode): C major'), 'Brief contains key');
assert(brief.includes('BPM: 120'), 'Brief contains BPM');
assert(brief.includes('[Verse 1]'), 'Brief contains exact sectioned lyrics');
assert(brief.includes('Chorus Hook'), 'Brief contains chorus hook');

// 9. TIMING CONFIDENCE: partial with <backup>
const backupXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>
      <backup><duration>4</duration></backup>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration></note>
    </measure>
  </part>
</score-partwise>`;
const backupDNA = extractSongDNA(backupXML);
assert(backupDNA.musical.timingConfidence === 'partial', 'backup should trigger partial timing confidence');
const backupBp = buildProductionBlueprint(backupDNA);
assert(backupBp.musical.targetDuration === undefined, 'targetDuration should be undefined when confidence is partial');

// 10. score-timewise
try {
  extractSongDNA("<score-timewise></score-timewise>");
  assert(false, 'Should throw for timewise');
} catch (e: any) {
  assert(e.code === 'UNSUPPORTED_MUSICXML', 'Should return UNSUPPORTED_MUSICXML');
}

console.log("✅ ALL TARGETED TESTS PASSED!");
