import type { MusicProjectSummary } from './types';

export type ProjectSort = 'updated-desc' | 'title-asc';

export interface ProjectListFilter {
  search: string;
  style: string | 'all';
  sort: ProjectSort;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('vi-VN');
}

export function filterAndSortProjects(
  projects: MusicProjectSummary[],
  filter: ProjectListFilter,
): MusicProjectSummary[] {
  const query = normalize(filter.search);
  const result = projects.filter(project => {
    if (filter.style !== 'all' && project.style !== filter.style) return false;
    if (!query) return true;
    return normalize(project.title).includes(query) || normalize(project.idea).includes(query);
  });

  return [...result].sort((a, b) => {
    if (filter.sort === 'title-asc') {
      const byTitle = a.title.localeCompare(b.title, 'vi-VN', { sensitivity: 'base' });
      return byTitle || b.updatedAt - a.updatedAt || a.id.localeCompare(b.id);
    }
    return b.updatedAt - a.updatedAt || a.title.localeCompare(b.title, 'vi-VN', { sensitivity: 'base' });
  });
}
