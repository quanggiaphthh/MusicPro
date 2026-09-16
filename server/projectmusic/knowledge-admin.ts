import fs from 'fs';
import path from 'path';
import {
  getCatalog,
  getForAi,
  getKnowledgeBaseDir,
  getKnowledgeDoc,
  type CatalogPage,
} from './knowledge';
import {
  categoryFromKnowledgePath,
  firstMarkdownHeading,
  resolveKnowledgePath,
} from './knowledge-admin-core';

export interface CanonicalKnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: number;
  source: 'canonical';
  path: string;
  tags: string[];
  servesSteps: number[];
  summary: string;
  readOnly: boolean;
}

export interface CanonicalKnowledgeCatalog {
  version: string;
  updated: string;
  documentCount: number;
  writable: boolean;
  documents: CanonicalKnowledgeDocument[];
}

const FOR_AI_ID = 'CORE.FOR-AI';
const CATALOG_ID = 'CORE.CATALOG';

export function isKnowledgeWriteEnabled(): boolean {
  return process.env.KNOWLEDGE_WRITE_ENABLED === 'true' || process.env.NODE_ENV !== 'production';
}

function relativeKnowledgePath(fullPath: string): string {
  const base = path.resolve(getKnowledgeBaseDir());
  const absolute = path.resolve(fullPath);
  const relative = path.relative(base, absolute).replace(/\\/g, '/');
  return `docs/m-guide/${relative}`;
}

function fileUpdatedAt(fullPath: string): number {
  try {
    return fs.statSync(fullPath).mtimeMs;
  } catch {
    return 0;
  }
}

function pageDocument(page: CatalogPage, includeContent: boolean): CanonicalKnowledgeDocument {
  const content = getKnowledgeDoc(page.path);
  const fullPath = resolveKnowledgePath(getKnowledgeBaseDir(), page.path);
  return {
    id: page.id,
    title: firstMarkdownHeading(content, page.summary || page.id),
    category: categoryFromKnowledgePath(page.path),
    content: includeContent ? content : '',
    updatedAt: fileUpdatedAt(fullPath),
    source: 'canonical',
    path: page.path,
    tags: [...page.tags],
    servesSteps: [...page['serves-steps']],
    summary: page.summary,
    readOnly: !isKnowledgeWriteEnabled(),
  };
}

function virtualForAi(includeContent: boolean): CanonicalKnowledgeDocument {
  const fullPath = resolveKnowledgePath(getKnowledgeBaseDir(), 'for-ai.md');
  const content = getForAi();
  return {
    id: FOR_AI_ID,
    title: firstMarkdownHeading(content, 'For AI — System Instructions'),
    category: 'core',
    content: includeContent ? content : '',
    updatedAt: fileUpdatedAt(fullPath),
    source: 'canonical',
    path: relativeKnowledgePath(fullPath),
    tags: ['meta', 'prompt', 'core'],
    servesSteps: [1, 2, 3, 4],
    summary: 'Chỉ thị hệ thống canonical được Composer nạp trực tiếp ở mọi lượt sáng tác.',
    readOnly: !isKnowledgeWriteEnabled(),
  };
}

function virtualCatalog(includeContent: boolean): CanonicalKnowledgeDocument {
  const fullPath = resolveKnowledgePath(getKnowledgeBaseDir(), 'catalog.yml');
  const content = fs.readFileSync(fullPath, 'utf8');
  return {
    id: CATALOG_ID,
    title: 'Catalog Index — Canonical',
    category: 'core',
    content: includeContent ? content : '',
    updatedAt: fileUpdatedAt(fullPath),
    source: 'canonical',
    path: relativeKnowledgePath(fullPath),
    tags: ['meta', 'catalog', 'core'],
    servesSteps: [1, 2, 3, 4],
    summary: 'Mục lục máy đọc được của toàn bộ docs/m-guide; chỉ đọc trong giao diện để tránh làm hỏng catalog.',
    readOnly: true,
  };
}

export function listCanonicalKnowledgeDocuments(includeContent = false): CanonicalKnowledgeDocument[] {
  const catalog = getCatalog();
  return [
    virtualCatalog(includeContent),
    virtualForAi(includeContent),
    ...catalog.pages.map(page => pageDocument(page, includeContent)),
  ];
}

export function getCanonicalKnowledgeCatalog(): CanonicalKnowledgeCatalog {
  const catalog = getCatalog();
  const documents = listCanonicalKnowledgeDocuments(false);
  return {
    version: catalog.version,
    updated: catalog.updated,
    documentCount: documents.length,
    writable: isKnowledgeWriteEnabled(),
    documents,
  };
}

export function getCanonicalKnowledgeDocument(id: string): CanonicalKnowledgeDocument | null {
  if (id === CATALOG_ID) return virtualCatalog(true);
  if (id === FOR_AI_ID) return virtualForAi(true);
  const page = getCatalog().pages.find(candidate => candidate.id === id);
  return page ? pageDocument(page, true) : null;
}

function targetForDocumentId(id: string): { fullPath: string; readOnly: boolean } | null {
  if (id === CATALOG_ID) {
    return { fullPath: resolveKnowledgePath(getKnowledgeBaseDir(), 'catalog.yml'), readOnly: true };
  }
  if (id === FOR_AI_ID) {
    return { fullPath: resolveKnowledgePath(getKnowledgeBaseDir(), 'for-ai.md'), readOnly: false };
  }
  const page = getCatalog().pages.find(candidate => candidate.id === id);
  if (!page) return null;
  return { fullPath: resolveKnowledgePath(getKnowledgeBaseDir(), page.path), readOnly: false };
}

export function saveCanonicalKnowledgeDocument(id: string, content: string): CanonicalKnowledgeDocument {
  if (!isKnowledgeWriteEnabled()) {
    throw Object.assign(new Error('Kho canonical đang ở chế độ chỉ đọc. Bật KNOWLEDGE_WRITE_ENABLED=true để cho phép sửa trong production.'), { code: 'KNOWLEDGE_READ_ONLY' });
  }
  const target = targetForDocumentId(id);
  if (!target) {
    throw Object.assign(new Error(`Không tìm thấy tài liệu canonical: ${id}`), { code: 'KNOWLEDGE_NOT_FOUND' });
  }
  if (target.readOnly) {
    throw Object.assign(new Error('Catalog Index là tài liệu chỉ đọc để bảo vệ cấu trúc kho tri thức.'), { code: 'KNOWLEDGE_READ_ONLY' });
  }
  if (typeof content !== 'string' || !content.trim()) {
    throw Object.assign(new Error('Nội dung tài liệu không được để trống.'), { code: 'INVALID_KNOWLEDGE_CONTENT' });
  }
  if (Buffer.byteLength(content, 'utf8') > 1_000_000) {
    throw Object.assign(new Error('Tài liệu vượt quá giới hạn 1 MB.'), { code: 'INVALID_KNOWLEDGE_CONTENT' });
  }

  const directory = path.dirname(target.fullPath);
  const tempPath = path.join(directory, `.${path.basename(target.fullPath)}.musicpro-${process.pid}-${Date.now()}.tmp`);
  try {
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, target.fullPath);
  } catch (error) {
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch { /* best effort */ }
    throw error;
  }

  const saved = getCanonicalKnowledgeDocument(id);
  if (!saved) throw new Error(`Không thể đọc lại tài liệu sau khi lưu: ${id}`);
  return saved;
}
