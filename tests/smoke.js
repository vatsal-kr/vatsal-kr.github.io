// Real-time browser checks: headless Chrome driven over the DevTools pipe, no dependencies.
// Run: node tests/smoke.js
const { spawn } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), http = require('node:http');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

function chrome() {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cat-smoke-'));
  const proc = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--remote-debugging-pipe', `--user-data-dir=${prof}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], detached: true });
  let buf = '', id = 0;
  const pending = new Map(), handlers = [];
  proc.stdio[4].on('data', d => {
    buf += d;
    for (let i; (i = buf.indexOf('\0')) >= 0; buf = buf.slice(i + 1)) {
      const msg = JSON.parse(buf.slice(0, i));
      if (pending.has(msg.id)) { const [res, rej] = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); }
      else handlers.forEach(h => h(msg));
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    pending.set(++id, [res, rej]);
    proc.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
  // Kill Chrome's whole process group so no helper is still writing to the profile when it is removed.
  const close = () => new Promise(r => { proc.once('exit', r); process.kill(-proc.pid, 'SIGKILL'); })
    .then(() => sleep(300)).then(() => fs.rmSync(prof, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }));
  return { send, handlers, close };
}

// Records every CatBrain the page builds, so checks can find the cat and pick cells.
const HOOK = `
Object.defineProperty(globalThis, 'CatBrain', { configurable: true, get() {}, set(v) {
  const W = class extends v { constructor(o) { super(o); (globalThis.__brains ||= []).push(this); } };
  Object.defineProperty(globalThis, 'CatBrain', { value: W, writable: true, configurable: true });
} });
globalThis.__at = (b, cv, s) => {
  const r = cv.getBoundingClientRect(), cs = Math.floor(Math.min(r.width / b.cols, r.height / b.rows));
  const ox = Math.round((r.width - b.cols * cs) / 2), oy = Math.round((r.height - b.rows * cs) / 2);
  return [r.left + ox + (s % b.cols + .5) * cs, r.top + oy + (((s / b.cols) | 0) + .5) * cs];
};`;

const errors = [];
async function open(c, url, { width, height, mobile = false, reduced = false }) {
  const { targetId } = await c.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await c.send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => c.send(m, p, sessionId);
  c.handlers.push(m => { if (m.sessionId === sessionId && m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); });
  await s('Runtime.enable'); await s('Page.enable');
  await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (mobile) await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (reduced) await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await s('Page.addScriptToEvaluateOnNewDocument', { source: HOOK });
  await s('Page.navigate', { url });
  const ev = async expr => {
    const r = await s('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(`page threw: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  };
  for (let i = 0; i < 100 && await ev('document.readyState') !== 'complete'; i++) await sleep(50);
  await sleep(300);
  const touch = (type, pts) => s('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const tap = async (x, y) => { await touch('touchStart', [{ x, y }]); await sleep(50); await touch('touchEnd', []); };
  const swipe = async (x, y) => { // drag the finger whichever way the page can still scroll
    const dy = await ev('scrollY') > 100 ? 16 : -16;
    await touch('touchStart', [{ x, y }]);
    for (let k = 1; k <= 10; k++) { await sleep(16); await touch('touchMove', [{ x, y: y + dy * k }]); }
    await touch('touchEnd', []);
  };
  return { ev, tap, swipe, close: () => c.send('Target.closeTarget', { targetId }) };
}

const hud = sel => `document.querySelector('${sel} [data-cat-hud]').textContent`;
const stepped = t => /STEP|FOUND|EPISODE/.test(t);
const PANEL = `document.querySelector('.gamewin canvas')`;
const freeCell = `(() => { const b = __brains.at(-1), cv = ${PANEL};
  for (let s = 0; s < b.N; s++) {
    if (b.walls[s] || s === b.snack || s === b.cat || s === b.catPrev) continue;
    const [x, y] = __at(b, cv, s); if (y > 40 && y < innerHeight - 40) return [x, y];
  } })()`;

const checks = {
  async 'desktop runs the strip, not the panel'(p) {
    await sleep(2500);
    const strip = await p.ev(hud('.strip')), panel = await p.ev(hud('.gamewin'));
    if (!stepped(strip) || panel !== '…') throw new Error(`strip='${strip}' panel='${panel}'`);
  },
  async 'mobile runs the panel, not the strip'(p) {
    await p.ev(`document.querySelector('.gamewin').scrollIntoView({ block: 'center', behavior: 'instant' })`);
    await sleep(2500);
    const strip = await p.ev(hud('.strip')), panel = await p.ev(hud('.gamewin'));
    if (!stepped(panel) || strip !== '…') throw new Error(`strip='${strip}' panel='${panel}'`);

    const [panelTop, introTop] = await p.ev(`(() => { scrollTo({ top: 0, behavior: 'instant' }); return ['.gamewin', '#about'].map(q => document.querySelector(q).getBoundingClientRect().top); })()`);
    if (!(panelTop < introTop && panelTop < 120)) throw new Error(`panel is not at the top: panel ${panelTop}px, intro ${introTop}px`);
  },
  async 'reduced motion: still frame, a scroll does not start it, a tap does'(p) {
    await p.ev(`document.querySelector('.gamewin').scrollIntoView({ block: 'center', behavior: 'instant' })`);
    await sleep(1500);
    const a = await p.ev(`${PANEL}.toDataURL()`); await sleep(1200);
    if (a !== await p.ev(`${PANEL}.toDataURL()`)) throw new Error('the frame changed while still');
    const y0 = await p.ev('scrollY'), [x, y] = await p.ev(freeCell);
    await p.swipe(x, y); await sleep(1500);
    if (await p.ev('scrollY') === y0) throw new Error('the swipe did not scroll the page');
    let t = await p.ev(hud('.gamewin'));
    if (!t.includes('SMELLS') || stepped(t)) throw new Error(`scrolling started the cat: '${t}'`);
    await p.tap(...await p.ev(freeCell)); await sleep(2000);
    t = await p.ev(hud('.gamewin'));
    if (!stepped(t)) throw new Error(`a tap did not start the cat: '${t}'`);
  },
  async 'scrolling from the cat neither pets it nor gets blocked'(p) {
    await p.ev(`document.querySelector('.gamewin').scrollIntoView({ block: 'center', behavior: 'instant' })`);
    await sleep(800);
    // Freeze the cat in the middle of its cell and put the snack under it (as during a meal).
    const cat = `(() => { scrollTo({ top: 0, behavior: 'instant' }); const b = __brains.at(-1); b.tick = () => []; b.catPrev = b.cat; b.p = 1; b.snack = b.cat; b.petting = null; return __at(b, ${PANEL}, b.cat); })()`;
    const [x, y] = await p.ev(cat); await sleep(100);
    const y0 = await p.ev('scrollY');
    await p.swipe(x, y); await sleep(800);
    if (await p.ev('scrollY') === y0) throw new Error('a swipe starting on the cat did not scroll');
    if (await p.ev('__brains.at(-1).petting')) throw new Error('a swipe petted the cat');
    await p.tap(...await p.ev(cat)); await sleep(300);
    if (!await p.ev('__brains.at(-1).petting')) throw new Error('a tap on the cat did not pet it');
  },
};
const narrow = w => async p => {
  const bad = await p.ev(`(() => {
    const out = [];
    if (document.documentElement.scrollWidth > innerWidth) out.push('page scrolls sideways (' + document.documentElement.scrollWidth + 'px)');
    for (const el of document.querySelectorAll('.profile *')) {
      const r = el.getBoundingClientRect();
      if (el.scrollWidth > el.clientWidth + 1 || r.right > innerWidth - 16 + 0.5) out.push(el.tagName + '.' + el.className + ' right=' + Math.round(r.right));
    }
    return out.slice(0, 3).join('; ');
  })()`);
  if (bad) throw new Error(`overflow at ${w}px: ${bad}`);
};

(async () => {
  const srv = await serve(), url = `http://127.0.0.1:${srv.address().port}/`, c = chrome();
  const cases = [
    ['desktop runs the strip, not the panel', { width: 1440, height: 900 }],
    ['mobile runs the panel, not the strip', { width: 390, height: 844, mobile: true }],
    ['reduced motion: still frame, a scroll does not start it, a tap does', { width: 390, height: 844, mobile: true, reduced: true }],
    ['scrolling from the cat neither pets it nor gets blocked', { width: 390, height: 844, mobile: true }],
    ['no overflow on a 320px phone', { width: 320, height: 640, mobile: true }, narrow(320)],
    ['no overflow on a 360px phone', { width: 360, height: 740, mobile: true }, narrow(360)],
  ];
  let failed = 0;
  for (const [name, opts, fn = checks[name]] of cases) {
    const p = await open(c, url, opts);
    try { await fn(p); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
    await p.close();
  }
  if (errors.length) { failed++; console.log(`FAIL no JS errors: ${errors[0]}`); } else console.log('ok   no JS errors');
  await c.close(); srv.close();
  process.exit(failed ? 1 : 0);
})();
