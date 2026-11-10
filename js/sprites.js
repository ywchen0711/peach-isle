// Characters cut from the Ninja Adventure sprite sheets (CC0). A person's sheet has a column for each way
// they face (down, up, left, right) and a row for each walking step; an animal's has two side-on steps.
// Each frame is padded to 16x24 with the figure at the bottom, the size the field and menus expect.
import { canvas } from './gfx.js';
import { IMG } from './assets.js';

const cache = new Map();
function frame(img, sx, sy, flip = false, fw = 16, fh = 16) {
  const c = canvas(Math.max(16, fw), 24);
  if (flip) { c.x.translate(c.width, 0); c.x.scale(-1, 1); }
  c.x.drawImage(img, sx, sy, fw, fh, Math.floor((c.width - fw) / 2), 24 - fh, fw, fh);
  return c;
}
function build(name) {
  const img = IMG['c:' + name] || IMG['c:Villager'];
  const out = {};
  if (img.height < 24) {
    // an animal: two steps seen from the side, looking left; some breeds are a little bigger than 16x16
    const fw = img.width / 2, fh = img.height;
    const l = [0, 1, 0, 1].map((k) => frame(img, k * fw, 0, false, fw, fh)), r = [0, 1, 0, 1].map((k) => frame(img, k * fw, 0, true, fw, fh));
    Object.assign(out, { l, r, d: l, u: r });
  } else {
    const rows = Math.max(1, Math.min(4, Math.floor(img.height / 16)));
    ['d', 'u', 'l', 'r'].forEach((d, col) => { out[d] = [0, 1, 2, 3].map((k) => frame(img, col * 16, (k % rows) * 16)); });
  }
  return out;
}
// story names for the cast, so scripts can say sprite('momo')
const CAST = { momo: 'Boy', shiro: 'DogBlackWhite', natsume: 'MonkeyBrown', kiji: 'ParrotRed', grandpa: 'OldMan', grandma: 'OldWoman', akane: 'Princess' };
export const castSheet = (name) => CAST[name] || name;
export function sprite(name) {
  const n = castSheet(name);
  if (!cache.has(n)) cache.set(n, build(n));
  return cache.get(n);
}
// the 38x38 portrait for dialogue windows, when the pack has one
export const face = (name) => IMG['f:' + castSheet(name)] || null;
