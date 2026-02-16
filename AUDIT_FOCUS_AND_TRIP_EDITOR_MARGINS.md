# Audit: Focus Border Clipping & Trip Editor Margins

## 1. Focus border clipped at edges

**Cause**
- Sidebar cards (Trip Editor, Notes, Drivers) use `.panel-start > .card` / `.panel-end > .card` with **`overflow: hidden`** (in the layout media block).
- Form controls use **`box-shadow: var(--focus-ring)`** (0 0 0 3px) for `:focus-visible`. The ring sits outside the element.
- **`.card-content`** has **`padding: none`** (invalid; effectively no padding), so inputs sit flush to the card edges.
- When an input at the left/right edge is focused, the 3px ring is clipped by the card’s `overflow: hidden`.

**Fix**
- Give the scrollable area horizontal padding so the focus ring isn’t against the clip edge:
  - Use **`.panel-start .card-content`** and **`.panel-end .card-content`** with e.g. **`padding: 0 var(--card-padding)`** (12px) or **`padding: 0 var(--space-2)`** (8px).
- Optionally set **`padding: 0`** on the base **`.card-content`** (replace `padding: none`) and add the above padding only for panel cards.

---

## 2. Trip Editor no longer has margins

**Current state**
- **`.form-grid`**: `margin: 8px auto`, `width: 100%`. So vertical margin only; no horizontal inset.
- **`.card.compact`**: `padding: 0` (card has no padding).
- **`.card-content`**: `padding: none` (no padding).
- **Panel**: `padding: var(--card-padding)` (12px) on `.panel-start` / `.panel-end`, so the card is inset 12px from the panel. The card itself is full width of the content area; the form is full width of the card.

So the form is flush to the card’s left/right. There is no inner margin/padding between the card and the form.

**Fix**
- Add horizontal padding to the Trip Editor (and other sidebar) card content so the form has inset and the focus ring has room:
  - **`.panel-start .card-content`**, **`.panel-end .card-content`**: **`padding: 0 var(--card-padding)`** (12px left/right).
- That restores visual “margins” (inset) and helps avoid focus clipping. If you also use the rigid form width (e.g. `width: 390px; max-width: 100%`), keep **`margin: 8px 0`** on `.form-grid`; the padding on `.card-content` provides the horizontal gutter.

---

## 3. Summary

| Issue | Cause | Fix |
|-------|--------|-----|
| Focus ring clipped | Card `overflow: hidden` + no padding on `.card-content` | Padding on sidebar `.card-content` (e.g. `0 var(--card-padding)`) |
| Trip Editor no margins | `.card-content` has no padding; `.form-grid` has no horizontal margin | Same padding on sidebar `.card-content` |
| `padding: none` | Invalid CSS | Use `padding: 0` on base `.card-content` |

Applying the padding to sidebar card content addresses both focus clipping and Trip Editor margins in one go.
