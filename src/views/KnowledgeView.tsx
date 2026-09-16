import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Tags,
} from 'lucide-react';
import { knowledgeService, type KnowledgeCatalog, type KnowledgeDoc } from '../services/knowledge';
import { useToast } from '../hooks/useToast';

const CATEGORY_LABELS: Record<string, string> = {
  core: 'CORE',
  meta: 'META',
  pipeline: 'PIPELINE',
  'prompt-craft': 'PROMPT CRAFT',
  guides: 'GUIDES',
  lyrics: 'LYRICS',
  melody: 'MELODY',
  harmony: 'HARMONY',
  'rhythm-form': 'RHYTHM & FORM',
  vocal: 'VOCAL',
  vietnamese: 'VIETNAMESE',
  arrangement: 'ARRANGEMENT',
  musicxml: 'MUSICXML',
  styles: 'STYLES',
  artifacts: 'ARTIFACTS',
};

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase('vi-VN').normalize('NFKC').trim();
}

function matchesDocument(doc: KnowledgeDoc, query: string, step: number | 'all', tag: string, category: string): boolean {
  if (step !== 'all' && !(doc.servesSteps || []).includes(step)) return false;
  if (tag !== 'all' && !(doc.tags || []).includes(tag)) return false;
  if (category !== 'all' && doc.category !== category) return false;
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  const haystack = normalizeSearch([
    doc.id,
    doc.title,
    doc.summary || '',
    doc.category,
    doc.path || '',
    ...(doc.tags || []),
  ].join(' '));
  return haystack.includes(normalizedQuery);
}

export const KnowledgeView: React.FC = () => {
  const [catalog, setCatalog] = useState<KnowledgeCatalog | null>(null);
  const [selected, setSelected] = useState<KnowledgeDoc | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [step, setStep] = useState<number | 'all'>('all');
  const [tag, setTag] = useState('all');
  const [category, setCategory] = useState('all');
  const { addToast } = useToast();

  const loadCatalog = async (preferredId?: string) => {
    setLoading(true);
    try {
      const nextCatalog = await knowledgeService.getCatalog();
      setCatalog(nextCatalog);
      const targetId = preferredId || selected?.id || 'CORE.FOR-AI';
      const exists = nextCatalog.documents.some(doc => doc.id === targetId);
      const fallbackId = nextCatalog.documents[0]?.id;
      if (exists || fallbackId) await loadDocument(exists ? targetId : fallbackId!);
    } catch (cause: any) {
      addToast(cause?.message || 'Không thể tải kho kiến thức canonical.');
    } finally {
      setLoading(false);
    }
  };

  const loadDocument = async (id: string) => {
    setLoadingDocument(true);
    try {
      const doc = await knowledgeService.getDocById(id);
      if (!doc) throw new Error(`Không tìm thấy tài liệu ${id}`);
      setSelected(doc);
      setDraftContent(doc.content || '');
    } catch (cause: any) {
      addToast(cause?.message || 'Không thể tải tài liệu.');
    } finally {
      setLoadingDocument(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  const categories = useMemo(() => {
    if (!catalog) return [];
    return [...new Set(catalog.documents.map(doc => doc.category))].sort();
  }, [catalog]);

  const tags = useMemo(() => {
    if (!catalog) return [];
    return [...new Set(catalog.documents.flatMap(doc => doc.tags || []))].sort();
  }, [catalog]);

  const filteredDocs = useMemo(() => {
    if (!catalog) return [];
    return catalog.documents.filter(doc => matchesDocument(doc, query, step, tag, category));
  }, [catalog, query, step, tag, category]);

  const groupedDocs = useMemo<Record<string, KnowledgeDoc[]>>(() => filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, KnowledgeDoc[]>), [filteredDocs]);
  const groupedEntries = Object.entries(groupedDocs) as Array<[string, KnowledgeDoc[]]>;

  const dirty = !!selected && draftContent !== selected.content;

  const handleSave = async () => {
    if (!selected || selected.readOnly || !dirty) return;
    setSaving(true);
    try {
      const saved = await knowledgeService.saveDoc({ ...selected, content: draftContent });
      setSelected(saved);
      setDraftContent(saved.content);
      setCatalog(current => current ? {
        ...current,
        documents: current.documents.map(doc => doc.id === saved.id ? { ...doc, ...saved, content: '' } : doc),
      } : current);
      addToast('Đã lưu vào kho canonical. Composer sẽ dùng nội dung mới ở lượt sáng tác tiếp theo.');
    } catch (cause: any) {
      addToast(cause?.message || 'Không thể lưu tài liệu canonical.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !catalog) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-[1500px] flex-col px-4 py-4 md:px-8 md:py-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">Kho kiến thức</h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Canonical
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Nguồn chuẩn duy nhất: <code className="text-zinc-300">docs/m-guide/</code>
              {catalog ? ` · catalog v${catalog.version} · ${catalog.documentCount} tài liệu` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => void loadCatalog(selected?.id)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Đồng bộ lại
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-[minmax(220px,1fr)_150px_180px_190px]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Tìm theo ID, tiêu đề, nội dung tóm tắt, tag..."
            className="w-full rounded-xl border border-white/10 bg-black px-10 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
          />
        </label>
        <select value={step} onChange={event => setStep(event.target.value === 'all' ? 'all' : Number(event.target.value))} className="rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white">
          <option value="all">Tất cả bước</option>
          <option value="1">Bước 1</option><option value="2">Bước 2</option><option value="3">Bước 3</option><option value="4">Bước 4</option>
        </select>
        <select value={category} onChange={event => setCategory(event.target.value)} className="rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white">
          <option value="all">Tất cả nhóm</option>
          {categories.map(value => <option key={value} value={value}>{CATEGORY_LABELS[value] || value}</option>)}
        </select>
        <select value={tag} onChange={event => setTag(event.target.value)} className="rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white">
          <option value="all">Tất cả tag</option>
          {tags.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="w-full shrink-0 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 lg:w-[390px]">
          <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/95 px-4 py-3 text-xs text-zinc-400 backdrop-blur">
            {filteredDocs.length}/{catalog?.documentCount || 0} tài liệu phù hợp
          </div>
          {groupedEntries.map(([group, docs]) => (
            <div key={group}>
              <div className="sticky top-10 z-[5] bg-zinc-900/95 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 backdrop-blur">
                {CATEGORY_LABELS[group] || group}
              </div>
              {docs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => void loadDocument(doc.id)}
                  className={`w-full border-b border-white/5 px-4 py-3 text-left transition-colors ${selected?.id === doc.id ? 'bg-emerald-500/10' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/80" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{doc.title}</div>
                      <div className="mt-1 truncate font-mono text-[10px] text-zinc-500">{doc.id}</div>
                      {!!doc.servesSteps?.length && <div className="mt-1 text-[10px] text-zinc-600">Bước {doc.servesSteps.join(', ')}</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
          {filteredDocs.length === 0 && <div className="p-8 text-center text-sm text-zinc-500">Không có tài liệu phù hợp bộ lọc.</div>}
        </div>

        <div className="flex min-h-[520px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-zinc-500">Chọn một tài liệu trong catalog.</div>
          ) : (
            <>
              <div className="border-b border-white/10 p-4 md:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-300">Canonical</span>
                      {selected.readOnly && <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-[10px] font-bold uppercase text-zinc-400"><Lock className="h-3 w-3" /> Chỉ đọc</span>}
                    </div>
                    <div className="mt-2 break-all font-mono text-xs text-zinc-500">{selected.id} · {selected.path}</div>
                    {selected.summary && <p className="mt-2 max-w-4xl text-sm text-zinc-400">{selected.summary}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(selected.tags || []).map(value => <span key={value} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-400"><Tags className="h-3 w-3" />{value}</span>)}
                      {(selected.servesSteps || []).map(value => <span key={value} className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[10px] text-indigo-300">Step {value}</span>)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {dirty && !selected.readOnly && <span className="text-xs text-amber-400">Chưa lưu</span>}
                    {!dirty && !selected.readOnly && <span className="inline-flex items-center gap-1 text-xs text-emerald-500"><CheckCircle2 className="h-3.5 w-3.5" /> Đồng bộ</span>}
                    <button
                      onClick={handleSave}
                      disabled={saving || selected.readOnly || !dirty}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu vào kho chuẩn
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative flex min-h-0 flex-1 flex-col p-4 md:p-5">
                {loadingDocument && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60"><Loader2 className="h-7 w-7 animate-spin text-emerald-500" /></div>}
                <textarea
                  value={draftContent}
                  readOnly={selected.readOnly}
                  onChange={event => setDraftContent(event.target.value)}
                  className="min-h-[420px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.03] p-4 font-mono text-sm leading-relaxed text-zinc-200 outline-none focus:border-emerald-500 read-only:cursor-default read-only:text-zinc-400"
                  aria-label={`Nội dung ${selected.title}`}
                />
                <div className="mt-3 text-xs text-zinc-600">
                  {selected.readOnly
                    ? 'Tài liệu này chỉ đọc. Catalog được khóa để tránh phá cấu trúc tải tri thức.'
                    : catalog?.writable
                      ? 'Lưu tại đây ghi trực tiếp vào đúng file canonical mà Composer đọc. Không còn kho seed/Firestore song song.'
                      : 'Môi trường production đang chỉ đọc. Bật KNOWLEDGE_WRITE_ENABLED=true nếu chủ động cho phép sửa canonical.'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
