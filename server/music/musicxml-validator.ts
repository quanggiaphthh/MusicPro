import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { extractSongDNA } from './song-dna';

export interface MusicXMLValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateMusicXML(xml: string): MusicXMLValidationResult {
  const errors: string[] = [];
  
  // 1. Well-formed check
  const parseResult = XMLValidator.validate(xml);
  if (parseResult !== true) {
    errors.push(`XML not well-formed: ${parseResult.err?.msg || 'Unknown error'}`);
    return { isValid: false, errors };
  }

  // 2. Structural check
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });
  const jsonObj = parser.parse(xml);
  
  const score = jsonObj['score-partwise'];
  if (!score) {
    errors.push("Missing <score-partwise> root element");
  } else {
    if (!score['part-list']) errors.push("Missing <part-list>");
    if (!score['part']) {
      errors.push("Missing <part>");
    } else {
      const parts = Array.isArray(score['part']) ? score['part'] : [score['part']];
      let hasMeasure = false;
      let hasPitchedNote = false;
      
      for (const part of parts) {
        if (!part) continue;
        const measures = Array.isArray(part['measure']) ? part['measure'] : [part['measure']];
        if (measures.length > 0) hasMeasure = true;
        
        for (const m of measures) {
          if (m['note']) {
            const notes = Array.isArray(m['note']) ? m['note'] : [m['note']];
            let previousNote: any = null;
            let previousVoiceStaff = "";

            for (let i = 0; i < notes.length; i++) {
              const n = notes[i];
              
              if (Array.isArray(n.pitch)) {
                errors.push("Invalid MusicXML: <note> contains multiple <pitch> elements. Chords must be encoded as separate notes with <chord/> tags.");
              }

              const isChord = n.chord !== undefined;
              const voice = n.voice !== undefined ? String(n.voice) : "1";
              const staff = n.staff !== undefined ? String(n.staff) : "1";
              const currentVoiceStaff = `${voice}-${staff}`;

              if (isChord) {
                if (i === 0 || !previousNote || previousVoiceStaff !== currentVoiceStaff) {
                  errors.push("Invalid MusicXML: <chord/> used on a note without a valid preceding note in the same voice/staff.");
                }
              }

              if (n.pitch || n.rest !== undefined || n.unpitched !== undefined) {
                 previousNote = n;
                 previousVoiceStaff = currentVoiceStaff;
              }

              if (!Array.isArray(n.pitch) && n.pitch && n.pitch.step && n.pitch.octave !== undefined) {
                hasPitchedNote = true;
              }
              
              const isGrace = n.grace !== undefined;
              if (!isGrace) {
                if (n.duration === undefined) {
                  errors.push("Invalid MusicXML: Normal note or rest missing <duration>.");
                } else if (isNaN(Number(n.duration)) || Number(n.duration) <= 0) {
                  errors.push("Invalid MusicXML: Normal note or rest must have a positive <duration>.");
                }
              }
            }
          }
        }
        if (hasPitchedNote) break;
      }
      
      if (!hasMeasure) errors.push("Missing <measure> elements");
      if (!hasPitchedNote) errors.push("Score contains no pitched notes (rest-only scores are not allowed)");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateLeadSheet(xml: string, songRequest?: any): MusicXMLValidationResult {
  const baseResult = validateMusicXML(xml);
  if (!baseResult.isValid) return baseResult;

  const errors = [...baseResult.errors];
  
  const dna = extractSongDNA(xml);

  // 1. Vocal check
  const isVocal = !!(songRequest?.vocalDirection || songRequest?.language || (songRequest?.lyricDirection && songRequest.lyricDirection !== "None"));
  if (isVocal && (!dna.lyrics || dna.lyrics.syllables.length === 0)) {
    errors.push("Lead sheet missing lyrics for a vocal song");
  }

  // 2. Harmony check
  const needsHarmony = !!(songRequest?.harmonyDirection && songRequest.harmonyDirection !== "None");
  if (needsHarmony && (!dna.harmony || dna.harmony.length === 0)) {
    errors.push("Lead sheet missing <harmony> (chords) required by song request");
  }

  // 3. Completeness check
  const isDemo = songRequest?.songForm?.toLowerCase().includes("short") || songRequest?.songForm?.toLowerCase().includes("demo") || songRequest?.songForm?.toLowerCase().includes("sketch");
  if (!isDemo && dna.musical.approximateDuration && dna.musical.approximateDuration < 150) {
    errors.push(`Lead sheet too short (${Math.round(dna.musical.approximateDuration)} seconds). Complete songs must be at least 150 seconds.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function computeLCS(seq1: number[], seq2: number[]): number {
  if (seq1.length === 0 || seq2.length === 0) return 0;
  const m = seq1.length;
  const n = seq2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (seq1[i - 1] === seq2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export function validateArrangement(xml: string, referenceLeadSheetXml?: string, songRequest?: any): MusicXMLValidationResult {
  const baseResult = validateMusicXML(xml);
  if (!baseResult.isValid) return baseResult;

  const errors = [...baseResult.errors];
  
  const arrangedDna = extractSongDNA(xml);
  
  if (referenceLeadSheetXml) {
    const refDna = extractSongDNA(referenceLeadSheetXml);
    
    // 1. Normalized main lyrics check
    const refLyric = (refDna.lyrics.assembledLyric || "").trim();
    const arrLyric = (arrangedDna.lyrics.assembledLyric || "").trim();
    if (refLyric.length > 0 && arrLyric.length === 0) {
      errors.push("Arrangement lost all lyrics from the original lead sheet");
    } else if (refLyric.length > 0) {
      const refNorm = refLyric.toLowerCase().replace(/[^a-z0-9à-ỹ]/g, "");
      const arrNorm = arrLyric.toLowerCase().replace(/[^a-z0-9à-ỹ]/g, "");
      if (refNorm.length > 0) {
        const lcsLen = computeLCS(refNorm.split('').map(c => c.charCodeAt(0)), arrNorm.split('').map(c => c.charCodeAt(0)));
        const ratio = lcsLen / refNorm.length;
        if (ratio < 0.4) {
          errors.push("Arrangement lost too many lyrics from the original lead sheet");
        }
      }
    }

    // 2. Musical constants (Key + Mode)
    const refHasKey = /<key\b[^>]*>[\s\S]*?<\/key>|<key\b[^>]*\/>/i.test(referenceLeadSheetXml);
    const arrHasKey = /<key\b[^>]*>[\s\S]*?<\/key>|<key\b[^>]*\/>/i.test(xml);
    const refKey = `${refDna.musical.key || ''} ${refDna.musical.mode || ''}`.trim();
    const arrKey = `${arrangedDna.musical.key || ''} ${arrangedDna.musical.mode || ''}`.trim();

    if (refHasKey && !arrHasKey) {
      errors.push("Arrangement omitted key/mode metadata present in the reference lead sheet");
    } else if (refHasKey && arrHasKey && refKey && arrKey && refKey !== arrKey) {
      errors.push(`Arrangement changed key/mode from ${refKey} to ${arrKey}`);
    }

    // 3. Meter (Time Signature)
    const refHasTime = /<time\b[^>]*>[\s\S]*?<\/time>|<time\b[^>]*\/>/i.test(referenceLeadSheetXml);
    const arrHasTime = /<time\b[^>]*>[\s\S]*?<\/time>|<time\b[^>]*\/>/i.test(xml);

    if (refHasTime && !arrHasTime) {
      errors.push("Arrangement omitted time signature metadata present in the reference lead sheet");
    } else if (refHasTime && arrHasTime && refDna.musical.timeSignature && arrangedDna.musical.timeSignature) {
      if (refDna.musical.timeSignature !== arrangedDna.musical.timeSignature) {
        errors.push(`Arrangement changed time signature from ${refDna.musical.timeSignature} to ${arrangedDna.musical.timeSignature}`);
      }
    }

    // 4. Initial BPM
    const refHasBpm = /tempo\s*=\s*["']?\d+["']?|<sound\b[^>]*tempo\b|<metronome\b/i.test(referenceLeadSheetXml) || refDna.musical.tempoBpm != null;
    const arrHasBpm = /tempo\s*=\s*["']?\d+["']?|<sound\b[^>]*tempo\b|<metronome\b/i.test(xml) || arrangedDna.musical.tempoBpm != null;

    if (refHasBpm && refDna.musical.tempoBpm != null) {
      if (!arrHasBpm || arrangedDna.musical.tempoBpm == null) {
        errors.push("Arrangement omitted initial BPM metadata present in the reference lead sheet");
      } else if (refDna.musical.tempoBpm !== arrangedDna.musical.tempoBpm) {
        errors.push(`Arrangement changed initial BPM from ${refDna.musical.tempoBpm} to ${arrangedDna.musical.tempoBpm}`);
      }
    }

    // 5. Main Melodic Identity (Order-aware LCS similarity over MIDI sequence)
    const refMidi = refDna.fingerprint?.midiSequence || refDna.melody?.map(m => m.midi) || [];
    const arrMidi = arrangedDna.fingerprint?.midiSequence || arrangedDna.melody?.map(m => m.midi) || [];
    if (refMidi.length > 0) {
      const lcs = computeLCS(refMidi, arrMidi);
      const melodyRatio = lcs / refMidi.length;
      if (melodyRatio < 0.3) {
        errors.push("Arrangement failed to preserve the main melodic identity (order-aware sequence similarity too low)");
      }
    }

    // 6. Harmony check
    const refHarmonyCount = (refDna.harmony || []).reduce((acc, h) => acc + h.chordSymbols.length, 0);
    const arrHarmonyCount = (arrangedDna.harmony || []).reduce((acc, h) => acc + h.chordSymbols.length, 0);
    if (refHarmonyCount > 0 && arrHarmonyCount === 0) {
      errors.push("Arrangement lost harmony/chords present in the lead sheet");
    }
  }
  
  // 7. Completeness check
  const isDemo = songRequest?.songForm?.toLowerCase().includes("short") || songRequest?.songForm?.toLowerCase().includes("demo") || songRequest?.songForm?.toLowerCase().includes("sketch");
  if (!isDemo && arrangedDna.musical.approximateDuration && arrangedDna.musical.approximateDuration < 150) {
    errors.push(`Arrangement too short (${Math.round(arrangedDna.musical.approximateDuration)} seconds). Complete songs must be at least 150 seconds.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
