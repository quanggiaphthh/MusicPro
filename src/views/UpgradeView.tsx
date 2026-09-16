import React, { useEffect, useState } from 'react';
import { GitPullRequest, Settings2, Loader2, Check, X, FileSearch, ArrowRight } from 'lucide-react';
import { runsService, type CompositionRun } from '../services/runs';
import { knowledgeService } from '../services/knowledge';
import { upgradesService, type UpgradeSuggestion } from '../services/upgrades';
import { generateWithAI } from '../services/ai';
import { useToast } from '../hooks/useToast';

export const UpgradeView: React.FC = () => {
  const [upgrades, setUpgrades] = useState<UpgradeSuggestion[]>([]);
  const [runs, setRuns] = useState<CompositionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { addToast } = useToast();

  const [showNew, setShowNew] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [critique, setCritique] = useState('');
  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeSuggestion | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [loadedUpgrades, loadedRuns] = await Promise.all([
      upgradesService.getUpgrades(),
      runsService.getAllRuns()
    ]);
    setUpgrades(loadedUpgrades);
    setRuns(loadedRuns);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedRunId || !critique) return addToast('Vui lòng chọn một bản ghi và nhập phê bình');
    
    setAnalyzing(true);
    try {
      const run = runs.find(r => r.id === selectedRunId);
      const docs = await knowledgeService.getAllDocs();
      const docsContext = docs.map(d => `--- DOC ID: ${d.id} (${d.title}) [Category: ${d.category}] ---\n${d.content}`).join('\n\n');
      
      const systemInst = `You are the Improver Agent. Analyze the user's critique of a recent music generation run, and suggest an update to the Knowledge Base (docs/m-guide/) to prevent this issue in the future.
Context (Current Knowledge Base):
${docsContext}

Output ONLY valid JSON with no markdown formatting:
{
  "targetDocId": "id of the document to update (or a new ID if creating one)",
  "title": "title of the document",
  "category": "category of the document (e.g. core, knowledge, prompts)",
  "suggestion": "Brief explanation of what went wrong and how this update fixes it",
  "newContent": "The complete, updated markdown content for this document"
}`;
      
      const prompt = `Run Idea: ${run?.idea}\nRun Style: ${run?.style}\n\nUser Critique: ${critique}`;
      
      const res = await generateWithAI(prompt, systemInst);
      
      const jsonMatch = res.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI did not return valid JSON analysis");
      const parsed = JSON.parse(jsonMatch[0]);
 
      await upgradesService.saveUpgrade({
        runId: selectedRunId,
        critique,
        suggestion: parsed.suggestion,
        targetDocId: parsed.targetDocId,
        title: parsed.title,
        category: parsed.category,
        newContent: parsed.newContent,
        status: 'pending'
      });
      
      addToast('Đã phân tích xong. Đề xuất nâng cấp đã được tạo.');
      setShowNew(false);
      setCritique('');
      setSelectedRunId('');
      loadData();
    } catch (e: any) {
      addToast('Phân tích thất bại: ' + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMerge = async (upgrade: UpgradeSuggestion) => {
    try {
      await knowledgeService.saveDoc({
        id: upgrade.targetDocId,
        title: upgrade.title,
        category: upgrade.category,
        content: upgrade.newContent
      });
      await upgradesService.updateStatus(upgrade.id, 'merged');
      addToast('Đã hợp nhất tài liệu thành công');
      setSelectedUpgrade(null);
      loadData();
    } catch (e: any) {
      addToast('Hợp nhất thất bại: ' + e.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await upgradesService.updateStatus(id, 'rejected');
      addToast('Đã từ chối đề xuất');
      setSelectedUpgrade(null);
      loadData();
    } catch (e: any) {
      addToast('Từ chối thất bại: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <GitPullRequest className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Tự nâng cấp</h1>
            <p className="text-zinc-400">Tác nhân cải tiến - Phân tích lỗi & cập nhật kiến thức</p>
          </div>
        </div>
        <button 
          onClick={() => { setShowNew(true); setSelectedUpgrade(null); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <FileSearch className="w-4 h-4" />
          Phân tích mới
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* List */}
        <div className="w-full md:w-1/3 bg-white/5 border border-white/10 rounded-2xl overflow-y-auto p-4 space-y-2">
          {upgrades.length === 0 ? (
            <div className="text-center text-zinc-500 py-10">Chưa có đề xuất nâng cấp nào.</div>
          ) : (
            upgrades.map(up => (
              <button
                key={up.id}
                onClick={() => { setSelectedUpgrade(up); setShowNew(false); }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedUpgrade?.id === up.id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-black/50 border-white/5 hover:bg-white/5'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Mục tiêu: {up.targetDocId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${up.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : up.status === 'merged' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                    {up.status === 'pending' ? 'Chờ duyệt' : up.status === 'merged' ? 'Đã hợp nhất' : 'Đã từ chối'}
                  </span>
                </div>
                <div className="text-sm text-white line-clamp-2">{up.critique}</div>
              </button>
            ))
          )}
        </div>

        {/* Detail/New Analysis Pane */}
        <div className="w-full md:w-2/3 bg-black border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          {showNew ? (
            <div className="p-6 flex flex-col h-full gap-4">
              <h2 className="text-xl font-bold text-white mb-2">Kích hoạt Tác nhân cải tiến</h2>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Chọn một bản ghi</label>
                  <select 
                    value={selectedRunId}
                    onChange={(e) => setSelectedRunId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>Chọn một bản ghi sáng tác trước đó...</option>
                    {runs.map(r => (
                      <option key={r.id} value={r.id}>{r.idea || 'Bản ghi không tên'} ({r.style})</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Vấn đề là gì? (Phê bình)</label>
                  <textarea 
                    value={critique}
                    onChange={(e) => setCritique(e.target.value)}
                    placeholder="VD: Cấu trúc đàn piano quá dày ở tay trái, và nó không thực sự ra chất Bolero."
                    className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleAnalyze}
                  disabled={analyzing || !selectedRunId || !critique}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                >
                  {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings2 className="w-5 h-5" />}
                  Phân tích & Đề xuất nâng cấp
                </button>
              </div>
            </div>
          ) : selectedUpgrade ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-white/10 bg-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Yêu cầu hợp nhất: {selectedUpgrade.targetDocId}</h2>
                    <p className="text-sm text-zinc-400">{selectedUpgrade.title} ({selectedUpgrade.category})</p>
                  </div>
                  {selectedUpgrade.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleReject(selectedUpgrade.id)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleMerge(selectedUpgrade)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                        <Check className="w-4 h-4" />
                        Hợp nhất vào tài liệu
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="bg-black/50 rounded-xl p-4 border border-white/5">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Gợi ý từ AI</div>
                  <div className="text-sm text-white">{selectedUpgrade.suggestion}</div>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-auto">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Nội dung tài liệu đề xuất</div>
                <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300 whitespace-pre-wrap">
                  {selectedUpgrade.newContent}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <GitPullRequest className="w-16 h-16 mb-4 opacity-50" />
              <p>Chọn một đề xuất để xem chi tiết, hoặc bắt đầu phân tích mới.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
