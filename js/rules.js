// Battle arithmetic with no drawing, so it can be simulated outside the browser.
import { ENEMIES, TECHS, SPELLS } from './data.js';

export const rand = (a, b) => a + Math.random() * (b - a);
const buffK = (b, k) => (b && b[k] > 0 ? 1.3 : 1);

// a fighter is { atk, dfn, int, agi, buffs, defending, kind: 'hero'|'foe' }
export function physical(a, t, mult = 1) {
  const miss = Math.max(0.02, Math.min(0.2, 0.04 + (t.agi - a.agi) * 0.005));
  if (Math.random() < miss) return { miss: true };
  const crit = Math.random() < 0.06;
  const atk = a.atk * buffK(a.buffs, 'str') * rand(0.9, 1.1);
  const def = t.dfn * buffK(t.buffs, 'def') * (crit ? 0.3 : 1);
  let d = (atk - def * 0.5) * mult * (crit ? 1.6 : 1);
  if (t.defending) d *= 0.5;
  d = Math.max(1, Math.round(d));
  return { dmg: d, crit };
}
export function magic(power, k, a, t, el) {
  let d = (power + a.int * k) * rand(0.92, 1.08) - t.dfn * buffK(t.buffs, 'def') * 0.25;
  if (t.weak && t.weak === el) d *= 1.6;
  if (t.resist && t.resist === el) d *= 0.4;
  if (t.undead && el === 'holy') d *= 1.4;
  if (t.defending) d *= 0.6;
  return { dmg: Math.max(1, Math.round(d)), weak: t.weak === el, resist: t.resist === el };
}
export const healAmount = (power, k, a) => Math.round((power + a.int * k) * rand(0.95, 1.05));

// enemy picks an action
export function foeAction(foe, round) {
  const def = ENEMIES[foe.id];
  let acts = def.acts || [['atk', 1]];
  // Lord Kurogane splits the earth every third round once wounded; the Blue General spins up a whirlwind
  if (foe.id === 'kurogane' && foe.hp < foe.maxhp * 0.5 && round % 3 === 0) return 'quake';
  if (foe.id === 'samurai' && foe.hp < foe.maxhp * 0.35 && round % 4 === 0) return 'gale';
  const total = acts.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [a, w] of acts) { r -= w; if (r <= 0) return a; }
  return 'atk';
}
export const isTech = (a) => !!TECHS[a];
export const spellUsable = (id, h, mp) => SPELLS[id].mp <= mp;
