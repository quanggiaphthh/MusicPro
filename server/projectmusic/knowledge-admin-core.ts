export interface KnowledgeFilterableDocument {
  id: string;
  title: string;
  category: string;
  summary?: string;
  tags?: string[];
  servesSteps?: number[];
}

export interface KnowledgeFilters {
  query?: string;
  step?: number;
  tag?: string;
  category?: string;
}

export function categoryFromKnowledgePath(docPath: string): string {
  const normalized = docPath.replace(/\\/g, '/');
  const marker = 'docs/m-guide/';
  const relative = normalized.includes(marker) ? normalized.slice(normalized.indexOf(marker) + marker.length) : normalized;
  const segments = relative.split('/').filter(Boolean);
  if (segments.length === 0) return 'other';
  if (segments[0] === 'knowledge' && segments[1]) return segments[1];
  if (segments[0] === 'styles') return 'styles';
  if (segments[0] === 'artifacts') return 'artifacts';
  if (segments[0] === 'prompt-craft') return 'prompt-craft';
  if (segments[0] === 'pipeline') return 'pipeline';
  if (segments[0] === 'meta') return 'meta';
  if (segments[0] === 'guides') return 'guides';
  return segments[0] || 'other';
}

export function firstMarkdownHeading(content: string, fallback: string): string {
  const match = content.match(/^\s*#\s+(.+?)\s*$/m);
  return match?.[1]?.trim() || fallback;
}


function normalizeAbsolutePath(value: string): string {
  const raw = value.replace(/\\/g, '/');
  const absolute = raw.startsWith('/');
  const parts: string[] = [];
  for (const part of raw.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (parts.length === 0) throw new Error(`Path escapes root: ${value}`);
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return `${absolute ? '/' : ''}${parts.join('/')}` || (absolute ? '/' : '.');
}

export function resolveKnowledgePath(baseDir: string, catalogPath: string): string {
  const normalized = catalogPath.replace(/\\/g, '/');
  const relative = normalized.startsWith('docs/m-guide/')
    ? normalized.slice('docs/m-guide/'.length)
    : normalized;
  const root = normalizeAbsolutePath(baseDir);
  const candidate = normalizeAbsolutePath(`${root}/${relative}`);
  if (candidate !== root && !candidate.startsWith(`${root}/`)) {
    throw new Error(`Knowledge path escapes canonical root: ${catalogPath}`);
  }
  return candidate;
}

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase('vi-VN').normalize('NFKC').trim();
}

export function matchesKnowledgeFilters(
  doc: KnowledgeFilterableDocument,
  filters: KnowledgeFilters,
): boolean {
  if (filters.step && !(doc.servesSteps || []).includes(filters.step)) return false;
  if (filters.tag && !(doc.tags || []).includes(filters.tag)) return false;
  if (filters.category && doc.category !== filters.category) return false;
  const query = normalizeSearch(filters.query || '');
  if (!query) return true;
  const haystack = normalizeSearch([
    doc.id,
    doc.title,
    doc.summary || '',
    doc.category,
    ...(doc.tags || []),
  ].join(' '));
  return haystack.includes(query);
}
