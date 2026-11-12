// Monster pictures from the Ninja Adventure pack (CC0). An ordinary monster is the front-facing frame of its
// 16x16 sheet, drawn at twice its size in battle; a boss is its idle animation strip. A key is a sheet name
// ('KappaGreen') or 'boss:' and a boss name ('boss:DemonCyclop'). fs is the drawing scale battle.js uses.
import { canvas } from './gfx.js';
import { IMG } from './assets.js';

// each boss strip: frame width, frame height, number of frames
const STRIP = {
  DemonCyclop: [50, 50, 5], DemonCyclop2: [50, 50, 5], GiantBamboo: [62, 62, 6], GiantFlam: [50, 50, 5], GiantFrog2: [40, 40, 5],
  GiantRacoon: [60, 60, 6], GiantRacoonGold: [60, 60, 6], GiantRedSamurai: [96, 48, 6], GiantBlueSamurai: [96, 48, 6],
  GiantSlime: [62, 52, 5], GiantSpirit: [50, 50, 5], SquidRed: [76, 79, 4], SquidGreen: [76, 79, 4], TenguRed: [82, 82, 6], TenguBlue: [68, 68, 6],
  GiantBamboo2: [62, 62, 6], GiantFrog: [40, 40, 5], GiantSlime2: [62, 52, 5],
};
// a dragon is put together from its parts: two wings behind, a trail of body rings, the tail tip and the head in front.
// Four frames: the wings beat and the head bobs.
function dragon(name) {
  const P = (p) => IMG['d:' + name + p];
  const frames = [0, -2, -3, -1].map((dy, k) => {
    const c = canvas(170, 112), g = c.x, wing = P('Wing');
    g.save(); g.translate(38 + 57, dy); g.scale(-1, 1); g.drawImage(wing, 0, 0); g.restore();
    g.drawImage(wing, 112, dy);
    g.drawImage(P('BodyEnd'), 6, 70);
    const rings = [[20, 70, 'Body2'], [34, 60, 'Body1'], [50, 54, 'Body2'], [64, 46, 'Body1']];
    for (const [x, y, part] of rings) g.drawImage(P(part), x, y + Math.round(Math.sin((x + k * 20) / 14)));
    g.drawImage(P('Head'), 82, 14 + (k % 2 ? -1 : 0));
    return c;
  });
  const a = frames[0]; a.frames = frames; a.fs = 1; return a;
}
// people in battle (ninja, monks) are their sheet's right-facing walk: 'char:' at twice size, 'charB:' as a boss
function person(name, big) {
  const img = IMG['c:' + name] || IMG['c:Villager'];
  const frames = [0, 1, 2, 3].map((r) => cut(img, 48, r * 16, 16, 16));
  const a = frames[0]; a.frames = frames; a.fs = big ? 3.5 : 2; return a;
}
const cache = new Map();
function cut(img, sx, sy, w, h) { const c = canvas(w, h); c.x.drawImage(img, sx, sy, w, h, 0, 0, w, h); return c; }
function recolor(src, hue, sat) {
  const c = canvas(src.width, src.height); c.x.drawImage(src, 0, 0);
  const id = c.x.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx - mn < 0.06) continue;
    const dd = mx - mn, s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
    let h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
    h = ((h * 60 + hue) % 360 + 360) % 360;
    const s2 = Math.min(1, s * sat), q = l < 0.5 ? l * (1 + s2) : l + s2 - l * s2, p = 2 * l - q;
    const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    d[i] = Math.round(f(h / 360 + 1 / 3) * 255); d[i + 1] = Math.round(f(h / 360) * 255); d[i + 2] = Math.round(f(h / 360 - 1 / 3) * 255);
  }
  c.x.putImageData(id, 0, 0);
  return c;
}
function build(key) {
  if (key.startsWith('dragon:')) return dragon(key.slice(7));
  if (key.startsWith('char:')) return person(key.slice(5), false);
  if (key.startsWith('charB:')) return person(key.slice(6), true);
  if (key.startsWith('boss:')) {
    const n = key.slice(5), img = IMG['b:' + n], [w, h, k] = STRIP[n];
    const frames = Array.from({ length: k }, (_, i) => cut(img, i * w, 0, w, h));
    // small strips are drawn bigger, so every boss stands about 76 pixels tall
    const a = frames[0]; a.frames = frames; a.fs = Math.min(2, 140 / w, Math.max(1, 76 / h)); return a;
  }
  const img = IMG['m:' + key];
  const frames = [0, 1, 2, 3].map((r) => cut(img, 0, r * 16, 16, 16));
  const a = frames[0]; a.frames = frames; a.fs = 2; return a;
}
export function enemyArt(key, hue = 0, sat = 1) {
  const k = key + '|' + hue + '|' + sat;
  if (!cache.has(k)) {
    const base = cache.get(key + '|0|1') || build(key);
    cache.set(key + '|0|1', base);
    if (hue || sat !== 1) { const frames = base.frames.map((f) => recolor(f, hue, sat)), a = frames[0]; a.frames = frames; a.fs = base.fs; cache.set(k, a); }
  }
  return cache.get(k);
}
export const bossArt = enemyArt;
// on the map a monster walks as itself, one game pixel per dot
export function miniArt(key, hue = 0, sat = 1) {
  const k = 'mini:' + key + '|' + hue + '|' + sat;
  if (!cache.has(k)) {
    const a = enemyArt(key, hue, sat);
    if (a.fs === 2) { const c = canvas(16, 16); c.x.drawImage(a, 0, 0); cache.set(k, c); } else { const c = canvas(a.width, a.height); c.x.drawImage(a, 0, 0); c.fs = Math.min(1, 22 / a.height); cache.set(k, c); }
  }
  return cache.get(k);
}
