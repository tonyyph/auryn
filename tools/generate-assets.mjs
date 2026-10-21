// Generates Auryn's raster assets from SVG with @resvg/resvg-js:
// app icon, Android adaptive layers, splash mark, favicon, and the pre-blurred aurora
// layers the app animates with cheap transforms. All artwork is original geometry.
// Re-run with `pnpm assets`.
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const A = path.join(ROOT, 'assets');
fs.mkdirSync(path.join(A, 'aurora'), { recursive: true });

function render(svg, file, width) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width }, background: 'rgba(0,0,0,0)' }).render().asPng();
  fs.writeFileSync(path.join(A, file), png);
  console.log('wrote', file, `${(png.length / 1024).toFixed(0)} KB`);
}

const C = {
  base: '#070B16',
  deep: '#090F20',
  elevated: '#0D1629',
  emerald: '#35D8AC',
  mint: '#91F4DA',
  cyan: '#78D9F5',
  periwinkle: '#A5B8FF',
  lavender: '#C2A6F5',
  violet: '#9272E8',
  champagne: '#F1DDAF',
};

// ---------- Brand mark: two offset rounded squares, a slit of light where they overlap ----------
function mark({ x = 0, y = 0, s = 1, mono = false } = {}) {
  const fillA = mono ? '#fff' : 'url(#mA)';
  const fillB = mono ? '#fff' : 'url(#mB)';
  return `
  <g transform="translate(${x} ${y}) scale(${s})">
    <defs>
      <linearGradient id="mA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.mint}"/><stop offset="1" stop-color="${C.emerald}"/></linearGradient>
      <linearGradient id="mB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D7C8FF"/><stop offset="1" stop-color="${C.violet}"/></linearGradient>
      <filter id="slitGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <rect x="0" y="120" width="240" height="240" rx="64" fill="${fillA}" ${mono ? '' : 'opacity="0.96"'}/>
    <rect x="140" y="0" width="240" height="240" rx="64" fill="${fillB}" ${mono ? 'opacity="0.55"' : ''}/>
    ${mono ? '' : `<rect x="140" y="120" width="100" height="120" fill="#F4FFFB" opacity="0.55" filter="url(#slitGlow)"/>`}
    <rect x="140" y="120" width="100" height="120" fill="${mono ? '#fff' : '#E9FFF8'}"/>
    ${mono ? '' : `<rect x="64" y="121.5" width="76" height="3" rx="1.5" fill="#fff" opacity="0.55"/><rect x="200" y="1.5" width="120" height="3" rx="1.5" fill="#fff" opacity="0.6"/>`}
  </g>`;
}
// Mark bounding box is 380 × 360.

function skyDefs() {
  return `
    <linearGradient id="sky" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#0F1A33"/><stop offset="0.55" stop-color="${C.deep}"/><stop offset="1" stop-color="${C.base}"/></linearGradient>
    <linearGradient id="ribbon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.emerald}"/><stop offset="1" stop-color="${C.cyan}"/></linearGradient>
    <linearGradient id="ribbon2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.violet}"/><stop offset="1" stop-color="${C.lavender}"/></linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
    <filter id="softer" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>`;
}

// ---------- App icon ----------
const iconBg = `
  <rect width="1024" height="1024" fill="url(#sky)"/>
  <path d="M -120 420 C 220 180, 560 520, 1150 160" stroke="url(#ribbon)" stroke-width="230" fill="none" opacity="0.42" filter="url(#soft)"/>
  <path d="M -80 400 C 240 200, 560 500, 1100 190" stroke="${C.mint}" stroke-width="50" fill="none" opacity="0.22" filter="url(#softer)"/>
  <path d="M -100 980 C 300 820, 640 1060, 1150 860" stroke="url(#ribbon2)" stroke-width="260" fill="none" opacity="0.3" filter="url(#soft)"/>`;

render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs>${skyDefs()}</defs>${iconBg}${mark({ x: 512 - 190 * 1.18, y: 512 - 180 * 1.18, s: 1.18 })}</svg>`,
  'icon.png',
  1024,
);
render(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs>${skyDefs()}</defs>${iconBg}</svg>`, 'android-icon-background.png', 1024);
// Adaptive foreground: keep the mark inside the 66% safe zone.
render(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${mark({ x: 512 - 190 * 0.95, y: 512 - 180 * 0.95, s: 0.95 })}</svg>`, 'android-icon-foreground.png', 1024);
render(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${mark({ x: 512 - 190 * 0.95, y: 512 - 180 * 0.95, s: 0.95, mono: true })}</svg>`, 'android-icon-monochrome.png', 1024);
render(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${mark({ x: 10, y: 20 })}</svg>`, 'splash-icon.png', 400);
render(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs>${skyDefs()}</defs>${iconBg}${mark({ x: 512 - 190 * 1.5, y: 512 - 180 * 1.5, s: 1.5 })}</svg>`, 'favicon.png', 64);

// ---------- Aurora layers (transparent PNGs, animated in-app with transforms) ----------
// Canvas 1000 × 2000 (portrait); the app scales it to cover the screen with a little overscan.
const W = 1000;
const H = 2000;
const blur = (id, sd) => `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

// Primary: a wide, curved emerald→cyan ribbon across the top, leaning right. Soft centre, dissolving edges.
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="p" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="${C.emerald}"/><stop offset="0.6" stop-color="#5ED9D2"/><stop offset="1" stop-color="${C.cyan}"/></linearGradient>
      ${blur('b1', 95)}${blur('b2', 45)}
    </defs>
    <path d="M -200 640 C 140 330, 470 650, 780 340 S 1150 120, 1250 40" stroke="url(#p)" stroke-width="320" fill="none" opacity="0.5" filter="url(#b1)"/>
    <path d="M -150 600 C 160 360, 470 620, 780 350 S 1120 150, 1220 70" stroke="${C.mint}" stroke-width="70" fill="none" opacity="0.3" filter="url(#b2)"/>
  </svg>`,
  'aurora/primary.png',
  W,
);

// Secondary: a dimmer violet→lavender drift low and to the left, balancing colour without symmetry.
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.violet}"/><stop offset="1" stop-color="${C.lavender}"/></linearGradient>
      ${blur('b3', 120)}
    </defs>
    <path d="M -250 1720 C 100 1520, 420 1800, 760 1600 S 1100 1500, 1200 1560" stroke="url(#s)" stroke-width="360" fill="none" opacity="0.34" filter="url(#b3)"/>
  </svg>`,
  'aurora/secondary.png',
  W,
);

// Milestone flare: a champagne→mint ribbon through the middle, shown once at 2048.
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.mint}"/><stop offset="0.5" stop-color="${C.champagne}"/><stop offset="1" stop-color="${C.lavender}"/></linearGradient>
      ${blur('b4', 80)}${blur('b5', 30)}
    </defs>
    <path d="M -200 1150 C 200 860, 520 1180, 820 900 S 1150 700, 1250 640" stroke="url(#f)" stroke-width="260" fill="none" opacity="0.55" filter="url(#b4)"/>
    <path d="M -150 1120 C 220 880, 520 1150, 820 910 S 1130 720, 1220 670" stroke="#FFF6E0" stroke-width="40" fill="none" opacity="0.4" filter="url(#b5)"/>
  </svg>`,
  'aurora/flare.png',
  W,
);

// Vignette: darkens the edges so the centre (the board) holds the eye.
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="1000" viewBox="0 0 500 1000">
    <defs><radialGradient id="v" cx="0.5" cy="0.48" r="0.75"><stop offset="0.45" stop-color="${C.base}" stop-opacity="0"/><stop offset="1" stop-color="#03050B" stop-opacity="0.8"/></radialGradient></defs>
    <rect width="500" height="1000" fill="url(#v)"/>
  </svg>`,
  'aurora/vignette.png',
  500,
);

// Grain: a tiny tiling noise texture, drawn at very low opacity to break gradient banding.
{
  const N = 128;
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  let rects = '';
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v = rnd();
      if (v > 0.5) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="#fff" opacity="${((v - 0.5) * 0.5).toFixed(3)}"/>`;
    }
  render(`<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}" viewBox="0 0 ${N} ${N}">${rects}</svg>`, 'aurora/grain.png', N);
}
