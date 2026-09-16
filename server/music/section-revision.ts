export interface SectionRevisionRequest {
  musicXml: string;
  startMeasure: number;
  endMeasure: number;
  instruction: string;
  styleId: string;
}

export type SectionRevisionErrorCode = 'SECTION_MERGE_FAILED' | 'INVALID_MUSICXML';

export class SectionRevisionError extends Error {
  constructor(public readonly code: SectionRevisionErrorCode, message: string) {
    super(message);
    this.name = 'SectionRevisionError';
  }
}

interface XmlSegment {
  id?: string;
  number?: number;
  start: number;
  end: number;
  openEnd: number;
  closeStart: number;
  text: string;
  body: string;
}

const PART_RE = /<(?:[A-Za-z_][\w.-]*:)?part(?=\s|>)([^>]*)>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?part\s*>/gi;
const MEASURE_RE = /<(?:[A-Za-z_][\w.-]*:)?measure\b([^>]*)>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?measure\s*>|<(?:[A-Za-z_][\w.-]*:)?measure\b([^>]*)\/\s*>/gi;

function attr(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match?.[1];
}

function parsePartSegments(xml: string): XmlSegment[] {
  const result: XmlSegment[] = [];
  PART_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PART_RE.exec(xml))) {
    const attrs = match[1] || '';
    const full = match[0];
    const body = match[2] || '';
    const openEndRelative = full.indexOf('>') + 1;
    const closeStartRelative = full.lastIndexOf('</');
    result.push({
      id: attr(attrs, 'id'),
      start: match.index,
      end: match.index + full.length,
      openEnd: match.index + openEndRelative,
      closeStart: match.index + closeStartRelative,
      text: full,
      body,
    });
  }
  return result;
}

function parseMeasureSegments(body: string): XmlSegment[] {
  const result: XmlSegment[] = [];
  MEASURE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MEASURE_RE.exec(body))) {
    const attrs = (match[1] ?? match[3] ?? '') as string;
    const numberRaw = attr(attrs, 'number');
    const number = numberRaw !== undefined && Number.isFinite(Number(numberRaw)) ? Math.round(Number(numberRaw)) : undefined;
    const full = match[0];
    const openEndRelative = full.indexOf('>') >= 0 ? full.indexOf('>') + 1 : full.length;
    const closeStartRelative = full.lastIndexOf('</') >= 0 ? full.lastIndexOf('</') : full.length;
    result.push({
      number,
      start: match.index,
      end: match.index + full.length,
      openEnd: match.index + openEndRelative,
      closeStart: match.index + closeStartRelative,
      text: full,
      body: (match[2] || ''),
    });
  }
  return result;
}

function selectedMeasures(part: XmlSegment, start: number, end: number): XmlSegment[] {
  return parseMeasureSegments(part.body).filter(measure => measure.number !== undefined && measure.number >= start && measure.number <= end);
}

function assertValidRange(startMeasure: number, endMeasure: number): void {
  if (!Number.isFinite(startMeasure) || !Number.isFinite(endMeasure) || Math.round(startMeasure) > Math.round(endMeasure)) {
    throw new SectionRevisionError('SECTION_MERGE_FAILED', 'Khoảng ô nhịp không hợp lệ.');
  }
}

function findSectionRoot(xml: string): string {
  const match = xml.match(/<(?:[A-Za-z_][\w.-]*:)?section-revision\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?section-revision\s*>/i);
  if (!match) throw new SectionRevisionError('SECTION_MERGE_FAILED', 'AI không trả về section-revision hợp lệ.');
  return match[1];
}

function replaceMeasuresInPart(sourcePart: XmlSegment, replacementPart: XmlSegment, startMeasure: number, endMeasure: number): string {
  const sourceMeasures = selectedMeasures(sourcePart, startMeasure, endMeasure);
  if (sourceMeasures.length === 0) return sourcePart.text;
  const replacementMeasures = selectedMeasures(replacementPart, startMeasure, endMeasure);
  const replacementByNumber = new Map<number, XmlSegment>();
  for (const measure of replacementMeasures) {
    if (measure.number === undefined) continue;
    if (replacementByNumber.has(measure.number)) throw new SectionRevisionError('SECTION_MERGE_FAILED', `Ô nhịp ${measure.number} bị lặp trong phần thay thế.`);
    replacementByNumber.set(measure.number, measure);
  }
  const expected = sourceMeasures.map(measure => measure.number as number);
  for (const number of expected) {
    if (!replacementByNumber.has(number)) throw new SectionRevisionError('SECTION_MERGE_FAILED', `Thiếu ô nhịp ${number} ở bè ${sourcePart.id}.`);
  }
  for (const number of replacementByNumber.keys()) {
    if (!expected.includes(number)) throw new SectionRevisionError('SECTION_MERGE_FAILED', `Phần thay thế chứa ô nhịp ngoài phạm vi: ${number}.`);
  }

  let body = sourcePart.body;
  for (const measure of [...sourceMeasures].sort((a, b) => b.start - a.start)) {
    const replacement = replacementByNumber.get(measure.number as number)!;
    body = body.slice(0, measure.start) + replacement.text + body.slice(measure.end);
  }
  const open = sourcePart.text.slice(0, sourcePart.text.indexOf('>') + 1);
  const close = sourcePart.text.slice(sourcePart.text.lastIndexOf('</'));
  return `${open}${body}${close}`;
}

export function mergeSectionReplacement(sourceXml: string, replacementXml: string, startMeasure: number, endMeasure: number): string {
  assertValidRange(startMeasure, endMeasure);
  const sourceParts = parsePartSegments(sourceXml).filter(part => part.id);
  if (sourceParts.length === 0) throw new SectionRevisionError('INVALID_MUSICXML', 'MusicXML nguồn không có part hợp lệ.');
  const replacementBody = findSectionRoot(replacementXml);
  const replacementParts = parsePartSegments(replacementBody).filter(part => part.id);
  const replacementById = new Map(replacementParts.map(part => [part.id!, part]));

  let merged = sourceXml;
  for (const sourcePart of [...sourceParts].sort((a, b) => b.start - a.start)) {
    const sourceSelected = selectedMeasures(sourcePart, startMeasure, endMeasure);
    if (sourceSelected.length === 0) continue;
    const replacementPart = replacementById.get(sourcePart.id!);
    if (!replacementPart) throw new SectionRevisionError('SECTION_MERGE_FAILED', `Thiếu bè ${sourcePart.id} trong phần thay thế.`);
    const nextPartText = replaceMeasuresInPart(sourcePart, replacementPart, startMeasure, endMeasure);
    merged = merged.slice(0, sourcePart.start) + nextPartText + merged.slice(sourcePart.end);
  }
  return merged;
}

function contextMeasuresForPart(part: XmlSegment, startMeasure: number, endMeasure: number): string {
  const measures = parseMeasureSegments(part.body).filter(measure => {
    if (measure.number === undefined) return false;
    return measure.number >= startMeasure - 1 && measure.number <= endMeasure + 1;
  });
  return `<part id="${part.id}">${measures.map(measure => measure.text).join('')}</part>`;
}

export function buildSectionRevisionContext(req: SectionRevisionRequest): { systemInstruction: string; prompt: string } {
  assertValidRange(req.startMeasure, req.endMeasure);
  const parts = parsePartSegments(req.musicXml).filter(part => part.id && selectedMeasures(part, req.startMeasure, req.endMeasure).length > 0);
  if (parts.length === 0) throw new SectionRevisionError('SECTION_MERGE_FAILED', 'Không tìm thấy ô nhịp cần sửa.');
  const partIds = parts.map(part => part.id).join(', ');
  const context = parts.map(part => contextMeasuresForPart(part, req.startMeasure, req.endMeasure)).join('\n');
  return {
    systemInstruction: [
      'You are a surgical MusicXML section editor.',
      'Return ONLY one <section-revision> XML fragment, no Markdown.',
      `Return exactly these part IDs: ${partIds}.`,
      `Replace only measures ${req.startMeasure} through ${req.endMeasure}.`,
      'Do not output the whole score. Preserve measure numbers and MusicXML semantics.',
      'Measures immediately outside the requested range are context only and MUST NOT appear in the response.',
    ].join('\n'),
    prompt: [
      `Style: ${req.styleId}`,
      `User instruction: ${req.instruction.trim()}`,
      `Requested measures: ${req.startMeasure}-${req.endMeasure}`,
      `Required part IDs: ${partIds}`,
      'Context (one adjacent measure on each side when available):',
      context,
    ].join('\n\n'),
  };
}

export type SectionProviderErrorCode = 'PROVIDER_UNAVAILABLE' | 'PROVIDER_RATE_LIMITED' | 'SECTION_MERGE_FAILED';

export function classifySectionProviderError(error: unknown): { code: SectionProviderErrorCode; status: number; message: string } {
  const value = error as { status?: number; code?: number | string; message?: string } | undefined;
  const status = Number(value?.status || value?.code || 0);
  const message = String(value?.message || error || 'Không thể chỉnh sửa đoạn nhạc.');
  if (status === 429 || /rate\s*limit|quota|too many requests/i.test(message)) {
    return { code: 'PROVIDER_RATE_LIMITED', status: 429, message };
  }
  if (status === 503 || /high demand|unavailable|overloaded|try again/i.test(message)) {
    return { code: 'PROVIDER_UNAVAILABLE', status: 503, message };
  }
  return { code: 'SECTION_MERGE_FAILED', status: 500, message };
}
