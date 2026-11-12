// The places of acts two and three: the Fog Valley, the open sea, Homura (the oni homeland) and its volcano,
// the village above the clouds and the cloud road, the castaway's island, the Coral Road and the Dragon Palace,
// the oni dojo, the Land of Endless Night, and the bottom of the night where a dragon sleeps.
import { MAPS, grid, canvasMap, warp, npc, mon, obj, fishspot } from './maps.js';
import { localize } from './i18n.js';

// rows of tiles with an override, for bridges that appear when a bell rings
const plank = (m, pts, kind = 'plank') => { const set = new Set(pts.map(([x, y]) => x + ',' + y)); const k = m.kindAt; m.kindAt = (x, y) => (set.has(x + ',' + y) ? kind : k(x, y)); };
const line = (a, b) => { const out = []; let [x, y] = a; const [tx, ty] = b; for (;;) { out.push([x, y]); if (x === tx && y === ty) break; if (x !== tx) x += Math.sign(tx - x); else y += Math.sign(ty - y); } return out; };

// ---------- 霧之谷: the Fog Valley ----------
// a maze of fog: only the path Shiro smells is safe; step off it and the fog turns you round
const FOG_PATH = [[18, 23], [18, 21], [10, 21], [10, 18], [24, 18], [24, 15], [14, 15], [14, 13], [20, 13], [20, 12]];
MAPS.fogvale = {
  name: '霧之谷', music: 'fog', bg: 'fog',
  build(f = {}) {
    const b = canvasMap(36, 32, 'k');
    b.rect(12, 24, 13, 7, ','); b.rect(17, 31, 2, 1, ',');
    b.rect(6, 12, 24, 12, ',');
    b.set(20, 11, ',');
    b.rect(4, 6, 28, 5, ','); b.rect(4, 8, 28, 2, 'M'); b.set(20, 8, '#'); b.set(20, 9, '#');
    b.rect(2, 1, 32, 5, ',');
    for (const [x, y] of [[14, 29], [22, 25], [9, 3], [27, 5], [6, 10], [30, 6]]) b.set(x, y, 'h');
    const m = grid(b.rows(), {}, { id: 'fogvale', fog: true, dark: 0.15 });
    m.ents.push({ ...warp('world', 23, 31, 'd', { exit: true }), x: 17, y: 31 }, { ...warp('world', 23, 31, 'd', { exit: true }), x: 18, y: 31 });
    m.ents.push({ type: 'trigger', run: 'fv_enter', once: 'fogIn', x: 17, y: 29 }, { type: 'trigger', run: 'fv_enter', once: 'fogIn', x: 18, y: 29 });
    const hut = obj(m, 'hut', 13, 25);
    m.ents.push({ type: 'solid', talk: 'fv_hut', x: hut[0], y: hut[1] });
    m.ents.push(npc('hermit', 'OldMan2', 'fv_hermit', { x: 16, y: 27, dir: 'd' }));
    m.ents.push({ type: 'hearth', x: 22, y: 26 }, { type: 'chest', id: 'fvc0', item: 'fuda_holy', n: 2, x: 23, y: 29 });
    // the scent trail and the fog around it
    const path = new Set();
    FOG_PATH.slice(1).forEach((p, i) => line(FOG_PATH[i], p).forEach(([x, y]) => path.add(x + ',' + y)));
    let n = 0;
    for (let y = 12; y <= 23; y++) for (let x = 6; x <= 29; x++) {
      if (path.has(x + ',' + y)) m.ents.push({ type: 'scent', x, y, n: n++ });
      else m.ents.push({ type: 'trigger', run: 'fv_lost', once: null, x, y });
    }
    // the marsh and the toad that sits on the only bridge
    m.ents.push({ type: 'boss', id: 'toad', art: 'boss:GiantFrog', talk: 'fv_toad', x: 20, y: 10, cond: (fl) => !fl.bossToad });
    m.ents.push(mon('v3', { n: 0, x: 8, y: 7, hx: 8, hy: 7 }), mon('v6', { n: 1, x: 28, y: 7, hx: 28, hy: 7 }), mon('v1', { n: 2, x: 11, y: 10, hx: 11, hy: 10 }), mon('v2', { n: 3, x: 27, y: 10, hx: 27, hy: 10 }));
    // the north: Genji's old lodge, and the hideout
    const lodge = obj(m, 'lodge', 4, 1);
    m.ents.push({ type: 'solid', talk: 'fv_lodge', x: lodge[0], y: lodge[1] });
    m.ents.push({ type: 'dig', id: 'fvd0', item: 'genjiletter', x: 8, y: 4 }, { type: 'dig', id: 'fvd1', item: 'magatama', x: 31, y: 5 });
    m.ents.push({ type: 'chest', id: 'fvc1', item: 'scroll_katon', x: 32, y: 2 }, { type: 'chest', id: 'fvc2', item: 'soberbell', x: 2, y: 5 });
    m.ents.push({ type: 'boss', id: 'kagemaru', art: 'charB:NinjaMasked', talk: 'fv_kage', x: 26, y: 3, cond: (fl) => !fl.bossKage });
    m.ents.push(mon('v4', { n: 4, x: 14, y: 3, hx: 14, hy: 3 }), mon('v5', { n: 5, x: 20, y: 2, hx: 20, hy: 2 }));
    for (const [x, y] of [[12, 29], [23, 24]]) obj(m, 'pine', x, y);
    m.entry = [17, 30, 'u'];
    void f;
    return m;
  },
};

// ---------- 鬼海: the open sea ----------
function island(b, cx, cy, rx, ry, inner = 'Y') {
  for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d <= 1) b.set(x, y, d > 0.55 ? 'y' : inner);
  }
}
MAPS.sea = {
  name: '鬼海', music: 'sail', bg: 'sea', safe: true,
  build(f = {}) {
    const b = canvasMap(50, 38, 'W');
    for (let y = 0; y < 38; y++) { const c = 4 + Math.round(Math.sin(y * 0.4) * 1.2); for (let x = 0; x <= c; x++) b.set(x, y, x >= c - 1 ? 'y' : 'Y'); }
    island(b, 26, 18, 5, 4);
    island(b, 43, 7, 5, 4); for (const [x, y] of [[42, 6], [43, 6], [43, 7], [44, 7]]) b.set(x, y, 'A');
    island(b, 11, 32, 4, 3);
    for (const [x, y] of [[37, 28], [38, 28], [37, 29], [38, 29]]) b.set(x, y, 'y');
    for (const [x, y] of [[18, 6], [19, 6], [33, 33], [15, 15], [34, 12]]) b.set(x, y, 'y');
    for (const [x, y] of [[25, 17], [27, 19], [10, 32], [12, 31], [2, 8], [1, 25]]) b.set(x, y, 'Z');
    const m = grid(b.rows(), {}, { id: 'sea', boat: true });
    m.ents.push({ ...warp('port', 25, 13, 'l'), x: 6, y: 20 });
    m.ents.push({ ...warp('isle', 17, 26, 'u'), x: 26, y: 23 });
    m.ents.push({ ...warp('homura', 17, 23, 'u'), x: 43, y: 12 });
    m.ents.push({ ...warp('islet', 14, 23, 'u'), x: 11, y: 28 });
    // the whirlpool over the Dragon Palace
    m.ents.push({ type: 'trigger', run: 'sea_whirl', once: null, x: 41, y: 31 });
    m.ents.push({ type: 'sprite', x: 41, y: 31, draw: (g, X, Y, fr) => { for (let k = 0; k < 3; k++) { g.strokeStyle = k % 2 ? 'rgba(255,255,255,0.8)' : 'rgba(40,90,180,0.8)'; g.beginPath(); g.arc(X + 8, Y + 8, 7 - k * 2, fr / 6 + k, fr / 6 + k + 4.2); g.stroke(); } } });
    // the old rock where the Umibozu likes to sleep
    m.ents.push({ type: 'sprite', x: 37, y: 29, draw: (g, X, Y, fr) => { if ((fr >> 5) % 3 === 0) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(X + 20, Y + 10 - (fr % 32) / 8, 2, 2); } } });
    m.enc = () => 'sea';
    m.entry = [8, 20, 'r'];
    void f;
    return m;
  },
};

// ---------- 焰之鄉: Homura, the oni homeland ----------
MAPS.homura = {
  name: '焰之鄉', music: 'onivillage', safe: true, bg: 'oni',
  build(f = {}) {
    const b = canvasMap(34, 26, 'a');
    for (let x = 0; x < 34; x++) b.set(x, 0, 'A');
    for (let y = 0; y < 26; y++) { b.set(0, y, 'A'); b.set(33, y, 'A'); }
    b.rect(0, 23, 34, 3, 'S'); b.rect(16, 21, 2, 5, '#');
    b.road([[17, 21], [17, 4]], 's'); b.road([[5, 12], [29, 12]], 's');
    b.rect(24, 16, 5, 3, 'H');
    b.rect(28, 20, 4, 2, 'A'); b.rect(2, 2, 3, 2, 'A');
    const m = grid(b.rows(), {}, { id: 'homura' });
    m.ents.push({ ...warp('sea', 43, 13, 'd'), x: 16, y: 25 }, { ...warp('sea', 43, 13, 'd'), x: 17, y: 25 });
    m.ents.push({ type: 'trigger', run: 'ho_arrive', once: 'homuraIn', x: 16, y: 21 }, { type: 'trigger', run: 'ho_arrive', once: 'homuraIn', x: 17, y: 21 });
    const cave = obj(m, 'cave', 16, 1);
    m.ents.push({ ...warp('volcano', 15, 37, 'u'), x: cave[0], y: cave[1] });
    for (const [x, y] of [[4, 6], [9, 6], [22, 6]]) obj(m, 'straw', x, y);
    const inn = obj(m, 'lodge', 27, 6), smithy = obj(m, 'hut', 10, 16);
    obj(m, 'straw', 3, 15);
    m.ents.push({ type: 'solid', talk: 'ho_inndoor', x: inn[0], y: inn[1] }, { type: 'solid', talk: 'ho_smithdoor', x: smithy[0], y: smithy[1] });
    m.ents.push({ ...fishspot('hot'), x: 26, y: 16 });
    m.ents.push({ type: 'hearth', x: 6, y: 19 });
    m.ents.push(
      npc('gokiH', 'DemonGreen', 'ho_goki', { x: 19, y: 13, dir: 'l' }),
      npc('elderH', 'Shaman', 'ho_elder', { x: 6, y: 10, dir: 'd' }),
      npc('smith', 'Caveman2', 'ho_smith', { x: 11, y: 19, dir: 'd' }),
      npc('shopH', 'Cavegirl', 'ho_shop', { x: 24, y: 11, dir: 'd' }),
      npc('onsen', 'OldWoman', 'ho_onsen', { x: 23, y: 15, dir: 'r' }),
      npc('kidH', 'Child', 'ho_kid', { x: 14, y: 19, dir: 'r', wander: true }),
      npc('innH', 'Woman', 'ho_inn', { x: 28, y: 10, dir: 'd' }),
      npc('mamaH', 'MonkeyGrey', 'ho_mama', { x: 8, y: 20, dir: 'r', cond: (fl) => !!fl.natsumeMom }),
      npc('homuraH', 'DemonRed', 'ho_homura', { x: 21, y: 13, dir: 'l', cond: (fl) => !!fl.redeemed_homuramaru }),
    );
    for (const [x, y] of [[2, 20], [30, 3], [12, 2]]) obj(m, 'deadtree', x, y);
    m.entry = [17, 22, 'u'];
    void f;
    return m;
  },
};

// ---------- 炎嶽: the volcano ----------
MAPS.volcano = {
  name: '炎嶽', music: 'volcano', bg: 'volcano',
  build(f = {}) {
    const b = canvasMap(32, 40, 'A');
    b.rect(11, 33, 10, 6, 'a'); b.rect(15, 39, 2, 1, 'a');
    b.rect(6, 35, 5, 2, 'a');
    b.rect(15, 30, 1, 3, 'a');
    b.rect(6, 24, 20, 6, 'a'); b.rect(26, 26, 4, 3, 'a');
    b.rect(15, 19, 1, 5, 'a');
    b.rect(6, 13, 20, 6, 'a'); b.rect(6, 16, 20, 1, 'A'); b.set(15, 16, 'a');
    b.rect(3, 13, 3, 3, 'a'); b.set(4, 12, 'C'); b.rect(2, 9, 4, 3, 'a');
    b.rect(15, 11, 1, 2, 'a');
    b.rect(11, 7, 9, 4, 'a'); b.set(15, 6, 'a'); b.set(15, 5, 'a');
    b.rect(8, 1, 16, 4, 'a');
    const m = grid(b.rows(), {}, { id: 'volcano', dark: 0.2, tint: 'rgba(120,30,0,0.12)' });
    m.ents.push({ ...warp('homura', 17, 4, 'd', { exit: true }), x: 15, y: 39 }, { ...warp('homura', 17, 4, 'd', { exit: true }), x: 16, y: 39 });
    // Natsume's mother is somewhere past the great boulder
    m.ents.push({ type: 'trigger', run: 'vo_mother', once: 'volcanoMom', x: 15, y: 33 });
    m.ents.push({ type: 'block', x: 15, y: 30, cond: (fl) => !fl.natsumeStrong });
    m.ents.push({ type: 'sign', talk: 'vo_sign', x: 13, y: 33 });
    // two boulders onto two plates open the gate
    m.ents.push({ type: 'plate', group: 'va', x: 9, y: 25 }, { type: 'plate', group: 'va', x: 22, y: 25 });
    m.ents.push({ type: 'block', x: 10, y: 27 }, { type: 'block', x: 21, y: 27 });
    m.ents.push({ type: 'gate', group: 'va', x: 15, y: 23 });
    // a pit in the lava: fill it with a boulder to cross
    m.ents.push({ type: 'block', x: 15, y: 18 }, { type: 'hole', key: 'vh', x: 15, y: 16 });
    // the scarred oni, up on a ledge in the mine
    m.ents.push({ type: 'vine', x: 4, y: 12, top: [4, 11], bottom: [4, 13] });
    m.ents.push(npc('father', 'Caveman2', 'vo_father', { x: 3, y: 10, dir: 'd', cond: (fl) => !fl.fatherFreed }));
    m.ents.push({ type: 'chest', id: 'voc0', item: 'fuda_water', n: 2, x: 7, y: 35 }, { type: 'chest', id: 'voc1', item: 'magatama', x: 29, y: 27 }, { type: 'chest', id: 'voc2', item: 'ironore', n: 3, x: 2, y: 9 });
    m.ents.push({ type: 'chest', id: 'voc3', item: 'scroll_doton', x: 22, y: 2 }, { type: 'chest', id: 'voc4', item: 'firecharm', x: 9, y: 2 });
    m.ents.push({ type: 'hearth', x: 12, y: 8 });
    m.ents.push({ type: 'boss', id: 'homuramaru', art: 'boss:DemonCyclop', talk: 'vo_homura', x: 15, y: 6, cond: (fl) => !fl.bossHomura });
    m.ents.push({ type: 'boss', id: 'flameking', art: 'boss:GiantFlam', talk: 'vo_flame', x: 15, y: 2, cond: (fl) => !fl.bossFlame });
    m.ents.push({ type: 'sprite', x: 15, y: 1, draw: (g, X, Y, fr) => { if (!f.bossFlame) return; g.fillStyle = '#f84828'; g.beginPath(); g.arc(X + 8, Y + 8 + Math.sin(fr / 12) * 2, 4, 0, 7); g.fill(); g.fillStyle = '#ffe0a0'; g.fillRect(X + 6, Y + 5, 2, 2); } });
    m.ents.push(mon('h1', { n: 0, x: 18, y: 36, hx: 18, hy: 36 }), mon('h3', { n: 1, x: 8, y: 35, hx: 8, hy: 35 }), mon('h4', { n: 2, x: 28, y: 27, hx: 28, hy: 27, range: 1 }),
      mon('h5', { n: 3, x: 9, y: 14, hx: 9, hy: 14, range: 2 }), mon('h6', { n: 4, x: 22, y: 14, hx: 22, hy: 14, range: 2 }), mon('h7', { n: 5, x: 18, y: 9, hx: 18, hy: 9, range: 2 }), mon('h2', { n: 6, x: 19, y: 3, hx: 19, hy: 3, range: 2 }));
    m.entry = [15, 37, 'u'];
    return m;
  },
};

// ---------- 雲之里: the village above the clouds ----------
MAPS.skyvillage = {
  name: '雲之里', music: 'sky', safe: true, bg: 'cloud',
  build(f = {}) {
    const b = canvasMap(30, 22, 'U');
    b.rect(4, 4, 22, 14, 'K'); b.rect(12, 18, 5, 3, 'K'); b.set(14, 21, 'K');
    b.rect(13, 0, 3, 4, 'K');
    b.rect(27, 8, 2, 4, 'K'); b.set(26, 9, 'J');
    const m = grid(b.rows(), {}, { id: 'skyvillage' });
    m.ents.push({ ...warp('cliff', 15, 3, 'd', { exit: true }), x: 14, y: 21 });
    m.ents.push({ ...warp('cloud', 16, 39, 'u'), x: 14, y: 0 });
    m.ents.push({ type: 'trigger', run: 'sv_arrive', once: 'skyIn', x: 14, y: 18 });
    const lodge = obj(m, 'lodge', 6, 5), shrine = obj(m, 'shrine', 18, 5);
    obj(m, 'hut', 5, 12); obj(m, 'straw', 21, 12);
    m.ents.push({ type: 'solid', talk: 'sv_lodge', x: lodge[0], y: lodge[1] }, { type: 'solid', talk: 'sv_shrine', x: shrine[0], y: shrine[1] });
    m.ents.push({ ...fishspot('sky'), x: 3, y: 10 });
    m.ents.push({ type: 'hearth', x: 23, y: 16 }, { type: 'chest', id: 'svc0', item: 'tengufeather', n: 2, x: 28, y: 10 });
    m.ents.push(
      npc('kijimom', 'ParrotRed', 'sv_mother', { x: 10, y: 10, dir: 'd' }),
      npc('shopS', 'Tengu2', 'sv_shop', { x: 20, y: 9, dir: 'd' }),
      npc('elderS', 'Tengu', 'sv_elder', { x: 14, y: 8, dir: 'd' }),
      npc('teaS', 'Monk', 'sv_tea', { x: 11, y: 15, dir: 'r' }),
      npc('kidS', 'Tengu2', 'sv_kid', { x: 17, y: 15, dir: 'l', wander: true }),
      npc('flockS', 'ParrotBlue', 'sv_flock', { x: 8, y: 16, dir: 'r' }),
    );
    m.entry = [14, 19, 'u'];
    void f;
    return m;
  },
};

// ---------- 雲上之道: the cloud road ----------
// cloud islands with only the sky between; Kiji carries everyone on the updrafts
MAPS.cloud = {
  name: '雲上之道', music: 'cloud', bg: 'cloud',
  build(f = {}) {
    const b = canvasMap(32, 42, 'U');
    b.rect(10, 35, 12, 6, 'K'); b.set(16, 41, 'K');
    b.rect(2, 26, 12, 6, 'K');
    b.rect(14, 20, 14, 3, 'K'); b.rect(14, 15, 14, 3, 'K'); b.set(20, 18, 'J'); b.set(20, 19, 'J');
    b.rect(3, 9, 12, 5, 'K');
    b.rect(10, 1, 14, 6, 'K');
    b.rect(25, 28, 5, 4, 'K');
    const m = grid(b.rows(), {}, { id: 'cloud' });
    m.ents.push({ ...warp('skyvillage', 14, 1, 'd', { exit: true }), x: 16, y: 41 });
    const up = (id, x, y, tx, ty) => m.ents.push({ type: 'updraft', id, x, y, tx, ty });
    up('u1', 11, 35, 8, 30); up('u1b', 12, 31, 14, 36);
    up('u2', 4, 26, 16, 21); up('u2b', 14, 22, 6, 27);
    up('u3', 21, 36, 27, 30); up('u3b', 26, 31, 19, 37);
    up('u4', 15, 15, 12, 12); up('u4b', 13, 13, 17, 16);
    up('u5', 4, 9, 12, 5); up('u5b', 11, 6, 6, 10);
    m.ents.push({ type: 'boss', id: 'cloudking', art: 'boss:GiantSlime', talk: 'cl_mirage', x: 20, y: 19, cond: (fl) => !fl.bossCloud });
    m.ents.push({ type: 'boss', id: 'bluetengu', art: 'boss:TenguBlue', talk: 'cl_blue', x: 16, y: 2, cond: (fl) => !fl.bossBlue });
    m.ents.push({ type: 'chest', id: 'cuc0', item: 'windcharm', x: 28, y: 29 }, { type: 'chest', id: 'cuc1', item: 'seed_agi', x: 4, y: 12 }, { type: 'chest', id: 'cuc2', item: 'scroll_raiton', x: 22, y: 2 }, { type: 'chest', id: 'cuc3', item: 'magatama', x: 27, y: 21 });
    m.ents.push({ type: 'hearth', x: 6, y: 12 });
    m.ents.push(mon('c1', { n: 0, x: 18, y: 38, hx: 18, hy: 38, range: 2 }), mon('c2', { n: 1, x: 7, y: 28, hx: 7, hy: 28, range: 2 }), mon('c3', { n: 2, x: 24, y: 21, hx: 24, hy: 21, range: 2 }),
      mon('c4', { n: 3, x: 24, y: 16, hx: 24, hy: 16, range: 2 }), mon('c5', { n: 4, x: 9, y: 11, hx: 9, hy: 11, range: 2 }), mon('c6', { n: 5, x: 20, y: 5, hx: 20, hy: 5, range: 2 }));
    m.entry = [16, 39, 'u'];
    void f;
    return m;
  },
};

// ---------- 無人島: the castaway's island ----------
MAPS.islet = {
  name: '無人島', music: 'islet', bg: 'islet',
  build(f = {}) {
    const b = canvasMap(30, 26, 'S');
    for (let y = 0; y < 26; y++) for (let x = 0; x < 30; x++) {
      const d = ((x - 15) / 12) ** 2 + ((y - 12) / 10) ** 2;
      if (d <= 1) b.set(x, y, d > 0.62 ? ':' : '.');
    }
    b.rect(14, 21, 1, 5, '#');
    b.rect(18, 3, 8, 7, ',');
    const m = grid(b.rows(), {}, { id: 'islet' });
    m.ents.push({ ...warp('sea', 11, 27, 'u', { exit: true }), x: 14, y: 25 });
    const hut = obj(m, 'hut', 6, 8);
    m.ents.push({ type: 'solid', talk: 'il_hut', x: hut[0], y: hut[1] });
    m.ents.push(npc('castaway', 'OldMan3', 'il_castaway', { x: 9, y: 12, dir: 'd' }));
    m.ents.push({ ...fishspot('sea'), x: 2, y: 12 }, { ...fishspot('deep'), x: 27, y: 15 });
    m.ents.push({ type: 'hearth', x: 12, y: 10 });
    // the bamboo grove and its king
    for (const x of [18, 25]) for (let y = 3; y <= 9; y += 3) obj(m, 'bamboo', x, y);
    m.ents.push({ type: 'boss', id: 'bambooking', art: 'boss:GiantBamboo2', talk: 'il_bamboo', x: 22, y: 6, cond: (fl) => !fl.bossBamboo });
    m.ents.push({ type: 'chest', id: 'ilc0', item: 'magatama', x: 22, y: 4 }, { type: 'chest', id: 'ilc1', item: 'luckycoin', x: 23, y: 4 });
    m.ents.push({ type: 'dig', id: 'ild0', item: 'seed_hp', x: 10, y: 17 }, { type: 'dig', id: 'ild1', item: 'chestnut', x: 20, y: 17 });
    for (const [x, y] of [[4, 15], [8, 19], [21, 19], [24, 12], [12, 4]]) obj(m, (x + y) % 2 ? 'palm' : 'palm2', x, y);
    m.ents.push(mon('i1', { n: 0, x: 11, y: 6, hx: 11, hy: 6 }), mon('i2', { n: 1, x: 17, y: 14, hx: 17, hy: 14 }), mon('i3', { n: 2, x: 6, y: 17, hx: 6, hy: 17, range: 3 }));
    m.entry = [14, 23, 'u'];
    void f;
    return m;
  },
};

// ---------- 珊瑚之道: the Coral Road under the sea ----------
MAPS.reef = {
  name: '珊瑚之道', music: 'reef', bg: 'reef',
  build(f = {}) {
    const b = canvasMap(32, 36, 'R');
    b.rect(13, 0, 6, 4, ':'); b.rect(15, 4, 2, 3, ':');
    b.rect(4, 7, 24, 6, ':'); b.rect(6, 10, 19, 1, '>');
    b.rect(7, 13, 2, 3, ':'); b.rect(23, 13, 2, 3, ':');
    b.rect(3, 16, 12, 6, ':'); b.rect(18, 16, 11, 6, ':'); b.rect(27, 16, 1, 5, '^');
    b.rect(3, 22, 26, 2, ':');
    b.rect(16, 24, 1, 3, ':');
    b.rect(6, 27, 20, 6, ':'); b.rect(8, 27, 1, 4, 'V');
    b.set(16, 33, ':'); b.set(16, 34, ':');
    // coral only along the edges of the paths; deeper in, open blue water
    const floor = (c) => c && c !== 'R' && c !== 'D';
    for (let y = 0; y < 36; y++) for (let x = 0; x < 32; x++) if (b.get(x, y) === 'R') { let near = false; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (floor(b.get(x + i, y + j))) near = true; if (!near) b.set(x, y, 'D'); }
    const m = grid(b.rows(), {}, { id: 'reef', tint: 'rgba(20,80,200,0.32)', dark: 0.2 });
    m.ents.push({ ...warp('sea', 40, 31, 'l', { exit: true }), x: 16, y: 0 });
    m.ents.push({ type: 'trigger', run: 'rf_enter', once: 'reefIn', x: 16, y: 3 });
    m.ents.push({ type: 'dig', id: 'rfd0', item: 'shellkey', x: 5, y: 18 }, { type: 'dig', id: 'rfd1', item: 'pearl', x: 26, y: 20 });
    m.ents.push({ type: 'chest', id: 'rfc0', item: 'pearl', x: 12, y: 20 }, { type: 'chest', id: 'rfc1', item: 'seacharm', x: 20, y: 17 }, { type: 'chest', id: 'rfc2', item: 'magatama', x: 25, y: 31 });
    m.ents.push({ type: 'boss', id: 'inklord', art: 'boss:SquidGreen', talk: 'rf_ink', x: 16, y: 24, cond: (fl) => !fl.bossInk });
    m.ents.push({ type: 'solid', talk: 'rf_gate', x: 16, y: 33, cond: (fl) => !fl.shellKey });
    m.ents.push({ type: 'sprite', x: 16, y: 33, draw: (g, X, Y) => { if (f.shellKey) return; g.fillStyle = '#e8d0b0'; g.beginPath(); g.ellipse(X + 8, Y + 8, 8, 7, 0, 0, 7); g.fill(); g.strokeStyle = '#a07858'; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(X + 8, Y + 14); g.lineTo(X + 8 + k * 3, Y + 2); g.stroke(); } } });
    m.ents.push({ ...warp('palace', 17, 25, 'u'), x: 16, y: 34 });
    m.ents.push({ type: 'hearth', x: 24, y: 31 });
    m.ents.push(mon('r1', { n: 0, x: 8, y: 8, hx: 8, hy: 8, range: 2 }), mon('r2', { n: 1, x: 22, y: 12, hx: 22, hy: 12, range: 2 }), mon('r3', { n: 2, x: 10, y: 17, hx: 10, hy: 17, range: 2 }),
      mon('r4', { n: 3, x: 22, y: 19, hx: 22, hy: 19, range: 2 }), mon('r5', { n: 4, x: 11, y: 30, hx: 11, hy: 30, range: 2 }), mon('r6', { n: 5, x: 21, y: 29, hx: 21, hy: 29, range: 2 }));
    m.entry = [16, 2, 'd'];
    return m;
  },
};

// ---------- 龍宮: the Dragon Palace ----------
MAPS.palace = {
  name: '龍宮', music: 'palace', bg: 'palace',
  build(f = {}) {
    const b = canvasMap(34, 28, 'I');
    b.rect(2, 12, 30, 14, 'T'); b.set(17, 26, 'T'); b.set(17, 27, 'T');
    b.rect(10, 2, 14, 8, 'T'); b.rect(17, 10, 1, 2, 'T');
    b.rect(22, 20, 3, 2, 'H');
    const m = grid(b.rows(), {}, { id: 'palace', tint: 'rgba(30,90,200,0.14)' });
    m.ents.push({ ...warp('reef', 16, 32, 'u', { exit: true }), x: 17, y: 27 });
    m.ents.push({ type: 'trigger', run: 'pa_enter', once: 'palaceIn', x: 17, y: 24 });
    m.ents.push({ type: 'solid', talk: 'pa_door', x: 17, y: 11, cond: (fl) => !fl.shioneAsked });
    m.ents.push({ type: 'boss', id: 'seadragon', art: 'dragon:DragonBlue', talk: 'pa_dragon', x: 17, y: 4, cond: (fl) => !fl.bossDragon });
    m.ents.push({ type: 'chest', id: 'pac0', item: 'dragonorb', x: 11, y: 3 }, { type: 'chest', id: 'pac1', item: 'scroll_suiton', x: 22, y: 3 });
    m.ents.push({ ...fishspot('deep'), x: 23, y: 20 });
    m.ents.push({ type: 'hearth', x: 4, y: 14 });
    for (const x of [12, 21]) obj(m, 'statue', x, 6);
    for (const x of [8, 14, 20, 26]) obj(m, 'lantern', x, 12);
    m.ents.push(
      npc('shione', 'NinjaWater', 'pa_shione', { x: 17, y: 14, dir: 'd' }),
      npc('fish1', 'FishRed', 'pa_fish1', { x: 8, y: 16, dir: 'r' }),
      npc('fish2', 'FishYellow', 'pa_fish2', { x: 26, y: 17, dir: 'l' }),
      npc('fish3', 'FishWhite', 'pa_fish3', { x: 12, y: 22, dir: 'r', wander: true }),
      npc('turtle', 'Frog', 'pa_turtle', { x: 27, y: 22, dir: 'l' }),
      npc('shopP', 'NinjaBlue2', 'pa_shop', { x: 6, y: 20, dir: 'r' }),
      npc('innP', 'EggGirl', 'pa_inn', { x: 28, y: 14, dir: 'd' }),
    );
    m.entry = [17, 25, 'u'];
    void f;
    return m;
  },
};

// ---------- 鬼之道場: the oni dojo ----------
MAPS.dojo = {
  name: '鬼之道場', music: 'dojo', safe: true, bg: 'dojo',
  build(f = {}) {
    const b = canvasMap(20, 14, 'I');
    b.room(0, 0, 20, 14, 'I', 'F'); b.set(9, 13, 'F');
    b.rect(6, 4, 8, 5, 'T');
    const m = grid(b.rows(), {}, { id: 'dojo' });
    m.ents.push({ ...warp('isle', 25, 15, 'd', { exit: true }), x: 9, y: 13 });
    m.ents.push(
      npc('master', 'MaskRacoon', 'dj_master', { x: 9, y: 2, dir: 'd' }),
      npc('desk', 'Caveman', 'dj_desk', { x: 4, y: 6, dir: 'r' }),
      npc('fan1', 'Cavegirl', 'dj_fan', { x: 16, y: 8, dir: 'l' }),
      npc('fan2', 'Child', 'dj_fan2', { x: 3, y: 10, dir: 'r' }),
    );
    m.ents.push({ type: 'hearth', x: 16, y: 11 });
    for (const [x, y] of [[1, 1], [18, 1], [1, 12], [18, 12]]) m.ents.push({ type: 'sprite', x, y, solid: true, draw: (g, X, Y) => g.drawImage(MAPS.dojo.barrel(), X, Y) });
    m.entry = [9, 12, 'u'];
    void f;
    return m;
  },
};

// ---------- 常夜之國: the Land of Endless Night ----------
MAPS.yomi1 = {
  name: '常夜之國', music: 'yomi', bg: 'yomi',
  build(f = {}) {
    const b = canvasMap(34, 36, 'G');
    b.rect(10, 29, 13, 6, 's'); b.set(16, 35, 's');
    b.rect(24, 30, 6, 3, 's'); b.set(23, 31, 's');
    b.rect(10, 27, 13, 2, 'M'); b.set(16, 27, '#'); b.set(16, 28, '#');
    b.rect(10, 26, 13, 1, 's');
    b.rect(4, 19, 26, 7, 's');
    b.rect(16, 15, 1, 4, 's');
    b.rect(4, 8, 26, 7, 's'); b.rect(4, 11, 26, 1, 'D');
    b.rect(15, 5, 3, 3, 's');
    const m = grid(b.rows(), {}, { id: 'yomi1', dark: 0.42, tint: 'rgba(60,0,90,0.22)' });
    if (f.yomiBridge) plank(m, [[16, 11]]);
    m.ents.push({ ...warp('isle', 17, 6, 'd', { exit: true }), x: 16, y: 35 });
    m.ents.push({ ...warp('yomi2', 16, 32, 'u'), x: 16, y: 5 });
    m.ents.push({ type: 'trigger', run: 'yo_enter', once: 'yomiIn', x: 16, y: 33 });
    m.ents.push({ type: 'trigger', run: 'yo_kage', once: 'yomiKage', x: 16, y: 30 });
    m.ents.push({ type: 'hearth', x: 12, y: 33 });
    m.ents.push({ ...fishspot('yomi'), x: 12, y: 28 });
    // boulders onto plates
    m.ents.push({ type: 'plate', group: 'yp', x: 6, y: 20 }, { type: 'plate', group: 'yp', x: 27, y: 20 });
    m.ents.push({ type: 'block', x: 8, y: 23 }, { type: 'block', x: 25, y: 23 });
    m.ents.push({ type: 'gate', group: 'yp', x: 16, y: 18 });
    m.ents.push({ type: 'sign', talk: 'yo_sign', x: 14, y: 26 });
    // a bell across the chasm
    m.ents.push({ type: 'perch', id: 'yp0', bell: 'yb0', x: 8, y: 13 }, { type: 'bellpost', id: 'yb0', flag: 'yomiBridge', x: 26, y: 9 });
    m.ents.push({ type: 'dig', id: 'yod0', item: 'magatama', x: 22, y: 13 });
    m.ents.push({ type: 'chest', id: 'yoc0', item: 'spiritsilk', n: 2, x: 28, y: 31 }, { type: 'chest', id: 'yoc1', item: 'nightbell', x: 5, y: 9 });
    m.ents.push(mon('y5', { n: 0, x: 26, y: 31, hx: 26, hy: 31, range: 1 }), mon('y1', { n: 1, x: 10, y: 9, hx: 10, hy: 9, range: 2 }), mon('y3', { n: 2, x: 24, y: 13, hx: 24, hy: 13, range: 2 }),
      mon('y2', { n: 3, x: 6, y: 13, hx: 6, hy: 13, range: 1 }), mon('y4', { n: 4, x: 22, y: 9, hx: 22, hy: 9, range: 2 }));
    m.entry = [16, 34, 'u'];
    return m;
  },
};
MAPS.yomi2 = {
  name: '常夜之國・深處', music: 'curse', bg: 'yomi',
  build(f = {}) {
    const b = canvasMap(34, 36, 'G');
    b.rect(6, 26, 22, 8, 's'); b.set(16, 34, 's');
    b.rect(16, 18, 1, 8, 's');
    b.rect(6, 17, 22, 1, 'C');
    b.rect(6, 10, 22, 7, 's');
    b.set(16, 9, 's');
    b.rect(10, 2, 14, 7, 'm');
    const m = grid(b.rows(), {}, { id: 'yomi2', dark: 0.45, tint: 'rgba(60,0,90,0.25)' });
    m.ents.push({ ...warp('yomi1', 16, 6, 'd', { exit: true }), x: 16, y: 34 });
    m.ents.push({ type: 'hearth', x: 8, y: 32 });
    // three seals, one for each root-jewel
    m.ents.push({ type: 'seal', id: 'seal1', talk: 'yo_seal', jewel: 'jewel_fire', x: 16, y: 23, cond: (fl) => !fl.seal_jewel_fire });
    m.ents.push({ type: 'seal', id: 'seal2', talk: 'yo_seal', jewel: 'jewel_sky', x: 16, y: 21, cond: (fl) => !fl.seal_jewel_sky });
    m.ents.push({ type: 'seal', id: 'seal3', talk: 'yo_seal', jewel: 'jewel_sea', x: 16, y: 19, cond: (fl) => !fl.seal_jewel_sea });
    m.ents.push({ type: 'vine', x: 16, y: 17, top: [16, 16], bottom: [16, 18] });
    m.ents.push({ type: 'chest', id: 'y2c0', item: 'elixir', n: 2, x: 7, y: 11 }, { type: 'chest', id: 'y2c1', item: 'seed_int', x: 26, y: 11 }, { type: 'chest', id: 'y2c2', item: 'fuda_holy', n: 3, x: 26, y: 32 });
    m.ents.push({ type: 'boss', id: 'genmei', art: 'charB:NinjaMageBlack', talk: 'yo_genmei', x: 16, y: 4, cond: (fl) => !fl.bossGenmei });
    m.ents.push(npc('captive', 'grandma', 'yo_granny', { x: 16, y: 2, dir: 'd', cond: (fl) => !fl.bossGenmei }));
    // after it is all over, a stair still leads down into the deepest dark
    m.ents.push({ ...warp('abyss', 11, 16, 'u'), x: 22, y: 3, cond: (fl) => !!fl.cleared });
    m.ents.push({ type: 'sprite', x: 22, y: 3, draw: (g, X, Y) => { if (!f.cleared) return; g.fillStyle = '#000'; g.fillRect(X + 1, Y + 1, 14, 14); g.fillStyle = '#402050'; for (let k = 0; k < 4; k++) g.fillRect(X + 2, Y + 2 + k * 3, 12, 1); } });
    m.ents.push(mon('y6', { n: 0, x: 9, y: 28, hx: 9, hy: 28, range: 2 }), mon('y7', { n: 1, x: 24, y: 29, hx: 24, hy: 29, range: 2 }), mon('y4', { n: 2, x: 10, y: 13, hx: 10, hy: 13, range: 2 }),
      mon('y5', { n: 3, x: 23, y: 14, hx: 23, hy: 14, range: 2 }), mon('y3', { n: 4, x: 20, y: 11, hx: 20, hy: 11, range: 2 }));
    m.entry = [16, 33, 'u'];
    void f;
    return m;
  },
};
MAPS.abyss = {
  name: '常夜之底', music: 'abyss', bg: 'abyss',
  build(f = {}) {
    const b = canvasMap(22, 20, 'G');
    b.rect(2, 2, 18, 16, 's'); b.set(11, 18, 's');
    const m = grid(b.rows(), {}, { id: 'abyss', dark: 0.5, tint: 'rgba(30,0,40,0.3)' });
    m.ents.push({ ...warp('yomi2', 22, 4, 'd', { exit: true }), x: 11, y: 18 });
    m.ents.push({ type: 'hearth', x: 4, y: 15 });
    m.ents.push({ type: 'boss', id: 'nightdragon', art: 'dragon:DragonGreen', hue: 200, talk: 'ab_dragon', x: 11, y: 6, cond: (fl) => !fl.bossNight });
    m.entry = [11, 16, 'u'];
    void f;
    return m;
  },
};
// a little barrel for the dojo corners
let barrelPic = null;
MAPS.dojo.barrel = () => {
  if (!barrelPic) { barrelPic = document.createElement('canvas'); barrelPic.width = 16; barrelPic.height = 16; const g = barrelPic.getContext('2d'); g.fillStyle = '#8a5028'; g.fillRect(3, 2, 10, 13); g.fillStyle = '#5a3018'; g.fillRect(3, 5, 10, 1); g.fillRect(3, 11, 10, 1); g.fillStyle = '#b07040'; g.fillRect(5, 2, 2, 13); }
  return barrelPic;
};

localize(MAPS, {
  fogvale: ['The Fog Valley'], sea: ['The Oni Sea'], homura: ['Homura'], volcano: ['Mount Homura'], skyvillage: ['The Village in the Clouds'], cloud: ['The Cloud Road'],
  islet: ['Castaway Island'], reef: ['The Coral Road'], palace: ['The Dragon Palace'], dojo: ['The Oni Dojo'], yomi1: ['The Land of Endless Night'],
  yomi2: ['The Depths of the Night'], abyss: ['The Bottom of the Night'],
}, ['name']);
