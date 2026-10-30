#!/usr/bin/env node
/* Find where a track drops, to start a demo shot on it.
   node scripts/demo/drops.mjs <file.mp3> [<from>-<to>]
   Without a range: a loudness line, one character per second (" .:-=+*#%@", relative to the loudest second), and the
   strongest 8 s after a rise. With a range in seconds: the exact drop inside it, the 50 ms step with the biggest jump
   from the 2 s before to the 2 s after. Start the shot about 0.05 s before it. FFMPEG=<bin> overrides ffmpeg. */
import {execFileSync} from 'node:child_process';
const [file, range] = process.argv.slice(2);
if (!file) {console.error('usage: drops.mjs <file.mp3> [<from>-<to>]'); process.exit(2)}
const SR = 11025, FF = process.env.FFMPEG || 'ffmpeg';
const decode = (from, len) => {
  const b = execFileSync(FF, ['-v', 'error', ...(from != null ? ['-ss', String(from), '-t', String(len)] : []), '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {maxBuffer: 1 << 30});
  return new Float32Array(b.buffer, b.byteOffset, b.length / 4);
};
const db = (x, a, b) => {let e = 0; for (let i = a; i < b; i++) e += x[i] * x[i]; return 10 * Math.log10(e / (b - a) + 1e-12)};
const mean = (v, a, b) => v.slice(a, b).reduce((p, q) => p + q, 0) / (b - a);
if (!range) {
  const x = decode(), sec = [];
  for (let s = 0; s * SR < x.length; s++) sec.push(db(x, s * SR, Math.min(x.length, (s + 1) * SR)));
  const pk = Math.max(...sec);
  let best = [-1e9, 0];
  for (let s = 16; s < sec.length - 10; s++) {const w = mean(sec, s, s + 8), sc = w + .5 * (w - mean(sec, s - 4, s)); if (sc > best[0]) best = [sc, s]}
  console.log(`${file.split('/').pop()}  ${(x.length / SR).toFixed(1)} s, strongest 8 s after a rise at ${best[1]} s`);
  console.log(sec.map(v => ' .:-=+*#%@'[Math.max(0, Math.min(9, Math.round((v - pk + 18) / 2)))]).join(''));
} else {
  const [lo, hi] = range.split('-').map(Number), x = decode(lo, hi - lo), h = Math.round(SR * .05), e = [];
  for (let i = 0; i + h <= x.length; i += h) e.push(db(x, i, i + h));
  let best = [-1e9, 0];
  for (let i = 40; i < e.length - 40; i++) {const d = mean(e, i, i + 40) - mean(e, i - 40, i); if (d > best[0]) best = [d, i]}
  console.log(`${file.split('/').pop()}  drop at ${(lo + best[1] * .05).toFixed(2)} s (+${best[0].toFixed(1)} dB)`);
}
