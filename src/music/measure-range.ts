export interface MeasureRange {
  startMeasure: number;
  endMeasure: number;
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.filter(Number.isFinite).map(value => Math.round(value)))].sort((a, b) => a - b);
}

export function listMusicXMLMeasureNumbers(xml: string): number[] {
  const numbers: number[] = [];
  const regex = /<(?:[A-Za-z_][\w.-]*:)?measure\b[^>]*\bnumber\s*=\s*["']\s*(-?\d+)\s*["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml))) numbers.push(Number(match[1]));
  return uniqueSorted(numbers);
}

export function fullMeasureRange(xml: string): MeasureRange {
  const availableMeasures = listMusicXMLMeasureNumbers(xml);
  if (availableMeasures.length === 0) throw new Error('INVALID_MEASURE_RANGE: Bản nhạc không có ô nhịp đánh số.');
  return {
    startMeasure: availableMeasures[0],
    endMeasure: availableMeasures[availableMeasures.length - 1],
  };
}

export function validateMeasureRange(
  xml: string,
  range: MeasureRange,
): { startMeasure: number; endMeasure: number; availableMeasures: number[] } {
  const startMeasure = Math.round(Number(range.startMeasure));
  const endMeasure = Math.round(Number(range.endMeasure));
  if (!Number.isFinite(startMeasure) || !Number.isFinite(endMeasure)) {
    throw new Error('INVALID_MEASURE_RANGE: Số ô nhịp không hợp lệ.');
  }
  if (startMeasure > endMeasure) {
    throw new Error('INVALID_MEASURE_RANGE: Ô bắt đầu phải nhỏ hơn hoặc bằng ô kết thúc.');
  }
  const availableMeasures = listMusicXMLMeasureNumbers(xml);
  if (availableMeasures.length === 0) throw new Error('INVALID_MEASURE_RANGE: Bản nhạc không có ô nhịp đánh số.');
  if (!availableMeasures.includes(startMeasure) || !availableMeasures.includes(endMeasure)) {
    throw new Error('INVALID_MEASURE_RANGE: Khoảng chọn nằm ngoài các ô nhịp hiện có.');
  }
  return { startMeasure, endMeasure, availableMeasures };
}

function partSegments(xml: string): Array<{ id: string; body: string }> {
  const result: Array<{ id: string; body: string }> = [];
  const regex = /<(?:[A-Za-z_][\w.-]*:)?part\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?part\s*>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml))) result.push({ id: match[1], body: match[2] });
  return result;
}

export function summarizeMeasureRange(
  xml: string,
  range: MeasureRange,
): { partIds: string[]; measureCount: number; startMeasure: number; endMeasure: number } {
  const validated = validateMeasureRange(xml, range);
  const selectedMeasures = validated.availableMeasures.filter(number => number >= validated.startMeasure && number <= validated.endMeasure);
  const selected = new Set(selectedMeasures);
  const partIds = partSegments(xml)
    .filter(part => listMusicXMLMeasureNumbers(part.body).some(number => selected.has(number)))
    .map(part => part.id);
  return {
    partIds,
    measureCount: selectedMeasures.length,
    startMeasure: validated.startMeasure,
    endMeasure: validated.endMeasure,
  };
}
