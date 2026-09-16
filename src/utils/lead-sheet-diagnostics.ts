export interface LeadSheetFailureDiagnostics {
  code: string;
  message: string;
  validationSummary: string;
  xmlLength: number;
  hasClosingScorePartwise: boolean;
  likelyTruncated: boolean;
  xmlTail: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readLeadSheetFailureDiagnostics(payload: unknown): LeadSheetFailureDiagnostics | null {
  if (!isRecord(payload) || !isRecord(payload.error) || !isRecord(payload.error.diagnostics)) return null;
  const value = payload.error.diagnostics;
  if (
    typeof value.code !== 'string' ||
    typeof value.message !== 'string' ||
    typeof value.validationSummary !== 'string' ||
    typeof value.xmlLength !== 'number' ||
    typeof value.hasClosingScorePartwise !== 'boolean' ||
    typeof value.likelyTruncated !== 'boolean' ||
    typeof value.xmlTail !== 'string'
  ) return null;

  return {
    code: value.code,
    message: value.message,
    validationSummary: value.validationSummary,
    xmlLength: value.xmlLength,
    hasClosingScorePartwise: value.hasClosingScorePartwise,
    likelyTruncated: value.likelyTruncated,
    xmlTail: value.xmlTail,
  };
}

export function formatLeadSheetFailureDiagnostics(value: LeadSheetFailureDiagnostics): string {
  return JSON.stringify(value, null, 2);
}
