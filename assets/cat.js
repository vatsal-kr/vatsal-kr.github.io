// The street cat's body: pixel sprites, drawing, input and the animation loop.
// Its learning lives in assets/cat-brain.js (CatBrain).
(() => {
if (!window.CatBrain) return;
const CELL = 40; // CSS px per grid cell
const DIRS = CatBrain.DIRS;
const PURRS = ['prrrrrr', '*purrs*', '*slow blink*', 'mrrrp :3', '*headbutts hand*'];
const SNUBS = ['*ignores you*', 'mrrp. no.', 'not now, human.', 'busy. learning.', 'food first.'];

// ---- sprites: one character per pixel, '.' is transparent ----
// cat roles: e ears, h head, k eyes, p nose, t tail, b body, s stripes, c chest, l legs, w paws, x patches
const CAT_ROWS = [
  '.........e...e',
  't........hhhhh',
  't........hkhkh',
  '.t.......hhphh',
  '..bbbbbbbbbcc.',
  '..bsbbsbbsbccc',
  '..bbbbbbbbbcc.',
];
const CALICO_ROWS = [
  '.........x...e',
  't........xhhhh',
  't........hkhkh',
  '.t.......hhphh',
  '..bxxbbbsssbb.',
  '..xxxbbsssbbbb',
  '..bbbbbbbbbbb.',
];
const CAT_LEGS = [['...l.l....l.l.', '...w.w....w.w.'], ['..l...l..l...l', '..w...w..w...w']];
const pal = (body, o) => Object.assign({ e: body, h: body, t: body, b: body, s: body, c: body, l: body, w: body, k: '#1B1410', p: '#F2A1A1' }, o);
const BREED_LOOKS = [ // index-aligned with CatBrain.BREEDS
  { col: pal('#EE8E3E', { s: '#B8611F', c: '#F6C38E', w: '#B8611F' }) },
  { col: pal('#2A2A30', { s: '#38383F', k: '#D9E35A', p: '#C97C86' }) },
  { col: pal('#2A2A30', { c: '#F7F4EE', w: '#F7F4EE', k: '#9FD86B', p: '#E8A0A8' }) },
  { col: pal('#8E929C', { s: '#5F636D', c: '#CDD0D6', w: '#CDD0D6' }) },
  { col: pal('#F7EEDF', { e: '#5A4234', t: '#5A4234', l: '#5A4234', w: '#5A4234', p: '#5A4234', k: '#3E8FD6' }) },
  { rows: CALICO_ROWS, col: pal('#F7F4EE', { s: '#EE8E3E', e: '#EE8E3E', t: '#EE8E3E', x: '#2A2A30' }) },
];
const SNACK_LOOKS = [ // index-aligned with CatBrain.SNACKS
  { rows: ['..bbbb..b', '.bbbbbbbb', 'bwkbbbbb.', '.bbbbbbbb', '..bbbb..b'], col: { b: '#3D7FB8', w: '#fff', k: '#14202C' } },
  { rows: ['..rrrrr..', '.rrlllrr.', 'krr...lrr', '.......rr', '....r.rr.', '...rrrr..'], col: { r: '#EE6F5B', l: '#F8B3A2', k: '#4A1E14' } },
  { rows: ['.mmmm.....', 'mhhmmm....', 'mhmmmmm...', 'mmmmmmmww.', '.mmmmm.www', '..mm....w.'], col: { m: '#A85A28', h: '#D98A4A', w: '#F7F2E6' } },
  { rows: ['.wwwwwwww.', 'bbbbbbbbbb', 'bbwbbbbwbb', '.bbbbbbbb.', '..dddddd..'], col: { w: '#FFFFFF', b: '#4A7FC1', d: '#2F5A93' } },
  { rows: ['.ssssssss.', 'ssssssssss', 'llllllllll', 'llwwwlwlll', 'llllllllll', '.dddddddd.'], col: { s: '#C3CAD3', l: '#3D7FB8', w: '#FFFFFF', d: '#7D8693' } },
  { rows: ['.hhhhhhhhh.', 'hbbgbbgbbgb', 'bbbgbbgbbgb', 'bbbbbbbbbbb', '.bbbbbbbbb.'], col: { h: '#B8703F', b: '#8A4B2A', g: '#4E2A18' } },
];
// a hand seen from above, fingers down, sleeve up
const HAND_PX = ['..LLLLLLLLL..', '..LLLLLLLLL..', '.ooooooooooo.', 'ossssssssssso', 'ossssssssssso',
  'ossossossosso', 'ossossossosso', '.oo.oo.oo.oo.'];
const HAND_COL = { o: '#8A5A3C', s: '#F4C6A0', L: '#2E7A5E' };

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
const hash = s => { let h = Math.imul(s + 1, 374761393); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const pxOf = cs => Math.max(2, Math.round(cs / 15));

function sprite(c, rows, colors, cx, cy, P, flip) {
  const w = rows[0].length, h = rows.length;
  const x0 = Math.round(cx - w * P / 2), y0 = Math.round(cy - h * P / 2);
  for (let r = 0; r < h; r++) for (let k = 0; k < w; k++) {
    const ch = rows[r][flip ? w - 1 - k : k];
    if (ch === '.') continue;
    c.fillStyle = colors[ch]; c.fillRect(x0 + k * P, y0 + r * P, P, P);
  }
}
function tile(c, X, Y, cs, s) { // Sofia's yellow cobblestones
  const P = pxOf(cs), h = hash(s);
  c.fillStyle = '#C3A553'; c.fillRect(X, Y, cs, cs);
  c.fillStyle = h < .33 ? '#E8CF7A' : h < .66 ? '#E2C76E' : '#ECD585'; c.fillRect(X + P, Y + P, cs - 2 * P, cs - 2 * P);
  c.fillStyle = '#F3E3A6'; c.fillRect(X + P, Y + P, cs - 2 * P, P);
  c.fillStyle = '#CFB262'; c.fillRect(X + P, Y + cs - 2 * P, cs - 2 * P, P);
  if (h > .7) { c.fillStyle = '#D6BA66'; c.fillRect(X + Math.round(cs * .3), Y + Math.round(cs * .55), P, P); }
}
function bush(c, X, Y, cs, s) {
  const P = pxOf(cs);
  c.fillStyle = '#C3A553'; c.fillRect(X, Y, cs, cs);
  c.fillStyle = '#2F6438'; c.fillRect(X + P, Y + 2 * P, cs - 2 * P, cs - 3 * P);
  c.fillStyle = '#3F7E45'; c.fillRect(X + 2 * P, Y + P, cs - 4 * P, cs - 4 * P);
  c.fillStyle = '#5C9D57';
  for (let i = 0; i < 5; i++) {
    const a = hash(s * 7 + i), b = hash(s * 13 + i);
    c.fillRect(X + 2 * P + Math.floor(a * (cs - 6 * P) / P) * P, Y + 2 * P + Math.floor(b * (cs - 7 * P) / P) * P, 2 * P, P);
  }
  if (hash(s * 3) > .6) { c.fillStyle = '#E86A7A'; c.fillRect(X + Math.round(cs * .6), Y + Math.round(cs * .3), P, P); }
}
function heat(c, X, Y, cs, v) { // learned value, quantised to 4 pixel-ish levels
  const P = pxOf(cs), q = Math.ceil(Math.pow(v, .8) * 4) / 4;
  c.fillStyle = `rgba(38,118,90,${q * .5})`; c.fillRect(X + P, Y + P, cs - 2 * P, cs - 2 * P);
}
function arrow(c, cx, cy, a, cs, v) { // greedy action as a 3-pixel chevron
  const P = pxOf(cs), [dx, dy] = DIRS[a], px = -dy, py = dx;
  const ox = Math.round(cx + dx * P * 2), oy = Math.round(cy + dy * P * 2);
  c.fillStyle = `rgba(24,70,52,${Math.min(.75, v * 1.2)})`;
  c.fillRect(ox - P / 2, oy - P / 2, P, P);
  c.fillRect(ox - dx * P + px * P - P / 2, oy - dy * P + py * P - P / 2, P, P);
  c.fillRect(ox - dx * P - px * P - P / 2, oy - dy * P - py * P - P / 2, P, P);
}

class CatView {
  constructor(root) {
    this.cv = root.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
    this.hud = root.querySelector('[data-cat-hud]');
    this.still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.visible = false; this.t = 0; this.hover = -1;
    new ResizeObserver(() => this.resize()).observe(this.cv);
    new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(this.cv);
    this.bind();
  }

  resize() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height || (r.width === this.W && r.height === this.H)) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = r.width; this.H = r.height;
    const cols = Math.max(6, Math.floor(this.W / CELL)), rows = Math.max(4, Math.floor(this.H / CELL));
    this.cs = Math.floor(Math.min(this.W / cols, this.H / rows));
    this.ox = Math.round((this.W - cols * this.cs) / 2); this.oy = Math.round((this.H - rows * this.cs) / 2);
    this.brain = new CatBrain({ cols, rows });
    this.Vshow = new Float32Array(this.brain.N);
    this.trail = []; this.particles = []; this.bubble = null; this.flash = null; this.drag = this.down = null;
    this.spawnA = this.still ? 1 : 0; this.heartT = 0; this.lastMsg = null;
    this.updateHud(); this.draw();
  }

  center(s) { const b = this.brain; return [this.ox + (s % b.cols + .5) * this.cs, this.oy + (((s / b.cols) | 0) + .5) * this.cs]; }
  cellAt(x, y) {
    const b = this.brain, cx = Math.floor((x - this.ox) / this.cs), cy = Math.floor((y - this.oy) / this.cs);
    return cx < 0 || cy < 0 || cx >= b.cols || cy >= b.rows ? -1 : cy * b.cols + cx;
  }
  onCat(x, y) { return this.catXY && Math.hypot(x - this.catXY[0], y - this.catXY[1]) < this.cs * .55; }

  bind() {
    const cv = this.cv;
    const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    // Phones keep scrolling over the game; only a touch that starts on the snack (and not the cat) is ours.
    cv.addEventListener('touchstart', e => {
      if (!this.brain || !e.touches[0]) return;
      const [x, y] = local(e.touches[0]);
      if (this.cellAt(x, y) === this.brain.snack && !this.onCat(x, y)) e.preventDefault();
    }, { passive: false });
    // A press only becomes a pet, a bush or a drop when it is released without the page scrolling
    // (a scroll ends in pointercancel), so scrolling past never counts as playing.
    cv.addEventListener('pointerdown', e => {
      if (!this.brain) return;
      const [x, y] = local(e), s = this.cellAt(x, y), cat = this.onCat(x, y);
      if (!cat && s >= 0 && s === this.brain.snack) { this.drag = { x, y }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; return; }
      this.down = { x, y, s, cat };
    });
    cv.addEventListener('pointermove', e => {
      if (!this.brain) return;
      const [x, y] = local(e);
      if (this.drag) { this.drag.x = x; this.drag.y = y; return; }
      if (e.pointerType !== 'mouse') return;
      const s = this.cellAt(x, y);
      if (s !== this.hover) { this.hover = s; this.dirty = true; }
      cv.style.cursor = s < 0 ? 'default' : s === this.brain.snack ? 'grab' : 'pointer';
    });
    cv.addEventListener('pointerup', e => {
      if (!this.brain) return;
      const b = this.brain, [x, y] = local(e), s = this.cellAt(x, y), d = this.down;
      this.down = null;
      if (this.drag) { this.drag = null; this.play(); cv.style.cursor = 'grab'; if (s >= 0) b.moveSnack(s); return; }
      if (!d || Math.hypot(x - d.x, y - d.y) >= 8 || (!d.cat && (s < 0 || s !== d.s))) return;
      this.play();
      if (d.cat) { if (b.pet()) this.bubble = { text: pick(b.petting.ok ? PURRS : SNUBS), life: 1.8 }; }
      else if (!b.toggleWall(s)) this.flash = { s, life: .6 };
    });
    cv.addEventListener('pointercancel', () => { this.down = this.drag = null; });
    cv.addEventListener('pointerleave', () => { this.hover = -1; });
  }

  play() { this.brain.touch(); this.still = false; }

  updateHud() {
    const msg = this.brain.msg;
    if (msg !== this.lastMsg) { this.lastMsg = msg; this.hud.textContent = msg.toUpperCase(); }
  }

  frame(now) {
    const dt = Math.min(50, now - (this.lastNow || now)), b = this.brain;
    this.lastNow = now;
    if (this.still) { // reduced motion: one still frame, redrawn only when the hover outline moves
      if (this.dirty) { this.dirty = false; this.draw(); }
      return;
    }
    this.t += dt / 1000;
    for (const e of b.tick(dt)) {
      if (e === 'step') { this.trail.push({ s: b.cat, life: 1 }); if (this.trail.length > 40) this.trail.shift(); }
      else if (e === 'ate') {
        const [x, y] = this.center(b.snack);
        for (let i = 0; i < 3; i++) this.particles.push({ x: x + (i - 1) * this.cs * .28, y: y - this.cs * .35, vy: -28 - Math.random() * 22, life: 1 + i * .15, txt: '+1' });
      } else if (e === 'spawn') this.spawnA = 0;
    }
    this.updateHud();
    for (let s = 0; s < b.N; s++) {
      const target = b.walls[s] ? 0 : s === b.snack ? 1 : b.maxQ(b.Qd, s);
      this.Vshow[s] += (target - this.Vshow[s]) * .09;
    }
    if (b.petting && b.petting.ok && (this.heartT -= dt) <= 0 && this.catXY) {
      this.heartT = 260;
      this.particles.push({ x: this.catXY[0] + (Math.random() - .5) * this.cs * .6, y: this.catXY[1] - this.cs * .7, vy: -26 - Math.random() * 16, life: 1, txt: '♥' });
    }
    this.spawnA = Math.min(1, this.spawnA + dt / 300);
    for (const tr of this.trail) tr.life -= dt / 1600;
    this.trail = this.trail.filter(tr => tr.life > 0);
    for (const q of this.particles) { q.y += q.vy * dt / 1000; q.life -= dt / 1000; }
    this.particles = this.particles.filter(q => q.life > 0);
    if (this.bubble && (this.bubble.life -= dt / 1000) <= 0) this.bubble = null;
    if (this.flash && (this.flash.life -= dt / 1000) <= 0) this.flash = null;
    this.draw();
  }

  draw() {
    const c = this.ctx, b = this.brain, cs = this.cs, P = pxOf(cs);
    c.fillStyle = '#B99A48'; c.fillRect(0, 0, this.W, this.H);
    for (let s = 0; s < b.N; s++) {
      const X = this.ox + (s % b.cols) * cs, Y = this.oy + ((s / b.cols) | 0) * cs;
      if (b.walls[s]) bush(c, X, Y, cs, s);
      else { tile(c, X, Y, cs, s); if (this.Vshow[s] > .004) heat(c, X, Y, cs, this.Vshow[s]); }
    }
    for (let s = 0; s < b.N; s++) {
      if (b.walls[s] || s === b.snack || this.Vshow[s] < .03) continue;
      let a = 0; for (let k = 1; k < 4; k++) if (b.Qd[s * 4 + k] > b.Qd[s * 4 + a]) a = k;
      if (b.Qd[s * 4 + a] > 0) arrow(c, ...this.center(s), a, cs, this.Vshow[s]);
    }
    c.fillStyle = 'rgba(90,60,20,.4)';
    for (const tr of this.trail) {
      const [x, y] = this.center(tr.s), r = Math.max(2, Math.round(cs * .07));
      c.globalAlpha = tr.life * .8;
      c.fillRect(Math.round(x - cs * .1), Math.round(y + cs * .18), r, r);
      c.fillRect(Math.round(x + cs * .06), Math.round(y + cs * .12), r, r);
    }
    c.globalAlpha = 1;
    if (this.flash) {
      const [x, y] = this.center(this.flash.s);
      c.fillStyle = `rgba(220,60,60,${this.flash.life * .6})`; c.fillRect(x - cs / 2, y - cs / 2, cs, cs);
    }
    if (this.hover >= 0 && !this.drag && this.hover !== b.snack) {
      const [x, y] = this.center(this.hover);
      c.strokeStyle = '#23302A'; c.lineWidth = P; c.setLineDash([2 * P, P]);
      c.strokeRect(x - cs / 2 + P, y - cs / 2 + P, cs - 2 * P, cs - 2 * P); c.setLineDash([]);
    }

    const F = SNACK_LOOKS[b.snackKind], [fx, fy] = this.drag ? [this.drag.x, this.drag.y] : this.center(b.snack);
    sprite(c, F.rows, F.col, fx, fy + (Math.sin(this.t * 4) > 0 ? -1 : 1) * Math.max(1, Math.round(cs / 30)), Math.max(2, Math.round(cs * .62 / 9)), false);

    const [ax, ay] = this.center(b.catPrev), [bx, by] = this.center(b.cat), e = ease(b.p), moving = b.catPrev !== b.cat;
    let x = ax + (bx - ax) * e, y = ay + (by - ay) * e - (moving ? Math.sin(e * Math.PI) * cs * .12 : 0);
    if (b.bumpA >= 0 && b.p < 1) { const k = Math.sin(b.p * Math.PI) * cs * .14; x += DIRS[b.bumpA][0] * k; y += DIRS[b.bumpA][1] * k; }
    const pet = b.petting, away = !!pet && !pet.ok && pet.life < 1.45;
    if (pet && pet.ok && Math.sin(this.t * 18) > 0) y -= Math.max(2, Math.round(cs / 20));
    this.catXY = [x, y];
    const B = BREED_LOOKS[b.breed], CP = Math.max(2, Math.round(cs * .85 / 14));
    const legs = CAT_LEGS[moving && b.p < 1 && Math.sin(b.p * Math.PI * 2) > 0 ? 1 : 0];
    const rows = (B.rows || CAT_ROWS).map(r => away ? r.replace(/[kp]/g, 'h') : r).concat(legs);
    c.globalAlpha = this.spawnA;
    c.fillStyle = 'rgba(60,40,10,.25)'; c.fillRect(Math.round(x - 6 * CP), Math.round(y + 4.5 * CP), 12 * CP, CP);
    sprite(c, rows, B.col, x, y, CP, away ? b.facing > 0 : b.facing < 0);
    c.globalAlpha = 1;
    if (pet) { // the hand strokes; on a snub it pulls back
      const el = 1.8 - pet.life;
      const a = pet.ok ? Math.min(1, pet.life * 4, el * 6) : Math.max(0, Math.min(1, el * 6, 1 - (el - .35) * 3));
      if (a > 0) { c.globalAlpha = a; sprite(c, HAND_PX, HAND_COL, x + Math.sin(el * 11) * cs * .18, y - cs * .32, Math.max(2, Math.round(cs * .55 / 13)), false); c.globalAlpha = 1; }
    }

    c.font = '14px Silkscreen, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#D9483B';
    for (const q of this.particles) { c.globalAlpha = Math.max(0, Math.min(1, q.life)); c.fillText(q.txt, q.x, q.y); }
    c.globalAlpha = 1; c.textAlign = 'left';
    if (this.bubble) {
      c.font = '11px Silkscreen, monospace';
      const w = c.measureText(this.bubble.text).width + 18, h = 24;
      const bx2 = Math.min(Math.max(x - w / 2, 4), this.W - w - 4);
      let by2 = y - cs * .6 - h; if (by2 < 4) by2 = y + cs * .5;
      c.globalAlpha = Math.min(1, this.bubble.life * 3);
      c.fillStyle = '#23302A'; c.fillRect(bx2, by2, w, h);
      c.fillStyle = '#FBF7EC'; c.fillText(this.bubble.text, bx2 + 9, by2 + h / 2 + 1);
      c.globalAlpha = 1;
    }
  }
}

const views = [...document.querySelectorAll('[data-cat]')].map(el => new CatView(el));
(function loop(now) {
  const pageVisible = document.visibilityState === 'visible';
  for (const v of views) {
    if (v.brain && pageVisible && v.visible && v.cv.offsetParent !== null) v.frame(now);
    else v.lastNow = 0;
  }
  requestAnimationFrame(loop);
})(performance.now());
})();
