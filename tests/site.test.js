const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = p => fs.existsSync(path.join(ROOT, p));

const CV_URL = 'https://drive.google.com/file/d/1wh4XTguz9OhmQkWOiDSxTrFeLpNyCSTE/view?usp=drive_link';

test('static hosting markers', () => {
  assert.ok(exists('.nojekyll'), '.nojekyll missing');
  const robots = read('robots.txt');
  assert.match(robots, /Disallow: \/docs\//);
  assert.match(robots, /Disallow: \/tests\//);
  assert.ok(robots.includes('Sitemap: https://vatsal-kr.github.io/sitemap.xml'));
  assert.ok(read('sitemap.xml').includes('<loc>https://vatsal-kr.github.io/</loc>'));
});

test('old URLs redirect', () => {
  const stubs = { 'publications/index.html': '/#papers', 'cv/index.html': CV_URL, 'resume/index.html': CV_URL };
  for (const [file, target] of Object.entries(stubs)) {
    const html = read(file);
    assert.ok(html.includes('http-equiv="refresh"'), `${file}: no refresh`);
    assert.ok(html.includes(`url=${target}"`), `${file}: refresh does not target ${target}`);
    assert.ok(html.includes(`<a href="${target}"`), `${file}: no fallback link`);
  }
});

test('template is gone', () => {
  for (const p of ['_config.yml', '_sass', '_includes']) assert.ok(!exists(p), `${p} still exists`);
  assert.ok(exists('files/google383882cb68c31692.html'));
});

// ---- the page ----
const zlib = require('node:zlib');
const PAPERS = [
  'Parameter Exploration for RLVR via Variational Learning',
  'Aletheia: What Makes RLVR For Code Verifiers Tick?',
  'Beyond Borders: Investigating Cross-Jurisdiction Transfer in Legal Case Summarization',
  'Multi-step Automated Generation of Parameter Docstrings in Python: An Exploratory Study',
];
const LINKS = [
  'mailto:vatsal.venkatkrishna@insait.ai',
  'https://scholar.google.com/citations?user=vSL2ypoAAAAJ',
  'https://github.com/vatsal-kr',
  'https://twitter.com/vatsal_krr',
  'https://www.linkedin.com/in/vatsal-venkatkrishna',
];

test('page has the core content', () => {
  const html = read('index.html');
  for (const s of ['Vatsal Venkatkrishna', 'PhD student · INSAIT &amp; UKP Lab · Sofia', ...PAPERS, ...LINKS,
    'The cat learns with Dyna-Q. Be nice to it.', 'exhibit A:', 'click: bush · drag: snack · pet: at own risk',
    'Nov 2024', 'Mar 2024', 'Jan 2024', 'May 2023', 'May 2022']) {
    assert.ok(html.includes(s), `missing: ${s}`);
  }
  assert.equal(html.split('Aug 2026').length - 1, 2, 'expected two Aug 2026 news items');
  assert.equal(html.split('<b>V. Venkatkrishna</b>').length - 1, 4, 'expected four author lines with Vatsal in bold');
  assert.doesNotMatch(html, /placeholder|TODO/i);
});

test('papers are in spec order', () => {
  const html = read('index.html');
  const pos = PAPERS.map(t => html.indexOf(t));
  assert.ok(pos.every((p, i) => p > 0 && (i === 0 || p > pos[i - 1])), `positions ${pos}`);
});

test('no third-party runtime requests', () => {
  for (const f of ['index.html', 'assets/site.css']) {
    const src = read(f);
    assert.doesNotMatch(src, /preconnect|<script[^>]*src="http|<link[^>]*rel="stylesheet"[^>]*href="http|url\(\s*['"]?http/i, f);
  }
  const faces = read('assets/site.css').match(/@font-face\s*{[^}]*}/g) || [];
  assert.ok(faces.length >= 2, 'expected self-hosted @font-face rules');
  for (const f of faces) assert.match(f, /src:\s*url\(['"]?\/assets\/fonts\//);
});

test('head metadata', () => {
  const html = read('index.html');
  assert.match(html, /<title>[^<]+<\/title>/);
  for (const s of ['name="description"', 'property="og:title"', 'content="https://vatsal-kr.github.io/images/moi.jpg"',
    'rel="canonical"', 'application/ld+json', '"@type": "Person"']) assert.ok(html.includes(s), `missing: ${s}`);
});

// Files a first visit actually downloads: linked/scripted/imaged assets plus CSS fonts.
function firstLoadFiles() {
  const html = read('index.html');
  const files = new Set(['index.html']);
  for (const tag of html.match(/<(link|script|img|source)\b[^>]*>/g) || []) {
    if (/rel="canonical"/.test(tag)) continue; // count both icons: browsers fetch one or the other
    for (const m of tag.matchAll(/\b(?:href|src|srcset)="(\/[^"#?]+)"/g)) files.add(m[1].slice(1));
  }
  for (const m of read('assets/site.css').matchAll(/url\(['"]?(\/[^'")]+)/g)) files.add(m[1].slice(1));
  if ([...files].some(f => f.endsWith('.webp'))) for (const f of files) if (f.endsWith('.jpg')) files.delete(f);
  return [...files];
}

test('weight budget', () => {
  let total = 0;
  for (const f of firstLoadFiles()) {
    if (!exists(f)) { assert.ok(/cat(-brain)?\.js$/.test(f), `missing asset ${f}`); continue; }
    const buf = fs.readFileSync(path.join(ROOT, f));
    total += /\.(html|css|js|svg)$/.test(f) ? zlib.gzipSync(buf).length : buf.length;
  }
  console.log(`first-load weight: ${(total / 1024).toFixed(1)} KB`);
  assert.ok(total <= 150 * 1024, `first load ${total} bytes`);
  const js = ['assets/cat-brain.js', 'assets/cat.js'].filter(exists).reduce((a, f) => a + fs.statSync(path.join(ROOT, f)).size, 0);
  assert.ok(js < 30 * 1024, `cat scripts ${js} bytes`);
});

test('404 page exists', () => {
  const html = read('404.html');
  assert.ok(html.includes('this cat wandered off'));
  assert.ok(html.includes('href="/"'));
  assert.doesNotMatch(html, /<(script|link|img)[^>]*(src|href)="https?:/i);
  assert.doesNotMatch(html, /cat\.js/);
});

test('favicon is the pixel cat, not the template owl', () => {
  for (const f of ['index.html', '404.html']) {
    const html = read(f), ico = html.indexOf('href="/favicon.ico"'), svg = html.indexOf('href="/favicon.svg"');
    assert.ok(ico > 0 && svg > ico, `${f}: .ico link must come first so browsers that can use the SVG pick it`);
    assert.match(html, /<link rel="icon" href="\/favicon\.ico" sizes="48x48">/);
  }
  assert.ok(fs.statSync(path.join(ROOT, 'favicon.ico')).size < 4096, 'favicon.ico is still the 15 KB template owl');
  assert.ok(!exists('images/favicon.ico'));
});

test('phone panel sits above the intro', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('class="gamewin"') < html.indexOf('id="about"'), 'the phone panel must come before the profile');
});

test('CV, Bluesky and ORCID are not linked from the page', () => {
  const html = read('index.html');
  for (const s of [CV_URL, 'bsky.app', 'orcid.org', '>CV<', '>Bluesky<', '>ORCID<']) assert.ok(!html.includes(s), `still there: ${s}`);
});
