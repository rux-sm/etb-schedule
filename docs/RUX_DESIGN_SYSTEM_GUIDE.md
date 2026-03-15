# Rux Design System Guide

Generated: 2026-03-14
Status: Working guide while the system is being simplified and defined
Scope: UI structure, naming, ownership, and styling standards for this app

## Panel/Card Shell Current Standard

The panel/card migration is complete. Use this section as the live standard.

### Current canonical classes

- layout objects
  - `o-app-layout`
  - `o-app-layout__main`
  - `o-app-layout__sidebar`
  - `o-app-layout__sidebar--left`
  - `o-app-layout__sidebar--right`

- card components
  - `c-card`
  - `c-card--compact`
  - `c-card__title`
  - `c-card__body`
  - `c-card__footer`

- utilities
  - `u-hidden`
  - `u-mobile-only`
  - `u-scroll-y`
  - `u-w-full`
  - `u-px-0`
  - `u-mt-0`
  - `u-text-danger`

- states
  - `is-hidden`
  - `is-active`
  - `is-collapsed`

- behavior hooks
  - `data-js="layout-panels"`
  - `data-js="panel-sidebar-left"`
  - `data-js="panel-sidebar-right"`
  - `data-js="panel-card-left-placeholder"`
  - `data-js="panel-card-quote"`
  - `data-js="panel-card-drivers"`
  - `data-js="panel-card-notes"`
  - `data-js="panel-card-trip-info"`
  - `data-js="trip-form"`
  - `data-js="trip-requirements-section"`
  - `data-js="trip-assignments-section"`
  - `data-js="trip-envelope-section"`
  - `data-js="trip-bus-grid"`
  - `data-js="driver-week-head-row"`
  - `data-js="driver-week-body"`
  - `data-js="quote-dynamic-days"`
  - `data-js="schedule-main-card"`
  - `data-js="schedule-agenda-header"`
  - `data-js="schedule-grid-wrap"`
  - `data-js="schedule-grid-table"`
  - `data-js="schedule-agenda-body"`
  - `data-js="schedule-waiting-body"`
  - `data-js="schedule-conflict-badge"`
  - `data-js="schedule-conflict-list"`
  - `data-js="schedule-conflict-panel"`

### Current app layer trees

Use separate trees for the major layers of the app instead of one oversized tree. This keeps the document readable and makes it easier to update when one area changes.

#### 1) App shell tree

```text
body
└── .app
  ├── .c-header.c-header--app
  │   ├── .app-header__branding
  │   └── .c-header__actions
  └── main.main
    └── .container
      └── .o-app-layout[data-js="layout-panels"]
```

#### 2) Workspace tree

```text
.o-app-layout[data-js="layout-panels"]
├── .o-app-layout__sidebar.o-app-layout__sidebar--left.is-collapsed[data-js="panel-sidebar-left"]
│   └── .c-card#leftPanelCard1[data-js="panel-card-left-placeholder"]
├── .o-app-layout__sidebar.o-app-layout__sidebar--right.is-collapsed[data-js="panel-sidebar-right"]
│   ├── .c-card.quote-calculator#quoteCard[data-js="panel-card-quote"]
│   ├── .c-card#driverWeekCard[data-js="panel-card-drivers"]
│   ├── .c-card#notesCard[data-js="panel-card-notes"]
│   └── .c-card#tripInfoCard[data-js="panel-card-trip-info"]
└── .o-app-layout__main
  └── .c-card[data-js="schedule-main-card"]
```

#### 3) Main schedule tree

```text
.o-app-layout__main
└── .c-card[data-js="schedule-main-card"]
  ├── .schedule-badge-wrap
  │   └── #overflowBadge.badge[data-js="schedule-conflict-badge"]
  ├── .agenda-header[data-js="schedule-agenda-header"]
  │   └── .c-header.c-header--schedule
  │       ├── .agenda-header__date-left
  │       └── .c-header__actions
  ├── .schedule-grid-container[data-js="schedule-grid-wrap"]
  │   └── table.schedule-grid[data-js="schedule-grid-table"]
  │       ├── colgroup
  │       ├── thead
  │       ├── tbody#agendaBody[data-js="schedule-agenda-body"]
  │       └── tbody#waitingBody[data-js="schedule-waiting-body"]
  └── #conflictPanel.c-card.schedule-grid__conflict-panel.is-hidden[data-js="schedule-conflict-panel"]
    ├── .c-header.c-header--panel
    │   ├── .c-header__title
    │   └── .c-header__actions > .badge
    └── .c-card__body
        └── #conflictList.help[data-js="schedule-conflict-list"]
```

#### 4) Overlay and modal tree

```text
body
├── #loadingOverlay.loading-overlay
│   ├── .loading-overlay__backdrop
│   └── .loading-overlay__card
├── #toastBackdrop.toast-backdrop
├── #toast.toast
│   ├── .toast-row
│   └── .toast-progress
├── .modal families
│   ├── #itineraryModal.modal.modal--itinerary
│   ├── #tripDetailsModal.modal.modal--trip-details
│   ├── #nextDayReportModal.modal.modal--trip-details
│   ├── #dailyMaintenancePlanModal.modal.modal--trip-details
│   ├── #driverContactModal.modal.modal--itinerary
│   ├── #envelopeModal.modal.modal--envelope
│   └── #quoteInfoModal.modal
├── #tripContextMenu.context-menu
├── #cellContextMenu.context-menu
├── #itineraryPdfInput.sr-file-input
└── #printRoot.is-hidden
```

#### 5) Modal shell pattern

```text
.modal
├── .modal__backdrop
└── .modal__card
  ├── .c-header.c-header--modal
  ├── .modal__body
  └── .modal__foot
```

This is the preferred visualization pattern for the guide:

- Use one tree for the permanent app shell
- Use one tree for the workspace region inside `o-app-layout`
- Use one focused tree for the main schedule because it is the core working surface
- Keep overlays and modals in a separate tree because they are siblings of the app shell, not children of the workspace

### Current ownership rules

- `css/layout.css`
  - object-level layout flow, responsive shell behavior, flex/grid sizing, overflow mechanics

- `css/components/_primitives.css`
  - shared card and header primitives

- `css/components/_schedule.css`
  - schedule-specific visuals, schedule toolbar, grid styling, schedule-context overrides

- `css/components/_modals.css`
  - modal shells and modal-specific internals

- `css/base.css`
  - resets, global utilities, print/global exceptions

### Current behavior rule

- Style with classes
- Target behavior with `data-js`
- Avoid ID selectors for CSS
- Use IDs only when unique document identity is required

### Scrollbar policy

- Vertical scrollbars should be visually hidden across app surfaces while preserving wheel and touchpad scrolling.
- Horizontal scrollbars remain visible only where horizontal panning is a core interaction.
- Main schedule wrappers are horizontal-first containers with vertical scrolling still enabled for wheel behavior.
- Do not re-introduce browser-specific thin scrollbar overrides for containers that are intended to hide vertical rails.

Approved horizontal scrollbar surfaces:

- `schedule-grid-container`
- `driver-week__wrap`

Common vertical-scroll surfaces with hidden rails:

- sidebar card bodies (`.c-card__body` inside sidebars)
- modal bodies (`.modal__body`)
- trip details itinerary blocks (`.trip-details__itinerary-scroll`)
- conflict panel body (`.schedule-grid__conflict-panel .c-card__body`)
- bus-grid dropdown menus (`#busGrid .select-dropdown .dropdown__menu`)

Ownership:

- global scrollbar visuals and rail hiding: `css/base.css`
- layout overflow mechanics: `css/layout.css`
- schedule-specific wrapper overflow: `css/components/_schedule.css`
- modal/detail overflow behavior: `css/components/_modals.css`

### Historical note

The old dual-class migration plan is complete and is no longer the working standard. Keep future edits on the canonical `o-`, `c-`, `u-`, and `is-` system above.

## Rux Interaction Standards

These are the standards to keep across the app.

### Header Rows

- Default header height: `48px`
- Header content should align vertically centered
- Header title and actions should live on one row
- Avoid extra top/bottom margin on titles inside headers

### Action Buttons

- Default header action target: `48px x 48px`
- Icon-only toolbar buttons may use `32px` when clearly secondary
- Focus states must be obvious
- Hover and active states should be subtle and consistent

### Spacing

Use a small spacing scale and stay on it.

Recommended base scale:

- `--space-xs: 4px`
- `--space-sm: 8px`
- `--space-md: 12px`
- `--space-lg: 16px`
- `--space-xl: 24px`
- `32px` is allowed as an exceptional large layout spacing, not a default everyday step

Default preferences:

- Inner component padding: `var(--space-lg)`
- Tight gaps: `var(--space-xs)` or `var(--space-sm)`
- Standard row gap: `var(--space-sm)`
- Section gap: `var(--space-lg)`

### Typography

- Typography belongs to components and content blocks, not generic layout shells
- Header titles should be explicit, not inherited from wrappers
- Body text should be set at the component/content level
- Avoid setting font color and font size on generic containers unless truly global

### Borders and Surfaces

- Use borders to separate shells and sections
- Use surface changes sparingly to indicate hierarchy
- Avoid decorative color decisions in layout objects

## Naming Standard

### Recommended New System

Use this for future additions and refactors.

#### Header primitive

- `c-header`
- `c-header__title`
- `c-header__actions`
- `c-header__action`

Variants:

- `c-header--app`
- `c-header--panel`
- `c-header--schedule`
- `c-header--modal`

#### Card primitive

- `c-card`
- `c-card__header`
- `c-card__body`
- `c-card__footer`

#### Modal primitive

- `c-modal`
- `c-modal__backdrop`
- `c-modal__card`
- `c-modal__head`
- `c-modal__body`
- `c-modal__foot`

#### Layout objects

- `o-app-layout`
- `o-app-layout__main`
- `o-app-layout__sidebar`

### Legacy-to-Canonical Reference

Migration is complete. Keep this as historical reference only when reading old diffs or old docs.

Examples:

- `cds-header` -> `c-header c-header--app`
- `panel-header` -> `c-header c-header--panel`
- `agenda-header` -> `c-header c-header--schedule`
- `modal__head` -> `c-header c-header--modal`
- `card` -> `c-card`
- `card__content` -> `c-card__body`

## Ownership Standard

Each class family should have one primary owner file.

The current repo intentionally uses a mixed file naming pattern:

- top-level CSS entry files are not underscored
- imported component partials inside `css/components/` are underscored

Do not change the guide to a different file naming convention unless the actual repo files are renamed to match.

### Primary owners in this repo

- `css/layout.css`
  - object/layout mechanics only

- `css/components/_primitives.css`
  - shared UI primitives
  - cards
  - shared panel header primitive
  - loading and toast

- `css/components/_schedule.css`
  - app top header
  - schedule header
  - schedule grid
  - sidebar context styling for schedule-side panels

- `css/components/_modals.css`
  - modal shell
  - modal variants
  - modal-specific content blocks

- `css/base.css`
  - resets
  - global plumbing
  - print-only overrides
  - legacy shared utilities until re-homed

## What Belongs Where

### Put a rule in `layout.css` when it changes:

- grid columns
- flex direction
- width and height behavior
- overflow strategy
- collapse/expand layout mechanics
- element ordering

### Put a rule in a component file when it changes:

- component appearance
- title styling
- action alignment
- component padding
- content spacing
- borders specific to that component

### Put a rule in a context owner file when:

- the component is shared
- the override only exists because of where the component is used

Example:

- a shared panel header should not own sidebar-only bottom spacing
- sidebar context should own that spacing

## Header Standard

Headers are the most repeated pattern in this app. Treat them as a system.

### Shared header primitive should define:

- row height
- horizontal padding
- title/action alignment
- action sizing
- focus and hover behavior

### Variants should define:

- surface/background
- border treatment
- title tone/weight
- variant-specific spacing
- unique internal layout pieces

### Variant responsibilities

- App header
  - owns branding, logo, shell look

- Panel header
  - owns generic card panel title/action row

- Schedule header
  - owns pagination, date block, toolbar controls

- Modal header
  - owns modal title row only

## Token Standard

Keep tokens small and practical.

Add tokens only when they are reused enough to matter.

### Recommended token groups

- Header sizes
  - `--size-header-row: 48px`
  - `--size-header-action: 48px`
  - `--size-toolbar-action: 32px`

- Spacing
  - `--space-xs: 4px`
  - `--space-sm: 8px`
  - `--space-md: 12px`
  - `--space-lg: 16px`
  - `--space-xl: 24px`

- Layout
  - `--panel-width`
  - `--layout-panel-gap`

- Surfaces and borders
  - existing surface and border tokens should remain the source of truth

### Avoid token bloat

Do not create tokens for values used only once unless they are part of a planned system.

## Cleanup Strategy

Use this order for future cleanup and standardization work.

1. Fix ownership first

- Move misplaced rules to their correct owner file

2. Neutralize shared shells

- Remove typography and context spacing from generic primitives

3. Reapply styles at the correct level

- Add typography and spacing back in component or context owners

4. Extend shared primitives carefully

- Reuse the existing `c-header`, `c-card`, and modal shell patterns before adding new one-off structures

5. Remove stale legacy references

- Delete dead selectors, dead docs guidance, and outdated examples once replacements are live

6. Keep behavior and styling separate

- Put styling on classes and behavior on `data-js` hooks

## Decision Rules

Before adding a new class or rule, ask:

1. Is this structural or visual?
2. Is this shared or context-specific?
3. Which file should own this long term?
4. Am I solving a one-off need that should instead become a primitive?

## Anti-Patterns To Avoid

- Styling generic shells with typography that leaks everywhere
- Putting visual skin in layout objects
- Using a shared primitive to solve one specific page context
- Adding new one-off classes when a variant would be cleaner
- Splitting one class family across multiple files without a clear reason
- Renaming classes before ownership and behavior are stable

## Practical Standard For This Project

Follow this rule set moving forward:

- Carbon-inspired layout discipline
- Custom class naming for clarity
- One owner per class family
- Shared primitives for repeated UI patterns
- Context files for local overrides only
- Incremental migration, not a rewrite

## Related Docs

- Audit and owner mapping: `docs/HEADER_CONTAINER_AUDIT.md`
- Full class matrix: `docs/HEADER_CONTAINER_AUDIT_FULL.csv`
