import React, { useEffect, useMemo, useState } from 'react';
import { Archive, CloudDownload, FileMusic, Loader2, RefreshCw } from 'lucide-react';
import { ProjectList } from '../components/projects/ProjectList';
import { ProjectToolbar } from '../components/projects/ProjectToolbar';
import { ResultWorkspace } from '../components/ResultWorkspace';
import { runArrangementProduction } from '../compose/arrangement-production-run';
import { bindProductionSnapshotToRevision } from '../compose/production-certification';
import { db } from '../lib/firebase';
import { filterAndSortProjects, type ProjectSort } from '../projects/project-list-utils';
import { getArrangementLeadRevision, hasArrangementContext, isArrangementSourceRevision, normalizeCompositionContext, withCompositionContext } from '../projects/arrangement-resume';
import { projectService } from '../projects/project-service';
import { activeRevision } from '../projects/revision-utils';
import type { MusicProjectBundle, MusicProjectSummary, RevisionReason } from '../projects/types';
import { runsService, type CompositionRun } from '../services/runs';
import { productErrorText } from '../utils/product-errors';

export const RunsView: React.FC = () => {
  const [projects, setProjects] = useState<MusicProjectSummary[]>([]);
  const [selected, setSelected] = useState<MusicProjectBundle | null>(null);
  const [legacyRuns, setLegacyRuns] = useState<CompositionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [style, setStyle] = useState('all');
  const [sort, setSort] = useState<ProjectSort>('updated-desc');
  const [arranging, setArranging] = useState(false);

  const visibleProjects = useMemo(
    () => filterAndSortProjects(projects, { search, style, sort }),
    [projects, search, style, sort],
  );

  const loadProjects = async (preferredId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await projectService.listProjects();
      setProjects(list);
      const targetId = preferredId || selected?.project.id || list[0]?.id;
      setSelected(targetId ? await projectService.getProject(targetId) : null);
      if (db) setLegacyRuns(await runsService.getAllRuns());
      else setLegacyRuns([]);
    } catch (cause) {
      setError(productErrorText(cause, 'LOCAL_STORAGE_FAILED'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProjects(); }, []);

  const openProject = async (id: string) => {
    setError(null);
    try { setSelected(await projectService.getProject(id)); }
    catch (cause) { setError(productErrorText(cause, 'LOCAL_STORAGE_FAILED')); }
  };

  const saveBundle = async (bundle: MusicProjectBundle) => {
    setSelected(bundle);
    try {
      await projectService.saveProject(bundle);
      setProjects(await projectService.listProjects());
    } catch (cause) {
      setError(productErrorText(cause, 'LOCAL_STORAGE_FAILED'));
    }
  };

  const arrangeSelectedProject = async () => {
    if (!selected) return;
    setArranging(true);
    setError(null);
    try {
      const leadRevision = getArrangementLeadRevision(selected);
      if (!leadRevision) throw new Error('Không tìm thấy Lead Sheet của dự án.');

      let workingBundle = selected;
      let context = workingBundle.project.compositionContext;
      if (!hasArrangementContext(context)) {
        const prepareResponse = await fetch('/api/compose/prepare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea: workingBundle.project.idea, styleId: workingBundle.project.style }),
        });
        const prepareData = await prepareResponse.json();
        if (!prepareResponse.ok) {
          const message = prepareData?.error?.message || prepareData?.error || 'Không thể khôi phục phương án sáng tác.';
          throw new Error(message);
        }
        context = normalizeCompositionContext(prepareData);
        workingBundle = withCompositionContext(workingBundle, context);
        await saveBundle(workingBundle);
      }

      // PROJECT_ARRANGEMENT_PRODUCTION_V1_4_1
      const result = await runArrangementProduction({
        leadSheetXml: leadRevision.musicXml,
        arrangePrompt: context.arrangePrompt,
        arrangeDocRefs: context.arrangeDocRefs,
        songRequest: context.songRequest,
        styleId: workingBundle.project.style,
        idea: workingBundle.project.idea,
      }, { maxQualityRetries: 1 });

      const label = result.readiness.status === 'PASS' ? 'Bản phối' : 'Bản phối cần rà soát';
      let next = await projectService.appendRevision(workingBundle, {
        musicXml: result.finalXml,
        reason: 'arrange',
        label,
      });
      const snapshot = bindProductionSnapshotToRevision({
        pipelineVersion: 'project-arrangement-v1.4.1',
        qualityContractVersion: 'production-quality-v1.4.1',
        sourceHead: '6608e1e2fa620fd71f3356e063bac862ede6fdc5',
        input: { idea: workingBundle.project.idea, styleId: workingBundle.project.style },
        compositionQuality: result.compositionQuality,
        arrangementQuality: result.arrangementQuality,
        readiness: result.readiness,
        songDna: result.songDna,
        blueprint: result.blueprint,
        identityLock: result.identityLock,
        generatedAt: Date.now(),
      }, next.project.activeRevisionId);
      next = {
        ...next,
        project: {
          ...next.project,
          productionSnapshot: snapshot,
          updatedAt: Date.now(),
        },
      };
      await saveBundle(next);
    } catch (cause) {
      setError(productErrorText(cause, 'Phối khí thất bại. Lead Sheet hiện tại vẫn được giữ nguyên.'));
    } finally {
      setArranging(false);
    }
  };

  const renameProject = async (project: MusicProjectSummary) => {
    const nextTitle = window.prompt('Tên dự án mới', project.title)?.trim();
    if (!nextTitle || nextTitle === project.title) return;
    const bundle = await projectService.getProject(project.id);
    if (!bundle) return;
    await saveBundle({ ...bundle, project: { ...bundle.project, title: nextTitle, updatedAt: Date.now() } });
  };

  const duplicateProject = async (id: string) => {
    try {
      const newId = await projectService.duplicateProject(id);
      await loadProjects(newId);
    } catch (cause) { setError(productErrorText(cause, 'LOCAL_STORAGE_FAILED')); }
  };

  const deleteProject = async (project: MusicProjectSummary) => {
    if (!window.confirm(`Xóa dự án “${project.title}”? Hành động này xóa các phiên bản cục bộ của dự án.`)) return;
    try {
      await projectService.deleteProject(project.id);
      setSelected(current => current?.project.id === project.id ? null : current);
      await loadProjects();
    } catch (cause) { setError(productErrorText(cause, 'LOCAL_STORAGE_FAILED')); }
  };

  const importLegacy = async (run: CompositionRun) => {
    try {
      const bundle = await projectService.importLegacyRun(run);
      await loadProjects(bundle.project.id);
    } catch (cause) { setError(productErrorText(cause, 'LOCAL_STORAGE_FAILED')); }
  };

  if (loading && projects.length === 0) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  const revision = selected ? activeRevision(selected) : undefined;
  const canArrange = Boolean(selected && isArrangementSourceRevision(selected, revision?.id));

  return (
    <div className="mx-auto flex h-full max-w-[1500px] flex-col px-4 py-4 md:px-8 md:py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400"><Archive className="h-6 w-6" /></div>
          <div><h1 className="text-2xl font-bold md:text-3xl">Dự án / Lịch sử</h1><p className="text-sm text-zinc-400">Dự án được lưu cục bộ, hoạt động cả khi không có Firebase.</p></div>
        </div>
        <button onClick={() => void loadProjects()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10"><RefreshCw className="h-4 w-4" /> Làm mới</button>
      </div>

      {error && <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <ProjectToolbar projects={projects} search={search} style={style} sort={sort} onSearchChange={setSearch} onStyleChange={setStyle} onSortChange={setSort} />

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <aside className="w-full shrink-0 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3 lg:w-[340px]">
          <ProjectList projects={visibleProjects} selectedId={selected?.project.id} onSelect={id => void openProject(id)} onRename={project => void renameProject(project)} onDuplicate={id => void duplicateProject(id)} onDelete={project => void deleteProject(project)} />

          {db && legacyRuns.length > 0 && (
            <details className="mt-5 border-t border-white/10 pt-4">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-zinc-500">Bản ghi Firebase cũ ({legacyRuns.length})</summary>
              <div className="mt-3 space-y-2">
                {legacyRuns.map(run => (
                  <div key={run.id} className="rounded-lg border border-white/5 bg-black/40 p-3">
                    <div className="line-clamp-2 text-sm font-medium text-white">{run.title || run.idea || 'Không tiêu đề'}</div>
                    <div className="mt-2 flex items-center justify-between gap-2"><span className="text-[10px] text-zinc-500">{run.style}</span><button onClick={() => void importLegacy(run)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 px-2 py-1 text-xs font-bold text-indigo-300"><CloudDownload className="h-3.5 w-3.5" /> Nhập vào dự án</button></div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </aside>

        <main className="min-h-[480px] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black p-3 md:p-4">
          {selected && revision ? (
            <ResultWorkspace
              xmlContent={revision.musicXml}
              title={selected.project.title}
              subtitle={`Phiên bản đang mở — ${revision.label}`}
              filenameBase={selected.project.title}
              projectBundle={selected}
              onProjectChange={bundle => void saveBundle(bundle)}
              onArrange={canArrange ? () => void arrangeSelectedProject() : undefined}
              arranging={arranging}
              onChangeXml={async (nextXml, reason: RevisionReason = 'edit', label = 'Chỉnh sửa') => {
                try {
                  const next = await projectService.appendRevision(selected, { musicXml: nextXml, reason, label });
                  await saveBundle(next);
                } catch (cause) { setError(productErrorText(cause, 'LOCAL_STORAGE_FAILED')); }
              }}
            />
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center text-zinc-500"><FileMusic className="mb-4 h-16 w-16 opacity-40" /><p>Chọn một dự án để nghe, chỉnh sửa, quản lý phiên bản và xuất file.</p></div>
          )}
        </main>
      </div>
    </div>
  );
};
