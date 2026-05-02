# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

ETB Trip Schedule is a dispatch scheduling web app for Escamilla Tour Buses. It is a **pure static site** (no build step, no framework, no npm) backed by a **Google Apps Script** web app that reads/writes a Google Sheet.

## Running the app

Open `index.html` directly in a browser or serve with any static file server:

```sh
npx serve .
# or
python3 -m http.server 8080
```

There is no build step, no compilation, and no test suite.

## Formatting

Prettier is configured in `.prettierrc`. Run it with:

```sh
npx prettier --write .
```

## Architecture

### Frontend (`index.html`, `js/app.js`, `css/`)

Single-page app. All logic lives in `js/app.js`. The Google Apps Script endpoint is set in `CONFIG.ENDPOINT`. Data is fetched via **JSONP** (using a `?callback=` param) because the GAS web app is cross-origin and doesn't support CORS on all request types.

`css/main.css` is the single CSS entry point — it `@import`s all other stylesheets in load order.

### Backend (`docs/backend.md`)

The backend is a **Google Apps Script** project deployed as a web app. The source is kept in `backend.md` for reference and must be manually deployed in the Google Apps Script editor. It is **not** deployed from this repo.

- `doGet` handles reads: `weekData`, `listTrips`, `listDrivers`, `listBuses`, etc.
- `doPost` handles writes: `create`, `update`, `delete`, `uploadItineraryPdf`
- All write operations acquire a script lock and invalidate a 2-minute `CacheService` cache
- The primary data fetch is `weekData` — it returns trips + bus assignments + week notes + driver unavailability for a date range in one call

Google Sheets data model (sheet names and column headers) is defined in the `HEADERS` constant in `docs/backend.md`.

### CSS Design System (Rux UI)

Documented in full in `docs/RUX_UI.md`. The key rule:

**3-tier token architecture** — all tiers share the `--rux-` prefix. Component CSS must only reference Tier 3 tokens:

```
Tier 1  --rux-{category}-{key}      Primitives: raw oklch seeds and numeric scales
Tier 2  --rux-{category}-{n|role}   Semantics: surface levels, text/border/status roles
Tier 3  --rux-{comp}-{property}     Components: element-scoped, consume Tier 2 only
```

**Naming rules:**
- Use full readable words for category and property names — no arbitrary abbreviations
- One exception: `bg` for background (universally understood)
- Short component prefixes (`btn`, `fld`, `trp`) act as unique namespaces, not decoded words
- Use full color names in seeds: `blue`, `gray`, `red` (not `blu`, `gry`, `red`)

**Tier 1 — Primitives:**
```css
--rux-bg-blue, --rux-bg-gray, --rux-bg-red …   /* color seeds */
--rux-space-1  through --rux-space-7            /* 0.25rem → 1.5rem */
--rux-radius-1 through --rux-radius-4           /* 4px → 12px */
--rux-size-1   through --rux-size-8             /* 0.625rem → 1.5rem */
```

**Tier 2 — Semantics:**
```css
--rux-bg-1 through --rux-bg-5                  /* surface elevation (word vs number distinguishes seeds from surfaces) */
--rux-text-1, --rux-text-2, --rux-text-3, --rux-text-accent
--rux-border-1, --rux-border-2, --rux-border-3
--rux-status-error, --rux-status-success, --rux-status-warn
```

**Tier 3 — Components (examples):**
```css
--rux-btn-height, --rux-btn-radius, --rux-btn-padding
--rux-btn-font, --rux-btn-weight, --rux-btn-shadow
--rux-btn-bg-primary, --rux-btn-bg-secondary, --rux-btn-bg-danger

--rux-fld-height, --rux-fld-radius, --rux-fld-bg
--rux-fld-padding, --rux-fld-font, --rux-fld-shadow

--rux-trp-height, --rux-trp-radius, --rux-trp-bg
--rux-trp-border, --rux-trp-shadow
--rux-trp-row1-size, --rux-trp-row7-size, --rux-trp-row7-weight
```

Never reference Tier 1 tokens from component CSS. Use `oklch()` for all color values.

**Optical radius nesting** (also in `docs/RUX_UI.md`): nested elements step down one radius level per 8px of gap. Use semantic aliases `--rux-radius-overlay / radius-surface / radius-section / radius-control / radius-badge`, not raw numeric values. Pair with `corner-shape: squircle` for Apple-style superellipse curves.

### Known design system issues

The naming convention was finalized in May 2026 with a breaking change.

**Active convention:** `--rux-{category}-{key}` on all tiers, full readable words, `bg` for background. Tier 3 uses `--rux-{comp}-{property}` (e.g. `--rux-btn-height`, `--rux-trp-bg`, `--rux-fld-shadow`).

**Old convention (being phased out):** Tier 1/2 used long-form names (`--rux-surface-panel`, `--rux-font-size-4`, `--rux-space-3`). Tier 3 had no `--rux-` prefix (`--tripbar-height`, `--btn-background`, `--field-bg`). Some tokens used `bkg` instead of `bg`.

`css/variables.css` and all component CSS files still use old-convention names. `docs/RUX_UI.md` naming examples also reflect the old convention and will need a parallel update.
