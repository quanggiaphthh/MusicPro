import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

export interface CatalogPage {
  id: string;
  path: string;
  tags: string[];
  'serves-steps': number[];
  summary: string;
}

export interface Catalog {
  version: string;
  updated: string;
  pages: CatalogPage[];
}

const resolveKnowledgeDir = () => {
  const envDir = process.env.PROJECTMUSIC_DIR;
  if (envDir && fs.existsSync(path.join(envDir, 'catalog.yml'))) return envDir;
  const possiblePaths = [path.join(process.cwd(),'docs/m-guide'), path.join(process.cwd(),'dist/docs/m-guide')];
  for (const p of possiblePaths) if (fs.existsSync(path.join(p,'catalog.yml'))) return p;
  return path.join(process.cwd(),'docs/m-guide');
};

const BASE_DIR = resolveKnowledgeDir();
export function getKnowledgeBaseDir(): string { return BASE_DIR; }

export function getCatalog(): Catalog {
  const catalogPath = path.join(BASE_DIR,'catalog.yml');
  if (!fs.existsSync(catalogPath)) throw new Error(`Catalog not found at ${catalogPath}. Check docs/m-guide presence.`);
  return yaml.load(fs.readFileSync(catalogPath,'utf8')) as Catalog;
}

export function getForAi(): string {
  const p=path.join(BASE_DIR,'for-ai.md');
  return fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
}

export function getKnowledgeDoc(docPath:string):string {
  const normalizedPath=path.normalize(docPath).replace(/^(\.\.(\/|\\|$))+/,'');
  const relativePath=normalizedPath.startsWith('docs/m-guide/')?normalizedPath.replace('docs/m-guide/',''):normalizedPath;
  const fullPath=path.join(BASE_DIR,relativePath);
  if(!fs.existsSync(fullPath))throw new Error(`Knowledge document not found: ${fullPath}`);
  return fs.readFileSync(fullPath,'utf8');
}

const STEP3_MANDATORY = [
  'KNOW.MUSICXML.RULES',
  'KNOW.MUSICXML.SAFE-PATTERNS',
  'KNOW.MELODY.COMPOSITION-PLANNING',
  'KNOW.MELODY.INVENTION',
  'KNOW.MELODY.ANTI-PATTERNS',
  'KNOW.MELODY.QUALITY-GATE',
  'KNOW.LYRICS.LYRIC-MELODY-FIT',
  'KNOW.VI.TONE-MELODY',
  'KNOW.VI.SYLLABLE-PRIORITY',
  'KNOW.HARMONY.PIANO-REDUCTION',
];

const STEP4_MANDATORY = [
  'KNOW.MUSICXML.RULES',
  'KNOW.MUSICXML.SAFE-PATTERNS',
  'KNOW.MUSICXML.IMPORTER-PROFILE',
  'KNOW.HARMONY.PIANO-REDUCTION',
  'KNOW.ARR.SECTION-ENERGY',
  'KNOW.ARR.DYNAMICS-STRUCTURE',
];

export function getCoreDocsForStep(step:number):string {
  const catalog=getCatalog();
  const coreIds=['META.STANDARDS','PIPE.OVERVIEW',`PIPE.STEP-0${step}`];
  if(step===3)coreIds.push(...STEP3_MANDATORY);
  if(step===4)coreIds.push(...STEP4_MANDATORY);
  const docs:string[]=[];
  for(const id of [...new Set(coreIds)]) {
    const page=catalog.pages.find(p=>p.id===id);
    if(!page)continue;
    try{docs.push(`--- DOCUMENT: ${page.id} ---\n${getKnowledgeDoc(page.path)}`);}catch(e){console.warn(`Failed to load core doc ${id}:`,e);}
  }
  return docs.join('\n\n');
}

export function getDocsByRefs(docRefs:string[],step?:number):string {
  const catalog=getCatalog(); const docs:string[]=[];
  for(const id of [...new Set(docRefs)]) {
    const page=catalog.pages.find(p=>p.id===id);
    if(!page){console.warn(`Skipping unknown doc ID: ${id}`);continue;}
    if(step&&!page['serves-steps'].includes(step)){console.warn(`Skipping doc ${id} for step ${step}: does not serve this step.`);continue;}
    try{docs.push(`--- DOCUMENT: ${page.id} ---\n${getKnowledgeDoc(page.path)}`);}catch(e){console.warn(`Failed to load referenced doc ${id}:`,e);}
  }
  return docs.join('\n\n');
}

export function getCatalogCandidates(step:number) {
  const catalog=getCatalog();
  return catalog.pages
    .filter(p=>p['serves-steps'].some(s=>s===3||s===4))
    .map(p=>({id:p.id,tags:p.tags,servesSteps:p['serves-steps'],summary:p.summary}));
}

export interface StyleInfo { id:string; displayName:string; content:string; }
export function getStyleInfo(styleId:string):StyleInfo|null {
  const catalog=getCatalog();
  const page=catalog.pages.find(p=>p.id===styleId&&p.tags.includes('style'));
  if(!page)return null;
  const content=getKnowledgeDoc(page.path);
  let displayName=styleId;
  const match=content.match(/^#\s+(?:Thẻ|Style|Card):\s*(.+)$/m);
  if(match)displayName=match[1].trim(); else displayName=page.summary.split(':')[0].trim();
  return {id:styleId,displayName,content};
}
export function getStyleCard(styleId:string):string|null { const info=getStyleInfo(styleId); return info?info.content:null; }
export function getDocsForStep(step:number,docRefs:string[]=[]):string { return `${getCoreDocsForStep(step)}\n\n${getDocsByRefs(docRefs,step)}`; }
