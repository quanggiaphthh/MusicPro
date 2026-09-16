import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { extractSongDNA } from "./server/music/song-dna";
import { buildProductionBlueprint } from "./server/music/production-blueprint";
import { buildGeminiMusicBrief, buildLyriaPrompt } from "./server/music/gemini-music-brief";
import { prepareComposition, generateLeadSheet, generateArrangement } from "./server/music/composer";
import { createAutoProductionStreamHandler } from "./server/music/auto-production-stream";
import { buildGenerationFailureDiagnostics, type GenerationFailureDiagnostics } from "./server/music/generation-failure-diagnostics";
import { validateMusicXML } from "./server/music/musicxml-validator";
import {
  buildSectionRevisionContext,
  classifySectionProviderError,
  mergeSectionReplacement,
  SectionRevisionError,
} from "./server/music/section-revision";

import { getCatalog, getStyleInfo } from "./server/projectmusic/knowledge";
import {
  getCanonicalKnowledgeCatalog,
  getCanonicalKnowledgeDocument,
  listCanonicalKnowledgeDocuments,
  saveCanonicalKnowledgeDocument,
} from "./server/projectmusic/knowledge-admin";

dotenv.config();

let lastLeadSheetDiagnostics: GenerationFailureDiagnostics | null = null;

function getStyleDisplayName(styleId: string): string {
  const info = getStyleInfo(styleId);
  return info ? info.displayName : styleId;
}

function extractSectionRevisionXml(text: string): string {
  const match = text.match(/<section-revision\b[\s\S]*?<\/section-revision\s*>/i);
  if (!match) throw new SectionRevisionError('SECTION_MERGE_FAILED', 'AI không trả về section-revision hợp lệ.');
  return match[0];
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Increase payload limit for large XML files
  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "ProjectMusic00 API is running." });
  });

  app.get("/api/music/capabilities", (req, res) => {
    res.json({
      lyriaEnabled: process.env.LYRIA_ENABLED === 'true',
      textModel: process.env.TEXT_MODEL || 'gemini-3.5-flash-lite'
    });
  });

  if (process.env.NODE_ENV !== "production") {
    app.get("/api/compose/diagnostics/lead-sheet", (_req, res) => {
      if (!lastLeadSheetDiagnostics) {
        return res.status(404).json({ error: { code: "NO_LEAD_SHEET_DIAGNOSTICS", message: "No lead-sheet failure diagnostics captured yet." } });
      }
      res.json(lastLeadSheetDiagnostics);
    });
  }

  app.get("/api/knowledge/catalog", (_req, res) => {
    try {
      res.json(getCanonicalKnowledgeCatalog());
    } catch (error: any) {
      console.error("Knowledge catalog error:", error);
      res.status(500).json({ error: { code: 'KNOWLEDGE_CATALOG_FAILED', message: error.message || 'Không thể tải catalog tri thức.' } });
    }
  });

  app.get("/api/knowledge/all", (_req, res) => {
    try {
      res.json({ documents: listCanonicalKnowledgeDocuments(true) });
    } catch (error: any) {
      console.error("Knowledge load error:", error);
      res.status(500).json({ error: { code: 'KNOWLEDGE_LOAD_FAILED', message: error.message || 'Không thể tải kho tri thức.' } });
    }
  });

  app.get("/api/knowledge/document/:id", (req, res) => {
    try {
      const document = getCanonicalKnowledgeDocument(req.params.id);
      if (!document) return res.status(404).json({ error: { code: 'KNOWLEDGE_NOT_FOUND', message: `Không tìm thấy tài liệu ${req.params.id}` } });
      res.json(document);
    } catch (error: any) {
      console.error("Knowledge document error:", error);
      res.status(500).json({ error: { code: 'KNOWLEDGE_LOAD_FAILED', message: error.message || 'Không thể tải tài liệu.' } });
    }
  });

  app.put("/api/knowledge/document/:id", (req, res) => {
    try {
      const content = req.body?.content;
      const document = saveCanonicalKnowledgeDocument(req.params.id, content);
      res.json(document);
    } catch (error: any) {
      const code = error?.code || 'KNOWLEDGE_SAVE_FAILED';
      const status = code === 'KNOWLEDGE_NOT_FOUND' ? 404 : code === 'KNOWLEDGE_READ_ONLY' ? 403 : code === 'INVALID_KNOWLEDGE_CONTENT' ? 400 : 500;
      if (status >= 500) console.error("Knowledge save error:", error);
      res.status(status).json({ error: { code, message: error.message || 'Không thể lưu tài liệu.' } });
    }
  });

  app.post("/api/music/blueprint", (req, res) => {
    try {
      const { musicXml, style, language, mood, genre, sourceRunId, lyrics, arrangementNotes, idea } = req.body;
      
      if (!musicXml || typeof musicXml !== 'string') {
        return res.status(400).json({ error: { code: 'MISSING_SCORE', message: "Missing or invalid musicXml" } });
      }

      const songDNA = extractSongDNA(musicXml, sourceRunId);
      const mappedStyle = getStyleDisplayName(style);
      const blueprint = buildProductionBlueprint(songDNA, { style: mappedStyle, language, mood, genre, lyrics, arrangementNotes, idea });
      const geminiBrief = buildGeminiMusicBrief(blueprint);
      const lyriaPromptPreview = buildLyriaPrompt(blueprint);

      res.json({
        songDNA,
        blueprint,
        geminiBrief,
        lyriaPromptPreview
      });
    } catch (error: any) {
      console.error("Blueprint generation error:", error);
      const code = error.code || 'BLUEPRINT_FAILED';
      res.status(400).json({ error: { code, message: error.message || "Failed to parse MusicXML and generate blueprint" } });
    }
  });

  app.post("/api/music/generate-audio", async (req, res) => {
    try {
      if (process.env.LYRIA_ENABLED !== 'true') {
        return res.status(503).json({
          error: {
            code: "LYRIA_DISABLED",
            message: "Tính năng tạo bản thu AI chưa được bật trong môi trường này."
          }
        });
      }

      const { musicXml, lyrics, idea, style, mood, genre, arrangementNotes, sourceRunId } = req.body;
      
      if (!musicXml || typeof musicXml !== 'string') {
        return res.status(400).json({ error: { code: 'MISSING_SCORE', message: "Missing or invalid musicXml" } });
      }

      const songDNA = extractSongDNA(musicXml, sourceRunId);
      const mappedStyle = getStyleDisplayName(style);
      const blueprint = buildProductionBlueprint(songDNA, { style: mappedStyle, mood, genre, lyrics, arrangementNotes, idea });
      const lyriaPrompt = buildLyriaPrompt(blueprint);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: { code: "LYRIA_API_ERROR", message: "API Key is not configured." } });
      }

      const client = new GoogleGenAI({ apiKey });
      const model = process.env.LYRIA_MODEL || 'lyria-3.5';
      
      const interaction = await client.interactions.create({
        model,
        input: lyriaPrompt,
        response_format: {
          type: "audio"
        }
      });

      const generatedAudio = interaction.output_audio;

      if (!generatedAudio?.data) {
        return res.status(500).json({ 
          error: { 
            code: "LYRIA_NO_AUDIO", 
            message: "Lyria API returned no audio." 
          } 
        });
      }

      res.json({
        audioBase64: generatedAudio.data,
        mimeType: generatedAudio.mime_type || (generatedAudio as any).mimeType || "audio/mpeg",
        generatedText: interaction.output_text || "",
        model
      });
    } catch (error: any) {
      console.error("Lyria generation error:", error);
      const code = error.code || 'LYRIA_API_ERROR';
      res.status(500).json({ error: { code, message: error.message || "Failed to generate audio" } });
    }
  });

  // AUTO_PRODUCTION_V1_4_1 — one streamed, quality-enforced 4-step orchestration endpoint
  app.post("/api/compose/run-stream", createAutoProductionStreamHandler({
    prepareComposition,
    generateLeadSheet,
    generateArrangement,
    analyze: (musicXml, styleId, idea) => {
      const songDNA = extractSongDNA(musicXml);
      const mappedStyle = getStyleDisplayName(styleId);
      const blueprint = buildProductionBlueprint(songDNA, { style: mappedStyle, idea });
      return { songDNA, blueprint };
    },
  }));

  app.post("/api/compose/prepare", async (req, res) => {
    try {
      const { idea, styleId } = req.body;
      if (!idea) return res.status(400).json({ error: "Idea is required" });
      const result = await prepareComposition(idea, styleId || "STYLE.VN.VPOP-BALLAD");
      res.json(result);
    } catch (error: any) {
      console.error("Prepare error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/compose/lead-sheet", async (req, res) => {
    lastLeadSheetDiagnostics = null;
    try {
      const { composePrompt, composeDocRefs, metaPlan, songRequest, styleId } = req.body;
      if (!composePrompt) return res.status(400).json({ error: "Compose prompt is required" });
      const xml = await generateLeadSheet(composePrompt, composeDocRefs || [], metaPlan || "", songRequest, styleId || "STYLE.VN.VPOP-BALLAD");
      res.json({ xml });
    } catch (error: any) {
      const diagnostics = buildGenerationFailureDiagnostics(error);
      lastLeadSheetDiagnostics = diagnostics;
      console.error("Lead Sheet error:", error);
      console.error("LEAD_SHEET_DIAGNOSTICS", JSON.stringify(diagnostics));
      const code = error.code || 'COMPOSITION_FAILED';
      res.status(500).json({
        error: {
          code,
          message: error.message,
          diagnostics,
        },
      });
    }
  });

  app.post("/api/compose/arrange", async (req, res) => {
    try {
      const { leadSheetXml, arrangePrompt, arrangeDocRefs, songRequest, styleId } = req.body;
      if (!leadSheetXml || !arrangePrompt) return res.status(400).json({ error: "Missing required fields" });
      const xml = await generateArrangement(leadSheetXml, arrangePrompt, arrangeDocRefs || [], songRequest, styleId || "STYLE.VN.VPOP-BALLAD");
      res.json({ xml });
    } catch (error: any) {
      console.error("Arrange error:", error);
      const code = error.code || 'ARRANGEMENT_FAILED';
      res.status(500).json({ error: { code, message: error.message } });
    }
  });

  app.post("/api/compose/revise-section", async (req, res) => {
    try {
      const { musicXml, startMeasure, endMeasure, instruction, styleId } = req.body || {};
      if (!musicXml || typeof musicXml !== 'string' || !instruction || typeof instruction !== 'string') {
        return res.status(400).json({ error: { code: 'SECTION_MERGE_FAILED', message: 'Thiếu MusicXML hoặc yêu cầu chỉnh sửa.' } });
      }

      const initialValidation = validateMusicXML(musicXml);
      if (!initialValidation.isValid) {
        return res.status(400).json({ error: { code: 'INVALID_MUSICXML', message: initialValidation.errors.join('; ') } });
      }

      const context = buildSectionRevisionContext({
        musicXml,
        startMeasure: Number(startMeasure),
        endMeasure: Number(endMeasure),
        instruction,
        styleId: styleId || 'STYLE.VN.VPOP-BALLAD',
      });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: { code: 'PROVIDER_UNAVAILABLE', message: 'API Key is not configured.' } });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const model = process.env.TEXT_MODEL || 'gemini-3.5-flash-lite';
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: context.prompt }] }],
        config: {
          systemInstruction: context.systemInstruction,
          temperature: 0.35
        }
      });

      const replacement = extractSectionRevisionXml(response.text || '');
      const mergedXml = mergeSectionReplacement(musicXml, replacement, Number(startMeasure), Number(endMeasure));
      const validation = validateMusicXML(mergedXml);
      if (!validation.isValid) {
        return res.status(422).json({ error: { code: 'SECTION_MERGE_FAILED', message: validation.errors.join('; ') } });
      }

      res.json({ xml: mergedXml, model });
    } catch (error: any) {
      if (error instanceof SectionRevisionError) {
        const status = error.code === 'INVALID_MUSICXML' ? 400 : 422;
        return res.status(status).json({ error: { code: error.code, message: error.message } });
      }
      console.error("Section revision error:", error);
      const classified = classifySectionProviderError(error);
      res.status(classified.status).json({ error: { code: classified.code, message: classified.message } });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction, temperature = 0.7, useFallbackModel } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      
      let modelName = process.env.TEXT_MODEL || 'gemini-3.5-flash-lite';
      if (useFallbackModel) {
        modelName = process.env.TEXT_FALLBACK_MODEL || 'gemini-3.5-flash';
      }

      if (!apiKey) {
        return res.status(500).json({ error: "API Key is not configured." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });
  // ------------------

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
