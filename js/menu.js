// The field menu (items, magic, equipment, status, save, settings), shops and the inn.
import { ctx, W, H, text, textW, windowBox, bar } from './gfx.js';
import { sprite } from './sprites.js';
import { ITEMS, SPELLS, SPECIALS, HEROES, expFor } from './data.js';
import { S, stats, spellsOf, addItem, count, save } from './party.js';
import { menu, panel, notice, ask, pressKey, descBox, statusTags, tagPages, drawTags, tagPage, fit } from './ui.js';
import { sfx, vol, setVolumes, music, setMusic } from './audio.js';
import { healAmount } from './rules.js';
import { L, LANG, isEn, setLang } from './i18n.js';
import { bestiary, fishLog } from './minigames.js';

export const settings = { scan: true };
const fmtTime = (t) => { const s = Math.floor(t / 60), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return `${h}:${String(m).padStart(2, '0')}`; };

function drawParty(x, y, w, sel = -1) {
  windowBox(x, y, w, 8 + S.members.length * 40);
  S.members.forEach((m, i) => {
    const s = stats(m), yy = y + 6 + i * 40;
    if (i === sel) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 4, yy - 2, w - 8, 38); }
    ctx.drawImage(sprite(m.id).d[0], x + 8, yy + 6);
    text(m.name, x + 30, yy, '#f8f8f8');
    text('Lv ' + m.lv, x + w - 8, yy, '#f8e070', { align: 'right' });
    text(`HP ${m.hp}/${s.maxhp}`, x + 30, yy + 13, m.hp <= 0 ? '#f86060' : m.hp < s.maxhp / 4 ? '#f8e070' : '#f8f8f8');
    text(`${L('氣', 'Ki')} ${m.mp}/${s.maxmp}`, x + 30, yy + 25, '#c0d0f8');
    // lingering statuses (poison...) at the right of the HP line, a page a second
    const tags = m.hp > 0 ? statusTags(m.status) : [];
    if (tags.length) drawTags(tagPage(tagPages(tags, w - 44 - textW(`HP ${m.hp}/${s.maxhp}`))), x + w - 8, yy + 13, 'right');
  });
}
async function pickMember(title, filter = () => true) {
  const close = panel(() => {});
  const r = await menu(S.members.map((m) => ({ label: m.name, right: `${m.hp}/${stats(m).maxhp}`, disabled: !filter(m) })), { x: 96, y: 40, w: 150, title });
  close();
  return r < 0 ? null : S.members[r];
}

// ---------- field menu ----------
export async function fieldMenu(ctxInfo) {
  const close = panel(() => {
    drawParty(4, 4, 150, -1);
    windowBox(158, 160, 94, 44);
    text(`${S.gold} G`, 244, 168, '#f8e070', { align: 'right' });
    text(fmtTime(S.time), 244, 184, '#f8f8f8', { align: 'right' });
  });
  let last = 0;
  for (;;) {
    const r = await menu([
      L('道具', 'Items'), L('魔法', 'Magic'), L('裝備', 'Equip'), L('狀態', 'Status'), { label: L('存檔', 'Save'), disabled: !ctxInfo.canSave }, L('設定', 'Config'), L('圖鑑', 'Records'),
    ], { x: 162, y: 4, w: 90, start: last });
    if (r < 0) break;
    last = r;
    if (r === 0) await itemMenu();
    if (r === 1) await magicMenu();
    if (r === 2) await equipMenu();
    if (r === 3) await statusMenu();
    if (r === 4) { const ok = save(0); sfx(ok ? 'save' : 'buzz'); await notice(ok ? L('記錄完成。', 'Saved.') : L('無法存檔（瀏覽器不允許）。', "Can't save (the browser blocked it).")); }
    if (r === 5) await settingsMenu();
    if (r === 6) await records();
  }
  close();
}
// the bag sorts itself: things to use, then what to cook and forge with, then gear, then treasures and keys
const ORDER = (it) => (it.key ? 5 : it.collect ? 4 : it.slot ? 3 : it.material ? 2 : it.ingredient ? 1 : 0);
async function itemMenu() {
  for (;;) {
    const list = Object.keys(S.inv).sort((a, b) => ORDER(ITEMS[a]) - ORDER(ITEMS[b]));
    if (!list.length) { await notice(L('什麼都沒有。', 'Nothing here.')); return; }
    let desc = '';
    const close = panel(() => { windowBox(4, 186, W - 8, 34); text(desc, 14, 196); });
    const r = await menu(list.map((id) => ({ label: ITEMS[id].name, right: ITEMS[id].key ? '' : S.inv[id], icon: ITEMS[id].icon })), { x: 4, y: 4, w: W - 8, cols: isEn() ? 1 : 2, maxRows: 10, onMove: (i) => { const it = ITEMS[list[i]]; desc = it.desc || (it.slot ? equipDesc(it) : ''); } });
    close();
    if (r < 0) return;
    const id = list[r], it = ITEMS[id];
    if (!it.use || ['escape', 'attack', 'seal', 'buffall'].includes(it.use)) { sfx('buzz'); continue; }
    // things for everyone at once
    if (['healall', 'mpall', 'fullall', 'cureall'].includes(it.use)) { useItemOn(id, null); continue; }
    if (it.use === 'learn') {
      const t = await pickMember(L(`誰要學「${SPELLS[it.spell].name}」？`, `Who learns ${SPELLS[it.spell].name}?`), (m) => !spellsOf(m).includes(it.spell));
      if (!t) continue;
      t.learned = [...(t.learned || []), it.spell]; addItem(id, -1); sfx('level');
      await notice(L(`${t.name}學會了「${SPELLS[it.spell].name}」！`, `${t.name} learned ${SPELLS[it.spell].name}!`));
      continue;
    }
    const target = await pickMember(L('給誰使用？', 'Use on whom?'), (m) => (it.use === 'revive' ? m.hp <= 0 : it.revive ? true : m.hp > 0));
    if (!target) continue;
    useItemOn(id, target);
    if (it.use === 'seed') await notice(L(`${target.name}的能力永久提升了！`, `${target.name} grew stronger for good!`));
  }
}
export function useItemOn(id, m) {
  const it = ITEMS[id];
  if (!m) {
    for (const x of S.members) {
      const st = stats(x);
      if (it.use === 'cureall') { x.status = {}; continue; }
      if (x.hp <= 0) continue;
      if (it.use === 'healall') x.hp = Math.min(st.maxhp, x.hp + it.power);
      if (it.use === 'mpall') x.mp = Math.min(st.maxmp, x.mp + it.power);
      if (it.use === 'fullall') { x.hp = st.maxhp; x.mp = st.maxmp; }
    }
    addItem(id, -1); sfx('heal'); return;
  }
  const s = stats(m);
  if (it.use === 'seed') { m.plus = { ...(m.plus || {}) }; m.plus[it.stat] = (m.plus[it.stat] || 0) + it.power; addItem(id, -1); sfx('level'); return; }
  if (it.use === 'wake') delete m.status.sleep;
  if (it.use === 'full' && it.revive && m.hp <= 0) m.hp = 1;
  if (it.use === 'heal') { m.hp = Math.min(s.maxhp, m.hp + it.power); if (it.cure) delete m.status.poison; }
  if (it.use === 'mp') m.mp = Math.min(s.maxmp, m.mp + it.power);
  if (it.use === 'cure') delete m.status.poison;
  if (it.use === 'revive') m.hp = Math.max(1, Math.round(s.maxhp * it.power));
  if (it.use === 'full') { m.hp = s.maxhp; m.mp = s.maxmp; }
  addItem(id, -1); sfx('heal');
}
function equipDesc(it) {
  const who = Object.entries(HEROES).filter(([, h]) => it.kind === 'any' || h.kinds.includes(it.kind)).map(([, h]) => h.name).join(L('、', ', '));
  const parts = [];
  if (it.atk) parts.push(`${L('攻擊', 'ATK')}+${it.atk}`); if (it.def) parts.push(`${L('防禦', 'DEF')}+${it.def}`);
  for (const [k, v] of Object.entries(it.bonus || {})) parts.push(`${L({ str: '力量', def: '防禦', int: '智力', agi: '敏捷' }, { str: 'STR', def: 'DEF', int: 'INT', agi: 'AGI' })[k]}+${v}`);
  return L(`${parts.join(' ')}　可裝備：${who}`, `${parts.join(' ')}  For: ${who}`);
}
async function magicMenu() {
  const FIELD = ['heal', 'healall', 'cure', 'revive', 'peachheart', 'phoenixsong', 'fruitrain'];
  const caster = await pickMember(L('誰要施法？', 'Who casts?'), (m) => m.hp > 0 && spellsOf(m).some((s) => FIELD.includes(s)));
  if (!caster) return;
  for (;;) {
    const list = spellsOf(caster);
    const r = await menu(list.map((id) => ({ label: SPELLS[id].name, right: SPELLS[id].mp, disabled: !FIELD.includes(id) || SPELLS[id].mp > caster.mp })), { x: isEn() ? 48 : 96, y: 26, w: isEn() ? 200 : 150, title: `${caster.name}　${L('氣', 'Ki')} ${caster.mp}`, maxRows: 7, drawExtra: (i) => descBox(SPELLS[list[i]].desc) });
    if (r < 0) return;
    const sp = SPELLS[list[r]], st = stats(caster);
    if (sp.type === 'reviveall') { caster.mp -= sp.mp; for (const m of S.members) if (m.hp <= 0) m.hp = Math.round(stats(m).maxhp * 0.5); sfx('heal'); continue; }
    if (sp.target === 'allies') { caster.mp -= sp.mp; for (const m of S.members) if (m.hp > 0) { m.hp = Math.min(stats(m).maxhp, m.hp + healAmount(sp.power, sp.k, st)); if (sp.cure) m.status = {}; } sfx('heal'); continue; }
    const t = await pickMember(L('對誰施放？', 'Cast on whom?'), (m) => (sp.type === 'revive' ? m.hp <= 0 : m.hp > 0));
    if (!t) continue;
    caster.mp -= sp.mp; sfx('heal');
    if (sp.type === 'heal') t.hp = Math.min(stats(t).maxhp, t.hp + healAmount(sp.power, sp.k, st));
    if (sp.type === 'cure') delete t.status.poison;
    if (sp.type === 'revive') t.hp = Math.round(stats(t).maxhp * 0.5);
  }
}
export const canEquip = (m, it) => it.slot && (it.kind === 'any' || HEROES[m.id].kinds.includes(it.kind));
async function equipMenu() {
  const m = await pickMember(L('誰要換裝備？', 'Equip whom?'));
  if (!m) return;
  const SLOT = [['weapon', L('武器', 'Weapon')], ['armor', L('防具', 'Armour')], ['acc', L('飾品', 'Accessory')]];
  for (;;) {
    const st = stats(m);
    const close = panel(() => { windowBox(4, 120, W - 8, 52); text(L(`${m.name}　攻擊力 ${st.atk}　防禦力 ${st.dfn}`, `${m.name}   Attack ${st.atk}   Defence ${st.dfn}`), 14, 128); text(L(`力量 ${st.str}　智力 ${st.int}　敏捷 ${st.agi}`, `STR ${st.str}   INT ${st.int}   AGI ${st.agi}`), 14, 146, '#c0d0f8'); });
    const r = await menu(SLOT.map(([k, n]) => ({ label: n, right: m.equip[k] ? ITEMS[m.equip[k]].name : '──' })), { x: 4, y: 40, w: W - 8, title: L(`${m.name}的裝備`, `${m.name}'s equipment`) });
    close();
    if (r < 0) return;
    const slot = SLOT[r][0];
    const opts = Object.keys(S.inv).filter((id) => ITEMS[id].slot === slot && canEquip(m, ITEMS[id]));
    const cur = m.equip[slot];
    let preview = null;
    const close2 = panel(() => {
      windowBox(4, 150, W - 8, 52);
      const a = stats(m);
      let b = a;
      if (preview !== null) { const keep = m.equip[slot]; m.equip[slot] = preview; b = stats(m); m.equip[slot] = keep; }
      const cmp = (n, x, y) => { const c = y > x ? '#78f878' : y < x ? '#f87878' : '#f8f8f8'; return [n, x, y, c]; };
      const rows = [cmp(L('攻擊', 'ATK'), a.atk, b.atk), cmp(L('防禦', 'DEF'), a.dfn, b.dfn), cmp(L('智力', 'INT'), a.int, b.int), cmp(L('敏捷', 'AGI'), a.agi, b.agi)];
      rows.forEach(([n, x, y, c], i) => { const X = 14 + (i % 2) * 120, Y = 158 + Math.floor(i / 2) * 18; text(`${n} ${x} → `, X, Y); text(String(y), X + textW(`${n} ${x} → `), Y, c); });
    });
    const labels = [{ label: L('（卸下）', '(Remove)') }, ...opts.map((id) => ({ label: ITEMS[id].name, right: S.inv[id] }))];
    const k = await menu(labels, { x: isEn() ? 22 : 60, y: 26, w: isEn() ? 212 : 170, title: SLOT[r][1], maxRows: 6, onMove: (i) => { preview = i === 0 ? null : opts[i - 1]; if (i === 0) preview = undefined; } });
    close2();
    if (k < 0) continue;
    if (cur) addItem(cur, 1);
    if (k === 0) m.equip[slot] = null;
    else { m.equip[slot] = opts[k - 1]; addItem(opts[k - 1], -1); }
    const s2 = stats(m); m.hp = Math.min(m.hp, s2.maxhp); m.mp = Math.min(m.mp, s2.maxmp);
    sfx('ok');
  }
}
// every skill a friend knows and their special, each with what it does
async function skillBook(m) {
  const sp = SPECIALS[HEROES[m.id].special], ids = spellsOf(m);
  const items = [{ label: sp.name, right: L('必殺', 'SP'), color: '#f8e070' }, ...ids.map((id) => ({ label: SPELLS[id].name, right: `${L('氣', 'Ki')} ${SPELLS[id].mp}` }))];
  const desc = (i) => (i === 0 ? sp.desc : SPELLS[ids[i - 1]].desc);
  await menu(items, { x: 4, y: 4, w: W - 8, maxRows: 8, title: `${m.name}　${L('招式', 'Skills')}`, drawExtra: (i) => descBox(desc(i)) });
}
async function statusMenu() {
  const m = await pickMember(L('查看誰的狀態？', 'Whose status?'));
  if (!m) return;
  const st = stats(m);
  const close = panel(() => {
    windowBox(4, 4, W - 8, H - 8);
    ctx.drawImage(sprite(m.id).d[0], 14, 14);
    // name and title share the first line with any ailments (right-aligned); a long title is shortened to leave them room
    const tags = m.hp > 0 ? statusTags(m.status) : [], page = tags.length ? tagPage(tagPages(tags, 90)) : [];
    const tw = page.length ? page.reduce((a, t) => a + textW(t.s) + 3, 6) : 0, head = `${m.name}　`;
    text(head, 38, 12, '#f8e070'); text(fit(HEROES[m.id].title, W - 14 - tw - 38 - textW(head)), 38 + textW(head), 12, '#f8e070');
    if (page.length) drawTags(page, W - 14, 12, 'right');
    // the title takes the first line; level, experience and what is left to the next level share the second
    text(`Lv ${m.lv}`, 38, 28);
    text(`${L('經驗', 'EXP')} ${m.exp}`, 92, 28); text(`${L('下一級', 'Next')} ${Math.max(0, expFor(m.lv + 1) - m.exp)}`, 170, 28);
    const rows = [[`HP ${m.hp}/${st.maxhp}`, `${L('氣', 'Ki')} ${m.mp}/${st.maxmp}`], [`${L('力量', 'STR')} ${st.str}`, `${L('防禦', 'DEF')} ${st.def}`], [`${L('智力', 'INT')} ${st.int}`, `${L('敏捷', 'AGI')} ${st.agi}`], [`${L('攻擊力', 'Attack')} ${st.atk}`, `${L('防禦力', 'Defence')} ${st.dfn}`]];
    rows.forEach(([a, b], i) => { text(a, 14, 44 + i * 14); text(b, 130, 44 + i * 14); });
    // the special gauge sits on the right of the equipment heading
    text(L('裝備', 'Equipment'), 14, 102, '#a0c0f8');
    text(L('必殺', 'SP'), 140, 102, '#a0c0f8'); bar(140 + textW(L('必殺', 'SP')) + 6, 107, W - 26 - 140 - textW(L('必殺', 'SP')), m.gauge, 100, '#f0b030');
    // the three pieces flow along the line with a clear gap, and wrap when the names are long
    let ex = 14, ey = 116;
    for (const k of ['weapon', 'armor', 'acc']) {
      const nm = fit(m.equip[k] ? ITEMS[m.equip[k]].name : '──', W - 28), nw = textW(nm);
      if (ex > 14 && ex + nw > W - 14) { ex = 14; ey += 13; }
      text(nm, ex, ey); ex += nw + 14;
    }
    const my = ey + 17;
    text(L('魔法', 'Magic'), 14, my, '#a0c0f8');
    text(L('Z：查看招式說明', 'Z: read the skills'), W - 14, my, '#a0a8c0', { align: 'right' });
    // as many skills as fit, each shortened to its column; the rest are counted (Z lists them all)
    const sp = spellsOf(m).map((s) => SPELLS[s].name), cols = isEn() ? 2 : 3, cw = Math.floor((W - 28) / cols);
    const nrows = Math.floor((200 - (my + 14)) / 13) + 1, cap = nrows * cols, shown = sp.length > cap ? cap - 1 : sp.length;
    for (let i = 0; i < shown; i++) text(fit(sp[i], cw - 8), 14 + (i % cols) * cw, my + 14 + Math.floor(i / cols) * 13);
    if (shown < sp.length) text(L(`還有 ${sp.length - shown} 招…`, `+${sp.length - shown} more`), 14 + (shown % cols) * cw, my + 14 + Math.floor(shown / cols) * 13, '#a0a8c0');
  });
  const go = await pressKey();
  close();
  if (go !== false) await skillBook(m);
}
async function settingsMenu() {
  for (;;) {
    const lv = (v) => '■'.repeat(Math.round(v * 5)) + '□'.repeat(5 - Math.round(v * 5));
    const r = await menu([{ label: L('音樂', 'Music'), right: music.on ? lv(vol.music) : L('關', 'Off') }, { label: L('音效', 'Sound'), right: lv(vol.sfx) }, { label: L('掃描線', 'Scanlines'), right: settings.scan ? L('開', 'On') : L('關', 'Off') }, { label: L('語言', 'Language'), right: LANG === 'en' ? 'English' : '中文' }], { x: 60, y: 60, w: 170, title: L('設定', 'Config') });
    if (r < 0) return;
    // turning it up from off switches the music back on; past the top it goes off
    if (r === 0) { if (!music.on) setMusic(true); else if (vol.music >= 1) setMusic(false); else vol.music = Math.min(1, (Math.round(vol.music * 5) + 1) / 5); }
    if (r === 1) vol.sfx = (Math.round(vol.sfx * 5) + 1) % 6 / 5;
    if (r === 2) { settings.scan = !settings.scan; document.body.classList.toggle('noscan', !settings.scan); }
    if (r === 3) setLang(LANG === 'en' ? 'zh' : 'en');
    setVolumes();
    try { localStorage.setItem('peachisle-settings', JSON.stringify({ music: vol.music, sfx: vol.sfx, scan: settings.scan })); } catch (e) { /* private mode */ }
  }
}
export function loadSettings() {
  try { const s = JSON.parse(localStorage.getItem('peachisle-settings')); if (s) { vol.music = s.music; vol.sfx = s.sfx; settings.scan = s.scan; document.body.classList.toggle('noscan', !s.scan); } } catch (e) { /* none */ }
}

// ---------- shop ----------
export async function shop(stock, greeting = L('歡迎光臨！', 'Welcome!')) {
  const close = panel(() => { windowBox(170, 4, 82, 24); text(`${S.gold} G`, 244, 10, '#f8e070', { align: 'right' }); });
  for (;;) {
    const r = await ask('店員', greeting, [L('購買', 'Buy'), L('出售', 'Sell'), L('離開', 'Leave')], { cancel: true });
    if (r === 0) await buy(stock);
    else if (r === 1) await sell();
    else break;
    greeting = L('還需要什麼嗎？', 'Anything else?');
  }
  close();
}
async function buy(stock) {
  let info = '';
  for (;;) {
    const close = panel(() => {
      windowBox(4, 158, W - 8, 62);
      if (info) info.split('\n').forEach((l, i) => text(l, 12, 164 + i * 16));
    });
    const r = await menu(stock.map((id) => ({ label: ITEMS[id].name, right: ITEMS[id].price, disabled: ITEMS[id].price > S.gold, icon: ITEMS[id].icon })), {
      x: 4, y: 32, w: isEn() ? W - 8 : 160, maxRows: 6, title: L('要買什麼？', 'Buy what?'),
      onMove: (i) => {
        const it = ITEMS[stock[i]];
        if (!it.slot) { info = `${it.desc}\n${L('持有', 'Owned')} ${count(stock[i])}`; return; }
        info = S.members.map((m) => {
          if (!canEquip(m, it)) return `${m.name} ──`;
          const a = stats(m), keep = m.equip[it.slot]; m.equip[it.slot] = stock[i]; const b = stats(m); m.equip[it.slot] = keep;
          const d = it.slot === 'weapon' ? b.atk - a.atk : b.dfn - a.dfn;
          return `${m.name} ${d > 0 ? '▲' + d : d < 0 ? '▼' + -d : '＝'}`;
        }).join('　').replace(/(.*?　.*?)　/, '$1\n') + `　${L('持有', 'Owned')} ${count(stock[i])}`;
      },
    });
    close();
    if (r < 0) return;
    const id = stock[r], it = ITEMS[id];
    if (it.price > S.gold) { sfx('buzz'); continue; }
    S.gold -= it.price; addItem(id); sfx('chest');
    if (it.slot) {
      const who = S.members.filter((m) => canEquip(m, it));
      if (who.length) {
        const k = await ask('店員', L(`要現在裝備${it.name}嗎？`, `Equip the ${it.name} now?`), [L('不用', 'No'), ...who.map((m) => m.name)]);
        if (k > 0) { const m = who[k - 1], old = m.equip[it.slot]; if (old) addItem(old); m.equip[it.slot] = id; addItem(id, -1); sfx('ok'); }
      }
    }
  }
}
async function sell() {
  for (;;) {
    const list = Object.keys(S.inv).filter((id) => !ITEMS[id].key && ITEMS[id].price > 0);
    if (!list.length) { await notice(L('沒有可以賣的東西。', 'Nothing to sell.')); return; }
    const r = await menu(list.map((id) => ({ label: `${ITEMS[id].name} ×${S.inv[id]}`, right: Math.floor(ITEMS[id].price / 2), icon: ITEMS[id].icon })), { x: 4, y: 32, w: isEn() ? W - 8 : 200, maxRows: 9, title: L('要賣什麼？', 'Sell what?') });
    if (r < 0) return;
    addItem(list[r], -1); S.gold += Math.floor(ITEMS[list[r]].price / 2); sfx('ok');
  }
}

// the bestiary, the fish log and the treasures found so far
async function records() {
  for (;;) {
    const mg = (S.flags.magaGiven || 0) + count('magatama');
    const r = await menu([L('妖怪圖鑑', 'Bestiary'), L('魚類圖鑑', 'Fish Log'), { label: L(`勾玉 ${mg}/12`, `Magatama ${mg}/12`), disabled: true }], { x: 96, y: 40, w: 150, title: L('圖鑑', 'Records') });
    if (r < 0) return;
    if (r === 0) await bestiary();
    if (r === 1) await fishLog();
  }
}
