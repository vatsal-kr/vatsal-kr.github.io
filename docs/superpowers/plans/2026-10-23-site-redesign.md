# Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the AcademicPages template with a single lightweight static page in the "Sofia pixel" style, with a live Dyna-Q street-cat gridworld.

**Architecture:**
- Plain static files served by GitHub Pages, with `.nojekyll` and no build step.
- The cat is split in two:
  - `assets/cat-brain.js` is a DOM-free RL engine, unit-tested in Node.
  - `assets/cat.js` holds the sprites, rendering, input and loop. It wires the brain to two canvases: the desktop strip and the mobile panel.
- The content is hand-written HTML in `index.html`.

**Tech Stack:**
- HTML, CSS and vanilla JS (ES2020, no modules, `defer` scripts)
- Node 18 `node:test` for the unit and content tests
- headless `google-chrome` plus `python3 -m http.server` for smoke tests
- Python + PIL for the one-off image encode

**Spec:** `docs/superpowers/specs/2026-10-23-site-redesign-design.md`. The visual reference is `docs/superpowers/specs/2026-10-23-site-redesign-mockup.html`, and its inline engine is the reference implementation for the cat.

## Global Constraints

- **Hosting:** static files plus `.nojekyll`, served by GitHub Pages from `master` at the repo root. All work is on branch `redesign`. **Never push.**
- **Dependencies:** no frameworks and no runtime requests to third parties. Fonts are self-hosted, and no `preconnect` or external `<script>`/`<link rel=stylesheet>`/`url(http…)` is allowed.
- **Weight:** first load ≤ 150 KB transferred (gzip for text, raw for woff2/webp). `cat-brain.js` + `cat.js` together < 30 KB unminified.
- **Colours:** `--bg #FBF7EC`, `--ink #23302A`, `--sun #F2C14E`, `--accent #2E7A5E`, `--rose #E0715A`.
- **Fonts:** Bricolage Grotesque (variable, opsz + wght, Latin subset) and Silkscreen 400 (Latin subset).
- **Mobile breakpoint:** `max-width: 860px`. Desktop shows the strip; mobile hides it and shows the framed panel (no title bar) after the intro and links.
- **Copy:** use the spec's intro, links, papers (order, authors, summaries, links) and news verbatim. Nothing may contain "placeholder" or "TODO".
- **RL constants:**

  | Constant | Value |
  |---|---|
  | γ | 0.94 |
  | planning backups per real step | 60 |
  | planning backups per tick during the meal pause | 500 |
  | meal pause | 1100 ms |
  | ε | 0.2, multiplied by 0.7 per episode, floor 0.03 |
  | step interval | 42 ms exploring, 100 ms learning |
  | respawn distance | ≥ 5 |
  | first start distance | 5–9 |
  | new run trigger | 3 consecutive episodes with steps ≤ optimal + 2, and 8000 ms with no interaction |
  | new snack distance | ≥ 6 |
  | petting | 1800 ms, purr probability 0.65 |
  | bushes | ≈ 15% of cells, segments of length 2–4 |
  | cell size | 40 CSS px |

## Review Focus

1. **Crossing 860 px while running** (resize or rotation): the newly visible canvas must start a fresh, valid world for its own size. Tiny grids (6×4) must still learn. Pinned in Task 2 (`tiny grids learn`).
2. **A visitor who keeps toggling bushes mid-run**: the grid must stay connected and the cat must still be able to reach the snack. Pinned in Task 2 (`random bush toggling keeps world solvable`).
3. **Dropping the snack on a bush, on the cat, or outside the grid**: it must be ignored with the old state intact. Pinned in Task 2 (`moveSnack rejects invalid cells`) and Task 4 (drop outside the canvas is a no-op).
4. **Phone scrolling over the game**: the page must scroll normally, a tap toggles a bush, and only a drag that starts on the snack is captured. Pinned in Task 4 (manual check step plus the CSS `touch-action` assertion).
5. **`prefers-reduced-motion`**: a still frame with no stepping until the first click. Pinned in Task 4 (smoke test with `--force-prefers-reduced-motion`).

---

### Task 1: Clean slate and static scaffolding

**Files:**
- Delete (`git rm -r`):
  - directories: `_sass _includes _layouts _pages _data _publications _drafts markdown_generator talkmap assets .github`
  - files: `talkmap.py talkmap.ipynb Dockerfile Gemfile package.json CONTRIBUTING.md _config.yml LICENSE images/manifest.json`
- Keep: `images/moi.jpg`, `images/favicon.ico`, `files/google383882cb68c31692.html`, `docs/`
- Create:
  - `.nojekyll` (empty)
  - `robots.txt`
  - `sitemap.xml`
  - `publications/index.html`
  - `cv/index.html`
  - `resume/index.html`
  - `tests/site.test.js`
- Modify: `.gitignore` → replace with `node_modules/` and `.DS_Store`.

**Interfaces:**
- Produces `tests/site.test.js`, which uses `node:test` + `node:assert/strict` and has a helper `read(path) -> string` relative to the repo root. Tasks 3 and 5 append tests to this file.

- [ ] **Step 1: Write the failing tests** in `tests/site.test.js`:
  - `test('static hosting markers')`: `.nojekyll` exists. `robots.txt` contains `Disallow: /docs/`, `Disallow: /tests/` and `Sitemap: https://vatsal-kr.github.io/sitemap.xml`. `sitemap.xml` contains `<loc>https://vatsal-kr.github.io/</loc>`.
  - `test('old URLs redirect')`, with the target given as a table:

    | File | Must contain | Target |
    |---|---|---|
    | `publications/index.html` | `http-equiv="refresh"` | `/#papers` |
    | `cv/index.html` | `http-equiv="refresh"` | `https://drive.google.com/file/d/1wh4XTguz9OhmQkWOiDSxTrFeLpNyCSTE/view?usp=drive_link` |
    | `resume/index.html` | `http-equiv="refresh"` | the same Drive URL |

    Each file also contains a plain `<a href>` fallback to the same target.
  - `test('template is gone')`: `_config.yml`, `_sass` and `_includes` do not exist, and `files/google383882cb68c31692.html` still exists.
- [ ] **Step 2: Run** `node --test tests/site.test.js`. Expected: FAIL (the files are missing and the template is present).
- [ ] **Step 3: Implement.** Do the deletions and create the files. Each redirect stub is a ~10-line HTML doc with `<meta http-equiv="refresh" content="0; url=TARGET">`, `<link rel="canonical" href="https://vatsal-kr.github.io/">` and a fallback link. `sitemap.xml` has one `<url>` with `<lastmod>2026-10-23</lastmod>`.
- [ ] **Step 4: Run** `node --test tests/site.test.js`. Expected: PASS.
- [ ] **Step 5: Commit:** `git add -A && git commit -m "Remove AcademicPages template; add static hosting scaffolding and redirects"`.

---

### Task 2: CatBrain, the DOM-free RL engine

**Files:**
- Create: `assets/cat-brain.js`
- Test: `tests/cat-brain.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: the global `CatBrain` in browsers (`globalThis.CatBrain`); in Node, `module.exports = { CatBrain, mulberry32 }`.
  - `mulberry32(seed: number) -> () => number` in [0, 1)
  - `CatBrain.BREEDS: string[]` = `['ginger tabby', 'black cat', 'tuxedo cat', 'grey tabby', 'siamese', 'calico']`
  - `CatBrain.SNACKS: string[]` = `['fish', 'shrimp', 'drumstick', 'milk', 'tuna', 'kebapche']`
  - `new CatBrain({ cols, rows, seed, lookSeed })`. `seed` drives everything learning-related: walls, starts, ε draws, tie-breaks and planning samples. `lookSeed` (default `seed ^ 0x9e3779b9`) drives *only* the breed/snack choice and the petting outcome.
  - Read-only state for the view:
    - grid: `cols, rows, N, walls: Uint8Array, snack, cat, catPrev, dist: Int32Array`
    - tables: `Qd: Float32Array(N*4)` (display table)
    - progress: `phase: 'explore'|'learn', episode, steps, optimal, history: number[]` (last 24 episode lengths)
    - display: `msg: string`, `breed: number`, `snackKind: number`, `p: number` (0..1 hop progress), `facing: 1|-1`, `bumpA: -1|0..3`, `pause: number` (ms), `petting: null | { life: number /*s*/, ok: boolean }`
  - `tick(dt: number /*ms*/) -> string[]`: advances time, handles petting, the pause and stepping, and returns events from `'step' | 'ate' | 'run'` ('run' means a new learning run has started).
  - `act() -> void`: one real environment step plus Dyna-Q planning. Exposed for tests.
  - `toggleWall(s: number) -> boolean`: false if refused (snack, cat, catPrev, or it would disconnect the grid).
  - `moveSnack(s: number) -> boolean`: false if `s` is out of range, a wall, the cat or the snack. On success it resets learning and keeps `breed`/`snackKind`.
  - `pet() -> boolean`: false if already petting. Otherwise sets `petting = { life: 1.8, ok: lookRng() < 0.65 }`.
  - `touch() -> void`: records the time of the visitor's last interaction (in brain time) for the 8000 ms idle rule.
  - `center`-free: the brain knows nothing about pixels. Directions are `DIRS = [[0,-1],[1,0],[0,1],[-1,0]]`, and the state index is `s = y*cols + x`.
  - Messages, ported from the mockup with the snack name substituted:
    - while exploring: `` `${breed} exploring… ${steps} steps` ``
    - first meal: `` `found the ${snack} in ${steps} steps! value spreading back…` ``
    - later meals: `` `episode ${episode}: ${steps} steps (shortest is ${optimal})` ``
    - after a drag: `` `new ${snack} spot. exploring…` ``
    - new run: `` `a ${breed} smells ${snack}…` ``
- The algorithm is the mockup engine's (`GridCat` in the mockup file), minus everything to do with pixels, particles or the DOM. Keep the optimistic (`Qo`, init 1) / display (`Qd`, init 0) twin tables, `backup` with α = 1, and the act-on-`Qo`-where-`Qd`-is-all-zero fallback.

- [ ] **Step 1: Write the failing tests** in `tests/cat-brain.test.js`. They run ticks with `dt = 16` and use fixed seeds.
  - `world is connected and sized`: for `{cols:14, rows:8, seed:1}`, BFS from `snack` reaches every free cell; the wall count is ≥ 1 and ≤ ⌈0.15·N⌉+3; `snack % cols >= cols - 1 - Math.floor(cols/3)`; and `dist[cat]` is between 5 and 9.
  - `explores then learns`: tick until the first `'ate'` event (cap at 200k ticks). Then `phase === 'learn'` and `episode === 1`.
  - `converges and starts a new run`: tick until a `'run'` event (cap at 2M ticks). The run must happen, and right before it the last 3 `history` entries are each ≤ `optimal + 2` of their episode. Simplest check: record `steps <= optimal + 2` at each `'ate'`.
  - `new run changes the look`: across 5 consecutive `'run'` events, each `(breed, snackKind)` differs from the previous one in both fields.
  - `tiny grids learn`: `{cols:6, rows:4}` with seeds 1–10 each reach a `'run'` within the cap.
  - `toggleWall refuses snack, cat and disconnecting cells`: `toggleWall(snack) === false`; `toggleWall(cat) === false`. On a hand-built 6×4 world where one cell is the only bridge, toggling it returns false and leaves `walls` unchanged.
  - `random bush toggling keeps world solvable`: for 300 iterations, call `toggleWall(random cell)` and then 20 ticks. After each iteration the grid is connected and `dist[cat] > 0 || cat === snack`.
  - `moveSnack rejects invalid cells`: `moveSnack(-1)`, `moveSnack(N)`, `moveSnack(wallCell)`, `moveSnack(cat)` and `moveSnack(snack)` are all false, and the snack is unchanged. A valid move returns true, sets `phase === 'explore'` and `episode === 0`, and keeps `breed` and `snackKind`.
  - `cosmetics never affect learning`: two brains with the same `seed` and different `lookSeed`, each ticked to 3000 real steps (count `'step'` events), have deep-equal `Qd` and the same `cat`.
  - `petting freezes and never changes learning`: brain A ticks to 500 real steps. Brain B (same seeds) calls `pet()` at step 100 (and again whenever `petting` is null, 20 times in total) while ticking to 500 real steps. `Qd` and `cat` are equal. While `petting` is non-null, `tick` returns no `'step'`.
  - `petting odds`: 2000 brains with `lookSeed = i`, each calling `pet()` once, give an `ok` rate in [0.6, 0.7].
- [ ] **Step 2: Run** `node --test tests/cat-brain.test.js`. Expected: FAIL ("Cannot find module").
- [ ] **Step 3: Implement `assets/cat-brain.js`.** Wrap it in an IIFE that ends with `if (typeof module !== 'undefined') module.exports = { CatBrain, mulberry32 }; else globalThis.CatBrain = CatBrain;`. Inside `tick`, the meal pause runs `plan(500)` each call. Petting decrements `life` by `dt/1000`, and while petting `p` may still ease to < 1 but no `act()` runs.
- [ ] **Step 4: Run** `node --test tests/cat-brain.test.js`. Expected: PASS, all 11 tests.
- [ ] **Step 5: Commit:** `git add assets/cat-brain.js tests/cat-brain.test.js && git commit -m "Add DOM-free Dyna-Q cat engine with tests"`.

---

### Task 3: The page — content, styles, fonts, photo, meta

**Files:**
- Create:
  - `index.html`
  - `assets/site.css`
  - `assets/fonts/bricolage-latin.woff2`
  - `assets/fonts/silkscreen-latin.woff2`
  - `assets/fonts/LICENSE.md`
  - `images/moi.webp`
  - `favicon.svg`
- Modify: `images/moi.jpg` (re-encoded)
- Test: `tests/site.test.js` (append)

**Interfaces:**
- Consumes: nothing from Task 2 yet.
- Produces the markup contract that Task 4 relies on:
  - Desktop: `<div class="strip" data-cat>` containing `<canvas class="cat-canvas" role="img" aria-label="…">`, `<span data-cat-hud>…</span>` and `<svg data-cat-spark viewBox="0 0 70 16">`.
  - Mobile: `<div class="gamewin" data-cat>` with the same three children. It has no title bar.
  - `<script defer src="/assets/cat-brain.js">` then `<script defer src="/assets/cat.js">` at the end of `<head>`.
  - Section ids: `#about`, `#papers`, `#news`.

- [ ] **Step 1: Write the failing tests** (append to `tests/site.test.js`):
  - `page has the core content`. `index.html` contains:
    - `Vatsal Venkatkrishna` and `PhD student · INSAIT &amp; UKP Lab · Sofia`;
    - all 4 paper titles;
    - each author line with `<b>V. Venkatkrishna</b>`;
    - the 8 link URLs from the spec's Links table;
    - all 7 news items' month labels (`Aug 2026` ×2, `Nov 2024`, `Mar 2024`, `Jan 2024`, `May 2023`, `May 2022`);
    - `The cat learns with Dyna-Q. Be nice to it.`;
    - `exhibit A:`;
    - `click: bush · drag: snack · pet: at own risk`.

    It does **not** contain `placeholder` or `TODO` (case-insensitive).
  - `papers are in spec order`: `index.html.indexOf` of the 3PO title < Aletheia < Beyond Borders < Docstrings.
  - `no third-party runtime requests`: `index.html` and `assets/site.css` have no `preconnect`, no `<script src="http`, no `<link rel="stylesheet" href="http` and no `url(http`. Every `@font-face` `src` in the CSS starts with `/assets/fonts/`.
  - `head metadata`: there is a `<title>`, a `meta name="description"`, `og:title`, `og:image` = `https://vatsal-kr.github.io/images/moi.jpg`, `rel="canonical"`, and `application/ld+json` containing `"@type": "Person"`.
  - `weight budget`:
    - Collect the local files referenced by `index.html` (`href`/`src` starting with `/`, plus `srcset`) and the font files referenced by `site.css`. If the files from Task 4 don't exist yet, skip them.
    - Sum `zlib.gzipSync(buf).length` for `.html/.css/.js/.svg` and the raw size for `.woff2/.webp/.jpg`, counting only the `<picture>`'s webp source and not the jpg fallback.
    - Assert the total is ≤ 150 * 1024. Also assert `cat-brain.js` + `cat.js` raw < 30 * 1024 when they exist.
- [ ] **Step 2: Run** `node --test tests/site.test.js`. Expected: the new tests FAIL (no `index.html`).
- [ ] **Step 3: Fonts.**
  - Fetch the CSS from `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Silkscreen&display=swap`, using a desktop Chrome `User-Agent` so it returns woff2.
  - Download only the `/* latin */` block's file for each family into `assets/fonts/`.
  - Write `assets/fonts/LICENSE.md` naming both families as SIL OFL 1.1, linking the OFL text, with the copyright lines from `https://raw.githubusercontent.com/google/fonts/main/ofl/bricolagegrotesque/OFL.txt` and `…/ofl/silkscreen/OFL.txt`.
  - In `site.css`, set `font-display: swap` and copy the latin `unicode-range`. In `index.html`, add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the Bricolage file only.
- [ ] **Step 4: Photo.**
  - With PIL: centre-square-crop `images/moi.jpg` (1175×1086 → 1086×1086), resize to 336×336 (LANCZOS), and save as `images/moi.webp` (quality 80) and `images/moi.jpg` (quality 82, progressive).
  - Use it as `<picture><source srcset="/images/moi.webp" type="image/webp"><img src="/images/moi.jpg" width="168" height="168" alt="Vatsal Venkatkrishna"></picture>`.
- [ ] **Step 5: Write `index.html` and `assets/site.css`.**
  - Port the markup and CSS from the mockup (the `#strip` desktop / `.gamewin` mobile version): topbar, strip, profile grid, gamewin, papers, news and footer.
  - Remove the dark helper bar at the top and the mockup's `/files/` paths.
  - Paper cards hold: venue badge (`TMLR 2026` / `arXiv 2026` / `NAACL 2024` / `ICSE 2024` with the `old` class on the 2024 ones), title, a `<p class="authors">` line, the summary, and the link row. The link labels are the spec's (arXiv / OpenReview / ACL Anthology / ACM), opening in the same tab.
  - Under the cards: `<a href="https://scholar.google.com/…">All papers on Google Scholar →</a>`.
  - Nav: About→`#about`, Papers→`#papers`, News→`#news`, CV→the Drive URL. The ORCID button joins the link row.
  - The desktop/mobile "exhibit A" text uses the mockup's `.desk-i` / `.mob-i` spans.
  - The canvases use CSS `touch-action: pan-y pinch-zoom` (not `none`).
- [ ] **Step 6: `favicon.svg`.** A 14×9 ginger tabby built from `<rect>`s with `shape-rendering="crispEdges"` (use the `CAT_ROWS` grid and ginger palette from the mockup), under 2 KB. Link it with `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` and `<link rel="alternate icon" href="/images/favicon.ico">`.
- [ ] **Step 7: Run** `node --test tests/site.test.js`. Expected: PASS.
- [ ] **Step 8: Visual check.** Run `python3 -m http.server 8765` in the repo root. Take headless screenshots at 1440×1000 and 390×1400: `google-chrome --headless=new --no-sandbox --hide-scrollbars --window-size=W,H --screenshot=/tmp/…png http://127.0.0.1:8765/`. They should match the mockup's layout (the canvases will be blank until Task 4).
- [ ] **Step 9: Commit:** `git add -A && git commit -m "Add single-page site: content, styles, self-hosted fonts, photo, meta"`.

---

### Task 4: Cat view — sprites, rendering, input, loop

**Files:**
- Create: `assets/cat.js`
- Create: `tests/smoke.sh`

**Interfaces:**
- Consumes:
  - `CatBrain` (Task 2): `tick`, `toggleWall`, `moveSnack`, `pet`, `touch`, `Qd`, `walls`, `snack`, `cat`, `catPrev`, `p`, `facing`, `bumpA`, `pause`, `petting`, `phase`, `msg`, `history`, `breed`, `snackKind`, `CatBrain.BREEDS`, `CatBrain.SNACKS`.
  - The markup contract from Task 3.
- Produces: no globals except whatever IIFE scaffolding is needed.

The view is the mockup engine's rendering and input half, using only style "C":
- **Sprites:** `CAT_ROWS`, `CALICO_ROWS`, `CAT_LEGS`, the breed palettes (index-aligned with `CatBrain.BREEDS`), the snack sprites (index-aligned with `CatBrain.SNACKS`), `HAND_PX`, and `PURRS`/`SNUBS`.
- **Visual-only state:** cobble tile, bush, quantised heat, pixel chevron arrows, paw trail, `+1`/heart particles, the speech bubble, the eased hop and bump, the spawn fade-in, the red refusal flash and `Vshow` smoothing.

Behaviour that differs from the mockup:
- **One `CatView` per `[data-cat]` element.** On resize it builds a new `CatBrain` with `cols = max(6, floor(width/40))` and `rows = max(4, floor(height/40))`, with cells as `floor(min(w/cols, h/rows))` px and the grid centred.
- **Global `requestAnimationFrame` loop.** It ticks a view only if its canvas `offsetParent !== null`, it is intersecting (`IntersectionObserver`), and `document.visibilityState === 'visible'`. Otherwise it resets that view's `lastNow` so there's no dt spike on resume.
- **Input:**
  - `pointerdown` records the start cell and position, and calls `brain.touch()`.
    - On the snack it starts a drag: `setPointerCapture` for mouse; for touch, a `touchstart` listener `{passive:false}` calls `preventDefault()` only when the touch begins on the snack's cell.
    - On the cat's drawn position (within 0.55 × cell) it calls `brain.pet()`.
  - `pointerup` with movement < 8 px and no drag calls `brain.toggleWall(cell)`, flashing red on `false`. Ending a drag calls `brain.moveSnack(cell)`.
  - `pointercancel` (the browser took over for scrolling) aborts everything.
  - A drop outside the grid is a no-op.
- **Reduced motion:** if `matchMedia('(prefers-reduced-motion: reduce)').matches`, draw the scene each frame but don't call `tick` until the first `pointerdown` on that canvas.
- **HUD:** `[data-cat-hud]` text = `brain.msg.toUpperCase()`, updated only when it changes. `[data-cat-spark]` gets a polyline of `brain.history` (stroke `#F2C14E`) when an `'ate'` event fires.

- [ ] **Step 1: Write the failing smoke test `tests/smoke.sh`.**
  - It starts `python3 -m http.server 8765 --bind 127.0.0.1` from the repo root in the background and traps it to kill on exit. It runs `google-chrome --headless=new --no-sandbox --virtual-time-budget=6000 --dump-dom` for each case and greps the DOM.
  - **(a) desktop**, `--window-size=1440,900`: the `.strip [data-cat-hud]` text is not `…` and matches `EXPLORING|FOUND|EPISODE|SMELLS`; the `.gamewin [data-cat-hud]` is still `…`.
  - **(b) mobile**, `--window-size=390,1400`: the reverse.
  - **(c) reduced motion**, `--force-prefers-reduced-motion --window-size=1440,900`: the `.strip [data-cat-hud]` text contains `SMELLS` (the initial message) and not `STEPS`.
  - **(d) no JS errors:** run with `--enable-logging=stderr --v=0` and assert stderr has no `Uncaught`.
  - It exits non-zero on any failure and prints which case failed.
- [ ] **Step 2: Run** `bash tests/smoke.sh`. Expected: FAIL in case (a), because the HUD stays `…` without `cat.js`.
- [ ] **Step 3: Implement `assets/cat.js`** as described above.
- [ ] **Step 4: Run** `bash tests/smoke.sh && node --test tests/cat-brain.test.js tests/site.test.js`. Expected: all PASS, including the weight-budget test, which now counts both scripts.
- [ ] **Step 5: Visual and interaction check.**
  - Take headless screenshots at desktop and mobile size after `--virtual-time-budget=9000`. You should see the heatmap and arrows, a breed sprite and a snack sprite.
  - Then add a temporary test page under `/tmp` (not in the repo) that loads `cat-brain.js` + `cat.js`, calls `pet()` with `ok` forced to true, and steps frames manually. Check that the hand, the hearts and the "prrr…" bubble render.
  - Record in the commit message that the phone scrolling / tap / snack-drag behaviour (Review Focus 4) still needs Vatsal's manual check on a real phone.
- [ ] **Step 6: Commit:** `git add assets/cat.js tests/smoke.sh && git commit -m "Add pixel cat view: sprites, rendering, input, visibility-aware loop"`.

---

### Task 5: 404, README, final verification

**Files:**
- Create: `404.html`, `README.md` (replace)
- Test: `tests/site.test.js` (append)

- [ ] **Step 1: Write the failing test** `404 page exists`: `404.html` contains `this cat wandered off` and `href="/"`, and references no external resources.
- [ ] **Step 2: Run** `node --test tests/site.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `404.html`: reuses `/assets/site.css` and shows a single static pixel cat as an inline SVG (the same rects as `favicon.svg`, scaled), plus "this cat wandered off" and a home link. No `cat.js`.
  - `README.md` covers:
    - how to preview: `python3 -m http.server`;
    - how to run the tests: `node --test tests/cat-brain.test.js tests/site.test.js` and `bash tests/smoke.sh`;
    - where to edit the intro, papers and news (`index.html`);
    - how to tune the cat (constants at the top of `assets/cat-brain.js`; breeds/snacks in `CatBrain.BREEDS/SNACKS` plus the matching sprites in `assets/cat.js`);
    - how to replace the photo;
    - a note that `docs/` holds the design and plan.
- [ ] **Step 4: Run** the full suite: `node --test tests/cat-brain.test.js tests/site.test.js && bash tests/smoke.sh`. Expected: all PASS. Print the weight-budget total.
- [ ] **Step 5: Commit:** `git add -A && git commit -m "Add 404 page and README"`.
