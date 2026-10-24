// The Node assembly must reproduce the page site/build.py published (public/index.html at 3608273) byte for byte.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { assemble } from './lib/assemble.mjs';

const golden = execFileSync('git', ['show', '3608273:public/index.html'], { encoding: 'utf8', maxBuffer: 1 << 24 });
const dataText = execFileSync('git', ['show', '3608273:site/data/data.json'], { encoding: 'utf8', maxBuffer: 1 << 24 });
const out = assemble({ releases: JSON.parse(dataText), dataText });
if (out === golden) { console.log(`golden: identical (${out.length} chars)`); process.exit(0); }
let i = 0; while (out[i] === golden[i]) i++;
console.error(`golden: differs at ${i} (out ${out.length}, golden ${golden.length})\n  out:    ${JSON.stringify(out.slice(i - 60, i + 60))}\n  golden: ${JSON.stringify(golden.slice(i - 60, i + 60))}`);
process.exit(1);
