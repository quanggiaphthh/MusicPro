import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { invalidateProductionCertification } from '../compose/production-certification';
import type { MusicProject, MusicProjectBundle, MusicProjectSummary, ProjectRepository, ScoreRevision } from './types';
import { duplicateProjectBundle } from './revision-utils';
import { chooseProjectForPersistence, mergeRevisionsForPersistence } from './persistence-merge';

interface MusicProDb extends DBSchema {
  projects: {
    key: string;
    value: MusicProject;
    indexes: { 'by-updatedAt': number; 'by-title': string };
  };
  revisions: {
    key: string;
    value: ScoreRevision;
    indexes: { 'by-projectId': string; 'by-createdAt': number };
  };
}

const DB_NAME = 'music-pro-v1';
const DB_VERSION = 1;

function newId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

let dbPromise: Promise<IDBPDatabase<MusicProDb>> | null = null;

function getDb(): Promise<IDBPDatabase<MusicProDb>> {
  if (!dbPromise) {
    dbPromise = openDB<MusicProDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          const projects = db.createObjectStore('projects', { keyPath: 'id' });
          projects.createIndex('by-updatedAt', 'updatedAt');
          projects.createIndex('by-title', 'title');
        }
        if (!db.objectStoreNames.contains('revisions')) {
          const revisions = db.createObjectStore('revisions', { keyPath: 'id' });
          revisions.createIndex('by-projectId', 'projectId');
          revisions.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

function summarize(project: MusicProject, revisions: ScoreRevision[]): MusicProjectSummary {
  return {
    id: project.id,
    title: project.title,
    idea: project.idea,
    style: project.style,
    updatedAt: project.updatedAt,
    activeRevisionId: project.activeRevisionId,
    revisionCount: revisions.length,
  };
}

async function fetchProjectRevisions(db: IDBPDatabase<MusicProDb>, projectId: string): Promise<ScoreRevision[]> {
  const revisions = await db.getAllFromIndex('revisions', 'by-projectId', projectId);
  return revisions.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export const localProjectRepository: ProjectRepository = {
  async listProjects(): Promise<MusicProjectSummary[]> {
    const db = await getDb();
    const projects = await db.getAll('projects');
    const summaries = await Promise.all(projects.map(async project => summarize(project, await fetchProjectRevisions(db, project.id))));
    return summaries.sort((a, b) => b.updatedAt - a.updatedAt || a.title.localeCompare(b.title));
  },

  async getProject(id: string): Promise<MusicProjectBundle | null> {
    const db = await getDb();
    const project = await db.get('projects', id);
    if (!project) return null;
    return { project, revisions: await fetchProjectRevisions(db, id) };
  },

  async saveProject(bundle: MusicProjectBundle): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(['projects', 'revisions'], 'readwrite');
    const projectsStore = tx.objectStore('projects');
    const revisionsStore = tx.objectStore('revisions');
    const storedProject = await projectsStore.get(bundle.project.id);
    const storedRevisions = await revisionsStore.index('by-projectId').getAll(bundle.project.id);
    await projectsStore.put(chooseProjectForPersistence(storedProject, bundle.project));
    for (const revision of mergeRevisionsForPersistence(storedRevisions, bundle.revisions)) {
      await revisionsStore.put(revision);
    }
    await tx.done;
  },

  async deleteProject(id: string): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(['projects', 'revisions'], 'readwrite');
    const revisionKeys = await tx.objectStore('revisions').index('by-projectId').getAllKeys(id);
    for (const key of revisionKeys) await tx.objectStore('revisions').delete(key);
    await tx.objectStore('projects').delete(id);
    await tx.done;
  },

  async duplicateProject(id: string): Promise<string> {
    const bundle = await this.getProject(id);
    if (!bundle) throw new Error(`Project not found: ${id}`);
    const projectId = newId('project');
    const now = Date.now();
    const revisionIdMap = new Map(bundle.revisions.map(revision => [revision.id, newId('revision')]));
    const duplicate = duplicateProjectBundle(bundle, {
      projectId,
      revisionIds: Object.fromEntries(revisionIdMap.entries()),
      createdAt: now,
    });
    duplicate.project.productionSnapshot = invalidateProductionCertification(duplicate.project.productionSnapshot);
    await this.saveProject(duplicate);
    return projectId;
  },
};
