
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';

THREE.ColorManagement.enabled=false;
// the gate's loading bar (site/intro/loader.js): report each stage, and let a frame paint before the next heavy step
const S8L=window.S8L||{stage(){},done(){}};
const yieldFrame=()=>new Promise(r=>{requestAnimationFrame(()=>setTimeout(r,0));setTimeout(r,150)});
S8L.stage('app');await yieldFrame();
const D=/*__DATA__*/[];
const MP3='https://cdn-prod-1.labelgrid.com/labels/';
const BY=Object.fromEntries(D.map(r=>[r.c,r]));
const CHRON=[...D].sort((a,b)=>a.d.localeCompare(b.d)||a.c.localeCompare(b.c));
const RANK=Object.fromEntries(CHRON.map((r,i)=>[r.c,i+1]));
const NTRACKS=D.reduce((n,r)=>n+r.tr.length,0), YEARS=`${CHRON[0].d.slice(0,4)}—${CHRON.at(-1).d.slice(0,4)}`;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const fdate=d=>{const [y,m,dd]=d.split('-');return `${String(+dd).padStart(2,'0')} ${MON[+m-1]} ${y}`};
const splitT=t=>{const i=t.indexOf(' - ');return i<0?['',t]:[t.slice(0,i),t.slice(i+3)]};
const pad=(n,l=2)=>String(n).padStart(l,'0');
const fmt=s=>isFinite(s)&&s>0?Math.floor(s/60)+':'+pad(Math.floor(s%60)):'--:--';
const rand=(a,b)=>a+Math.random()*(b-a);
const fnv=s=>{let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const mulberry=seed=>{let a=seed>>>0;return()=>{a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

