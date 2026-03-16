# Rux Design System Guide

Generated: 2026-03-14
Status: Baseline finalized for current app scope (Phases 1-6 complete)
Current Version: v0.9.0 (source: `app.js` -> `CONFIG.APP_VERSION`)
Scope: UI structure, naming, ownership, and styling standards for this app

## System Feature Snapshot (Current)

Use this as the quick reference for what the Rux system currently delivers in the live app.

- Layout architecture
  - Three-region workspace shell: left sidebar, main schedule surface, right sidebar
  - Canonical layout objects: `o-app-layout*`
  - Collapse/expand panel behavior driven by state classes and `data-js` hooks

- Primitive components
  - Header system with variants: app, panel, schedule, modal
  - Card shell system for schedule panels and work surfaces
  - Modal shell system standardized to backdrop/card/header/body/footer

- Schedule surface
  - Agenda header with week navigation and toolbar actions
  - Schedule grid with sticky headers and bus/day structure
  - Conflict badge and conflict panel integration

- Sidebar feature cards
  - Quote calculator card
  - Driver assignment card
  - Weekly notes card
  - Trip editor card

- Token system
  - Spacing scale (`--space-xs` to `--space-xl`)
  - Header/action size tokens (`--size-header-row`, `--size-header-action`, `--size-toolbar-action`)
  - Layout tokens (`--panel-width`, `--layout-panel-gap`)
  - Surface/border/text tokens driven by `variables.css`

- Behavior contract
  - Styling on classes
  - Behavior on `data-js`
  - IDs reserved for unique DOM identity, JS targeting, and accessibility labeling

- Scroll behavior
  - Vertical rails hidden on approved surfaces while preserving wheel/trackpad scroll
  - Horizontal rails intentionally visible on schedule and driver-week wrappers

- Accessibility behavior
  - Visible keyboard focus treatment for header and toolbar actions
  - Modal Escape close support
  - Modal focus return to opener
  - Modal Tab loop focus trapping for open dialog context

- Print and reporting
  - Print surfaces for schedule and envelope/report workflows
  - Modal print contexts hide non-print shell chrome

## Quick Onboarding Checklist

Use this checklist before opening a PR that touches UI.

- Use canonical class families only: `o-*`, `c-*`, `u-*`, `is-*`
- Keep behavior targeting on `data-js` hooks, not styling selectors
- Put structural flow/sizing/overflow rules in `css/layout.css`
- Put shared primitives in `css/components/_primitives.css`
- Put schedule and sidebar context visuals in `css/components/_schedule.css`
- Put modal shell and modal-specific internals in `css/components/_modals.css`
- Keep global resets, utilities, and print/global exceptions in `css/base.css`
- Use the spacing scale (`--space-xs` to `--space-xl`) before introducing one-off values
- Reuse header/card/modal shell patterns before creating one-off structures
- Keep focus states visible for keyboard users on all interactive controls
- For modal flows: support Escape close, focus return to opener, and Tab loop trap
- Keep vertical rails hidden only on approved surfaces; preserve wheel/trackpad scroll
- Keep horizontal rails visible only where horizontal panning is a core interaction
- Avoid legacy selector reintroduction (for example old `card__*` families)
- If you add a new class family, define one long-term owner file in this guide

## Token Commenting Standard

Use comments to clarify intent, not to restate obvious token names.

1. Keep section headers as the primary documentation in [css/variables.css](css/variables.css).
2. Add token-level comments only when a token is easy to misuse or has non-obvious behavior.
3. Prefer short intent labels over long Current/Recommended narratives.
4. Put audits, migration notes, and usage inventories in this guide instead of inline token comments.
5. If a comment is longer than one line, move that detail to docs and keep the token file lean.

Example style:

```css
/* Default container surface */
--layer-02: var(--gray-100);

/* Structural borders for layer-02 containers */
--layer-02-border: var(--border-subtle);
```

## Versioning Workflow

Use a single source of truth for app version updates.

### Source of truth

- File: `app.js`
- Object: `CONFIG`
- Fields:
  - `APP_NAME`
  - `APP_VERSION`

Update only these fields when shipping a new build.

### Where version appears automatically

- Browser tab title
- App header version badge
- Settings menu version row

No additional manual edits are needed in HTML/CSS for normal version bumps.

### Examples

- Beta patch release
  - `APP_VERSION: "0.9.1-beta"`
  - Display label: `v0.9.1-beta`

- First stable release
  - `APP_VERSION: "1.0.0"`
  - Display label: `v1.0.0`

### Release bump checklist

1. Update `APP_VERSION` in `app.js`
2. Refresh the app
3. Confirm version matches in:
   - tab title
   - header badge
   - settings menu row
4. If this is a major release, update release notes/docs in the same PR

### Optimistic Save Regression Guard

When rebuilding trip objects in optimistic save/update paths, preserve server-managed attachment fields from existing state unless the user explicitly changed them.

- Preserve: `itineraryPdfUrl`
- Why: prevents temporary UI regression where the itinerary PDF badge loses `has-pdf` click behavior until the next full week reload
- Check after save without week reload:
  - PDF badge remains clickable
  - `attach_file` icon remains visible when PDF is attached

### Cache + Optimistic Update Smoke Checklist

Run this quick checklist before merging UI/data-flow changes that touch schedule rendering, cache, or optimistic state updates.

1. Week navigation + instant paint

- Switch to another week and back
- Confirm cached data paints immediately
- Confirm sync status moves through updating -> up to date

2. Trip optimistic save consistency

- Edit a trip and click save
- Confirm trip bar updates immediately
- Confirm no icon/status fields regress while waiting for background sync

3. PDF attachment continuity

- Attach itinerary PDF
- Save trip without reloading week
- Confirm itinerary badge remains clickable and opens PDF

4. Notes flow under cache

- Edit and save weekly notes
- Change weeks and return
- Confirm notes do not briefly revert to stale value

5. Background refresh behavior

- Wait for auto-refresh or trigger manual refresh
- Confirm no confusing visual flicker of key status icons
- Confirm sync status reflects success or failure clearly

6. Failure fallback behavior

- Simulate offline or failed fetch during refresh
- Confirm UI shows cached/stale state intentionally
- Confirm no destructive rollback of valid optimistic UI unless verification fails

7. Cache invalidation safety

- After create/update/delete, confirm current week reflects expected data
- Confirm unrelated cache domains (for example drivers list) are not unnecessarily wiped unless intended

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
  - `c-card__body`
  - `c-card__footer`

- utilities
  - `u-hidden`
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
├── .agenda-header__sync-center
│   └── #weekSyncStatus.schedule-sync-status
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

### Current accessibility behavior rule

- Keep focus states visible for keyboard users on interactive controls
- Ensure modal workflows support Escape close and return focus to opener
- Keep keyboard Tab navigation trapped within the active modal dialog

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

### Button API

Use one canonical button system across the app.

- Base class: `.btn`
- Semantic variants: `.btn--primary`, `.btn--secondary`, `.btn--danger`, `.btn--ghost`, `.btn--success`
- Size and control variants: `.btn--compact`, `.btn--toolbar`, `.btn--icon-pagination`

Composition rules:

- Every button variant must include `.btn` in markup.
- Variants are additive, for example: `.btn btn--primary`, `.btn btn--danger btn--ghost`.
- Avoid standalone legacy button classes that bypass `.btn`.

Ownership rules:

- Shared button behavior and variant visuals belong in `css/components/_primitives.css`.
- Context/layout placement for button groups belongs in owner files such as `css/components/_schedule.css`, `css/components/_modals.css`, or `css/layout.css`.
- Do not duplicate variant color/state styling in context files.

Token rules:

- Button colors, hover, active, focus, and sizing must be driven by tokens in `css/variables.css`.
- Avoid hard-coded color values inside button variant selectors.
- If a new button variant is needed, add tokens first, then add the variant in primitives.

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

- `css/components/_schedule.css`
  - app top header
  - schedule header
  - schedule grid
  - sidebar context styling for schedule-side panels
  - centralized sync/notification status text in schedule header

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

### Single Maintainer Workflow

Use this lightweight process so one person can keep token quality high without overhead.

1. Add new values only in canonical token families first

- Canonical families:
  - `--color-*`
  - `--surface-*`
  - `--border-*`
  - `--text-*`
  - `--space-*`
  - `--size-*`

2. Treat compatibility aliases as temporary only

- Do not introduce new alias names once canonical tokens exist.
- If a migration alias is needed, map it to a canonical token and mark it for removal in the same cleanup cycle.

3. Prefer semantic names over component names

- Prefer `--color-danger` over one-off names tied to a single screen.
- Prefer `--surface-elevated` over context-specific names where possible.

4. Keep the token file as single source of truth

- Hard-coded color hex values should live only in foundation palette tokens.
- Components should consume semantic/canonical tokens, not raw palette values.

5. Use a simple release check for token changes

- Run a full variable resolution audit: no missing tokens.
- Verify dark and light theme render parity on app shell, schedule, and modals.
- Remove aliases that are no longer referenced.

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

## Finalization Implementation Plan (Phased)

This plan closes the current audit findings in controlled phases so the app can be marked design-system complete without regressions.

### Phase 0 - Baseline and Guardrails

Goal:

- Freeze current behavior and create a before/after comparison baseline.

Scope:

- Capture screenshots for desktop and mobile for: app shell, right sidebar cards, main schedule, and all modal families.
- Record current selector inventory for these files:
  - `css/layout.css`
  - `css/components/_modals.css`
  - `css/components/_schedule.css`
  - `css/components/_primitives.css`
  - `css/base.css`
- Add a temporary migration checklist in PR notes to track each moved selector and verify no missing styles.

Deliverables:

- Baseline screenshots and selector inventory attached to the implementation PR.

Exit criteria:

- Team can compare visual output and confirm no unknown style dependencies before refactor starts.

---

### Phase 1 - Modal Shell Canonicalization

Goal:

- Bring every modal to the canonical shell pattern.

Scope:

- Refactor envelope modal markup to match the standard shell:
  - `.modal`
  - `.modal__backdrop`
  - `.modal__card`
  - `.c-header.c-header--modal`
  - `.modal__body`
  - `.modal__foot`
- Keep existing envelope controls and behavior IDs intact.
- Add only minimal variant hooks needed for envelope-specific layout.

Deliverables:

- Envelope modal updated to canonical shell structure.

Exit criteria:

- Envelope modal header/body/footer structure is consistent with the existing itinerary/trip-details modal family.
- No JS behavior regressions for open/close/print actions.

---

### Phase 2 - Ownership Repair for Sidebar Components

Goal:

- Remove non-modal component ownership from modal CSS.

Scope:

- Move notes and quote calculator styles out of `css/components/_modals.css`.
- Re-home moved rules to the correct owner:
  - `css/components/_schedule.css` for schedule/sidebar context and right-panel card visuals.
  - `css/components/_primitives.css` only if a style is truly shared primitive behavior.
- Keep selectors and class names unchanged during move-first step.

Deliverables:

- `css/components/_modals.css` contains modal-only shell/variant/content rules.
- Notes and quote card rules live in their long-term owner file.

Exit criteria:

- No `#notesCard`, `.notes__*`, or `.quote-calculator*` ownership remains in `css/components/_modals.css`.
- Visual parity confirmed against Phase 0 screenshots.

---

### Phase 3 - Layout Layer Purification

Goal:

- Enforce structural-only rules in `css/layout.css`.

Scope:

- Move non-structural rules out of layout owner, including:
  - typography utility style such as `.heading-1`
  - control/group component styling such as `.nav-controls`
  - app-specific ID styling such as `#todayBtnMobile`
- Re-home to component owners:
  - `css/components/_schedule.css` for app header and schedule toolbar context.
  - `css/base.css` only for globally reusable utilities.

Deliverables:

- `css/layout.css` contains layout mechanics only (flow, sizing, overflow, breakpoints, ordering).

Exit criteria:

- Every remaining rule in `css/layout.css` passes the structural vs visual ownership check.

---

### Phase 4 - Legacy Selector Cleanup

Goal:

- Remove stale migration leftovers now that canonical classes are stable.

Scope:

- Remove or replace legacy selector residue such as `.card__content--scrollable` where no longer used.
- Confirm no live HTML references remain for removed selectors.
- Keep compatibility only where runtime JS still depends on a fallback selector.

Deliverables:

- Dead selectors removed from CSS owners.

Exit criteria:

- No unused legacy class families remain in active CSS.
- Canonical `o-`, `c-`, `u-`, `is-` naming remains intact and exclusive for active surfaces.

---

### Phase 5 - Accessibility and Interaction Hardening

Goal:

- Ensure focus and interaction behavior remain obvious and consistent after refactor.

Scope:

- Verify keyboard focus states across app header actions, modal controls, form fields, and panel controls.
- Validate focus visibility consistency with Rux interaction standards.
- Confirm modal escape/click-backdrop close behavior and focus return behavior.

Deliverables:

- Accessibility QA checklist completed for keyboard-only traversal.

Exit criteria:

- Focus states remain visible and consistent on desktop and mobile keyboard scenarios.

---

### Phase 6 - Final Verification and Lock-In

Goal:

- Mark the system finalized and prevent ownership drift.

Scope:

- Re-run the class ownership audit and modal shell conformance check.
- Update this guide's "Current canonical classes" and "Ownership Standard" sections only if any approved additions were introduced.
- Add a brief pull-request template checklist for:
  - ownership placement
  - class family consistency
  - no new legacy selectors

Deliverables:

- Final audit pass with no open findings.
- Updated guide references if needed.

Exit criteria:

- App is considered design-system finalized for current scope.

---

## Suggested Execution Order

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6

Rationale:

- Fix structure first (modal shell), then ownership, then cleanup, then QA.
- This sequence minimizes cascading regressions and keeps each PR reviewable.

## Suggested PR Breakdown

1. PR A: Phase 1 only (envelope modal shell canonicalization)
2. PR B: Phase 2 only (notes/quote ownership moves)
3. PR C: Phase 3 and Phase 4 (layout purification + legacy cleanup)
4. PR D: Phase 5 and Phase 6 (a11y verification + final lock-in)

This keeps each change set small, testable, and easy to rollback if needed.
