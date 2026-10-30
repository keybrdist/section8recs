#!/usr/bin/env node
/* Cut a demo video from the rendered shots: the title card over the 1.5 s before the first shot (its track's build-up),
   each shot for its length, and the end card while the last track fades out. Shots that continue the same track
   (a row starting where the one before ends) share one unbroken stretch of audio; elsewhere the cut is hard.
   node scripts/demo/assemble.mjs <shots.tsv> <work-dir> <out.mp4>
   Reads <work-dir>/shots and mp3 (render.mjs) and draws <work-dir>/cards. Out: H.264 at the table's @size, 30 fps,
   capped at 16 Mbps (the site's grain is costly to encode), AAC 320 kbps, two-pass loudnorm to -14 LUFS with a true
   peak of -1.5 dBTP. FFMPEG=<bin> overrides ffmpeg. */
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readTable} from './table.mjs';

const [table, work, out] = process.argv.slice(2);
if (!out) {console.error('usage: assemble.mjs <shots.tsv> <work-dir> <out.mp4>'); process.exit(2)}
const FF = process.env.FFMPEG || 'ffmpeg', FPS = 30, GRAIN = 'noise=alls=7:allf=t';
const T = readTable(table), C = `${work}/cards`, A = `${work}/asm`;
mkdirSync(A, {recursive: true});
execFileSync(process.execPath, [fileURLToPath(new URL('cards.mjs', import.meta.url)), table, C], {stdio: 'inherit'});
const ff = args => {const r = spawnSync(FF, ['-v', 'error', '-y', ...args], {stdio: 'inherit'}); if (r.status !== 0) {console.error(`ffmpeg failed (exit ${r.status})`); process.exit(1)}};

// everything is counted in frames, so each cut lands where the table puts it
const fr = s => Math.round(s * FPS), fi = fr(T.intro), fe = fr(T.end), fs = T.rows.map(r => fr(r.len));
const total = fi + fs.reduce((a, b) => a + b, 0) + fe, N = T.rows.length;

const vin = ['-loop', '1', '-framerate', String(FPS), '-t', String(T.intro + 1), '-i', `${C}/intro.png`];
let fc = `[0:v]trim=end_frame=${fi},setpts=PTS-STARTPTS,format=yuv420p,${GRAIN},fade=in:0:12[v0];`, cat = '[v0]';
T.rows.forEach((r, i) => {vin.push('-i', `${work}/shots/${r.name}.mp4`); fc += `[${i + 1}:v]trim=end_frame=${fs[i]},setpts=PTS-STARTPTS,format=yuv420p[v${i + 1}];`; cat += `[v${i + 1}]`});
for (const p of ['end-nocur', 'end']) vin.push('-loop', '1', '-framerate', String(FPS), '-t', String(T.end + 1), '-i', `${C}/${p}.png`);
fc += `[${N + 1}:v][${N + 2}:v]overlay=enable='lt(mod(t\\,1.06)\\,0.53)',trim=end_frame=${fe},setpts=PTS-STARTPTS,format=yuv420p,${GRAIN},fade=in:0:6,fade=out:st=${(T.end - .6).toFixed(3)}:d=0.6[ve];`;
fc += `${cat}[ve]concat=n=${N + 2}:v=1:a=0,fps=${FPS}[v]`;
ff([...vin, '-filter_complex', fc, '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', `${A}/video.mp4`]);

// audio: one stretch per run of rows that continue the same track
const runs = [];
T.rows.forEach((r, i) => {
  const len = fs[i] / FPS, last = runs[runs.length - 1];
  if (last && last.file === r.file && Math.abs(last.start + last.dur - r.start) < .05) last.dur += len;
  else runs.push({file: r.file, start: r.start, dur: len});
});
runs[0].start -= T.intro; runs[0].dur += T.intro; runs[runs.length - 1].dur += T.end;
if (runs[0].start < 0) {console.error('the first shot starts less than @intro seconds into its track'); process.exit(1)}
const ain = [];
let afc = '', acat = '';
runs.forEach((r, i) => {
  const fin = i === 0 ? .4 : .01, fout = i === runs.length - 1 ? 1.6 : .01;
  ain.push('-ss', r.start.toFixed(3), '-t', r.dur.toFixed(3), '-i', `${work}/mp3/${r.file}`);
  afc += `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=${r.dur.toFixed(3)},asetpts=PTS-STARTPTS,afade=in:d=${fin},afade=out:st=${(r.dur - fout).toFixed(3)}:d=${fout}[a${i}];`;
  acat += `[a${i}]`;
});
ff([...ain, '-filter_complex', `${afc}${acat}concat=n=${runs.length}:v=0:a=1[a]`, '-map', '[a]', '-c:a', 'pcm_f32le', `${A}/audio.wav`]);

// loudness: measure, then apply linearly
const LN = 'loudnorm=I=-14:TP=-1.5:LRA=11';
const m = spawnSync(FF, ['-hide_banner', '-i', `${A}/audio.wav`, '-af', `${LN}:print_format=json`, '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
const J = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1));
ff(['-i', `${A}/audio.wav`, '-af', `${LN}:measured_I=${J.input_i}:measured_TP=${J.input_tp}:measured_LRA=${J.input_lra}:measured_thresh=${J.input_thresh}:offset=${J.target_offset}:linear=true,aresample=48000`, '-c:a', 'pcm_f32le', `${A}/audio-norm.wav`]);
ff(['-i', `${A}/video.mp4`, '-i', `${A}/audio-norm.wav`, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-maxrate', '16M', '-bufsize', '32M',
  '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-t', (total / FPS).toFixed(3), out]);
console.log(`wrote ${out}: ${T.w}x${T.h}, ${total} frames (${(total / FPS).toFixed(2)} s), ${runs.length} audio stretch${runs.length > 1 ? 'es' : ''}`);
