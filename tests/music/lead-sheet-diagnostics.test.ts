import { readLeadSheetFailureDiagnostics, formatLeadSheetFailureDiagnostics } from '../../src/utils/lead-sheet-diagnostics.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const payload = {
  error: {
    code: 'MUSICXML_INVALID_AFTER_RETRY',
    message: 'Lead Sheet validation failed after retry: malformed XML',
    diagnostics: {
      code: 'MUSICXML_INVALID_AFTER_RETRY',
      message: 'Lead Sheet validation failed after retry: malformed XML',
      validationSummary: 'malformed XML',
      xmlLength: 8192,
      hasClosingScorePartwise: false,
      likelyTruncated: true,
      xmlTail: '<measure number="42"><note>',
    },
  },
};

const diagnostics = readLeadSheetFailureDiagnostics(payload);
assert(diagnostics !== null, 'must extract diagnostics from the exact failed response');
assert(diagnostics.likelyTruncated === true, 'must preserve likelyTruncated');
assert(diagnostics.xmlLength === 8192, 'must preserve xmlLength');
assert(diagnostics.xmlTail.includes('measure'), 'must preserve xmlTail');

const text = formatLeadSheetFailureDiagnostics(diagnostics);
assert(text.includes('MUSICXML_INVALID_AFTER_RETRY'), 'formatted diagnostics must include code');
assert(text.includes('"likelyTruncated": true'), 'formatted diagnostics must expose truncation flag');
assert(text.includes('"xmlLength": 8192'), 'formatted diagnostics must expose XML length');

assert(readLeadSheetFailureDiagnostics({ error: { code: 'OTHER' } }) === null, 'missing diagnostics must return null');
console.log('LEAD_SHEET_RESPONSE_DIAGNOSTICS_TEST_PASS');
