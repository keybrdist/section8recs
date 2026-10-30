/* A shot table: one tab-separated row per shot (name, catalogue number, track, file on the label CDN, start in the
   track, warm-up seconds, scene as named in the Scene menu, and optionally the shot's length in seconds), plus
   settings on lines starting with @ (name, tab, value):
     @size    WxH of the video (1920x1080)        @title, @kicker, @line   text of the title card
     @intro   title card seconds (1.5)            @end     end card seconds (2.2)
     @shot    default shot length in seconds (5.9)
   Lines starting with # and blank lines are skipped. */
import {readFileSync} from 'node:fs';

export function readTable(path) {
  const set = {size: '1920x1080', intro: '1.5', end: '2.2', shot: '5.9'}, rows = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const c = line.split('\t');
    if (line.startsWith('@')) {set[c[0].slice(1)] = c.slice(1).join('\t'); continue}
    const [name, cat, track, file, start, warm, scene, len] = c;
    if (!scene) throw new Error(`${path}: a row needs 7 columns: ${line}`);
    rows.push({name, cat, track: +track, file, start: +start, warm: +warm, scene, len: +(len || set.shot)});
  }
  const [w, h] = set.size.split('x').map(Number);
  return {set, rows, w, h, intro: +set.intro, end: +set.end};
}
