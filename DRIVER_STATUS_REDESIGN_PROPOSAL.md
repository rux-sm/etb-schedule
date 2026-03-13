# Per-Driver Status Redesign Proposal

## Current State
- **Trip-level** `driverStatus`: Pending → Assigned → Confirmed → Driver Info Sent
- Single dropdown in the status grid; applies to the whole trip
- Bus assignments section: Bus | Driver 1 | Driver 2 (no per-driver status)

## Goal
Move driver status into **Bus and driver assignments** so each driver slot has its own status. This supports:
- Different confirmation states per driver (e.g., D1 confirmed, D2 pending)
- Clearer workflow when drivers are confirmed at different times
- Better alignment with Carbon Design System (high information density, utilitarian layout)

---

## Recommended Approach: Per-Driver Status in Assignments

### 1. UI Layout (Carbon-aligned)

**Option A — Inline status columns (recommended)**  
Add a compact status dropdown next to each driver:

| Bus | Driver 1 | Status | Driver 2 | Status |
|-----|----------|--------|----------|--------|
| 218 | John Doe | Confirmed ▼ | Jane Smith | Pending ▼ |

- **Grid**: `80px 1fr 100px 1fr 100px` (Bus | D1 | D1 Status | D2 | D2 Status)
- **Status options**: Pending, Assigned, Confirmed, Driver Info Sent (same as today)
- **Visibility**: Show Driver 2 status only when Driver 2 is not "None"
- **Compact**: Use small status dropdowns or compact tokens for consistency

**Option B — Status below driver**  
Stack status under each driver in the same cell:

```
Driver 1          Driver 2
John Doe          Jane Smith
[Confirmed ▼]     [Pending ▼]
```

- **Pros**: Keeps horizontal layout compact
- **Cons**: Increases vertical space per row

**Recommendation**: Option A for better scanability and density.

---

### 2. Data Model Changes

**Backend (Google Apps Script)**

- **BusAssignments**: Add `driver1Status` and `driver2Status`:

```javascript
BusAssignments: ["tripKey", "busNumber", "busId", "driver1", "driver2", "driver1Status", "driver2Status"]
```

- **Trips**: Remove or deprecate `driverStatus` (or keep it as a derived/computed value for display).
- **Form params**: Send `bus1_driver1Status`, `bus1_driver2Status`, `bus2_driver1Status`, etc.

**Client (app.js)**

- `state.busRows`: Add `d1StatusSel`, `d2StatusSel` per row.
- **Save**: Include `driver1Status`, `driver2Status` in each assignment.
- **Load**: Populate status dropdowns from assignments.

---

### 3. Trip Bar Badge Logic

**Aggregate status for the badge icon**

- All confirmed → `sentiment_satisfied` (Confirmed)
- All Driver Info Sent → `mood`
- Mixed → `sentiment_neutral` (Assigned)
- Any pending → `sentiment_dissatisfied` (Pending)

**Badge text**: “All confirmed” if all match; otherwise “Mixed” or a short summary.

---

### 4. Carbon Design System Alignment

- **Spacing**: Use 8px gaps between columns and rows.
- **Typography**: Status labels: 0.75rem, muted; values: 0.8125rem.
- **Status colors**: Reuse existing tokens:
  - Pending: `--status-pending` (warning / danger)
  - Assigned: `--status-assigned`
  - Confirmed: `--status-ok` (success)
  - Driver Info Sent: `--status-ok` or a distinct token
- **Status controls**: Compact dropdowns or small tokens with `status-pending`, `status-ok`, etc.
- **Accessibility**: Labels and ARIA for each status control.

---

### 5. Implementation Phases

1. **Phase 1 — Backend**
   - Add `driver1Status`, `driver2Status` to BusAssignments.
   - Update `replaceBusAssignments_` to read/write these.
   - Update `getBusAssignments` / `weekData` to return them.
   - Migration: Default `driverStatus` (or new fields) to `"Pending"` for existing rows.

2. **Phase 2 — Client**
   - Add status dropdowns to each bus row.
   - Wire save/load.
   - Remove or hide trip-level driver status in the status grid.

3. **Phase 3 — Trip bar**
   - Implement aggregate logic for the badge.
   - Update driver contact modal if it still uses trip-level status.

---

### 6. Alternative: Hybrid (minimal change)

**Keep trip-level driver status**

- Add per-driver status in the assignments section.
- **Trip-level**: “Overall” status (e.g., worst of all drivers).
- **Per-driver**: Source of truth for each driver.

**Pros**: Backward compatible, gradual migration.  
**Cons**: Two status concepts; more complexity.

---

## Summary

| Aspect | Recommendation |
|--------|-----------------|
| **Layout** | Add Driver 1 Status and Driver 2 Status columns in the assignments grid |
| **Grid** | `80px 1fr 100px 1fr 100px` |
| **Backend** | Add `driver1Status`, `driver2Status` to BusAssignments |
| **Trip badge** | Derive from per-driver status (all confirmed / mixed / pending) |
| **Trip-level field** | Remove after migration is complete |

---

## Next Steps

1. ~~Confirm approach (Option A vs B, or hybrid).~~ **Done: Option A**
2. ~~Update client UI and logic.~~ **Done**
3. **Implement backend changes** (see below).
4. Add migration for existing rows (optional; default to "Pending").
5. ~~Update trip bar badge and any status-dependent features.~~ **Done**

---

## Backend Patch Required

The client now sends `bus1_driver1Status`, `bus1_driver2Status`, `bus2_driver1Status`, etc. in the form. To persist per-driver status:

### 1. BusAssignments sheet

Add columns `driver1Status` and `driver2Status`:

```javascript
BusAssignments: ["tripKey", "busNumber", "busId", "driver1", "driver2", "driver1Status", "driver2Status"]
```

### 2. replaceBusAssignments_

In the loop that builds each assignment row, read and persist the status:

```javascript
const driver1Status = String(p[`bus${i}_driver1Status`] || "Pending").trim();
const driver2Status = String(p[`bus${i}_driver2Status`] || "Pending").trim();
// In rowObj:
driver1Status,
driver2Status,
```

### 3. getBusAssignments / weekData

Ensure the response includes `driver1Status` and `driver2Status` for each assignment (from the sheet columns).
