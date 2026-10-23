# vatsal-kr.github.io redesign: design

Date: 2026-10-23 · Owner: Vatsal Venkatkrishna · Branch: `redesign`

## Intent

Replace the stock AcademicPages (Jekyll) template with a single, hand-built page that:

1. makes Vatsal's core information and achievements scannable at a glance for **recruiters and fellow researchers**;
2. feels **warm and friendly**, not like a template;
3. has a small, genuinely-RL animation at the top: a pixel-art Sofia street cat that learns, with Dyna-Q, to reach a snack;
4. is **as lightweight as possible** so it loads fast for everyone.

Vatsal will fine-tune things by hand later, so the result should be easy to read and edit.

## Goals, non-goals, anti-goals

**Goals:** name, role, affiliation, research focus, education, papers (with authors and venues), news, and contact/CV links are all visible as plain HTML. The cat is real tabular RL. The page works well on phones. It is cheap to load.

**Non-goals:** a blog, talks, teaching or portfolio pages; dark mode; analytics; a CMS or a build pipeline; BibTeX export.

**Anti-goals (a failure even if it technically works):**
- the animation crowds out or delays the content;
- the page still looks like a generic academic template;
- heavy dependencies or third-party requests at runtime;
- placeholder text going live.

## Constraints

- Hosting is GitHub Pages from `master` at the repo root (legacy build), with no custom domain.
- No Ruby or Jekyll is installed locally. The site will therefore be **plain static files with a `.nojekyll`** marker, which means no build step and what is in the repo is what gets served.
- No frameworks and no runtime requests to third parties (fonts are self-hosted).
- **Weight budget:** first load ≤ 150 KB transferred (HTML, CSS, JS, fonts and photo, excluding the CV). `cat.js` stays under 30 KB unminified, with no minifier.
- All work happens on branch `redesign`. Nothing is pushed until Vatsal approves, because a push to `master` puts it live.

## Decided by Vatsal

- **Style: "Sofia pixel".** The approved look is `2026-10-23-site-redesign-mockup.html` in this folder, and the build should match it.
  - **Colours:** cream background `#FBF7EC`, ink `#23302A`, sunny yellow `#F2C14E`, green accent `#2E7A5E`, rose `#E0715A`.
  - **Type:** Bricolage Grotesque for text and Silkscreen (pixel font) for small labels.
  - **Shapes:** chunky 2–3 px ink borders with hard offset shadows.
  - **Ground:** the cat's ground is Sofia's yellow cobblestones, with green bushes as walls.
- **Where the cat goes:**
  - **Desktop:** a slim full-width strip (about 168 px tall) directly under the top bar.
  - **Mobile (≤ 860 px):** the same game in a framed panel with *no* title bar, placed after the intro and links.
- **Removed:** the four "at a glance" boxes and the "off the clock" card. The hobbies are folded into the intro as a second paragraph.
- **Breeds and foods:** sampled at random, purely cosmetic, and never touching the algorithm. Petting animation included.

## Page structure (top to bottom)

1. **Top bar:**
   - **Logo:** `vatsal-kr` in Silkscreen.
   - **Nav:** About, Papers, News and CV. About, Papers and News are in-page anchors; CV is the external CV link.
2. **Cat strip** (desktop only), with a status readout bottom-left and the hint "click: bush · drag: snack · pet: at own risk" bottom-right.
3. **Profile:**
   - photo in a pixel frame with a yellow offset shadow;
   - kicker: "PhD student · INSAIT & UKP Lab · Sofia";
   - `h1` "Vatsal Venkatkrishna";
   - the two intro paragraphs (below);
   - link buttons: Email (primary, yellow), Scholar, GitHub, CV, X, Bluesky, LinkedIn and ORCID.
4. **Cat panel** (mobile only).
5. **Papers:** all four, newest first, as cards in two columns on desktop and one on mobile. Each card has a venue badge, the title, the authors with Vatsal's name in bold, a one-line summary and links.
6. **News:** a dated list with all current items.
7. **Footer:** © 2026 Vatsal Venkatkrishna, plus one small line: "The cat learns with Dyna-Q. Be nice to it."

### Intro copy

> Hi! I'm a second-year PhD student at **INSAIT** and **UKP Lab**, advised by Prof. Iryna Gurevych. I work on **LLM post-training**: using reinforcement learning to align and improve language models, lately with **verifiable rewards (RLVR)**. Before that, I did an integrated B.Tech + M.Tech at **IIT Kharagpur**, with research internships at ANU and UBC along the way.
>
> Outside of work I'm usually at the gym, on the tennis court, or at a board-game café. I also have a major soft spot for Sofia's street cats, though the feeling is rarely mutual (exhibit A: the banner above / just below).

The parenthetical reads "the banner above" on desktop and "just below" on mobile.

### Links

| Link | URL |
|---|---|
| Email | mailto:vatsal.venkatkrishna@insait.ai |
| Scholar | https://scholar.google.com/citations?user=vSL2ypoAAAAJ |
| GitHub | https://github.com/vatsal-kr |
| CV | https://drive.google.com/file/d/1wh4XTguz9OhmQkWOiDSxTrFeLpNyCSTE/view?usp=drive_link (the current Drive link) |
| X | https://twitter.com/vatsal_krr |
| Bluesky | https://bsky.app/profile/vatsal-kr.bsky.social |
| LinkedIn | https://www.linkedin.com/in/vatsal-venkatkrishna |
| ORCID | https://orcid.org/0009-0002-6041-3096 |

### Papers

Authors come from Vatsal's CV and the arXiv pages. The summaries are drafts written from the abstracts, and Vatsal will fine-tune them.

1. **Parameter Exploration for RLVR via Variational Learning**
   - **Authors:** V. Venkatkrishna, N. Daheim, I. Gurevych
   - **Venue:** arXiv 2026, preprint
   - **Summary:** "Explore in parameter space, not just token space: sampling policies from a posterior (3PO) beats GRPO on math and code at near-identical FLOPs."
   - **Links:** arXiv https://arxiv.org/abs/2608.09805
2. **Aletheia: What Makes RLVR For Code Verifiers Tick?**
   - **Authors:** V. Venkatkrishna, I. Paul, I. Gurevych
   - **Venue:** TMLR 2026
   - **Summary:** "A controlled, execution-grounded testbed for training code verifiers with RLVR. The best recipe depends on scale, and cheaper recipes can match the full pipeline."
   - **Links:** OpenReview https://openreview.net/forum?id=3rVrBGp0mr · arXiv https://arxiv.org/abs/2601.12186
3. **Beyond Borders: Investigating Cross-Jurisdiction Transfer in Legal Case Summarization**
   - **Authors:** T.Y.S.S. Santosh, V. Venkatkrishna, S. Ghosh, M. Grabmair
   - **Venue:** NAACL 2024
   - **Summary:** "Summarizing legal cases from jurisdictions with no reference summaries, using unlabeled target data and silver summaries."
   - **Links:** ACL Anthology https://doi.org/10.18653/v1/2024.naacl-long.231 · arXiv https://arxiv.org/abs/2403.19317
4. **Multi-step Automated Generation of Parameter Docstrings in Python: An Exploratory Study**
   - **Authors:** V. Venkatkrishna, D. Nagabhushanam, E. Simon, M. Vidoni
   - **Venue:** ICSE 2024 Companion (poster)
   - **Summary:** "A hybrid pipeline of fine-tuned code models and rules for generating structured Python parameter docstrings."
   - **Links:** ACM https://doi.org/10.1145/3639478.3643110

A Google Scholar link sits under the cards.

### News (newest first)

- Aug 2026: Preprint "Parameter Exploration for RLVR via Variational Learning" is out on arXiv
- Aug 2026: "Aletheia: What Makes RLVR For Code Verifiers Tick?" accepted at TMLR
- Nov 2024: Started my PhD at INSAIT 🇧🇬
- Mar 2024: "Beyond Borders" accepted at NAACL 2024
- Jan 2024: "Multi-step Automated Generation of Parameter Docstrings in Python" accepted at ICSE 2024 (posters)
- May 2023: Research intern at the Australian National University 🇦🇺
- May 2022: Research intern at the University of British Columbia 🇨🇦

## The cat (behaviour spec)

The mockup's engine is the reference implementation. Keep only the pixel style ("C"); drop the A/B styles and the vector cat and fish.

### World

- Square cells of about 40 CSS px. The number of rows and columns follows from the container size.
- About 15% of cells are bushes (walls), placed as short segments of 2 to 4 cells and rejected if they would disconnect any free cell.
- The snack spawns in the right third of the grid.

### Learning

- A deterministic 4-action gridworld: reward 1 for entering the snack cell (terminal), otherwise 0, with γ = 0.94.
- There are two Q-tables, both updated from the same experience:
  - **Optimistic** (initialised to 1): the cat acts on this while it explores ("optimism in the face of uncertainty").
  - **Display** (initialised to 0): drawn as the heatmap and arrows. Once the snack has been found, the cat acts ε-greedily on it. ε starts at 0.2, is multiplied by 0.7 after each episode, and has a floor of 0.03. In cells where every display value is still 0, the cat falls back to the optimistic table.
- **Dyna-Q planning:** 60 backups from the model per real step, and 500 per frame during the 1.1 s pause after eating. Backups are full (α = 1) because the environment is deterministic.

### Pacing

- One step every 42 ms while exploring and every 100 ms afterwards, with an eased hop between cells and a small bump animation when the cat walks into a wall.
- After eating, the cat respawns at a random cell at least 5 steps away.
- After 3 near-optimal episodes in a row (at most the shortest path + 2), and if the visitor hasn't interacted for 8 s, a new run starts:
  - the snack moves to a cell at least 6 steps away;
  - learning resets;
  - a new breed and snack are sampled, always different from the previous pair.

### Visuals

- green value heatmap (4 quantised levels)
- greedy-policy arrows as pixel chevrons
- a fading paw-print trail
- "+1" when the cat eats
- a status line plus a sparkline of steps per episode in the readout

### Interaction

- **Click an empty cell:** toggles a bush. If the bush would disconnect the grid, it is refused with a red flash. Model entries next to that cell are invalidated.
- **Drag the snack:** moves it, resets learning and keeps the same breed and snack.
- **Click the cat:** pets it.

### Petting

- The cat freezes in place and learning simply waits. A pixel hand with a green sleeve strokes its back for 1.8 s.
- **65% of the time it purrs:** the cat bobs, hearts float up, and a bubble shows a line from PURRS.
- **35% of the time it snubs you:** the hand withdraws, the cat turns away with its face hidden, and a bubble shows a line from SNUBS.

### Cosmetics

- **Breeds:** ginger tabby, black, tuxedo, grey tabby, Siamese and calico.
- **Snacks:** fish, shrimp, drumstick, milk, tuna and kebapche.
- The sprites, PURRS/SNUBS lines and status messages are as in the mockup.

### Performance

- Only the canvas that is actually displayed runs: the strip on desktop or the panel on mobile.
- It pauses when scrolled off-screen (IntersectionObserver) and when the tab is hidden.
- Device pixel ratio is capped at 2.
- The script is loaded with `defer`.

### Reduced motion

If `prefers-reduced-motion` is set, draw a single still frame (bushes, snack, cat) and start the simulation only after the visitor's first click in the grid.

### Accessibility

The canvas has `role="img"` and an `aria-label` describing the scene. It is decorative, and all real content is in HTML.

## Files (builder's layout; my call)

```
index.html                 the page
assets/site.css
assets/cat.js              engine + sprites + init
assets/fonts/*.woff2       self-hosted Latin subsets: Bricolage Grotesque 400/700/800, Silkscreen 400
images/moi.webp, moi.jpg   photo re-encoded at ~2x display size (336 px); JPEG fallback
favicon.svg                tiny pixel cat (keep favicon.ico as fallback)
publications/index.html    redirect → /#papers
cv/index.html, resume/index.html   redirect → CV link
404.html                   small pixel-style "this cat wandered off" page
files/google383882cb68c31692.html  keep (Search Console verification)
sitemap.xml, robots.txt    static, one URL
.nojekyll
README.md                  how to edit papers/news/intro and tune the cat
```

Everything else from AcademicPages is deleted, and git history preserves it. The design doc and mockup stay in `docs/superpowers/specs/`.

The `<head>` gets: title, meta description, canonical URL, Open Graph and Twitter card tags (using the photo), and a small JSON-LD `Person` block with `sameAs` links.

## Calls settled after review (my calls)

- **Spec vs. mockup:** the spec wins on content and the mockup wins on visuals. So: the paper order, authors, links and ORCID come from this doc, the "drag: snack" wording is used, and there are no Code/BibTeX links and no "placeholder" note.
- **Mobile scrolling:** the game must never trap page scrolling.
  - The canvas allows vertical panning.
  - A tap with no movement toggles a bush.
  - Only a touch that *starts on the snack* blocks scrolling, so the snack can be dragged.
- **`docs/` is served publicly** once `.nojekyll` is in place, so `robots.txt` disallows `/docs/`.
- **Fonts:** self-host a Latin subset of the *variable* Bricolage Grotesque (opsz + wght), so headings keep the look approved in the mockup, plus Silkscreen 400. This is about 65–90 KB and still within budget.
- **Photo:** a centre square crop of `images/moi.jpg`, 336 px.

## Left to the builder

- exact CSS beyond what the mockup shows
- how to subset the fonts and encode the images
- how the code inside `cat.js` is structured
- the 404 page's design
- the README wording
- how to verify weight and behaviour (headless Chrome is available locally)
