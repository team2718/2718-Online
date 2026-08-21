# Team 2718 Scouting & UI Guidelines

## 1. Visual Style & Anti-AI Design
- **Brand Palette**: Cyan is the primary team brand color (`--color-primary-*`).
- **Clean, Human-Designed Aesthetic**: Strictly avoid common AI-generated design tropes:
  - No background gradients behind large hero components or cards.
  - No gradient text on brand headers or logos.
  - No floating blurred ambient background circles (`blur-3xl`).
  - No pulsing dot badges (`animate-pulse`).
  - No redundant numeric logo boxes when typography already states the team/app name.

## 2. Mobile-First Scouting Ergonomics
- **Touch Targets**: All interactive elements (buttons, pills, list items) must maintain minimum 44px touch targets on mobile viewports.
- **Queue Prioritization**: In pit scouting and inspection views, unscouted teams (`!pitScouted`) must always be sorted to the very top.
- **Empty States**: Always provide direct, contextual action buttons (e.g. `+ Scout Pit for Team {num} →`) instead of dead-end empty text.
- **Navigation Flow**: Mobile drawers and autocomplete dropdowns must automatically close immediately upon selecting a destination or search result.
- **Form Inputs**: Ensure text/number inputs on mobile have a minimum 16px font size to prevent automatic iOS zoom on focus.

## 3. SVG & Chart Interaction Standards
- **Zero-Jitter Transforms**: Never apply CSS `hover:scale-*` or CSS transition transforms to SVG child elements (`<circle>`, `<rect>`, `<path>`) without explicit `transform-box: fill-box` and `transform-origin: center`, as SVG coordinates scale relative to `(0,0)` and cause severe hover event jitter. Adjust SVG attributes (`r`, `stroke`, `stroke-width`) directly instead.
- **Overlay Labels**: Any text label positioned over or adjacent to interactive SVG points must include `pointer-events-none select-none` to prevent pointer event collision loops.

## 4. Subagent Verification & Comprehensive QA Auditing
- **Proactive Defect Discovery**: Subagents tasked with UI verification must not limit their evaluation to narrow checklist items. Subagents are expected to actively audit for and report back ANY bugs, visual anomalies, or defects they observe, including:
  - **Copy & Grammar**: Malformed plurals (e.g., `0 Entries` vs `0 Entryies`, `1 Report` vs `X Reports`), typos, and awkward phrasing.
  - **Data Integrity**: Missing string interpolations, `NaN`, `null`, or `undefined` values rendered in cards/badges.
  - **Interaction Quirks**: Wobbling/flickering hover states, clipping overflow, or unclickable touch targets.
  - **Visual Alignment**: Misaligned baselines, cramped typography, or awkward line wrapping on mobile.

