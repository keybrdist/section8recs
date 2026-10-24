// The chosen home page (intro J): centred isometric wireframe logo, label links below the hero.
import { readFileSync } from 'node:fs';
const rd = name => readFileSync(new URL(`../../site/intro/${name}`, import.meta.url), 'utf8');

export const NAME = 'Centre with wireframe, mark only';
export const FONTS = 'family=Barlow:wght@300';
export const PRELOAD = '<link rel="preload" as="image" href="{slug}/forest.jpg" imagesrcset="{slug}/forest-1280.jpg 1280w, {slug}/forest.jpg 2560w" imagesizes="100vw">';
export const CSS = rd('ff.css') + rd('j.css') + rd('pages.css');
export const HTML = '<!--GATE-->\n';
export const SCRIPT = '<script>\n' + rd('wire-lib.js')
  + '\nmountWire(document.getElementById("wire"),{gate:document.getElementById("gate"),records:"none"});\n'
  + rd('links.js') + '</script>';
