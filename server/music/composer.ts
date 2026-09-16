import { GoogleGenAI, Type, GenerateContentParameters, GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { getForAi, getCoreDocsForStep, getDocsByRefs, getCatalogCandidates, getStyleInfo, getCatalog } from "../projectmusic/knowledge";
import { validateLeadSheet, validateArrangement } from "./musicxml-validator";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = process.env.TEXT_FALLBACK_MODEL || 'gemini-3.5-flash';

// Dependency Injection for testing
export type GenerateFn = (params: GenerateContentParameters) => Promise<GenerateContentResponse>;

const defaultGenerate: GenerateFn = (params) => ai.models.generateContent(params);

export interface Step2Result {
  songRequest: any;
  metaPlan: string;
  composePrompt: string;
  arrangePrompt: string;
  composeDocRefs: string[];
  arrangeDocRefs: string[];
  planSummary: string;
  style: {
    id: string;
    displayName: string;
  };
}

export async function prepareComposition(idea: string, styleId: string, generate: GenerateFn = defaultGenerate): Promise<Step2Result> {
  const forAi = getForAi();
  const catalog = getCatalog();
  const styleInfo = getStyleInfo(styleId);
  if (!styleInfo) {
    throw new Error(`Style ${styleId} not found in catalog.`);
  }

  // Step 1: Hiểu ý tưởng -> Meta Plan & Song Request (Structured)
  const step1Docs = getCoreDocsForStep(1);
  const step1System = `${forAi}\n\n${step1Docs}\n\nStyle Context:\n${styleInfo.content}\n\nYou are an expert music curator. 
Transform the user's idea and style into a structured song request and a meta plan.`;

  const songRequestSchema = {
    type: Type.OBJECT,
    properties: {
      language: { type: Type.STRING },
      concept: { type: Type.STRING },
      emotion: { type: Type.STRING },
      story: { type: Type.STRING },
      genre: { type: Type.STRING },
      songForm: { type: Type.STRING },
      lyricDirection: { type: Type.STRING },
      melodyDirection: { type: Type.STRING },
      rhythmDirection: { type: Type.STRING },
      harmonyDirection: { type: Type.STRING },
      vocalDirection: { type: Type.STRING },
      arrangementDirection: { type: Type.STRING },
      constraints: { type: Type.STRING }
    },
    required: ["concept", "emotion", "genre"]
  };

  const response1 = await generate({
    model: TEXT_MODEL,
    contents: [{ parts: [{ text: `Idea: ${idea}\nStyle: ${styleInfo.displayName}` }] }],
    config: {
      systemInstruction: step1System,
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          songRequest: songRequestSchema,
          metaPlan: { type: Type.STRING }
        },
        required: ["songRequest", "metaPlan"]
      }
    }
  });

  const step1Result = JSON.parse(response1.text);

  // Step 2: Select DOC_REFS & Prepare Prompts
  const candidates = getCatalogCandidates(2);
  const step2Docs = getCoreDocsForStep(2);
  const step2System = `${forAi}\n\n${step2Docs}\n\nCatalog Candidates:\n${JSON.stringify(candidates, null, 2)}\n\nYou are a senior music producer.
Based on the Meta Plan, generate specialized prompts and select relevant document IDs (DOC_REFS) for Step 3 (Compose) and Step 4 (Arrange) separately.
ONLY select IDs from the candidates list. Max 8 refs per step.`;

  const response2 = await generate({
    model: TEXT_MODEL,
    contents: [{ parts: [{ text: `Meta Plan:\n${step1Result.metaPlan}` }] }],
    config: {
      systemInstruction: step2System,
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          composePrompt: { type: Type.STRING },
          arrangePrompt: { type: Type.STRING },
          composeDocRefs: { type: Type.ARRAY, items: { type: Type.STRING } },
          arrangeDocRefs: { type: Type.ARRAY, items: { type: Type.STRING } },
          planSummary: { type: Type.STRING }
        },
        required: ["composePrompt", "arrangePrompt", "composeDocRefs", "arrangeDocRefs", "planSummary"]
      }
    }
  });

  const step2Result = JSON.parse(response2.text);
  
  // Validate and split docRefs
  const pagesById = new Map(catalog.pages.map(p => [p.id, p]));
  
  const validateRefs = (refs: string[], step: number) => {
    return (refs || [])
      .filter(id => {
        const p = pagesById.get(id);
        return p && p["serves-steps"].includes(step);
      })
      .slice(0, 8);
  };

  return {
    songRequest: step1Result.songRequest,
    metaPlan: step1Result.metaPlan,
    composePrompt: step2Result.composePrompt,
    arrangePrompt: step2Result.arrangePrompt,
    composeDocRefs: validateRefs(step2Result.composeDocRefs, 3),
    arrangeDocRefs: validateRefs(step2Result.arrangeDocRefs, 4),
    planSummary: step2Result.planSummary,
    style: {
      id: styleId,
      displayName: styleInfo.displayName
    }
  };
}

export async function generateLeadSheet(
  composePrompt: string, 
  composeDocRefs: string[], 
  metaPlan: string, 
  songRequest: any,
  styleId: string,
  generate: GenerateFn = defaultGenerate
): Promise<string> {
  const forAi = getForAi();
  const step3Core = getCoreDocsForStep(3);
  const step3Refs = getDocsByRefs(composeDocRefs, 3);
  const styleInfo = getStyleInfo(styleId);
  
  const systemInstruction = `${forAi}\n\n${step3Core}\n\n${step3Refs}\n\nStyle Card:\n${styleInfo?.content || styleId}\n\nYou are a master composer. 
Create a Lead Sheet (melody, lyrics, chords) in MusicXML 4.0 format.
Follow the rules in KNOW.MUSICXML.RULES and KNOW.MUSICXML.ANTI-PATTERNS.
Ensure the lead sheet sets up valid part metadata: divisions, key, time, and appropriate clef.

Unless the user explicitly asks for a short demo, generate a COMPLETE song form.
- COMPUTE YOUR MEASURE BUDGET: Minimum Measures = (Target Duration (180-240s) * (BPM / 60)) / (Beats per Measure).
- Example: At 72 BPM in 4/4, 180s requires (180 * 1.2) / 4 = 54 measures.
- You MUST generate enough measures to exceed the 150-second validation floor.
- VOCAL PART: Complete melody and lyrics for the entire song form (Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus, Outro).
- PIANO REDUCTION: To stay within token limits for a full song, use a SIMPLE harmonic reduction. Use block chords or a steady half-note pulse as required by KNOW.HARMONY.PIANO-REDUCTION. Do NOT use complex arpeggios or detailed figuration in this step.
- NO HALLUCINATIONS: Use ONLY standard MusicXML 4.0 tags. Do NOT use <label>, <text-box>, or any tags not defined in the schema.
- OUTPUT: Output ONLY the MusicXML code. Use a DENSE representation: omit all XML comments, and omit redundant <attributes> blocks in measures where they haven't changed. Do NOT truncate the score; you must reach the final measure. Do NOT use pretty-printing; keep the XML as compact as possible while remaining valid.`;

  const basePrompt = `Meta Plan:\n${metaPlan}\n\nSong Request:\n${JSON.stringify(songRequest, null, 2)}\n\nTask:\n${composePrompt}`;

  async function attempt(model: string, feedback?: string): Promise<string> {
    const prompt = feedback ? `${basePrompt}\n\n${feedback}` : basePrompt;
    const res = await generate({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.2,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        maxOutputTokens: 32768,
      }
    });
    
    const text = res.text;
    const xmlMatch = text.match(/<\?xml[\s\S]*?<\/score-partwise>/i) || text.match(/<score-partwise[\s\S]*?<\/score-partwise>/i);
    let xml = xmlMatch ? xmlMatch[0] : text.replace(/```xml/g, '').replace(/```/g, '').trim();
    
    if (xml && !xml.trim().startsWith('<?xml')) {
      xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xml.trim()}`;
    }
    return xml;
  }

  let xml = await attempt(TEXT_MODEL);
  let validation = validateLeadSheet(xml, songRequest);
  
  if (!validation.isValid) {
    const feedback = `Previous MusicXML failed validation:\n- ${validation.errors.join("\n- ")}\nRegenerate the complete score and fix these validation errors.`;
    console.warn("Lead Sheet Attempt 1 failed validation. Retrying with fallback model...", validation.errors);
    xml = await attempt(FALLBACK_MODEL, feedback);
    validation = validateLeadSheet(xml, songRequest);
    if (!validation.isValid) {
      const err: any = new Error(`Lead Sheet validation failed after retry: ${validation.errors.join(", ")}`);
      err.code = "MUSICXML_INVALID_AFTER_RETRY";
      err.xml = xml;
      throw err;
    }
  }

  return xml;
}

export async function generateArrangement(
  leadSheetXml: string, 
  arrangePrompt: string, 
  arrangeDocRefs: string[],
  songRequest: any,
  styleId: string,
  generate: GenerateFn = defaultGenerate
): Promise<string> {
  const forAi = getForAi();
  const step4Core = getCoreDocsForStep(4);
  const step4Refs = getDocsByRefs(arrangeDocRefs, 4);
  const styleInfo = getStyleInfo(styleId);
  
  const systemInstruction = `${forAi}\n\n${step4Core}\n\n${step4Refs}\n\nStyle Card:\n${styleInfo?.content || styleId}\n\nYou are a world-class arranger.
Take the provided Lead Sheet (MusicXML) and add a full arrangement.
KEEP lyrics, melodic identity, and harmony intent.
CRITICAL XML RULES:
- EVERY part must specify divisions, key, time, and appropriate clef (Vocal/Guitar/Strings = treble, Electric Bass = bass clef, Piano = grand staff treble + bass). Do NOT let Electric Bass C2 render in treble clef.
- CHORD ENCODING: A <note> must have EXACTLY ONE <pitch> (or <rest>, or <unpitched>). To encode a chord (e.g. C-E-G), emit 3 separate <note> elements. The first has no <chord/> tag. The subsequent notes MUST have a <chord/> tag. Do NOT use <chord/> on the first note of a measure/voice/staff.
- DURATION ENCODING: Never emit a normal <note> or <rest> without <duration>. <grace> notes are the only exception.
- Unless the user explicitly asks for a short demo, ensure the arrangement covers the COMPLETE song form (Intro, Verses, Choruses, Bridge, Outro) and matches the duration intent of the lead sheet (typically 180-240 seconds). Do NOT truncate the arrangement.
- EFFICIENCY: To fit a full song in one response, use a DENSE and efficient MusicXML representation. Omit all XML comments. Omit redundant <attributes> blocks (key, time, clef) in measures where they haven't changed. Do NOT use non-standard tags like <label>.
Output ONLY final arranged MusicXML 4.0.`;

  const basePrompt = `Lead Sheet XML:\n${leadSheetXml}\n\nSong Request:\n${JSON.stringify(songRequest, null, 2)}\n\nTask:\n${arrangePrompt}`;

  async function attempt(model: string, feedback?: string): Promise<string> {
    const prompt = feedback ? `${basePrompt}\n\n${feedback}` : basePrompt;
    const res = await generate({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.2,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        maxOutputTokens: 65536,
      }
    });
    
    const text = res.text;
    const xmlMatch = text.match(/<\?xml[\s\S]*?<\/score-partwise>/i) || text.match(/<score-partwise[\s\S]*?<\/score-partwise>/i);
    let xml = xmlMatch ? xmlMatch[0] : text.replace(/```xml/g, '').replace(/```/g, '').trim();
    
    if (xml && !xml.trim().startsWith('<?xml')) {
      xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xml.trim()}`;
    }
    return xml;
  }

  let xml = await attempt(TEXT_MODEL);
  let validation = validateArrangement(xml, leadSheetXml, songRequest);
  
  if (!validation.isValid) {
    const feedback = `Previous MusicXML failed validation:\n- ${validation.errors.join("\n- ")}\nRegenerate the complete score and fix these validation errors.`;
    console.warn("Arrangement Attempt 1 failed validation. Retrying with fallback model...", validation.errors);
    xml = await attempt(FALLBACK_MODEL, feedback);
    validation = validateArrangement(xml, leadSheetXml, songRequest);
    if (!validation.isValid) {
      const err: any = new Error(`Arrangement validation failed after retry: ${validation.errors.join(", ")}`);
      err.code = "MUSICXML_INVALID_AFTER_RETRY";
      err.xml = xml;
      throw err;
    }
  }

  return xml;
}
