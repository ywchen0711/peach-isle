// Keyboard, gamepad and on-screen touch buttons, read once per frame.
const MAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Enter: 'a', Space: 'a', KeyJ: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b', KeyK: 'b', KeyC: 'menu', Tab: 'menu',
};
const down = new Set(), was = new Set(), touch = new Set();
const age = {};
// a touch on the pad counts for at least one frame, even if the finger is already up again
const latch = new Set();
let pad = new Set();
export let lastDevice = 'key';
// the on-screen pad is showing, so hints name its buttons instead of the keys
export const touchUI = () => document.body.classList.contains('touching');
// key names in a hint become the pad's button names while the pad is showing
export const K = (s) => (touchUI() ? String(s).replace(/C 鍵/g, '選單鈕').replace(/(^|[^A-Za-z])([ZXC])(?=[^A-Za-z]|$)/g, (m, p, k, o, str) => (str.slice(Math.max(0, o - 3), o + 1) === 'the ' ? m : p + ({ Z: 'A', X: 'B', C: 'MENU' })[k])) : s);
addEventListener('keydown', (e) => {
  const k = MAP[e.code];
  if (!k) return;
  e.preventDefault();
  down.add(k); lastDevice = 'key';
});
addEventListener('keyup', (e) => { const k = MAP[e.code]; if (k) down.delete(k); });
// losing focus, hiding the page (iOS app switcher, lock) or a cancelled touch lets go of every key
let dropTouches = () => {};
export function releaseAll() { down.clear(); touch.clear(); dropTouches(); }
addEventListener('blur', releaseAll);
addEventListener('pagehide', releaseAll);
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

export const input = {
  held: (k) => down.has(k) || touch.has(k) || latch.has(k) || pad.has(k),
  pressed: (k) => (down.has(k) || touch.has(k) || latch.has(k) || pad.has(k)) && !was.has(k),
  // pressed, then repeating while held (menus)
  repeat(k) {
    if (!this.held(k)) return false;
    const a = age[k] || 0;
    return a === 1 || (a > 16 && a % 5 === 0);
  },
  dir() { for (const d of ['up', 'down', 'left', 'right']) if (this.held(d)) return d; return null; },
  anyPressed() { return ['a', 'b', 'menu'].some((k) => this.pressed(k)); },
  clear() { was.clear(); for (const k of [...down, ...touch, ...latch, ...pad]) was.add(k); latch.clear(); },
};
export function pollInput() {
  // gamepads
  pad = new Set();
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g) : null;
  if (gp) {
    const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
    if (b(12) || gp.axes[1] < -0.5) pad.add('up');
    if (b(13) || gp.axes[1] > 0.5) pad.add('down');
    if (b(14) || gp.axes[0] < -0.5) pad.add('left');
    if (b(15) || gp.axes[0] > 0.5) pad.add('right');
    if (b(0)) pad.add('a');
    if (b(1)) pad.add('b');
    if (b(3) || b(9)) pad.add('menu');
    if (pad.size) lastDevice = 'pad';
  }
  for (const k of ['up', 'down', 'left', 'right', 'a', 'b', 'menu']) age[k] = input.held(k) ? (age[k] || 0) + 1 : 0;
}
export function endInput() {
  was.clear();
  for (const k of [...down, ...touch, ...latch, ...pad]) was.add(k);
  latch.clear();
}

// on-screen buttons
export function setupTouch() {
  const el = document.getElementById('touch');
  if (!el) return;
  const show = () => { document.body.classList.add('touching'); lastDevice = 'touch'; };
  addEventListener('touchstart', show, { passive: true, once: true });
  // phones and tablets (iPadOS calls itself a Mac, so ask about the pointer, not the name) get the pad at once
  try { if (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches) show(); } catch (e) { /* old browser */ }
  // no pinch or double-tap zoom over the game (the long-press menu is off in the CSS)
  for (const ev of ['gesturestart', 'gesturechange', 'dblclick']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  const pads = el.querySelectorAll('[data-k]');
  const active = new Map();
  const update = () => { const before = new Set(touch); touch.clear(); for (const k of active.values()) if (k) touch.add(k); for (const k of touch) if (!before.has(k)) latch.add(k); };
  dropTouches = () => { active.clear(); touch.clear(); };
  const hit = (x, y) => { const t = document.elementFromPoint(x, y); return t && t.dataset && t.dataset.k ? t.dataset.k : null; };
  const dpad = el.querySelector('.dpad');
  const dirAt = (x, y) => {
    const r = dpad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = x - cx, dy = y - cy;
    if (Math.hypot(dx, dy) > r.width * 0.75) return null;
    if (Math.hypot(dx, dy) < r.width * 0.1) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  };
  const onTouch = (e) => {
    for (const t of e.changedTouches) {
      if (e.type === 'touchend' || e.type === 'touchcancel') { active.delete(t.identifier); continue; }
      const k = hit(t.clientX, t.clientY);
      const inPad = dpad && dpad.contains(document.elementFromPoint(t.clientX, t.clientY));
      if (inPad || (active.get(t.identifier) && ['up', 'down', 'left', 'right'].includes(active.get(t.identifier)))) active.set(t.identifier, dirAt(t.clientX, t.clientY));
      else active.set(t.identifier, k);
    }
    update();
    e.preventDefault();
  };
  for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) el.addEventListener(ev, onTouch, { passive: false });
  void pads;
}
