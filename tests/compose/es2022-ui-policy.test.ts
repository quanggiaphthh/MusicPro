import fs from 'node:fs';
const source=fs.readFileSync('src/components/compose/AutoComposeProgress.tsx','utf8');
if(source.includes('.findLast'))throw new Error('ES2022 target must not use Array.findLast');
console.log('PASS es2022-ui-policy');
