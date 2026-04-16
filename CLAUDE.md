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

### Frontend (`index.html`, `app.js`, `css/`)

Single-page app. All logic lives in `app.js`. The Google Apps Script endpoint is set in `CONFIG.ENDPOINT`. Data is fetched via **JSONP** (using a `?callback=` param) because the GAS web app is cross-origin and doesn't support CORS on all request types.

`css/main.css` is the single CSS entry point — it `@import`s all other stylesheets in load order.

### Backend (`backend.md`)

The backend is a **Google Apps Script** project deployed as a web app. The source is kept in `backend.md` for reference and must be manually deployed in the Google Apps Script editor. It is **not** deployed from this repo.

- `doGet` handles reads: `weekData`, `listTrips`, `listDrivers`, `listBuses`, etc.
- `doPost` handles writes: `create`, `update`, `delete`, `uploadItineraryPdf`
- All write operations acquire a script lock and invalidate a 2-minute `CacheService` cache
- The primary data fetch is `weekData` — it returns trips + bus assignments + week notes + driver unavailability for a date range in one call

Google Sheets data model (sheet names and column headers) is defined in the `HEADERS` constant in `backend.md`.

### CSS Design System (Rux UI)

Documented in full in `RUX_UI.md`. The key rule:

**3-tier token architecture** — all component CSS must only reference Tier 3 tokens:

```
Tier 1  --rux-{palette}-{scale}     Raw palette, oklch color values
Tier 2  --rux-surface-*, --rux-color-*, --rux-text-*, --rux-border-*    Semantic roles
Tier 3  --{component}-{property}    Component tokens (no --rux- prefix)
```

Never reference Tier 1 tokens directly from component CSS. Use `oklch()` for all color values.

**Optical radius nesting** (also in `RUX_UI.md`): nested elements step down one radius level per 8px of gap between outer and inner element edges. Use `--rux-radius-overlay/surface/section/control/badge` semantic aliases, not raw values. Pair with `corner-shape: squircle` for Apple-style superellipse curves.

### Known design system issues

`RUX_UI.md` tracks outstanding token migration work. Key blockers: broken `--blu`, `--base-*`, and `--wald-05` references in `variables.css`; a debug `--border-subtle: rgb(255,0,0)` value still in place; legacy `--md-*`, `--core-*`, and short-code color aliases (`--gra`, `--red`, etc.) not yet migrated to `--rux-*`.
