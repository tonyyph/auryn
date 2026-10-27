// Checks the App Store fields in store/app-store-submission.md against Apple's limits.
// Each field is a ```text block preceded by <!-- field: <id> | max <n> chars|bytes [| min <n>] -->.
//   node store/check-metadata.mjs
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const md = readFileSync(resolve(import.meta.dirname, 'app-store-submission.md'), 'utf8');
const re = /<!-- field: ([\w.-]+) \| max (\d+) (chars|bytes)(?: \| min (\d+))? -->\s*```text\n([\s\S]*?)\n```/g;
let failed = 0;
let count = 0;
for (const [, id, max, unit, min, raw] of md.matchAll(re)) {
  count++;
  const text = raw.trim();
  const size = unit === 'bytes' ? Buffer.byteLength(text, 'utf8') : [...text].length;
  const problems = [];
  if (size > Number(max)) problems.push(`over by ${size - Number(max)}`);
  if (min && size < Number(min)) problems.push(`under min ${min}`);
  if (/[⟨⟩]/.test(text)) problems.push('still has a ⟨placeholder⟩');
  if (id.startsWith('keywords')) {
    const words = text.split(',');
    if (/,\s|\s,/.test(text)) problems.push('spaces around commas waste bytes');
    const short = words.filter((w) => [...w.trim()].length <= 2);
    if (short.length) problems.push(`keywords must be > 2 characters: ${short.join(' ')}`);
    const locale = id.split('.')[1];
    const nameAndSub = ['name', 'subtitle'].map((f) => md.match(new RegExp(`field: ${f}\\.${locale.replace('.', '\\.')} [^>]*-->\\s*\`\`\`text\\n([^\\n]*)`))?.[1] ?? '').join(' ').toLowerCase();
    const repeated = words.filter((w) => nameAndSub.split(/[^\p{L}\p{N}]+/u).includes(w.trim().toLowerCase()));
    if (repeated.length) problems.push(`already in name/subtitle (wasted): ${repeated.join(' ')}`);
  }
  if (problems.length) failed++;
  console.log(`${problems.length ? '✗' : '✓'} ${id.padEnd(22)} ${String(size).padStart(4)} / ${max} ${unit}${problems.length ? '  — ' + problems.join('; ') : ''}`);
}
console.log(`\n${count} fields, ${failed} with problems`);
process.exit(failed ? 1 : 0);
