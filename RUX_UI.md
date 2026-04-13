# Rux UI — Design System Guide & Migration Tracker

> Living document. Update checkboxes as work is completed.

---

## Overview

Rux UI is a dark-first, oklch-based design token system for the ETB Trip Schedule app. It follows a strict 3-tier token architecture so that a single theme change at Tier 1 ripples correctly through every component without touching component CSS.

---

## Token Architecture

```
Tier 1 — Reference Tokens    (raw palette, no semantic meaning)
    ↓ aliased by
Tier 2 — System Tokens       (semantic roles, theme-switchable)
    ↓ consumed by
Tier 3 — Component Tokens    (component-specific, consume Tier 2)
```

**Rule:** Component CSS should only reference Tier 3 tokens. Tier 3 tokens only reference Tier 2. Tier 2 tokens only reference Tier 1. No component should reach directly into Tier 1 primitives.

---

## Naming Convention

### Tier 1 — Reference
```
--rux-{palette}-{scale}         color scales
--rux-space-{size}              spacing (xs / sm / md / lg / xl)
--rux-border-radius-{size}      radius (sm / md / lg / xl)
```
Examples: `--rux-blue-500`, `--rux-gray-800`, `--rux-space-md`

### Tier 2 — System / Semantic
```
--rux-surface-{role}            background surfaces
--rux-color-{role}              semantic color roles
--rux-text-{role}               text roles        ← TO DO
--rux-border-{role}             border roles      ← TO DO
--rux-space-{role}              layout spacing    ← use Tier 1 aliases
```
Examples: `--rux-surface-panel`, `--rux-color-status-red`, `--rux-accent-color`

### Tier 3 — Component
```
--{component}-{property}
--{component}-{variant}-{property}
--{component}-{state}-{property}
```
Examples: `--btn-primary-bg`, `--tripbar-height`, `--field-border`

**No `--rux-` prefix on component tokens.** The prefix is reserved for Tiers 1 and 2 only.

---

## Current State of variables.css

### ✅ Done

- [x] **Tier 1 color palette** — full 100–900 oklch scales for gray, red, orange, yellow, green, cyan, blue, purple, pink
- [x] **Tier 1 spacing** — `--rux-space-xs/sm/md/lg/xl`
- [x] **Tier 1 border radius** — `--rux-border-radius-sm/md/lg/xl`
- [x] **Tier 2 surfaces** — `--rux-surface-base/app-header/panel/header/footer/modal/input/menu/textarea`
- [x] **Tier 2 status colors** — `--rux-color-status-red/yellow/green/blue` + alpha variants
- [x] **Tier 2 accent/danger/warning/success** — `--rux-accent-color`, `--rux-danger-color`, `--rux-warning-color`, `--rux-success-color`
- [x] **Tier 3 buttons** — full `--btn-*` set for primary/secondary/danger/success/ghost/toolbar/toggle/icon + base aluminum tokens
- [x] **Tier 3 trip bar** — comprehensive `--tripbar-*` token set
- [x] **Tier 3 layout/sizing** — `--size-header-row/action`, `--schedule-row-height`, `--panel-width`, etc.
- [x] **Tier 3 typography** — heading tokens, font-stack variables
- [x] **Tier 3 icon** — `--icon-*` size/fill/opsz tokens
- [x] **Light theme overrides** — `[data-theme="light"]` block in place

---

### ❌ Issues to Fix (Blockers)

#### 1. Broken / undefined token references
These variables are referenced but not defined anywhere in the file:

| Reference | Used in | Fix |
|---|---|---|
| `--blu` | `--color-primary: var(--blu)` | Rename to `var(--rux-blue-500)` or define alias |
| `--blu-dark` | `--color-accent: var(--blu-dark)` | Define as `var(--rux-blue-600)` |
| `--blu-alert` | `--color-status-blue: var(--blu-alert)` | Define as `var(--rux-blue-300)` |
| `--wald-05` | `--color-success: var(--wald-05)` | Replace with `var(--rux-green-500)` |
| `--aube-05` | `--color-warning: var(--aube-05)` | Replace with `var(--rux-yellow-400)` |
| `--base-*` | `--text-primary: var(--base-12)` etc. | Audit all `--base-*` refs, map to `--rux-gray-*` |

#### 2. `--border-subtle: rgb(255, 0, 0)` — debug value left in
Pure red, obviously wrong. Set to a proper low-contrast border color:
```css
--border-subtle: oklch(100% 0 0 / 8%);
```

---

### 🔄 Needs Migration (Naming Cleanup)

#### 3. Short-code color aliases — legacy, not self-documenting
The following aliases use abbreviated names that conflict with the `--rux-*` convention. They should either be removed (replaced by direct `--rux-*` references) or renamed to the full convention.

```css
/* Currently: */                    /* Should become: */
--gra-dark                          --rux-gray-600  (or remove)
--gra                               --rux-gray-500  (or remove)
--gra-alpha                         --rux-gray-500 / 20%
--gra-alert                         --rux-gray-300

--red-accent / --red-dark / --red   --rux-red-600 / --rux-red-500 etc.
--org                               --rux-orange-500
--yel                               --rux-yellow-500
--grn                               --rux-green-500
--tea                               --rux-cyan-500 (approx hue 180)
--cya                               --rux-cyan-500 (approx hue 200)
--blue-accent/--blue-dark/--blue    --rux-blue-400/--rux-blue-600/--rux-blue-500
--pur                               --rux-purple-500
--pin                               --rux-pink-500
```

> Note: Each color group also has `-alpha` and `-alert` variants. These can become Tier 2 system tokens (e.g., `--rux-color-status-red-alpha`) instead of keeping arbitrary aliases.

#### 4. `--core-*` legacy surface system — superseded by `--surface-*`
```css
--core-01 through --core-09   →   map to --rux-gray-* or --surface-* equivalents
```
Check which CSS files still consume `--core-*` and migrate them to `--surface-*` / `--rux-surface-*`.

#### 5. `--color-*` semantic tokens — move to `--rux-color-*` namespace
```css
/* Currently: */
--color-primary, --color-secondary, --color-accent
--color-danger, --color-success, --color-warning
--color-status-pending/ok/assigned/blue
--color-conflict-accent/bg

/* Should become: */
--rux-color-primary      (Tier 2, references Tier 1)
--rux-color-accent
--rux-color-danger       (already partially done via --rux-danger-color)
...
```

#### 6. `--surface-*` / `--border-*` / `--text-*` — add `--rux-` prefix
These are Tier 2 system tokens but currently lack the `--rux-` prefix:
```css
--surface-00/01/02/03/04  →  --rux-surface-00/01/02/03/04
--border-default/hover/focus/subtle  →  --rux-border-*
--text-primary/secondary/placeholder/disabled/muted  →  --rux-text-*
--field-*  →  remains as component tokens (no prefix change needed)
```

#### 7. Duplicate spacing scale — consolidate
Two scales exist with different values at `md` and `lg`:
```css
--rux-space-md: 16px   vs   --space-md: 12px   ← different!
--rux-space-lg: 24px   vs   --space-lg: 16px   ← different!
```
Decide on one canonical scale and migrate all `--space-*` usage to `--rux-space-*`.

#### 8. `--md-*` Material Design tokens — replace with Rux equivalents
Still referenced in buttons, toggle, header actions, and light theme overrides:
```
--md-ref-palette-neutral-40    →  var(--rux-gray-600)
--md-ref-palette-neutral-80    →  var(--rux-gray-200)
--md-ref-palette-neutral-100   →  var(--rux-gray-100)
--md-sys-color-primary         →  var(--rux-color-primary)
--md-sys-color-error           →  var(--rux-color-danger)
--md-sys-elevation-*           →  var(--card-shadow-*)
--md-sys-color-outline-variant →  var(--rux-border-subtle) [after fix #2]
--md-sys-color-surface-*       →  var(--rux-surface-*)
```

---

## Component Inventory — Token Coverage

| Component | File | Tokens Defined | Status |
|---|---|---|---|
| Buttons | `button.css` | `--btn-*` (full set) | ✅ Complete |
| Trip Bar | `variables.css` | `--tripbar-*` (full set) | ✅ Defined — verify usage |
| Form / Fields | `form.css` | `--field-*` | 🔄 Partial |
| Layout | `layout.css` | `--size-*`, `--panel-width` | 🔄 Partial |
| Modals | `modals.css` | (none yet) | ❌ Not started |
| Dropdowns | `dropdown.css` | (none yet) | ❌ Not started |
| Schedule grid | `schedule.css` | `--schedule-*` | 🔄 Partial |
| Primitives | `primitives.css` | (mixed) | 🔄 Partial |
| Typography | `base.css` | heading tokens done | 🔄 Missing body/label |
| Print | `print.css` | `--env-*` | ✅ Defined |

---

## Migration Priority Order

1. **Fix broken references** (blockers — cause silent failures in production)
2. **Fix `--border-subtle`** (debug red value)
3. **Replace `--md-*` tokens** (most referenced across components)
4. **Consolidate spacing scale** (affects every layout file)
5. **Rename short-code color aliases** → `--rux-*`
6. **Audit `--base-*` refs** → map to `--rux-gray-*`
7. **Migrate `--core-*`** → remove once all consumers updated
8. **Rename `--color-*` → `--rux-color-*`**
9. **Add `--rux-` prefix to `--surface-*`, `--border-*`, `--text-*`**
10. **Token-ify remaining components** (modals, dropdowns)

---

## Optical Radius Nesting

Optical radius nesting is the principle that nested elements must have proportionally smaller border radii to maintain visual harmony between their curved edges. Without it, a small element with a large radius inside a larger container looks like it's floating rather than belonging — the gap between curves reads as wrong to the eye.

### The Formula

```
r_inner = r_outer − gap
```

Where `gap` is the visual distance between the outer element's edge and the inner element's edge.

### The Gap Value for This App: 8px

Based on an audit of every structural container in the app, **8px is the consistent nesting gap**.

- It's `--rux-space-sm` — already the primary small spacing unit
- It's the dominant gap in headers (8px), dropdown menus (8px padding), toggle grids (0 8px), control rows, and form column gaps
- 16px appears as *internal body padding* inside containers, not as the optical gap between curves
- At depth 3–4, the gap halves to **4px** (`--rux-space-xs`) for micro-elements like badges

The scale is a clean halving sequence — every step is exactly `−8px` (or `−4px` at the micro level):

### The Rux Scale

```
Depth 0 │ --rux-radius-xl   24px │ Outermost: modals, pill buttons, floating cards
Depth 1 │ --rux-radius-lg   16px │ Panels, cards              (24 − 8)
Depth 2 │ --rux-radius-md    8px │ Controls: buttons, inputs  (16 − 8)
Depth 3 │ --rux-radius-sm    4px │ Nested controls            ( 8 − 4)
Depth 4 │ --rux-radius-xs    2px │ Atoms: badges, chips       ( 4 − 2)
        │ --rux-radius-pill 9999px│ Full pill
        │ --rux-radius-none   0px │ Square
```

**Rule of thumb:** Every time you nest something with 8px of visible gap, step down one level in the scale. Every time you nest with 4px of visible gap, step down one level at the micro end.

### Semantic Aliases (use these in component CSS)

| Token | Maps to | Use for |
|---|---|---|
| `--rux-radius-overlay` | `--rux-radius-xl` | Modals, sheets, popovers |
| `--rux-radius-surface` | `--rux-radius-lg` | Cards, panels, sidebars |
| `--rux-radius-section` | `--rux-radius-md` | Grouped sections inside cards |
| `--rux-radius-control` | `--rux-radius-sm` | Inputs, selects, toolbar buttons |
| `--rux-radius-badge` | `--rux-radius-xs` | Chips, tags, mini-badges |
| `--rux-radius-button` | `--rux-radius-xl` | Pill/squircle buttons |

### Usage Example

```css
/* A card panel (depth 1) */
.card {
  border-radius: var(--rux-radius-surface);   /* 16px */
  padding: 12px;
  corner-shape: squircle;
}

/* A section grouped inside the card (depth 2) */
.card__section {
  border-radius: var(--rux-radius-section);   /* 10px — 16 minus ~6px gap */
  corner-shape: squircle;
}

/* An input inside the section (depth 3) */
.card__section input {
  border-radius: var(--rux-radius-control);   /* 6px — 10 minus ~4px gap */
}

/* A badge inside the input (depth 4) */
.badge {
  border-radius: var(--rux-radius-badge);     /* 3px — 6 minus ~3px gap */
}
```

### Squircle + Optical Nesting Together

Pair `corner-shape: squircle` with any radius value to get the Apple superellipse curve instead of a circular arc. The optical nesting scale works identically — the formula is the same, just the curve shape differs:

```css
border-radius: var(--rux-radius-surface);  /* controls the size */
corner-shape: squircle;                    /* controls the curve shape */
```

Apply `corner-shape: squircle` consistently at all depth levels for visual coherence — mixing squircle and circular corners at different nesting levels looks inconsistent.

### Migration Checklist — Optical Radius

- [x] `--rux-radius-*` tokens defined in variables.css
- [x] `--rux-radius-button` applied in button.css
- [ ] Cards / panels → use `--rux-radius-surface`
- [ ] Modals → use `--rux-radius-overlay`
- [ ] Form inputs / selects → use `--rux-radius-control`
- [ ] Badges / chips / tags → use `--rux-radius-badge`
- [ ] Trip bar radius → audit and assign correct depth
- [ ] Dropdown menus → use `--rux-radius-surface`
- [ ] Replace remaining hardcoded `border-radius` values across all CSS files

---

## Conventions Quick Reference

```
Use oklch() for all color values (perceptually uniform, themeable)
Use --rux- prefix for Tier 1 and Tier 2 tokens only
Use component-name prefix for Tier 3 (e.g. --btn-, --tripbar-)
State suffixes:  -hover  -active  -focus  -disabled  -checked
Size suffixes:   -xs  -sm  -md  -lg  -xl
Scale numbers:   100 (lightest) → 900 (darkest)
Alpha variants:  append -alpha  (e.g. --rux-blue-500-alpha)
```

---

*Last updated: April 2026*
