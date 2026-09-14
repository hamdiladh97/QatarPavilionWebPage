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
assets/img/speakers/       22 speaker portraits
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
  "speakers": ["saad-al-hitmi", "john-verdieck", "…"]
}
```

The date rail, the Upcoming/Live now/Concluded badges, and the tab that opens by
default are all derived from these timestamps — no further edits needed.

### Speakers

Each person is listed once, in `programme.speakers`:

```js
{ "id": "john-verdieck", "name": "Mr. John Verdieck", "role": "…", "org": "…", "photo": "…" }
```

Events refer to speakers by `id`. The same roster renders the **Speakers** directory
under the programme — collapsed by default behind a native `<details>` toggle
(`directory.show` / `directory.hide` label it) — in array order, which follows the brochure's Speakers pages
(MECC first). A directory card links to every session that lists its `id`; a speaker
listed in no event (e.g. Eng. Ahmed Al Sada, Eng. Mahmoud al Marwani) still gets a
card, without a link. To move a speaker between panels, change the ids — nothing else.

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

The brochure alternates two grounds: full-bleed **maroon** pages (welcome, MECC
efforts, highlights, strategy, calendar, back cover) and warm **ivory** pages
(cover, the five side-event pages, speakers). The page follows it page for page:
ivory cover hero → maroon welcome → ivory programme → maroon highlights → ivory
ministry → sand reports → deep-maroon back-cover footer, with the sweep
alternating sides between every pair.

Maroon sections carry one soft radial lift at the top-left, in `--qp-maroon-soft`.
The brochure never has to solve flat maroon over a full spread; a screen does.

> The brochure uses `#8A1539`; mecc.gov.qa uses `#8A1538`. One digit apart. This page
> standardises on the brochure's value, as the event identity is the agreed reference.

### Typography — one family, weight contrast

The brochure is set in Cormorant and gets its hierarchy from **weight**: titles,
kickers ("◆ Side-Event 1", "◆ Agenda"), speaker names and numerals are rendered
Bold; body and captions are Light. (Its embedded subsets are all *named*
`Cormorant-Light` — the bold is applied in the layout, which is why an earlier
pass mistook the whole brochure for a single Light weight and shipped thin,
pale titles.)

| | Weight | Roles |
|---|---|---|
| `--qp-display-bold` | Cormorant 700 | every title, kicker, speaker name, card and report title, pillar label, footer heading, nav link, button, numeral |
| `--qp-display-light` | Cormorant 400 | one role: the cover's "Side Events Programme" line |
| `--qp-weight-body` | Cormorant 500 | body, intros, agenda rows, roles, notes — at 20px, since Light goes hairline on screen |

Colour is the other axis, exactly as the brochure: ink titles and maroon kickers
on light grounds, white titles and kickers on maroon, gold for rules and numerals.
IBM Plex Sans survives only for the few labels under ~14px (status pills, unit
labels, legal line), where a high-contrast serif breaks up.

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

| Layer | Fill | Lift (viewBox units) |
|---|---|---|
| `.ribbon__tan` | `--qp-gold-pale`, solid | `--ribbon-gold` + `--ribbon-tan` |
| `.ribbon__gold` | `--qp-gold`, solid | `--ribbon-gold` |
| `.ribbon__fill` | the incoming ground | none |

Every divider carries all three, as the cover does — ground, gold band, tan band —
with solid fills; the bands are what make the curve read as layered colour rather
than as an edge. The hero sweep runs at cover scale (up to 270px) and carries the
ministry mark in its deep end, where the cover places it.

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

Speaker portraits come from the speaker assets in `side_events_and_speakers/`, except
`john-verdieck.jpg` and `mahmoud-al-marwani.jpg`, which have no supplied photo and were
extracted from the cut-out portraits embedded in *Side-Events Brochure New.pdf*, set on
the brochure's own circle fill (`#ECD1B7`). Each is cropped square around the face at
320×320, so heads sit at the same size and height across the row.
Scene photography was extracted from the official brochure PDF. Report covers are
from `Reports/QReports/`: page 1 of each PDF, or the supplied cover PNG where no PDF
was given (Climate Change Impact Roundup, National Adaptation Plan). These are **real named officials**, so none of the imagery
is AI-generated.

To replace an asset, keep the filename and the page picks it up. Portraits should be
square; event scenes look best at 4:5 or wider.

**`hero.jpg` is cropped from the brochure's `Im0`**, which was flattened onto its
own soft mask: a black band down the left, a black rounded corner at the top-left,
and a pale chroma fringe inside them. The black is cut out of the file itself
(insets from the 3600×2406 source: left 217px, top 175px, right 43px, bottom 55px),
so the hero, the footer background and the social-share image all get the clean
photograph in every browser. The pale fringe down the far left is kept, because
cropping it would cut through the wind turbine; the hero scrim and the footer's
maroon overlay both cover it.

**Logos** were chroma-keyed off the brochure's flat maroon and have transparent
backgrounds, so they sit on any ground. If official vector (SVG/EPS) marks become
available, swap them in — they will be sharper at large sizes.

---

## Known gaps / next steps

- **Reports link to the MECC publications index**, not to individual PDFs — the brief supplied titles only. Add a `href` per item in `content.js` when the direct URLs exist.
- **One speaker title is incomplete**: Mohamed al Bader reads "Head" exactly as the brochure prints it. Fill in `role` when confirmed.
- **Speaker line-up, names and credits follow *Side-Events Brochure New.pdf*** (it supersedes `side_events_and_speakers/`, whose Event 1 slot for Eng. Ahmed Al Sada is now Mr. John Verdieck). Credits are the brochure's, except "Türkiye" is used throughout where one card prints "Turkey".
- Source brochure typos were corrected in the copy: "Sri Lank" → "Sri Lanka", "(NDCs are submitted" → "(NDCs) are submitted", "Change Departmen" → "Change Department", "JessicaTroni" → "Jessica Troni".

---

## Local preview

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`. Opening `index.html` directly also works.
