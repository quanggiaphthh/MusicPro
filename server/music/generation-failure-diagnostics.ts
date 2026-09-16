export interface GenerationFailureDiagnostics {
  code: string;
  message: string;
  validationSummary: string;
  xmlLength: number;
  hasClosingScorePartwise: boolean;
  likelyTruncated: boolean;
  xmlTail: string;
}

export function buildGenerationFailureDiagnostics(error: any): GenerationFailureDiagnostics {
  const xml = typeof error?.xml === 'string' ? error.xml : '';
  const message = String(error?.message || 'Unknown composition failure');
  const validationPrefix = 'Lead Sheet validation failed after retry:';
  const validationSummary = message.startsWith(validationPrefix)
    ? message.slice(validationPrefix.length).trim()
    : message;
  const hasClosingScorePartwise = /<\/score-partwise\s*>/i.test(xml);

  return {
    code: String(error?.code || 'COMPOSITION_FAILED'),
    message,
    validationSummary,
    xmlLength: xml.length,
    hasClosingScorePartwise,
    likelyTruncated: xml.length > 0 && !hasClosingScorePartwise,
    xmlTail: xml.slice(-500),
  };
}
