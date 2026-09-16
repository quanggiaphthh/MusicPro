import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileMusic, Loader2, Sparkles } from 'lucide-react';
import { createDefaultMix } from '../audio/mix-state';
import { setPartMidiProgram } from '../music/musicxml-edit';
import { parseMusicXMLToTimeline } from '../music/score-timeline';
import type { ScorePlaybackVisualState } from '../music/score-playback-visuals';
import type { MixState, MusicProjectBundle, RevisionReason } from '../projects/types';
import { MusicXMLViewer } from './MusicXMLViewer';
import { ScorePlayer } from './ScorePlayer';
import { WorkspaceTabs } from './workspace/WorkspaceTabs';
import { EditPanel } from './workspace/EditPanel';
import { MixerPanel } from './workspace/MixerPanel';
import { RevisionsPanel } from './workspace/RevisionsPanel';
import { ExportPanel } from './workspace/ExportPanel';
import { SectionRevisionPanel } from './workspace/SectionRevisionPanel';

interface ResultWorkspaceProps {
  xmlContent: string;
  title: string;
  subtitle?: string;
  filenameBase?: string;
  className?: string;
  projectBundle?: MusicProjectBundle;
  onProjectChange?: (bundle: MusicProjectBundle) => void;
  onChangeXml?: (nextXml: string, reason?: RevisionReason, label?: string) => void;
  readOnly?: boolean;
  saveState?: 'saved' | 'saving' | 'dirty';
  onSaveProject?: () => void;
  onArrange?: () => void;
  arranging?: boolean;
}

type TabId = 'score' | 'edit' | 'mixer' | 'versions' | 'section' | 'export';

export const ResultWorkspace: React.FC<ResultWorkspaceProps> = ({
  xmlContent, title, subtitle, filenameBase, className = '', projectBundle, onProjectChange, onChangeXml, readOnly = false, saveState, onSaveProject, onArrange, arranging = false,
}) => {
  const [playbackVisual, setPlaybackVisual] = useState<ScorePlaybackVisualState | undefined>();
  const [recenterToken, setRecenterToken] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('score');
  const timeline = useMemo(() => { try { return parseMusicXMLToTimeline(xmlContent); } catch { return null; } }, [xmlContent]);
  const [ephemeralMix, setEphemeralMix] = useState<MixState>(() => timeline ? createDefaultMix(timeline) : { parts: {}, masterGain: 1, reverb: .12, normalizeExport: true });
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const initialXml = useRef(xmlContent);
  const lastInternalXml = useRef<string | null>(null);
  const identity = `${projectBundle?.project.id || 'raw'}:${projectBundle?.project.activeRevisionId || title}`;
  const previousIdentity = useRef(identity);
  const [, forceHistory] = useState(0);

  useEffect(() => {
    if (previousIdentity.current !== identity && lastInternalXml.current !== xmlContent) {
      previousIdentity.current = identity;
      initialXml.current = xmlContent;
      undoStack.current = [];
      redoStack.current = [];
      forceHistory(value => value + 1);
    }
    if (lastInternalXml.current === xmlContent) lastInternalXml.current = null;
  }, [identity, xmlContent]);

  useEffect(() => {
    if (timeline && !projectBundle) setEphemeralMix(createDefaultMix(timeline));
  }, [projectBundle, timeline?.parts.map(part => `${part.partId}:${part.midiProgram || 0}`).join('|')]);

  const mix = projectBundle?.project.mix || ephemeralMix;
  const pushHistory = (nextXml: string, reason?: RevisionReason, label?: string) => {
    if (nextXml === xmlContent || readOnly || !onChangeXml) return;
    undoStack.current.push(xmlContent);
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
    lastInternalXml.current = nextXml;
    onChangeXml(nextXml, reason, label);
    forceHistory(value => value + 1);
  };
  const undo = () => {
    const previous = undoStack.current.pop(); if (!previous || !onChangeXml) return;
    redoStack.current.push(xmlContent); lastInternalXml.current = previous; onChangeXml(previous, 'edit', 'Hoàn tác'); forceHistory(value => value + 1);
  };
  const redo = () => {
    const next = redoStack.current.pop(); if (!next || !onChangeXml) return;
    undoStack.current.push(xmlContent); lastInternalXml.current = next; onChangeXml(next, 'edit', 'Làm lại'); forceHistory(value => value + 1);
  };
  const reset = () => { if (initialXml.current !== xmlContent) pushHistory(initialXml.current, 'edit', 'Khôi phục đầu phiên'); };

  const updateMix = (nextMix: MixState) => {
    if (readOnly) return;
    if (projectBundle && onProjectChange) onProjectChange({ ...projectBundle, project: { ...projectBundle.project, mix: nextMix, updatedAt: Date.now() } });
    else setEphemeralMix(nextMix);
  };

  const applyInstrument = (partId: string, midiProgram: number) => {
    pushHistory(setPartMidiProgram(xmlContent, partId, midiProgram), 'edit', `Đổi nhạc cụ ${partId}`);
  };

  const tabs = [
    { id: 'score', label: 'Bản nhạc' },
    { id: 'edit', label: 'Chỉnh sửa', disabled: readOnly || !onChangeXml },
    { id: 'mixer', label: 'Mixer', disabled: !timeline },
    { id: 'versions', label: 'Phiên bản', disabled: !projectBundle },
    { id: 'section', label: 'AI theo đoạn', disabled: readOnly || !projectBundle || !onChangeXml },
    { id: 'export', label: 'Xuất file' },
  ];

  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500"><FileMusic className="h-4 w-4" /><span>{subtitle || 'Bản nhạc Music-Pro'}</span></div>
        <div className="flex items-center gap-2">{onArrange && <button onClick={onArrange} disabled={arranging || readOnly} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{arranging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{arranging ? 'Đang phối khí…' : 'Phối khí'}</button>}<span aria-live="polite" className={`rounded-full px-2 py-1 text-[10px] font-bold ${!projectBundle || saveState === 'dirty' ? 'bg-amber-500/10 text-amber-300' : saveState === 'saving' ? 'bg-blue-500/10 text-blue-300' : 'bg-emerald-500/10 text-emerald-300'}`}>{!projectBundle ? 'Chưa lưu thành dự án' : saveState === 'saving' ? 'Đang lưu…' : saveState === 'dirty' ? 'Chưa lưu' : 'Đã lưu'}</span>{projectBundle && saveState === 'dirty' && onSaveProject && <button onClick={onSaveProject} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-200">Lưu ngay</button>}</div>
      </div>
      <WorkspaceTabs tabs={tabs} activeTab={activeTab} onChange={id => setActiveTab(id as TabId)} />

      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === 'score' && (
          <div id="workspace-panel-score" role="tabpanel" className="flex min-h-0 flex-col gap-3">
            <ScorePlayer
              xmlContent={xmlContent}
              title={title}
              filenameBase={filenameBase}
              onPlaybackVisualChange={setPlaybackVisual}
              onRequestRecenter={() => setRecenterToken(value => value + 1)}
              mix={mix}
            />
            <MusicXMLViewer
              xmlContent={xmlContent}
              playback={playbackVisual}
              recenterToken={recenterToken}
            />
          </div>
        )}
        {activeTab === 'edit' && <EditPanel xmlContent={xmlContent} onApply={(next, label) => pushHistory(next, 'edit', label)} onUndo={undo} onRedo={redo} onReset={reset} canUndo={undoStack.current.length > 0} canRedo={redoStack.current.length > 0} readOnly={readOnly} />}
        {activeTab === 'mixer' && timeline && <MixerPanel timeline={timeline} mix={mix} onChange={updateMix} onApplyInstrument={applyInstrument} readOnly={readOnly} />}
        {activeTab === 'versions' && <RevisionsPanel bundle={projectBundle} onChange={onProjectChange} readOnly={readOnly} />}
        {activeTab === 'section' && <SectionRevisionPanel xmlContent={xmlContent} styleId={projectBundle?.project.style || 'STYLE.VN.VPOP-BALLAD'} onApply={(next, label) => pushHistory(next, 'section-ai', label)} readOnly={readOnly} />}
        {activeTab === 'export' && <ExportPanel xmlContent={xmlContent} title={title} filenameBase={filenameBase} mix={mix} bundle={projectBundle} />}
      </div>
    </div>
  );
};
