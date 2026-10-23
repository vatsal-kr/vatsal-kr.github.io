// The street cat's brain: tabular Dyna-Q on a gridworld. No DOM and no pixels;
// assets/cat.js draws it. Tune the constants below.
(() => {
const GAMMA = 0.94;                    // discount
const PLAN = 60;                       // model backups per real step
const PAUSE_PLAN = 500;                // backups per tick while the cat eats
const MEAL_MS = 1100;                  // pause after reaching the snack
const EXPLORE_MS = 42, LEARN_MS = 100; // time per step
const EPS0 = 0.2, EPS_DECAY = 0.7, EPS_MIN = 0.03;
const IDLE_MS = 8000;                  // no visitor input for this long before the snack moves on its own
const PET_S = 1.8, PURR_P = 0.65;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

function mulberry32(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

class CatBrain {
  // `seed` drives everything the learning sees; `lookSeed` only picks cosmetics
  // (breed, snack, petting mood), so the look can never change what is learned.
  constructor({ cols, rows, seed = (Math.random() * 2 ** 32) >>> 0, lookSeed }) {
    this.cols = cols; this.rows = rows; this.N = cols * rows;
    this.rng = mulberry32(seed);
    this.lookRng = mulberry32(lookSeed === undefined ? seed ^ 0x9e3779b9 : lookSeed);
    this.time = 0; this.lastTouch = -Infinity; this.events = [];
    this.petting = null; this.pause = 0; this.acc = 0; this.p = 1; this.facing = 1; this.bumpA = -1;
    this.breed = -1; this.snackKind = -1;
    this.newWorld();
  }

  rnd(n) { return Math.floor(this.rng() * n); }
  pick(arr) { return arr[this.rnd(arr.length)]; }
  idx(x, y) { return y * this.cols + x; }
  get breedName() { return CatBrain.BREEDS[this.breed]; }
  get snackName() { return CatBrain.SNACKS[this.snackKind]; }

  nbrs(s) {
    const x = s % this.cols, y = (s / this.cols) | 0, out = [];
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < this.cols && ny < this.rows) out.push(this.idx(nx, ny));
    }
    return out;
  }
  bfs(src) {
    const d = new Int32Array(this.N).fill(-1); d[src] = 0; const q = [src];
    for (let i = 0; i < q.length; i++) for (const n of this.nbrs(q[i])) if (!this.walls[n] && d[n] < 0) { d[n] = d[q[i]] + 1; q.push(n); }
    return d;
  }
  connected() {
    const d = this.bfs(this.snack);
    for (let s = 0; s < this.N; s++) if (!this.walls[s] && d[s] < 0) return false;
    return true;
  }
  maxQ(Q, s) { const i = s * 4; return Math.max(Q[i], Q[i + 1], Q[i + 2], Q[i + 3]); }
  argmax(Q, s) {
    const i = s * 4; let best = -Infinity, arr = [];
    for (let a = 0; a < 4; a++) {
      const v = Q[i + a];
      if (v > best + 1e-9) { best = v; arr = [a]; } else if (Math.abs(v - best) <= 1e-9) arr.push(a);
    }
    return this.pick(arr);
  }

  newWorld() {
    const { cols, rows, N } = this;
    this.walls = new Uint8Array(N);
    this.snack = this.idx(cols - 2 - this.rnd(Math.max(1, Math.floor(cols / 3))), 1 + this.rnd(rows - 2));
    const target = Math.floor(N * 0.15);
    let placed = 0, tries = 0;
    while (placed < target && tries++ < 500) {
      const horiz = this.rng() < 0.5, len = 2 + this.rnd(3), x = this.rnd(cols), y = this.rnd(rows), seg = [];
      for (let k = 0; k < len; k++) {
        const xx = x + (horiz ? k : 0), yy = y + (horiz ? 0 : k);
        if (xx < cols && yy < rows) seg.push(this.idx(xx, yy));
      }
      if (seg.some(s => s === this.snack || this.walls[s])) continue;
      seg.forEach(s => this.walls[s] = 1);
      if (!this.connected()) { seg.forEach(s => this.walls[s] = 0); continue; }
      placed += seg.length;
    }
    this.dist = this.bfs(this.snack);
    this.sampleLook();
    this.resetLearning();
    this.startEpisode(this.randomStart(5, 9));
  }

  sampleLook() {
    const other = (prev, n) => {
      if (prev < 0) return Math.floor(this.lookRng() * n);
      const i = Math.floor(this.lookRng() * (n - 1));
      return i >= prev ? i + 1 : i;
    };
    this.breed = other(this.breed, CatBrain.BREEDS.length);
    this.snackKind = other(this.snackKind, CatBrain.SNACKS.length);
  }

  // Two tables learn from the same experience: Qo starts optimistic (1) and drives
  // exploration; Qd starts at 0, is what gets drawn, and drives the cat once it knows.
  resetLearning() {
    const N4 = this.N * 4;
    this.Qd = new Float32Array(N4);
    this.Qo = new Float32Array(N4).fill(1);
    this.next = new Int32Array(N4).fill(-1);
    this.rew = new Float32Array(N4);
    this.seen = [];
    this.phase = 'explore'; this.eps = EPS0; this.solvedStreak = 0; this.episode = 0; this.history = [];
    this.msg = `a ${this.breedName} smells ${this.snackName}…`;
  }

  randomStart(minD, maxD = Infinity) {
    let c = [];
    for (let s = 0; s < this.N; s++) { const d = this.dist[s]; if (d >= minD && d <= maxD) c.push(s); }
    if (!c.length) for (let s = 0; s < this.N; s++) if (this.dist[s] > 0) c.push(s);
    return this.pick(c);
  }

  startEpisode(s) {
    this.cat = this.catPrev = s; this.steps = 0; this.optimal = this.dist[s];
    this.acc = 0; this.p = 1; this.bumpA = -1;
  }

  move(s, a) {
    const x = s % this.cols + DIRS[a][0], y = ((s / this.cols) | 0) + DIRS[a][1];
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return s;
    const n = this.idx(x, y);
    return this.walls[n] ? s : n;
  }
  backup(Q, sa) { // deterministic world, so α = 1
    const s2 = this.next[sa];
    Q[sa] = s2 === this.snack ? this.rew[sa] : this.rew[sa] + GAMMA * this.maxQ(Q, s2);
  }
  plan(n) {
    if (!this.seen.length) return;
    for (let k = 0; k < n; k++) { const j = this.seen[this.rnd(this.seen.length)]; this.backup(this.Qd, j); this.backup(this.Qo, j); }
  }

  act() {
    const s = this.cat;
    let a;
    if (this.phase === 'learn' && this.rng() < this.eps) a = this.rnd(4);
    else a = this.argmax(this.phase === 'learn' && this.maxQ(this.Qd, s) > 1e-4 ? this.Qd : this.Qo, s);
    const sa = s * 4 + a, s2 = this.move(s, a);
    if (this.next[sa] < 0) this.seen.push(sa);
    this.next[sa] = s2; this.rew[sa] = s2 === this.snack ? 1 : 0;
    this.backup(this.Qd, sa); this.backup(this.Qo, sa); this.plan(PLAN);
    this.catPrev = s; this.cat = s2; this.steps++;
    this.bumpA = s2 === s ? a : -1;
    if (DIRS[a][0]) this.facing = DIRS[a][0];
    if (s2 === this.snack) this.onSnack();
    else if (this.phase === 'explore') this.msg = `${this.breedName} exploring… ${this.steps} step${this.steps === 1 ? '' : 's'}`;
  }

  onSnack() {
    this.episode++;
    this.history.push(this.steps); if (this.history.length > 24) this.history.shift();
    this.solvedStreak = this.steps <= this.optimal + 2 ? this.solvedStreak + 1 : 0;
    if (this.phase === 'explore') { this.phase = 'learn'; this.msg = `found the ${this.snackName} in ${this.steps} steps! value spreading back…`; }
    else this.msg = `episode ${this.episode}: ${this.steps} steps (shortest is ${this.optimal})`;
    this.eps = Math.max(EPS_MIN, this.eps * EPS_DECAY);
    this.pause = MEAL_MS;
    this.after = this.solvedStreak >= 3 && this.time - this.lastTouch > IDLE_MS ? 'run' : 'respawn';
    this.events.push('ate');
  }

  afterPause() {
    if (this.after === 'run') {
      const cand = [];
      for (let s = 0; s < this.N; s++) if (this.dist[s] >= 6) cand.push(s);
      this.snack = cand.length ? this.pick(cand) : this.randomStart(3);
      this.dist = this.bfs(this.snack);
      this.sampleLook();
      this.resetLearning();
      this.startEpisode(this.randomStart(4, 10));
      this.events.push('run');
    } else this.startEpisode(this.randomStart(5));
    this.events.push('spawn');
  }

  // Petting freezes the cat; learning just waits, so it never changes what is learned.
  tick(dt) {
    const ev = this.events = [];
    this.time += dt;
    const interval = this.phase === 'explore' ? EXPLORE_MS : LEARN_MS;
    if (this.petting) {
      if (this.pause <= 0) { this.acc = Math.min(this.acc + dt, interval - 1); this.p = this.acc / interval; }
      if ((this.petting.life -= dt / 1000) <= 0) this.petting = null;
    } else if (this.pause > 0) {
      this.pause -= dt; this.plan(PAUSE_PLAN); this.p = 1;
      if (this.pause <= 0) this.afterPause();
    } else {
      this.acc += dt;
      while (this.acc >= interval && this.pause <= 0) { this.acc -= interval; this.act(); ev.push('step'); }
      this.p = this.pause > 0 ? 1 : Math.min(1, this.acc / interval);
    }
    return ev;
  }

  toggleWall(s) {
    if (!(s >= 0 && s < this.N) || s === this.snack || s === this.cat || s === this.catPrev) return false;
    // Adding a bush can cut the grid; removing one can open a boxed-in pocket. Refuse both.
    this.walls[s] ^= 1;
    if (!this.connected()) { this.walls[s] ^= 1; return false; }
    for (const n of [s, ...this.nbrs(s)]) for (let a = 0; a < 4; a++) {
      const sa = n * 4 + a; this.next[sa] = -1; this.Qd[sa] = 0; this.Qo[sa] = 1;
    }
    this.seen = this.seen.filter(sa => this.next[sa] >= 0);
    this.dist = this.bfs(this.snack);
    this.optimal = this.dist[this.cat] + this.steps; this.solvedStreak = 0;
    return true;
  }

  moveSnack(s) {
    if (!(s >= 0 && s < this.N) || this.walls[s] || s === this.cat || s === this.snack) return false;
    this.snack = s; this.dist = this.bfs(s); this.pause = 0;
    this.resetLearning();
    this.msg = `new ${this.snackName} spot. exploring…`;
    this.startEpisode(this.cat);
    return true;
  }

  pet() {
    if (this.petting) return false;
    this.petting = { life: PET_S, ok: this.lookRng() < PURR_P };
    return true;
  }

  touch() { this.lastTouch = this.time; }
}
CatBrain.BREEDS = ['ginger tabby', 'black cat', 'tuxedo cat', 'grey tabby', 'siamese', 'calico'];
CatBrain.SNACKS = ['fish', 'shrimp', 'drumstick', 'milk', 'tuna', 'kebapche'];
CatBrain.DIRS = DIRS;

if (typeof module !== 'undefined') module.exports = { CatBrain, mulberry32 };
else globalThis.CatBrain = CatBrain;
})();
