// Share addresses: /cat/<CAT>?track=<n>&t=<start>&scene=<n or id>. The link previews and oEmbed (functions/) read them
// with these helpers; the page reads them the same way in site/src/v4-route.js, so keep the two in step.
//   track  the track, counted from 1
//   t      where it starts: 90, 90s, 1m30s, 1h2m3s, 1:30 or 1:02:03
//   scene  the scene, by its number in the scene menu (?scene=15) or its id (?scene=clearing), pinned as if picked there
// Until 2026-10-30 ?t=<n> named the track. Without ?track, a bare ?t no greater than the release's track count still does.

// seconds, or null when v is not a time
export function secs(v) {
  if (v == null || v === '') return null;
  if (/^\d+(\.\d+)?s?$/.test(v)) return parseFloat(v);
  const m = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (m) return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
  if (/^\d+(:\d{1,2}){1,2}$/.test(v)) return v.split(':').reduce((a, x) => a * 60 + +x, 0);
  return null;
}
export const fmtTime = s => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}` };

// what an address asks for, for a release of n tracks: track and scene as indexes, t in whole seconds; null when not named
export function shareParams(sp, n, sceneIds) {
  const tv = sp.get('t') || '';
  const legacy = !sp.has('track') && /^\d+$/.test(tv) && +tv >= 1 && +tv <= n;
  const tn = sp.has('track') ? parseInt(sp.get('track'), 10) : legacy ? +tv : NaN;
  const t = legacy ? null : secs(tv);
  const sv = (sp.get('scene') || '').toLowerCase();
  const scene = /^\d+$/.test(sv) ? (+sv >= 1 && +sv <= sceneIds.length ? +sv - 1 : null) : sceneIds.includes(sv) ? sceneIds.indexOf(sv) : null;
  return { track: tn >= 1 && tn <= n ? tn - 1 : null, t: t >= 1 ? Math.floor(t) : null, scene };
}
// the same, written back in one order; a start time always names its track, so it never reads as the old ?t=<track>
export function shareQuery({ track, t, scene }) {
  const q = new URLSearchParams();
  if (track != null || t) q.set('track', (track ?? 0) + 1);
  if (t) q.set('t', t);
  if (scene != null) q.set('scene', scene + 1);
  return q.toString();
}

// link-preview text for a share address of release cat, from /share.json (src/pages/share.json.js); null when the
// address names nothing to share, or the release is unknown
export function shareMeta(data, cat, sp, origin) {
  const r = data.releases[cat];
  if (!r) return null;
  const p = shareParams(sp, r.tr.length, data.ids);
  if (p.track == null && p.t == null && p.scene == null) return null;
  const q = shareQuery(p), i = p.track ?? 0, [tt, ta] = r.tr[i];
  const isTrack = p.track != null || p.t != null;
  const where = [p.t && `from ${fmtTime(p.t)}`, p.scene != null && `in scene ${p.scene + 1}, ${data.scenes[p.scene]}`].filter(Boolean).join(' ');
  return {
    ...p, release: r, url: `${origin}/cat/${cat}${q ? '?' + q : ''}`, isTrack, trackNo: i + 1,
    title: isTrack ? `${tt} by ${ta} [${cat}] · ${r.l}` : null,
    trackTitle: tt, trackArtist: ta,
    // a track: what it is and where it starts; a release in a scene: the scene, ahead of the release's own description
    description: isTrack ? `Track ${i + 1} of ${r.tr.length} from ${r.t} by ${r.a} [${cat}], ${r.l}, ${r.y}.${where ? ` Plays ${where}.` : ''}`
      : `Plays ${where}.`,
  };
}
