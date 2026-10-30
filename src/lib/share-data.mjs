// /share.json (src/pages/share.json.js) as the Pages Functions read it: from this deployment's own files, kept for the
// life of the worker
let data = null;
export const shareData = env => data || (data = env.ASSETS.fetch('https://assets.local/share.json')
  .then(r => { if (!r.ok) throw new Error(`share.json ${r.status}`); return r.json(); })
  .catch(e => { data = null; throw e; }));
