const test = require('node:test');
const assert = require('node:assert/strict');
const { CatBrain, mulberry32 } = require('../assets/cat-brain.js');

const DT = 16;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

// Independent BFS over free cells, so the tests don't trust brain.dist.
function bfs(b, src) {
  const d = new Int32Array(b.N).fill(-1); d[src] = 0; const q = [src];
  for (let i = 0; i < q.length; i++) {
    const s = q[i], x = s % b.cols, y = (s / b.cols) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= b.cols || ny >= b.rows) continue;
      const n = ny * b.cols + nx;
      if (!b.walls[n] && d[n] < 0) { d[n] = d[s] + 1; q.push(n); }
    }
  }
  return d;
}
function connected(b) {
  const d = bfs(b, b.snack);
  for (let s = 0; s < b.N; s++) if (!b.walls[s] && d[s] < 0) return false;
  return true;
}
// Tick until `pred(events)` is true; returns the number of ticks, or -1 at the cap.
function tickUntil(b, pred, cap) {
  for (let i = 0; i < cap; i++) if (pred(b.tick(DT))) return i;
  return -1;
}
function tickSteps(b, n, onTick) {
  let steps = 0;
  while (steps < n) {
    const ev = b.tick(DT);
    if (onTick) onTick(ev, steps);
    steps += ev.filter(e => e === 'step').length;
  }
}

test('world is connected and sized', () => {
  const b = new CatBrain({ cols: 14, rows: 8, seed: 1 });
  assert.equal(b.N, 112);
  assert.ok(connected(b));
  const walls = b.walls.reduce((a, v) => a + v, 0);
  assert.ok(walls >= 1 && walls <= Math.ceil(0.15 * b.N) + 3, `walls=${walls}`);
  assert.ok(b.snack % b.cols >= b.cols - 1 - Math.floor(b.cols / 3), 'snack not in the right third');
  const d = bfs(b, b.snack)[b.cat];
  assert.ok(d >= 5 && d <= 9, `start distance ${d}`);
});

test('explores then learns', () => {
  const b = new CatBrain({ cols: 14, rows: 8, seed: 2 });
  assert.equal(b.phase, 'explore');
  assert.notEqual(tickUntil(b, ev => ev.includes('ate'), 200000), -1, 'never found the snack');
  assert.equal(b.phase, 'learn');
  assert.equal(b.episode, 1);
});

test('on an empty street the cat follows its nose from afar, then explores near the snack', () => {
  for (let seed = 1; seed <= 5; seed++) {
    const b = new CatBrain({ cols: 40, rows: 4, seed });
    b.walls.fill(0); b.snack = 1 * 40 + 38; b.dist = b.bfs(b.snack);
    b.resetLearning(); b.startEpisode(2 * 40 + 1);
    const far = s => Math.abs(s % 40 - 38) + Math.abs(((s / 40) | 0) - 1);
    let approaching = true; // until it first gets within 20 cells; after that it may explore anywhere
    assert.notEqual(tickUntil(b, ev => {
      if (ev.includes('step') && approaching) assert.ok(far(b.cat) < far(b.catPrev), `seed ${seed}: strayed while far`);
      if (far(b.cat) <= 20) approaching = false;
      return ev.includes('ate');
    }, 100000), -1);
    assert.ok(b.steps > b.optimal, `seed ${seed}: went straight to the snack without exploring`);
  }
});

test('phones get no scent, so they explore as before', () => {
  for (let seed = 1; seed <= 10; seed++) assert.ok(new CatBrain({ cols: 8, rows: 5, seed }).Qo.every(v => v === 1), `seed ${seed}`);
});

test('far spawns on a wide strip explore about as much as a phone, without mapping the street', () => {
  // Extra steps over the shortest path: a phone's first find vs the first trip from 15+ cells away on
  // a 1440px strip. Flat optimism took ~315 on the strip; too strong a scent took ~14.
  const median = a => a.sort((x, y) => x - y)[a.length >> 1];
  const phone = [], strip = [];
  for (let seed = 1; seed <= 30; seed++) {
    let b = new CatBrain({ cols: 8, rows: 5, seed });
    tickUntil(b, ev => ev.includes('ate'), 3000000); phone.push(b.steps - b.optimal);
    b = new CatBrain({ cols: 36, rows: 4, seed });
    assert.notEqual(tickUntil(b, ev => ev.includes('ate') && b.episode > 1 && b.optimal >= 15, 3000000), -1, `seed ${seed}: no far trip`);
    strip.push(b.steps - b.optimal);
  }
  const p = median(phone), s = median(strip);
  assert.ok(s >= p && s <= 200, `strip median ${s} extra steps, phone ${p}`);
});

test('respawn emits spawn', () => {
  const b = new CatBrain({ cols: 14, rows: 8, seed: 3 });
  tickUntil(b, ev => ev.includes('ate'), 200000);
  let sawSpawn = false;
  tickUntil(b, ev => {
    if (ev.includes('spawn')) { sawSpawn = true; assert.notEqual(b.cat, b.snack); }
    return ev.includes('step');
  }, 10000);
  assert.ok(sawSpawn, 'no spawn event before the next step');
});

test('converges and starts a new run', () => {
  const b = new CatBrain({ cols: 14, rows: 8, seed: 4 });
  const nearOpt = [];
  const t = tickUntil(b, ev => {
    if (ev.includes('ate')) nearOpt.push(b.steps <= b.optimal + 2);
    return ev.includes('run');
  }, 2000000);
  assert.notEqual(t, -1, 'no new run');
  assert.deepEqual(nearOpt.slice(-3), [true, true, true]);
});

test('new run changes the look', () => {
  const b = new CatBrain({ cols: 10, rows: 6, seed: 5 });
  let prev = [b.breed, b.snackKind];
  for (let k = 0; k < 5; k++) {
    assert.notEqual(tickUntil(b, ev => ev.includes('run'), 2000000), -1);
    assert.notEqual(b.breed, prev[0]);
    assert.notEqual(b.snackKind, prev[1]);
    assert.ok(b.breed >= 0 && b.breed < CatBrain.BREEDS.length);
    assert.ok(b.snackKind >= 0 && b.snackKind < CatBrain.SNACKS.length);
    prev = [b.breed, b.snackKind];
  }
});

test('tiny grids learn', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const b = new CatBrain({ cols: 6, rows: 4, seed });
    assert.ok(connected(b));
    assert.notEqual(tickUntil(b, ev => ev.includes('run'), 2000000), -1, `seed ${seed} never converged`);
  }
});

test('toggleWall refuses snack, cat and disconnecting cells', () => {
  const b = new CatBrain({ cols: 6, rows: 4, seed: 6 });
  assert.equal(b.toggleWall(b.snack), false);
  assert.equal(b.toggleWall(b.cat), false);
  // Hand-built world: a wall column at x=2 with a single bridge at (2,1).
  b.walls.fill(0);
  for (const y of [0, 2, 3]) b.walls[y * 6 + 2] = 1;
  b.snack = 5; b.cat = b.catPrev = 0;
  const before = Array.from(b.walls);
  assert.equal(b.toggleWall(1 * 6 + 2), false);
  assert.deepEqual(Array.from(b.walls), before);
  assert.equal(b.toggleWall(2 * 6 + 4), true);
  assert.equal(b.walls[2 * 6 + 4], 1);
});

test('random bush toggling keeps world solvable', () => {
  const b = new CatBrain({ cols: 10, rows: 6, seed: 7 });
  const r = mulberry32(42);
  for (let i = 0; i < 300; i++) {
    b.toggleWall(Math.floor(r() * b.N));
    for (let k = 0; k < 20; k++) b.tick(DT);
    assert.ok(connected(b), `disconnected at iteration ${i}`);
    assert.equal(b.walls[b.cat], 0, 'cat inside a bush');
    assert.ok(bfs(b, b.snack)[b.cat] >= 0, 'snack unreachable');
  }
});

test('moveSnack rejects invalid cells', () => {
  const b = new CatBrain({ cols: 14, rows: 8, seed: 8 });
  const snack = b.snack, wall = b.walls.indexOf(1);
  for (const s of [-1, b.N, wall, b.cat, b.snack]) {
    assert.equal(b.moveSnack(s), false, `accepted ${s}`);
    assert.equal(b.snack, snack);
  }
  tickUntil(b, ev => ev.includes('ate'), 200000);
  tickUntil(b, ev => ev.includes('step'), 10000);
  const look = [b.breed, b.snackKind];
  let target = 0;
  while (b.walls[target] || target === b.cat || target === b.snack) target++;
  assert.equal(b.moveSnack(target), true);
  assert.equal(b.snack, target);
  assert.equal(b.phase, 'explore');
  assert.equal(b.episode, 0);
  assert.deepEqual([b.breed, b.snackKind], look);
});

test('cosmetics never affect learning', () => {
  const a = new CatBrain({ cols: 14, rows: 8, seed: 9, lookSeed: 1 });
  const b = new CatBrain({ cols: 14, rows: 8, seed: 9, lookSeed: 2 });
  tickSteps(a, 3000); tickSteps(b, 3000);
  assert.deepEqual(Array.from(a.Qd), Array.from(b.Qd));
  assert.equal(a.cat, b.cat);
});

test('petting freezes and never changes learning', () => {
  const a = new CatBrain({ cols: 14, rows: 8, seed: 10 });
  const b = new CatBrain({ cols: 14, rows: 8, seed: 10 });
  tickSteps(a, 500);
  let pets = 0;
  tickSteps(b, 500, (ev, steps) => {
    if (b.petting) assert.ok(!ev.includes('step'), 'stepped while petting');
    if (steps >= 100 && !b.petting && pets < 20) { assert.equal(b.pet(), true); pets++; }
  });
  assert.equal(pets, 20);
  assert.deepEqual(Array.from(a.Qd), Array.from(b.Qd));
  assert.equal(a.cat, b.cat);
});

test('petting odds', () => {
  let ok = 0;
  for (let i = 0; i < 2000; i++) {
    const b = new CatBrain({ cols: 6, rows: 4, seed: 1, lookSeed: i });
    assert.equal(b.pet(), true);
    assert.equal(b.pet(), false);
    if (b.petting.ok) ok++;
  }
  assert.ok(ok / 2000 >= 0.6 && ok / 2000 <= 0.7, `ok rate ${ok / 2000}`);
});

test('status tells the story without statistics', () => {
  const b = new CatBrain({ cols: 14, rows: 8, seed: 11 });
  const msgs = new Set([b.msg]);
  assert.notEqual(tickUntil(b, ev => { msgs.add(b.msg); return ev.includes('run'); }, 2000000), -1);
  for (const m of msgs) assert.doesNotMatch(m, /\d/, m);
  for (const s of ['smells', 'exploring…', 'found the', 'knows the way']) assert.ok([...msgs].some(m => m.includes(s)), `never said '${s}'`);
});

test('relocated snack stays off the top and bottom rows', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const b = new CatBrain({ cols: 36, rows: 4, seed });
    for (let k = 0; k < 3; k++) {
      assert.notEqual(tickUntil(b, ev => ev.includes('run'), 3000000), -1, `seed ${seed}: no run`);
      const y = Math.floor(b.snack / b.cols);
      assert.ok(y >= 1 && y <= b.rows - 2, `seed ${seed}: snack moved to row ${y}`);
    }
  }
});
