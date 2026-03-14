# Carbon-Lite System Guide

Generated: 2026-03-14
Scope: UI structure, naming, ownership, and styling standards for this app

## Purpose

This guide defines a small, maintainable design and structure system for the trip schedule app.

It is inspired by IBM Carbon in behavior and layout discipline, but it is not a full Carbon implementation.

The goal is to keep the UI:

- consistent
- easy to extend
- easy to debug
- realistic for one person to maintain

## Philosophy

Use Carbon as a reference for interaction quality, spacing discipline, and shell layout.

Do not try to mirror Carbon exactly.

This app should follow a Carbon-lite approach:

- Carbon-like sizing and interaction standards
- Custom class names that match this codebase
- Simple file ownership rules
- Small set of reusable primitives
- Limited token surface area

## Core Rules

1. Prefer consistency over cleverness.
2. Prefer reusable primitives over repeated one-off styling.
3. Keep layout structure separate from component appearance.
4. Keep component appearance separate from context-specific overrides.
5. Keep naming simple enough that one person can navigate it quickly.
6. Limit CSS nesting to 3 levels deep maximum. Keep selectors flat so they are easy to read and override.

## Layer Model

### 1) Objects

Objects are structural wrappers only.

They control:

- display
- flex/grid behavior
- width/height
- overflow
- ordering
- positioning

They should not own:

- typography
- colors
- decorative borders
- component-specific spacing polish

Prefix:

- `o-`

Examples:

- `o-app-layout`
- `o-app-layout__main`
- `o-app-layout__sidebar`

### 2) Components

Components are reusable UI blocks.

They control:

- internal layout
- visual treatment
- component spacing
- component states

Prefix:

- `c-`

Examples:

- `c-header`
- `c-card`
- `c-modal`
- `c-context-menu`

### 3) Utilities

Utilities are single-purpose helpers.

They should be small and explicit.

Rule of Three:

- If the same cluster of 3 or more utility classes is applied to multiple elements, extract those styles into a new component (`c-`) instead of repeating the utility bundle.

Prefix:

- `u-`

Examples:

- `u-hidden`
- `u-mobile-only`
- `u-scroll-y`

### 4) States

State classes express UI condition, not structure.

Prefix:

- `is-`

Examples:

- `is-hidden`
- `is-active`
- `is-collapsed`

## Carbon-Lite Interaction Standards

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

### Current-to-Future Mapping

Use dual classes during migration.

Examples:

- `cds-header` -> `c-header c-header--app`
- `panel-header` -> `c-header c-header--panel`
- `agenda-header` -> `c-header c-header--schedule`
- `modal__head` -> `c-header c-header--modal`
- `card` -> `c-card`
- `card__content` -> `c-card__body`

Do not remove old classes until parity is confirmed.

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

## Refactor Strategy

Use this order for ongoing cleanup.

1. Fix ownership first

- Move misplaced rules to their correct owner file

2. Neutralize shared shells

- Remove typography and context spacing from generic primitives

3. Reapply styles at the correct level

- Add typography and spacing back in component or context owners

4. Introduce new shared primitives

- Add `c-header`, `c-card`, `c-modal` progressively

5. Migrate using dual classes

- Old and new classes can coexist temporarily during the build phase.

6. Remove legacy selectors last

- Once visual parity is confirmed, immediately delete the legacy class from the HTML and the old CSS owner file.
- Do not leave dead selectors or dead dual-class markup behind.

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
