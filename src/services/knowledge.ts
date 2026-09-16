import type { KnowledgeCatalog, KnowledgeDoc } from '../types';
export type { KnowledgeCatalog, KnowledgeDoc } from '../types';

async function parseApiResponse<T>(response: Response): Promise<T> {
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const message = payload?.error?.message || payload?.error || `Knowledge API failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export const knowledgeService = {
  async getCatalog(): Promise<KnowledgeCatalog> {
    const response = await fetch('/api/knowledge/catalog');
    return parseApiResponse<KnowledgeCatalog>(response);
  },

  async getAllDocs(): Promise<KnowledgeDoc[]> {
    const response = await fetch('/api/knowledge/all');
    const payload = await parseApiResponse<{ documents: KnowledgeDoc[] }>(response);
    return payload.documents;
  },

  async getDocById(id: string): Promise<KnowledgeDoc | null> {
    const response = await fetch(`/api/knowledge/document/${encodeURIComponent(id)}`);
    if (response.status === 404) return null;
    return parseApiResponse<KnowledgeDoc>(response);
  },

  async saveDoc(docData: Omit<KnowledgeDoc, 'updatedAt'>): Promise<KnowledgeDoc> {
    const response = await fetch(`/api/knowledge/document/${encodeURIComponent(docData.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: docData.content }),
    });
    return parseApiResponse<KnowledgeDoc>(response);
  },

  async deleteDoc(_id: string): Promise<void> {
    throw new Error('Kho canonical không hỗ trợ xóa tài liệu từ giao diện. Hãy cập nhật catalog trong repository nếu cần thay đổi cấu trúc.');
  },

  async seedInitialDocsIfEmpty(): Promise<void> {
    // No-op. docs/m-guide is the canonical source; placeholder seed documents are intentionally disabled.
  },
};
