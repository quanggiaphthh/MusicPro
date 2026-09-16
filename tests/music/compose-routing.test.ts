import { prepareComposition, generateLeadSheet, generateArrangement, GenerateFn } from '../../server/music/composer';

const validXml = `<?xml version="1.0" encoding="UTF-8"?>
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
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
        <lyric><text>Test lyric</text></lyric>
      </note>
      <harmony><root><root-step>C</root-step></root><kind>major</kind></harmony>
    </measure>
  </part>
</score-partwise>`;

const invalidXml = `<score-partwise><part><measure><note><rest/></note></measure></part></score-partwise>`;

console.log("--- Testing Production Composer Retry & Routing Logic ---");

async function runTests() {
  // Test 1: generateLeadSheet first valid => 1 call
  {
    let calls = 0;
    const mockGenerate: GenerateFn = async (params) => {
      calls++;
      return { text: validXml } as any;
    };

    const xml = await generateLeadSheet("Compose prompt", [], "Meta plan", { vocalDirection: "Vocal", harmonyDirection: "Chords", songForm: "short demo" }, "STYLE.VN.VPOP-BALLAD", mockGenerate);
    if (calls !== 1) throw new Error(`Test 1 failed: expected 1 call, got ${calls}`);
    if (!xml.includes("score-partwise")) throw new Error("Test 1 failed: invalid xml returned");
    console.log("✅ Test 1: First valid lead sheet -> 1 call");
  }

  // Test 2: generateLeadSheet first invalid, second valid => 2 calls
  {
    let calls = 0;
    const mockGenerate: GenerateFn = async (params) => {
      calls++;
      if (calls === 1) {
        return { text: invalidXml } as any;
      }
      return { text: validXml } as any;
    };

    const xml = await generateLeadSheet("Compose prompt", [], "Meta plan", { vocalDirection: "Vocal", harmonyDirection: "Chords", songForm: "short demo" }, "STYLE.VN.VPOP-BALLAD", mockGenerate);
    if (calls !== 2) throw new Error(`Test 2 failed: expected 2 calls, got ${calls}`);
    console.log("✅ Test 2: First invalid, second valid -> 2 calls (fallback)");
  }

  // Test 3: both invalid => MUSICXML_INVALID_AFTER_RETRY
  {
    let calls = 0;
    const mockGenerate: GenerateFn = async (params) => {
      calls++;
      return { text: invalidXml } as any;
    };

    let caughtError: any = null;
    try {
      await generateLeadSheet("Compose prompt", [], "Meta plan", { vocalDirection: "Vocal", harmonyDirection: "Chords", songForm: "short demo" }, "STYLE.VN.VPOP-BALLAD", mockGenerate);
    } catch (err) {
      caughtError = err;
    }

    if (!caughtError || caughtError.code !== "MUSICXML_INVALID_AFTER_RETRY") {
      throw new Error(`Test 3 failed: expected MUSICXML_INVALID_AFTER_RETRY code, got ${JSON.stringify(caughtError)}`);
    }
    console.log("✅ Test 3: Both invalid -> MUSICXML_INVALID_AFTER_RETRY");
  }

  // Test 4: network/API throw on first call => no fallback (call count = 1)
  {
    let calls = 0;
    const mockGenerate: GenerateFn = async (params) => {
      calls++;
      throw new Error("Network timeout");
    };

    let threw = false;
    try {
      await generateLeadSheet("Compose prompt", [], "Meta plan", { vocalDirection: "Vocal", harmonyDirection: "Chords", songForm: "short demo" }, "STYLE.VN.VPOP-BALLAD", mockGenerate);
    } catch (err: any) {
      threw = true;
      if (calls !== 1) throw new Error(`Test 4 failed: expected 1 call before throw, got ${calls}`);
      if (err.message !== "Network timeout") throw new Error(`Test 4 failed: unexpected error message: ${err.message}`);
    }

    if (!threw) throw new Error("Test 4 failed: expected error to be thrown");
    console.log("✅ Test 4: Network/API throw -> no fallback (call count = 1)");
  }

  // Test 5: generateArrangement first valid => exactly 1 call
  {
    let calls = 0;
    const mockGenerate: GenerateFn = async (params) => {
      calls++;
      return { text: validXml } as any;
    };

    const xml = await generateArrangement(validXml, "Arrange prompt", [], { vocalDirection: "Vocal", songForm: "short demo" }, "STYLE.VN.VPOP-BALLAD", mockGenerate);
    if (calls !== 1) throw new Error(`Test 5 failed: expected 1 call, got ${calls}`);
    console.log("✅ Test 5: Arrangement first valid -> 1 call");
  }

  // Test 6: generateArrangement first invalid, second valid => fallback once (2 calls)
  {
    let calls = 0;
    const mockGenerate: GenerateFn = async (params) => {
      calls++;
      if (calls === 1) {
        return { text: invalidXml } as any;
      }
      return { text: validXml } as any;
    };

    const xml = await generateArrangement(validXml, "Arrange prompt", [], { vocalDirection: "Vocal", songForm: "short demo" }, "STYLE.VN.VPOP-BALLAD", mockGenerate);
    if (calls !== 2) throw new Error(`Test 6 failed: expected 2 calls for arrangement fallback, got ${calls}`);
    console.log("✅ Test 6: Arrangement invalid -> fallback once (2 calls)");
  }

  // Test 7: generateArrangement both invalid => MUSICXML_INVALID_AFTER_RETRY
  {
    let calls = 0;
    const mockGenerate: GenerateFn = async (params) => {
      calls++;
      return { text: invalidXml } as any;
    };

    let caughtError: any = null;
    try {
      await generateArrangement(validXml, "Arrange prompt", [], { vocalDirection: "Vocal", songForm: "short demo" }, "STYLE.VN.VPOP-BALLAD", mockGenerate);
    } catch (err) {
      caughtError = err;
    }

    if (!caughtError || caughtError.code !== "MUSICXML_INVALID_AFTER_RETRY") {
      throw new Error(`Test 7 failed: expected MUSICXML_INVALID_AFTER_RETRY code, got ${JSON.stringify(caughtError)}`);
    }
    console.log("✅ Test 7: Arrangement both invalid -> MUSICXML_INVALID_AFTER_RETRY");
  }

  // Test 8: generateArrangement network throw on first call => no fallback (call count = 1)
  {
    let calls = 0;
    const mockGenerate: GenerateFn = async (params) => {
      calls++;
      throw new Error("Arrangement network timeout");
    };

    let threw = false;
    try {
      await generateArrangement(validXml, "Arrange prompt", [], { vocalDirection: "Vocal", songForm: "short demo" }, "STYLE.VN.VPOP-BALLAD", mockGenerate);
    } catch (err: any) {
      threw = true;
      if (calls !== 1) throw new Error(`Test 8 failed: expected 1 call before throw, got ${calls}`);
      if (err.message !== "Arrangement network timeout") throw new Error(`Test 8 failed: unexpected error message: ${err.message}`);
    }

    if (!threw) throw new Error("Test 8 failed: expected error to be thrown");
    console.log("✅ Test 8: Arrangement network throw -> no fallback (call count = 1)");
  }

  // Test 9: Lead Sheet fallback contains validation errors in prompt
  {
    let fallbackPrompt = "";
    const mockGenerate: GenerateFn = async (params) => {
      const prompt = (params.contents[0].parts[0] as any).text;
      if (fallbackPrompt === "") {
        // First call
        fallbackPrompt = "first_called";
        return { text: invalidXml } as any;
      } else {
        // Second call (fallback)
        fallbackPrompt = prompt;
        return { text: validXml } as any;
      }
    };

    await generateLeadSheet("Compose prompt", [], "Meta plan", { songForm: "short demo" }, "STYLE.VN.VPOP-BALLAD", mockGenerate);
    if (!fallbackPrompt.includes("Previous MusicXML failed validation:")) {
      throw new Error("Test 9 failed: fallback prompt did not contain validation errors");
    }
    console.log("✅ Test 9: Lead Sheet fallback contains validation errors in prompt");
  }

  // Test 10: Arrangement fallback contains validation errors in prompt
  {
    let fallbackPrompt = "";
    const mockGenerate: GenerateFn = async (params) => {
      const prompt = (params.contents[0].parts[0] as any).text;
      if (fallbackPrompt === "") {
        // First call
        fallbackPrompt = "first_called";
        return { text: invalidXml } as any;
      } else {
        // Second call (fallback)
        fallbackPrompt = prompt;
        return { text: validXml } as any;
      }
    };

    await generateArrangement(validXml, "Arrange prompt", [], { songForm: "short demo" }, "STYLE.VN.VPOP-BALLAD", mockGenerate);
    if (!fallbackPrompt.includes("Previous MusicXML failed validation:")) {
      throw new Error("Test 10 failed: arrangement fallback prompt did not contain validation errors");
    }
    console.log("✅ Test 10: Arrangement fallback contains validation errors in prompt");
  }

  console.log("🚀 ALL COMPOSE ROUTING & RETRY TESTS PASSED");
}

runTests().catch(err => {
  console.error("❌ Compose Routing Test Failed:", err);
  process.exit(1);
});
