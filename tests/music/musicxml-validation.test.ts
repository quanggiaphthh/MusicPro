import { validateMusicXML, validateLeadSheet, validateArrangement } from "../../server/music/musicxml-validator";

console.log("--- Testing MusicXML Validation Logic ---");

const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

if (!validateMusicXML(validXML).isValid) {
    throw new Error("Valid XML failed validation");
}
console.log("✅ Valid XML passed");

const invalidXML1 = "<score-partwise>missing close tag";
if (validateMusicXML(invalidXML1).isValid) {
    throw new Error("Invalid XML (missing close) passed validation");
}
console.log("✅ Invalid XML (missing close) caught");

const invalidXML2 = "<score-partwise><part-list></part-list></score-partwise>"; // missing part/measure
if (validateMusicXML(invalidXML2).isValid) {
    throw new Error("Invalid XML (missing structure) passed validation");
}
console.log("✅ Invalid XML (missing structure) caught");

// Chord Encoding tests
const validChordXML = validXML.replace(
  '<note>\n        <pitch><step>C</step><octave>4</octave></pitch>\n        <duration>4</duration>\n        <type>whole</type>\n      </note>',
  '<note>\n        <pitch><step>C</step><octave>4</octave></pitch>\n        <duration>4</duration>\n        <type>whole</type>\n      </note>\n      <note>\n        <chord/>\n        <pitch><step>E</step><octave>4</octave></pitch>\n        <duration>4</duration>\n        <type>whole</type>\n      </note>\n      <note>\n        <chord/>\n        <pitch><step>G</step><octave>4</octave></pitch>\n        <duration>4</duration>\n        <type>whole</type>\n      </note>'
);
if (!validateMusicXML(validChordXML).isValid) {
    throw new Error("Valid Chord XML (C-E-G as separate notes) failed validation");
}
console.log("✅ Valid Chord XML passed");

const invalidMultiplePitchNoteXML = validXML.replace(
  '<pitch><step>C</step><octave>4</octave></pitch>',
  '<pitch><step>C</step><octave>4</octave></pitch><pitch><step>E</step><octave>4</octave></pitch><pitch><step>G</step><octave>4</octave></pitch>'
);
if (validateMusicXML(invalidMultiplePitchNoteXML).isValid) {
    throw new Error("Invalid XML (multiple <pitch> in one <note>) passed validation");
}
console.log("✅ Invalid XML (multiple <pitch> in one <note>) caught");

const invalidFirstNoteChordXML = validXML.replace(
  '<note>\n        <pitch><step>C</step><octave>4</octave></pitch>',
  '<note>\n        <chord/>\n        <pitch><step>C</step><octave>4</octave></pitch>'
);
if (validateMusicXML(invalidFirstNoteChordXML).isValid) {
    throw new Error("Invalid XML (first note has <chord/>) passed validation");
}
console.log("✅ Invalid XML (first note has <chord/>) caught");

// Duration tests
const invalidNoDurationPitchedXML = validXML.replace('<duration>4</duration>', '');
if (validateMusicXML(invalidNoDurationPitchedXML).isValid) {
    throw new Error("Invalid XML (pitched note without <duration>) passed validation");
}
console.log("✅ Invalid XML (pitched note without <duration>) caught");

const validRestDurationXML = validXML.replace(
  '</measure>',
  '  <note>\n        <rest/>\n        <duration>4</duration>\n        <type>whole</type>\n      </note>\n    </measure>'
);
if (!validateMusicXML(validRestDurationXML).isValid) {
    throw new Error("Valid XML (rest with <duration>) failed validation");
}
console.log("✅ Valid XML (rest with <duration>) passed");

const invalidNoDurationRestXML = validXML.replace(
  '</measure>',
  '  <note>\n        <rest/>\n        <type>whole</type>\n      </note>\n    </measure>'
);
if (validateMusicXML(invalidNoDurationRestXML).isValid) {
    throw new Error("Invalid XML (rest without <duration>) passed validation");
}
console.log("✅ Invalid XML (rest without <duration>) caught");

const validGraceXML = validXML.replace(
  '<pitch><step>C</step><octave>4</octave></pitch>\n        <duration>4</duration>',
  '<grace/>\n        <pitch><step>C</step><octave>4</octave></pitch>'
);
if (!validateMusicXML(validGraceXML).isValid) {
    throw new Error("Valid XML (grace note without <duration>) failed validation");
}
console.log("✅ Valid XML (grace note without <duration>) passed");

// Test Lead Sheet lyrics check
const leadSheetNoLyrics = validXML;
const vocalRequest = { vocalDirection: "Male Singer" };
if (validateLeadSheet(leadSheetNoLyrics, vocalRequest).isValid) {
    throw new Error("Lead sheet without lyrics passed for vocal song");
}
console.log("✅ Lead sheet lyrics check caught missing lyrics");

// --- Real validateArrangement Regression Tests ---
const refLeadSheet = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Melody</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <sound tempo="120"/>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>La</text></lyric></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>la</text></lyric></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>lu</text></lyric></note>
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>la</text></lyric></note>
      <harmony><root><root-step>C</root-step></root><kind>major</kind></harmony>
    </measure>
  </part>
</score-partwise>`;

// 1. Same melody + added orchestration => PASS
const arrangedValid = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Melody</part-name></score-part>
    <score-part id="P2"><part-name>Bass</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <sound tempo="120"/>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>La</text></lyric></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>la</text></lyric></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>lu</text></lyric></note>
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>la</text></lyric></note>
      <harmony><root><root-step>C</root-step></root><kind>major</kind></harmony>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes><divisions>1</divisions></attributes>
      <note><pitch><step>C</step><octave>2</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

const mockDemoRequest = { songForm: "short demo" };

if (!validateArrangement(arrangedValid, refLeadSheet, mockDemoRequest).isValid) {
  throw new Error("Arrangement test 1 (same melody + orchestration) failed");
}
console.log("✅ Arrangement test 1 (same melody + orchestration) passed");

// 2. Completely different melody with same note count => FAIL
const arrangedDifferentMelody = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <sound tempo="120"/>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>La</text></lyric></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>la</text></lyric></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>lu</text></lyric></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type><lyric><text>la</text></lyric></note>
      <harmony><root><root-step>C</root-step></root><kind>major</kind></harmony>
    </measure>
  </part>
</score-partwise>`;

if (validateArrangement(arrangedDifferentMelody, refLeadSheet, mockDemoRequest).isValid) {
  throw new Error("Arrangement test 2 (different melody) incorrectly passed");
}
console.log("✅ Arrangement test 2 (different melody) caught");

// 3. Changed key/mode => FAIL
const arrangedChangedKey = arrangedValid.replace('<fifths>0</fifths>', '<fifths>2</fifths>');
if (validateArrangement(arrangedChangedKey, refLeadSheet, mockDemoRequest).isValid) {
  throw new Error("Arrangement test 3 (changed key) incorrectly passed");
}
console.log("✅ Arrangement test 3 (changed key) caught");

// 4. Changed meter => FAIL
const arrangedChangedMeter = arrangedValid.replace('<beats>4</beats><beat-type>4</beat-type>', '<beats>3</beats><beat-type>4</beat-type>');
if (validateArrangement(arrangedChangedMeter, refLeadSheet, mockDemoRequest).isValid) {
  throw new Error("Arrangement test 4 (changed meter) incorrectly passed");
}
console.log("✅ Arrangement test 4 (changed meter) caught");

// 5. Changed initial BPM => FAIL
const arrangedChangedBpm = arrangedValid.replace('tempo="120"', 'tempo="160"');
if (validateArrangement(arrangedChangedBpm, refLeadSheet, mockDemoRequest).isValid) {
  throw new Error("Arrangement test 5 (changed BPM) incorrectly passed");
}
console.log("✅ Arrangement test 5 (changed BPM) caught");

// 6. Removed main lyrics => FAIL
const arrangedNoLyrics = arrangedValid.replace(/<lyric>.*?<\/lyric>/g, '');
if (validateArrangement(arrangedNoLyrics, refLeadSheet, mockDemoRequest).isValid) {
  throw new Error("Arrangement test 6 (removed lyrics) incorrectly passed");
}
console.log("✅ Arrangement test 6 (removed lyrics) caught");

// 7. Lost harmony => FAIL
const arrangedNoHarmony = arrangedValid.replace(/<harmony>.*?<\/harmony>/g, '');
if (validateArrangement(arrangedNoHarmony, refLeadSheet, mockDemoRequest).isValid) {
  throw new Error("Arrangement test 7 (lost harmony) incorrectly passed");
}
console.log("✅ Arrangement test 7 (lost harmony) caught");

// 8. Removed <key> / mode metadata => FAIL
const arrangedNoKey = arrangedValid.replace(/<key>[\s\S]*?<\/key>/g, '');
if (validateArrangement(arrangedNoKey, refLeadSheet, mockDemoRequest).isValid) {
  throw new Error("Arrangement test 8 (removed key metadata) incorrectly passed");
}
console.log("✅ Arrangement test 8 (removed key metadata) caught");

// 9. Removed <time> metadata => FAIL
const arrangedNoTime = arrangedValid.replace(/<time>[\s\S]*?<\/time>/g, '');
if (validateArrangement(arrangedNoTime, refLeadSheet, mockDemoRequest).isValid) {
  throw new Error("Arrangement test 9 (removed time metadata) incorrectly passed");
}
console.log("✅ Arrangement test 9 (removed time metadata) caught");

// 10. Removed initial tempo metadata => FAIL
const arrangedNoTempo = arrangedValid.replace(/<sound[^>]*tempo="[^"]*"\s*\/>|<sound[^>]*tempo="[^"]*"[^>]*>/g, '');
if (validateArrangement(arrangedNoTempo, refLeadSheet, mockDemoRequest).isValid) {
  throw new Error("Arrangement test 10 (removed initial tempo metadata) incorrectly passed");
}
console.log("✅ Arrangement test 10 (removed initial tempo metadata) caught");

console.log("🚀 ALL MUSICXML VALIDATION TESTS PASSED");
