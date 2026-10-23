# vatsal-kr.github.io

My personal site: one hand-written static page plus a small pixel-art street cat that learns
with Dyna-Q at the top. There's no build step. GitHub Pages serves these files as-is
(`.nojekyll` turns Jekyll off), so whatever is in the repo is what's live.

## Preview locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Edit content

Everything is in `index.html`:

- **Intro:** the `<section class="profile" id="about">` block.
- **Papers:** one `<article class="pub">` per paper inside `#papers`, newest first. Keep your
  name as `<b>V. Venkatkrishna</b>` so it gets highlighted.
- **News:** one `<li>` per item inside `#news`, newest first.
- **Links:** the `.links` row, plus the CV link in the top nav. `cv/` and `resume/` redirect to
  the CV too, so update those if the CV URL changes.

Also bump `<lastmod>` in `sitemap.xml` when you make a meaningful update.

## Replace the photo

Put a square photo at `images/moi.jpg` and `images/moi.webp`, about 336×336 (2× the size it's
shown at). Keep them small, around 20 KB at most.

## Tune the cat

- **Learning:** the constants at the top of `assets/cat-brain.js` set the discount, planning
  budget, step speed, ε schedule, idle time before the snack moves, and petting odds.
- **Breeds and snacks:** the names are in `CatBrain.BREEDS` / `CatBrain.SNACKS` in
  `assets/cat-brain.js`. The matching pixel sprites are in `BREED_LOOKS` / `SNACK_LOOKS` in
  `assets/cat.js`, in the same order. One character is one pixel and `.` is transparent.
- **Petting lines:** `PURRS` / `SNUBS` in `assets/cat.js`.
- **Grid cell size:** `CELL` in `assets/cat.js`.

The breed, snack and petting mood use their own random stream, so they never change what the
cat learns. The tests check this.

## Tests

```bash
node --test tests/cat-brain.test.js tests/site.test.js   # engine, content, weight budget
node tests/smoke.js                                      # real headless Chrome: desktop, mobile, reduced motion, touch, narrow phones
```

`tests/site.test.js` fails if the first load goes over 150 KB, or if the page starts pulling in
anything from another site.

## Notes

- Fonts (Bricolage Grotesque and Silkscreen) are self-hosted Latin subsets under the SIL OFL.
  See `assets/fonts/LICENSE.md`.
- `docs/superpowers/` holds the design doc, the approved mockup and the build plan. It's hidden
  from search engines via `robots.txt`.
