import { fullMeasureRange, validateMeasureRange, summarizeMeasureRange } from '../../src/music/measure-range';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const xml = `<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>Piano</part-name></score-part><score-part id="P2"><part-name>Bass</part-name></score-part></part-list><part id="P1"><measure number="1"/><measure number="3"/><measure number="7"/></part><part id="P2"><measure number="1"/><measure number="3"/><measure number="7"/></part></score-partwise>`;
let threw = false; try { validateMeasureRange(xml, { startMeasure: 7, endMeasure: 3 }); } catch { threw = true; }
assert(threw, 'reversed range throws');
threw = false; try { validateMeasureRange(xml, { startMeasure: 2, endMeasure: 3 }); } catch { threw = true; }
assert(threw, 'missing sparse start throws');
const valid = validateMeasureRange(xml, { startMeasure: 3, endMeasure: 7 });
assert(JSON.stringify(valid.availableMeasures) === JSON.stringify([1,3,7]), 'actual sparse measure numbers');
const summary = summarizeMeasureRange(xml, { startMeasure: 3, endMeasure: 7 });
assert(summary.measureCount === 2, 'range count uses actual listed measures');
assert(summary.partIds.length === 2, 'summary lists parts containing selected range');
const full = fullMeasureRange(xml);
assert(full.startMeasure === 1 && full.endMeasure === 7, 'full range spans the first through last actual measure number');
console.log('MEASURE RANGE TESTS PASSED');
