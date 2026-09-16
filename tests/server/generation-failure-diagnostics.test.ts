import { buildGenerationFailureDiagnostics } from '../../server/music/generation-failure-diagnostics.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const truncatedXml = '<?xml version="1.0"?><score-partwise><part id="P1"><measure number="1">';
const truncated = buildGenerationFailureDiagnostics({
  code: 'MUSICXML_INVALID_AFTER_RETRY',
  message: 'Lead Sheet validation failed after retry: XML parse error',
  xml: truncatedXml,
});
assert(truncated.code === 'MUSICXML_INVALID_AFTER_RETRY', 'must retain error code');
assert(truncated.xmlLength === truncatedXml.length, 'must report XML length');
assert(truncated.hasClosingScorePartwise === false, 'truncated XML must not report closing score tag');
assert(truncated.likelyTruncated === true, 'missing closing score tag must be flagged as likely truncated');
assert(truncated.xmlTail === truncatedXml, 'short XML tail must include complete XML');

const closedXml = '<score-partwise><part id="P1"/></score-partwise>';
const closed = buildGenerationFailureDiagnostics({
  message: 'Lead Sheet validation failed after retry: duration too short',
  xml: closedXml,
});
assert(closed.hasClosingScorePartwise === true, 'closed XML must be detected');
assert(closed.likelyTruncated === false, 'closed XML must not be classified as truncated');
assert(closed.validationSummary.includes('duration too short'), 'validation summary must retain validator message');

const longXml = `<score-partwise>${'x'.repeat(900)}`;
const long = buildGenerationFailureDiagnostics({ xml: longXml, message: 'invalid' });
assert(long.xmlTail.length === 500, 'tail must be bounded to 500 characters');

console.log('GENERATION FAILURE DIAGNOSTICS TESTS PASSED');
