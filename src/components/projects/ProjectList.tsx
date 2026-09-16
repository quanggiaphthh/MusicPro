import React from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import type { MusicProjectSummary } from '../../projects/types';

interface ProjectListProps {
  projects: MusicProjectSummary[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onRename: (project: MusicProjectSummary) => void;
  onDuplicate: (id: string) => void;
  onDelete: (project: MusicProjectSummary) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, selectedId, onSelect, onRename, onDuplicate, onDelete }) => {
  if (projects.length === 0) {
    return <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">Không có dự án phù hợp.</div>;
  }
  return (
    <div className="space-y-2">
      {projects.map(project => (
        <div key={project.id} className={`rounded-xl border p-3 transition ${selectedId === project.id ? 'border-orange-500/60 bg-orange-500/10' : 'border-white/5 bg-black/40 hover:border-white/15'}`}>
          <button onClick={() => onSelect(project.id)} className="w-full text-left" aria-label={`Mở dự án ${project.title}`}>
            <div className="font-bold text-white line-clamp-2">{project.title}</div>
            <div className="mt-1 line-clamp-2 text-xs text-zinc-500">{project.idea || 'Không có mô tả'}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-zinc-500">
              <span className="rounded bg-white/5 px-2 py-1">{project.style}</span>
              <span>{project.revisionCount} phiên bản</span>
              <span>{new Date(project.updatedAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </button>
          <div className="mt-3 flex gap-1 border-t border-white/5 pt-2">
            <button onClick={() => onRename(project)} aria-label={`Đổi tên ${project.title}`} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => onDuplicate(project.id)} aria-label={`Nhân bản ${project.title}`} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><Copy className="h-4 w-4" /></button>
            <button onClick={() => onDelete(project)} aria-label={`Xóa ${project.title}`} className="ml-auto rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
};
