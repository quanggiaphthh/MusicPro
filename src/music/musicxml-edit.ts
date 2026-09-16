import type { MeasureRange } from './measure-range';
import { validateMeasureRange } from './measure-range';

function elementName(element: Element): string {
  return element.localName || element.tagName;
}

function parseXml(xml: string): XMLDocument {
  if (typeof DOMParser === 'undefined') throw new Error('MusicXML editing requires a browser DOMParser environment.');
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = document.getElementsByTagName('parsererror')[0] || document.getElementsByTagNameNS('*', 'parsererror')[0];
  if (parserError) throw new Error(`INVALID_MUSICXML: ${parserError.textContent || 'XML parse error'}`);
  if (document.documentElement?.localName !== 'score-partwise') throw new Error('INVALID_MUSICXML: Chỉ hỗ trợ score-partwise MusicXML.');
  return document;
}

function serializeXml(document: XMLDocument): string {
  const body = new XMLSerializer().serializeToString(document);
  return body.startsWith('<?xml') ? body : `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
}

function directChildren(parent: Element, tagName: string): Element[] {
  return Array.from(parent.children).filter(child => elementName(child) === tagName);
}

function directChild(parent: Element, tagName: string): Element | undefined {
  return directChildren(parent, tagName)[0];
}

function createElementForParent(document: XMLDocument, parent: Element, tagName: string): Element {
  return parent.namespaceURI ? document.createElementNS(parent.namespaceURI, tagName) : document.createElement(tagName);
}

function createElementForDocument(document: XMLDocument, tagName: string): Element {
  const root = document.documentElement;
  return root.namespaceURI ? document.createElementNS(root.namespaceURI, tagName) : document.createElement(tagName);
}

function ensureTextChild(document: XMLDocument, parent: Element, tagName: string): Element {
  let child = directChild(parent, tagName);
  if (!child) {
    child = createElementForParent(document, parent, tagName);
    parent.appendChild(child);
  }
  return child;
}

function numberAttribute(element: Element, name: string): number | undefined {
  const raw = element.getAttribute(name);
  if (raw === null || raw.trim() === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(value) : undefined;
}


export function midiProgramInsertionAnchor(childNames: string[]): string | null {
  const later = new Set(['midi-unpitched', 'volume', 'pan', 'elevation']);
  return childNames.find(name => later.has(name)) || null;
}

export function preferredScoreInstrumentId(existingIds: string[], partId: string): string {
  return existingIds.find(Boolean) || `${partId}-I1`;
}

export function setMusicXMLTitle(xml: string, title: string): string {
  const document = parseXml(xml);
  const root = document.documentElement;
  let work = directChild(root, 'work');
  if (!work) {
    work = createElementForDocument(document, 'work');
    const firstChild = root.firstElementChild;
    if (firstChild) root.insertBefore(work, firstChild);
    else root.appendChild(work);
  }
  ensureTextChild(document, work, 'work-title').textContent = title.trim() || 'Không tiêu đề';
  return serializeXml(document);
}

export function setLyricsInMeasureRange(xml: string, range: MeasureRange, text: string): string {
  const validated = validateMeasureRange(xml, range);
  const document = parseXml(xml);
  const lyricTextElements: Element[] = [];

  for (const part of Array.from(document.documentElement.children).filter(child => elementName(child) === 'part')) {
    for (const measure of directChildren(part, 'measure')) {
      const number = numberAttribute(measure, 'number');
      if (number === undefined || number < validated.startMeasure || number > validated.endMeasure) continue;
      for (const note of directChildren(measure, 'note')) {
        for (const lyric of directChildren(note, 'lyric')) {
          const textElement = directChild(lyric, 'text');
          if (textElement) lyricTextElements.push(textElement);
        }
      }
    }
  }

  if (lyricTextElements.length === 0) throw new Error('LYRIC_SLOT_MISMATCH: Khoảng chọn không có vị trí lời hiện hữu.');
  const tokens = text.trim() ? text.trim().split(/\s+/u) : [];
  if (tokens.length > lyricTextElements.length) {
    throw new Error(`LYRIC_SLOT_MISMATCH: Có ${tokens.length} từ nhưng chỉ có ${lyricTextElements.length} vị trí lời.`);
  }
  lyricTextElements.forEach((element, index) => { element.textContent = tokens[index] || ''; });
  return serializeXml(document);
}

export function setPartMidiProgram(xml: string, partId: string, midiProgram: number): string {
  const document = parseXml(xml);
  const program = Math.max(1, Math.min(128, Math.round(Number(midiProgram) || 1)));
  const partList = directChild(document.documentElement, 'part-list');
  if (!partList) throw new Error('INVALID_MUSICXML: Thiếu part-list.');
  const scorePart = directChildren(partList, 'score-part').find(part => part.getAttribute('id') === partId);
  if (!scorePart) throw new Error(`INVALID_MUSICXML: Không tìm thấy bè ${partId}.`);
  const scoreInstruments = directChildren(scorePart, 'score-instrument');
  const instrumentId = preferredScoreInstrumentId(scoreInstruments.map(item => item.getAttribute('id') || ''), partId);
  if (scoreInstruments.length === 0) {
    const scoreInstrument = createElementForParent(document, scorePart, 'score-instrument');
    scoreInstrument.setAttribute('id', instrumentId);
    const instrumentName = createElementForParent(document, scoreInstrument, 'instrument-name');
    instrumentName.textContent = `${directChild(scorePart, 'part-name')?.textContent?.trim() || partId} — Music-Pro`;
    scoreInstrument.appendChild(instrumentName);
    const firstMidiChild = Array.from(scorePart.children).find(child => ['midi-device', 'midi-instrument'].includes(elementName(child)));
    if (firstMidiChild) scorePart.insertBefore(scoreInstrument, firstMidiChild);
    else scorePart.appendChild(scoreInstrument);
  }

  let midiInstrument = directChildren(scorePart, 'midi-instrument')[0];
  if (!midiInstrument) {
    midiInstrument = createElementForParent(document, scorePart, 'midi-instrument');
    midiInstrument.setAttribute('id', instrumentId);
    scorePart.appendChild(midiInstrument);
  } else if (!midiInstrument.getAttribute('id')) {
    midiInstrument.setAttribute('id', instrumentId);
  }

  let programElement = directChild(midiInstrument, 'midi-program');
  if (!programElement) {
    programElement = createElementForParent(document, midiInstrument, 'midi-program');
    const childNames = Array.from(midiInstrument.children).map(elementName);
    const anchorName = midiProgramInsertionAnchor(childNames);
    const anchor = anchorName ? Array.from(midiInstrument.children).find(child => elementName(child) === anchorName) : undefined;
    if (anchor) midiInstrument.insertBefore(programElement, anchor);
    else midiInstrument.appendChild(programElement);
  }
  programElement.textContent = String(program);
  return serializeXml(document);
}
