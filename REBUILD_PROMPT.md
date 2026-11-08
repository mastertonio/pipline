# React rebuild prompt — Pipeline Conversions

Build a **production-quality React + Vite application** that recreates the provided Perplexity artifact, **“Discovery Framework Impact Lift Calculator,”** as faithfully as possible. Use the attached screenshot and supplied image assets as the single source of truth. Do not redesign, simplify, add unrelated sections, substitute assets, or add generic SaaS marketing UI.

## Goal

Reproduce the full desktop calculator experience and a polished responsive mobile version. The application is a four-step guided sales-impact calculator for **Pipeline Conversions**.

The finished product must be interactive: inputs immediately update the reality dashboard, the next/back buttons move through the step flow, the navigation changes the active step, Start over clears state, Share copies the URL, and Print opens the browser print dialog.

## Stack and implementation requirements

- React 18+ with Vite.
- Use functional components, hooks, semantic HTML, and modular, maintainable source files.
- Use CSS (or CSS Modules) with a small token system; no Tailwind required.
- Use `lucide-react` for controls/icons: RotateCcw, Link, Printer, MonitorUp, Menu, X, UserRound, Users, ChevronDown, ChevronRight.
- Preserve input state in `localStorage` so a refresh does not erase the assessment.
- Implement keyboard focus, visible focus styles, correct labels, and `prefers-reduced-motion` support.
- Do not ship static screenshot images as UI. All controls, labels, fields, panels, and charts must be native React/HTML/CSS.

## Supplied assets (use exactly these)

- `PIPELINE.png`: primary Pipeline Conversions logo. Place it in the upper-left of the sidebar without recoloring, distortion, or a substitute wordmark.
- `WhatsApp Image 2026-11-05 at 11.11.17 PM.jpeg`: mountain bridge at sunrise. Use as the image in the right-side “The Discovery Framework™” panel.
- `WhatsApp Image 2026-11-05 at 11.11.47 PM.jpeg`: dark consultation meeting. Use as the bottom sidebar background image.

Use `object-fit: cover`; preserve the photos’ natural color and apply only the dark navy gradient shown in the reference for legibility.

## Exact information architecture

### Persistent desktop shell

1. Left sidebar — 264px wide, deep navy (`#09213D` / `#0E2D52`) vertical rail:
   - Pipeline logo at top.
   - Product chip: compass-like icon then `Discovery Framework` / `Impact Lift`; 3px lime left rule; soft navy filled panel.
   - Vertical line and four numbered items: `01 Baseline`, `02 Presenter`, `03 Audience`, `04 Impact`.
   - Active item has white text and a lime filled node with soft halo; inactive items are muted blue-gray outlined nodes.
   - Consultation photo fills the bottom region with a navy overlay; small `Pipeline Conversions` caption at lower left.

2. Header — 144px deep navy/blue band:
   - H1: `Discovery Framework Impact Lift` in an elegant serif, approximately 29px.
   - Uppercase subline: `SEE THE IMMEDIATE LIFT FROM A BETTER BUYING EXPERIENCE` with 1.6px tracking.
   - Right-aligned outline actions: Start over, Share, Print, Presentation Mode, with Lucide icons.
   - A faint oversized circular blue line decoration can appear in the upper-right, matching the reference subtly.

3. Main page background: pale cool gray `#F4F5F7`; 36px desktop gutters; centered maximum width around 1440px.

4. Horizontal step navigator: white 4-column segmented control with a thin gray border and 10px radius. Each item includes two-digit number, serif step name, and caption:
   - `01 Baseline` / `Your Current Reality`
   - `02 Presenter` / `Presentation Effectiveness`
   - `03 Audience` / `Buying Experience`
   - `04 Impact` / `Potential Results`
   - Active segment is navy with white text and 3px lime underline.

### Step 1: Baseline — Your Current Reality

Desktop layout: two columns, left form about 1.72x the right column, 24px gap.

Left white card (12px radius, quiet shadow) includes:

- Heading `Baseline — Your Current Reality`, 29px serif, with a vertical lime rule to its left.
- Description: `The Discovery Framework changes what happens inside your sales conversations, so that’s where we start. Enter your real presentation numbers, not leads. Every lift you see is measured against where you are today.`
- `ASSESSMENT TYPE` label and segmented control. Individual selected (navy), Sales Team unselected.
- Helper: `Use your own numbers as one presenter.`
- Divider.
- Section title: navy circular `1`, `Your presentations`, then far-right `Required unless marked optional`.
- Two-by-two responsive field grid:
  - PRESENTATIONS PER WEEK, placeholder `e.g. 13`, helper `Sales conversations that actually happened.`
  - AVERAGE OFFER VALUE, dollar prefix, placeholder `e.g. 5,000`, helper `What a typical new client is worth. If it’s recurring, use the first-year value.`
  - CURRENT CLOSE RATE, percent suffix, placeholder `e.g. 20`, helper `Of every 100 presentations, how many say yes? Include those who said yes later, after follow-up.`
  - AVERAGE SALES CYCLE (optional), placeholder `e.g. 21`, select with Days / Weeks / Months, helper `First presentation to a yes.`
- Section title: navy circular `2`, `When they don’t say yes`.
- Border-outlined outcome box titled `How your presentations end`, helper `Enter your close rate and split to see how your presentations end.`
  - `“I need to think about it”` / `Interested, but no decision. Goes to follow-up.` / percent input.
  - `“No, not right now”` / `Decided against it, or chose another option.` / percent input.
  - `Not a good fit` / `Calculated so the three add up to 100%.` / calculated percent.
- Helper: `A best estimate is fine. This shows where the lift is most likely to come from.`
- Before enough required values exist: `Enter your numbers to see your current reality.` and disabled `Next: Presenter` button.
- Button enables only when presentations, average offer value, close rate, think percentage, and no percentage are populated and their percentages do not exceed 100.

Right column:

- Upper “Discovery Framework” photo panel, 247px tall, bridge image, dark left-to-right navy gradient, 11px radius.
  - lime vertical rule + `THE DISCOVERY FRAMEWORK™` uppercase tracking.
  - large white serif copy: `Turn Better Conversations into Measurable Results.`
  - Copy: `Same leads. Same offer. Same number of presentations.` then lime `A better buying experience.`
- Lower white reality card titled `YOUR CURRENT REALITY` and Month/Year toggle (Month selected).
  - Presentations per month
  - Closed deals per month
  - Selling weeks per year field (default 48) with copy `48 allows for holidays and time off.`
  - Current revenue per month
  - Revenue per presentation average
  - Waiting on a decision presentations per month
  - Unconverted opportunity value per month
  - Closing note exactly as shown in reference.

Use calculations:

```text
presentationsPerMonth = presentationsPerWeek × 4.33
closedDealsPerMonth = presentationsPerMonth × closeRate / 100
currentRevenuePerMonth = presentationsPerMonth × averageOfferValue × closeRate / 100
revenuePerPresentation = currentRevenuePerMonth / presentationsPerMonth
waitingOnDecision = presentationsPerMonth × thinkPercentage / 100
unconvertedOpportunity = presentationsPerMonth × averageOfferValue × (thinkPercentage + noPercentage) / 100
notAGoodFit = max(0, 100 - closeRate - thinkPercentage - noPercentage)
```

Format currency as USD with no decimal places. Before values are entered, show `—` instead of $0.

### Steps 2–4

Maintain the exact shell and navigator, updating active state and sidebar rail state.

- Presenter: `Presenter — Presentation Effectiveness`; 1–10 score control with visual selected cells, an explanation block, Back and Continue buttons.
- Audience: `Audience — Buying Experience`; same scoring visual model, buyer-experience-specific copy, Back and Continue buttons.
- Impact: `Impact — Potential Results`; modeled monthly revenue, current close rate, projected close rate, and a clear summary of the inputs that drive it. Do not invent metrics that do not flow from user inputs. Use a restrained result layout in the same white-card/navy/lime design system.

## Visual fidelity rules

- Use a refined serif such as `Playfair Display` only for H1/H2/step titles; use `DM Sans` or a close geometric sans for all UI and body text.
- Palette: deep navy `#09213D`, header navy `#0E2A4C`, active blue `#163B65`, lime `#9DC843`, ink `#18212D`, muted text `#66717E`, light gray borders `#E2E5E8`, true white surfaces, page `#F4F5F7`.
- Radii: 6–10px controls, 10–12px cards. Shadows must be gentle and neutral; no glows, gradients beyond the photo/header overlay, glassmorphism, bento cards, giant pills, or generic dashboard chrome.
- Match the reference’s open, business-consulting layout: dense enough to feel useful, but with generous 24–36px spacing.
- Inputs 51px tall; outcome row inputs around 42px; buttons 8px radius.
- No hero eyebrow/badge/pill or new marketing content beyond the text specified here.

## Responsive behavior

- At ≤1050px: sidebar narrows; main baseline area becomes a one-column form followed by two equal right-side cards.
- At ≤760px: collapse sidebar off-canvas with a menu button; header retains title and menu control; action buttons can move into an accessible overflow menu; step navigator becomes 2×2; form grid becomes one column; score buttons become 5×2; no horizontal scrolling, clipping, or tiny text.

## Acceptance checklist

1. Run `npm run build` with no errors.
2. Test desktop and 390px mobile widths.
3. Test every calculator field, validation state, navigator, sidebar links, reset, share, print, and next/back flow.
4. Ensure user-provided assets load from local files with meaningful alt text.
5. Compare the initial desktop screen beside the supplied screenshot. Fix discrepancies in logo scale, header height, rail width, step bar, visual hierarchy, form density, photo crops, colors, fonts, spacing, borders, and button styling before completing.
