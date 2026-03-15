# Current Header and Container Architecture

Generated: 2026-03-14
Scope: current live HTML, CSS, and JS hook structure

## Deliverables

- Full matrix (historical extraction dataset): docs/HEADER_CONTAINER_AUDIT_FULL.csv
- Raw extraction dataset (historical JSON): docs/\_header_container_audit_data.json

## Current Header Layer Stacks

1. Global site header

- Stack: `c-header c-header--app` -> `app-header__branding` + `c-header__actions` -> `c-header__action`

2. Side card panel headers

- Stack: `c-card` -> `c-header c-header--panel` -> `c-header__title` (+ optional `c-header__actions` / `c-header__action`)

3. Schedule header

- Stack: `agenda-header[data-js="schedule-agenda-header"]` -> `c-header c-header--schedule` -> `agenda-header__date-left` + `c-header__actions`

4. Schedule day headers

- Stack: `schedule-grid__header-cell` -> `schedule-grid__day-label` -> `schedule-grid__day-date` + `schedule-grid__day-name`

5. Modal headers

- Stack: `modal` -> `modal__card` -> `c-header c-header--modal`

6. Context menu headers

- Stack: `context-menu` -> `context-menu__header`

## Current Container and Layer Stacks

1. App shell

- `main` -> `container` -> `o-app-layout[data-js="layout-panels"]`
- `o-app-layout__sidebar--left` + `o-app-layout__main` + `o-app-layout__sidebar--right`

2. Card shell

- `c-card` + `c-card--compact`
- `c-header` + `c-card__body` + `c-card__footer`

3. Main schedule shell

- `o-app-layout__main`
- `c-card[data-js="schedule-main-card"]`
- `schedule-badge-wrap` + `#overflowBadge[data-js="schedule-conflict-badge"]`
- `agenda-header[data-js="schedule-agenda-header"]`
- `schedule-grid-container[data-js="schedule-grid-wrap"]`
- `table.schedule-grid[data-js="schedule-grid-table"]`
- `tbody#agendaBody[data-js="schedule-agenda-body"]`
- `tbody#waitingBody[data-js="schedule-waiting-body"]`
- `#conflictPanel.schedule-grid__conflict-panel[data-js="schedule-conflict-panel"]`
- `#conflictList[data-js="schedule-conflict-list"]`

4. Overlay shell

- `loading-overlay` + `loading-overlay__backdrop` + `loading-overlay__card`
- `toast` + `toast-progress` + `toast-progress__inner`
- `modal` + `modal__backdrop` + `modal__card` + `modal__body` + `modal__foot`

## Current Standard Summary

- Canonical structure prefixes are live: `o-`, `c-`, `u-`, `is-`
- Layout mechanics are owned by `css/layout.css`
- Shared primitives are owned by `css/components/_primitives.css`
- Schedule-specific visuals are owned by `css/components/_schedule.css`
- Modal system is owned by `css/components/_modals.css`
- Schedule/layout JS roots are targeted through `data-js` hooks, not styling classes

## Live Hook and Naming Policy

- Use classes for styling
- Use `data-js` for behavior targeting
- Use IDs only when document-unique identity is truly required
- Avoid ID selectors in CSS
- Avoid ID-dependent JS where a class or `data-js` hook is sufficient

## Validation Status

- Header migration is complete in live app code
- Panel/card migration is complete in live app code
- The layout shell no longer depends on `id="layoutPanels"`; the live behavior hook is `data-js="layout-panels"`

## Current Working Standard

### 1) Structure and Ownership

- Keep `css/layout.css` structural only: grid/flex, sizing, overflow, positioning, responsive shell behavior
- Keep component visuals in their component owner files
- Keep `data-js` hooks out of CSS styling rules

### 2) Shared vs Unique Guidance

Shared primitives:

- Header action button geometry/states
- Header title + actions row skeleton
- Card shell (`c-card`, `c-card__body`, `c-card__footer`)
- Modal shell (`modal`, `modal__backdrop`, `modal__card`, `modal__body`, `modal__foot`)
- App layout shell (`o-app-layout` and core children)

Unique variants:

- App top branding composition
- Schedule-specific week/date controls and formatting
- Modal variant internals
- Context menu content and behavior
- Schedule table and day-header internals

### 3) Naming System

- `o-` objects: structural wrappers only
- `c-` components: UI blocks and variants
- `u-` utilities: one-purpose helpers
- `is-` states: toggled state classes

Header family:

- `c-header`
- `c-header__title`
- `c-header__actions`
- `c-header__action`
- `c-header--app`
- `c-header--panel`
- `c-header--schedule`
- `c-header--modal`

Container examples:

- `o-app-layout`, `o-app-layout__main`, `o-app-layout__sidebar`
- `c-card`, `c-header`, `c-card__body`, `c-card__footer`
- `u-hidden`, `u-w-full`, `u-text-danger`

### 4) Canonical Owner Map

Header families:

- `app-header__branding` / `app-header__logo-wrap` / `app-header__title`
  - Primary owner: `css/components/_schedule.css`

- `c-header--panel` + `c-header__*`
  - Primary owner: `css/components/_primitives.css`

- `agenda-header*`
  - Primary owner: `css/components/_schedule.css`
  - Secondary owner: `css/base.css` for print-mode overrides only

- `c-header--modal`
  - Primary owner: `css/components/_modals.css`

- `context-menu__header`
  - Primary owner: `css/base.css`

Container and shell families:

- `o-app-layout*`
  - Primary owner: `css/layout.css`

- `c-card*`
  - Primary owner: `css/components/_primitives.css`

- `modal*`
  - Primary owner: `css/components/_modals.css`

- `schedule-grid*`
  - Primary owner: `css/components/_schedule.css`
  - Secondary owner: `css/base.css` for print-only table output

- `loading-overlay*` and `toast*`
  - Primary owner: `css/components/_primitives.css`

### 5) Working Rules of Thumb

- If the rule changes layout mechanics, it belongs in `css/layout.css`
- If the rule changes a reusable UI block, it belongs in that component file
- If the rule only exists because a component sits inside a specific area, put it in the area owner file
- If a selector only exists for print mode, keep it in `css/base.css` or a dedicated print section
