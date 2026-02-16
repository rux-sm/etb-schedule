# Heading & Section Text: Optimizations, Simplification, Standardization

Recommendations for h1/h2/section text and which current sections apply.

---

## 1. Current state (summary)

| Where | Element / class | Effective style | Notes |
|-------|-----------------|-----------------|--------|
| Topbar | `h1.heading-1.topbar__title` | 20px (--heading-1-size), semibold | App title; standardized H1 |
| Agenda | `h2.week-heading` | 20px, semibold | Week date; only “big” section title |
| Card headers | `h2.section-title` | 16px, regular | Trip Editor, Notes, Drivers, Trip Details |
| Trip Itinerary modal | `div.section-title` | 16px | Same look, not h2 |
| Trip Details modal | `h2.section-title` | 16px | Same as card headers |
| Context menus | `div.context-header` | 11px, bold, uppercase | Trip Actions, New Entry |
| Conflicts card | `div.card-title` | **No CSS** — inherits | “Conflicts” + badge |
| Loading overlay | `div.loading-title` | **No CSS** | “Loading…” |
| Conflict dialog (JS) | `div.title`, `div.conflict-title` | **No CSS** | One-off in JS |
| Trip Details body | `div.detail-section-title` | Spacing only; label from `.toggle-pill-grid-label` | “Itinerary” |

**Issues:** No shared heading scale; `h1` unused; `.section-title` and `.week-heading` duplicate font/color; `.card-title`, `.loading-title`, `.conflict-title` have no defined type style; `.agenda-header .week-heading` repeats `.week-heading`.

---

## 2. Suggested heading scale (3 levels)

Use **one semantic scale** and **one class per level** so section text is consistent and easy to maintain.

| Level | Suggested class | Size | Weight | Use for |
|-------|------------------|------|--------|---------|
| **H1 / Page** | `.heading-1` or use `h1` | 20px (1.25rem) | 600 | Single main title per view: app title, agenda week |
| **H2 / Card** | `.heading-2` or use `h2` | 16px (1rem) | 400 | Card/dialog titles: Trip Editor, Trip Details, etc. |
| **H3 / Small section** | `.heading-3` | 11px (0.6875rem) | 700, uppercase | Small UI headers: context menus, optional subsections |

**CSS variables (add to `:root`):**

```css
--heading-1-size: 1.25rem;   /* 20px */
--heading-1-weight: 600;
--heading-2-size: 1rem;     /* 16px */
--heading-2-weight: 400;
--heading-3-size: 0.6875rem; /* 11px */
--heading-3-weight: 700;
```

Then define:

- `h1` or `.heading-1`: font-size/weight from vars, color `var(--text)`, letter-spacing, line-height.
- `h2` or `.heading-2`: same from vars (or keep existing `.section-title` and make it use the vars).
- `.heading-3` or keep `.context-header` for typography and rename conceptually to “small section header”.

---

## 3. Which current sections apply to which level

### H1 / Page level (20px, semibold)

- **Topbar app title** — `#topbarTitle` / `h1.heading-1.topbar__title`  
  → Uses `.heading-1` (vars) + `.topbar__title` (layout); done.
- **Agenda week date** — `h2.week-heading`  
  → Treat as page-level for this view; either keep `h2.week-heading` and style with `--heading-1-*`, or use `h1.heading-1` if this is the main heading of the schedule (and fix outline/accessibility).

**Apply:** Topbar title, Agenda week heading.

---

### H2 / Card level (16px, regular)

- **Side panel cards:** “Left Panel Card 1”, “Driver Assignments”, “Weekly Notes”, “Trip Editor”  
  → Already `h2.section-title`; keep and optionally drive from `--heading-2-*`.
- **Trip Details modal** — “Trip Details”  
  → Already `h2.section-title`; same as above.
- **Trip Itinerary modal** — “Trip Itinerary”  
  → Change `div.section-title` to `h2.section-title` for consistency and semantics.
- **Conflicts card** — “Conflicts”  
  → Change `div.card-title` to `h2.section-title` (or `h2.heading-2`) and add/keep the same 16px style.

**Apply:** All card headers, Trip Details, Trip Itinerary, Conflicts card.

---

### H3 / Small section (11px, bold, uppercase)

- **Context menu headers** — “Trip Actions”, “New Entry”  
  → Keep `.context-header`; optionally alias as `.heading-3` or use the same vars so it’s the only “small section” style.
- **Trip Details modal subsection** — “Itinerary”  
  → Currently `.detail-section-title` + `.toggle-pill-grid-label`. Either keep as-is (label style) or, if you want a “small section” look, use the same typography as `.context-header` / `.heading-3` for that block only.

**Apply:** Context headers; optionally Itinerary subsection in Trip Details.

---

## 4. Simplifications

1. **One source for “card title” style**  
   Use a single rule (e.g. `h2.section-title` or `.heading-2`) that uses `--heading-2-size` and `--heading-2-weight`. Remove duplicate `.agenda-header .week-heading` and rely on `.week-heading` (or `.heading-1`) plus one responsive rule if needed.

2. **Semantic elements**  
   - Use `h1` once per main view (e.g. topbar title or agenda week).  
   - Use `h2` for all card/dialog titles (Trip Editor, Trip Details, Trip Itinerary, Conflicts).  
   - Use a single small-section class (e.g. `.context-header` or `.heading-3`) for 11px uppercase headers.

3. **Define missing classes**  
   - **`.card-title`** — Use same as `h2.section-title` (e.g. add to the same selector or class).  
   - **`.loading-title`** — Set to `--heading-2-*` (or 16px) so it matches card title weight.  
   - **Conflict dialog** — Use `.heading-2` (or `.section-title`) for the main title and a smaller class for `.conflict-title` (e.g. 14px) so they’re not unstyled.

4. **Naming**  
   - Keep `.section-title` as the main “card title” class and optionally add `.heading-2` as an alias that uses the same vars.  
   - Keep `.week-heading` for the agenda or rename to `.heading-1` and use it for both topbar and week if they share the same size/weight.

---

## 5. Quick mapping: “Which section uses which level?”

| Section | Current | Recommended level | Action |
|---------|---------|-------------------|--------|
| Topbar | `h1.heading-1.topbar__title` | H1 | Done — uses `--heading-1-*` |
| Agenda week | `h2.week-heading` | H1 | Style with `--heading-1-*`; remove duplicate `.agenda-header .week-heading` |
| Driver Assignments card | `h2.section-title` | H2 | Keep; drive from `--heading-2-*` |
| Weekly Notes card | `h2.section-title` | H2 | Same |
| Trip Editor card | `h2.section-title` | H2 | Same |
| Trip Details modal | `h2.section-title` | H2 | Same |
| Trip Itinerary modal | `div.section-title` | H2 | Use `h2.section-title` |
| Conflicts card | `div.card-title` | H2 | Use `h2.section-title` or `.heading-2`; add CSS |
| Loading overlay | `div.loading-title` | H2 | Add CSS using `--heading-2-*` |
| Context menus | `div.context-header` | H3 | Keep; optionally use `--heading-3-*` |
| Trip Details “Itinerary” | `.detail-section-title` + label | Label or H3 | Keep label style or align with H3 |
| Conflict dialog title (JS) | `div.title` / `div.conflict-title` | H2 + smaller | Add classes; use `.section-title` and a small utility |

---

## 6. Optional: minimal CSS changes (no HTML churn)

If you prefer to change only CSS first:

1. Add to `:root`: `--heading-1-size`, `--heading-1-weight`, `--heading-2-size`, `--heading-2-weight`, `--heading-3-size`, `--heading-3-weight`.
2. Set `.section-title` to use `var(--heading-2-size)` and `var(--heading-2-weight)`.
3. Set `.week-heading` to use `var(--heading-1-size)` and `var(--heading-1-weight)` (topbar now uses `.heading-1`).
4. Set `.context-header` to use `var(--heading-3-size)` and `var(--heading-3-weight)`.
5. Add one rule: `.card-title, .loading-title { font-size: var(--heading-2-size); font-weight: var(--heading-2-weight); color: var(--text); }` so Conflicts and Loading are no longer unstyled.

Then, when you touch HTML/JS, migrate to semantic `h1`/`h2` and shared classes as above.
