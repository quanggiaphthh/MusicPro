import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, '../../tools/apply-musicxml-output-budget-hotfix.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'musicpro-output-budget-'));
const targetDir = path.join(tmp, 'server/music');
fs.mkdirSync(targetDir, { recursive: true });
const target = path.join(targetDir, 'composer.ts');

const legacy = `export async function generateLeadSheet() {\n  return generate({ config: {\n        temperature: 0.2,\n        maxOutputTokens: 8192,\n  }});\n}\n\nexport async function generateArrangement() {\n  return generate({ config: {\n        temperature: 0.2,\n        maxOutputTokens: 8192,\n  }});\n}\n`;
fs.writeFileSync(target, legacy);

const first = execFileSync(process.execPath, [script], { cwd: tmp, encoding: 'utf8' });
assert.match(first, /Applied MusicXML output-budget hotfix/);
let patched = fs.readFileSync(target, 'utf8');
assert.match(patched, /thinkingConfig: \{ thinkingLevel: 'minimal' \},\n        maxOutputTokens: 32768/);
assert.match(patched, /thinkingConfig: \{ thinkingLevel: 'minimal' \},\n        maxOutputTokens: 65536/);
assert.equal((patched.match(/maxOutputTokens: 8192/g) || []).length, 0);

const second = execFileSync(process.execPath, [script], { cwd: tmp, encoding: 'utf8' });
assert.match(second, /already applied/);
assert.equal(fs.readFileSync(target, 'utf8'), patched, 'second application must be idempotent');

console.log('PASS: MusicXML output-budget patch is guarded and idempotent.');
