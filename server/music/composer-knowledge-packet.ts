import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_R3_IDS = [
  'META.STANDARDS',
  'PIPE.STEP-03',
  'KNOW.MELODY.COMPOSITION-PLANNING',
  'KNOW.MELODY.INVENTION',
  'KNOW.MELODY.ANTI-PATTERNS',
  'KNOW.MELODY.QUALITY-GATE',
  'KNOW.LYRICS.LYRIC-MELODY-FIT',
  'KNOW.VI.TONE-MELODY',
  'KNOW.VI.SYLLABLE-PRIORITY',
] as const;

const R3_EXCLUDED_IDS = new Set([
  'KNOW.MUSICXML.RULES',
  'KNOW.MUSICXML.SAFE-PATTERNS',
]);

interface CatalogEntry {
  id: string;
  path: string;
  servesSteps: number[];
}

function resolveGuideRoot(): string {
  const candidates = [
    process.env.PROJECTMUSIC_DIR,
    path.join(process.cwd(), 'docs', 'm-guide'),
    path.join(process.cwd(), 'dist', 'docs', 'm-guide'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'catalog.yml'))) return candidate;
  }
  throw new Error('PROJECTMUSIC_CATALOG_NOT_FOUND');
}

function parseInlineNumberList(value: string): number[] {
  const match = value.match(/\[([^\]]*)\]/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map(item => Number(item.trim()))
    .filter(Number.isFinite);
}

function parseCatalog(): Map<string, CatalogEntry> {
  const guideRoot = resolveGuideRoot();
  const catalog = fs.readFileSync(path.join(guideRoot, 'catalog.yml'), 'utf8');
  const entries = new Map<string, CatalogEntry>();
  let current: Partial<CatalogEntry> | undefined;

  const flush = () => {
    if (current?.id && current.path) {
      entries.set(current.id, {
        id: current.id,
        path: current.path,
        servesSteps: current.servesSteps || [],
      });
    }
  };

  for (const rawLine of catalog.split(/\r?\n/)) {
    const idMatch = rawLine.match(/^\s*-\s+id:\s*(.+?)\s*$/);
    if (idMatch) {
      flush();
      current = { id: idMatch[1].replace(/^['"]|['"]$/g, ''), servesSteps: [] };
      continue;
    }
    if (!current) continue;
    const pathMatch = rawLine.match(/^\s+path:\s*(.+?)\s*$/);
    if (pathMatch) {
      current.path = pathMatch[1].replace(/^['"]|['"]$/g, '');
      continue;
    }
    const stepsMatch = rawLine.match(/^\s+serves-steps:\s*(.+?)\s*$/);
    if (stepsMatch) current.servesSteps = parseInlineNumberList(stepsMatch[1]);
  }
  flush();
  return entries;
}

function readCatalogDocument(id: string, catalog: Map<string, CatalogEntry>): string {
  const entry = catalog.get(id);
  if (!entry) throw new Error(`PROJECTMUSIC_UNKNOWN_DOCUMENT:${id}`);
  const guideRoot = path.resolve(resolveGuideRoot());
  const normalized = entry.path.replace(/\\/g, '/');
  const prefix = 'docs/m-guide/';
  const relativePath = normalized.startsWith(prefix) ? normalized.slice(prefix.length) : normalized;
  const absolutePath = path.resolve(guideRoot, relativePath);
  if (absolutePath !== guideRoot && !absolutePath.startsWith(`${guideRoot}${path.sep}`)) {
    throw new Error(`PROJECTMUSIC_DOCUMENT_OUTSIDE_ROOT:${id}`);
  }
  return fs.readFileSync(absolutePath, 'utf8').trim();
}

export function getCanonicalKnowledgeDocsByIds(ids: readonly string[]): string {
  const catalog = parseCatalog();
  const seen = new Set<string>();
  const blocks: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const content = readCatalogDocument(id, catalog);
    blocks.push(`--- DOCUMENT: ${id} ---\n${content}`);
  }
  return blocks.join('\n\n');
}

export function buildR3ComposerKnowledgePacket(
  styleId: string,
  composeDocRefs: readonly string[] = [],
): string {
  const catalog = parseCatalog();
  const ids: string[] = [...REQUIRED_R3_IDS];
  if (styleId) ids.push(styleId);

  for (const id of composeDocRefs) {
    if (!id || R3_EXCLUDED_IDS.has(id) || ids.includes(id)) continue;
    const entry = catalog.get(id);
    if (!entry || !entry.servesSteps.includes(3)) continue;
    ids.push(id);
  }

  return getCanonicalKnowledgeDocsByIds(ids);
}

export const R3_REQUIRED_KNOWLEDGE_IDS = REQUIRED_R3_IDS;
