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
  if (S && !N) c = [Wt ? 0 : E ? 4 : 2, 0];
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
const decor = (under, img, x, y) => (g, X, Y, n, f) => { TILES[under].draw(g, X, Y, n, f); g.drawImage(tileset(img), x * 16, y * 16, 16, 16, 0, 0, 16, 16); };
const same = (a, b) => a === b;
const watery = (a) => a === 'water' || a === 'sea' || a === 'deep' || a === 'lily';

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
  deep: { solid: true, draw: cut('water', 1, 1) },
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
