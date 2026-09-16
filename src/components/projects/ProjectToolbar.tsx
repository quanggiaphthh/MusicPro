import React from 'react';
import { Search } from 'lucide-react';
import type { MusicProjectSummary } from '../../projects/types';
import type { ProjectSort } from '../../projects/project-list-utils';

interface ProjectToolbarProps {
  projects: MusicProjectSummary[];
  search: string;
  style: string;
  sort: ProjectSort;
  onSearchChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onSortChange: (value: ProjectSort) => void;
}

export const ProjectToolbar: React.FC<ProjectToolbarProps> = ({
  projects,
  search,
  style,
  sort,
  onSearchChange,
  onStyleChange,
  onSortChange,
}) => {
  const styles = Array.from(new Set(projects.map(project => project.style).filter(Boolean))).sort();
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_220px_180px]">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <span className="sr-only">Tìm dự án</span>
        <input
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Tìm theo tên hoặc ý tưởng…"
          className="w-full rounded-xl border border-white/10 bg-black py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-indigo-500"
        />
      </label>
      <label>
        <span className="sr-only">Lọc phong cách</span>
        <select
          value={style}
          onChange={event => onStyleChange(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white"
        >
          <option value="all">Tất cả phong cách</option>
          {styles.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">Sắp xếp dự án</span>
        <select
          value={sort}
          onChange={event => onSortChange(event.target.value as ProjectSort)}
          className="w-full rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white"
        >
          <option value="updated-desc">Mới cập nhật</option>
          <option value="title-asc">Tên A–Z</option>
        </select>
      </label>
    </div>
  );
};
