import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve(process.cwd(), 'server/music/composer.ts');
if (!fs.existsSync(target)) {
  console.error(`Target not found: ${target}`);
  process.exit(2);
}

let source = fs.readFileSync(target, 'utf8');

const legacyBlock = `        temperature: 0.2,\n        maxOutputTokens: 8192,`;
const leadBlock = `        temperature: 0.2,\n        thinkingConfig: { thinkingLevel: 'minimal' },\n        maxOutputTokens: 32768,`;
const arrangementBlock = `        temperature: 0.2,\n        thinkingConfig: { thinkingLevel: 'minimal' },\n        maxOutputTokens: 65536,`;

const alreadyLead = source.includes(leadBlock);
const alreadyArrangement = source.includes(arrangementBlock);
if (alreadyLead && alreadyArrangement) {
  console.log('MusicXML output-budget hotfix already applied.');
  process.exit(0);
}

if (alreadyLead !== alreadyArrangement) {
  console.error('Partial hotfix detected. Refusing to modify composer.ts automatically.');
  process.exit(3);
}

const occurrences = source.split(legacyBlock).length - 1;
if (occurrences !== 2) {
  console.error(`Expected exactly 2 legacy MusicXML generation blocks, found ${occurrences}. Refusing to patch.`);
  process.exit(4);
}

source = source.replace(legacyBlock, leadBlock);
source = source.replace(legacyBlock, arrangementBlock);

fs.writeFileSync(target, source, 'utf8');
console.log('Applied MusicXML output-budget hotfix: lead=32768, arrangement=65536, thinking=minimal.');
