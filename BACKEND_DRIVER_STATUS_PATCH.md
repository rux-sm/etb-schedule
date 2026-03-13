# Backend Patch: Per-Driver Status — Exact Changes

Copy each change into your Google Apps Script. Use Ctrl+F (Cmd+F) to find the text, then replace.

---

## PATCH 1: HEADERS

**Find this exact line:**
```
BusAssignments: ["tripKey", "busNumber", "busId", "driver1", "driver2"],
```

**Replace with:**
```
BusAssignments: ["tripKey", "busNumber", "busId", "driver1", "driver2", "driver1Status", "driver2Status"],
```

---

## PATCH 2: replaceBusAssignments_

**Find this block:**
```
    const rowObj = {
      tripKey: tripKey,
      busNumber: i,
      busId: busId,
      driver1: driver1 || "None",
      driver2: driver2 || "None",
    };
    appendRowByHeaders_(busSheet, HEADERS.BusAssignments, rowObj);
```

**Replace with:**
```
    const driver1Status = String(p[`bus${i}_driver1Status`] || "Pending").trim();
    const driver2Status = String(p[`bus${i}_driver2Status`] || "Pending").trim();
    const rowObj = {
      tripKey: tripKey,
      busNumber: i,
      busId: busId,
      driver1: driver1 || "None",
      driver2: driver2 || "None",
      driver1Status: driver1Status,
      driver2Status: driver2Status,
    };
    appendRowByHeaders_(busSheet, HEADERS.BusAssignments, rowObj);
```

*(If your loop uses different variable names like `driver1`/`driver2`, keep those; only add the two new lines and the two new properties.)*

---

## PATCH 3: weekData_ — Add indices

**Find:**
```
  const aDriver1 = idx(asnHdr, "driver1");
  const aDriver2 = idx(asnHdr, "driver2");
```

**Replace with:**
```
  const aDriver1 = idx(asnHdr, "driver1");
  const aDriver2 = idx(asnHdr, "driver2");
  const aDriver1Status = idx(asnHdr, "driver1Status");
  const aDriver2Status = idx(asnHdr, "driver2Status");
```

---

## PATCH 4: weekData_ — Add to assignment object

**Find:**
```
      assignments.push({
        tripKey: k,
        busNumber: String(row[aBusNumber] || "").trim(),
        busId,
        driver1: String(row[aDriver1] || "").trim(),
        driver2: String(row[aDriver2] || "").trim(),
      });
```

**Replace with:**
```
      assignments.push({
        tripKey: k,
        busNumber: String(row[aBusNumber] || "").trim(),
        busId,
        driver1: String(row[aDriver1] || "").trim(),
        driver2: String(row[aDriver2] || "").trim(),
        driver1Status: aDriver1Status >= 0 ? String(row[aDriver1Status] || "").trim() : "",
        driver2Status: aDriver2Status >= 0 ? String(row[aDriver2Status] || "").trim() : "",
      });
```

---

## PATCH 5: BusAssignments sheet (manual)

1. Open your Google Sheet.
2. Go to the **BusAssignments** sheet.
3. Insert 2 columns after **driver2**.
4. In the header row, type `driver1Status` in the first new column and `driver2Status` in the second.

---

## PATCH 6: Deploy

1. Save (Ctrl+S / Cmd+S).
2. **Deploy** → **Manage deployments** → **Edit** (pencil) → **Version: New version** → **Deploy**.
