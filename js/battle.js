// Turn-based battles seen from the side: the monsters on the left, Momomaru and his friends on the right,
// over a backdrop built from the same tiles as the place you were walking. Oni can be talked out of
// fighting, and the four friends can strike together once their bond is strong enough.
import { ctx, W, H, canvas, text, textW, windowBox, HAND, HAND_D, tint, bar, ramp, hash, bayer, snes, hex, rgb } from './gfx.js';
import { sprite } from './sprites.js';
import { fine } from './gfx.js';
import { enemyArt, bossArt } from './enemies.js';
import { ENEMIES, TECHS, SPELLS, SPECIALS, ITEMS, HEROES } from './data.js';
import { tileset } from './assets.js';
import { L, isEn } from './i18n.js';
import { S, stats, spellsOf, gainExp, addItem, count } from './party.js';
import { physical, magic, healAmount, foeAction } from './rules.js';
import { input } from './input.js';
import { sfx, playMusic } from './audio.js';
import { UI, menu, uiTick, wrap } from './ui.js';

let B = null;
export const isBattle = () => !!B;

// ---------- backdrops ----------
// sky, a row of trees or a wall on the horizon, and ground, all cut from the map tilesets
const bgCache = {};
const BG = {
  field: { sky: ['#5890e0', '#b8e0f8'], ground: ['floor', 0, 12], back: [['nature', 16, 0, 2, 2], ['nature', 18, 0, 2, 2], ['nature', 14, 0, 2, 2]] },
  forest: { sky: ['#1c3a2c', '#4a7a50'], ground: ['floor', 11, 12], back: [['nature', 0, 2, 4, 3], ['nature', 4, 2, 4, 3]], dim: 0.18 },
  peach: { sky: ['#e8a0b8', '#f8e0e8'], ground: ['floor', 0, 12], back: [['nature', 14, 0, 2, 2], ['nature', 12, 2, 4, 3]] },
  mountain: { sky: ['#6880b8', '#c0c8e0'], ground: ['floor', 1, 1], back: [['nature', 13, 8, 2, 2], ['nature', 16, 8, 2, 2], ['nature', 2, 0, 2, 2]] },
  cave: { sky: ['#140c0a', '#3a281c'], ground: ['interiorfloor', 12, 13], back: [['nature', 13, 8, 2, 2], ['nature', 16, 8, 2, 2]], dim: 0.25 },
  shore: { sky: ['#4888d8', '#c8e8f8'], ground: ['floor', 1, 1], sea: true, back: [] },
  ship: { sky: ['#3870c8', '#b0d8f0'], ground: ['water', 5, 13], sea: true, back: [] },
  storm: { sky: ['#202838', '#586078'], ground: ['water', 5, 13], sea: true, back: [], dim: 0.15 },
  isle: { sky: ['#683848', '#d89070'], ground: ['floor', 11, 12], back: [['nature', 4, 0, 2, 2], ['nature', 16, 8, 2, 2], ['nature', 4, 0, 2, 2]] },
  fort: { sky: ['#181820', '#383848'], ground: ['interiorfloor', 12, 13], back: [], wall: true, dim: 0.1 },
  shrine: { sky: ['#382048', '#a06890'], ground: ['interiorfloor', 1, 13], back: [['nature', 0, 18, 3, 3]] },
};
function backdrop(kind) {
  if (bgCache[kind]) return bgCache[kind];
  const d = BG[kind] || BG.field, c = canvas(W, 164), g = c.x, horizon = 92;
  for (let y = 0; y < horizon; y++) { const t = Math.floor((y / horizon) * 8) / 7; g.fillStyle = snes(hex(rgb(d.sky[0]).map((v, i) => v + (rgb(d.sky[1])[i] - v) * t))); g.fillRect(0, y, W, 1); }
  if (d.sea) {
    const sea = tileset('water');
    for (let x = 0; x < W; x += 16) for (let y = horizon - 24; y < horizon + 10; y += 16) g.drawImage(sea, 16, 16, 16, 16, x, y, 16, 16);
    g.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 30; k++) g.fillRect(Math.floor(hash(k, 3) * W), horizon - 22 + Math.floor(hash(k, 4) * 28), 3 + Math.floor(hash(k, 5) * 5), 1);
  }
  if (d.wall) {
    const wall = tileset('wallsimple');
    for (let x = 0; x < W; x += 16) for (let y = horizon - 48; y < horizon; y += 16) g.drawImage(wall, 5 * 16 + (x % 32 ? 16 : 32), 6 * 16, 16, 16, x, y, 16, 16);
    for (const x of [40, 120, 200]) { g.fillStyle = '#f8a030'; g.fillRect(x, horizon - 30, 4, 6); g.fillStyle = '#f8e070'; g.fillRect(x + 1, horizon - 32, 2, 3); }
  }
  // the ground, then a row of trees or rocks standing on the horizon
  const [gi, gx, gy] = d.ground, gimg = tileset(gi);
  for (let x = 0; x < W; x += 16) for (let y = horizon; y < 164; y += 16) g.drawImage(gimg, gx * 16, gy * 16, 16, 16, x, y, 16, 16);
  if (d.back.length) {
    let x = -8, k = 0;
    while (x < W) { const [img, sx, sy, w, h] = d.back[Math.floor(hash(k, 1, kind.length) * d.back.length)]; g.drawImage(tileset(img), sx * 16, sy * 16, w * 16, h * 16, x, horizon + 6 - h * 16, w * 16, h * 16); x += w * 16 - 4 + Math.floor(hash(k, 2) * 10); k++; }
  }
  if (d.dim) { g.fillStyle = `rgba(0,0,20,${d.dim})`; g.fillRect(0, 0, W, 164); }
  return (bgCache[kind] = c);
}

// ---------- helpers ----------
function frames(n) { return new Promise((r) => B.waits.push({ t: n, r })); }
function msg(s) { B.msg = s; }
async function msgWait(s) {
  B.msg = s; B.msgWait = true;
  await frames(8);
  await new Promise((r) => { B.waitKey = r; });
  B.msgWait = false;
}
function popup(x, y, s, col = '#f8f8f8') { B.pops.push({ x, y, s: String(s), col, t: 0 }); }
const foesAlive = () => B.foes.filter((f) => f.hp > 0);
const heroes = () => S.members;
const heroesAlive = () => S.members.filter((h) => h.hp > 0);
// one row of the status window per hero, and where each one stands
function heroBox(i) { return { x: 2, y: 164 + 4 + i * 13, w: W - 4, h: 13 }; }
// feet on the ground: each sprite is 48 tall with the figure in its lower 32
function heroSpot(i) { return { x: 184 + (i % 2) * 34, y: 58 + Math.floor(i / 2) * 34 + (i % 2) * 14 }; }
function heroPos(h) { const i = S.members.indexOf(h), s = heroSpot(Math.max(0, i)); return { x: s.x + 16, y: s.y + 30 }; }
function foeFighter(f) { const d = ENEMIES[f.id]; return { atk: d.atk, dfn: d.def, int: d.int, agi: d.agi, buffs: f.buffs, defending: false, weak: d.weak, resist: d.resist, undead: d.undead }; }
function heroFighter(h) { const s = stats(h); return { atk: s.atk, dfn: s.dfn, int: s.int, agi: s.agi, buffs: h.buffs, defending: h.defending }; }
function layoutFoes() {
  // the monsters stand on the left half, staggered so a group reads as a group
  const list = B.foes, R = 170, sum = list.reduce((s, f) => s + f.aw, 0), gap = list.length > 1 ? Math.min(10, Math.floor((R - 8 - sum) / (list.length - 1))) : 0;
  const total = sum + gap * (list.length - 1);
  let x = Math.round((R - total) / 2);
  list.forEach((f, i) => { f.x = x + f.aw / 2; f.base = ENEMIES[f.id].boss ? 146 : 124 + (i % 2) * 16; x += f.aw + gap; });
}

// ---------- start / end ----------
export function startBattle(troop, { bg = 'field', boss = false, music, canFlee = true } = {}) {
  return new Promise((resolve) => {
    const foes = troop.map((id, i) => {
      const d = ENEMIES[id];
      return { get aw() { return artW(this.art); }, get ah() { return artH(this.art); }, id, n: i, name: d.name + (troop.filter((t) => t === id).length > 1 ? 'ABCD'[troop.slice(0, i).filter((t) => t === id).length] : ''), hp: d.hp, maxhp: d.hp, art: d.boss ? bossArt(d.art, d.hue, d.sat) : enemyArt(d.art, d.hue, d.sat), status: {}, buffs: {}, flash: 0, shake: 0, die: 0, bob: Math.random() * 6 };
    });
    B = { troop, foes, bg, boss, canFlee: canFlee && !boss, spared: 0, waits: [], pops: [], parts: [], msg: '', round: 0, active: null, shake: 0, flash: 0, flashCol: '#fff', fade: 30, resolve, heroFx: {}, bolt: null, done: false, targeting: null };
    for (const h of S.members) { h.buffs = {}; h.defending = false; h.status = { ...h.status }; delete h.status.sleep; }
    layoutFoes();
    playMusic(music || (boss ? 'boss' : 'battle'), { restart: true });
    run();
  });
}
async function run() {
  await frames(20);
  const names = [...new Set(B.foes.map((f) => ENEMIES[f.id].name))];
  await msgWait(B.boss ? L(`${names[0]}擋住了去路！`, `${names[0]} blocks the way!`) : L(`${names.join('、')}出現了！`, `${names.join(', ')} appeared!`));
  msg('');
  for (;;) {
    B.round++;
    const r = await inputCommands();
    if (r.flee) {
      const myAgi = heroesAlive().reduce((s, h) => s + stats(h).agi, 0) / Math.max(1, heroesAlive().length);
      const theirAgi = foesAlive().reduce((s, f) => s + ENEMIES[f.id].agi, 0) / foesAlive().length;
      const chance = Math.max(0.3, Math.min(0.9, 0.55 + (myAgi - theirAgi) * 0.03));
      if (r.smoke || Math.random() < chance) { sfx('run'); await msgWait(r.smoke ? L('丟出煙玉，趁亂逃走了！', 'Threw a smoke ball and slipped away!') : L('成功逃走了！', 'Got away safely!')); return end('flee'); }
      await msgWait(L('沒能逃掉！', "Couldn't escape!"));
      if (await enemyPhase()) return;
      if (await roundEnd()) return;
      continue;
    }
    const order = [];
    heroes().forEach((h, i) => { if (r.cmds[i]) order.push({ who: 'hero', h, c: r.cmds[i], spd: stats(h).agi * (0.8 + Math.random() * 0.4) + (r.cmds[i].type === 'defend' ? 999 : 0) }); });
    for (const f of foesAlive()) order.push({ who: 'foe', f, spd: ENEMIES[f.id].agi * (0.8 + Math.random() * 0.4) });
    order.sort((a, b) => b.spd - a.spd);
    for (const h of heroes()) h.defending = false;
    for (const o of order) if (o.who === 'hero' && o.c.type === 'defend') o.h.defending = true;
    for (const o of order) {
      if (o.who === 'hero') await heroAct(o.h, o.c);
      else if (o.f.hp > 0) await foeAct(o.f);
      if (await checkEnd()) return;
    }
    if (await roundEnd()) return;
  }
}
async function enemyPhase() {
  for (const f of foesAlive()) { await foeAct(f); if (await checkEnd()) return true; }
  return false;
}
async function roundEnd() {
  msg('');
  for (const h of heroesAlive()) {
    if (h.status.poison) { const d = Math.max(1, Math.floor(stats(h).maxhp / 12)); h.hp = Math.max(1, h.hp - d); const p = heroPos(h); popup(p.x, p.y - 20, d, '#c080f8'); }
    if (h.status.sleep && --h.status.sleep <= 0) { delete h.status.sleep; }
    for (const k of Object.keys(h.buffs)) if (--h.buffs[k] <= 0) delete h.buffs[k];
  }
  for (const f of foesAlive()) { if (f.status.sleep && --f.status.sleep <= 0) delete f.status.sleep; for (const k of Object.keys(f.buffs)) if (--f.buffs[k] <= 0) delete f.buffs[k]; }
  await frames(10);
  return checkEnd();
}
async function checkEnd() {
  if (!foesAlive().length) { await victory(); return true; }
  if (!heroesAlive().length) { await defeat(); return true; }
  return false;
}
async function victory() {
  await frames(20);
  playMusic('victory', { restart: true });
  let exp = 0, gold = 0; const drops = []; void 0;
  for (const f of B.foes) { const d = ENEMIES[f.id]; exp += d.exp; gold += d.gold; if (d.drop && Math.random() < d.drop[1]) drops.push(d.drop[0]); }
  if (B.spared && B.foes.every((f) => f.spared)) { await msgWait(L('鬼們放下了武器，沒有人再受傷。', 'The oni put down their weapons. No one else got hurt.')); exp = Math.round(exp / 2); }
  else await msgWait(L('戰鬥勝利！', 'Victory!'));
  if (exp) await msgWait(L(`每人獲得 ${exp} 點經驗值。`, `Everyone gained ${exp} EXP.`));
  if (gold) { S.gold += gold; await msgWait(L(`獲得 ${gold} 金幣。`, `Found ${gold} gold.`)); }
  for (const it of drops) { addItem(it); await msgWait(L(`得到了${ITEMS[it].name}！`, `Found ${ITEMS[it].name}!`)); }
  for (const h of heroes()) {
    const lines = gainExp(h, exp);
    for (const l of lines) { if (l.includes('升到') || l.includes('reached level')) sfx('level'); await msgWait(l); }
  }
  for (const h of heroes()) { h.defending = false; h.buffs = {}; }
  end('win');
}
async function defeat() {
  await frames(30);
  await msgWait(L('全員倒下了……', 'The party has fallen...'));
  end('lose');
}
function end(result) {
  B.fadeOut = 1;
  const r = B.resolve;
  setTimeout(() => { B = null; r(result); }, 450);
}

// ---------- commands ----------
async function inputCommands() {
  const hs = heroes(), cmds = [];
  let i = 0;
  const able = (h) => h.hp > 0 && !h.status.sleep;
  while (i < hs.length) {
    const h = hs[i];
    if (!able(h)) { cmds[i] = null; i++; continue; }
    B.active = h;
    const c = await commandMenu(h, hs.slice(0, i).some(able));
    if (c === 'back') { let j = i - 1; while (j >= 0 && !able(hs[j])) j--; if (j >= 0) i = j; continue; }
    if (c.type === 'flee') { B.active = null; return { flee: true, smoke: c.smoke }; }
    cmds[i] = c; i++;
    if (c.type === 'combo') { for (let j = 0; j < hs.length; j++) if (hs[j] !== h) cmds[j] = null; break; }
  }
  B.active = null;
  return { cmds };
}
async function commandMenu(h, canBack) {
  const box = heroBox(S.members.indexOf(h));
  for (;;) {
    const sp = SPECIALS[HEROES[h.id].special], full = h.gauge >= 100;
    const oni = foesAlive().some((f) => ENEMIES[f.id].oni && !ENEMIES[f.id].boss), combo = h.id === 'momo' && comboReady();
    const items = [
      { label: L('攻擊', 'Attack') }, { label: L('招式', 'Skills'), disabled: !spellsOf(h).length },
      { label: full && !isEn() ? sp.name : L('必殺', 'Special'), disabled: !full, color: full ? '#f8e070' : undefined }, { label: L('糰子', 'Items') },
      { label: L('防禦', 'Guard') }, oni ? { label: L('說服', 'Talk'), color: '#a0e8f8' } : { label: L('逃跑', 'Run'), disabled: !B.canFlee },
    ];
    if (combo) items.push({ label: L('四人合擊', 'Team Strike'), color: '#f8a0c0' });
    void box;
    const r = await menu(items, { x: W - 136, y: 164 - Math.ceil(items.length / 2) * 16 - 14, w: 134, cols: 2, cancel: canBack, start: B.lastCmd && B.lastCmd[h.id] || 0 });
    if (r < 0) return 'back';
    (B.lastCmd = B.lastCmd || {})[h.id] = r;
    if (r === 0) { const t = await pickFoe(); if (t) return { type: 'attack', target: t }; }
    if (r === 1) {
      const list = spellsOf(h);
      const k = await menu(list.map((id) => ({ label: SPELLS[id].name, right: SPELLS[id].mp, disabled: SPELLS[id].mp > h.mp })), { x: 60, y: 30, w: 140, title: `${h.name}　${L('氣', 'Ki')} ${h.mp}`, maxRows: 6 });
      if (k < 0) continue;
      const id = list[k], t = await pickTarget(SPELLS[id].target, h);
      if (t !== null) return { type: 'magic', id, target: t };
    }
    if (r === 2) { const t = await pickTarget(sp.target, h); if (t !== null) return { type: 'special', target: t }; }
    if (r === 3) {
      const list = Object.keys(S.inv).filter((id) => ITEMS[id].use);
      if (!list.length) { sfx('buzz'); continue; }
      const k = await menu(list.map((id) => ({ label: ITEMS[id].name, right: S.inv[id] })), { x: 60, y: 30, w: 140, title: L('道具', 'Items'), maxRows: 6 });
      if (k < 0) continue;
      const id = list[k], it = ITEMS[id];
      if (it.use === 'escape') { if (!B.canFlee) { sfx('buzz'); continue; } addItem(id, -1); return { type: 'flee', smoke: true }; }
      const t = await pickTarget(it.target, h);
      if (t !== null) return { type: 'item', id, target: t };
    }
    if (r === 4) return { type: 'defend' };
    if (r === 5 && items[5].label === L('說服', 'Talk')) { const t = await pickFoe((f) => ENEMIES[f.id].oni); if (t) return { type: 'talk', target: t }; continue; }
    if (r === 5) return { type: 'flee' };
    if (r === 6) return { type: 'combo' };
  }
}
function pickTarget(kind, h) {
  if (kind === 'enemy') return pickFoe();
  if (kind === 'enemies') return Promise.resolve('allFoes');
  if (kind === 'allies') return Promise.resolve('allHeroes');
  if (kind === 'self') return Promise.resolve(h);
  if (kind === 'ally') return pickHero((x) => x.hp > 0);
  if (kind === 'dead') return pickHero((x) => x.hp <= 0);
  return Promise.resolve(null);
}
function pickFoe(ok = () => true) {
  return new Promise((res) => {
    let list = foesAlive().filter(ok), i = 0;
    const w = {
      update() {
        list = foesAlive().filter(ok);
        if (!list.length) { done(null); return; }
        if (input.repeat('right') || input.repeat('down')) { i = (i + 1) % list.length; sfx('cursor'); }
        if (input.repeat('left') || input.repeat('up')) { i = (i + list.length - 1) % list.length; sfx('cursor'); }
        if (input.pressed('a')) { sfx('ok'); done(list[i]); }
        if (input.pressed('b')) { sfx('cancel'); done(null); }
      },
      draw() { const f = list[i]; if (!f) return; ctx.drawImage(HAND_D, Math.round(f.x - 5), Math.round(f.base - f.ah - 10 + ((B.t >> 3) % 2))); windowBox(4, 4, W - 8, 24); text(f.name, W / 2, 10, '#f8f8f8', { align: 'center' }); },
    };
    const done = (v) => { UI_pop(w); res(v); };
    UI_push(w);
  });
}
function pickHero(ok) {
  return new Promise((res) => {
    const list = S.members.filter(ok);
    if (!list.length) { sfx('buzz'); res(null); return; }
    let i = 0;
    const w = {
      update() {
        if (input.repeat('right') || input.repeat('down')) { i = (i + 1) % list.length; sfx('cursor'); }
        if (input.repeat('left') || input.repeat('up')) { i = (i + list.length - 1) % list.length; sfx('cursor'); }
        if (input.pressed('a')) { sfx('ok'); done(list[i]); }
        if (input.pressed('b')) { sfx('cancel'); done(null); }
      },
      draw() { const s = heroSpot(S.members.indexOf(list[i])); ctx.drawImage(HAND_D, s.x + 10, s.y - 8 + ((B.t >> 3) % 2)); },
    };
    const done = (v) => { UI_pop(w); res(v); };
    UI_push(w);
  });
}
// battle-only widgets ride the same UI stack as menus
const widgetStack = [];
function UI_push(w) { widgetStack.push(w); }
function UI_pop(w) { const i = widgetStack.indexOf(w); if (i >= 0) widgetStack.splice(i, 1); }

// ---------- actions ----------
async function stepForward(h) { B.heroFx[h.id] = { dx: 0 }; for (let k = 0; k < 8; k++) { B.heroFx[h.id].dx -= 3; await frames(1); } }
async function stepBack(h) { for (let k = 0; k < 8; k++) { B.heroFx[h.id].dx += 3; await frames(1); } delete B.heroFx[h.id]; }
function hurtFoe(f, d, col = '#f8f8f8') {
  f.hp = Math.max(0, f.hp - d); f.flash = 8; f.shake = 10;
  popup(f.x, f.base - f.ah / 2, d, col);
  if (f.status.sleep && Math.random() < 0.5) delete f.status.sleep;
  if (f.hp <= 0) killFoe(f);
}
function killFoe(f) { f.die = 1; sfx(ENEMIES[f.id].boss ? 'boom' : 'die'); }
function hurtHero(h, d, col = '#f8f8f8') {
  const s = stats(h);
  h.hp = Math.max(0, h.hp - d);
  h.gauge = Math.min(100, h.gauge + (d / s.maxhp) * 90);
  B.heroFx[h.id] = { ...(B.heroFx[h.id] || {}), hit: 14 };
  const p = heroPos(h); popup(p.x, p.y - 18, d, col);
  if (h.status.sleep && Math.random() < 0.5) delete h.status.sleep;
  if (h.hp <= 0) { h.status = {}; h.gauge = 0; h.buffs = {}; }
  if (d > s.maxhp * 0.25) B.shake = 8;
}
function healHero(h, n) { const s = stats(h); const before = h.hp; h.hp = Math.min(s.maxhp, h.hp + n); const p = heroPos(h); popup(p.x, p.y - 18, h.hp - before, '#78f878'); }

// the bond grows by sharing dumplings at a hearth; at 8 the four can strike as one
const bond = () => S.flags.bond || 0;
function comboReady() { return bond() >= 8 && S.members.length >= 4 && S.members.every((m) => m.hp > 0 && !m.status.sleep) && S.members.every((m) => m.gauge >= 50); }
async function heroAct(h, c) {
  if (h.hp <= 0 || h.status.sleep) return;
  if (c.type === 'defend') { return; }
  if (c.type === 'talk') {
    const t = c.target && c.target.hp > 0 ? c.target : null;
    if (!t) return;
    msg(L(`${h.name}放下了刀，對${t.name}說話……`, `${h.name} lowers his sword and speaks to ${t.name}...`));
    await frames(30);
    const chance = 0.2 + (1 - t.hp / t.maxhp) * 0.6 + bond() * 0.02;
    if (Math.random() < chance) {
      sfx('heal');
      await msgWait(L(`${t.name}：「……我們也只是想活下去。」`, `${t.name}: "...We only wanted to live."`));
      await msgWait(L(`${t.name}放下了武器，退開了。`, `${t.name} put down its weapon and stepped back.`));
      t.spared = true; t.hp = 0; t.die = 1; B.spared++; S.flags.spared = (S.flags.spared || 0) + 1;
    } else { sfx('buzz'); await msgWait(L(`${t.name}不肯聽。`, `${t.name} will not listen.`)); }
    return;
  }
  if (c.type === 'combo') {
    msg(L('「大家一起上！」', '"Everyone, together!"'));
    sfx('special'); B.flash = 10; B.flashCol = '#f8c0d8';
    for (const m of S.members) { m.gauge = 0; B.heroFx[m.id] = { dx: -40 }; }
    for (let k = 0; k < 4; k++) { for (const f of foesAlive()) fxSlash(f.x + (k - 1.5) * 6, f.base - f.ah / 2, ['#f8a0c0', '#ffffff', '#f8e070', '#a0e8f8'][k]); sfx('slash'); await frames(8); }
    sfx('crit'); B.shake = 16;
    const pow = S.members.reduce((a, m) => a + stats(m).atk, 0) * (1 + bond() * 0.05);
    for (const f of foesAlive()) hurtFoe(f, Math.round(pow * (0.9 + Math.random() * 0.2) - ENEMIES[f.id].def * 0.5), '#f8a0c0');
    await frames(30);
    for (const m of S.members) delete B.heroFx[m.id];
    return;
  }
  const pickAliveFoe = (t) => (t && t.hp > 0 ? t : foesAlive()[Math.floor(Math.random() * foesAlive().length)]);
  if (c.type === 'attack') {
    const t = pickAliveFoe(c.target);
    if (!t) return;
    msg(L(`${h.name}的攻擊！`, `${h.name} attacks!`));
    await stepForward(h);
    sfx('slash'); fxSlash(t.x, t.base - t.ah / 2);
    await frames(10);
    const r = physical(heroFighter(h), foeFighter(t));
    if (r.miss) { sfx('miss'); popup(t.x, t.base - t.ah / 2, 'MISS', '#a0a8c0'); }
    else { sfx(r.crit ? 'crit' : 'hit'); if (r.crit) { B.flash = 4; msg(L('會心一擊！', 'Critical hit!')); } hurtFoe(t, r.dmg); h.gauge = Math.min(100, h.gauge + 6); }
    await frames(22);
    await stepBack(h);
    return;
  }
  if (c.type === 'magic') {
    const sp = SPELLS[c.id];
    if (h.mp < sp.mp) { await msgWait(L(`${h.name}的氣不夠了。`, `${h.name} is out of Ki.`)); return; }
    h.mp -= sp.mp;
    msg(L(`${h.name}使出了「${sp.name}」！`, `${h.name} uses ${sp.name}!`));
    await stepForward(h);
    await castSpell(h, sp, c.target, stats(h));
    await stepBack(h);
    return;
  }
  if (c.type === 'special') {
    if (h.gauge < 100) return;
    h.gauge = 0;
    const sp = SPECIALS[HEROES[h.id].special];
    msg(L(`${h.name}：「${sp.name}！」`, `${h.name}: "${sp.name}!"`));
    sfx('special'); B.flash = 6; B.flashCol = '#f8f0c0';
    await stepForward(h);
    await frames(16);
    const s = stats(h);
    const bk = 1 + bond() * 0.04;
    if (HEROES[h.id].special === 'peachblade') {
      const t = pickAliveFoe(c.target); if (t) { for (let k = 0; k < 3; k++) { fxSlash(t.x + (k - 1) * 8, t.base - t.ah / 2 + (k - 1) * 6, '#80d8ff'); sfx('slash'); await frames(6); } sfx('crit'); B.shake = 10; const r = physical(heroFighter(h), foeFighter(t), 2.6 * bk); hurtFoe(t, r.miss ? Math.round(s.atk * 1.5) : r.dmg, '#f8a0c0'); }
    } else if (HEROES[h.id].special === 'monkeyrain') {
      for (let k = 0; k < 24; k++) B.parts.push({ x: Math.random() * 170, y: -10 - Math.random() * 60, vx: 0.3, vy: 3 + Math.random() * 2, life: 50, col: ['#c08040', '#f8d070', '#e8a058'][k % 3], size: 4, type: 'star' });
      sfx('holy'); await frames(30); sfx('bolt');
      for (const f of foesAlive()) hurtFoe(f, Math.round(magic(40, 1.8, heroFighter(h), foeFighter(f), 'none').dmg * bk), '#f8f8a0');
    } else if (HEROES[h.id].special === 'howl') {
      sfx('quake'); B.shake = 30;
      for (let k = 0; k < 30; k++) B.parts.push({ x: Math.random() * W, y: 120 + Math.random() * 20, vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 3, g: 0.2, life: 40, col: ['#8c6848', '#b08868', '#4a3020'][k % 3], size: 3 });
      await frames(20);
      for (const f of foesAlive()) { const r = physical(heroFighter(h), foeFighter(f), 1.7 * bk); hurtFoe(f, r.miss ? Math.round(s.atk) : r.dmg, '#f8c070'); }
    } else if (HEROES[h.id].special === 'featherwind') {
      sfx('heal');
      for (const x of heroes()) { fxHeal(x); if (x.hp > 0) { healHero(x, Math.round(stats(x).maxhp * 0.5)); x.status = {}; } }
    }
    await frames(30);
    await stepBack(h);
    return;
  }
  if (c.type === 'item') {
    const it = ITEMS[c.id];
    if (!count(c.id)) { await msgWait(L(`${it.name}已經用完了。`, `No ${it.name} left.`)); return; }
    addItem(c.id, -1);
    let t = c.target;
    msg(L(`${h.name}使用了${it.name}。`, `${h.name} uses ${it.name}.`));
    await frames(12);
    if (it.use === 'revive') { if (t.hp > 0) { await msgWait(L('沒有效果。', 'No effect.')); return; } fxHeal(t); sfx('heal'); t.hp = Math.max(1, Math.round(stats(t).maxhp * it.power)); await frames(20); return; }
    if (t.hp <= 0) { await msgWait(L('沒有效果。', 'No effect.')); return; }
    fxHeal(t); sfx('heal');
    if (it.use === 'heal') healHero(t, it.power);
    if (it.use === 'mp') { const s = stats(t); const b = t.mp; t.mp = Math.min(s.maxmp, t.mp + it.power); const p = heroPos(t); popup(p.x, p.y - 18, t.mp - b, '#78c8f8'); }
    if (it.use === 'cure') { delete t.status.poison; }
    if (it.use === 'full') { const s = stats(t); healHero(t, s.maxhp); t.mp = s.maxmp; }
    await frames(26);
  }
}
async function castSpell(h, sp, target, s) {
  const me = heroFighter(h);
  if (sp.type === 'dmg') {
    const ts = target === 'allFoes' ? foesAlive() : [target && target.hp > 0 ? target : foesAlive()[0]].filter(Boolean);
    sfx(sp.fx === 'holy' ? 'holy' : sp.fx);
    for (const t of ts) fxSpell(sp.fx, t.x, t.base - t.ah / 2, t);
    await frames(sp.fx === 'bolt' ? 24 : 30);
    for (const t of ts) { const r = magic(sp.power, sp.k, me, foeFighter(t), sp.el); hurtFoe(t, r.dmg, r.weak ? '#f8e040' : '#f8f8f8'); }
    await frames(24);
  } else if (sp.type === 'heal') {
    const ts = target === 'allHeroes' ? heroesAlive() : [target];
    sfx('heal');
    for (const t of ts) fxHeal(t);
    await frames(20);
    for (const t of ts) if (t.hp > 0) healHero(t, healAmount(sp.power, sp.k, me));
    await frames(24);
  } else if (sp.type === 'cure') {
    sfx('heal'); fxHeal(target); await frames(20); delete target.status.poison; await frames(10);
  } else if (sp.type === 'revive') {
    sfx('heal'); fxHeal(target); await frames(24);
    if (target.hp <= 0) { target.hp = Math.round(stats(target).maxhp * 0.5); } else await msgWait(L('沒有效果。', 'No effect.'));
    await frames(10);
  } else if (sp.type === 'buff') {
    const ts = target === 'allHeroes' ? heroesAlive() : [target === 'allHeroes' ? h : target || h];
    sfx('buff');
    for (const t of ts) { fxBuff(t); t.buffs[sp.stat] = 4; }
    await frames(30);
    msg(sp.stat === 'def' ? L('防禦力提升了！', 'Defence rose!') : L('力量提升了！', 'Strength rose!'));
    await frames(20);
  } else if (sp.type === 'sleep') {
    sfx('sleep');
    for (const f of foesAlive()) fxSpell('sleep', f.x, f.base - f.ah / 2);
    await frames(30);
    for (const f of foesAlive()) { const ok = !ENEMIES[f.id].boss && Math.random() < 0.7; if (ok) { f.status.sleep = 2 + Math.floor(Math.random() * 2); popup(f.x, f.base - f.ah / 2, 'ZZZ', '#c0c0ff'); } else popup(f.x, f.base - f.ah / 2, 'MISS', '#a0a8c0'); }
    await frames(24);
  }
  void s;
}
async function foeAct(f) {
  const d = ENEMIES[f.id];
  if (f.status.sleep) { popup(f.x, f.base - f.ah, 'ZZZ', '#c0c0ff'); await frames(20); return; }
  const targets = heroesAlive();
  if (!targets.length) return;
  const act = foeAction(f, B.round);
  const pick = () => { const ts = heroesAlive(); return ts[Math.floor(Math.random() * ts.length)]; };
  // lunge
  f.lunge = 10;
  if (act === 'atk' || act === 'twin') {
    const hits = act === 'twin' ? 2 : 1;
    msg(act === 'twin' ? L(`${f.name}使出連擊！`, `${f.name} strikes twice!`) : L(`${f.name}的攻擊！`, `${f.name} attacks!`));
    await frames(14);
    for (let k = 0; k < hits; k++) {
      const t = pick(); if (!t) break;
      const r = physical(foeFighter(f), heroFighter(t), act === 'twin' ? 0.75 : 1);
      if (r.miss) { sfx('miss'); const p = heroPos(t); popup(p.x, p.y - 18, 'MISS', '#a0a8c0'); }
      else { sfx(r.crit ? 'crit' : 'hurt'); if (r.crit) B.shake = 8; hurtHero(t, r.dmg); }
      await frames(act === 'twin' ? 14 : 24);
    }
    return;
  }
  const tech = TECHS[act];
  msg(L(`${f.name}使出了「${tech.name}」！`, `${f.name} uses ${tech.name}!`));
  await frames(16);
  if (tech.kind === 'magic') {
    const ts = tech.target === 'all' ? heroesAlive() : [pick()];
    sfx(tech.fx === 'abyss' ? 'abyss' : tech.fx === 'bubble' ? 'bubble' : tech.fx);
    if (tech.fx === 'abyss') { B.flash = 16; B.flashCol = '#400040'; B.shake = 24; }
    for (const t of ts) { const p = heroPos(t); fxSpell(tech.fx, p.x, p.y - 12); }
    await frames(30);
    for (const t of ts) { const r = magic(tech.power, tech.k, foeFighter(f), heroFighter(t), tech.el); hurtHero(t, r.dmg); }
    await frames(26);
  } else if (tech.kind === 'status') {
    const ts = tech.target === 'all' ? heroesAlive() : [pick()];
    sfx(tech.fx);
    for (const t of ts) { const p = heroPos(t); fxSpell(tech.fx, p.x, p.y - 12); }
    await frames(30);
    for (const t of ts) {
      const p = heroPos(t);
      if (Math.random() < (tech.status === 'sleep' ? 0.55 : 0.75)) { t.status[tech.status] = tech.status === 'sleep' ? 2 : 1; popup(p.x, p.y - 18, tech.status === 'sleep' ? 'ZZZ' : L('中毒', 'POISON'), tech.status === 'sleep' ? '#c0c0ff' : '#c080f8'); }
      else popup(p.x, p.y - 18, 'MISS', '#a0a8c0');
    }
    await frames(20);
  } else if (tech.kind === 'drain') {
    const t = pick(); sfx('drain');
    const p = heroPos(t);
    for (let k = 0; k < 14; k++) B.parts.push({ x: p.x + (Math.random() - 0.5) * 12, y: p.y - 12, tx: f.x, ty: f.base - f.ah / 2, life: 40, col: '#f84060', size: 2, type: 'home', d: k * 2 });
    await frames(30);
    const r = magic(10, 0.8, foeFighter(f), heroFighter(t), 'dark');
    hurtHero(t, r.dmg);
    f.hp = Math.min(f.maxhp, f.hp + r.dmg);
    popup(f.x, f.base - f.ah / 2, r.dmg, '#78f878');
    await frames(24);
  } else if (tech.kind === 'buff') {
    sfx('buff'); f.buffs[tech.stat] = 3;
    for (let k = 0; k < 12; k++) B.parts.push({ x: f.x + (Math.random() - 0.5) * f.aw * 0.6, y: f.base - Math.random() * f.ah, vx: 0, vy: -1, life: 30, col: '#f8e070', size: 2 });
    await frames(30);
    msg(L(`${f.name}的防禦力提升了！`, `${f.name}'s defence rose!`));
    await frames(20);
  }
}

// ---------- effects ----------
function fxSlash(x, y, col = '#ffffff') { B.parts.push({ type: 'slash', x, y, life: 12, col }); }
function fxHeal(h) { const p = heroPos(h); for (let k = 0; k < 16; k++) B.parts.push({ x: p.x + (Math.random() - 0.5) * 18, y: p.y + Math.random() * 6, vx: 0, vy: -0.6 - Math.random() * 0.8, life: 40 + Math.random() * 10, col: k % 2 ? '#a0f8a0' : '#ffffff', size: k % 3 ? 1 : 2, type: 'spark' }); }
function fxBuff(h) { const p = heroPos(h); B.parts.push({ type: 'ring', x: p.x, y: p.y - 6, life: 30, col: '#f8e070' }); }
function fxSpell(kind, x, y, t) {
  if (kind === 'fire') for (let k = 0; k < 22; k++) B.parts.push({ x: x + (Math.random() - 0.5) * 30, y: y + 14 + Math.random() * 8, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 - Math.random() * 1.6, life: 26 + Math.random() * 14, col: ['#f8f070', '#f8a030', '#e04818'][k % 3], size: 3 + (k % 3), type: 'flame', d: Math.floor(k / 2) });
  if (kind === 'ice') for (let k = 0; k < 10; k++) B.parts.push({ x: x + (Math.random() - 0.5) * 36, y: y - 50 - Math.random() * 20, vx: 0, vy: 3.5, life: 18, col: '#c0f0ff', size: 3, type: 'shard', ty: y + (Math.random() - 0.5) * 16, d: k * 2 });
  if (kind === 'bolt') { B.bolt = { x, y, t: 18 }; B.flash = 6; B.flashCol = '#ffffff'; }
  if (kind === 'holy') for (let k = 0; k < 4; k++) B.parts.push({ type: 'beam', x: x + (k - 1.5) * 8, y, life: 24, col: '#fffff0', d: k * 3 });
  if (kind === 'sleep' || kind === 'spore') for (let k = 0; k < 10; k++) B.parts.push({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 20, vx: (Math.random() - 0.5) * 0.4, vy: -0.4, life: 40, col: kind === 'sleep' ? '#c0c0ff' : '#c080f8', size: 2, type: kind === 'sleep' ? 'z' : 'spark', d: k * 2 });
  if (kind === 'bubble') for (let k = 0; k < 10; k++) B.parts.push({ x: x + (Math.random() - 0.5) * 24, y: y + 20, vx: (Math.random() - 0.5) * 0.5, vy: -1 - Math.random(), life: 34, col: '#a0d8ff', size: 3 + (k % 3), type: 'bubble', d: k * 2 });
  if (kind === 'abyss') for (let k = 0; k < 16; k++) B.parts.push({ x: x + (Math.random() - 0.5) * 30, y: y + 10, vx: (Math.random() - 0.5) * 1.5, vy: -1.5 - Math.random(), life: 36, col: ['#a040c0', '#400060', '#f040a0'][k % 3], size: 4, type: 'flame', d: k });
  void t;
}

// ---------- update / draw ----------
export function updateBattle() {
  if (!B) return;
  B.t = (B.t || 0) + 1;
  uiTick();
  for (const w of [...B.waits]) if (--w.t <= 0) { B.waits.splice(B.waits.indexOf(w), 1); w.r(); }
  if (B.waitKey && (input.pressed('a') || input.pressed('b'))) { const r = B.waitKey; B.waitKey = null; sfx('cursor'); r(); }
  else if (!UI.active && widgetStack.length) widgetStack[widgetStack.length - 1].update();
  for (const p of B.pops) p.t++;
  B.pops = B.pops.filter((p) => p.t < 50);
  for (const p of B.parts) {
    if (p.d > 0) { p.d--; continue; }
    p.life--;
    if (p.type === 'home') { p.x += (p.tx - p.x) * 0.1; p.y += (p.ty - p.y) * 0.1; }
    else { p.x += p.vx || 0; p.y += p.vy || 0; if (p.g) p.vy += p.g; }
    if (p.type === 'shard' && p.y >= p.ty) { p.vy = 0; }
  }
  B.parts = B.parts.filter((p) => p.life > 0);
  for (const f of B.foes) { if (f.flash) f.flash--; if (f.shake) f.shake--; if (f.lunge) f.lunge--; if (f.die && f.die < 40) f.die++; }
  for (const k of Object.keys(B.heroFx)) if (B.heroFx[k].hit) B.heroFx[k].hit--;
  if (B.shake) B.shake--;
  if (B.flash) B.flash--;
  if (B.bolt && --B.bolt.t <= 0) B.bolt = null;
  if (B.fade > 0) B.fade--;
}
const dissolve = new Map();
// a sheet sprite is drawn at its own scale, snapped to whole screen pixels
const artW = (a) => a.width * (a.fs ? fine(a.fs) : 1), artH = (a) => a.height * (a.fs ? fine(a.fs) : 1);
function dissolved(f) {
  // a monster breaking up into pixels as it dies
  const k = f.die, a = f.art;
  const c = canvas(a.width, a.height);
  c.x.drawImage(k < 8 ? tint(a, '#ffffff', 0.8) : a, 0, 0);
  if (k >= 8) {
    const id = c.x.getImageData(0, 0, a.width, a.height), d = id.data, th = (k - 8) / 30;
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) if (hash(x, y, f.n) < th + (1 - y / a.height) * 0.0) d[(y * a.width + x) * 4 + 3] = 0;
    c.x.putImageData(id, 0, 0);
  }
  void dissolve;
  return c;
}
export function drawBattle() {
  if (!B) return;
  const sx = B.shake ? ((B.shake % 2) * 2 - 1) * Math.min(4, B.shake) : 0;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(backdrop(B.bg), sx, 0);
  // monsters
  for (const f of B.foes) {
    if (f.hp <= 0 && f.die >= 38) continue;
    const bob = ENEMIES[f.id].boss ? Math.sin((B.t + f.bob * 10) / 24) * 2 : 0;
    let x = Math.round(f.x - f.aw / 2 + sx + (f.shake ? ((f.shake % 4) < 2 ? 2 : -2) : 0));
    const y = Math.round(f.base - f.ah + bob + (f.lunge ? Math.sin((10 - f.lunge) / 10 * Math.PI) * 6 : 0));
    if (f.hp <= 0) { ctx.drawImage(dissolved(f), x, y, f.aw, f.ah); continue; }
    if (f.status.sleep) { if ((B.t >> 5) % 2) text('Z', x + f.aw - 4, y - 4 - ((B.t >> 3) % 4), '#c0c0ff'); }
    const fr = f.art.frames ? f.art.frames[Math.floor((B.t + f.n * 7) / 10) % f.art.frames.length] : f.art;
    ctx.drawImage(f.flash && f.flash % 4 < 2 ? tint(fr, '#ffffff', 0.85) : fr, x, y, f.aw, f.ah);
  }
  // lightning
  if (B.bolt) {
    ctx.strokeStyle = B.bolt.t % 4 < 2 ? '#ffffff' : '#f8f080'; ctx.lineWidth = 2; ctx.beginPath();
    let x = B.bolt.x + (Math.random() - 0.5) * 20; ctx.moveTo(x, 0);
    for (let y = 0; y < B.bolt.y + 10; y += 10) { x += (Math.random() - 0.5) * 16; ctx.lineTo(x, y); }
    ctx.stroke(); ctx.lineWidth = 1;
  }
  // the party, side on, twice their walking size
  S.members.forEach((h, i) => {
    const s = heroSpot(i), fx = B.heroFx[h.id] || {}, act = B.active === h;
    const fr = sprite(h.id).l[act || fx.dx ? Math.floor(B.t / 8) % 4 : 0];
    const x = s.x + (fx.dx || 0) + (fx.hit ? ((fx.hit % 4) < 2 ? 2 : -2) : 0) + (act ? -4 : 0), y = s.y;
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x + 16, y + 46, 11, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    if (h.hp <= 0) { ctx.globalAlpha = 0.5; ctx.drawImage(tint(fr, "#606080", 0.7), x, y + 8, fr.width * 2, fr.height * 2); ctx.globalAlpha = 1; return; }
    ctx.drawImage(fx.hit && fx.hit % 4 < 2 ? tint(fr, "#f84040", 0.6) : fr, x, y, fr.width * 2, fr.height * 2);
    if (h.status.sleep && (B.t >> 5) % 2) text('Z', x + 26, y + 2, '#c0c0ff');
  });
  // particles
  for (const p of B.parts) {
    if (p.d > 0) continue;
    const a = Math.min(1, p.life / 10);
    ctx.globalAlpha = a;
    if (p.type === 'slash') { const k = 12 - p.life; ctx.fillStyle = p.col; for (let i = 0; i < 3; i++) for (let j = 0; j < 14; j++) { const t = j - 7; ctx.fillRect(p.x + t * 1.4 + i * 4 - 4 + k, p.y + t * 1.4 - i * 4 + 4 - k * 0.2, 2, 2); } }
    else if (p.type === 'ring') { ctx.strokeStyle = p.col; ctx.beginPath(); ctx.ellipse(p.x, p.y + (30 - p.life) * -0.5, 12 + (30 - p.life) * 0.4, 5, 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (p.type === 'beam') { ctx.fillStyle = p.col; ctx.fillRect(p.x - 1, p.y - 60 + (24 - p.life) * 2, 3, 60); }
    else if (p.type === 'z') { text('z', p.x, p.y, p.col, { shadow: null }); }
    else if (p.type === 'bubble') { ctx.strokeStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x - 1, p.y - p.size + 1, 1, 1); }
    else { ctx.fillStyle = p.col; const s = p.size || 2; ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s); }
  }
  ctx.globalAlpha = 1;
  // one status window: a row for each friend
  windowBox(0, 164, W, 60);
  S.members.forEach((h, i) => {
    const b = heroBox(i), s = stats(h), fx = B.heroFx[h.id] || {};
    const oy = fx.hit ? ((fx.hit % 4) < 2 ? 1 : -1) : 0;
    const dead = h.hp <= 0, low = h.hp < s.maxhp / 4;
    text(h.name, b.x + 8, b.y + oy, B.active === h ? '#f8e070' : dead ? '#f86060' : '#f8f8f8');
    if (h.status.poison) text(L('毒', 'P'), b.x + 66, b.y + oy, '#c080f8');
    text('HP', b.x + 80, b.y + oy, '#f8c0a0');
    text(`${h.hp}/${s.maxhp}`, b.x + 152, b.y + oy, dead ? '#f86060' : low ? '#f8e070' : '#f8f8f8', { align: 'right' });
    text(L('氣', 'Ki'), b.x + 160, b.y + oy, '#a0d8f8');
    text(String(h.mp), b.x + 196, b.y + oy, '#f8f8f8', { align: 'right' });
    bar(b.x + 202, b.y + 5 + oy, 46, h.gauge, 100, h.gauge >= 100 && (B.t >> 2) % 2 ? '#ffffff' : '#f0a0b8');
  });
  // popups
  for (const p of B.pops) {
    const k = p.t, dy = k < 10 ? -k * 1.5 : k < 16 ? -15 + (k - 10) * 1.2 : -8;
    text(p.s, p.x, p.y + dy, p.col, { align: 'center', shadow: '#000010' });
  }
  if (B.msg) {
    // a long line takes two rows instead of running off the window
    const rows = textW(B.msg) > W - 34 ? wrap(B.msg, W - 34) : [B.msg], h = 10 + rows.length * 16;
    windowBox(4, 4, W - 8, h); rows.forEach((r, i) => text(r, 14, 10 + i * 16));
    if (B.msgWait && B.waitKey && (B.t >> 4) % 2) ctx.drawImage(HAND_D, W - 20, h - 8);
  }
  for (const w of widgetStack) w.draw();
  if (B.flash) { ctx.globalAlpha = B.flash / 16; ctx.fillStyle = B.flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (B.fade > 0) { ctx.globalAlpha = B.fade / 30; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (B.fadeOut) { B.fadeOut = Math.min(30, B.fadeOut + 1); ctx.globalAlpha = B.fadeOut / 30; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}
// for testing
export const _B = () => B;
void ramp; void textW;
