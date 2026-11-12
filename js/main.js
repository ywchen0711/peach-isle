// Boot, the main loop, the title screen (a peach drifting down the river under falling blossoms),
// screen transitions, and the glue between the field, battles, menus and story scripts.
import { ctx, W, H, canvas, text, textW, windowBox, HAND, tint, fromGrid } from './gfx.js';
import * as gfx from './gfx.js';
import { input, pollInput, endInput, setupTouch } from './input.js';
import { initAudio, playMusic, stopMusic, sfx, currentSong } from './audio.js';
import { UI, uiTick, say, talk, ask, wait, menu, notice, wrap } from './ui.js';
import { S, reset, addMember, addItem, fullHeal, save, load, hasSave, setSpellNamer, stats } from './party.js';
import { SPELLS, GROUPS, TROOPS } from './data.js';
import './data2.js';
import { ENEMIES as ENEMIES_ } from './data.js';
import { MAPS } from './maps.js';
import './maps2.js';
import { F, setMaps, loadMap, updateField, drawField, walkEnt, walkPlayer, findEnt } from './field.js';
import { renderMap, solidKind } from './tiles.js';
import { startBattle, updateBattle, drawBattle, _B } from './battle.js';
import { fieldMenu, shop, loadSettings } from './menu.js';
import { SCRIPTS } from './story.js';
import { hearts } from './story2.js';
import { sprite } from './sprites.js';
import { tileset } from './assets.js';
import { L, LANG, isEn, setLang, onLang } from './i18n.js';

setMaps(MAPS);
// the page itself follows the language too
function pageLang() {
  document.documentElement.lang = isEn() ? 'en' : 'zh-Hant';
  const mb = document.getElementById('menuBtn'); if (mb) mb.textContent = L('選單', 'MENU');
}
pageLang();
onLang(pageLang);
setSpellNamer((s) => SPELLS[s].name);
loadSettings();

// worlds are built lazily with the flags of the moment
for (const m of Object.values(MAPS)) { const b = m.build; m.build = () => b(S.flags); }

let scene = 'boot';
const G = (window.G = { S, F, get scene() { return scene; }, SCRIPTS });

// ---------- transitions ----------
const T = { dark: 0, col: '#000', mosaic: 0, job: null };
function trans(kind, n = 16, col = '#000') {
  return new Promise((res) => { T.job = { kind, n, t: 0, res }; T.col = col; });
}
function updateTrans() {
  const j = T.job;
  if (!j) return;
  j.t++;
  const k = Math.min(1, j.t / j.n);
  if (j.kind === 'out') T.dark = Math.ceil(k * 15) / 15;
  if (j.kind === 'in') T.dark = Math.floor((1 - k) * 15) / 15;
  if (j.kind === 'battle') { T.mosaic = Math.floor(k * 12); T.dark = k > 0.6 ? (k - 0.6) / 0.4 : 0; T.flash = j.t < 12 && j.t % 4 < 2; }
  if (j.t >= j.n) { T.job = null; T.mosaic = 0; T.flash = false; if (j.kind === 'battle') T.dark = 1; j.res(); }
}
function drawTrans() {
  if (T.mosaic > 1) {
    const m = T.mosaic + 1, small = canvas(Math.ceil(W / m), Math.ceil(H / m));
    small.x.drawImage(ctx.canvas, 0, 0, small.width, small.height);
    ctx.drawImage(small, 0, 0, small.width * m, small.height * m);
  }
  if (T.flash) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0, 0, W, H); }
  if (T.dark > 0) { ctx.globalAlpha = T.dark; ctx.fillStyle = T.col; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.globalAlpha = Math.min(1, FX.flash / FX.flashN); ctx.fillStyle = FX.flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}
const FX = { flash: 0, flashN: 1, flashCol: '#fff' };

// ---------- the toolbox handed to story scripts ----------
const mapMusic = () => (F.map && F.map.music) || F.def.music;
const E = {
  say, talk, ask, wait, sfx,
  music: (n) => (n ? playMusic(n) : stopMusic(0.6)),
  ent: (id) => findEnt(id),
  walk: (e, path, sp) => walkEnt(e, path, sp),
  walkPlayer,
  join(id, ent) { addMember(id); S.flags[id] = true; if (ent) ent.gone = true; sfx('level'); },
  give(id, n = 1) { addItem(id, n); },
  heal: fullHeal,
  save: () => save(0),
  async rest(msg, name = null) {
    await trans('out', 20);
    playMusic('home', { restart: true });
    fullHeal();
    await wait(170);
    playMusic(mapMusic());
    await trans('in', 20);
    await say(name, msg);
  },
  shop,
  battle: (troop, opts) => runBattle(troop, opts),
  openGates(flag) { for (const e of F.ents) if (e.type === 'gate' && e.flag === flag) e.open = true; S.flags[flag] = true; sfx('gate'); F.shake = 12; },
  removeEnt(x) { const e = typeof x === 'string' ? findEnt(x) : x; if (e) e.gone = true; },
  spawn(e) { const o = { px: e.x * 16, py: e.y * 16, ...e }; F.ents.push(o); return o; },
  flash(col, n) { FX.flash = n; FX.flashN = n; FX.flashCol = col; },
  shake(n) { F.shake = n; },
  async warp(to, x, y, dir) { await warpTo(to, x, y, dir); },
  async resetPuzzle() { await trans('out', 12); loadMap(S.map, F.p.x, F.p.y, F.p.dir); F.banner = 0; await trans('in', 12); },
  async reloadWorld() { await trans('out', 20); loadMap('world', F.p.x, F.p.y, F.p.dir); await trans('in', 30); },
  ending: () => ending(),
  menu,
  hideParty(on) { F.hideParty = on; },
  mapId: () => S.map,
  entById: (id) => F.ents.find((e) => e.id === id && !e.gone),
  reloadWorldSoon() { /* the world map is rebuilt with the current flags every time you step onto it */ },
  // a small window under a menu explaining the highlighted line
  hint(s) { if (!s) return; windowBox(8, H - 34, W - 16, 28); text(s, 18, H - 27, '#f8e8c0'); },
  async fadeTo(to, x, y, dir) { await trans('out', 30); loadMap(to, x, y, dir); F.banner = 0; playMusic(mapMusic()); await trans('in', 30); },
  async fadeText(s) { await trans('out', 40); caption.s = s; caption.t = 0; await wait(150); caption.s = ''; await trans('in', 40); },
  async reload() { await trans('out', 16, '#ffffff'); loadMap(S.map, F.p.x, F.p.y, F.p.dir); F.banner = 0; T.col = '#ffffff'; await trans('in', 30, '#ffffff'); T.col = '#000'; },
  // cutscene helpers
  night(tint) { F.map.tint = tint === undefined ? 'rgba(8,16,64,0.42)' : tint; },
  solo(on) { F.solo = on; },
  leave(id) { const i = S.members.findIndex((m) => m.id === id); if (i >= 0) S.members.splice(i, 1); },
  has: (id) => !!S.members.find((m) => m.id === id),
  get p() { return F.p; },
};
F.E = E;
F.runScript = async (name, ent) => {
  const fn = SCRIPTS[name];
  if (!fn) { console.warn('no script', name); return; }
  F.busy = true;
  try { await fn(E, ent); } catch (err) { console.error(err); }
  F.busy = false;
};
F.onWarp = async (w) => {
  F.busy = true;
  sfx(w.to.startsWith('cave') || w.to.startsWith('tower') ? 'stairs' : 'door');
  await warpTo(w.to, w.tx, w.ty, w.dir);
  F.busy = false;
};
F.onMenu = async () => {
  F.busy = true; sfx('ok');
  await fieldMenu({ canSave: !!(F.def.safe || F.def.world) });
  F.busy = false;
};
F.onEncounter = async (zone) => {
  F.busy = true;
  const table = GROUPS[zone], total = table.reduce((s, [w]) => s + w, 0);
  let r = Math.random() * total, troop = table[0][1];
  for (const [w, t] of table) { r -= w; if (r <= 0) { troop = t; break; } }
  await runBattle(troop, { bg: { hills: 'mountain', coast: 'shore', sea: 'sea', islet: 'islet', postworld: 'fog' }[zone] || 'field' });
  F.busy = false;
};
F.onTouchEnemy = async (foe) => {
  F.busy = true;
  const r = await runBattle(foe.troop, { bg: F.def.bg || 'field' });
  if (r === 'win') foe.gone = true;
  else { foe.stun = 4; }
  F.busy = false;
};
F.onStep = () => {
  // poison nibbles while walking
  if (S.steps % 4 === 0) for (const m of S.members) if (m.status.poison && m.hp > 1) { m.hp--; FX.flash = 3; FX.flashN = 6; FX.flashCol = '#a040c0'; }
};

async function warpTo(to, x, y, dir) {
  await trans('out', 14);
  loadMap(to, x, y, dir);
  playMusic(mapMusic());
  await trans('in', 14);
}
async function runBattle(troop, opts = {}) {
  sfx('encounter');
  stopMusic();
  await trans('battle', 36);
  scene = 'battle';
  T.dark = 0;
  const r = await startBattle(troop, opts);
  // the dojo: losing there only hurts your pride
  if (r === 'lose' && opts.safe) { for (const m of S.members) m.hp = Math.max(1, m.hp); }
  else if (r === 'lose') { gameOver(); return new Promise(() => {}); }
  scene = 'field';
  T.dark = 1;
  playMusic(mapMusic(), { restart: true });
  await trans('in', 16);
  return r;
}

// ---------- title ----------
const caption = { s: '', t: 0 };
function buildTitle() { /* everything on the title is drawn live from the tilesets */ }
const petals = Array.from({ length: 40 }, (_, i) => ({ x: (i * 53) % W, y: (i * 37) % H, s: 0.3 + (i % 5) * 0.12, w: (i * 13) % 7 }));
function drawTitleScene(t) {
  const horizon = 120;
  for (let y = 0; y < horizon; y++) { const k = Math.floor((y / horizon) * 10) / 9; ctx.fillStyle = `rgb(${Math.round(248 - k * 40)},${Math.round(176 + k * 40)},${Math.round(190 + k * 30)})`; ctx.fillRect(0, y, W, 1); }
  // far hills in mist, then a line of peach trees on the far bank
  for (let x = 0; x < W; x++) { const h = 22 + Math.sin(x * 0.03) * 8 + Math.sin(x * 0.013 + 2) * 10; ctx.fillStyle = '#c890b0'; ctx.fillRect(x, horizon - h, 1, h); }
  for (let x = 0; x < W; x++) { const h = 10 + Math.sin(x * 0.05 + 1) * 5; ctx.fillStyle = '#a87898'; ctx.fillRect(x, horizon - h, 1, h); }
  const nat = tileset('nature'), fl = tileset('floor'), wa = tileset('water');
  for (let x = 0; x < W; x += 16) ctx.drawImage(fl, 0, 12 * 16, 16, 16, x, horizon - 4, 16, 16);
  for (let x = -6, k = 0; x < W; x += 26 + (k * 7) % 10, k++) ctx.drawImage(nat, (k % 3 === 1 ? 16 : 14) * 16, 0, 32, 32, x, horizon - 30, 32, 32);
  // the river, sliding past
  const off = Math.floor(t / 3) % 16;
  for (let y = horizon + 12; y < H - 26; y += 16) for (let x = -16; x < W + 16; x += 16) ctx.drawImage(wa, 16, 16, 16, 16, x + off, y, 16, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let k = 0; k < 24; k++) { const x = (k * 41 + t * 0.6) % (W + 20) - 10, y = horizon + 18 + (k * 23) % 60; ctx.fillRect(Math.round(x), y, 4 + (k % 3) * 2, 1); }
  for (let x = 0; x < W; x += 16) ctx.drawImage(fl, 0, 12 * 16, 16, 16, x, H - 26, 16, 16), ctx.drawImage(fl, 0, 12 * 16, 16, 16, x, H - 12, 16, 16);
  // the peach
  const px = W / 2 + 60 + Math.sin(t / 120) * 24, py = horizon + 62 + Math.sin(t / 22) * 2;
  ctx.fillStyle = 'rgba(40,60,120,0.35)'; ctx.beginPath(); ctx.ellipse(px, py + 14, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e88aa0'; ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f8a8bc'; ctx.beginPath(); ctx.arc(px - 2, py - 2, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd8e0'; ctx.beginPath(); ctx.arc(px - 7, py - 7, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d06888'; ctx.fillRect(Math.round(px) + 1, Math.round(py) - 15, 1, 26);
  ctx.fillStyle = '#4a9038'; ctx.beginPath(); ctx.ellipse(px + 8, py - 16, 8, 3, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6ab048'; ctx.fillRect(Math.round(px) + 4, Math.round(py) - 18, 6, 1);
  // falling petals
  for (const p of petals) { const y = (p.y + t * p.s) % (H + 10) - 5, x = (p.x + Math.sin((t + p.w * 40) / 40) * 12 + t * 0.15) % (W + 10) - 5; ctx.fillStyle = p.w % 2 ? '#fff0f4' : '#f8b8c8'; ctx.fillRect(Math.round(x), Math.round(y), 2, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1); }
}
function bigText(s, x, y, top, bot, scale = 2) {
  const w = textW(s) + 4, c = canvas(w, 16);
  c.x.drawImage(gfx.glyphs ? gfx.glyphs(s, '#ffffff') : canvas(1, 1), 1, 0);
  const id = c.x.getImageData(0, 0, w, 16), d = id.data;
  for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < w; xx++) {
    const i = (yy * w + xx) * 4;
    if (d[i + 3] > 110) { const t = yy / 14, a = top, b = bot; d[i] = a[0] + (b[0] - a[0]) * t; d[i + 1] = a[1] + (b[1] - a[1]) * t; d[i + 2] = a[2] + (b[2] - a[2]) * t; d[i + 3] = 255; } else d[i + 3] = 0;
  }
  c.x.putImageData(id, 0, 0);
  const o = canvas(w + 2, 18);
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2], [2, 2]]) o.x.drawImage(tint(c, '#101030'), dx, dy);
  o.x.drawImage(c, 1, 1);
  ctx.drawImage(o, Math.round(x - (o.width * scale) / 2), y, o.width * scale, o.height * scale);
}
const title = { t: 0, sel: 0, ready: false };
function updateTitle() {
  title.t++;
  if (!title.ready) { if (input.anyPressed()) { title.ready = true; sfx('ok'); } return; }
  if (UI.active || T.job) return;
  const opts = titleOpts();
  if (input.repeat('down')) { title.sel = (title.sel + 1) % opts.length; sfx('cursor'); }
  if (input.repeat('up')) { title.sel = (title.sel + opts.length - 1) % opts.length; sfx('cursor'); }
  if (input.pressed('a')) {
    if (opts[title.sel].disabled) { sfx('buzz'); return; }
    sfx('ok');
    if (opts[title.sel].id === 'new') newGame();
    else if (opts[title.sel].id === 'lang') setLang(LANG === 'en' ? 'zh' : 'en');
    else continueGame();
  }
  if (input.pressed('b')) title.ready = false;
}
const titleOpts = () => [{ id: 'new', label: L('新的冒險', 'New Game') }, { id: 'cont', label: L('繼續冒險', 'Continue'), disabled: !hasSave(0) }, { id: 'lang', label: LANG === 'en' ? 'Language: English' : '語言：中文' }];
function drawTitle() {
  const t = title.t;
  drawTitleScene(t);
  if (isEn()) {
    bigText('PEACHLING', W / 2, 12, [255, 250, 240], [240, 120, 150], 3);
    bigText('and the Oni Isle', W / 2, 56, [255, 244, 220], [200, 80, 90], 2);
    text('桃源鬼島記', W / 2, 94, '#fff4f0', { align: 'center', shadow: '#602030' });
  } else {
    bigText('桃源鬼島記', W / 2, 20, [255, 250, 240], [240, 120, 150], 3);
    text('PEACHLING AND THE ONI ISLE', W / 2, 76, '#fff4f0', { align: 'center', shadow: '#602030' });
  }
  if (!title.ready) {
    if ((t >> 5) % 2) text('PRESS START', W / 2 - 40, 150, '#ffffff', { align: 'center', shadow: '#203060' });
    text(L('Z 決定　X 取消／選單　方向鍵 移動', 'Z: OK   X: Cancel/Menu   Arrows: Move'), W / 2, H - 30, '#ffffff', { align: 'center', shadow: '#203060' });
  } else {
    const opts = titleOpts();
    windowBox(66, 136, 124, 64);
    opts.forEach((o, i) => text(o.label, 90, 144 + i * 18, o.disabled ? '#8088a8' : '#f8f8f8'));
    ctx.drawImage(HAND, 74 + ((t >> 3) % 2), 145 + title.sel * 18);
  }
  text(L('© 2026 原創作品', '© 2026 An original game'), W / 2, H - 14, '#ffffff', { align: 'center', shadow: '#203018' });
}

// ---------- prologue ----------
const PROLOGUE_ZH = [
  '從前從前。',
  '',
  '海的東邊，有一座島。',
  '島上長著一棵永遠開花的桃樹，',
  '人們叫它「神木」。',
  '',
  '十五年前的一個春天，',
  '神木的花，一夜之間全謝了。',
];
const PROLOGUE_EN = [
  'Long, long ago.',
  '',
  'Across the eastern sea there was an island,',
  'where a peach tree bloomed all year round.',
  'People called it the sacred tree.',
  '',
  'One spring, fifteen years ago,',
  'its blossoms all fell in a single night.',
];
const prologue = () => (isEn() ? PROLOGUE_EN : PROLOGUE_ZH);
const intro = { t: 0 };
async function newGame() {
  await trans('out', 30);
  reset();
  addMember('momo');
  scene = 'intro'; intro.t = 0;
  T.dark = 0;
}
function updateIntro() {
  intro.t++;
  const done = intro.t > prologue().length * 50 + 200;
  if ((input.pressed('a') || input.pressed('b') || done) && !T.job && !intro.leaving) {
    intro.leaving = true;
    (async () => {
      await trans('out', 30);
      intro.leaving = false;
      scene = 'field';
      loadMap('river', 14, 3, 'l');
      F.hideParty = true; F.banner = 0;
      playMusic('story');
      await trans('in', 30);
      F.runScript('rv_intro');
    })();
  }
}
function drawIntro() {
  ctx.fillStyle = '#1a0c14'; ctx.fillRect(0, 0, W, H);
  for (const p of petals) { const y = (p.y + intro.t * p.s * 0.6) % (H + 10) - 5, x = (p.x + Math.sin((intro.t + p.w * 40) / 40) * 10) % W; ctx.fillStyle = p.w % 2 ? '#806070' : '#c07890'; ctx.fillRect(Math.round(x), Math.round(y), 2, 1); }
  prologue().forEach((l, i) => {
    const a = Math.max(0, Math.min(1, (intro.t - i * 50) / 40));
    if (a <= 0) return;
    ctx.globalAlpha = a;
    text(l, W / 2, 16 + i * 16, '#e8e8f8', { align: 'center' });
  });
  ctx.globalAlpha = 1;
}

// ---------- continue / game over ----------
async function continueGame() {
  await trans('out', 20);
  if (!load(0)) { await trans('in', 10); return; }
  scene = 'field';
  loadMap(S.map, S.x, S.y, S.dir);
  playMusic(mapMusic());
  await trans('in', 20);
}
const over = { t: 0 };
function gameOver() {
  scene = 'over'; over.t = 0; T.dark = 0; UI.clear(); F.busy = false;
  playMusic('gameover', { restart: true });
}
function updateOver() {
  over.t++;
  if (over.t > 90 && input.pressed('a') && !T.job) {
    (async () => { await trans('out', 30); scene = 'title'; title.ready = false; playMusic('title'); await trans('in', 30); })();
  }
}
function drawOver() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const a = Math.min(1, over.t / 60);
  ctx.globalAlpha = a;
  bigText('GAME OVER', W / 2, 80, [248, 96, 96], [160, 24, 40], 2);
  text(L('冒險在這裡結束了……', 'Your adventure ends here...'), W / 2, 130, '#c0c0d0', { align: 'center' });
  if (over.t > 90 && (over.t >> 5) % 2) text(L('按 Z 回到標題畫面', 'Press Z to return to the title'), W / 2, 170, '#f8f8f8', { align: 'center' });
  ctx.globalAlpha = 1;
}

// ---------- ending ----------
async function ending() {
  await trans('out', 80, '#ffffff');
  T.col = '#ffffff';
  loadMap('river', 14, 3, 'l');
  F.banner = 0; F.hideParty = true;
  playMusic('ending', { restart: true });
  await trans('in', 80, '#ffffff');
  T.col = '#000';
  await wait(30);
  F.busy = true;
  if (S.flags.trueEnding) playMusic('trueend', { restart: true });
  try { await (S.flags.trueEnding ? SCRIPTS.epilogueTrue : SCRIPTS.epilogue)(E); } catch (err) { console.error(err); }
  F.busy = false;
  await wait(40);
  await trans('out', 60);
  F.hideParty = false;
  scene = 'credits'; credits.t = 0;
  T.dark = 0;
  // after the credits the adventure carries on: everyone is home in Kibi, and the bottom of the night is open
  S.flags.cleared = true; fullHeal();
  Object.assign(S, { map: 'kibi', x: 5, y: 8, dir: 'd' });
  save(1); save(0);
}
const CREDITS_ZH = [
  ['桃源鬼島記', 'big'], [''], ['PEACHLING AND THE ONI ISLE'], [''], [''],
  ['— 登場人物 —', 'y'], ['桃丸　從桃子裡生的孩子'], ['小白　獵人源治的狗'], ['棗　猿啼山的母猴'], ['雉　不敢飛的雉雞'], [''],
  ['梅奶奶　竹爺爺'], ['茜　守護神木的巫女'], ['剛鬼　鬼的將軍'], ['焰丸　守護火之根的赤鬼'], ['影丸　源治撿回來的孩子'], ['汐音　龍宮的公主'], ['赤天狗　青天狗　海坊主'], ['狸大王　海龍蒼淵　炎王'], ['黑鐵大將　青鬼大將'], ['玄冥　被逐出的守木人'], ['黍之里、潮見港、鬼之島'], ['焰之鄉、雲之里與龍宮的人們'], [''], [''],
  ['美術、音樂、效果'], ['Ninja Adventure Asset Pack'], ['by Pixel-boy & AAA (CC0)'], [''], ['故事、程式'], ['原創作品'], [''], ['字型：俐方體11號 (Cubic 11)'], [''], [''],
  ['神木又開花了。'], ['每年春天，'], ['桃子都會順著河漂回家。'], [''], [''],
  ['感謝你的遊玩！', 'y'], [''], [''], ['—— 完 ——', 'big'],
];
const CREDITS_TRUE_ZH = ['神木用好多好多人的心醒來了。', '桃丸留在了黍之里，', '每年春天，和大家一起吃糰子。'];
const CREDITS_TRUE_EN = ['The sacred tree woke on many, many hearts.', 'Momomaru stayed in Kibi,', 'and every spring he eats dumplings with everyone.'];
const CREDITS_EN = [
  ['PEACHLING', 'big'], [''], ['and the Oni Isle'], [''], ['桃源鬼島記'], [''], [''],
  ['- CAST -', 'y'], ['Momomaru - the boy born from a peach'], ["Shiro - Genji the hunter's dog"], ['Natsume - a monkey of the mountain'], ['Kiji - the pheasant who would not fly'], [''],
  ['Granny Ume   Grandpa Take'], ['Akane - keeper of the sacred tree'], ['Goki - general of the oni'], ['Homuramaru - the red oni of the fire root'], ['Kagemaru - the boy Genji took in'], ['Shione - princess of the Dragon Palace'], ['The Red Tengu   The Blue Tengu'], ['The Umibozu   The Tanuki King'], ['Soen the Sea Dragon   The Flame King'], ['Lord Kurogane   The Blue General'], ['Genmei - the banished tree-keeper'], ['and the people of Kibi, Shiomi,'], ['the Oni Isle, Homura, the clouds'], ['and the Dragon Palace'], [''], [''],
  ['Art, music and effects'], ['Ninja Adventure Asset Pack'], ['by Pixel-boy & AAA (CC0)'], [''], ['Story and code'], ['an original game'], [''], ['Font: Cubic 11'], [''], [''],
  ['The sacred tree blooms again.'], ['And every spring'], ['a peach floats home down the river.'], [''], [''],
  ['THANK YOU FOR PLAYING!', 'y'], [''], [''], ['THE END', 'big'],
];
// the true ending says something else at the close
const creditList = () => {
  const base = isEn() ? CREDITS_EN : CREDITS_ZH;
  if (!S.flags.trueEnding) return base;
  const i = base.findIndex(([t]) => t === (isEn() ? 'The sacred tree blooms again.' : '神木又開花了。'));
  return [...base.slice(0, i), ...(isEn() ? CREDITS_TRUE_EN : CREDITS_TRUE_ZH).map((t) => [t]), ...base.slice(i + 3)];
};
const credits = { t: 0 };
function updateCredits() {
  credits.t++;
  const end = creditList().length * 18 * 2 + H * 2;
  if ((credits.t > end && input.pressed('a')) && !T.job) {
    (async () => { await trans('out', 40); scene = 'title'; title.ready = false; playMusic('title'); await trans('in', 40); })();
  }
}
function drawCredits() {
  ctx.fillStyle = '#000010'; ctx.fillRect(0, 0, W, H);
  const y0 = H - credits.t / 2;
  const list = creditList();
  list.forEach(([s, k], i) => {
    let y = y0 + i * 18;
    if (k === 'big' && i === list.length - 1) y = Math.max(y, 90);
    if (y < -20 || y > H) return;
    if (k === 'big') bigText(s, W / 2, y - 6, [255, 248, 200], [240, 160, 48], 2);
    else text(s, W / 2, y, k === 'y' ? '#f8e070' : '#e8e8f8', { align: 'center' });
  });
  // the four friends walk along the riverbank below
  ctx.fillStyle = '#3a8848'; ctx.fillRect(0, H - 22, W, 22);
  S.members.forEach((m, i) => { const fr = sprite(m.id).r[Math.floor(credits.t / 8) % 4]; ctx.drawImage(fr, ((credits.t * 0.5 + 40 - i * 20) % (W + 80)) - 40, H - 34); });
}

// ---------- the loop ----------
let acc = 0, last = performance.now();
function step() {
  pollInput();
  uiTick();
  updateTrans();
  if (FX.flash > 0) FX.flash--;
  if (scene === 'field' || scene === 'battle') S.time++;
  const uiOwned = UI.active;
  if (uiOwned) UI.update();
  switch (scene) {
    case 'title': updateTitle(); break;
    case 'intro': updateIntro(); break;
    case 'field': if (!T.job) updateField(); else F.frame++; break;
    case 'battle': updateBattle(); break;
    case 'over': updateOver(); break;
    case 'credits': updateCredits(); break;
  }
  endInput();
}
function draw() {
  switch (scene) {
    case 'boot': ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); text('Loading…', W / 2, H / 2 - 6, '#fff', { align: 'center' }); break;
    case 'title': drawTitle(); break;
    case 'intro': drawIntro(); break;
    case 'field': drawField(); break;
    case 'battle': drawBattle(); break;
    case 'over': drawOver(); break;
    case 'credits': drawCredits(); break;
  }
  UI.draw();
  drawTrans();
  if (caption.s) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); text(caption.s, W / 2, H / 2 - 6, '#f8e8f0', { align: 'center' }); }
}
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  let n = 0;
  while (acc >= 1000 / 60 && n < 4) { step(); acc -= 1000 / 60; n++; }
  if (n) { draw(); if (gfx.present) gfx.present(!document.body.classList.contains('noscan')); }
  requestAnimationFrame(frame);
}

// audio needs a user gesture
const unlock = () => initAudio();
addEventListener('keydown', unlock); addEventListener('pointerdown', unlock); addEventListener('touchstart', unlock);

async function boot() {
  try { await document.fonts.load(FONTSPEC); } catch (e) { /* fall back */ }
  await new Promise((r) => setTimeout(r, 30));
  buildTitle();
  setupTouch();
  scene = 'title';
  playMusic('title');
  window.READY = 1;
}
const FONTSPEC = '12px Cubic11';
requestAnimationFrame(frame);
boot();

// debugging hooks for automated checks
G.hearts = hearts; G.solidKind = solidKind; G.MAPS = MAPS; G.ENEMIES = ENEMIES_;
G.T = T; G._B = _B; G.UI = UI; G.newGame = newGame; G.continueGame = continueGame; G.loadMap = loadMap; G.trans = trans; G.runBattle = runBattle; G.E = E; G.addMember = addMember; G.stats = stats;
G.go = (map, x, y) => { scene = 'field'; T.dark = 0; if (x === undefined) { const m = MAPS[map].build(S.flags); [x, y] = m.entry || [Math.floor(m.w / 2), m.h - 2]; } loadMap(map, x, y, 'd'); playMusic(MAPS[map].music); };
void menu; void notice; void currentSong; void fromGrid; void wrap; void TROOPS;
