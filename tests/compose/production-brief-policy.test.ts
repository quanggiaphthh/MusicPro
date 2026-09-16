import fs from 'node:fs';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const source=fs.readFileSync('server/music/gemini-music-brief.ts','utf8');
assert(source.includes('VAI TRÒ NHẠC CỤ'),'Gemini brief must include instrument roles');
assert(source.includes('Energy curve'),'Lyria/brief must include energy curve');
assert(source.includes('arrangement.roles'),'must consume role map');
console.log('PASS production-brief-policy');
