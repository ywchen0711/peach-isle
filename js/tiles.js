// Map tiles cut from the Ninja Adventure tilesets (CC0), joined to their neighbours, and the map pre-renderer.
// Ground, paths, ponds and the sea are 16-piece autotiles; trees, houses and the like are objects on top
// (see obj() in maps.js), drawn with the characters so you can walk behind them.
import { canvas, hash } from './gfx.js';
import { tileset } from './assets.js';

const cut = (img, x, y) => (g) => g.drawImage(tileset(img), x * 16, y * 16, 16, 16, 0, 0, 16, 16);
// a 16-piece autotile: a 3x3 patch, a 1-wide column and row, and a single piece; base is the patch's top left.
// which piece depends on whether the same kind continues to the north, south, west and east.
const PATCH = (img, bx, by, same) => (g, X, Y, n) => {
  const k = n(0, 0), s = (dx, dy) => same(n(dx, dy), k);
  const N = s(0, -1), S = s(0, 1), Wt = s(-1, 0), E = s(1, 0);
  const col = Wt && E ? 1 : E ? 0 : Wt ? 2 : 3, row = N && S ? 1 : S ? 0 : N ? 2 : 3;
  g.drawImage(tileset(img), (bx + col) * 16, (by + row) * 16, 16, 16, 0, 0, 16, 16);
};
// walls around a room: a ring around its floor; the piece depends on which side the floor is on
const RING = (img, bx, by) => (g, X, Y, n) => {
  const fl = (dx, dy) => { const k = n(dx, dy); return !!(k && TILES[k] && !TILES[k].solid); };
  const N = fl(0, -1), S = fl(0, 1), Wt = fl(-1, 0), E = fl(1, 0);
  let c = null;
  // a single wall tile with floor above and below (a ledge a vine climbs): the wall's lower face
  if (N && S) c = [2, 4];
  else if (S && !N) c = [Wt ? 0 : E ? 4 : 2, 0];
  else if (N && !S) c = [Wt ? 0 : E ? 4 : 2, 4];
  else if (E) c = [0, 2];
  else if (Wt) c = [4, 2];
  else if (fl(1, 1)) c = [0, 0];
  else if (fl(-1, 1)) c = [4, 0];
  else if (fl(1, -1)) c = [0, 4];
  else if (fl(-1, -1)) c = [4, 4];
  g.fillStyle = '#14161c'; g.fillRect(0, 0, 16, 16);
  if (c) g.drawImage(tileset(img), (bx + c[0]) * 16, (by + c[1]) * 16, 16, 16, 0, 0, 16, 16);
};
const grassLike = (base, tufts) => (g, X, Y) => {
  const t = hash(X, Y, 7) < 0.16 ? tufts[Math.floor(hash(X, Y, 8) * tufts.length)] : base;
  g.drawImage(tileset('floor'), t[0] * 16, t[1] * 16, 16, 16, 0, 0, 16, 16);
};
// a flower or bush on grass takes the darker grass when most of its neighbours are dark grass
const darkish = (k) => k === 'dgrass' || k === 'dbush' || k === 'dpath';
const decor = (under, img, x, y) => (g, X, Y, n, f) => {
  let u = under;
  if (under === 'grass' && [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(([dx, dy]) => darkish(n(dx, dy))).length >= 2) u = 'dgrass';
  TILES[u].draw(g, X, Y, n, f); g.drawImage(tileset(img), x * 16, y * 16, 16, 16, 0, 0, 16, 16);
};
const same = (a, b) => a === b;
const watery = (a) => a === 'water' || a === 'sea' || a === 'deep' || a === 'lily' || a === 'osea' || a === 'fspot';
const swampy = (a) => a === 'swamp';
const springy = (a) => a === 'onsen';
// a plain colour with a scatter of specks: lava, the sky, the void between clouds
const speckle = (base, specks, k = 0.12, solidK = 0) => (g, X, Y) => {
  g.fillStyle = base; g.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 6; i++) { if (hash(X * 7 + i, Y * 5, 11) < k + solidK) { g.fillStyle = specks[i % specks.length]; const sx = Math.floor(hash(X, Y, 20 + i) * 13), sy = Math.floor(hash(X, Y, 40 + i) * 13); g.fillRect(sx, sy, 2 + (i % 3), 1 + (i % 2)); } }
};
// a current drawn as chevrons pointing the way it flows
const current = (dir) => (g, X, Y) => {
  g.drawImage(tileset('floor'), 16, 16, 16, 16, 0, 0, 16, 16);
  g.fillStyle = 'rgba(80,170,240,0.55)'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = 'rgba(230,250,255,0.85)';
  for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) {
    const a = 3 + k * 8, b = 4 + i * 2 - 3;
    const pts = { r: [a + Math.abs(b - 1), 4 + i * 2], l: [12 - a - Math.abs(b - 1) + 2, 4 + i * 2], d: [4 + i * 2, a + Math.abs(b - 1)], u: [4 + i * 2, 12 - a - Math.abs(b - 1) + 2] }[dir];
    g.fillRect(pts[0], pts[1], 2, 1);
  }
};

export const TILES = {
  grass: { draw: grassLike([0, 12], [[1, 12], [2, 12], [3, 12], [4, 12]]) },
  dgrass: { draw: grassLike([11, 12], [[12, 12], [13, 12], [14, 12], [15, 12]]) },
  path: { draw: PATCH('floor', 0, 7, same) },
  dpath: { draw: PATCH('floor', 11, 7, same) },
  sand: { draw: cut('floor', 1, 1) },
  snow: { draw: cut('floor', 6, 18) },
  // ponds have grassy banks, the sea a sandy shore; both are solid
  water: { solid: true, draw: PATCH('water', 0, 6, watery) },
  sea: { solid: true, draw: PATCH('water', 0, 0, watery) },
  // deep water: open water in the middle, a shore where it meets anything else (moats, chasms, the reef)
  deep: { solid: true, draw: PATCH('water', 0, 0, watery) },
  lily: { solid: true, draw: (g, X, Y, n, f) => { TILES.water.draw(g, X, Y, n, f); g.drawImage(tileset('water'), 11 * 16, 3 * 16, 16, 16, 0, 0, 16, 16); } },
  plank: { draw: cut('water', 5, 13) },
  // indoors
  wood: { draw: cut('interiorfloor', 12, 1) },
  brick: { draw: cut('interiorfloor', 1, 13) },
  stone: { draw: cut('interiorfloor', 12, 13) },
  moss: { draw: cut('interiorfloor', 12, 7) },
  tile: { draw: cut('interiorfloor', 1, 1) },
  iwall: { solid: true, draw: RING('wallsimple', 0, 0) },
  owall: { solid: true, draw: RING('wallsimple', 5, 0) },
  cwall: { solid: true, draw: RING('wallsimple', 0, 6) },
  gwall: { solid: true, draw: RING('wallsimple', 5, 6) },
  void: { solid: true, draw(g) { g.fillStyle = '#14161c'; g.fillRect(0, 0, 16, 16); } },
  // things growing in the grass
  flower: { draw: decor('grass', 'nature', 0, 11) },
  flower2: { draw: decor('grass', 'nature', 1, 11) },
  flower3: { draw: decor('grass', 'nature', 3, 11) },
  clover: { draw: decor('grass', 'nature', 2, 11) },
  weed: { draw: decor('grass', 'nature', 3, 10) },
  bush: { solid: true, draw: decor('grass', 'nature', 0, 10) },
  bush2: { solid: true, draw: decor('grass', 'nature', 1, 10) },
  dbush: { solid: true, draw: decor('dgrass', 'nature', 7, 11) },
  rock: { solid: true, draw: decor('grass', 'nature', 4, 13) },
  srock: { solid: true, draw: decor('sand', 'nature', 4, 13) },
  crock: { solid: true, draw: decor('stone', 'nature', 5, 12) },
  stumpt: { solid: true, draw: decor('grass', 'nature', 4, 8) },
  // ---- the later chapters ----
  // the open sea you can sail on, and the islands in it
  osea: { draw: PATCH('water', 0, 0, watery) },
  fspot: { solid: true, draw: PATCH('water', 0, 6, watery) },
  iland: { solid: true, draw: grassLike([0, 12], [[1, 12], [2, 12], [3, 12]]) },
  isand: { solid: true, draw: cut('floor', 1, 1) },
  itree: { solid: true, draw: decor('grass', 'nature', 0, 10) },
  // clouds to walk on, and the sky between them
  cloud: { draw: (g, X, Y, n) => { g.fillStyle = '#88c4f4'; g.fillRect(0, 0, 16, 16); PATCH('floor', 0, 14, (a) => a === 'cloud' || a === 'cloudb')(g, X, Y, n); } },
  cloudb: { draw: (g, X, Y, n) => { TILES.cloud.draw(g, X, Y, n); g.drawImage(tileset('water'), 5 * 16, 13 * 16, 16, 16, 0, 0, 16, 16); } },
  sky: { solid: true, draw: speckle('#88c4f4', ['#c8e8ff', '#ffffff', '#a8d8fc'], 0.1) },
  // the volcano: ash underfoot, lava on every side
  ash: { draw: (g) => { g.drawImage(tileset('floor'), 16 * 16, 16 * 16, 16, 16, 0, 0, 16, 16); g.fillStyle = 'rgba(60,20,10,0.35)'; g.fillRect(0, 0, 16, 16); } },
  lava: { solid: true, draw: speckle('#b82810', ['#f87818', '#f8c030', '#e05010', '#f8e070'], 0.45) },
  // a hot spring: clear water in a sandy rim, with wisps of steam (the pack's frozen pond read as ice)
  onsen: { solid: true, draw: (g, X, Y, n) => {
    PATCH('water', 0, 0, springy)(g, X, Y, n);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 2; i++) if (hash(X, Y, 30 + i) < 0.6) { const sx = 3 + Math.floor(hash(X, Y, 32 + i) * 9), sy = 3 + i * 6 + Math.floor(hash(X, Y, 34 + i) * 3); g.fillRect(sx, sy, 3, 1); g.fillRect(sx + 1, sy - 1, 2, 1); g.fillRect(sx - 1, sy - 2, 2, 1); }
  } },
  pink: { draw: PATCH('floor', 11, 0, same) },
  swamp: { solid: true, draw: PATCH('water', 13, 6, swampy) },
  // under the sea: coral standing on the sand, and currents that carry you
  // coral in a few shapes and colours: branching, a fan, a cluster of tubes, or a plain rock
  coral: { solid: true, draw: (g, X, Y) => {
    g.drawImage(tileset('floor'), 16, 16, 16, 16, 0, 0, 16, 16);
    const c = ['#f86080', '#f8a040', '#c060f0', '#f87858'][Math.floor(hash(X, Y, 3) * 4)], k = Math.floor(hash(X, Y, 5) * 4), ox = Math.floor(hash(X, Y, 6) * 4) - 2;
    g.fillStyle = c;
    if (k === 0) { g.fillRect(7 + ox, 4, 2, 11); g.fillRect(4 + ox, 7, 2, 6); g.fillRect(10 + ox, 6, 2, 7); g.fillRect(5 + ox, 12, 7, 2); }
    else if (k === 1) { g.beginPath(); g.arc(8 + ox, 10, 6, Math.PI, 0); g.fill(); g.fillRect(7 + ox, 10, 2, 5); g.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 4; i++) g.fillRect(4 + ox + i * 2, 6 + (i % 2), 1, 3); }
    else if (k === 2) { for (const [x, h] of [[4, 8], [7, 11], [10, 7]]) { g.fillRect(x + ox, 15 - h, 2, h); g.fillStyle = '#ffffff'; g.fillRect(x + ox, 15 - h, 2, 1); g.fillStyle = c; } }
    else { g.fillStyle = '#7888a0'; g.beginPath(); g.ellipse(8, 11, 6, 4, 0, 0, 7); g.fill(); g.fillStyle = '#a8b8c8'; g.fillRect(5, 8, 4, 2); }
  } },
  curL: { draw: current('l') }, curR: { draw: current('r') }, curU: { draw: current('u') }, curD: { draw: current('d') },
  palace: { draw: cut('interiorfloor', 16, 7) },
  tan: { draw: cut('interiorfloor', 16, 1) },
  pinkwall: { solid: true, draw: RING('wallsimple', 0, 0) },
};

// ---------- map pre-rendering ----------
// returns { frames: [canvas], upper: canvas }; off the edge, a tile counts its own kind as its neighbour
export function renderMap(map) {
  const { w, h } = map;
  const kindAt = (x, y) => map.kinds[map.tile(Math.max(0, Math.min(w - 1, x)), Math.max(0, Math.min(h - 1, y)))];
  const upper = canvas(w * 16, h * 16), t = canvas(16, 16), c = canvas(w * 16, h * 16);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = kindAt(x, y), def = TILES[k];
    if (!def) throw new Error('tile ' + k);
    t.x.clearRect(0, 0, 16, 16);
    def.draw(t.x, x, y, (dx, dy) => (x + dx < 0 || y + dy < 0 || x + dx >= w || y + dy >= h ? k : kindAt(x + dx, y + dy)), 0);
    c.x.drawImage(t, x * 16, y * 16);
  }
  return { frames: [c], upper };
}
export const solidKind = (k) => !!(TILES[k] && TILES[k].solid);
