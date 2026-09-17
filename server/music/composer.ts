import { GoogleGenAI, Type, GenerateContentParameters, GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { getForAi, getCoreDocsForStep, getDocsByRefs, getCatalogCandidates, getStyleInfo, getCatalog } from "../projectmusic/knowledge";
import { validateLeadSheet, validateArrangement } from "./musicxml-validator";
import { extractSongDNA } from "./song-dna";
import { generateLeadSheetR3 } from "./lead-sheet-r3";
import { evaluateCompositionQuality } from "../../src/compose/production-quality";
import { getProviderTimeoutMs, runWithProviderTimeout, type ProviderStage } from "./provider-timeout";
import { dedupeKnowledgeRefsAgainstCore } from "./knowledge-dedup";
import { emitGenerationTelemetry, emitValidationFailureTelemetry, getGenerationRunSignal, type GenerationTelemetryStage } from "./generation-telemetry";

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

async function generateCancelable(
  generate: GenerateFn,
  params: GenerateContentParameters,
  stage: Extract<GenerationTelemetryStage, 'prepare-step1' | 'prepare-step2'>,
): Promise<GenerateContentResponse> {
  const signal = getGenerationRunSignal();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const config: any = { ...(params.config as any), ...(signal ? { abortSignal: signal } : {}) };
  const startedAt = Date.now();
  const model = String((params as any).model || 'unknown');
  const promptChars = estimateProviderPromptChars({ ...params, config } as GenerateContentParameters);
  try {
    const response = await generate({ ...params, config } as GenerateContentParameters);
    emitGenerationTelemetry({
      stage, model, startedAt, endedAt: Date.now(), promptChars,
      responseChars: String((response as any)?.text || '').length, outcome:'success',
    });
    return response;
  } catch (error: any) {
    emitGenerationTelemetry({
      stage, model, startedAt, endedAt: Date.now(), promptChars, responseChars:0,
      outcome:'error', errorCode:error?.code || error?.name,
    });
    throw error;
  }
}

function estimateProviderPromptChars(params: GenerateContentParameters): number {
  const contentsChars = (() => { try { return JSON.stringify(params.contents || '').length; } catch { return 0; } })();
  const system = (params.config as any)?.systemInstruction;
  const systemChars = typeof system === 'string' ? system.length : (() => { try { return JSON.stringify(system || '').length; } catch { return 0; } })();
  return contentsChars + systemChars;
}

async function generateBounded(generate: GenerateFn, params: GenerateContentParameters, stage: ProviderStage): Promise<GenerateContentResponse> {
  const timeoutMs = getProviderTimeoutMs(stage);
  const signal = getGenerationRunSignal();
  const config: any = { ...(params.config as any), httpOptions: { ...((params.config as any)?.httpOptions || {}), timeout: timeoutMs }, ...(signal ? { abortSignal: signal } : {}) };
  const startedAt = Date.now();
  const model = String((params as any).model || 'unknown');
  const promptChars = estimateProviderPromptChars(params);
  try {
    const response = await runWithProviderTimeout(() => generate({ ...params, config } as GenerateContentParameters), timeoutMs, stage, signal);
    const endedAt = Date.now();
    emitGenerationTelemetry({ stage, model, startedAt, endedAt, promptChars, responseChars: String((response as any)?.text || '').length, outcome:'success' });
    return response;
  } catch (error: any) {
    const endedAt = Date.now();
    emitGenerationTelemetry({
      stage, model, startedAt, endedAt, promptChars, responseChars:0,
      outcome:error?.code === 'GENERATION_TIMEOUT' ? 'timeout' : 'error', errorCode:error?.code || error?.name,
    });
    throw error;
  }
}

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

  const response1 = await generateCancelable(generate, {
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
  }, 'prepare-step1');

  const step1Result = JSON.parse(response1.text);

  // Step 2: Select DOC_REFS & Prepare Prompts
  const candidates = getCatalogCandidates(2);
  const step2Docs = getCoreDocsForStep(2);
  const step2System = `${forAi}\n\n${step2Docs}\n\nCatalog Candidates:\n${JSON.stringify(candidates, null, 2)}\n\nYou are a senior music producer.
Based on the Meta Plan, generate specialized prompts and select relevant document IDs (DOC_REFS) for Step 3 (Compose) and Step 4 (Arrange) separately.
ONLY select IDs from the candidates list. Max 8 refs per step.`;

  const response2 = await generateCancelable(generate, {
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
  }, 'prepare-step2');

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
  const result = await generateLeadSheetR3({
    composePrompt,
    composeDocRefs,
    metaPlan,
    songRequest,
    styleId,
    model: TEXT_MODEL,
  }, {
    generate: (params) => generate(params as GenerateContentParameters),
    validateLeadSheet,
    extractSongDNA,
    evaluateCompositionQuality,
    emitTelemetry: (record) => emitGenerationTelemetry(record),
    signal: getGenerationRunSignal(),
    totalBudgetMs: getProviderTimeoutMs('lead-sheet'),
  });
  return result.xml;
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
  const step4UniqueRefs = dedupeKnowledgeRefsAgainstCore(arrangeDocRefs, step4Core, [styleId]);
  const step4Refs = getDocsByRefs(step4UniqueRefs, 4);
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
    const res = await generateBounded(generate, {
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.2,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        maxOutputTokens: 65536,
      }
    }, 'arrangement');
    
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
    emitValidationFailureTelemetry({ stage:'arrangement', model:TEXT_MODEL, responseChars:xml.length, retryReason:'musicxml-validation', errorCode:'MUSICXML_INVALID' });
    const feedback = `Previous MusicXML failed validation:\n- ${validation.errors.join("\n- ")}\nRegenerate the complete score and fix these validation errors.`;
    console.warn("Arrangement Attempt 1 failed validation. Retrying with fallback model...", validation.errors);
    xml = await attempt(FALLBACK_MODEL, feedback);
    validation = validateArrangement(xml, leadSheetXml, songRequest);
    if (!validation.isValid) {
      emitValidationFailureTelemetry({ stage:'arrangement', model:FALLBACK_MODEL, responseChars:xml.length, retryReason:'musicxml-validation-after-fallback', errorCode:'MUSICXML_INVALID_AFTER_RETRY' });
      const err: any = new Error(`Arrangement validation failed after retry: ${validation.errors.join(", ")}`);
      err.code = "MUSICXML_INVALID_AFTER_RETRY";
      err.xml = xml;
      throw err;
    }
  }

  return xml;
}
