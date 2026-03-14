# Header and Container Audit (Second Pass)

Generated: 2026-03-13
Scope: index.html and css/\*_/_.css

## Deliverables

- Full matrix (all classes, usage counts, HTML lines, CSS files, CSS lines): docs/HEADER_CONTAINER_AUDIT_FULL.csv
- Raw extraction dataset (JSON): docs/\_header_container_audit_data.json

## Header Layer Stacks

1. Global site header

- HTML root: index.html:29
- Stack: cds-header -> cds-header**branding + cds-header**actions -> cds-header\_\_action

2. Side card panel headers

- HTML roots: index.html:107, index.html:120, index.html:350, index.html:371, index.html:394
- Stack: card -> panel-header -> panel-header**title (+ optional panel-header**actions / panel-header\_\_action)

3. Schedule header

- HTML root: index.html:709
- Stack: agenda-header -> agenda-header**inner + card**header -> agenda-header**date-left + agenda-header**nav-right

4. Schedule day headers (table head)

- HTML roots: index.html:759 to index.html:806
- Stack: schedule-grid**header-cell -> schedule-grid**day-label -> schedule-grid**day-date + schedule-grid**day-name

5. Modal headers

- HTML roots: index.html:872, index.html:896, index.html:917, index.html:942, index.html:968, index.html:1101
- Stack: modal -> modal**card -> modal**head

6. Context menu headers

- HTML roots: index.html:1050, index.html:1089
- Stack: context-menu -> context-menu\_\_header

## Container and Layer Stacks

1. App shell

- main -> container -> app-layout
- app-layout**sidebar--left + app-layout**main + app-layout\_\_sidebar--right

2. Card shell

- card + card--compact
- card**header + card**content + card\_\_footer

3. Overlay shell

- loading-overlay + loading-overlay**backdrop + loading-overlay**card
- toast + toast-progress + toast-progress\_\_inner
- modal + modal**backdrop + modal**card + modal**body + modal**foot

## Shared vs Unique Summary

- Total audited classes in full dataset: 93
- Reused heavily in HTML (shared components): card, modal, modal**\*, panel-header, context-menu**item, schedule-grid\_\_header-cell
- Cross-file CSS ownership (higher maintenance risk): app-layout*, schedule-grid*, card**content, loading-overlay, agenda-header**week-date

## Classes Present in HTML With No Direct Class Selector Match in CSS

- card-title (index.html:818)
- cds-header\_\_action--mobile (index.html:55)
- modal\_\_card--details (index.html:895,916,941,966)
- schedule-badge-wrap (index.html:702)
- toast-backdrop (index.html:853)
- toast-icon (index.html:858)
- toast-row (index.html:857)

Note: some of the above may still be styled indirectly through parent, type, or compound selectors. The full CSV includes CSS hit lines for all classes and is the authoritative mapping.

## Validation

- Duplicate ID scan: none found in index.html.

---

## Proposed Refactor Plan (For Maintainability)

This section is intentionally separate from the audit inventory above. The sections above describe current state. This section describes suggested future state.

### 1) First Cleanup Moves (No Renames Yet)

1. Move misplaced ownership rules

- Move `cds-header__action--hidden` out of `css/components/_modals.css` into the schedule/header owner file (`css/components/_schedule.css`) or a utility layer.

2. Separate object/layout from component visuals

- Keep `css/layout.css` structural only (grid/flex, sizing, overflow, positioning).
- Move visual skin rules (backgrounds, border cosmetics, typography polish) from layout objects into component files.

3. Reduce global typography on shells

- Avoid broad content typography defaults on `card__content` unless truly universal.
- Move text sizing/color rules down to component-specific bodies where possible.

### 2) Shared vs Unique Guidance

Shared primitives (should be standardized and reused):

- Header action button geometry/states (`48x48`, hover/active/focus behavior)
- Header title + actions row skeleton
- Card shell (`card`, `card__header`, `card__content`, `card__footer`)
- Modal shell (`modal`, `modal__backdrop`, `modal__card`, `modal__head`, `modal__body`, `modal__foot`)
- App layout shell (`app-layout` and core children)

Unique variants (should remain scoped):

- App top branding composition (logo/divider/title)
- Schedule-specific week/date controls and formatting
- Modal variant internals (trip details, itinerary, envelope)
- Context menu content and behavior
- Schedule table and header cell internals

### 3) Suggested Naming System (Incremental)

Use layered prefixes to reduce ambiguity:

- `o-` objects: structural wrappers only
- `c-` components: UI blocks and variants
- `u-` utilities: one-purpose overrides/helpers
- `is-` states: toggled state classes

Proposed header family:

- `c-header` (shared primitive)
- `c-header__title`
- `c-header__actions`
- `c-header__action`
- `c-header--app` (top shell header)
- `c-header--panel` (side card headers)
- `c-header--schedule` (schedule toolbar)
- `c-header--modal` (modal heading row)

Container/layer examples:

- `o-app-layout`, `o-app-layout__main`, `o-app-layout__sidebar`
- `c-card`, `c-card__header`, `c-card__body`, `c-card__footer`
- `c-modal`, `c-modal__backdrop`, `c-modal__card`, `c-modal__head`, `c-modal__body`, `c-modal__foot`
- `u-hidden`, `u-mobile-only`, `u-scroll-lock`

### 4) Migration Order (Low Risk)

1. Ownership cleanup first

- Re-home misfiled rules and remove obvious wrong-level styling.

2. Introduce shared header primitive

- Add base header styles without removing current classes.

3. Dual-class transition

- Add new classes in HTML alongside existing classes; keep behavior unchanged.

4. Migrate one header family at a time

- App header -> panel headers -> schedule header -> modal headers.

5. Remove legacy selectors last

- Only after visual parity and interaction tests pass.

### 5) Quick Wins Checklist

- [x] Move `cds-header__action--hidden` to header owner file
- [x] Identify and move layout-level visual styles to component files
- [x] Document one canonical owner file per class family (`cds-header*`, `panel-header*`, `agenda-header*`, `modal*`, `card*`)
- [x] Define shared header primitive tokens (height, spacing, font size, action hit area)
- [x] Start dual-class migration for one smallest header family first

Progress note:

- `panel-header*` legacy classes/selectors were removed from HTML and core styles; `c-header--panel` is now canonical.
- App topbar action aliases (`cds-header__actions` and `cds-header__action`) were retired from HTML/CSS; `c-header__actions` and `c-header__action` now drive app actions.
- `modal__head` legacy fully removed from HTML, CSS, and JS print rule; `c-header--modal` is now canonical.
- `agenda-header__inner` legacy fully removed from HTML, CSS (schedule + base print), and JS print selectors; `c-header--schedule` is now canonical.
- `cds-header__branding/logo/title` branding classes renamed to `app-header__branding/logo-wrap/logo-img/title` in HTML and CSS.
- `cds-header` root class retired; unique properties (sticky, z-index, background, border) moved into `.c-header--app` variant block.
- `cds-header__action--hidden` replaced with `u-hidden` utility (defined in `base.css`); `cds-header__action--mobile` marker removed.
- Orphaned `card__header` / `card__header-actions` CSS rules removed from `_primitives.css` (no live HTML or JS use).
- **All `cds-header*` references fully purged from HTML and CSS.**

### 6) Canonical Owner Map

Use this map as the default rule for future edits. A class family should have one primary owner file. Cross-file rules should be limited to print/media/state overrides.

#### Header families

- `app-header__branding` / `app-header__logo-wrap` / `app-header__title`
  - Primary owner: `css/components/_schedule.css`
  - Allowed secondary owners: `css/base.css` print overrides, `css/layout.css` responsive hides
  - Notes: top shell branding belongs here; `cds-header` fully retired, canonical is `c-header c-header--app`

- `c-header--panel` + `c-header__*`
  - Primary owner: `css/components/_primitives.css`
  - Allowed secondary owners: component owner files for context spacing only
  - Notes: canonical panel header family (legacy `panel-header*` retired)

- `agenda-header*`
  - Primary owner: `css/components/_schedule.css`
  - Allowed secondary owners: `css/base.css` for print-mode overrides only
  - Notes: all schedule-toolbar layout, controls, and date presentation should stay together

- `modal__head` and modal header title patterns
  - Primary owner: `css/components/_modals.css`
  - Allowed secondary owners: variant rules in the same file only
  - Notes: modal heading spacing and title treatment should not leak into shared card headers

- `context-menu__header`
  - Primary owner: `css/base.css`
  - Allowed secondary owners: none unless context menus move into a dedicated component file later

#### Container and shell families

- `app-layout*`
  - Primary owner: `css/layout.css`
  - Allowed secondary owners: component files for visual skin applied within layout contexts
  - Notes: keep structural only in layout where possible: grid, flex, width, height, overflow, ordering, collapsing

- `card*`
  - Primary owner: `css/components/_primitives.css`
  - Allowed secondary owners: component files for content-specific padding, typography, and context-only spacing
  - Notes: `card`, `card__header`, `card__content`, `card__footer` stay generic and reusable

- `modal*`
  - Primary owner: `css/components/_modals.css`
  - Allowed secondary owners: none outside print/global overlay exceptions
  - Notes: base modal wrapper, card shell, head/body/foot, and modal variants belong together

- `schedule-grid*`
  - Primary owner: `css/components/_schedule.css`
  - Allowed secondary owners: `css/base.css` for print-only table output
  - Notes: interactive schedule styling should not move into layout

- `loading-overlay*` and `toast*`
  - Primary owner: `css/components/_primitives.css`
  - Allowed secondary owners: `css/base.css` only for true global stacking/print resets if needed
  - Notes: these are global UI components, not schedule-specific shells

#### Ownership Rules of Thumb

- If the rule changes layout mechanics, it belongs in `css/layout.css`.
- If the rule changes a reusable UI block, it belongs in that component file.
- If the rule only exists because a component is inside a specific area, put it in the area owner file, not the shared primitive.
- If a selector only exists for print mode, keep it in `css/base.css` or move it to a dedicated print section later.

