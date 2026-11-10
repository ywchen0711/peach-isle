// Walking around: maps, the party trailing behind the leader, NPCs, chests, push-block puzzles,
// floor switches, gates, pits, colour posts, ice, and the visible monsters of the dungeons.
import { ctx, W, H, canvas, fromGrid, text, textW, windowBox, Painter, ramp, hash, fine } from './gfx.js';
import { renderMap, solidKind, TILES } from './tiles.js';
import { sprite } from './sprites.js';
import { tileset } from './assets.js';
import { miniArt, enemyArt } from './enemies.js';
const fineOf = (a) => (a.fs ? fine(a.fs) : 1);
import { input } from './input.js';
import { sfx } from './audio.js';
import { S } from './party.js';
import { UI } from './ui.js';

const DIRS = { up: [0, -1, 'u'], down: [0, 1, 'd'], left: [-1, 0, 'l'], right: [1, 0, 'r'] };
const DV = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const SPEED = 2; // pixels per frame, 8 frames per tile

// ---------- entity art ----------
const ART = {};
function art(name, make) { return ART[name] || (ART[name] = make()); }
const chestArt = (open) => art('chest' + open, () => fromGrid(open ? [
  '................', '..oooooooooooo..', '.oddddddddddddo.', '.oDDDDDDDDDDDDo.', '.oyyyyyyyyyyyyo.', '.owwwwwwwwwwwwo.', '.oyyyyyyyyyyyyo.', '.obbbbbbbbbbbbo.', '.obbbbbyybbbbbo.', '.oBBBBByyBBBBBo.', '.obbbbbbbbbbbbo.', '.oBBBBBBBBBBBBo.', '.oyyyyyyyyyyyyo.', '..oooooooooooo..', '................', '................',
] : [
  '................', '................', '..oooooooooooo..', '.obbbbbbbbbbbbo.', '.obbbbbbbbbbbbo.', '.oBBBBBBBBBBBBo.', '.oyyyyyyyyyyyyo.', '.obbbbbyybbbbbo.', '.obbbbywwybbbbo.', '.oBBBBByyBBBBBo.', '.obbbbbbbbbbbbo.', '.oBBBBBBBBBBBBo.', '.oyyyyyyyyyyyyo.', '..oooooooooooo..', '................', '................',
], { o: '#200c08', b: '#b06830', B: '#784018', y: '#f0c040', w: '#fff8d0', d: '#301810', D: '#583018' }));
const blockArt = () => art('block', () => fromGrid([
  'oooooooooooooooo', 'owwwwwwwwwwwwwwo', 'owllllllllllllso', 'owllllllllllllso', 'owlllmlllllmllso', 'owllllllllllllso', 'owllllllllllllso', 'owllllllllllllso', 'owlllllmllllllso', 'owllllllllllllso', 'owllllllllllllso', 'owllllllllllllso', 'osssssssssssssso', 'oddddddddddddddo', 'oddddddddddddddo', 'oooooooooooooooo',
], { o: '#181820', w: '#e0e0e8', l: '#a8a8b8', m: '#888898', s: '#707080', d: '#484858' }));
const plateArt = (on) => art('plate' + on, () => fromGrid([
  '................', '................', '..oooooooooooo..', '..o' + (on ? 'dddddddddd' : 'wwwwwwwwww') + 'o..', ...Array(7).fill('..o' + (on ? 'dyyyyyyyyd' : 'wllllllllm') + 'o..'), '..o' + (on ? 'dddddddddd' : 'mmmmmmmmmm') + 'o..', '..oooooooooooo..', '................', '................', '................',
], { o: '#181820', w: '#d0d0e0', l: '#9898b0', m: '#585870', d: '#484858', y: '#f0c040' }));
const gateArt = () => art('gate', () => { const c = canvas(16, 16); const g = c.x; g.fillStyle = '#181820'; g.fillRect(0, 0, 16, 16); for (let x = 1; x < 16; x += 4) { g.fillStyle = '#9098b0'; g.fillRect(x, 0, 2, 16); g.fillStyle = '#d0d8e8'; g.fillRect(x, 0, 1, 16); } g.fillStyle = '#606878'; g.fillRect(0, 3, 16, 2); g.fillRect(0, 11, 16, 2); g.fillStyle = '#b0b8c8'; g.fillRect(0, 3, 16, 1); g.fillRect(0, 11, 16, 1); return c; });
const holeArt = () => art('hole', () => { const c = canvas(16, 16); const g = c.x; g.fillStyle = '#000000'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#281810'; g.fillRect(0, 0, 16, 3); g.fillStyle = '#100808'; g.fillRect(0, 3, 16, 2); return c; });
const toggleArt = (st) => art('tog' + st, () => fromGrid(['................', '................', '.......oo.......', '......owwo......', '.....owccwo.....', '....owccccwo....', '...owccccccwo...', '..owccccccccwo..', '..oCccccccccCo..', '...oCccccccCo...', '....oCccccCo....', '.....oCcccCo....', '......oCCo......', '.......oo.......', '................', '................'].map((r) => r.replace('.....oCcccCo....', '.....oCccCo.....')), { o: '#101018', w: '#ffffff', c: st ? '#3870f0' : '#e04040', C: st ? '#1838a0' : '#901818' }));
const postArt = (col, up) => art('post' + col + up, () => {
  const p = new Painter(16, 22), R = ramp(col === 'r' ? '#e04848' : '#4878f0', 5);
  if (up) { p.tube([[8, 6, 5.5, 0], [8, 16, 5.5, 0]], R); p.ball(8, 6, 5.5, 2.5, R, { z: 6, flat: 0.5 }); p.ball(8, 17, 6.5, 2.5, ramp('#606878', 4), { z: -2 }); }
  else { p.ball(8, 17, 6.5, 2.6, R, { z: 0, flat: 0.6 }); }
  return p.finish();
});
const crystalArt = () => art('crys', () => { const p = new Painter(16, 22, { dither: 0.3 }), R = ramp('#58e0f8', 5); p.poly([[8, 0], [14, 9], [8, 21], [2, 9]], R, { z: 2, lum: 0.75, grad: 0.4 }); p.poly([[8, 0], [14, 9], [8, 21]], R, { z: 3, lum: 0.45, grad: 0.4 }); p.px(6, 6, '#ffffff'); p.px(6, 7, '#ffffff'); p.px(5, 8, '#ffffff'); return p.finish({ out: '#082040' }); });
const stoneArt = () => art('stone', () => { const p = new Painter(16, 20), R = ramp('#58b8b0', 5); p.ball(8, 16, 6.5, 2.5, ramp('#606878', 4), { z: -2, flat: 0.5 }); p.tube([[8, 6, 4, 0], [8, 15, 5, 0]], R); p.ball(8, 6, 4, 3, R, { z: 4 }); p.px(6, 6, '#ffffff'); p.px(6, 7, '#c0fff8'); return p.finish({ out: '#082028' }); });
const springArt = () => art('spring', () => { const p = new Painter(16, 16), R = ramp('#58c0f8', 5); p.ball(8, 9, 7, 5, ramp('#808898', 4), { z: 0, flat: 0.5 }); p.ball(8, 9, 5.5, 3.5, R, { z: 2, flat: 0.8, spec: 0.6 }); return p.finish(); });
const iconArt = (kind) => art('icon' + kind, () => {
  if (kind === 'town') { const p = new Painter(18, 18); const R = ramp('#c04030', 5), Wl = ramp('#e8d8b0', 4); for (const [x, y] of [[5, 9], [13, 8], [9, 13]]) { p.poly([[x - 4, y + 1], [x + 4, y + 1], [x + 4, y + 5], [x - 4, y + 5]], Wl, { z: y, lum: 0.7 }); p.poly([[x - 5, y + 1], [x, y - 4], [x + 5, y + 1]], R, { z: y + 1, lum: 0.6 }); } return p.finish(); }
  if (kind === 'cave') { const p = new Painter(18, 18); p.poly([[9, 1], [18, 17], [0, 17]], ['#3a2c20', '#5c4430', '#7c6048', '#a08468', '#c0a888'], { z: 0, lum: 0.55, grad: 0.3 }); p.ball(9, 15, 4, 4, ['#080404', '#100808'], { z: 3, cut: (u, v) => v > 0.5 }); return p.finish(); }
  if (kind === 'tower') { const p = new Painter(20, 44), R = ramp('#6878a8', 6), C = ramp('#40d8c8', 4); p.tube([[10, 6, 3, 0], [10, 40, 6.5, 0]], R); p.ball(10, 41, 8, 2.5, R, { z: 2, flat: 0.5 }); for (const y of [14, 24, 33]) p.ball(10, y, 5 + y * 0.04, 1.6, R, { z: 7, flat: 0.4 }); p.poly([[10, 0], [13, 7], [7, 7]], C, { z: 4, lum: 0.8 }); p.px(10, 19, '#80fff0'); p.px(10, 29, '#80fff0'); return p.finish({ out: '#081020' }); }
  if (kind === 'shrine') { const p = new Painter(18, 18), R = ramp('#e0e0f0', 5); p.poly([[2, 8], [16, 8], [16, 16], [2, 16]], R, { z: 0, lum: 0.6 }); p.poly([[1, 8], [9, 2], [17, 8]], ramp('#5878c8', 5), { z: 2, lum: 0.6 }); return p.finish(); }
  return canvas(16, 16);
});

// conduit art: a floor plate with a metal channel; powered channels glow
const pipeArt = (shape, rot, lit, blink, fixed) => art(`pipe${shape}${rot}${lit}${blink}${fixed}`, () => {
  const c = canvas(16, 16), g = c.x;
  g.fillStyle = '#14181e'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = fixed ? '#3a3020' : '#2a323e'; g.fillRect(1, 1, 14, 14);
  g.fillStyle = fixed ? '#5a4a30' : '#46505e'; g.fillRect(1, 1, 14, 1); g.fillRect(1, 1, 1, 14);
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) { g.fillStyle = '#8890a0'; g.fillRect(x, y, 1, 1); }
  const core = lit ? (blink ? '#c0fff0' : '#60f8d0') : '#5a606a', edge = lit ? '#20a088' : '#30343c';
  const arm = (d) => { const [x, y, w, h] = [[6, 0, 4, 8], [8, 6, 8, 4], [6, 8, 4, 8], [0, 6, 8, 4]][d]; g.fillStyle = edge; g.fillRect(x, y, w, h); g.fillStyle = core; g.fillRect(x + (w > h ? 0 : 1), y + (w > h ? 1 : 0), w > h ? w : w - 2, w > h ? h - 2 : h); };
  for (const d of SHAPES[shape].map((d) => (d + rot) % 4)) arm(d);
  g.fillStyle = edge; g.fillRect(5, 5, 6, 6); g.fillStyle = core; g.fillRect(6, 6, 4, 4);
  return c;
});
const sourceArt = (f) => art('src' + f, () => { const p = new Painter(16, 20), R = ramp('#5a6070', 5); p.poly([[1, 19], [1, 6], [15, 6], [15, 19]], R, { lum: 0.6 }); p.ball(8, 10, 4, 4, ['#106050', '#20c0a0', '#60f8d0', '#e0fff8'], { z: 6, amb: 0.6 + f * 0.15 }); return p.finish({ out: '#081014' }); });
const sinkArt = (lit, b) => art('sink' + lit + b, () => { const p = new Painter(16, 20), R = ramp('#6a5a48', 5); p.poly([[2, 19], [2, 8], [14, 8], [14, 19]], R, { lum: 0.6 }); p.ball(8, 7, 4, 4, lit ? ['#106050', '#20c0a0', '#60f8d0', b ? '#ffffff' : '#e0fff8'] : ['#201810', '#402818', '#603828', '#805038'], { z: 6, amb: lit ? 0.8 : 0.3 }); return p.finish({ out: '#100c08' }); });

// ---------- map loading ----------
let MAPS = {};
export function setMaps(m) { MAPS = m; }
export const F = {
  map: null, def: null, gfx: null, ents: [], kinds: [], grid: null,
  p: { x: 0, y: 0, px: 0, py: 0, dir: 'd', moving: false, step: 0, slide: false },
  trail: [], frame: 0, cam: { x: 0, y: 0 }, banner: 0, toggle: false, encCount: 20,
  E: null, // story context
  busy: false, // a script is running
  onStep: null, onEncounter: null, onTouchEnemy: null,
  shake: 0,
};

export function loadMap(id, x, y, dir = 'd') {
  const def = MAPS[id];
  if (!def) throw new Error('no map ' + id);
  const built = def.build ? def.build(S.flags) : def;
  F.def = def; F.map = built;
  const kinds = [], index = {};
  const grid = new Uint8Array(built.w * built.h);
  for (let yy = 0; yy < built.h; yy++) for (let xx = 0; xx < built.w; xx++) {
    let k = built.kindAt(xx, yy);
    if (index[k] === undefined) { index[k] = kinds.length; kinds.push(k); }
    grid[yy * built.w + xx] = index[k];
  }
  F.kinds = kinds; F.grid = grid; F.index = index;
  built.kinds = kinds; built.tile = (X, Y) => grid[Y * built.w + X];
  F.gfx = renderMap(built);
  F.ents = built.ents.map((e) => ({ ...e }));
  // per-entity setup
  for (const e of F.ents) {
    e.px = e.x * 16; e.py = e.y * 16;
    if (e.type === 'chest' && S.flags['chest:' + e.id]) e.open = true;
    if (e.type === 'dig' && S.flags['dig:' + e.id]) e.done = true;
    if (e.type === 'gate' && e.flag && S.flags[e.flag]) e.open = true;
    if (e.type === 'gate' && S.flags['gate:' + id + ':' + e.group]) e.open = true;
    if (e.type === 'hole' && S.flags['hole:' + id + ':' + e.key]) e.filled = true;
    if (e.type === 'npc') { e.dir = e.dir || 'd'; e.home = [e.x, e.y]; e.mt = 0; }
    if (e.cond && !e.cond(S.flags)) e.gone = true;
  }
  F.toggle = false;
  if (F.ents.some((e) => e.type === 'source')) { checkPowerSoon = true; }
  F.p = { x, y, px: x * 16, py: y * 16, dir, moving: false, step: 0, slide: false };
  F.trail = [];
  for (let i = 0; i < 40; i++) F.trail.push({ px: x * 16, py: y * 16, dir });
  F.banner = def.name ? 150 : 0;
  F.encCount = 18 + Math.floor(Math.random() * 20);
  S.map = id; S.x = x; S.y = y; S.dir = dir;
  updateCam(true);
}

// ---------- queries ----------
const inMap = (x, y) => x >= 0 && y >= 0 && x < F.map.w && y < F.map.h;
export const kindAt = (x, y) => (inMap(x, y) ? F.kinds[F.grid[y * F.map.w + x]] : 'void');
export function entAt(x, y, pred = () => true) { return F.ents.find((e) => !e.gone && e.x === x && e.y === y && pred(e)); }
function entsAt(x, y) { return F.ents.filter((e) => !e.gone && e.x === x && e.y === y); }
function entSolid(e) {
  switch (e.type) {
    case 'npc': case 'chest': case 'block': case 'save': case 'sign': case 'spring': case 'boss': case 'hearth': case 'perch': case 'bellpost': return true;
    case 'vine': return true;
    case 'dig': return false;
    case 'gate': return !e.open;
    case 'hole': return !e.filled;
    case 'post': return (e.color === 'r') !== F.toggle;
    case 'enemy': return false;
    case 'solid': return true;
    case 'pipe': case 'source': case 'sink': return true;
    case 'sprite': return !!e.solid;
    default: return false;
  }
}
function blocked(x, y, forBlock = false) {
  if (!inMap(x, y)) return true;
  if (solidKind(kindAt(x, y))) return true;
  for (const e of entsAt(x, y)) {
    if (forBlock && e.type === 'hole' && !e.filled) continue;
    if (forBlock && (e.type === 'warp' || e.type === 'enemy')) return true;
    if (entSolid(e)) return true;
  }
  return false;
}
const npcAt = (x, y) => F.ents.find((e) => !e.gone && e.type === 'npc' && (e.x === x && e.y === y || (e.tx === x && e.ty === y)));

// ---------- puzzles ----------
// ---------- conduits ----------
// each piece has openings (0 up, 1 right, 2 down, 3 left) that turn with it; power runs from a
// generator through joined openings, and a receiver that gets power opens the gates of its group
const SHAPES = { I: [0, 2], L: [0, 1], T: [0, 1, 2], X: [0, 1, 2, 3] };
const STEP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
export const pipeOpen = (e) => SHAPES[e.shape].map((d) => (d + e.rot) % 4);
export function checkPower() {
  for (const e of F.ents) if (e.type === 'pipe' || e.type === 'sink') e.lit = false;
  const at = (x, y, t) => F.ents.find((o) => !o.gone && o.x === x && o.y === y && o.type === t);
  for (const src of F.ents.filter((e) => e.type === 'source')) {
    const q = [];
    for (let d = 0; d < 4; d++) { const pp = at(src.x + STEP[d][0], src.y + STEP[d][1], 'pipe'); if (pp && pp.group === src.group && pipeOpen(pp).includes((d + 2) % 4)) q.push(pp); }
    while (q.length) {
      const pp = q.pop();
      if (pp.lit) continue;
      pp.lit = true;
      for (const d of pipeOpen(pp)) {
        const nx = pp.x + STEP[d][0], ny = pp.y + STEP[d][1];
        const nxt = at(nx, ny, 'pipe');
        if (nxt && nxt.group === pp.group && !nxt.lit && pipeOpen(nxt).includes((d + 2) % 4)) q.push(nxt);
        const sk = at(nx, ny, 'sink');
        if (sk && sk.group === pp.group) sk.lit = true;
      }
    }
  }
  for (const sk of F.ents.filter((e) => e.type === 'sink' && e.lit && !e.done)) {
    sk.done = true;
    const key = 'gate:' + S.map + ':' + sk.group;
    if (!S.flags[key]) { S.flags[key] = true; for (const g of F.ents) if (g.type === 'gate' && g.group === sk.group) g.open = true; sfx('gate'); F.shake = 10; }
  }
}

function checkPlates() {
  const groups = {};
  for (const e of F.ents) if (e.type === 'plate' && !e.gone) {
    const on = !!F.ents.find((b) => b.type === 'block' && !b.gone && b.x === e.x && b.y === e.y);
    e.on = on;
    (groups[e.group] = groups[e.group] || []).push(on);
  }
  for (const [g, list] of Object.entries(groups)) {
    if (list.every(Boolean)) {
      const key = 'gate:' + S.map + ':' + g;
      const gates = F.ents.filter((e) => e.type === 'gate' && String(e.group) === g && !e.open);
      if (gates.length) { for (const e of gates) e.open = true; S.flags[key] = true; sfx('gate'); F.shake = 10; }
    }
  }
}
function pushBlock(b, dx, dy) {
  const nx = b.x + dx, ny = b.y + dy;
  if (blocked(nx, ny, true)) return false;
  if (npcAt(nx, ny)) return false;
  b.x = nx; b.y = ny; b.moving = 8; b.dx = dx; b.dy = dy;
  sfx('push');
  const hole = entAt(nx, ny, (e) => e.type === 'hole' && !e.filled);
  if (hole) { b.fall = true; }
  return true;
}
function afterBlockMove(b) {
  if (b.fall) {
    const hole = entAt(b.x, b.y, (e) => e.type === 'hole' && !e.filled);
    if (hole) { hole.filled = true; b.gone = true; S.flags['hole:' + S.map + ':' + hole.key] = true; sfx('bump'); F.shake = 6; }
  }
  checkPlates();
}

// ---------- player movement ----------
function tryMove(d) {
  const [dx, dy, dir] = DIRS[d], p = F.p;
  p.dir = dir;
  const nx = p.x + dx, ny = p.y + dy;
  const blk = entAt(nx, ny, (e) => e.type === 'block' && !e.moving);
  if (blk) {
    if (pushBlock(blk, dx, dy)) { startStep(nx, ny); return true; }
    return false;
  }
  if (blocked(nx, ny)) { if (F.frame % 20 === 0) sfx('bump'); return false; }
  startStep(nx, ny);
  return true;
}
function startStep(nx, ny) { const p = F.p; p.x = nx; p.y = ny; p.moving = true; }

function finishStep() {
  const p = F.p;
  p.moving = false; p.step++;
  S.x = p.x; S.y = p.y; S.dir = p.dir;
  if (F.busy) { p.slide = false; return; }
  S.steps++;
  if (F.onStep) F.onStep();
  // the monsters in a dungeon move when you move
  moveEnemies();
  const here = entsAt(p.x, p.y);
  for (const e of here) if (e.type === 'toggle') { F.toggle = !F.toggle; sfx('switch'); }
  // an enemy on the tile you stepped onto
  const foe = F.ents.find((e) => e.type === 'enemy' && !e.gone && !e.stun && e.x === p.x && e.y === p.y);
  if (foe && F.onTouchEnemy) { F.onTouchEnemy(foe); return; }
  for (const e of here) {
    if (e.type === 'warp') { F.onWarp && F.onWarp(e); return; }
    if (e.type === 'trigger' && !(e.once && S.flags[e.once])) { if (e.once) S.flags[e.once] = true; F.runScript(e.run, e); return; }
  }
  // ice keeps you sliding
  if (kindAt(p.x, p.y) === 'ice') {
    const [dx, dy] = DV[p.dir];
    if (!blocked(p.x + dx, p.y + dy) && !entAt(p.x + dx, p.y + dy, (e) => e.type === 'block')) { p.slide = true; startStep(p.x + dx, p.y + dy); sfx('slide'); return; }
  }
  p.slide = false;
  // random encounters on the world map
  if (F.map.enc && F.onEncounter) {
    const k = kindAt(p.x, p.y);
    const rate = k === 'oforest' ? 2 : k === 'oroad' ? 0.6 : 1;
    F.encCount -= rate;
    if (F.encCount <= 0) { F.encCount = 22 + Math.floor(Math.random() * 22); F.onEncounter(F.map.enc(p.x, p.y)); }
  }
}

function moveEnemies() {
  const p = F.p;
  for (const e of F.ents) {
    if (e.type !== 'enemy' || e.gone) continue;
    if (e.stun) { e.stun--; continue; }
    e.tick = (e.tick || 0) + 1;
    if (e.slow && e.tick % 2) continue;
    const dx = p.x - e.x, dy = p.y - e.y, dist = Math.abs(dx) + Math.abs(dy);
    let opts;
    if (dist <= (e.sight || 5)) {
      opts = [];
      if (dx) opts.push([Math.sign(dx), 0]);
      if (dy) opts.push([0, Math.sign(dy)]);
      if (Math.abs(dy) > Math.abs(dx)) opts.reverse();
    } else {
      const r = Math.floor(Math.random() * 6);
      opts = r < 4 ? [[[1, 0], [-1, 0], [0, 1], [0, -1]][r]] : [];
    }
    for (const [mx, my] of opts) {
      const nx = e.x + mx, ny = e.y + my;
      if (Math.abs(nx - e.hx) > (e.range || 4) || Math.abs(ny - e.hy) > (e.range || 4)) continue;
      const occupied = F.ents.some((o) => o !== e && !o.gone && o.x === nx && o.y === ny && (o.type === 'enemy' || entSolid(o) || o.type === 'warp' || o.type === 'hole'));
      if (!occupied && !solidKind(kindAt(nx, ny))) { e.x = nx; e.y = ny; e.dir = mx > 0 ? 'r' : mx < 0 ? 'l' : my > 0 ? 'd' : 'u'; break; }
    }
    if (e.x === p.x && e.y === p.y && F.onTouchEnemy) { F.onTouchEnemy(e); return; }
  }
}

// ---------- update ----------
let checkPowerSoon = false;
export function updateField() {
  F.frame++;
  if (checkPowerSoon) { checkPowerSoon = false; checkPower(); }
  if (F.banner > 0) F.banner--;
  if (F.shake > 0) F.shake--;
  const p = F.p;
  // glide the player
  if (p.moving) {
    const tx = p.x * 16, ty = p.y * 16, sp = p.slide ? 4 : SPEED;
    p.px += Math.sign(tx - p.px) * Math.min(sp, Math.abs(tx - p.px));
    p.py += Math.sign(ty - p.py) * Math.min(sp, Math.abs(ty - p.py));
    F.trail.unshift({ px: p.px, py: p.py, dir: p.dir });
    if (F.trail.length > 64) F.trail.pop();
    if (p.px === tx && p.py === ty) finishStep();
  }
  // blocks, enemies and scripted NPCs glide too
  for (const e of F.ents) {
    if (e.gone) continue;
    const tx = e.x * 16, ty = e.y * 16;
    if (e.px !== tx || e.py !== ty) {
      const sp = e.type === 'block' ? 2 : e.speed || 1;
      e.px += Math.sign(tx - e.px) * Math.min(sp, Math.abs(tx - e.px));
      e.py += Math.sign(ty - e.py) * Math.min(sp, Math.abs(ty - e.py));
      e.walking = true;
      if (e.px === tx && e.py === ty) { e.walking = false; if (e.type === 'block') { e.moving = 0; afterBlockMove(e); } if (e.onArrive) { const f = e.onArrive; e.onArrive = null; f(); } }
    }
    if (e.type === 'npc' && e.wander && !F.busy && !UI.active && !e.walking) {
      if (--e.mt <= 0) {
        e.mt = 60 + Math.floor(Math.random() * 120);
        const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
        const nx = e.x + dx, ny = e.y + dy;
        e.dir = dx > 0 ? 'r' : dx < 0 ? 'l' : dy > 0 ? 'd' : 'u';
        if (Math.abs(nx - e.home[0]) <= 2 && Math.abs(ny - e.home[1]) <= 2 && !blocked(nx, ny) && !(nx === p.x && ny === p.y) && !F.ents.some((o) => o !== e && !o.gone && o.x === nx && o.y === ny)) { e.x = nx; e.y = ny; }
      }
    }
  }
  if (F.busy || UI.active) { updateCam(); return; }
  if (!p.moving) {
    const d = input.dir();
    if (d && tryMove(d)) { /* moving */ }
    else if (input.pressed('a')) interact();
    else if (input.pressed('b') || input.pressed('menu')) F.onMenu && F.onMenu();
  }
  updateCam();
}
function interact() {
  const p = F.p, [dx, dy] = DV[p.dir];
  let tx = p.x + dx, ty = p.y + dy;
  // talk across a counter
  if (TILES[kindAt(tx, ty)] && kindAt(tx, ty) === 'counter') { tx += dx; ty += dy; }
  const pipe = F.ents.find((o) => !o.gone && o.x === tx && o.y === ty && o.type === 'pipe');
  if (pipe) { if (pipe.fixed) { sfx('buzz'); return; } pipe.rot = (pipe.rot + 1) % 4; sfx('switch'); checkPower(); return; }
  const e = F.ents.find((o) => !o.gone && o.x === tx && o.y === ty && ['npc', 'chest', 'save', 'sign', 'spring', 'boss', 'solid', 'sink', 'source', 'hearth', 'dig', 'vine', 'perch', 'bellpost'].includes(o.type) && (o.talk || ['chest', 'save', 'spring', 'hearth', 'dig', 'vine', 'perch', 'bellpost'].includes(o.type)));
  if (!e) return;
  if (e.type === 'npc') {
    // face the player
    e.dir = { u: 'd', d: 'u', l: 'r', r: 'l' }[p.dir];
  }
  F.runScript(e.talk || e.type, e);
}
function updateCam(snap) {
  const tx = F.p.px + 8 - W / 2, ty = F.p.py + 8 - H / 2 - 4;
  const mw = F.map.w * 16, mh = F.map.h * 16;
  F.cam.x = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, tx));
  F.cam.y = mh <= H ? (mh - H) / 2 : Math.max(0, Math.min(mh - H, ty));
  void snap;
}

// ---------- drawing ----------
const shadow = (() => { const c = canvas(14, 5); c.x.fillStyle = 'rgba(0,0,24,0.35)'; c.x.beginPath(); c.x.ellipse(7, 2.5, 7, 2.5, 0, 0, Math.PI * 2); c.x.fill(); return c; })();
export function drawField() {
  const cx = Math.round(F.cam.x) + (F.shake ? ((F.shake % 2) * 2 - 1) * 2 : 0), cy = Math.round(F.cam.y);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const fr = F.gfx.frames[Math.floor(F.frame / 20) % F.gfx.frames.length];
  ctx.drawImage(fr, -cx, -cy);
  // flat things under everyone
  const list = [];
  for (const e of F.ents) {
    if (e.gone) continue;
    const x = Math.round(e.px) - cx, y = Math.round(e.py) - cy;
    if (x < -48 || y < -64 || x > W + 32 || y > H + 32) continue;
    switch (e.type) {
      case 'plate': ctx.drawImage(plateArt(!!e.on), x, y); break;
      case 'hole': if (!e.filled) ctx.drawImage(holeArt(), x, y); break;
      case 'toggle': ctx.drawImage(toggleArt(F.toggle ? 1 : 0), x, y); break;
      case 'gate': if (!e.open) ctx.drawImage(gateArt(), x, y); break;
      default: list.push(e);
    }
  }
  // party: followers walk the leader's trail
  const party = F.hideParty ? [] : S.members.slice(0, F.solo ? 1 : 4); // cutscenes stand the others up as NPCs
  const p = F.p;
  const walk = p.moving || F.busy && p.walking;
  party.forEach((m, i) => {
    const t = i === 0 ? { px: p.px, py: p.py, dir: p.dir } : F.trail[Math.min(F.trail.length - 1, i * 8)];
    const dead = m.hp <= 0;
    list.push({ type: 'hero', sprite: m.id, px: t.px, py: t.py, dir: t.dir, walking: walk, order: -i, dead });
  });
  list.sort((a, b) => a.py - b.py || (a.order || 0) - (b.order || 0));
  for (const e of list) drawEnt(e, cx, cy);
  ctx.drawImage(F.gfx.upper, -cx, -cy);
  // caves get darker at the edges
  if (F.map.dark) {
    const g = ctx.createRadialGradient(p.px - cx + 8, p.py - cy + 4, 40, p.px - cx + 8, p.py - cy + 4, 170);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,10,${F.map.dark})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (F.map.tint) { ctx.fillStyle = F.map.tint; ctx.fillRect(0, 0, W, H); }
  // the place name when you arrive
  if (F.banner > 0 && F.def.name) {
    const a = Math.min(1, F.banner / 20, (150 - F.banner) / 12 + 0.01);
    const w = textW(F.def.name) + 28;
    ctx.globalAlpha = Math.max(0, a);
    windowBox((W - w) / 2, 14, w, 24);
    text(F.def.name, W / 2, 20, '#f8f8f8', { align: 'center' });
    ctx.globalAlpha = 1;
  }
}
function drawEnt(e, cx, cy) {
  const x = Math.round(e.px) - cx, y = Math.round(e.py) - cy;
  const anim = Math.floor(F.frame / 8) % 4;
  switch (e.type) {
    case 'hero': case 'npc': {
      if (e.hidden) return;
      const fr = sprite(e.sprite)[e.dir || 'd'];
      const k = e.walking || (e.type === 'npc' && e.walkAnim) ? anim : 0;
      ctx.drawImage(shadow, x + 1, y + 12);
      if (e.dead) { ctx.globalAlpha = 0.45; }
      ctx.drawImage(fr[k], x, y - 9 + (k % 2 ? -1 : 0) * 0);
      ctx.globalAlpha = 1;
      break;
    }
    case 'chest': ctx.drawImage(tileset('dungeon'), (e.open ? 3 : 2) * 16, 16, 16, 16, x, y, 16, 16); break;
    case 'hearth': { ctx.drawImage(tileset('house'), 31 * 16, 10 * 16, 16, 16, x, y, 16, 16); if (F.frame % 24 < 12) { ctx.fillStyle = '#f8a030'; ctx.fillRect(x + 6, y + 12, 4, 2); } ctx.fillStyle = 'rgba(255,255,255,0.5)'; const k = F.frame % 60; ctx.fillRect(x + 7 + Math.round(Math.sin(k / 9) * 2), y - k / 8, 2, 2); break; }
    case 'dig': if (!e.done) { ctx.fillStyle = 'rgba(70,40,20,0.55)'; ctx.fillRect(x + 4, y + 9, 8, 4); ctx.fillRect(x + 3, y + 10, 10, 2); if ((F.frame + e.x * 7) % 50 < 8) { ctx.fillStyle = '#fff8c0'; ctx.fillRect(x + 7, y + 6, 2, 2); ctx.fillRect(x + 5, y + 8, 1, 1); ctx.fillRect(x + 10, y + 8, 1, 1); } } break;
    case 'vine': for (let k = 0; k < 16; k += 2) { ctx.fillStyle = k % 4 ? '#3a8a38' : '#58b048'; ctx.fillRect(x + 7 + Math.round(Math.sin((k + e.x) / 3) * 2), y + k - 8, 2, 2); if (k % 6 === 0) { ctx.fillStyle = '#78c858'; ctx.fillRect(x + 9 + Math.round(Math.sin((k + e.x) / 3) * 2), y + k - 8, 3, 2); } } break;
    case 'perch': ctx.fillStyle = '#6a3c1c'; ctx.fillRect(x + 7, y - 4, 2, 18); ctx.fillStyle = '#a06030'; ctx.fillRect(x + 2, y - 4, 12, 2); ctx.fillStyle = '#f8e070'; ctx.fillRect(x + 3, y - 6, 2, 2); break;
    case 'bellpost': { ctx.fillStyle = '#5a3418'; ctx.fillRect(x + 2, y - 6, 2, 20); ctx.fillRect(x + 12, y - 6, 2, 20); ctx.fillRect(x + 1, y - 8, 14, 2); ctx.fillStyle = S.flags[e.flag] ? '#a08040' : '#f8d040'; const sw = e.swing ? Math.round(Math.sin(F.frame / 3) * 2) : 0; ctx.fillRect(x + 6 + sw, y - 6, 4, 5); ctx.fillStyle = '#806010'; ctx.fillRect(x + 7 + sw, y - 1, 2, 1); break; }
    case 'block': ctx.drawImage(blockArt(), x, y); break;
    case 'post': ctx.drawImage(postArt(e.color, (e.color === 'r') !== F.toggle), x, y - 6); break;
    case 'save': { const b = Math.round(Math.sin(F.frame / 15) * 2); ctx.drawImage(shadow, x + 1, y + 12); ctx.drawImage(crystalArt(), x, y - 10 + b); if (F.frame % 40 < 20) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 4 + (F.frame % 7), y - 8 + b + (F.frame % 11), 1, 1); } break; }
    case 'spring': ctx.drawImage(springArt(), x, y); if (F.frame % 30 < 15) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 5 + (F.frame % 5), y + 6, 1, 1); } break;
    case 'icon': { const a = iconArt(e.icon); ctx.drawImage(a, x + 8 - a.width / 2, y + 16 - a.height); break; }
    case 'enemy': {
      const a = miniArt(e.art, e.hue || 0), b = Math.abs(Math.sin((F.frame + e.n * 13) / 10)) * 2;
      if (e.stun && F.frame % 4 < 2) break;
      ctx.drawImage(shadow, x + 1, y + 12);
      ctx.drawImage(e.dir === 'r' ? flipped(e.art, a) : a, Math.round(x + 8 - a.width * fineOf(a) / 2), Math.round(y + 14 - a.height * fineOf(a) - b), a.width * fineOf(a), a.height * fineOf(a));
      break;
    }
    case 'boss': { const a = enemyArt(e.art, e.hue || 0), s = a.fs ? fine(30 / a.height) : e.scale || 0.5, w = a.width * s, h = a.height * s; ctx.drawImage(a, Math.round(x + 8 - w / 2), Math.round(y + 16 - h + Math.sin(F.frame / 20) * 2), w, h); break; }
    case 'pipe': ctx.drawImage(pipeArt(e.shape, e.rot, !!e.lit, (F.frame >> 3) % 2, !!e.fixed), x, y); break;
    case 'source': ctx.drawImage(sourceArt((F.frame >> 2) % 3), x, y - 4); break;
    case 'sink': ctx.drawImage(sinkArt(!!e.lit, (F.frame >> 3) % 2), x, y - 4); break;
    case 'sprite': if (e.draw) e.draw(ctx, x, y, F.frame); break;
    case 'sign': if (e.sprite === 'stone') { ctx.drawImage(stoneArt(), x, y - 4); if (F.frame % 50 < 25) { ctx.fillStyle = '#c0fff8'; ctx.fillRect(x + 6 + (F.frame % 3), y - 2, 1, 1); } } break;
    default: break;
  }
}
const flipCache = new Map();
function flipped(k, a) { if (!flipCache.has(k)) { const c = canvas(a.width, a.height); c.x.translate(a.width, 0); c.x.scale(-1, 1); c.x.drawImage(a, 0, 0); flipCache.set(k, c); } return flipCache.get(k); }

// ---------- script helpers ----------
// walk an NPC (or the leader, with e = 'player') along a path of directions: 'uuddlr'
export function walkEnt(e, path, speed = 1) {
  return new Promise((res) => {
    const steps = path.split('');
    const next = () => {
      const d = steps.shift();
      if (!d) { e.walkAnim = false; res(); return; }
      const [dx, dy] = DV[d];
      e.dir = d; e.x += dx; e.y += dy; e.speed = speed; e.walkAnim = true;
      e.onArrive = next;
    };
    next();
  });
}
export function walkPlayer(path) {
  return new Promise((res) => {
    const steps = path.split('');
    const p = F.p;
    const tick = () => {
      if (p.moving) { requestAnimationFrame(tick); return; }
      const d = steps.shift();
      if (!d) { p.walking = false; res(); return; }
      const [dx, dy] = DV[d];
      p.dir = d; p.walking = true; startStep(p.x + dx, p.y + dy);
      requestAnimationFrame(tick);
    };
    tick();
  });
}
export function faceTo(e, d) { e.dir = d; }
export function findEnt(id) { return F.ents.find((e) => e.id === id || e.name === id); }
void hash;
