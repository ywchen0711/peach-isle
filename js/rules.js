// Battle arithmetic with no drawing, so it can be simulated outside the browser.
import { ENEMIES, TECHS, SPELLS } from './data.js';

export const rand = (a, b) => a + Math.random() * (b - a);
const buffK = (b, k) => (b && b[k] > 0 ? 1.3 : 1);
// a weakened foe (Menace) keeps only 70% of its defence
const defK = (t) => buffK(t.buffs, 'def') * (t.weakened ? 0.7 : 1);

// a fighter is { atk, dfn, int, agi, buffs, defending, kind: 'hero'|'foe', guard: [elements], pierce }
export function physical(a, t, mult = 1, opts = {}) {
  const miss = Math.max(0.02, Math.min(0.2, 0.04 + (t.agi - a.agi) * 0.005));
  if (Math.random() < miss) return { miss: true };
  // Clone Trick and Substitution: half of all blows go wide
  if (t.buffs && t.buffs.evade > 0 && Math.random() < 0.5) return { miss: true, dodge: true };
  const crit = Math.random() < 0.06;
  const atk = a.atk * buffK(a.buffs, 'str') * rand(0.9, 1.1);
  const def = t.dfn * defK(t) * (crit ? 0.3 : 1) * (opts.pierce ? 0.25 : 1);
  let d = (atk - def * 0.5) * mult * (crit ? 1.6 : 1);
  if (opts.el && t.weak === opts.el) d *= 1.5;
  if (opts.el && t.undead && opts.el === 'holy') d *= 1.3;
  if (t.defending) d *= 0.5;
  // the Blue Tengu's wall of wind turns aside blades
  if (t.stance === 'wind') d *= 0.15;
  d = Math.max(1, Math.round(d));
  return { dmg: d, crit, weak: !!(opts.el && t.weak === opts.el) };
}
export function magic(power, k, a, t, el) {
  let d = (power + a.int * k) * rand(0.92, 1.08) - t.dfn * defK(t) * 0.25;
  if (t.weak && t.weak === el) d *= 1.6;
  if (t.resist && t.resist === el) d *= 0.4;
  if (t.undead && el === 'holy') d *= 1.4;
  if (t.defending) d *= 0.6;
  // a charm against this element halves it; a barrier (Loyal Oath) softens all magic
  if (t.guard && el && t.guard.includes(el)) d *= 0.5;
  if (t.buffs && t.buffs.barrier > 0) d *= 0.6;
  if (t.stance === 'iron') d *= 0.15;
  return { dmg: Math.max(1, Math.round(d)), weak: t.weak === el, resist: t.resist === el };
}
export const healAmount = (power, k, a) => Math.round((power + a.int * k) * rand(0.95, 1.05));

// some bosses fight to a pattern: a blow they wind up for a turn, a stance they switch between, a dive under the waves
const AI = {
  // Lord Kurogane splits the earth every third round once wounded; the Blue General spins up a whirlwind
  kurogane: (f, r) => (f.hp < f.maxhp * 0.5 && r % 3 === 0 ? 'quake' : null),
  samurai: (f, r) => (f.hp < f.maxhp * 0.35 && r % 4 === 0 ? 'gale' : null),
  // the Flame King gathers fire every fourth round; the next turn it erupts
  flameking: (f, r) => (r % 4 === 3 ? 'gather' : null),
  // the Blue Tengu raises a wall of wind (blades glance off), later a diamond wall (magic glances off)
  bluetengu: (f, r) => (r % 3 === 1 ? (Math.floor(r / 3) % 2 ? 'ironwall' : 'windwall') : null),
  // the sea dragon dives, then comes up as a tsunami
  seadragon: (f, r) => (r % 4 === 2 ? 'dive' : null),
  kagemaru: (f, r) => (r % 5 === 3 ? 'vanish' : null),
  genmei: (f, r, n) => (r % 3 === 0 && n < 3 ? 'summon' : null),
  genmei2: (f, r) => (f.hp < f.maxhp * 0.4 && r % 2 === 0 ? 'darkwave' : null),
  homuramaru: (f, r) => (f.hp < f.maxhp * 0.5 && r % 3 === 0 ? 'roar' : null),
  nightdragon: (f, r) => (r % 5 === 4 ? 'devour' : null),
  goldtanuki: (f, r) => (r % 4 === 0 ? 'roar' : null),
};
// enemy picks an action; n is how many foes are standing
export function foeAction(foe, round, n = 1) {
  // a blow wound up last turn lands now
  if (foe.charge) { const a = foe.charge; foe.charge = null; return a; }
  const def = ENEMIES[foe.id];
  const ai = AI[foe.id] && AI[foe.id](foe, round, n);
  if (ai) return ai;
  let acts = def.acts || [['atk', 1]];
  // a sealed foe can only swing
  if (foe.status && foe.status.seal) acts = acts.filter(([a]) => a === 'atk' || a === 'twin');
  if (!acts.length) acts = [['atk', 1]];
  const total = acts.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [a, w] of acts) { r -= w; if (r <= 0) return a; }
  return 'atk';
}
export const isTech = (a) => !!TECHS[a];
export const spellUsable = (id, h, mp) => SPELLS[id].mp <= mp;
