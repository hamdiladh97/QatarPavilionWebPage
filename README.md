# Qatar Pavilion at COP31 — Landing Page

One scrolling page for the Qatar Pavilion at COP31, Antalya, Türkiye, 9–20 November 2026.
Static HTML/CSS/JS. No build step, no dependencies, no server required.

Open `index.html` in a browser, or drop the folder on any static host
(SharePoint, S3, Netlify, IIS, nginx).

---

## Contents

```
index.html                 page shell, meta/OG tags, JSON-LD Event schema
data/content.js            ← ALL COPY AND EVENT DATA LIVES HERE
assets/css/tokens.css      the design system (3 token layers)
assets/css/styles.css      components
assets/js/app.js           rendering + countdown, tabs, counters, scrollspy
assets/img/logos/          Qatar Pavilion, COP31 Türkiye, MECC marks
assets/img/scenes/         hero, Qatar map, one image per side event
assets/img/speakers/       20 speaker portraits
.claude/launch.json        local preview config (not needed in production)
```

---

## Editing content

**Everything readable on the page comes from `data/content.js`.** Nothing is hard-coded
in the markup. Change a string there, reload, done.

It is a `.js` file rather than `.json` for one reason: browsers block `fetch()` on
`file://`, so a raw JSON file would break the "just open index.html" case. The contents
are otherwise plain JSON.

### Adding or changing a side event

Add an object to `programme.events`. Dates are ISO 8601 with Antalya's `+03:00`
offset and are always displayed in venue time, whatever timezone the visitor is in:

```js
{
  "no": "06",
  "title": "…",
  "theme": "…",
  "start": "2026-11-19T13:00:00+03:00",
  "end":   "2026-11-19T14:00:00+03:00",
  "image": "assets/img/scenes/event-6.jpg",
  "imageAlt": "…",
  "description": "…",
  "speakers": [ { "name": "…", "role": "…", "org": "…", "photo": "…" } ]
}
```

The date rail, the Upcoming/Live now/Concluded badges, and the tab that opens by
default are all derived from these timestamps — no further edits needed.

### Countdown

`meta.opensAt` drives the hero countdown. When that moment passes, the countdown
replaces itself with "The Qatar Pavilion is open at COP31."

---

## Design system

`assets/css/tokens.css` is the single source of visual truth, in three layers:

1. **Primitives** — raw brand values (`--qp-maroon`, `--qp-gold`, the type scale)
2. **Semantic** — role aliases (`--surface-brand`, `--text-on-brand`) that components use
3. **Component** — per-component values (`--nav-h`, `--portrait-size`, `--ribbon-h`)

Components reference layer 2 only, so changing one primitive re-themes the whole page.

### Where the values came from

Measured from the official *COP31 Qatar Pavilion Side-Events Brochure* (Illustrator
source), not estimated. Colours are area-weighted vector fills; type is the embedded
font programme.

| Token | Hex | Role |
|---|---|---|
| `--qp-maroon` | `#8A1539` | Qatar Maroon — primary ground |
| `--qp-ivory` | `#FFF8F0` | warm ground |
| `--qp-sand` | `#F7EDE2` | secondary ground |
| `--qp-gold` | `#CE9F63` | the signature accent |
| `--qp-gold-lit` | `#D7AF7E` | the cover gradient's gold |
| `--qp-gold-ink` | `#8C6829` | gold dark enough to be *text* on a light ground |
| `--qp-petrol` | `#0C4261` | theme chips |
| `--qp-ink` | `#1D1D1B` | body text (never pure black) |

`--qp-gold-ink` has no counterpart in the brochure, because print does not need
one: there, gold is always a filled bar with type reversed out of it. On screen
`#C49453` is 2.7:1 on white, so gold *type* needs its own darker value.

### Grounds

The brochure has sixteen pages and **not one is a maroon field** — every page is
ivory or sand, and maroon is reserved for the corner device, image containers
and type. The page follows that: Programme keeps a maroon ground as the single
dark chapter, and everything from there to the footer alternates ivory and sand
the way the brochure alternates page to page.

Maroon sections carry one soft radial lift at the top-left, in `--qp-maroon-soft`.
The brochure never has to solve flat maroon over a full spread; a screen does.

> The brochure uses `#8A1539`; mecc.gov.qa uses `#8A1538`. One digit apart. This page
> standardises on the brochure's value, as the event identity is the agreed reference.

### Typography — two deliberate departures

The brochure is set **entirely** in Cormorant Light — verified from the embedded
font programme, not assumed: nine subsets, every one `FontWeight 300`, plus Light
Italic. It gets all its contrast from scale, case and colour.

**First departure — a second family.** A Light high-contrast serif fails
legibility and WCAG contrast at screen body sizes, especially reversed out of
maroon. So **Cormorant keeps every display role** and **IBM Plex Sans carries
anything under ~18px** — labels, times, agenda rows, nav, buttons, captions.

**Second departure — a second weight.** Light holds at display scale and
collapses below it; its hairlines thin out under ~2rem and all but vanish in
numerals. So the display split is by *optical size*, not by role:

| | Weight | Roles |
|---|---|---|
| `--qp-display-light` | Cormorant 300 | ≥ ~2.2rem — hero title, section titles, event titles, pull quote |
| `--qp-display-bold` | Cormorant 600 | < ~2.2rem — speaker names, card and report titles, pillar labels, footer headings — **and every numeral regardless of size** |

Numerals are the stated exception: old-style figures at Light are the thinnest
shapes on the page, so the countdown and the stat counters take 600 even at 3rem.

To self-host instead (recommended for an air-gapped or offline deployment), drop the
woff2 files into `assets/fonts/`, add `@font-face` rules, and delete the
`fonts.googleapis.com` link from `index.html`.

### The signature element

The divider between every section is the brochure **cover's bottom sweep**, traced
from the PDF's own vector path. Generated by `ribbon(to, flip, hero)` in `app.js` —
one function, six uses.

**The curve.** The source is monotonic: dead flat from the right page edge to
x=79%, then one continuous rise to 37.8% of page height at the left. It never
reverses. Sampled at its original control points and normalised to a `1440×100`
viewBox. Its shallow end is scaled to land at `y=88` rather than `0` — mid-page a
band of zero height carries no gold and meets the next ground on a hard line, so
the shallow end keeps 12 units, which is the brochure's own minimum band (52pt of
a 419pt page).

**The layers.** Never a stroke — the brochure builds this from filled shapes and
so does the page. Same path, three times, each lifted a little more:

| Layer | Fill | Lift |
|---|---|---|
| `.ribbon__gold` | gold, alpha-ramped | `--ribbon-gold-lift` |
| `.ribbon__mid` | `--qp-sand-deep` | half that — **hero sweep only** |
| `.ribbon__fill` | the incoming ground | none |

The cover stacks three this way; only the hero sweep runs at cover scale, so only
it has the room to read as three rather than as a thickened edge.

**The gradient.** The cover's two gold shadings are *alpha* ramps over a flat
gold, not colour ramps — `#D6AD7E→#D8B07E` is effectively one colour — and their
axes run opposite ways, `(252,39)→(56,124)` against `(431,52)→(560,89)`. Here the
ramp is anchored to the curve's deep end; since consecutive dividers alternate
sides (`--flip`, mirroring the SVG), consecutive ramps reverse for free.

**The overlap.** A divider is pulled up over the section above it by its own
height and paints no ground of its own. That is what lets the hero photograph run
all the way down and be cut by the curve, instead of stopping at a hard edge above
it. `.section:has(+ .ribbon)` buys back the bottom padding the overlap eats.

> `L1440,88` at the end of the path is load-bearing. Without it `Z` closes on a
> diagonal back to the start point and the band tapers to nothing at the right
> edge — the gold disappears there and the boundary goes hard.

---

## Accessibility

- All body, label, and caption colours pass **WCAG 2.1 AA** against their real grounds — verified in-browser across every element instance, not one sample per selector. Lowest measured ratio **5.09:1**. Three roles previously failed and were fixed: the hero eyebrow (inherited body ink onto maroon, 1.8:1 — the hero is a brand ground but not a `.section`, so it matched no ground rule), and the stat numerals and report kickers (gold `#C49453` on white, 2.7:1 — now `--qp-gold-ink`).
- Programme rail is a proper ARIA tablist: arrow keys, Home/End, roving tabindex.
- Visible gold focus ring on every interactive element; skip-link to main content.
- Every control is ≥44px tall on mobile.
- `prefers-reduced-motion` is honoured system-wide — durations collapse to 1ms, reveals and counters resolve instantly.
- Decorative images are `aria-hidden`; speaker portraits carry the person's name as alt text.
- `<noscript>` fallback carries the event essentials and a link to mecc.gov.qa.

---

## Assets

Portraits and scene photography were extracted from the official brochure PDF —
speaker photos are cropped from the gold rings at 265×265, matched to each person by
position on the page. These are **real named officials**, so none of the imagery is
AI-generated.

To replace an asset, keep the filename and the page picks it up. Portraits should be
square; event scenes look best at 4:5 or wider.

**`hero.jpg` carries a frame that is not part of the photograph.** It is the
brochure's `Im0` flattened onto its own soft mask, so the 927×618 bitmap has 51px
of black down the left, 3px across the top, and the mask's rounded corners with a
chroma fringe over the top-left. The clean rectangle does not exist in the PDF —
the rounding was the mask, and the black is baked into the colour JPEG. Rather
than re-encode, the crop is declared in CSS:

```css
.hero__media img { object-view-box: inset(2.27% 1.19% 2.27% 6.04%); }
```

Those are the source rectangle's insets as percentages of 927×618. If a clean
original is ever supplied, drop that line and the rest works unchanged.

**Logos** were chroma-keyed off the brochure's flat maroon and have transparent
backgrounds, so they sit on any ground. If official vector (SVG/EPS) marks become
available, swap them in — they will be sharper at large sizes.

---

## Known gaps / next steps

- **Reports link to the MECC publications index**, not to individual PDFs — the brief supplied titles only. Add a `href` per item in `content.js` when the direct URLs exist.
- **Two speakers have no organisation listed** (Fatma Varank, Rohini Kohli) — the brochure omits them. The card layout degrades cleanly; fill in `org` when confirmed.
- **Report cover images** are not used; cards are typographic. Add a `cover` field and an `<img>` if covers are supplied.
- Source brochure typos were corrected in the copy: "Sri Lank" → "Sri Lanka", "(NDCs are submitted" → "(NDCs) are submitted".

---

## Local preview

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`. Opening `index.html` directly also works.
