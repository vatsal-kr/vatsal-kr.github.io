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
