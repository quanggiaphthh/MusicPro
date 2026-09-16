import { filterAndSortProjects } from '../../src/projects/project-list-utils';
import type { MusicProjectSummary } from '../../src/projects/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const projects: MusicProjectSummary[] = [
  { id: '1', title: 'Bầu trời xanh', idea: 'Ballad quê hương', style: 'STYLE.VN.VPOP-BALLAD', updatedAt: 20, activeRevisionId: 'r1', revisionCount: 2 },
  { id: '2', title: 'Ánh trăng', idea: 'Hành khúc mạnh mẽ', style: 'STYLE.VN.HEROIC-MARCH', updatedAt: 30, activeRevisionId: 'r2', revisionCount: 1 },
  { id: '3', title: 'Mùa thu', idea: 'Ballad tình yêu', style: 'STYLE.VN.VPOP-BALLAD', updatedAt: 10, activeRevisionId: 'r3', revisionCount: 4 },
];

const searched = filterAndSortProjects(projects, { search: 'ballad', style: 'all', sort: 'updated-desc' });
assert(searched.map(p => p.id).join(',') === '1,3', 'search must match idea case-insensitively and sort newest first');

const filtered = filterAndSortProjects(projects, { search: '', style: 'STYLE.VN.VPOP-BALLAD', sort: 'title-asc' });
assert(filtered.map(p => p.id).join(',') === '1,3', 'style filter and Vietnamese title sort must be deterministic');

const titleSearch = filterAndSortProjects(projects, { search: 'TRĂNG', style: 'all', sort: 'updated-desc' });
assert(titleSearch.length === 1 && titleSearch[0].id === '2', 'search must be case-insensitive for Vietnamese text');

console.log('PROJECT LIST UTILS TESTS PASSED');
