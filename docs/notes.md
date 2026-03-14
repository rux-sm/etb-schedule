## 1. Header Component (Carbon UI Shell)

The application header (`.cds-header`) and its action buttons operate on a strictly isolated architecture based on the IBM Carbon UI Shell. The header buttons do not inherit from the standard application button system (`.btn`).

### Core Implementation Rules

- **Class Isolation:** Always use `.cds-header__action`. Never apply `.btn` classes to header elements.
- **CSS Reset:** The `.cds-header__action` class utilizes `all: unset` to completely sever inheritance from global CSS rules.
- **Active State Trigger:** The active (open panel) state is managed by JavaScript toggling the `aria-pressed="true"` attribute, not by a custom CSS class.
- **Zero Layout Shift:** Space for the active state indicator is permanently reserved using transparent borders to prevent the icon from shifting when clicked.

---

### Dimensions & Structure

| Property             | Value                   | Purpose                                                 |
| :------------------- | :---------------------- | :------------------------------------------------------ |
| **Component Height** | `48px`                  | Anchors the global top bar height.                      |
| **Hit Area**         | `48px` x `48px`         | Enforces the strict Carbon UI Shell grid.               |
| **Min-Width Limit**  | `48px`                  | Overrides the global `80px` button minimum.             |
| **Base Border**      | `1px solid transparent` | Preserves dimensions and supports High Contrast Mode.   |
| **Bottom Border**    | `3px solid transparent` | Reserves physical space for the active state indicator. |

---

### Interaction States

| State          | CSS Trigger             | Visual Property                                      |
| :------------- | :---------------------- | :--------------------------------------------------- |
| **Default**    | `.cds-header__action`   | `background: transparent;`                           |
| **Hover**      | `:hover`                | `background: #393939;` (Carbon Gray 80)              |
| **Press**      | `:active`               | `background: #4c4c4c;`                               |
| **Focus**      | `:focus-visible`        | `outline: 2px solid #fff; outline-offset: -2px;`     |
| **Panel Open** | `[aria-pressed="true"]` | `background: #262626; border-bottom-color: #0f62fe;` |

---

### Icon Specifications

Header icons utilize Google Material Symbols (Outlined) mapped exactly to the Carbon 24px standard to ensure pixel-perfect rendering.

- **Font Size:** `24px`
- **Optical Size (`opsz`):** `24`
- **Weight (`wght`):** `400`
- **Fill / Grade:** `0` / `0`

**CSS Declaration:**
`font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;`

---

### File Architecture Reference

- **CSS Styles:** Located in `_schedule.css` (approx. lines 1–126).
- **HTML Structure:** Located in `index.html` (approx. lines 47–160).
- **JavaScript Logic:** Located in `app.js`
  - State configuration: `CARD_CONFIG` (approx. line 2870).
  - Panel wiring: `showCardInPanel` / `hideCard` functions (approx. lines 2903–2984).

# Button Design System: IBM Onyx Standard (Quick Reference)

This is the quick-reference guide for the Trip Schedule's button architecture. All buttons use a **Base Class + Modifier Class** pattern.

## 1. Quick Rules

- **NEVER use inline styles** for buttons (`style="..."`). Only use these classes.
- **Always include the base `.btn` class** first. Example: `<button class="btn btn--primary">`
- **Zero Border Radius:** All standard buttons must have sharp corners (`border-radius: 0`).
- **Font Weight:** Standard buttons use `font-weight: 400` (Regular weight).
- **Primary Hierarchy:** Only use _one_ `.btn--primary` per logical section.

## 2. Button Classes & Modifiers

| Class                              | Appearance            | Usage                                                                   | Example HTML                                                                              |
| :--------------------------------- | :-------------------- | :---------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **`.btn`**<br>_(Default/Tertiary)_ | Solid Gray Background | Default choice. Everyday actions, Close, Cancel, Toolbar buttons.       | `<button class="btn">Close</button>`                                                      |
| **`.btn--primary`**                | Solid Blue Background | Primary action in a group. Save, Submit, OK.                            | `<button class="btn btn--primary">Save</button>`                                          |
| **`.btn--secondary`**              | Blue Outline          | Secondary structural action. Clear, Copy, alternative positive actions. | `<button class="btn btn--secondary">Clear</button>`                                       |
| **`.btn--danger`**                 | Solid Red Background  | Destructive, irreversible actions. Delete, Remove.                      | `<button class="btn btn--danger">Delete</button>`                                         |
| **`.icon-btn`**                    | Transparent, Square   | Header navigation, icon-only utility toggles.                           | `<button class="icon-btn"> <span class="material-symbols-outlined">menu</span> </button>` |

### Size Modifiers

Add `.btn--compact` alongside your other classes when you need a smaller button (usually for tight modal footers).

- **Example:** `<button class="btn btn--primary btn--compact">` (Changes height from `30px` to `32px` with less padding).

### Icons Inside Buttons

When placing an icon alongside text in a button, use the `material-symbols-outlined` class. It will automatically inherit the correct 18px sizing and spacing geometry.

- **Leading Icon (Default):** Place the `<span class="material-symbols-outlined">icon_name</span>` _before_ the text. This is standard for descriptive actions (e.g., Save, Print, Mail).
- **Trailing Icon:** Place the span _after_ the text and add the `.icon--trailing` modifier class to flip the margin. This is primarily used for directional actions (e.g., Next ➔).
- **Weight:** All button icons automatically inherit `font-weight: 400` to match the standard button text.

### Toggle Buttons (`.toggle-pill`)

Used for state-based selections (like Trip Requirements). These are ghost buttons that turn solid when active.

- **Sharp Corners:** Always use `border-radius: 0`.
- **Icons:** Use `.toggle-pill__icon`. Icons in toggle pills are **leading** (before text) to match the main button system.

## 3. Spacing & Layout

### Minimum Width

- **Standard Actions:** Buttons with text should have a minimum width of **80px** to maintain a consistent visual rhythm and target area.
- **Icon-Only:** Buttons without text remain standard square based on height.

### Grouping & Gutter

- **Horizontal Groups:** Use a **8px gap** between buttons in a single action group (e.g., Save/Clear/Delete).
- **Alignment:** Groups in forms should be right-aligned (primary action last).

### Full-Width (Panels & Sidebars)

- **Narrow Containers:** In vertical panels or narrow sidebars, buttons should use the `.w-full` utility to stretch and fill the available width.
- **Action Grids:** For multiple small actions in a panel, use a 2-column grid (`grid-template-columns: 1fr 1fr`) with a **8px gap**.

### Vertical Spacing (Cushion)

- **Action Bars & Footers:** Use a consistent **12px vertical padding** (`padding: 12px 0` or `12px 16px`) to give buttons professional breathing room.

## 4. Interaction States (Automatic)

These states apply automatically via the CSS classes; you do not need to code them.

- **Hover:** Background darkens (Secondary/Outline buttons invert to a solid fill).
- **Active (Click):** Button scales down slightly for tactile feedback.
- **Focus (Tab key):** Button receives the IBM signature `2px` inset focus ring.
- **Disabled:** Adding the `disabled` HTML attribute automatically turns the button into a non-interactive, flat gray placeholder.

---
