import fs from 'node:fs';
const source=fs.readFileSync('src/views/ComposeView.tsx','utf8');
const start=source.indexOf('const handleGenerateArrangement');
const end=source.indexOf('const handleWorkspaceXml',start);
const block=source.slice(start,end);
if(!block.includes("reason:'compose',label:'Lead Sheet'"))throw new Error('manual arrangement fallback must create/preserve Lead Sheet revision before final arrangement when projectBundle is missing');
if(!block.includes("reason:'arrange',label"))throw new Error('manual arrangement must append final arrangement after lead preservation');
console.log('PASS manual-arrangement-fallback-policy');
