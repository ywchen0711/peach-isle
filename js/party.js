// The party, inventory, gold, story flags, and saving.
import { HEROES, LEARN, ITEMS, expFor } from './data.js';
import { L, onLang } from './i18n.js';

export const S = {
  members: [], inv: {}, gold: 0, flags: {}, map: 'town', x: 0, y: 0, dir: 'd', time: 0, steps: 0,
};

export function makeHero(id, lv = 1) {
  const H = HEROES[id];
  const h = { id, name: H.name, lv, exp: expFor(lv), equip: { ...H.equip }, status: {}, gauge: 0, buffs: {} };
  const st = stats(h);
  h.hp = st.maxhp; h.mp = st.maxmp;
  return h;
}
export function baseStat(h, k) {
  const H = HEROES[h.id];
  return Math.floor(H.base[k] + H.grow[k] * (h.lv - 1));
}
export function stats(h) {
  const s = { maxhp: baseStat(h, 'hp'), maxmp: baseStat(h, 'mp'), str: baseStat(h, 'str'), def: baseStat(h, 'def'), int: baseStat(h, 'int'), agi: baseStat(h, 'agi') };
  let atk = 0, dfn = 0;
  for (const slot of ['weapon', 'armor', 'acc']) {
    const it = ITEMS[h.equip[slot]];
    if (!it) continue;
    atk += it.atk || 0; dfn += it.def || 0;
    for (const [k, v] of Object.entries(it.bonus || {})) s[k] += v;
  }
  s.atk = s.str + atk * 2;
  s.dfn = s.def + dfn;
  return s;
}
export const spellsOf = (h) => LEARN[h.id].filter(([lv]) => h.lv >= lv).map(([, s]) => s);
export const alive = () => S.members.filter((m) => m.hp > 0);

export function addMember(id) {
  if (S.members.find((m) => m.id === id)) return;
  const lv = S.members.length ? Math.max(1, Math.round(S.members.reduce((a, m) => a + m.lv, 0) / S.members.length)) : 1;
  S.members.push(makeHero(id, lv));
}
// returns lines describing level ups
export function gainExp(h, n) {
  const out = [];
  if (h.hp <= 0) return out;
  h.exp += n;
  while (h.exp >= expFor(h.lv + 1) && h.lv < 50) {
    const before = stats(h), had = spellsOf(h);
    h.lv++;
    const after = stats(h);
    h.hp += after.maxhp - before.maxhp; h.mp += after.maxmp - before.maxmp;
    out.push(L(`${h.name}升到了 ${h.lv} 級！`, `${h.name} reached level ${h.lv}!`));
    const gains = [['HP', 'maxhp'], [L('力量', 'STR'), 'str'], [L('防禦', 'DEF'), 'def'], [L('智力', 'INT'), 'int'], [L('敏捷', 'AGI'), 'agi']].map(([n2, k]) => (after[k] > before[k] ? `${n2}+${after[k] - before[k]}` : null)).filter(Boolean);
    if (gains.length) out.push(L('　', '  ') + gains.join(' '));
    for (const sp of spellsOf(h)) if (!had.includes(sp)) out.push(L(`${h.name}學會了「${spellName(sp)}」！`, `${h.name} learned ${spellName(sp)}!`));
  }
  return out;
}
let spellName = (s) => s;
export function setSpellNamer(f) { spellName = f; }

// names are stored in the save, so follow the current language
export function refreshNames() { for (const m of S.members) m.name = HEROES[m.id].name; }
onLang(refreshNames);

export function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) delete S.inv[id]; }
export const count = (id) => S.inv[id] || 0;
export function fullHeal() { for (const m of S.members) { const s = stats(m); m.hp = s.maxhp; m.mp = s.maxmp; m.status = {}; } }

// ---------- save ----------
const KEY = 'peachisle-save';
export function save(slot = 0) {
  try { localStorage.setItem(KEY + slot, JSON.stringify({ ...S, savedAt: Date.now() })); return true; } catch (e) { return false; }
}
export function hasSave(slot = 0) { try { return !!localStorage.getItem(KEY + slot); } catch (e) { return false; } }
export function saveInfo(slot = 0) {
  try { const d = JSON.parse(localStorage.getItem(KEY + slot)); return d; } catch (e) { return null; }
}
export function load(slot = 0) {
  try {
    const d = JSON.parse(localStorage.getItem(KEY + slot));
    if (!d) return false;
    Object.assign(S, { members: [], inv: {}, flags: {} }, d);
    refreshNames();
    for (const m of S.members) S.flags[m.id] = true; // older saves never recorded who had joined
    return true;
  } catch (e) { return false; }
}
export function reset() {
  Object.assign(S, { members: [], inv: { kibi: 3, millet: 3 }, gold: 50, flags: {}, map: 'home', x: 3, y: 3, dir: 'd', time: 0, steps: 0 });
}
