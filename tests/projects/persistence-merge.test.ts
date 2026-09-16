import { mergeRevisionsForPersistence, chooseProjectForPersistence } from '../../src/projects/persistence-merge';
import type { MusicProject, ScoreRevision } from '../../src/projects/types';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const r1: ScoreRevision = { id:'r1',projectId:'p1',label:'One',reason:'compose',musicXml:'1',createdAt:1 };
const r2: ScoreRevision = { id:'r2',projectId:'p1',parentRevisionId:'r1',label:'Two',reason:'edit',musicXml:'2',createdAt:2 };
const r3: ScoreRevision = { id:'r3',projectId:'p1',parentRevisionId:'r2',label:'Three',reason:'edit',musicXml:'3',createdAt:3 };
const merged = mergeRevisionsForPersistence([r1,r2,r3],[r1,r2]);
assert(merged.map(r=>r.id).join(',') === 'r1,r2,r3', 'stale snapshot must never delete a stored revision');
const project = (updatedAt:number, activeRevisionId:string): MusicProject => ({id:'p1',title:'Song',idea:'',style:'x',createdAt:1,updatedAt,activeRevisionId,mix:{parts:{},masterGain:1,reverb:0,normalizeExport:true},tags:[]});
assert(chooseProjectForPersistence(project(3,'r3'),project(2,'r2')).activeRevisionId === 'r3', 'newer stored project pointer must win over stale autosave');
assert(chooseProjectForPersistence(project(2,'r2'),project(4,'r4')).activeRevisionId === 'r4', 'newer incoming project must be persisted');
console.log('PERSISTENCE MERGE TESTS PASSED');
