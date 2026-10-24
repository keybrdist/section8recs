
/* ---------------- routes: each page names what it shows (#s8-route); entering plays it, and the address follows the
   release on air so it can be shared ---------------- */
const ROUTE=(()=>{try{return JSON.parse($('#s8-route')?.textContent||'{}')}catch(e){return {}}})();
// where a page starts: a release page on its track (?t=<n>, counted from 1) or its first, an artist page on their latest release
function routeStart(){
  const r=BY[ROUTE.c];if(!r)return null;
  const t=+new URLSearchParams(location.search).get('t');return [r.c,t>=1&&t<=r.tr.length?t-1:0];
}
// the address follows the release on air (set on play); the module keeps its own play history, so the browser's is window.history
function syncUrl(c){const p=`/cat/${c}`;if(location.pathname!==p)window.history.replaceState(null,'',p)}
// track buttons on the page itself (release tracklists) enter the experience on that track
$('#gate').addEventListener('click',e=>{const b=e.target.closest('[data-play]');if(!b)return;e.preventDefault();const [c,i]=b.dataset.play.split(':');enter(true,[c,+i])});
