# Options: Match Requirements/Bus label-to-field spacing to form groups (4px)

**Goal:** Requirements label and Bus grid header row should have the same 4px space from label to first row of fields as `.form-group > label` (margin-bottom: 4px), while keeping the existing 8px grid/subsection gaps elsewhere.

**Current state:**
- `.form-group > label` and `.field-label`: `margin-bottom: 4px` → label-to-field = **4px**.
- `.subsection`: `gap: 8px` (flex) → Requirements block: label to toggle-pill-grid = **8px**.
- `#busGrid.bus-assign`: `gap: 8px`; `#busGrid.bus-assign .field-label { margin-bottom: -4px }` → header row to first dropdown row = **4px** (already correct).

So only **Requirements** needs a fix (8px → 4px). Bus is already using the negative-margin approach.

---

## Option A – Negative margin on section label (recommended)

**Rule:** `.subsection > .field-label { margin-bottom: -4px; }`

- The subsection gap stays 8px. The label’s negative margin pulls it into the gap, so the *visible* space from label to content = 8px − 4px = **4px**.
- **Pros:** One rule; no change to subsection structure or gap; same pattern already used for the bus grid header.
- **Cons:** Slight reliance on negative margin (usually fine here).

---

## Option B – Subsection gap = 4px and compensate between content blocks

**Rules:**
1. `.subsection { gap: 4px; }` so label → first content = 4px.
2. `.subsection > * + * { margin-top: var(--space-1); }` (4px) so *between* content blocks you get 4px + 4px = 8px.

- **Pros:** No negative margins; “label to first field” is literally 4px from the gap.
- **Cons:** Every subsection’s gap becomes 4px; you need the `* + *` rule to keep 8px between multiple content blocks (e.g. label + grid + another block). Slightly more to maintain.

---

## Option C – Margin on first content only

**Rule:** `.subsection > .field-label + * { margin-top: -4px; }`

- Same visual result as Option A: 8px gap − 4px = 4px. The first element after the label is pulled up.
- **Pros:** No negative margin on the label; one rule.
- **Cons:** Depends on label being first and “first content” being the next sibling; negative margin on content instead of label.

---

## Option D – CSS variable and explicit spacing

**Rules:** e.g. `--label-to-field: var(--space-1);` (4px), then:
- `.subsection > .field-label { margin-bottom: calc(var(--label-to-field) - var(--space-2)); }` (−4px when gap is 8px).

- **Pros:** Single source of truth for “label-to-field” distance.
- **Cons:** More verbose; same negative-margin idea as A.

---

## Recommendation

**Option A:** Add `.subsection > .field-label { margin-bottom: -4px; }`. Requirements then matches form-group label-to-field (4px), bus grid is already correct, and grid/subsection gaps stay at 8px.
