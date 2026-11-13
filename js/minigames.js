// The pastimes of the later chapters: fishing, pounding mochi at the festival, the bestiary and the fish log,
// the oni blacksmith's forge, the oni dojo's ranks, and the shrine monk who collects magatama.
import { ctx, W, H, text, textW, windowBox, bar, HAND } from './gfx.js';
import { input } from './input.js';
import { sfx } from './audio.js';
import { widget, menu, descBox, notice } from './ui.js';
import { ITEMS, ENEMIES } from './data.js';
import { POOLS, FORGE, DOJO, LORE } from './data2.js';
import { S, addItem, count } from './party.js';
import { enemyArt, bossArt } from './enemies.js';
import { sprite } from './sprites.js';
import { L, isEn } from './i18n.js';

// ---------- fishing ----------
// wait for the bite without twitching, strike when it bites, then reel in: press Z each time the needle
// crosses the green part of the line. Three good pulls land the fish; three bad ones snap the line.
function pickFish(pool) {
  const list = POOLS[pool] || POOLS.river, total = list.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const f of list) { r -= f[1]; if (r <= 0) return f; }
  return list[0];
}
export function fishing(pool) {
  const [fish, , diff] = pickFish(pool);
  return widget({
    t: 0, phase: 'wait', biteAt: 70 + Math.floor(Math.random() * 120), hit: 0, miss: 0, needle: 0, dir: 1, zone: 0, zw: 0, msg: '', msgT: 0, result: null,
    setZone() { this.zw = Math.max(14, 46 - diff * 7); this.zone = 10 + Math.floor(Math.random() * (150 - this.zw)); },
    update() {
      this.t++;
      if (this.phase === 'done') { if (this.t > 70 || (this.t > 20 && input.pressed('a'))) this.done(this.result); return; }
      if (input.pressed('b') && this.phase !== 'reel') { sfx('cancel'); this.done(null); return; }
      if (this.phase === 'wait') {
        if (input.pressed('a')) { this.end(null, L('太早拉竿，魚被嚇跑了……', 'You struck too soon and scared it off...')); return; }
        if (this.t >= this.biteAt) { this.phase = 'bite'; this.t = 0; sfx('encounter'); }
      } else if (this.phase === 'bite') {
        if (input.pressed('a')) { this.phase = 'reel'; this.t = 0; sfx('ok'); this.setZone(); return; }
        if (this.t > 34 - diff * 3) this.end(null, L('魚跑掉了……', 'It got away...'));
      } else if (this.phase === 'reel') {
        this.needle += this.dir * (1.6 + diff * 0.55);
        if (this.needle >= 160) { this.needle = 160; this.dir = -1; } else if (this.needle <= 0) { this.needle = 0; this.dir = 1; }
        if (input.pressed('a')) {
          if (this.needle >= this.zone && this.needle <= this.zone + this.zw) { this.hit++; sfx('hit'); this.msg = L('好！', 'Good!'); } else { this.miss++; sfx('miss'); this.msg = L('線好緊……', 'The line strains...'); }
          this.msgT = 30; this.setZone();
          if (this.hit >= 3) { sfx('chest'); this.end(fish, L(`釣到了${ITEMS[fish].name}！`, `Caught a ${ITEMS[fish].name}!`)); }
          else if (this.miss >= 3) this.end(null, L('啪！線斷了……', 'Snap! The line broke...'));
        }
        if (this.msgT) this.msgT--;
      }
    },
    end(r, m) { this.result = r; this.msg = m; this.phase = 'done'; this.t = 0; if (r) { addItem(r); S.fish[r] = (S.fish[r] || 0) + 1; } },
    draw() {
      const x = 24, y = 40, w = W - 48, h = 128;
      windowBox(x, y, w, h);
      for (let k = 0; k < 8; k++) { ctx.fillStyle = `rgb(${30 + k * 6},${70 + k * 10},${140 + k * 8})`; ctx.fillRect(x + 6, y + 24 + k * 8, w - 12, 8); }
      text(L('釣魚', 'Fishing'), x + 10, y + 6, '#f8e070');
      text(L('X：收竿', 'X: reel in'), x + w - 10, y + 6, '#a0a8c0', { align: 'right' });
      const bob = this.phase === 'bite' ? Math.round(Math.sin(this.t) * 3) + 3 : Math.round(Math.sin(this.t / 15) * 1.5);
      ctx.fillStyle = '#f8f8f8'; ctx.fillRect(x + w / 2, y + 26, 1, 22 + bob);
      ctx.fillStyle = '#e84040'; ctx.fillRect(x + w / 2 - 2, y + 46 + bob, 5, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + w / 2 - 2, y + 49 + bob, 5, 2);
      if (this.phase === 'wait') { const fx = x + w / 2 - 30 + Math.sin(this.t / 25) * 24; ctx.fillStyle = 'rgba(10,20,40,0.45)'; ctx.fillRect(Math.round(fx), y + 64, 14, 4); text(L('等魚上鉤……', 'Waiting for a bite...'), x + w / 2, y + 84, '#e0f0ff', { align: 'center' }); }
      if (this.phase === 'bite' && (this.t >> 2) % 2) text(L('上鉤了！按 Z！', 'A bite! Press Z!'), x + w / 2, y + 74, '#f8e070', { align: 'center' });
      if (this.phase === 'reel') {
        const bx = x + (w - 160) / 2, by = y + 92;
        ctx.fillStyle = '#202838'; ctx.fillRect(bx - 1, by - 1, 162, 10);
        ctx.fillStyle = '#58c060'; ctx.fillRect(bx + this.zone, by, this.zw, 8);
        ctx.fillStyle = '#f8f8f8'; ctx.fillRect(bx + Math.round(this.needle) - 1, by - 3, 3, 14);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = k < this.hit ? '#58e070' : '#404858'; ctx.fillRect(x + 12 + k * 10, y + h - 14, 7, 7); ctx.fillStyle = k < this.miss ? '#f05050' : '#404858'; ctx.fillRect(x + w - 40 + k * 10, y + h - 14, 7, 7); }
        text(L('綠色時按 Z', 'Z on the green'), x + w / 2, y + 66, '#e0f0ff', { align: 'center' });
        if (this.msgT) text(this.msg, x + w / 2, y + 108, '#f8e070', { align: 'center' });
      }
      if (this.phase === 'done') text(this.msg, x + w / 2, y + 74, this.result ? '#f8e070' : '#f0c0c0', { align: 'center' });
    },
  });
}

// ---------- mochi pounding ----------
// the ring shrinks onto the mortar; press Z as it closes. Sixteen beats, getting faster.
export function mochiGame() {
  const beats = 16;
  return widget({
    t: 0, beat: 0, score: 0, ring: 0, period: 70, judged: false, last: '', lastT: 0, swing: 0, over: false,
    update() {
      this.t++;
      if (this.over) { if (this.t > 60 && input.pressed('a')) this.done(this.score); return; }
      this.ring++;
      if (this.swing) this.swing--;
      if (this.lastT) this.lastT--;
      const target = this.period;
      if (input.pressed('a') && !this.judged) {
        const off = Math.abs(this.ring - target);
        this.judged = true; this.swing = 10;
        if (off <= 5) { this.score += 2; this.last = L('漂亮！', 'Perfect!'); sfx('crit'); }
        else if (off <= 12) { this.score += 1; this.last = L('不錯', 'Good'); sfx('hit'); }
        else { this.last = L('落空', 'Miss'); sfx('miss'); }
        this.lastT = 30;
      }
      if (this.ring >= target + 14) {
        if (!this.judged) { this.last = L('落空', 'Miss'); this.lastT = 30; sfx('miss'); }
        this.beat++; this.ring = 0; this.judged = false; this.period = Math.max(34, 70 - this.beat * 2.5);
        if (this.beat >= beats) { this.over = true; this.t = 0; sfx('level'); }
      }
    },
    draw() {
      windowBox(16, 24, W - 32, 150);
      text(L('搗麻糬', 'Mochi Pounding'), 28, 30, '#f8e070');
      text(`${Math.min(this.beat + 1, beats)}/${beats}`, W - 28, 30, '#f8f8f8', { align: 'right' });
      const cx = W / 2, cy = 112;
      // the mortar and the mochi
      ctx.fillStyle = '#6a4020'; ctx.fillRect(cx - 22, cy, 44, 26); ctx.fillStyle = '#8a5a30'; ctx.fillRect(cx - 24, cy - 4, 48, 6);
      ctx.fillStyle = '#f8f4ec'; ctx.beginPath(); ctx.ellipse(cx, cy - 3, 16, 5 - (this.swing ? 2 : 0), 0, 0, 7); ctx.fill();
      // Momomaru with the mallet, the helper turning the mochi
      const me = sprite('momo').r[0], helper = sprite('Caveman').l[0];
      ctx.drawImage(me, cx - 60, cy - 30, 32, 48); ctx.drawImage(helper, cx + 30, cy - 30, 32, 48);
      const a = this.swing ? 0.2 : -1.1;
      ctx.save(); ctx.translate(cx - 30, cy - 18); ctx.rotate(a); ctx.fillStyle = '#9a6a3a'; ctx.fillRect(0, -2, 26, 4); ctx.fillStyle = '#7a4a22'; ctx.fillRect(22, -7, 9, 14); ctx.restore();
      if (!this.over) {
        const k = Math.max(0, 1 - this.ring / this.period), r = 14 + k * 46;
        ctx.strokeStyle = '#f8e070'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy - 3, r, 0, 7); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy - 3, 14, 0, 7); ctx.stroke();
        text(L('圈圈合上時按 Z', 'Press Z as the ring closes'), cx, 50, '#e0e0f0', { align: 'center' });
      } else text(L(`得分 ${this.score}／${beats * 2}　按 Z`, `Score ${this.score}/${beats * 2}   Press Z`), cx, 50, '#f8e070', { align: 'center' });
      if (this.lastT) text(this.last, cx, 70, '#f8f8f8', { align: 'center' });
    },
  });
}

// ---------- the bestiary and the fish log ----------
const ORDER = () => Object.keys(ENEMIES).filter((id) => !['cloudlet', 'shadowspawn'].includes(id));
export async function bestiary() {
  const ids = ORDER(), seen = ids.filter((id) => S.book.seen[id]).length;
  const items = ids.map((id, i) => ({ label: S.book.seen[id] ? ENEMIES[id].name : '？？？', right: String(i + 1).padStart(2, '0'), color: ENEMIES[id].boss && S.book.seen[id] ? '#f8c070' : undefined }));
  let cur = 0;
  await menu(items, {
    x: 4, y: 4, w: 120, maxRows: 12, title: L(`妖怪圖鑑 ${seen}/${ids.length}`, `Bestiary ${seen}/${ids.length}`), onMove: (i) => { cur = i; },
    drawExtra: () => {
      const id = ids[cur], d = ENEMIES[id];
      windowBox(126, 4, W - 130, H - 8);
      if (!S.book.seen[id]) { text(L('還沒遇過。', 'Not met yet.'), 136, 14, '#8088a8'); return; }
      const art = d.boss ? bossArt(d.art, d.hue, d.sat) : enemyArt(d.art, d.hue, d.sat), fr = art.frames ? art.frames[0] : art;
      const sc = Math.min(64 / fr.width, 56 / fr.height, 3), w = Math.round(fr.width * sc), h = Math.round(fr.height * sc);
      ctx.drawImage(fr, 126 + (W - 130 - w) / 2, 12 + (56 - h), w, h);
      const beat = S.book.beat[id] || 0, EL = { fire: L('火', 'fire'), water: L('水', 'water'), wind: L('風', 'wind'), holy: L('聖', 'holy'), thunder: L('雷', 'thunder'), earth: L('土', 'earth'), dark: L('暗', 'dark') };
      let y = 74;
      // long English names and drop lists wrap inside the window instead of running off the screen
      for (const l of wrapTo(d.name, W - 146)) { text(l, 134, y, '#f8e070'); y += 15; }
      text(`HP ${beat ? d.hp : '???'}`, 134, y); text(`${L('擊敗', 'Beaten')} ${beat}`, W - 12, y, '#c0d0f8', { align: 'right' }); y += 15;
      // weakness and resistance share a line when they fit, otherwise the resistance goes under it
      const wk = `${L('弱點', 'Weak')} ${d.weak ? EL[d.weak] : '─'}`, rs = `${L('抗性', 'Resist')} ${d.resist ? EL[d.resist] : '─'}`;
      const two = 134 + textW(wk) + 8 > 194;
      text(wk, 134, y, '#f8c0a0'); if (two) y += 15;
      text(rs, two ? 134 : 194, y, '#a0c8f8'); y += 15;
      const dl = d.drop ? (Array.isArray(d.drop[0]) ? d.drop : [d.drop]) : [];
      for (const l of wrapTo(`${L('掉落', 'Drops')} ${dl.length ? (beat ? dl.map(([it]) => ITEMS[it].name).join(L('、', ', ')) : '???') : '─'}`, W - 146)) { text(l, 134, y, '#d0f0c0'); y += 15; }
      if (d.oni || d.redeem) { text(L('可以說服', 'Can be talked down'), 134, y, '#a0e8f8'); y += 15; }
      const lore = LORE[id];
      if (lore) { const lines = wrapTo(isEn() ? lore[1] : lore[0], W - 146); lines.slice(0, Math.max(0, Math.floor((H - 22 - (y + 4)) / 14) + 1)).forEach((l, i) => text(l, 134, y + 4 + i * 14, '#e0e0f0')); }
    },
  });
}
function wrapTo(s, w) {
  const out = []; let line = '';
  for (const ch of s.match(/[A-Za-z0-9'".,!?:;()\-]+ ?|./gu) || []) { if (textW(line + ch) > w && line) { out.push(line.trimEnd()); line = ch.trimStart(); } else line += ch; }
  out.push(line); return out;
}
export async function fishLog() {
  const fish = Object.keys(ITEMS).filter((id) => ITEMS[id].fish);
  const got = fish.filter((id) => S.fish[id]).length;
  let cur = 0;
  await menu(fish.map((id) => ({ label: S.fish[id] ? ITEMS[id].name : '？？？', right: S.fish[id] || '', icon: S.fish[id] ? ITEMS[id].icon : undefined })), {
    x: 4, y: 4, w: 150, maxRows: 8, title: L(`魚類圖鑑 ${got}/${fish.length}`, `Fish Log ${got}/${fish.length}`), onMove: (i) => { cur = i; },
    drawExtra: () => { const id = fish[cur]; descBox(S.fish[id] ? ITEMS[id].desc : L('還沒釣到。', 'Not caught yet.')); },
  });
}

// ---------- the forge ----------
export async function forge(E) {
  for (;;) {
    const has = (need) => Object.entries(need).every(([k, v]) => count(k) >= v);
    const items = FORGE.map(([id, need, g]) => ({ label: ITEMS[id].name, right: g, icon: ITEMS[id].icon, disabled: !has(need) || S.gold < g }));
    const desc = (i) => { const [, need] = FORGE[i]; return Object.entries(need).map(([k, v]) => `${ITEMS[k].name} ${count(k)}/${v}`).join(L('　', '  ')); };
    const r = await menu(items, { x: 4, y: 4, w: 180, maxRows: 8, title: L(`要打造什麼？　${S.gold}G`, `Forge what?  ${S.gold}G`), drawExtra: (i) => descBox(desc(i)) });
    if (r < 0) return;
    const [id, need, g] = FORGE[r];
    for (const [k, v] of Object.entries(need)) addItem(k, -v);
    S.gold -= g; addItem(id); sfx('gate'); E.shake(6);
    await E.say(L('鍛冶師', 'Smith'), L(`鏗、鏗、鏗……好了！${ITEMS[id].name}，拿去吧。`, `Clang, clang, clang... There! The ${ITEMS[id].name}. It's yours.`));
  }
}

// ---------- the dojo ----------
export async function dojo(E) {
  const ranks = DOJO.map(([nm, req, , prize], i) => {
    const done = S.flags['dojo' + i];
    return { label: isEn() ? nm[1] : nm[0], right: done ? L('合格', 'Passed') : '', disabled: !S.flags[req] || (i > 0 && !S.flags['dojo' + (i - 1)]), prize };
  });
  const r = await menu(ranks, { x: 40, y: 40, w: 176, title: L('挑戰哪一段？', 'Which rank?'), drawExtra: (i) => descBox(L('獎品：', 'Prize: ') + ranks[i].prize.map(([it, n]) => ITEMS[it].name + (n > 1 ? '×' + n : '')).join(L('、', ', ')) + (ranks[i].disabled ? L('（還不能挑戰）', ' (not yet open)') : '')) });
  if (r < 0) return;
  const [, , fights, prize] = DOJO[r];
  await E.say(L('師範', 'Master'), L('三場連戰，中間不能休息。準備好了嗎？', 'Three bouts in a row, no rest between. Ready?'));
  for (let k = 0; k < fights.length; k++) {
    await notice(L(`第 ${k + 1} 場`, `Bout ${k + 1}`), 50);
    const res = await E.battle(fights[k], { bg: 'dojo', canFlee: false, safe: true, boss: fights[k].length === 1 && ENEMIES[fights[k][0]].boss });
    if (res !== 'win') { await E.say(L('師範', 'Master'), L('勝負已分。好好休息，再來挑戰吧。', 'The bout is decided. Rest up and try again.')); E.heal(); return; }
  }
  E.heal();
  const first = !S.flags['dojo' + r];
  S.flags['dojo' + r] = true;
  sfx('level');
  await E.say(L('師範', 'Master'), first ? L('漂亮！合格了。這是獎品。', 'Splendid! You pass. Your prize.') : L('漂亮！不過獎品只有第一次才有喔。', 'Splendid! Though the prize was for the first time only.'));
  if (first) for (const [it, n] of prize) { addItem(it, n); await E.say(null, L(`得到了${ITEMS[it].name}${n > 1 ? '×' + n : ''}！`, `Got ${ITEMS[it].name}${n > 1 ? ' x' + n : ''}!`)); }
}

// ---------- the magatama collector ----------
const MAGA = [[3, 'seed_hp'], [6, 'cleanbead'], [9, 'scroll_fuin'], [12, 'peachcharm']];
export async function magatama(E) {
  const have = count('magatama');
  if (have) { S.flags.magaGiven = (S.flags.magaGiven || 0) + have; addItem('magatama', -have); sfx('chest'); await E.say(L('神社的和尚', 'Shrine Monk'), L(`收下了 ${have} 個勾玉。目前一共是 ${S.flags.magaGiven} 個。`, `I'll take those ${have} magatama. That makes ${S.flags.magaGiven} in all.`)); }
  const total = S.flags.magaGiven || 0;
  for (const [n, it] of MAGA) if (total >= n && !S.flags['maga' + n]) { S.flags['maga' + n] = true; addItem(it); sfx('level'); await E.say(L('神社的和尚', 'Shrine Monk'), L(`集滿 ${n} 個了！這是謝禮：${ITEMS[it].name}。`, `That's ${n}! Please accept this: ${ITEMS[it].name}.`)); }
  const next = MAGA.find(([n]) => total < n);
  await E.say(L('神社的和尚', 'Shrine Monk'), next ? L(`勾玉散落在各地，有的埋在土裡、有的藏在箱子裡。再找到 ${next[0] - total} 個，我就再送你東西。`, `Magatama lie scattered everywhere, buried or hidden in chests. Find ${next[0] - total} more and I'll have another gift.`) : L('十二個勾玉全都回來了。謝謝你。', 'All twelve magatama have come home. Thank you.'));
}
void bar; void HAND; void H;
