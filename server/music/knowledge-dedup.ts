const DOC_MARKER_RE = /^---\s*DOCUMENT:\s*(.+?)\s*---$/gim;

export function dedupeKnowledgeRefsAgainstCore(refs: string[], coreText: string, additionalCoreIds: string[] = []): string[] {
  const coreIds = new Set<string>(additionalCoreIds.map(id => String(id || "").trim()).filter(Boolean));
  for (const match of coreText.matchAll(DOC_MARKER_RE)) coreIds.add(String(match[1]).trim());
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of refs || []) {
    const id = String(raw || '').trim();
    if (!id || coreIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}
