// A small 16-bit style sound chip: pulse, triangle, string and noise voices through an echo,
// a note sequencer for the soundtrack, and sound effects.
let A = null, master, musicBus, sfxBus, echoIn, noiseBuf;
const waves = {};
export const vol = { music: 0.55, sfx: 0.7 };
// music can be switched off altogether; the volume is kept for when it comes back on
export const music = { on: true };
const mv = () => (music.on ? vol.music : 0);

export function initAudio() {
  if (A) { if (A.state === 'suspended') A.resume(); return; }
  A = new (window.AudioContext || window.webkitAudioContext)();
  master = A.createGain(); master.gain.value = 0.8;
  const lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
  master.connect(lp); lp.connect(A.destination);
  musicBus = A.createGain(); musicBus.gain.value = mv(); musicBus.connect(master);
  sfxBus = A.createGain(); sfxBus.gain.value = vol.sfx; sfxBus.connect(master);
  // the echo that makes it sound like the cartridge sound chip
  echoIn = A.createGain(); echoIn.gain.value = 0.32;
  const d = A.createDelay(1); d.delayTime.value = 0.21;
  const fb = A.createGain(); fb.gain.value = 0.36;
  const ef = A.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 2400;
  echoIn.connect(d); d.connect(ef); ef.connect(fb); fb.connect(d); ef.connect(master);
  for (const duty of [0.125, 0.25, 0.5]) {
    const n = 48, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    waves[duty] = A.createPeriodicWave(re, im);
  }
  noiseBuf = A.createBuffer(1, A.sampleRate, A.sampleRate);
  const ch = noiseBuf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  if (A.state === 'suspended') A.resume();
  if (pending && el) { pending = null; el.play().catch(() => {}); }
}
export function setVolumes() { if (el) el.volume = Math.min(1, mv() * 0.9); if (!A) return; musicBus.gain.value = mv(); sfxBus.gain.value = vol.sfx; }

const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------- voices ----------
function env(g, t, a, peak, dec, sus, end, rel) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setTargetAtTime(peak * sus, t + a, dec);
  g.gain.setValueAtTime(g.gain.value || peak * sus, end);
  g.gain.cancelScheduledValues(end);
  g.gain.setTargetAtTime(0.0001, end, rel);
}
function voice(inst, m, t, dur, v, out, echo = true) {
  const end = t + dur, f = freq(m);
  const g = A.createGain(); g.connect(out); if (echo) g.connect(echoIn);
  const osc = (type, fr, detune = 0) => { const o = A.createOscillator(); if (waves[type]) o.setPeriodicWave(waves[type]); else o.type = type; o.frequency.value = fr; o.detune.value = detune; return o; };
  let stop = end + 0.6;
  if (inst === 'lead' || inst === 'lead50' || inst === 'thin') {
    const o = osc(inst === 'lead' ? 0.25 : inst === 'thin' ? 0.125 : 0.5, f);
    // delayed vibrato
    if (dur > 0.3) { const l = A.createOscillator(), lg = A.createGain(); l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.5, dur)); l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(stop); }
    o.connect(g); env(g, t, 0.01, v, 0.25, 0.7, end, 0.05); o.start(t); o.stop(stop);
  } else if (inst === 'pluck') {
    const o = osc(0.25, f); o.connect(g); env(g, t, 0.005, v, 0.12, 0.25, end, 0.04); o.start(t); o.stop(stop);
  } else if (inst === 'bass') {
    const o = osc('triangle', f); o.connect(g); env(g, t, 0.005, v, 0.3, 0.75, end - 0.01, 0.03); o.start(t); o.stop(stop);
  } else if (inst === 'strings') {
    const lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600; lp.connect(g);
    for (const dt of [-7, 7]) { const o = osc('sawtooth', f, dt); o.connect(lp); o.start(t); o.stop(end + 1.2); }
    env(g, t, Math.min(0.25, dur * 0.4), v * 0.5, 0.5, 0.85, end, 0.25); stop = end + 1.2;
  } else if (inst === 'bell') {
    for (const [r, a] of [[1, 1], [2.76, 0.35], [5.4, 0.12]]) { const o = osc('sine', f * r); const og = A.createGain(); og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + 2); }
    g.gain.setValueAtTime(v, t); g.gain.setTargetAtTime(0.0001, t, 0.45); stop = t + 2;
  } else if (inst === 'organ') {
    for (const [r, a] of [[1, 1], [2, 0.5], [4, 0.2]]) { const o = osc(0.5, f * r); const og = A.createGain(); og.gain.value = a * 0.6; o.connect(og); og.connect(g); o.start(t); o.stop(stop); }
    env(g, t, 0.02, v * 0.6, 0.4, 0.8, end, 0.1);
  }
  return g;
}
function drum(kind, t, v, out) {
  const g = A.createGain(); g.connect(out);
  if (kind === 'k') {
    const o = A.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.12);
    o.connect(g); g.gain.setValueAtTime(v * 1.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.start(t); o.stop(t + 0.2);
  } else {
    const n = A.createBufferSource(); n.buffer = noiseBuf;
    const f = A.createBiquadFilter();
    if (kind === 's') { f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 0.8; } else { f.type = 'highpass'; f.frequency.value = 7000; }
    n.connect(f); f.connect(g); g.connect(echoIn);
    const len = kind === 's' ? 0.16 : kind === 'H' ? 0.18 : 0.04;
    g.gain.setValueAtTime(v * (kind === 's' ? 1.1 : 0.5), t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    n.start(t, Math.random() * 0.5); n.stop(t + len + 0.02);
  }
}

// ---------- music: recorded tracks from the Ninja Adventure pack (CC0) ----------
// a few story moments reuse a track under another name; 'victory' is a short jingle
const TRACK = { town: 'village', tower: 'temple', gameover: 'lament', victory: null, battle2: 'dojo' };
const JINGLE = { victory: 'victory' };
let el = null, pending = null;
export let currentSong = null;
export function playMusic(name, { restart = false } = {}) {
  if (JINGLE[name]) { stopMusic(0.2); jingle(JINGLE[name]); return; }
  if (currentSong === name && !restart && el) return;
  stopMusic(0.4);
  currentSong = name;
  if (!name) return;
  const a = new Audio('assets/music/' + (TRACK[name] || name) + '.ogg');
  a.loop = name !== 'ending' && name !== 'trueend'; a.volume = Math.min(1, mv() * 0.9);
  el = a;
  if (!A) { pending = name; return; }
  a.play().catch(() => { pending = name; });
}
export function stopMusic(fade = 0) {
  const a = el; el = null; currentSong = null;
  if (!a) return;
  if (!fade) { a.pause(); return; }
  const v0 = a.volume, t0 = performance.now();
  const step = () => { const k = (performance.now() - t0) / (fade * 1000); if (k >= 1) { a.pause(); return; } a.volume = v0 * (1 - k); requestAnimationFrame(step); };
  step();
}
function jingle(n) { const a = new Audio('assets/jingle/' + n + '.wav'); a.volume = Math.min(1, vol.sfx * 0.8); a.play().catch(() => {}); }
export const songLengths = () => ({});

// ---------- sound effects ----------
function blip(seq, inst = 'lead50', v = 0.18, step = 0.05, echo = false) {
  if (!A) return;
  let t = A.currentTime + 0.01;
  for (const m of seq) { if (m) voice(inst, m, t, step * 0.9, v, sfxBus, echo); t += step; }
}
function noise(t0, len, f0, f1, v = 0.3, type = 'bandpass') {
  const n = A.createBufferSource(); n.buffer = noiseBuf;
  const f = A.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + len); f.Q.value = 1.2;
  const g = A.createGain(); g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + len);
  n.connect(f); f.connect(g); g.connect(sfxBus); n.start(t0, Math.random() * 0.4); n.stop(t0 + len + 0.05);
}
function sweep(t0, len, f0, f1, type = 'square', v = 0.15) {
  const o = A.createOscillator(); if (waves[type]) o.setPeriodicWave(waves[type]); else o.type = type;
  o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + len);
  const g = A.createGain(); g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + len);
  o.connect(g); g.connect(sfxBus); g.connect(echoIn); o.start(t0); o.stop(t0 + len + 0.05);
}
export function sfx(name) {
  if (!A) return;
  const t = A.currentTime + 0.01;
  switch (name) {
    case 'cursor': blip([88], 'thin', 0.1, 0.03); break;
    case 'ok': blip([84, 91], 'lead50', 0.12, 0.04); break;
    case 'cancel': blip([79, 72], 'lead50', 0.1, 0.04); break;
    case 'buzz': blip([50, 50], 'lead50', 0.12, 0.08); break;
    case 'text': blip([96], 'thin', 0.03, 0.015); break;
    case 'hit': noise(t, 0.12, 2500, 300, 0.45); sweep(t, 0.08, 300, 80, 0.5, 0.18); break;
    case 'crit': noise(t, 0.2, 4000, 200, 0.55); sweep(t, 0.15, 600, 60, 0.5, 0.2); break;
    case 'slash': noise(t, 0.1, 6000, 1200, 0.3, 'highpass'); break;
    case 'miss': sweep(t, 0.12, 900, 1600, 0.125, 0.08); break;
    case 'hurt': noise(t, 0.18, 1200, 150, 0.5); sweep(t, 0.15, 220, 60, 'triangle', 0.3); break;
    case 'fire': noise(t, 0.5, 800, 200, 0.45, 'lowpass'); sweep(t, 0.4, 200, 60, 'sawtooth', 0.1); break;
    case 'ice': for (let i = 0; i < 5; i++) blip([96 + i * 2], 'bell', 0.08, 0.04); noise(t, 0.3, 8000, 3000, 0.2, 'highpass'); break;
    case 'bolt': noise(t, 0.35, 3000, 400, 0.6); sweep(t, 0.3, 1400, 90, 0.125, 0.18); break;
    case 'holy': blip([84, 88, 91, 96, 100], 'bell', 0.1, 0.05, true); break;
    case 'heal': blip([79, 84, 88, 91, 96], 'bell', 0.1, 0.06, true); break;
    case 'buff': blip([72, 76, 79, 84], 'lead', 0.08, 0.05, true); break;
    case 'sleep': blip([84, 79, 76, 72], 'bell', 0.08, 0.12, true); break;
    case 'bubble': for (let i = 0; i < 6; i++) sweep(t + i * 0.05, 0.06, 300 + i * 60, 900 + i * 80, 'sine', 0.12); break;
    case 'abyss': sweep(t, 1.0, 400, 40, 'sawtooth', 0.2); noise(t, 1.0, 600, 60, 0.4, 'lowpass'); break;
    case 'spore': noise(t, 0.4, 2000, 600, 0.2); break;
    case 'drain': sweep(t, 0.4, 900, 200, 0.25, 0.12); break;
    case 'die': noise(t, 0.45, 1600, 100, 0.4); sweep(t, 0.4, 500, 50, 0.5, 0.12); break;
    case 'boom': noise(t, 0.9, 1200, 40, 0.7, 'lowpass'); sweep(t, 0.7, 120, 30, 'triangle', 0.4); break;
    case 'encounter': sweep(t, 0.35, 200, 1600, 0.25, 0.14); sweep(t + 0.1, 0.35, 300, 2400, 0.5, 0.1); noise(t, 0.4, 500, 4000, 0.2); break;
    case 'run': sweep(t, 0.3, 800, 200, 0.25, 0.12); break;
    case 'door': noise(t, 0.12, 600, 200, 0.3); blip([60, 55], 'bass', 0.25, 0.06); break;
    case 'stairs': for (let i = 0; i < 4; i++) noise(t + i * 0.08, 0.06, 900, 300, 0.25); break;
    case 'chest': blip([72, 76, 79, 84, 0, 91], 'lead50', 0.12, 0.06, true); break;
    case 'push': noise(t, 0.2, 400, 120, 0.4, 'lowpass'); break;
    case 'switch': blip([67, 79], 'lead', 0.12, 0.05); break;
    case 'gate': for (let i = 0; i < 3; i++) noise(t + i * 0.1, 0.1, 700, 200, 0.35); blip([60, 67, 72], 'bass', 0.25, 0.1); break;
    case 'level': blip([72, 76, 79, 84, 79, 84, 88, 91], 'lead50', 0.12, 0.07, true); break;
    case 'save': blip([84, 88, 91, 96, 91, 96], 'bell', 0.12, 0.08, true); break;
    case 'step': noise(t, 0.03, 800, 400, 0.05); break;
    case 'bump': sweep(t, 0.06, 140, 80, 'triangle', 0.25); break;
    case 'slide': noise(t, 0.15, 3000, 6000, 0.08, 'highpass'); break;
    case 'warp': sweep(t, 0.6, 200, 2000, 0.125, 0.12); sweep(t + 0.15, 0.5, 300, 3000, 0.25, 0.08); break;
    case 'quake': noise(t, 0.8, 300, 40, 0.8, 'lowpass'); sweep(t, 0.6, 80, 30, 'triangle', 0.5); break;
    case 'special': sweep(t, 0.3, 300, 1800, 0.5, 0.15); blip([84, 91, 96, 103], 'lead50', 0.1, 0.05, true); break;
  }
}

// the music switch: the button, the M key and the saved choice
const MKEY = 'peachisle-music';
try { music.on = localStorage.getItem(MKEY) !== 'off'; } catch (e) { /* private mode */ }
export function setMusic(on) {
  music.on = on; setVolumes();
  try { localStorage.setItem(MKEY, on ? 'on' : 'off'); } catch (e) { /* private mode */ }
  const b = document.getElementById('musicBtn'); if (b) b.classList.toggle('off', !on);
}
if (typeof document !== 'undefined') {
  const b = document.getElementById('musicBtn');
  if (b) { b.classList.toggle('off', !music.on); b.addEventListener('click', (e) => { e.stopPropagation(); initAudio(); setMusic(!music.on); }); }
  addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !e.repeat) setMusic(!music.on); });
}
