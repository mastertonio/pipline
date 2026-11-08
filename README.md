# Pipeline Conversions — Discovery Framework Impact Lift

React + Vite implementation using the original calculator's recovered styles, markup and behavior from the supplied Perplexity artifact.

## Run

```sh
npm install
npm run dev -- --host 127.0.0.1
npm run build
```

Open http://127.0.0.1:5173. Production output is in `dist/`.

## Source ownership

- `src/App.jsx`: React lifecycle adapter for the original interactive DOM. Keeps the original selectors and event model intact instead of reimplementing behavior approximately.
- `src/referenceMarkup.js`: readable, checked-in original HTML/SVG markup; no remote script, tracking, or Perplexity inline-edit bridge.
- `src/referenceBehavior.js`: original calculation engine, guided rating controls, validation, dialogs, navigation, scenarios, URL sharing, reset and presentation mode. Document listeners and timers clean up when React unmounts.
- `src/styles.css`: original Source Serif 4 / Manrope fonts, weights, tokens, geometry and responsive rules. The approved responsive rules are preserved exactly, including their narrow-screen clipping. Reduced-motion support is retained.
- `src/main.jsx`: React entry point.
- `public/assets/`: exact approved SVG logo and WebP photos, alongside the earlier supplied assets.

## Behavior

Monthly presentations = reps × presentations/week × selling weeks/year ÷ 12. Individual mode uses one rep. Think/no percentages partition only the non-closing share; whole-number outcome counts use the original largest-remainder allocation.

Presenter and Audience each have five categories, rated for Today and With the Framework. Ten positive score gaps are added. Relative conversion lift = total points × scenario value per point (1%, 1.5%, 2%). Projected close rate = current close rate × (1 + lift), capped at 95%. Investment/payback and other result metrics follow the original engine.

Assessment selection retains the approved muted inactive appearance. Both types remain clickable: switching an empty form is immediate, and switching an entered form opens the confirmation before clearing baseline values. Start over requires a second click within three seconds. Share copies a URL containing the full assessment hash. Print opens the browser print dialog. Presentation mode matches the source.

Local persistence and live offer-value commas are retained as requested additions. Existing baseline inputs migrate from the earlier version; simplified legacy scores cannot map to the original ten rating pairs.

## Verification

Build passed. Browser verified baseline 1/week, 48 weeks, $1,000 offer, 20% close, 10% think, 8% no: 4 presentations, 0.8 deals, $800 revenue, $576 opportunity/month. Completed all ten guided category pairs and reached Impact. Thirty total improvement points give 20% → 29% at 1.5% per point; selecting 2% gives 32%. Type-lock dialog, double-click reset, monthly/yearly periods, team multiplication, live commas, mobile menu and persistence checked.

## Exact design audit — 2026-11-08

Compared the current published app with localhost in the same isolated Chrome browser, using identical assessment state, CSS viewport, device scale, loaded fonts, and settled transitions/images.

- 16 full-page reference/local screenshot pairs: **100% matching pixels, zero changed pixels** in every captured pair.
- Computed style, geometry and visible copy: **zero differences** across all compared nodes. Includes font family/size/weight, line height, letter spacing, colors, backgrounds, padding, margin, borders, radius, shadows, and layout alignment.
- 1680×1000: blank, populated Baseline, Presenter, Audience, Impact, confirmed Individual, confirmed Sales Team, and populated team Baseline.
- 1440×1000: Baseline, Presenter, Impact.
- 1024×1000: Baseline.
- 390×844: all four steps.
- All captured calculation outputs agree; no application exceptions recorded.
- 11 interaction assertions pass: enabled switching, approved muted color, confirmation, cancel preserves data, confirmed switch, baseline clearing, immediate empty switching, live commas, saved state, armed reset, and cleared reset.
- `npm run build` passes.

The approved app clips content at 390px; this is now reproduced to meet the request for exact fidelity. Earlier local responsive redesigns were removed. Intentional behavior additions remain automatic commas, local persistence, clickable assessment switching, and reduced-motion support. Pixel equality applies to the recorded states and Chrome environment, not an untested universal-browser guarantee.

Audit artifacts live outside the project: `/tmp/pipeline-fidelity-full/` (13 scenarios) and `/tmp/pipeline-fidelity-selection/` (3 additional selection/team scenarios), with `pixel-results.json`, computed-style snapshots, and original/local PNGs.

Files changed in this audit:

- `src/styles.css`: exact approved layout and colors; visual-only muted-option state.
- `src/referenceMarkup.js`: exact approved SVG logo reference.
- `src/referenceBehavior.js`: keeps switching accessible while matching the approved selection appearance.
- `public/assets/pipeline-conversions-logo-light.svg`: approved logo.
- `public/assets/bridge.webp`: approved bridge photograph.
- `public/assets/conversation.webp`: approved sidebar photograph.
- `README.md`: updated ownership and validation evidence.

Native clipboard permissions, physical print output, other browsers and deployment remain unverified.
