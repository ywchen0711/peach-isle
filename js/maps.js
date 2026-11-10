// Every place in 桃源鬼島記: the river where the peach floated by, 黍之里 village, the road east, the White Fang
// Forest, Monkey-Cry Mountain, Shiomi Harbour, the Tengu Cliffs, the sea, the Oni Isle and Kurogane's fortress.
// Ground is laid out as letters; trees, houses and other big things are objects placed on top with obj().
import { hash } from './gfx.js';
import { tileset } from './assets.js';
import { ENEMIES, TROOPS } from './data.js';
import { localize } from './i18n.js';

// characters shared by all maps
const BASE = {
  '.': 'grass', ',': 'dgrass', '=': 'path', '-': 'dpath', ':': 'sand', '~': 'water', 'S': 'sea', 'D': 'deep', 'L': 'lily', '#': 'plank',
  '_': 'wood', 'b': 'brick', 's': 'stone', 'm': 'moss', 't': 'tile', 'w': 'snow',
  'I': 'iwall', 'O': 'owall', 'C': 'cwall', 'G': 'gwall', ' ': 'void',
  'f': 'flower', 'g': 'flower2', 'h': 'flower3', 'c': 'clover', 'v': 'weed', 'n': 'bush', 'N': 'bush2', 'k': 'dbush', 'o': 'rock', 'q': 'srock', 'Q': 'crock', 'u': 'stumpt',
};
// rows + legend -> a map; legend values are a tile kind or { k: kind, e: entity | (x, y, n) => entity }
function grid(rows, legend = {}, meta = {}) {
  const Lg = { ...BASE, ...legend }, h = rows.length, w = rows[0].length;
  rows.forEach((r, i) => { if (r.length !== w) throw new Error(`${meta.id} row ${i} is ${r.length} wide, not ${w}`); });
  const ents = [], kinds = [], count = {};
  for (let y = 0; y < h; y++) {
    kinds.push([]);
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x], v = Lg[ch];
      if (v === undefined) throw new Error(`${meta.id}: no legend for '${ch}'`);
      if (typeof v === 'string') { kinds[y].push(v); continue; }
      kinds[y].push(v.k);
      const n = (count[ch] = (count[ch] || 0) + 1) - 1;
      const e = typeof v.e === 'function' ? v.e(x, y, n) : v.e;
      if (e) for (const one of [].concat(e)) ents.push({ x, y, ...one });
    }
  }
  return { w, h, kindAt: (x, y) => kinds[y][x], ents, ...meta };
}
function canvasMap(w, h, fill) {
  const g = Array.from({ length: h }, () => Array(w).fill(fill));
  const b = {
    g, w, h,
    set(x, y, c) { if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; },
    get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? g[y][x] : null; },
    rect(x, y, rw, rh, c) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) b.set(x + i, y + j, c); },
    // a line of path from point to point, first across, then down
    road(pts, c = '=') { for (let i = 0; i + 1 < pts.length; i++) { let [x, y] = pts[i]; const [tx, ty] = pts[i + 1]; for (;;) { b.set(x, y, c); if (x === tx && y === ty) break; if (x !== tx) x += Math.sign(tx - x); else y += Math.sign(ty - y); } } },
    // a room: wall all round, floor inside
    room(x, y, rw, rh, wall, floor) { b.rect(x, y, rw, rh, wall); b.rect(x + 1, y + 1, rw - 2, rh - 2, floor); },
    rows() { return g.map((r) => r.join('')); },
  };
  return b;
}
const warp = (to, tx, ty, dir = 'd', extra = {}) => ({ type: 'warp', to, tx, ty, dir, ...extra });
const npc = (id, spriteName, talk, extra = {}) => ({ type: 'npc', id, sprite: spriteName, talk, ...extra });
// a visible monster carrying its own troop
const mon = (troop, extra = {}) => ({ type: 'enemy', troop: TROOPS[troop], art: ENEMIES[TROOPS[troop][0]].art, range: 4, sight: 4, ...extra });

// ---------- big things: trees, houses, rocks ----------
// [tileset, x, y, w, h] in tiles; door: the column you walk in by; foot: how many rows from the bottom are solid
export const OBJ = {
  house: ['house', 0, 0, 4, 3, { door: 1 }], cottage: ['house', 4, 0, 4, 3, { door: 1 }], farmhouse: ['house', 8, 0, 4, 3, { door: 1 }], shrine: ['house', 12, 0, 4, 3, { door: 1 }],
  shop: ['house', 16, 0, 3, 3, { door: 1 }], inn: ['house', 19, 0, 4, 3, { door: 2 }], hut: ['house', 23, 0, 3, 3, { door: 1 }], lodge: ['house', 26, 0, 3, 3, { door: 1 }],
  torii: ['house', 0, 5, 3, 2, { posts: true }], cave: ['house', 0, 7, 3, 3, { door: 1 }], straw: ['house', 3, 7, 3, 3, { door: 1 }], keep: ['house', 25, 7, 4, 7, { door: 1 }],
  tree: ['nature', 16, 0, 2, 2], tree2: ['nature', 18, 0, 2, 2], peach: ['nature', 14, 0, 2, 2], pine: ['nature', 2, 0, 2, 2], oak: ['nature', 6, 0, 2, 2],
  grove: ['nature', 4, 2, 4, 3], peachgrove: ['nature', 12, 2, 4, 3], pinegrove: ['nature', 0, 2, 4, 3], bigpeach: ['nature', 0, 18, 3, 3], bigtree: ['nature', 3, 18, 3, 3],
  deadtree: ['nature', 4, 0, 2, 2], bamboo: ['nature', 11, 8, 1, 3], boulder: ['nature', 13, 8, 2, 2, { foot: 2 }], greyrock: ['nature', 16, 8, 2, 2, { foot: 2 }],
  stump: ['nature', 0, 8, 2, 2, { foot: 2 }], boat: ['water', 26, 0, 2, 1, { foot: 1 }], statue: ['house', 1, 15, 2, 3, { foot: 2 }],
};
// put an object with its top left corner at (x, y); returns the door tile for houses
function obj(m, name, x, y, extra = {}) {
  const [img, sx, sy, w, h, o = {}] = OBJ[name], by = y + h - 1, foot = o.foot || 1;
  const draw = (g, X, Y) => g.drawImage(tileset(img), sx * 16, sy * 16, w * 16, h * 16, X - (extra.dx || 0), Y - (h - 1) * 16, w * 16, h * 16);
  // the picture rides on its bottom left tile, so people behind it are drawn first
  m.ents.push({ type: 'sprite', x, y: by, solid: !(o.door === 0) && !(o.posts && false), draw, cond: extra.cond, obj: name });
  const solid = (tx, ty) => m.ents.push({ type: 'solid', x: tx, y: ty, cond: extra.cond });
  for (let j = 0; j < (o.door !== undefined ? h : foot); j++) for (let i = 0; i < w; i++) {
    const tx = x + i, ty = by - j;
    if (tx === x && ty === by) continue;
    if (o.door !== undefined && j === 0 && i === o.door) continue;
    if (o.posts && j === 0 && i === 1) continue;
    solid(tx, ty);
  }
  if (o.posts) { m.ents.find((e) => e.type === 'sprite' && e.x === x && e.y === by).solid = true; }
  return o.door !== undefined ? [x + o.door, by] : null;
}
// trees along a strip, every two tiles, for the edges of a map
function treeLine(m, x0, y0, x1, kind = 'tree') { for (let x = x0; x <= x1; x += 2) obj(m, typeof kind === 'function' ? kind(x) : kind, x, y0); }

export const MAPS = {};

// ---------- the river where the peach floated by ----------
MAPS.river = {
  name: '桃之川', music: 'home', safe: true,
  build() {
    const b = canvasMap(22, 13, '.');
    b.rect(0, 6, 22, 2, '~');
    for (let x = 0; x < 22; x++) { b.set(x, 0, 'n'); b.set(x, 12, 'n'); }
    for (let y = 0; y < 13; y++) b.set(0, y, 'n');
    b.road([[21, 3], [9, 3], [9, 5]]);
    for (const [x, y] of [[3, 2], [5, 4], [14, 10], [17, 9], [6, 10], [12, 1]]) b.set(x, y, 'f');
    for (const [x, y] of [[4, 9], [11, 10], [16, 2], [19, 10]]) b.set(x, y, 'g');
    b.set(21, 2, 'n'); b.set(21, 4, 'n');
    const m = grid(b.rows(), {}, { id: 'river' });
    m.ents.push({ ...warp('kibi', 1, 10, 'r'), x: 21, y: 3 });
    m.ents.push({ type: 'trigger', run: 'rv_grave', x: 9, y: 5, once: null, cond: (f) => !!f.ending });
    treeLine(m, 1, 9, 9, (x) => (x % 4 ? 'tree' : 'peach')); treeLine(m, 13, 9, 19, 'tree');
    obj(m, 'bigpeach', 14, 1, { cond: (f) => !!f.ending });
    obj(m, 'peach', 2, 1); obj(m, 'tree', 17, 1);
    m.entry = [20, 3, 'l'];
    return m;
  },
};

// ---------- 黍之里: the village ----------
MAPS.kibi = {
  name: '黍之里', music: 'village', safe: true,
  build(f = {}) {
    const b = canvasMap(34, 24, '.');
    for (let x = 0; x < 34; x++) { b.set(x, 0, 'n'); b.set(x, 23, 'n'); }
    for (let y = 0; y < 24; y++) { b.set(0, y, 'n'); b.set(33, y, 'n'); }
    b.set(0, 10, '='); b.set(0, 11, '='); b.set(33, 10, '='); b.set(33, 11, '=');
    b.rect(0, 10, 34, 2, '=');
    b.road([[5, 7], [5, 10]]); b.road([[13, 6], [13, 10]]); b.road([[21, 6], [21, 10]]); b.road([[26, 11], [26, 17]]);
    // millet fields in neat rows, a pond, flowers along the paths
    for (let y = 14; y <= 20; y += 2) b.rect(3, y, 12, 1, 'v');
    b.rect(16, 15, 5, 4, '~'); b.set(17, 16, 'L');
    for (const [x, y] of [[3, 8], [8, 8], [10, 13], [18, 13], [29, 7], [31, 15], [2, 21], [22, 20]]) b.set(x, y, (x + y) % 3 ? 'f' : 'g');
    const m = grid(b.rows(), {}, { id: 'kibi' });
    const home = obj(m, 'house', 4, 5), elder = obj(m, 'farmhouse', 12, 4), shop = obj(m, 'shop', 20, 4);
    obj(m, 'torii', 25, 13); obj(m, 'shrine', 24, 18);
    m.ents.push({ ...warp('home', 4, 5, 'u'), x: home[0], y: home[1] });
    m.ents.push({ type: 'solid', talk: 'kb_elderdoor', x: elder[0], y: elder[1] });
    m.ents.push({ type: 'solid', talk: 'kb_shopdoor', x: shop[0], y: shop[1] });
    m.ents.push({ ...warp('river', 20, 3, 'l'), x: 0, y: 10 }, { ...warp('river', 20, 3, 'l'), x: 0, y: 11 });
    m.ents.push({ ...warp('world', 9, 22, 'r', { exit: true }), x: 33, y: 10 }, { ...warp('world', 9, 22, 'r', { exit: true }), x: 33, y: 11 });
    treeLine(m, 1, 1, 3, 'peach'); treeLine(m, 28, 1, 31, 'tree'); treeLine(m, 1, 21, 13, (x) => (x % 4 ? 'tree' : 'tree2'));
    obj(m, 'peach', 30, 18); obj(m, 'oak', 28, 21);
    // the villagers
    m.ents.push(
      npc('elder', 'Master', 'kb_elder', { x: 13, y: 7, dir: 'd' }),
      npc('shopkeep', 'Villager3', 'kb_shop', { x: 21, y: 7, dir: 'd' }),
      npc('priest', 'Monk', 'kb_priest', { x: 26, y: 18, dir: 'd' }),
      npc('farmer', 'Villager', 'kb_farmer', { x: 8, y: 15, dir: 'l' }),
      npc('girl', 'Child', 'kb_girl', { x: 18, y: 13, dir: 'd' }),
      npc('wife', 'Woman', 'kb_wife', { x: 9, y: 9, dir: 'r' }),
      npc('guard', 'Villager5', 'kb_guard', { x: 31, y: 9, dir: 'd' }),
      npc('lad', 'Villager2', 'kb_lad', { x: 23, y: 9, dir: 'l', cond: (fl) => !fl.ending }),
    );
    void f;
    m.entry = [5, 8, 'd'];
    return m;
  },
};
// the house where the old couple live
MAPS.home = {
  name: '', music: 'home', safe: true,
  build() {
    const b = canvasMap(9, 7, 'I');
    b.room(0, 0, 9, 7, 'I', '_');
    b.set(4, 6, '_');
    const m = grid(b.rows(), {}, { id: 'home' });
    m.ents.push({ ...warp('kibi', 5, 8, 'd'), x: 4, y: 6 });
    m.ents.push({ type: 'hearth', x: 2, y: 1 });
    m.ents.push(npc('grandpa', 'grandpa', 'hm_grandpa', { x: 6, y: 2, dir: 'd', cond: (f) => !f.leftHome || f.ending }));
    m.ents.push(npc('grandma', 'grandma', 'hm_grandma', { x: 3, y: 3, dir: 'r', cond: (f) => !f.leftHome || f.ending }));
    m.ents.push({ type: 'sprite', x: 6, y: 4, solid: true, draw: (g, X, Y) => g.drawImage(tileset('house'), 19 * 16, 10 * 16, 16, 16, X, Y, 16, 16) });
    m.entry = [4, 5, 'u'];
    return m;
  },
};

// ---------- the road east ----------
MAPS.world = {
  name: '', music: 'field',
  build(f = {}) {
    const W = 52, H = 40, b = canvasMap(W, H, '.');
    const vn = (x, y, s, k) => { const X = Math.floor(x / s), Y = Math.floor(y / s), fx = x / s - X, fy = y / s - Y, l = (a, c, t) => a + (c - a) * t * t * (3 - 2 * t); return l(l(hash(X, Y, k), hash(X + 1, Y, k), fx), l(hash(X, Y + 1, k), hash(X + 1, Y + 1, k), fx), fy); };
    // the sea to the east and south, the shore before it
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const coast = 44 + Math.round(Math.sin(y * 0.3) * 1.5);
      if (x >= coast) b.set(x, y, 'S');
      else if (x >= coast - 3 && y > 20) b.set(x, y, ':');
      if (y >= 37) b.set(x, y, x < 30 ? 'n' : 'S');
      if (x === 0 || y === 0) b.set(x, y, 'n');
    }
    // the White Fang Forest in the north-west, Monkey-Cry Mountain in the north-east
    for (let y = 1; y <= 13; y++) for (let x = 1; x <= 18; x++) if (vn(x, y, 4, 3) > 0.32 || y < 4) b.set(x, y, 'k');
    for (let y = 1; y <= 12; y++) for (let x = 26; x <= 43; x++) if (vn(x, y, 4, 5) > 0.45 || y < 3) b.set(x, y, ':');
    // the Tengu Cliffs in the south-west: rock and sand
    for (let y = 27; y <= 36; y++) for (let x = 1; x <= 14; x++) if (vn(x, y, 3, 7) > 0.4) b.set(x, y, ':');
    // roads
    b.road([[9, 22], [24, 22], [24, 14], [11, 14], [11, 12]]);
    b.road([[24, 14], [34, 14], [34, 12]]);
    b.road([[24, 22], [24, 30], [38, 30]]);
    b.road([[16, 22], [16, 31], [9, 31]]);
    for (let x = 9; x <= 14; x++) b.set(x, 12, '='), b.set(11, 13, '=');
    // a river crossing the plain, with a bridge
    for (let y = 15; y <= 36; y++) { const x = 30 + Math.round(Math.sin(y * 0.35) * 1.2); b.set(x, y, '~'); b.set(x + 1, y, '~'); }
    for (let x = 28; x <= 33; x++) if (b.get(x, 30) === '~') b.set(x, 30, '#');
    for (const [x, y] of [[6, 18], [19, 19], [21, 26], [12, 25], [27, 18], [36, 23], [7, 24], [20, 33]]) b.set(x, y, 'f');
    const m = grid(b.rows(), {}, { id: 'world' });
    // the village, the forest, the mountain, the harbour and the cliffs
    obj(m, 'house', 4, 19); obj(m, 'cottage', 4, 23); obj(m, 'peach', 2, 22);
    m.ents.push({ ...warp('kibi', 32, 10, 'l'), x: 8, y: 22 });
    obj(m, 'torii', 10, 11); m.ents.push({ ...warp('forest', 14, 24, 'u'), x: 11, y: 12 });
    obj(m, 'cave', 33, 10); m.ents.push({ ...warp('mountain', 3, 27, 'u'), x: 34, y: 12 });
    m.ents.push({ type: 'solid', talk: 'w_landslide', x: 34, y: 13, cond: (fl) => !fl.shiro });
    obj(m, 'inn', 38, 27); obj(m, 'shop', 42, 27);
    m.ents.push({ ...warp('port', 2, 10, 'r'), x: 38, y: 30 }, { ...warp('port', 2, 10, 'r'), x: 39, y: 30 });
    obj(m, 'torii', 8, 29); m.ents.push({ ...warp('cliff', 12, 29, 'u'), x: 9, y: 30 });
    m.ents.push({ type: 'solid', talk: 'w_cliffwind', x: 10, y: 31, cond: (fl) => !fl.captainAsked });
    m.ents.push({ type: 'solid', talk: 'w_bridgeguard', x: 27, y: 30, cond: (fl) => !fl.natsume });
    // the forest and mountain look the part
    for (let y = 2; y <= 12; y += 3) for (let x = 2; x <= 17; x += 3) if (b.get(x, y) === 'k' && b.get(x + 1, y + 1) === 'k') obj(m, (x + y) % 2 ? 'pine' : 'tree', x, y);
    for (let y = 2; y <= 11; y += 3) for (let x = 27; x <= 42; x += 4) if (b.get(x, y) === ':' && b.get(x + 1, y + 1) === ':' && Math.abs(x - 34) > 2) obj(m, (x + y) % 2 ? 'boulder' : 'greyrock', x, y);
    for (const [x, y] of [[3, 28], [6, 33], [12, 34]]) obj(m, 'greyrock', x, y);
    for (const [x, y] of [[18, 25], [21, 16], [26, 25], [13, 18], [36, 18], [40, 20], [20, 35], [27, 34]]) obj(m, (x * y) % 3 ? 'tree' : 'tree2', x, y);
    m.enc = (x, y) => (y < 14 && x > 24 ? 'hills' : x > 34 || (y > 26 && x < 16) ? 'coast' : 'home');
    m.entry = [9, 22, 'r'];
    void f;
    return m;
  },
};

// ---------- 白牙森林: the White Fang Forest ----------
MAPS.forest = {
  name: '白牙森林', music: 'forest', bg: 'forest',
  build(f = {}) {
    const rows = [
      'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
      'kk,,,,,,,kkkkkk,,,,,,,,,,,kkkk',
      'kk,,,,,,,kkkkkk,,,,,,B,,,,kkkk',
      'kk,,,,,,,kkkkkk,,,,,,,,,,,kkkk',
      'kk,,,d,,,kkkkkk,,,,,,,,,,,kkkk',
      'kkkk,kkkkkkkkkkkkkkkk,kkkkkkkk',
      'kkkk,kkkkkkkkkkkkkkkkgkkkkkkkk',
      'kkkk,,,,,,,,,,,kkkkk,,,kkkkkkk',
      'kkkkkkkkkkkkk,,kkkkk,e,kkkkkkk',
      'kk,,,,,,,,,,,,,kkkkk,,,kkkkkkk',
      'kk,,e,,,,,,,,,,kkkkkk,kkkkkkkk',
      'kk,,,,,,,,,,$,,kkkkkk,kkkkkkkk',
      'kk,,,,,,,kkkkkkkkkkkk,,,,,kkkk',
      'kkkk,kkkkkkkkkkkkkkkkkkkk,kkkk',
      'kk,,,,,,,kkkkkk,,,,,,,,,,,kkkk',
      'kk,,d,,,,kkkkkk,,,,,e,,,,,kkkk',
      'kk,,,,,,,,,,,,,,,,,,,,,,,,kkkk',
      'kk,,,,,,,kkkkkk,,,,,,,,d,,kkkk',
      'kkkkkkk,kkkkkkkk,kkkkkkkkkkkkk',
      'kk,,,,,,,,,,,,,,,,,,,,,,$,kkkk',
      'kk,,,,,,,,,,,,,,,,,,,,,,,,kkkk',
      'kk,,,,,@,,,,,,,,,,,,,,,,,,kkkk',
      'kkkk,,,,,,,,,,,,,,,,,,,,,kkkkk',
      'kkkkkkkkkkkk,,,,,kkkkkkkkkkkkk',
      'kkkkkkkkkkkkk,,,kkkkkkkkkkkkkk',
      'kkkkkkkkkkkkkk,kkkkkkkkkkkkkkk',
    ];
    const DIG = [['mugwort'], ['oldkey'], ['petal']];
    const m = grid(rows, {
      d: { k: 'dgrass', e: (x, y, n) => ({ type: 'dig', id: 'fd' + n, item: DIG[n][0] }) },
      e: { k: 'dgrass', e: (x, y, n) => mon(['f1', 'f2', 'f3', 'f4'][n % 4], { n, hx: x, hy: y }) },
      $: { k: 'dgrass', e: (x, y, n) => ({ type: 'chest', id: 'fc' + n, item: ['honeycomb', 'ironfang'][n] }) },
      g: { k: 'dgrass', e: { type: 'solid', talk: 'fo_gate', cond: (fl) => !fl.forestGate } },
      '@': { k: 'dgrass', e: { type: 'hearth' } },
      B: { k: 'dgrass', e: { type: 'boss', id: 'forestking', art: 'boss:GiantSpirit', talk: 'fo_boss', cond: (fl) => !fl.boss1 } },
    }, { id: 'forest', dark: 0.35 });
    m.ents.push({ ...warp('world', 11, 13, 'd', { exit: true }), x: 14, y: 25 });
    // the hunter's grave where Shiro waits, just inside
    m.ents.push({ type: 'sprite', x: 18, y: 21, solid: true, talk: 'fo_grave', draw: (g, X, Y) => g.drawImage(tileset('house'), 2 * 16, 18 * 16, 16, 16, X, Y, 16, 16) });
    m.ents.push(npc('shiro', 'shiro', 'fo_shiro', { x: 19, y: 22, dir: 'l', cond: (fl) => !fl.shiro }));
    m.ents.push({ type: 'trigger', run: 'fo_meet', once: 'forestMeet', x: 14, y: 22 });
    for (const [x, y] of [[2, 1], [6, 1], [16, 1], [24, 1], [2, 14], [6, 9], [10, 9], [16, 14], [22, 14], [3, 19], [20, 19]]) obj(m, (x + y) % 3 ? 'pine' : 'tree', x, y);
    obj(m, 'bamboo', 22, 7); obj(m, 'bamboo', 20, 7);
    m.entry = [14, 23, 'u'];
    void f;
    return m;
  },
};

// ---------- 猿啼山: Monkey-Cry Mountain ----------
MAPS.mountain = {
  name: '猿啼山', music: 'mountain', bg: 'mountain',
  build(f = {}) {
    const rows = [
      'CCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      'CsssssssssCCCCCCCCssssssssCC',
      'CsssssBsssCCCCCCCCsss$ssssCC',
      'CssssssssssssssssssssssssCCC',
      'CsssssssssCCCCCCCCsssssssCCC',
      'CCCCCvCCCCCCCCCCCCCCCCvCCCCC',
      'C::::::::CCCC::::::::::::::C',
      'C::e:::::CCCC::::::e:::::::C',
      'C:::::::::::::::::::::d::::C',
      'C::::$:::CCCC::::::::::::::C',
      'CCCCCCCCvCCCCCCCCCvCCCCCCCCC',
      'C..........CC..............C',
      'C..e.......CC.........e....C',
      'C.................d........C',
      'C..........CC..............C',
      'C....@.....CC.......$......C',
      'CCCCCCCCCCCCCCvCCCCCCCCCCCCC',
      'C::::::::::::::::::::::::::C',
      'C::::::::::::::::::::::::::C',
      'C:::::::::e::::::::::::::::C',
      'C::::::::::::::::::::::::::C',
      'CC:::::::::::::::::::::::::C',
      'CCC::::::::::::::::::::::CCC',
      'C..........................C',
      'C..........................C',
      'C..........................C',
      'C..........................C',
      'C..........................C',
      'CCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    ];
    // each vine joins a ledge to the one above it; Natsume can climb them, nobody else
    const VINES = [[5, 5, 5, 4], [22, 5, 22, 4], [8, 10, 8, 9], [18, 10, 18, 9], [14, 16, 14, 15]];
    const m = grid(rows, {
      v: { k: 'cwall', e: (x, y, n) => ({ type: 'vine', top: [VINES[n][2], VINES[n][3]], bottom: [x, y + 1] }) },
      d: { k: 'sand', e: (x, y, n) => ({ type: 'dig', id: 'md' + n, item: ['honeycomb', 'petal'][n] }) },
      e: { k: 'sand', e: (x, y, n) => mon(['m1', 'm2', 'm3', 'm4', 'm2'][n], { n, hx: x, hy: y }) },
      $: { k: 'sand', e: (x, y, n) => ({ type: 'chest', id: 'mc' + n, item: ['bostaff', 'furcoat', 'powerband', 'honeycomb'][n] }) },
      '@': { k: 'grass', e: { type: 'hearth' } },
      B: { k: 'stone', e: { type: 'boss', id: 'tanuki', art: 'boss:GiantRacoon', talk: 'mo_boss', cond: (fl) => !fl.boss2 } },
    }, { id: 'mountain' });
    m.ents.push({ ...warp('world', 34, 12, 'd', { exit: true }), x: 3, y: 27 });
    // the monkeys' clearing at the foot of the mountain
    m.ents.push(npc('natsume', 'natsume', 'mo_natsume', { x: 13, y: 24, dir: 'd', cond: (fl) => !fl.natsume }));
    m.ents.push(npc('babymonkey', 'MonkeyBrown', 'mo_baby', { x: 16, y: 25, dir: 'l', cond: (fl) => !fl.ending }), npc('babymonkey2', 'MonkeyBrown', 'mo_baby', { x: 17, y: 26, dir: 'l', cond: (fl) => !fl.ending }));
    m.ents.push({ type: 'trigger', run: 'mo_enter', once: 'mountainIn', x: 4, y: 26 });
    for (const [x, y] of [[2, 23], [22, 23], [24, 25], [6, 25]]) obj(m, (x + y) % 2 ? 'tree' : 'pine', x, y);
    obj(m, 'boulder', 9, 17); obj(m, 'greyrock', 20, 18); obj(m, 'boulder', 3, 7);
    m.entry = [3, 26, 'u'];
    void f;
    return m;
  },
};

// ---------- 潮見港: Shiomi Harbour ----------
MAPS.port = {
  name: '潮見港', music: 'coast', safe: true, bg: 'shore',
  build(f = {}) {
    const b = canvasMap(30, 20, ':');
    b.rect(22, 0, 8, 20, 'S'); b.rect(0, 0, 30, 1, 'n'); b.rect(0, 19, 22, 1, 'n'); b.rect(0, 0, 1, 20, 'n');
    b.rect(18, 11, 10, 2, '#'); b.rect(26, 9, 2, 6, '#');
    b.road([[0, 10], [17, 10]]); b.road([[7, 10], [7, 6]]); b.road([[14, 10], [14, 6]]);
    b.set(0, 10, '='); b.set(0, 11, '=');
    const m = grid(b.rows(), {}, { id: 'port' });
    const inn = obj(m, 'inn', 5, 3), shop = obj(m, 'shop', 13, 3);
    obj(m, 'lodge', 2, 14); obj(m, 'hut', 9, 14);
    obj(m, 'boat', 26, 15);
    m.ents.push({ ...warp('world', 38, 31, 'd', { exit: true }), x: 0, y: 10 }, { ...warp('world', 38, 31, 'd', { exit: true }), x: 0, y: 11 });
    m.ents.push({ type: 'solid', talk: 'pt_inndoor', x: inn[0], y: inn[1] }, { type: 'hearth', x: 9, y: 7 });
    m.ents.push({ type: 'solid', talk: 'pt_shopdoor', x: shop[0], y: shop[1] });
    m.ents.push(
      npc('captain', 'Eskimo', 'pt_captain', { x: 25, y: 12, dir: 'l' }),
      npc('innkeep', 'Woman', 'pt_inn', { x: 7, y: 7, dir: 'd' }),
      npc('portshop', 'Villager4', 'pt_shop', { x: 14, y: 7, dir: 'd' }),
      npc('fisher', 'Villager6', 'pt_fisher', { x: 19, y: 13, dir: 'r' }),
      npc('oldsailor', 'OldMan3', 'pt_sailor', { x: 11, y: 12, dir: 'u' }),
      npc('kid', 'Child', 'pt_kid', { x: 4, y: 12, dir: 'r' }),
      npc('samurai1', 'SamuraiBlue', 'pt_samurai', { x: 16, y: 9, dir: 'd', cond: (fl) => !fl.ending }),
    );
    for (const [x, y] of [[1, 1], [18, 1], [20, 15]]) obj(m, 'tree', x, y);
    m.entry = [1, 10, 'r'];
    void f;
    return m;
  },
};

// ---------- 天狗崖: the Tengu Cliffs ----------
MAPS.cliff = {
  name: '天狗崖', music: 'temple', bg: 'mountain',
  build(f = {}) {
    const rows = [
      'qqqqqqqqqqqqqqqqqqqqqqqqqq',
      'qq::::::::::::::::::::::qq',
      'qq:::::::::::B::::::::::qq',
      'qq::::::::::::X:::::::::qq',
      'qq::::::::::::::::::::::qq',
      'qqqqqqqqqqqq:qqqqqqqqqqqqq',
      'qqqqqqqqqqqq:qqqqqqqqqqqqq',
      'qq::::::::::::::::::::::qq',
      'qq::p:::1:::::::::e:::$:qq',
      'qq:::::::::::::::::::::::q',
      'qqDDDDDDDDDDDDDDDDDDDDDDqq',
      'qqDDDDDDDDDDDDDDDDDDDDDDqq',
      'qq::::::::::::::::::::::qq',
      'qq::::::::::::::e:::::::qq',
      'qq::::::::::::::::::p:::qq',
      'qqqqqqqqqq::qqqqqqqqqqqqqq',
      'qq::::::::::::::::::::::qq',
      'qq::$:::::::e:::::::2:::qq',
      'qq::::::::::::::::::::::qq',
      'qqDDDDDDDDDDDDDDDDDDDDDDqq',
      'qqDDDDDDDDDDDDDDDDDDDDDDqq',
      'qq::::::::::::::::::::::qq',
      'qq::::p::::::::::::::::@qq',
      'qq::::::::::::::::::::::qq',
      'qqqqqqqqqq::::::qqqqqqqqqq',
      'qq::::::::::::::::::::::qq',
      'qq::::::::::::::::::::::qq',
      'qq::::::::::::::::::::::qq',
      'qq::::::::::::::::::::::qq',
      'qq::::::::::::::::::::::qq',
      'qqqqqqqqqqqq::qqqqqqqqqqqq',
    ];
    // two chasms; ring the bell across each one and the old bridge swings down
    const m = grid(rows, {
      // each perch faces a bell on the far side of the next obstacle up
      p: { k: 'sand', e: (x, y, n) => ({ type: 'perch', id: 'cp' + n, bell: ['cbC', 'cbB', 'cbA'][n] }) },
      2: { k: 'sand', e: { type: 'bellpost', id: 'cbA', flag: 'cliffBridge1' } },
      1: { k: 'sand', e: { type: 'bellpost', id: 'cbB', flag: 'cliffBridge2' } },
      X: { k: 'sand', e: { type: 'bellpost', id: 'cbC', flag: 'cliffGate' } },
      e: { k: 'sand', e: (x, y, n) => mon(['t1', 't2', 't3', 't1'][n], { n, hx: x, hy: y }) },
      $: { k: 'sand', e: (x, y, n) => ({ type: 'chest', id: 'cc' + n, item: ['steeltalon', 'geta'][n] }) },
      '@': { k: 'sand', e: { type: 'hearth' } },
      B: { k: 'sand', e: { type: 'boss', id: 'tengu', art: 'boss:TenguRed', talk: 'cl_boss', cond: (fl) => !fl.boss3 } },
    }, { id: 'cliff' });
    // the bridges come down when their bells ring; the gate on the top ledge too
    if (f.cliffBridge1) for (let y = 19; y <= 20; y++) m.kindAt = ((k) => (x, yy) => (yy === y && x === 12 ? 'plank' : k(x, yy)))(m.kindAt);
    if (f.cliffBridge2) for (let y = 10; y <= 11; y++) m.kindAt = ((k) => (x, yy) => (yy === y && x === 12 ? 'plank' : k(x, yy)))(m.kindAt);
    m.ents.push({ type: 'solid', talk: 'cl_gate', x: 12, y: 6, cond: (fl) => !fl.cliffGate });
    m.ents.push({ ...warp('world', 9, 31, 'd', { exit: true }), x: 12, y: 30 }, { ...warp('world', 9, 31, 'd', { exit: true }), x: 13, y: 30 });
    m.ents.push(npc('kiji', 'kiji', 'cl_kiji', { x: 15, y: 27, dir: 'l', cond: (fl) => !fl.kiji }));
    m.ents.push({ type: 'trigger', run: 'cl_enter', once: 'cliffIn', x: 12, y: 28 });
    obj(m, 'torii', 11, 25); obj(m, 'shrine', 11, 0);
    for (const [x, y] of [[3, 26], [20, 26], [4, 1], [19, 1]]) obj(m, 'pine', x, y);
    m.entry = [12, 29, 'u'];
    return m;
  },
};

// ---------- the crossing ----------
MAPS.ship = {
  name: '渡鬼海', music: 'boat', bg: 'ship',
  build() {
    const b = canvasMap(24, 13, 'S');
    b.rect(4, 4, 16, 5, '#'); b.rect(2, 5, 2, 3, '#'); b.rect(20, 5, 2, 3, '#');
    const m = grid(b.rows(), {}, { id: 'ship' });
    m.ents.push(npc('captainS', 'Eskimo', 'sh_captain', { x: 18, y: 6, dir: 'l' }));
    m.ents.push({ type: 'trigger', run: 'sh_squid', once: 'squidCame', x: 12, y: 6 });
    m.ents.push({ type: 'trigger', run: 'sh_squid', once: 'squidCame', x: 12, y: 5 });
    m.ents.push({ type: 'trigger', run: 'sh_squid', once: 'squidCame', x: 12, y: 7 });
    m.ents.push({ type: 'sprite', x: 11, y: 4, solid: true, draw: (g, X, Y) => { g.fillStyle = '#6a3c1c'; g.fillRect(X + 6, Y - 40, 4, 54); g.fillStyle = '#f0e8d0'; g.fillRect(X - 14, Y - 38, 44, 26); g.fillStyle = '#c84030'; g.fillRect(X + 2, Y - 30, 12, 12); } });
    m.entry = [5, 6, 'r'];
    return m;
  },
};

// ---------- 鬼之島: the Oni Isle ----------
MAPS.isle = {
  name: '鬼之島', music: 'isle', bg: 'isle',
  build(f = {}) {
    const b = canvasMap(36, 30, ',');
    b.rect(0, 25, 36, 5, ':'); b.rect(0, 28, 36, 2, 'S');
    for (let x = 0; x < 36; x++) b.set(x, 0, 'k');
    for (let y = 0; y < 28; y++) { b.set(0, y, 'k'); b.set(35, y, 'k'); }
    b.road([[17, 26], [17, 14], [17, 5]], '-'); b.road([[8, 16], [26, 16]], '-'); b.road([[26, 16], [30, 10]], '-');
    // the spring that used to water the tree has dried to a pond
    b.rect(12, 8, 3, 2, f.ending ? '~' : '-');
    const m = grid(b.rows(), {
    }, { id: 'isle' });
    obj(m, 'boat', 16, 27);
    m.ents.push({ ...warp('port', 24, 12, 'l'), x: 18, y: 26, cond: (fl) => !!fl.boss5 });
    // the oni village
    const elder = obj(m, 'straw', 5, 13), store = obj(m, 'hut', 10, 18); obj(m, 'straw', 21, 18); obj(m, 'cave', 24, 12);
    m.ents.push({ type: 'solid', talk: 'is_elderhut', x: elder[0], y: elder[1] }, { type: 'solid', talk: 'is_storehut', x: store[0], y: store[1] });
    // the sacred tree, withered until the end
    obj(m, f.ending ? 'bigpeach' : 'deadtree', 16, f.ending ? 2 : 3);
    obj(m, 'torii', 16, 6);
    // the fortress Kurogane built over the spring
    const keep = obj(m, 'keep', 29, 3);
    m.ents.push({ ...warp('fort', 14, 33, 'u'), x: keep[0], y: keep[1], cond: (fl) => !!fl.akaneTold });
    m.ents.push({ type: 'solid', talk: 'is_fortshut', x: keep[0], y: keep[1], cond: (fl) => !fl.akaneTold });
    m.ents.push(
      npc('akane', 'akane', 'is_akane', { x: 17, y: 9, dir: 'd', cond: (fl) => !!fl.boss5 && !fl.akaneJoinedTree }),
      npc('oniElder', 'Shaman', 'is_elder', { x: 6, y: 17, dir: 'd' }),
      npc('oniKid', 'Cavegirl', 'is_kid', { x: 13, y: 21, dir: 'l' }),
      npc('oniMother', 'Cavegirl2', 'is_mother', { x: 22, y: 22, dir: 'u' }),
      npc('oniMan', 'Caveman', 'is_man', { x: 9, y: 22, dir: 'r' }),
      npc('oniMerchant', 'Caveman2', 'is_shop', { x: 11, y: 22, dir: 'u' }),
      npc('goki', 'DemonGreen', 'is_goki', { x: 26, y: 15, dir: 'l', cond: (fl) => !!fl.boss5 }),
    );
    m.ents.push({ type: 'hearth', x: 8, y: 17 });
    m.ents.push({ type: 'trigger', run: 'is_landing', once: 'landed', x: 17, y: 24 });
    m.ents.push({ type: 'trigger', run: 'is_landing', once: 'landed', x: 16, y: 24 });
    m.ents.push({ type: 'trigger', run: 'is_landing', once: 'landed', x: 18, y: 24 });
    for (const [x, y] of [[2, 2], [7, 2], [24, 2], [2, 8], [3, 22], [31, 20], [27, 22], [8, 6]]) obj(m, f.ending ? 'peach' : 'deadtree', x, y);
    m.entry = [17, 26, 'u'];
    return m;
  },
};

// ---------- 黑鐵砦: Kurogane's fortress ----------
MAPS.fort = {
  name: '黑鐵砦', music: 'fort', bg: 'fort',
  build(f = {}) {
    const rows = [
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGsssssssssGGGGGGGGGGG',
      'GGGGGGGGGGssssKsssGGGGGGGGGGGG',
      'GGGGGGGGGGsssssssssGGGGGGGGGGG',
      'GGGGGGGGGGGGGGgGGGGGGGGGGGGGGG',
      'GGGGGGGGGGsssssssssGGGGGGGGGGG',
      'GGGGGGGGGGssss@ssssGGGGGGGGGGG',
      'GGGGGGGGGGssssAsssssGGGGGGGGGG',
      'GGGGGGGGGGGGGGhGGGGGGGGGGGGGGG',
      'GsssssssGGssssssssGGGsssssssGG',
      'Gss$sssssssssssssssssssss$ssGG',
      'GsssssssGGsssseessGGGsssssssGG',
      'GsssssssGGssssssssGGGssss1ssGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GDDDDDDDDDDDDDDDDDDDDDDDDDDDDG',
      'GDDDDDDDDDDDDDDDDDDDDDDDDDDDDG',
      'GsssssssssssssssssssssssssssGG',
      'Gsssssp:ssssssssssssssessssGGG',
      'GsssssssssssssssssssssssssssGG',
      'GGGGGGGGGGGGGGgGGGGGGGGGGGGGGG',
      'GsssssssssGGssssssGGssssssssGG',
      'GsssdsssssssssssssssssssessGGG',
      'GsssssssssGGsssessGGsssss$ssGG',
      'GGGGGGGGGGGGGsssGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGsssGGGGGGGGGGGGGG',
      'GsssssssssssssssssssssssssssGG',
      'Gssesssssss@ssssssssssssssssGG',
      'GsssssssssssssssssssssssseesGG',
      'GGGGGGGGGGGGGsssGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGsssGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGsssGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGsssGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGsssGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGsssGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ];
    // some of the guards are oni Kurogane enslaved; they can be talked down
    const m = grid(rows, {
      e: { k: 'stone', e: (x, y, n) => mon(['k1', 'o1', 'k2', 'o2', 'k3', 'o3', 'k4', 'o1'][n % 8], { n, hx: x, hy: y }) },
      $: { k: 'stone', e: (x, y, n) => ({ type: 'chest', id: 'kc' + n, item: ['charmcoat', 'ruyi', 'omamori', 'phoenix'][n] }) },
      d: { k: 'stone', e: { type: 'dig', id: 'kd0', item: 'secret' } },
      p: { k: 'stone', e: { type: 'perch', id: 'kp0', bell: 'kb0' } },
      1: { k: 'stone', e: { type: 'bellpost', id: 'kb0', flag: 'fortBridge' } },
      g: { k: 'stone', e: (x, y, n) => (n === 0 ? { type: 'solid', talk: 'kt_innergate', cond: (fl) => !fl.boss6 } : { type: 'solid', talk: 'kt_gate', cond: (fl) => !fl.fortDug }) },
      h: { k: 'stone', e: { type: 'solid', talk: 'kt_seal', cond: (fl) => !fl.fortClimb } },
      '@': { k: 'stone', e: { type: 'hearth' } },
      A: { k: 'stone', e: { type: 'boss', id: 'samurai', art: 'boss:GiantBlueSamurai', talk: 'kt_samurai', cond: (fl) => !fl.boss6 } },
      K: { k: 'stone', e: { type: 'boss', id: 'kurogane', art: 'boss:GiantRedSamurai', talk: 'kt_kurogane', cond: (fl) => !fl.boss7 } },
    }, { id: 'fort' });
    // a bridge over the moat once the bell rings, and a vine up the wall to the upper hall
    if (f.fortBridge) for (let y = 14; y <= 15; y++) for (let x = 4; x <= 5; x++) m.kindAt = ((k, X, Y) => (xx, yy) => (xx === X && yy === Y ? 'plank' : k(xx, yy)))(m.kindAt, x, y);
    m.ents.push({ type: 'vine', x: 4, y: 13, top: [4, 12], bottom: [4, 14], cond: (fl) => !!fl.fortBridge });
    m.ents.push({ type: 'trigger', run: 'kt_climbed', once: 'fortClimb', x: 4, y: 12 });
    m.ents.push({ ...warp('isle', 30, 6, 'd', { exit: true }), x: 14, y: 33 }, { ...warp('isle', 30, 6, 'd', { exit: true }), x: 15, y: 33 });
    m.entry = [14, 32, 'u'];
    return m;
  },
};

localize(MAPS, {
  river: ['The Peach River'], kibi: ['Kibi Village'], forest: ['White Fang Forest'], mountain: ['Monkey-Cry Mountain'], port: ['Shiomi Harbour'],
  cliff: ['The Tengu Cliffs'], ship: ['The Oni Sea'], isle: ['The Oni Isle'], fort: ['Kurogane Fortress'],
}, ['name']);
