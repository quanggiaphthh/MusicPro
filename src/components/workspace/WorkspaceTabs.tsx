import React, { useRef } from 'react';

export interface WorkspaceTab { id: string; label: string; disabled?: boolean; }
interface Props { tabs: WorkspaceTab[]; activeTab: string; onChange: (id: string) => void; }

export const WorkspaceTabs: React.FC<Props> = ({ tabs, activeTab, onChange }) => {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = tabs.filter(tab => !tab.disabled);
  const move = (direction: 1 | -1) => {
    const index = enabled.findIndex(tab => tab.id === activeTab);
    const next = enabled[(index + direction + enabled.length) % enabled.length];
    if (!next) return;
    onChange(next.id);
    requestAnimationFrame(() => refs.current[tabs.findIndex(tab => tab.id === next.id)]?.focus());
  };
  return (
    <div role="tablist" aria-label="Không gian làm việc bản nhạc" className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-1">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={element => { refs.current[index] = element; }}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`workspace-panel-${tab.id}`}
          disabled={tab.disabled}
          onClick={() => onChange(tab.id)}
          onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } }}
          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'} disabled:opacity-30`}
        >{tab.label}</button>
      ))}
    </div>
  );
};
