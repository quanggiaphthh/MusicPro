import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Copy, Headphones, Loader2, Music, Save, Settings2, Sparkles, WandSparkles } from 'lucide-react';
import { ResultWorkspace } from '../components/ResultWorkspace';
import { AutoComposeProgress } from '../components/compose/AutoComposeProgress';
import { runArrangementProduction } from '../compose/arrangement-production-run';
import { runCompositionProduction } from '../compose/composition-production-run';
import { bindProductionSnapshotToRevision, isProductionCertificationCurrent } from '../compose/production-certification';
import {
  cancelBackgroundAutoComposition,
  clearActiveBackgroundRunSession,
  getBackgroundAutoComposition,
  readActiveBackgroundRunSession,
  startBackgroundAutoComposition,
  writeActiveBackgroundRunId,
  writeActiveBackgroundRunProjectId,
  shouldClearBackgroundRunSession,
  type BackgroundRunSnapshot,
} from '../compose/background-auto-compose';
import { readEtaEstimate, recordEtaSample } from '../compose/eta-history';
import type { AutoComposeEvent, AutoCompositionContext, ProductionReadinessReport, QualityReport } from '../compose/types';
import { createAutosaveController, shouldWarnBeforeUnload, type AutosaveController } from '../projects/autosave';
import { projectService } from '../projects/project-service';
import { normalizeCompositionContext, withCompositionContext } from '../projects/arrangement-resume';
import { workspaceTargetForStep, type WorkspaceScoreTarget } from '../projects/composition-session';
import type { MusicProjectBundle, RevisionReason } from '../projects/types';
import { runsService } from '../services/runs';
import { settingsService } from '../services/settings';
import { productErrorText } from '../utils/product-errors';
import { formatLeadSheetFailureDiagnostics, readLeadSheetFailureDiagnostics, type LeadSheetFailureDiagnostics } from '../utils/lead-sheet-diagnostics';
import { useToast } from '../hooks/useToast';

type Step = 1 | 2 | 3 | 4;
type ComposeMode = 'auto' | 'manual';

function activeXml(bundle: MusicProjectBundle): string {
  return bundle.revisions.find(revision => revision.id === bundle.project.activeRevisionId)?.musicXml || '';
}

function compactAutoEventForUi(event: AutoComposeEvent): AutoComposeEvent {
  const { xml: _xml, songDna: _songDna, blueprint: _blueprint, context: _context, ...rest } = event;
  return rest;
}

export const ComposeView: React.FC = () => {
  const settings = settingsService.getSettings();
  const [composeMode, setComposeMode] = useState<'auto' | 'manual'>('auto');
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [idea, setIdea] = useState('');
  const [style, setStyle] = useState(settings.defaultStyleId);
  const [composePrompt, setComposePrompt] = useState('');
  const [arrangePrompt, setArrangePrompt] = useState('');
  const [leadSheetXml, setLeadSheetXml] = useState('');
  const [finalXml, setFinalXml] = useState('');
  const [composeDocRefs, setComposeDocRefs] = useState<string[]>([]);
  const [arrangeDocRefs, setArrangeDocRefs] = useState<string[]>([]);
  const [metaPlan, setMetaPlan] = useState('');
  const [planSummary, setPlanSummary] = useState('');
  const [songRequest, setSongRequest] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [projectBundle, setProjectBundle] = useState<MusicProjectBundle | undefined>();
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [blueprintData, setBlueprintData] = useState<any>(null);
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<{ lyriaEnabled: boolean; textModel: string } | null>(null);
  const [leadSheetDiagnostics, setLeadSheetDiagnostics] = useState<LeadSheetFailureDiagnostics | null>(null);
  const [autoEvents, setAutoEvents] = useState<AutoComposeEvent[]>([]);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoStartedAt, setAutoStartedAt] = useState<number>();
  const [autoReadiness, setAutoReadiness] = useState<ProductionReadinessReport>();
  const [autoEtaSeconds, setAutoEtaSeconds] = useState(()=>readEtaEstimate());
  const autoPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPollActiveRef = useRef(true);
  const activeBackgroundRunIdRef = useRef<string | undefined>();
  const activeBackgroundProjectIdRef = useRef<string | undefined>();
  const terminalHandledRunRef = useRef<string | undefined>();
  const autosaveRef = useRef<AutosaveController<MusicProjectBundle> | null>(null);

  if (!autosaveRef.current) {
    autosaveRef.current = createAutosaveController<MusicProjectBundle>({
      delayMs: 700,
      save: bundle => projectService.saveProject(bundle),
      onError: cause => { setSaveState('dirty'); addToast(productErrorText(cause, 'Không thể tự động lưu dự án.')); },
      onDirtyChange: dirty => setSaveState(dirty ? 'dirty' : 'saved'),
      onSavingChange: saving => { if (saving) setSaveState('saving'); },
    });
  }

  useEffect(() => {
    fetch('/api/music/capabilities').then(response => response.json()).then(setCapabilities).catch(() => setCapabilities(null));
  }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldWarnBeforeUnload(saveState, autosaveRef.current?.isDirty() === true)) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  const scheduleSave = (bundle: MusicProjectBundle) => {
    setProjectBundle(bundle);
    if (settingsService.getSettings().autoSave) autosaveRef.current?.schedule(bundle);
    else setSaveState('dirty');
  };

  const saveProjectNow = async () => {
    if (!projectBundle) return;
    setSaveState('saving');
    try {
      if (autosaveRef.current?.isDirty()) await autosaveRef.current.flush();
      else await projectService.saveProject(projectBundle);
      setSaveState('saved');
    } catch (cause) {
      setSaveState('dirty');
      addToast(productErrorText(cause, 'Không thể lưu thay đổi dự án.'));
    }
  };

  const resetOutputForNewRun = () => {
    setLeadSheetXml(''); setFinalXml(''); setProjectBundle(undefined); setBlueprintData(null);
    setLeadSheetDiagnostics(null); setAutoReadiness(undefined); setAutoEvents([]); setSaveState('saved');
    if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null);
  };

  const persistBeforeNewRun = async (): Promise<boolean> => {
    if (!projectBundle || (saveState === 'saved' && autosaveRef.current?.isDirty() !== true)) return true;
    setSaveState('saving');
    try {
      if (autosaveRef.current?.isDirty()) await autosaveRef.current.flush();
      else await projectService.saveProject(projectBundle);
      setSaveState('saved');
      return true;
    } catch (cause) {
      setSaveState('dirty');
      addToast(productErrorText(cause, 'Không thể lưu dự án hiện tại nên chưa bắt đầu lượt sáng tác mới.'));
      return false;
    }
  };

  const clearAutoPollTimer = () => {
    if (autoPollTimerRef.current !== null) clearTimeout(autoPollTimerRef.current);
    autoPollTimerRef.current = null;
  };

  const applyBackgroundContext = (context?: AutoCompositionContext) => {
    if (!context) return;
    setComposePrompt(context.composePrompt); setArrangePrompt(context.arrangePrompt);
    setComposeDocRefs(context.composeDocRefs); setArrangeDocRefs(context.arrangeDocRefs);
    setMetaPlan(context.metaPlan); setPlanSummary(context.planSummary); setSongRequest(context.songRequest);
  };

  const persistBackgroundArtifacts = async (snapshot: BackgroundRunSnapshot): Promise<MusicProjectBundle | undefined> => {
    const context = snapshot.result?.context || snapshot.checkpoints.context;
    const leadArtifact = snapshot.checkpoints.leadArtifact;
    const arrangementArtifact = snapshot.checkpoints.arrangementArtifact;
    const session = readActiveBackgroundRunSession();
    const boundProjectId = activeBackgroundProjectIdRef.current || session?.projectId;
    let bundle: MusicProjectBundle | undefined;

    if (boundProjectId) {
      try { bundle = await projectService.getProject(boundProjectId) || undefined; }
      catch { bundle = undefined; }
    }

    const leadXml = snapshot.result?.leadSheetXml || leadArtifact?.xml || '';
    const compositionQuality = snapshot.result?.compositionQuality || leadArtifact?.quality;
    if (!bundle && leadXml) {
      const label = compositionQuality?.status === 'PASS' ? 'Lead Sheet' : 'Lead Sheet cần rà soát';
      bundle = await projectService.createFromComposition({
        title: snapshot.input.idea.slice(0,100) || 'Bản nhạc Music-Pro',
        idea: snapshot.input.idea,
        style: snapshot.input.styleId,
        musicXml: leadXml,
        reason: 'compose',
        label,
      });
      activeBackgroundProjectIdRef.current = bundle.project.id;
      writeActiveBackgroundRunProjectId(bundle.project.id);
    }
    if (bundle && context) {
      bundle = withCompositionContext(bundle, normalizeCompositionContext(context));
      await projectService.saveProject(bundle);
    }

    const finalXmlCheckpoint = snapshot.result?.finalXml || arrangementArtifact?.xml || '';
    if (bundle && finalXmlCheckpoint && activeXml(bundle) !== finalXmlCheckpoint) {
      const readiness = snapshot.result?.readiness || arrangementArtifact?.readiness;
      bundle = await projectService.appendRevision(bundle, {
        musicXml: finalXmlCheckpoint,
        reason: 'arrange',
        label: readiness?.status === 'PASS' ? 'Bản phối' : 'Bản phối cần rà soát',
      });
    }

    const arrangementQuality = snapshot.result?.arrangementQuality || arrangementArtifact?.quality;
    const readiness = snapshot.result?.readiness || arrangementArtifact?.readiness;
    if (bundle && compositionQuality && arrangementQuality && readiness) {
      const snapshotData = bindProductionSnapshotToRevision({
        pipelineVersion:'auto-production-v1.4.1-local-bg-v1', qualityContractVersion:'production-quality-v1.4.1',
        sourceHead:'6608e1e2fa620fd71f3356e063bac862ede6fdc5',
        input:{idea:snapshot.input.idea,styleId:snapshot.input.styleId},
        compositionQuality, arrangementQuality, readiness,
        songDna:snapshot.result?.songDna || arrangementArtifact?.songDna,
        blueprint:snapshot.result?.blueprint || arrangementArtifact?.blueprint,
        identityLock:snapshot.result?.identityLock || arrangementArtifact?.identityLock,
        generatedAt:snapshot.completedAt || Date.now(),
      }, bundle.project.activeRevisionId);
      bundle = {...bundle, project:{...bundle.project, productionSnapshot:snapshotData, updatedAt:Date.now()}};
      await projectService.saveProject(bundle);
    }

    if (bundle) { setProjectBundle(bundle); setSaveState('saved'); }
    return bundle;
  };

  const applyBackgroundSnapshot = async (snapshot: BackgroundRunSnapshot) => {
    activeBackgroundRunIdRef.current = snapshot.id;
    setIdea(snapshot.input.idea); setStyle(snapshot.input.styleId);
    setAutoEvents(snapshot.events.map(compactAutoEventForUi));
    setAutoStartedAt(snapshot.startedAt || snapshot.createdAt);
    const context = snapshot.result?.context || snapshot.checkpoints.context;
    applyBackgroundContext(context);

    const leadArtifact = snapshot.checkpoints.leadArtifact;
    const arrangementArtifact = snapshot.checkpoints.arrangementArtifact;
    const leadXml = snapshot.result?.leadSheetXml || leadArtifact?.xml || '';
    const finalXmlValue = snapshot.result?.finalXml || arrangementArtifact?.xml || '';
    if (leadXml) setLeadSheetXml(leadXml);
    if (finalXmlValue) setFinalXml(finalXmlValue);
    const readiness = snapshot.result?.readiness || arrangementArtifact?.readiness;
    if (readiness) setAutoReadiness(readiness);

    let persistenceSucceeded = true;
    let persistedBundle: MusicProjectBundle | undefined;
    try { persistedBundle = await persistBackgroundArtifacts(snapshot); }
    catch (cause) {
      persistenceSucceeded = false;
      addToast(productErrorText(cause, 'Artifact đã được server giữ an toàn nhưng chưa lưu được dự án cục bộ. Refresh trang có thể thử lưu lại trong phiên server hiện tại.'));
    }

    const active = snapshot.status === 'queued' || snapshot.status === 'running';
    setAutoRunning(active);
    if (active) return;

    clearAutoPollTimer();
    const clearRecoveredSession = shouldClearBackgroundRunSession(snapshot, persistenceSucceeded);
    if (clearRecoveredSession) {
      clearActiveBackgroundRunSession();
      activeBackgroundRunIdRef.current = undefined;
    }
    if (terminalHandledRunRef.current === snapshot.id) return;
    terminalHandledRunRef.current = snapshot.id;

    if (snapshot.status === 'completed' && snapshot.result) {
      setStep(4);
      const elapsedSeconds = Math.max(1, ((snapshot.completedAt || Date.now()) - (snapshot.startedAt || snapshot.createdAt)) / 1000);
      setAutoEtaSeconds(recordEtaSample(elapsedSeconds));
      addToast(`Hoàn tất: ${snapshot.result.readiness.label}`);
      const persisted = persistenceSucceeded ? persistedBundle : await persistBackgroundArtifacts(snapshot).catch(()=>undefined);
      if (!clearRecoveredSession && persisted) {
        clearActiveBackgroundRunSession();
        activeBackgroundRunIdRef.current = undefined;
        persistenceSucceeded = true;
      }
      if (persisted && snapshot.result.readiness.status === 'PASS') {
        void runsService.saveRun({
          idea:snapshot.input.idea, style:snapshot.input.styleId, metaPrompt:snapshot.result.context.metaPlan,
          composePrompt:snapshot.result.context.composePrompt, arrangePrompt:snapshot.result.context.arrangePrompt,
          musicXml:snapshot.result.finalXml, leadMusicXml:snapshot.result.leadSheetXml, finalMusicXml:snapshot.result.finalXml,
          title:persisted.project.title, version:persisted.revisions.length, status:'completed',
        }, persisted.project.id).catch(()=>undefined);
      }
    } else if (snapshot.status === 'cancelled') {
      const last = snapshot.events.at(-1);
      const cancelled: AutoComposeEvent = { kind:'cancelled', step:last?.step||1, progress:last?.progress||0, label:'Đã dừng theo yêu cầu', detail:'Các artifact đã hoàn tất trước thời điểm dừng vẫn được giữ lại.', at:Date.now() };
      setAutoEvents(current => [...current, cancelled]);
      addToast('Đã dừng quy trình sáng tác.');
    } else if (snapshot.status === 'failed') {
      addToast(productErrorText(snapshot.error, snapshot.error?.message || 'Quy trình sáng tác tự động thất bại.'));
    }
    activeBackgroundProjectIdRef.current = undefined;
  };

  const pollBackgroundRun = async (runId: string) => {
    clearAutoPollTimer();
    if (!autoPollActiveRef.current) return;
    try {
      const snapshot = await getBackgroundAutoComposition(runId);
      if (!autoPollActiveRef.current) return;
      await applyBackgroundSnapshot(snapshot);
      if (!autoPollActiveRef.current) return;
      if (snapshot.status === 'queued' || snapshot.status === 'running') {
        autoPollTimerRef.current = setTimeout(() => { void pollBackgroundRun(runId); }, 1500);
      }
    } catch (cause: any) {
      if (!autoPollActiveRef.current) return;
      if (cause?.code === 'RUN_SESSION_LOST') {
        clearActiveBackgroundRunSession();
        activeBackgroundRunIdRef.current = undefined;
        setAutoRunning(false);
        addToast('Phiên chạy nền đã mất vì server local đã khởi động lại. Không tự tạo lại bài để tránh phát sinh generation trùng.');
      } else {
        autoPollTimerRef.current = setTimeout(() => { void pollBackgroundRun(runId); }, 2500);
      }
    }
  };

  useEffect(() => {
    autoPollActiveRef.current = true;
    const session = readActiveBackgroundRunSession();
    if (session?.runId) {
      activeBackgroundRunIdRef.current = session.runId;
      activeBackgroundProjectIdRef.current = session.projectId;
      setAutoRunning(true);
      setAutoEtaSeconds(readEtaEstimate());
      void pollBackgroundRun(session.runId);
    }
    return () => {
      autoPollActiveRef.current = false;
      clearAutoPollTimer();
    };
  }, []);

  const handleAutoCompose = async () => {
    if (!idea.trim()) return addToast('Vui lòng nhập ý tưởng');
    if (!(await persistBeforeNewRun())) return;
    resetOutputForNewRun();
    terminalHandledRunRef.current = undefined;
    const runStartedAt = Date.now();
    setAutoRunning(true); setAutoStartedAt(runStartedAt); setAutoEtaSeconds(readEtaEstimate());
    writeActiveBackgroundRunProjectId(undefined);
    try {
      const created = await startBackgroundAutoComposition({ idea, styleId: style, maxQualityRetries: 1 });
      activeBackgroundRunIdRef.current = created.runId;
      activeBackgroundProjectIdRef.current = undefined;
      await pollBackgroundRun(created.runId);
    } catch (cause: any) {
      const pending = readActiveBackgroundRunSession()?.runId;
      if (pending) {
        activeBackgroundRunIdRef.current = pending;
        activeBackgroundProjectIdRef.current = undefined;
        setAutoRunning(true);
        addToast('Kết nối lúc khởi tạo bị gián đoạn. Đang kiểm tra runId đã lưu để tránh tạo bài trùng.');
        void pollBackgroundRun(pending);
        return;
      }
      setAutoRunning(false);
      addToast(productErrorText(cause, cause?.message || 'Không thể bắt đầu quy trình sáng tác nền.'));
    }
  };

  const handleCancelAutoCompose = async () => {
    const runId = activeBackgroundRunIdRef.current || readActiveBackgroundRunSession()?.runId;
    if (!runId) return;
    try {
      const snapshot = await cancelBackgroundAutoComposition(runId);
      await applyBackgroundSnapshot(snapshot);
    } catch (cause: any) {
      addToast(productErrorText(cause, cause?.message || 'Không thể dừng quy trình sáng tác.'));
    }
  };

  const handleGenerateMetaPrompt = async () => {
    if (!idea.trim()) return addToast('Vui lòng nhập ý tưởng');
    setLoading(true);
    try {
      const response = await fetch('/api/compose/prepare', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({idea,styleId:style}) });
      const data = await response.json();
      if (!response.ok) { const error:any=new Error(data.error?.message||data.error||'Lỗi chuẩn bị sáng tác'); error.code=data.error?.code; throw error; }
      setComposePrompt(data.composePrompt); setArrangePrompt(data.arrangePrompt); setComposeDocRefs(data.composeDocRefs||[]); setArrangeDocRefs(data.arrangeDocRefs||[]); setMetaPlan(data.metaPlan||''); setPlanSummary(data.planSummary||''); setSongRequest(data.songRequest); setStep(2);
      addToast('Đã hoàn thành bước Hiểu ý tưởng');
    } catch(cause:any) { addToast(productErrorText(cause,cause?.message||'Không thể chuẩn bị phương án sáng tác')); }
    finally { setLoading(false); }
  };

  const handleGenerateLeadSheet = async () => {
    setLoading(true);
    try {
      setLeadSheetDiagnostics(null); setAutoReadiness(undefined);
      const result=await runCompositionProduction({composePrompt,composeDocRefs,metaPlan,songRequest,styleId:style,idea},{maxQualityRetries:1});
      const xml=result.leadSheetXml;setLeadSheetXml(xml);setFinalXml('');setBlueprintData(null);if(audioUrl)URL.revokeObjectURL(audioUrl);setAudioUrl(null);
      const label=result.compositionQuality.status==='PASS'?'Lead Sheet':'Lead Sheet cần rà soát';
      const bundle=projectBundle?await projectService.appendRevision(projectBundle,{musicXml:xml,reason:'compose',label}):await projectService.createFromComposition({title:idea.slice(0,100)||'Bản nhạc Music-Pro',idea,style,musicXml:xml,reason:'compose',label});
      const context=normalizeCompositionContext({metaPlan,composePrompt,arrangePrompt,composeDocRefs,arrangeDocRefs,planSummary,songRequest});const bundleWithContext=withCompositionContext(bundle,context);await projectService.saveProject(bundleWithContext);setProjectBundle(bundleWithContext);setSaveState('saved');
      if(result.compositionQuality.status==='PASS'){setStep(4);addToast(`Lead Sheet đạt Composition Quality Gate · ${result.compositionQuality.score}/100`);}
      else addToast(`Đã lưu Lead Sheet cần rà soát · ${result.compositionQuality.score}/100. Chưa cho phép production hóa sang Bước 4.`);
    }catch(cause:any){const diagnostics=cause?.diagnostics||readLeadSheetFailureDiagnostics(cause);if(diagnostics)setLeadSheetDiagnostics(diagnostics);addToast(productErrorText(cause,`Tạo bản nhạc thất bại: ${cause?.message||'Lỗi không xác định'}`));}finally{setLoading(false);}
  };

  const saveCloudCompatibility = async (xml:string,bundle:MusicProjectBundle) => { try { const id=await runsService.saveRun({idea,style,metaPrompt:metaPlan,composePrompt,arrangePrompt,musicXml:xml,leadMusicXml:leadSheetXml,finalMusicXml:xml,title:bundle.project.title,version:bundle.revisions.length,status:'completed'},bundle.project.id);if(id)addToast('Đã đồng bộ bản phối vào Lịch sử đám mây.'); } catch { addToast('Không đồng bộ được đám mây. Bản lưu cục bộ vẫn an toàn.'); } };

  const handleGenerateArrangement = async () => {
    if(!leadSheetXml)return addToast('Cần tạo Bản nhạc trước khi phối khí.');
    setLoading(true);
    try{
      const result=await runArrangementProduction({
        leadSheetXml,
        arrangePrompt,
        arrangeDocRefs,
        songRequest,
        styleId:style,
        idea,
      },{maxQualityRetries:1});
      setFinalXml(result.finalXml);setBlueprintData(null);if(audioUrl)URL.revokeObjectURL(audioUrl);setAudioUrl(null);
      let bundle=projectBundle;
      const label=result.readiness.status==='PASS'?'Bản phối':'Bản phối cần rà soát';
      if(bundle)bundle=await projectService.appendRevision(bundle,{musicXml:result.finalXml,reason:'arrange',label});
      else {
        bundle=await projectService.createFromComposition({title:idea.slice(0,100)||'Bản nhạc Music-Pro',idea,style,musicXml:leadSheetXml,reason:'compose',label:'Lead Sheet'});
        bundle=withCompositionContext(bundle,normalizeCompositionContext({metaPlan,composePrompt,arrangePrompt,composeDocRefs,arrangeDocRefs,planSummary,songRequest}));
        await projectService.saveProject(bundle);
        bundle=await projectService.appendRevision(bundle,{musicXml:result.finalXml,reason:'arrange',label});
      }
      const snapshot=bindProductionSnapshotToRevision({
        pipelineVersion:'manual-arrangement-v1.4.1',qualityContractVersion:'production-quality-v1.4.1',
        sourceHead:'6608e1e2fa620fd71f3356e063bac862ede6fdc5',input:{idea,styleId:style},
        compositionQuality:result.compositionQuality,arrangementQuality:result.arrangementQuality,readiness:result.readiness,
        songDna:result.songDna,blueprint:result.blueprint,identityLock:result.identityLock,generatedAt:Date.now(),
      },bundle.project.activeRevisionId);
      bundle={...bundle,project:{...bundle.project,productionSnapshot:snapshot,updatedAt:Date.now()}};
      await projectService.saveProject(bundle);setProjectBundle(bundle);setSaveState('saved');
      setAutoReadiness(result.readiness);
      addToast(result.readiness.status==='PASS'?'Đã phối khí · READY FOR PRODUCTION':'Đã lưu bản phối cần rà soát; chưa đạt Production Readiness.');
      if(result.readiness.status==='PASS')void saveCloudCompatibility(result.finalXml,bundle);
    }catch(cause:any){addToast(productErrorText(cause,`Phối khí thất bại: ${cause?.message||'Lỗi không xác định'}`));}finally{setLoading(false);}
  };

  const handleWorkspaceXml = async (nextXml:string,reason:RevisionReason|undefined,label:string|undefined,target:WorkspaceScoreTarget) => {
    if(target==='final')setFinalXml(nextXml);else setLeadSheetXml(nextXml);setBlueprintData(null);setAutoReadiness(undefined);if(audioUrl)URL.revokeObjectURL(audioUrl);setAudioUrl(null);
    if(reason&&projectBundle){try{const next=await projectService.appendRevision(projectBundle,{musicXml:nextXml,reason,label,promoteToLead:target==='lead'});setProjectBundle(next);setSaveState('saved');}catch(cause){addToast(productErrorText(cause,'Bản chỉnh sửa đang hiển thị nhưng chưa lưu được phiên bản.'));}}
  };

  const handleProjectChange = (bundle:MusicProjectBundle) => { scheduleSave(bundle);setAutoReadiness(isProductionCertificationCurrent(bundle.project.productionSnapshot,bundle.project.activeRevisionId)?bundle.project.productionSnapshot?.readiness:undefined);const xml=activeXml(bundle);const leadRevision=bundle.project.leadRevisionId?bundle.revisions.find(item=>item.id===bundle.project.leadRevisionId):undefined;if(bundle.project.activeRevisionId===bundle.project.leadRevisionId){setLeadSheetXml(xml);setFinalXml('');}else{if(leadRevision)setLeadSheetXml(leadRevision.musicXml);setFinalXml(xml);} };

  const productionCertificationCurrent=Boolean(projectBundle&&isProductionCertificationCurrent(projectBundle.project.productionSnapshot,projectBundle.project.activeRevisionId));
  const handleGenerateBlueprint = async () => { if(!finalXml)return;if(!productionCertificationCurrent)return addToast('Production certification không còn hiệu lực cho phiên bản đang mở. Hãy chạy lại quality gate/phối khí trước Studio Version.');setGeneratingBlueprint(true);try{const response=await fetch('/api/music/blueprint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({musicXml:finalXml,style,idea})});const data=await response.json();if(!response.ok)throw new Error(data.error?.message||'Không thể tạo thông tin bản thu.');setBlueprintData(data);addToast('Đã phân tích thông tin bản thu AI');}catch(cause:any){addToast(productErrorText(cause,cause?.message));}finally{setGeneratingBlueprint(false);} };
  const handleGenerateAudio = async () => { if(!finalXml)return;if(!productionCertificationCurrent)return addToast('Phiên bản hiện tại chưa có Production Readiness PASS hợp lệ.');setGeneratingAudio(true);try{const response=await fetch('/api/music/generate-audio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({musicXml:finalXml,style,idea})});const data=await response.json();if(!response.ok){const e:any=new Error(data.error?.message||'Lỗi tạo audio');e.code=data.error?.code;throw e;}const binary=atob(data.audioBase64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);if(audioUrl)URL.revokeObjectURL(audioUrl);setAudioUrl(URL.createObjectURL(new Blob([bytes],{type:data.mimeType||'audio/mpeg'})));addToast('Tạo bản thu AI thành công!');}catch(cause:any){addToast(productErrorText(cause,cause?.message));}finally{setGeneratingAudio(false);} };

  const studioVersion = finalXml && (productionCertificationCurrent?<div className="border-t border-white/10 pt-6"><h3 className="text-lg font-bold flex items-center gap-2"><Headphones className="w-5 h-5 text-indigo-400"/>Studio Version — bản thu AI tùy chọn</h3><p className="text-sm text-zinc-400 mt-1 mb-4">Final MusicXML vẫn là master composition; bản thu AI là lớp trình diễn downstream.</p>{!blueprintData?<button onClick={handleGenerateBlueprint} disabled={generatingBlueprint} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/20 text-emerald-300 px-5 py-3 font-bold">{generatingBlueprint?<Loader2 className="w-4 h-4 animate-spin"/>:<Sparkles className="w-4 h-4"/>}Tạo thông tin bản thu</button>:<div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"><div className="text-sm text-zinc-300">Model text: {capabilities?.textModel||'server default'}</div><div className="flex flex-wrap gap-2"><button onClick={()=>{void navigator.clipboard.writeText(blueprintData.geminiBrief||'');addToast('Đã sao chép Music Brief');}} className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm"><Copy className="w-4 h-4"/>Sao chép Music Brief</button><button onClick={handleGenerateAudio} disabled={generatingAudio||!capabilities?.lyriaEnabled} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold disabled:opacity-40">{generatingAudio?'Đang tạo…':'Tạo bản thu AI'}</button></div>{audioUrl&&<audio controls src={audioUrl} className="w-full"/>}</div>}</div>:<div className="border-t border-white/10 pt-6"><div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200"><div className="font-bold">Studio Version đang khóa</div><p className="mt-1 text-xs text-amber-100/80">Production certification của phiên bản đang mở chưa PASS hoặc đã STALE sau chỉnh sửa/khôi phục. Final MusicXML vẫn được giữ nguyên để nghe, chỉnh sửa và chạy lại quality gate.</p></div></div>);

  return <div className="px-4 md:px-8 py-4 md:py-6 max-w-7xl mx-auto h-full flex flex-col">
    <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><Sparkles className="w-6 h-6"/></div><div><h1 className="text-3xl font-bold">Sáng tác</h1><p className="text-zinc-400">Một quy trình tự động · 4 bước · Final MusicXML là master composition</p></div></div><div className="flex rounded-xl border border-white/10 bg-black/30 p-1"><button type="button" onClick={()=>setComposeMode('auto')} disabled={autoRunning} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${composeMode==='auto'?'bg-indigo-600 text-white':'text-zinc-500'}`}><WandSparkles className="h-4 w-4"/>Tự động</button><button type="button" onClick={()=>setComposeMode('manual')} disabled={autoRunning} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${composeMode==='manual'?'bg-zinc-700 text-white':'text-zinc-500'}`}><Settings2 className="h-4 w-4"/>Từng bước</button></div></div>

    {composeMode==='auto' ? <div className="flex-1 min-h-0 space-y-4 overflow-auto pb-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6"><div className="grid gap-4 lg:grid-cols-[260px_1fr_auto] lg:items-end"><label className="text-sm text-zinc-400">Phong cách<select value={style} disabled={autoRunning} onChange={e=>setStyle(e.target.value)} className="mt-2 w-full bg-black border border-white/10 rounded-xl p-3 text-white"><option value="STYLE.VN.VPOP-BALLAD">V-Pop Ballad</option><option value="STYLE.VN.BOLERO-TRU-TINH">Bolero / Trữ tình</option><option value="STYLE.VN.DAN-CA-CONTEMPORARY">Dân ca đương đại</option><option value="STYLE.VN.ACOUSTIC-INDIE">Acoustic Indie</option><option value="STYLE.VN.HEROIC-MARCH">Hành khúc</option></select></label><label className="text-sm text-zinc-400">Ý tưởng / Chủ đề<textarea value={idea} disabled={autoRunning} onChange={e=>setIdea(e.target.value)} className="mt-2 min-h-28 w-full resize-y bg-black border border-white/10 rounded-xl p-4 text-white disabled:opacity-60" placeholder="Ví dụ: Một V-Pop Ballad về người trưởng thành trở về quê, nhớ mối tình đầu bên dòng sông cũ…"/></label><div className="flex gap-2"><button onClick={()=>void handleAutoCompose()} disabled={autoRunning||!idea.trim()} className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white disabled:opacity-40">{autoRunning?<Loader2 className="h-5 w-5 animate-spin"/>:<WandSparkles className="h-5 w-5"/>}{autoRunning?'Đang tạo…':'Tạo bài hát'}</button>{autoRunning&&<button onClick={()=>void handleCancelAutoCompose()} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-400">Dừng</button>}</div></div><p className="mt-3 text-xs text-zinc-600">Hệ thống tự chạy Bước 1 → 4 trên server local, kiểm tra quality gate và tự retry có giới hạn; có thể chuyển menu hoặc refresh trong cùng phiên server, chỉ nút “Dừng” mới hủy. Chuyển sang “Từng bước” nếu cần can thiệp prompt thủ công.</p></div>
      <AutoComposeProgress events={autoEvents} running={autoRunning} startedAt={autoStartedAt} readiness={autoReadiness} estimatedTotalSeconds={autoEtaSeconds}/>
      {(leadSheetXml||finalXml)&&<div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6"><ResultWorkspace xmlContent={finalXml||leadSheetXml} title={idea||'Music-Pro'} subtitle={finalXml?(productionCertificationCurrent?'Bản phối hoàn chỉnh · Production-ready composition':'Bản phối hiện tại · Production certification STALE/REVIEW'):'Lead Sheet hiện tại'} filenameBase={idea||'music-pro-song'} projectBundle={projectBundle} saveState={saveState} onSaveProject={()=>void saveProjectNow()} onProjectChange={handleProjectChange} onChangeXml={(xml,reason,label)=>void handleWorkspaceXml(xml,reason,label,workspaceTargetForStep(4,Boolean(finalXml)))}/>{studioVersion}</div>}
    </div> : <div className="flex-1 min-h-0 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col">
      <div className="mb-4 flex items-center justify-between"><p className="text-xs text-zinc-500">Chế độ nâng cao: chạy và duyệt từng bước.</p><div className="hidden md:flex items-center gap-2">{[1,2,3,4].map(n=><React.Fragment key={n}><div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step>=n?'bg-indigo-600 border-indigo-600':'border-zinc-700 text-zinc-500'}`}>{n}</div>{n<4&&<div className={`w-8 h-0.5 ${step>n?'bg-indigo-600':'bg-zinc-800'}`}/>}</React.Fragment>)}</div></div>
      {step===1&&<div className="space-y-6 flex-1 flex flex-col"><h2 className="text-xl font-bold">Bước 1: Hiểu ý tưởng</h2><label className="text-sm text-zinc-400">Phong cách<select value={style} onChange={e=>setStyle(e.target.value)} className="mt-2 w-full bg-black border border-white/10 rounded-xl p-3 text-white"><option value="STYLE.VN.VPOP-BALLAD">V-Pop Ballad</option><option value="STYLE.VN.BOLERO-TRU-TINH">Bolero / Trữ tình</option><option value="STYLE.VN.DAN-CA-CONTEMPORARY">Dân ca đương đại</option><option value="STYLE.VN.ACOUSTIC-INDIE">Acoustic Indie</option><option value="STYLE.VN.HEROIC-MARCH">Hành khúc</option></select></label><label className="flex-1 flex flex-col text-sm text-zinc-400">Ý tưởng / Chủ đề<textarea value={idea} onChange={e=>setIdea(e.target.value)} className="mt-2 flex-1 min-h-56 bg-black border border-white/10 rounded-xl p-4 text-white" placeholder="VD: Một bài hát về nỗi nhớ quê hương…"/></label><div className="flex justify-end"><button onClick={handleGenerateMetaPrompt} disabled={loading} className="inline-flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-xl font-bold disabled:opacity-50">{loading?<Loader2 className="w-5 h-5 animate-spin"/>:<Sparkles className="w-5 h-5"/>}Hiểu ý tưởng</button></div></div>}
      {step===2&&<div className="space-y-5 flex-1 overflow-auto"><div className="flex justify-between"><h2 className="text-xl font-bold">Bước 2: Phương án sáng tác</h2><button onClick={()=>setShowAdvanced(v=>!v)} className="text-xs text-zinc-500">{showAdvanced?'Ẩn nâng cao':'Chế độ nâng cao'}</button></div><div className="rounded-xl bg-black/30 border border-white/5 p-6"><h3 className="text-xs font-bold text-indigo-400 uppercase mb-3">Tóm tắt phương án</h3><p className="whitespace-pre-wrap">{planSummary}</p></div>{showAdvanced&&<div className="grid md:grid-cols-2 gap-4"><textarea value={composePrompt} onChange={e=>setComposePrompt(e.target.value)} className="h-40 bg-black rounded-xl p-3 text-xs font-mono"/><textarea value={arrangePrompt} onChange={e=>setArrangePrompt(e.target.value)} className="h-40 bg-black rounded-xl p-3 text-xs font-mono"/></div>}<div className="flex justify-between"><button onClick={()=>setStep(1)} className="px-5 py-3 text-zinc-400">Quay lại</button><button onClick={()=>setStep(3)} className="inline-flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-xl font-bold">Tiếp tục<ArrowRight className="w-5 h-5"/></button></div></div>}
      {step===3&&<div className="space-y-5 flex-1 min-h-0 flex flex-col"><h2 className="text-xl font-bold">Bước 3: Bản nhạc</h2>{leadSheetDiagnostics&&<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><div className="flex items-center justify-between gap-3 mb-2"><div className="font-bold text-amber-300">Chẩn đoán lỗi Lead Sheet</div><button onClick={()=>void navigator.clipboard.writeText(formatLeadSheetFailureDiagnostics(leadSheetDiagnostics))} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Sao chép JSON</button></div><pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto text-xs text-amber-100">{formatLeadSheetFailureDiagnostics(leadSheetDiagnostics)}</pre></div>}{leadSheetXml?<ResultWorkspace xmlContent={leadSheetXml} title={idea||'Lead Sheet'} projectBundle={projectBundle} saveState={saveState} onSaveProject={()=>void saveProjectNow()} onProjectChange={handleProjectChange} onChangeXml={(xml,reason,label)=>void handleWorkspaceXml(xml,reason,label,workspaceTargetForStep(3,Boolean(finalXml)))}/>:<div className="flex-1 flex items-center justify-center rounded-xl border border-white/10 bg-black text-zinc-600"><Music className="w-12 h-12"/></div>}<div className="flex justify-between"><button onClick={()=>setStep(2)} className="px-5 py-3 text-zinc-400">Quay lại</button><button onClick={handleGenerateLeadSheet} disabled={loading} className="inline-flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-xl font-bold disabled:opacity-50">{loading?<Loader2 className="w-5 h-5 animate-spin"/>:<Sparkles className="w-5 h-5"/>}{leadSheetXml?'Tạo lại bản nhạc':'Bắt đầu sáng tác'}</button></div></div>}
      {step===4&&<div className="space-y-5 flex-1 min-h-0 flex flex-col overflow-auto"><h2 className="text-xl font-bold">Bước 4: Phối khí</h2>{(finalXml||leadSheetXml)?<ResultWorkspace xmlContent={finalXml||leadSheetXml} title={idea||'Music-Pro'} subtitle={finalXml?'Bản phối hoàn chỉnh':'Lead Sheet hiện tại'} filenameBase={idea||'music-pro-song'} projectBundle={projectBundle} saveState={saveState} onSaveProject={()=>void saveProjectNow()} onProjectChange={handleProjectChange} onChangeXml={(xml,reason,label)=>void handleWorkspaceXml(xml,reason,label,workspaceTargetForStep(4,Boolean(finalXml)))}/>:<div className="min-h-80 flex items-center justify-center text-zinc-600"><Music className="w-12 h-12"/></div>}<div className="flex justify-between"><button onClick={()=>setStep(3)} className="px-5 py-3 text-zinc-400">Quay lại</button><button onClick={handleGenerateArrangement} disabled={loading||!leadSheetXml} className="inline-flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-xl font-bold disabled:opacity-50">{loading?<Loader2 className="w-5 h-5 animate-spin"/>:<Save className="w-5 h-5"/>}{finalXml?'Tạo lại bản phối':'Phối khí'}</button></div>{studioVersion}</div>}
    </div>}
  </div>;
};
