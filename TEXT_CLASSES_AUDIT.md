# Text, Header & Label Classes Audit

Ordered by **font size (biggest → smallest)** and grouped by **section/type**.

---

## 22px (1.375rem) — Week table (bus column)

| Section/type | Class | Formatting | Container |
|--------------|-------|------------|-----------|
| Week table | `.week-table td:first-child` | `font-weight: 500`, `color: var(--text)` | Sticky first column (bus row labels) |

---

## 20px (1.25rem) — Agenda / week header

| Section/type | Class | Formatting | Container |
|--------------|-------|------------|-----------|
| Agenda header | `.week-heading` | `font-weight: 600`, `color: var(--text)`, `line-height: 1` | `.agenda-header` |
| Agenda header | `.week-date` (`.wk-month`, `.wk-dates`, `.wk-year`) | `.wk-month`: `font-weight: 700`, `letter-spacing: 0.02em`, `color: var(--text)`; others: `400`, muted | Inside `.week-heading` |
| Agenda header | `.agenda-header .week-heading` | Same as `.week-heading` | Override in agenda context |

*Mobile (max-width 899px): `.week-heading` → 14px (0.875rem).*

---

## 18px (1.125rem) — Topbar & card chrome / icons

| Section/type | Class | Formatting | Container |
|--------------|-------|------------|-----------|
| Topbar | `.heading-1.topbar__title` | `var(--heading-1-size)`, `var(--heading-1-weight)`, `color: var(--text)`; layout: ellipsis, nowrap | `#topbarTitle` (h1) |
| Cards | `.btn-close-card .material-symbols-outlined` | Icon only; `color: var(--text-muted)` | `.card-header-actions` |
| Menus | `.dropdown-icon`, `.context-item .material-symbols-outlined` | Icon; `opacity: 0.85` | Dropdown/context menus |

---

## 16px (1rem) — Card titles, week table, badges, form icons

| Section/type | Class | Formatting | Container |
|--------------|-------|------------|-----------|
| Cards | `.section-title` | `font-weight: 400`, `letter-spacing: 0.02em`, `color: var(--text)` | `.card-header` (Trip Editor, Notes, Drivers, Trip Details) |
| Week table | `.day-name` | `font-weight: 400`, muted color | Inside `.day-label` |
| Week table | `.day-date` | `font-weight: 600`, `letter-spacing: 0.02em`, `color: var(--text)` | Inside `.day-label` |
| Week table | `.bus-id-num` | `font-weight: 500`, `letter-spacing: 0.02em`, `color: var(--text)` | First column (bus number) |
| Week table | `.bus-id-wrap .bus-lift`, `.bus-sleeper` | Tinted blue/white (icons) | Bus cell |
| Badges | `.badge` | `font-weight: 400`, `letter-spacing: 0.02em` | Schedule badges, overflow badge |
| Form | `.toggle-pill-icon` | Icon only | Inside `.toggle-pill` |

---

## 14px (0.875rem / var(--font-size-2)) — Inputs, trip details, menus, notes

| Section/type | Class | Formatting | Container |
|--------------|-------|------------|-----------|
| Inputs | `input`, `select`, `textarea` | `--input-font-size` (0.875rem), `--input-font-weight`, `color: var(--text)` | Form groups, bus grid |
| Trip Details modal | `.trip-details-content` | Base for modal body; `color: var(--text)` | `#tripDetailsBody` |
| Trip Details modal | `.detail-value-block` | `color: var(--text)`, `line-height: 1.5` | Notes, Comments, Assignments body |
| Menus | `.dropdown-item`, `.context-item` | `font-weight: 600`, `color: var(--text)` | Dropdown/context menu items |
| Notes card | `.notes-textarea` | `font-weight: 400`, `line-height: 1.5` | Weekly Notes textarea |

---

## 13px (0.8125rem) — Toasts

| Section/type | Class | Formatting | Container |
|--------------|-------|------------|-----------|
| Toasts | `.toast` | `font-weight: 650`, `color: var(--text)` | Toast message container |

---

## 12px (0.75rem / var(--font-size-1)) — Card body, form labels, trip details values, pills

| Section/type | Class | Formatting | Container |
|--------------|-------|------------|-----------|
| Cards | `.card-content` | `font-weight: 400`, `color: var(--text-muted)` | `.card` body |
| Form | `.form-group > label` | `font-weight: 400`, `color: var(--text-muted)`, `line-height: 1.4`, `margin-bottom: 4px` | Above inputs (Destination, Customer, etc.) |
| Form | `.field-label` | Same as form label | Requirements, Bus/Driver 1/Driver 2 headers |
| Form | `.toggle-pill` | `font-weight: 600`, `color: var(--text)` | 56 Pax, Sleeper, etc. |
| Trip Details modal | `.toggle-pill-grid-label` | `font-weight: 400`, `color: var(--text-muted)`, `letter-spacing: 0.02em`, `text-transform: capitalize` | Assignments, Notes, Comments, Itinerary |
| Trip Details modal | `.detail-value` | `font-weight: 400`, `color: var(--text)` | Metadata/status rows |
| Trip Details modal | `.detail-value-block.detail-text.pre-wrap` | `color: var(--text-secondary)` | Itinerary block |
| Trip Details modal | `.detail-text.pre-wrap` | `color: var(--text-secondary)`, `background: var(--surface-3)` | Itinerary scroll |
| Trip Details modal | `.detail-assignment` | `color: var(--text)`, `line-height: 1.4` | Assignment list items |
| Form (legacy) | `.bus-assign__head` | `font-weight: 500`, `color: var(--text-secondary)` | Unused in JS (replaced by `.field-label`) |

---

## 11px (0.6875rem) — Context headers, waiting list

| Section/type | Class | Formatting | Container |
|--------------|-------|------------|-----------|
| Menus | `.context-header` | `font-weight: 700`, `letter-spacing: 0.06em`, `text-transform: uppercase`, `color: var(--text-muted)` | “Trip Actions”, “New Entry” |
| Waiting list | `.waiting-list-row .bus-id-cell` | `color: var(--text-muted)` | Bus ID in waiting list row |

---

## No fixed size (inherit / utility)

| Section/type | Class | Formatting | Container |
|--------------|-------|------------|-----------|
| Global | `body` | `line-height: var(--line-height-base)`, `letter-spacing: var(--letter-spacing-base)`, `color: var(--text)` | Page root |
| Global | `h1–h6` | `font-weight: 400` only | Any heading |
| Global | `input`, `select`, `textarea`, `button` | `font-family/size/line-height: inherit` | Form controls |
| Utility | `.text-center` | `text-align: center` | Any |
| Utility | `.text-right` | `text-align: end` | Any |
| Utility | `.text-muted` | `color: var(--text-muted)` | Any |
| Form | `.label-link` | `color: var(--accent)`, `font-size: inherit`, `font-weight: 400` | Inside `<label>` (e.g. “(view)”) |
| Cards | `.card-header`, `.card-footer` | Layout only; no text font-size | Card structure |

---

## Size order summary

| Size | px | Section/type |
|------|-----|--------------|
| 1.375rem | 22 | Week table — bus column cell |
| 1.25rem  | 20 | Agenda — week header / date |
| 1.125rem | 18 | Topbar — title; Cards — close icon; Menus — icons |
| 1rem     | 16 | Cards — section title; Week table — day name/date, bus id; Badges; Form — pill icon |
| 0.875rem | 14 | Inputs; Trip Details — content/value-block; Menus — items; Notes — textarea |
| 0.8125rem| 13 | Toasts |
| 0.75rem  | 12 | Card content; Form — labels, pills; Trip Details — labels, values, assignments |
| 0.6875rem| 11 | Menus — context header; Waiting list — bus cell |

---

*Order: biggest → smallest. Grouped by section/type. Trip bars excluded.*
