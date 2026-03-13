# Backend Fixes Needed

You're close! Here are the 3 issues:

---

## 1. replaceBusAssignments_ — Add driver1Status/driver2Status to rowObj

You read the values but don't put them in `rowObj`. The sheet gets its data from `appendRowByHeaders_`, which uses `rowObj`.

**Find:**
```javascript
    const driver1Status = String(p[`bus${i}_driver1Status`] || "Pending").trim();
const driver2Status = String(p[`bus${i}_driver2Status`] || "Pending").trim();
    const rowObj = {
      tripKey: tripKey,
      busNumber: i,
      busId: busId,
      driver1: driver1 || "None",
      driver2: driver2 || "None",
    };
```

**Replace with:**
```javascript
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
```

---

## 2. weekData_ — Wrong placement of aDriver1Status / aDriver2Status

You added these at the **top** of `weekData_` (before `asnHdr` exists), which will throw a ReferenceError.

**Remove these lines** from the top of weekData_ (near the start/end check):
```javascript
  const aDriver1Status = idx(asnHdr, "driver1Status");
const aDriver2Status = idx(asnHdr, "driver2Status");
```

**Add them** after the other assignment indices (with `aDriver1`, `aDriver2`):
```javascript
  const aDriver1 = idx(asnHdr, "driver1");
  const aDriver2 = idx(asnHdr, "driver2");
  const aDriver1Status = idx(asnHdr, "driver1Status");
  const aDriver2Status = idx(asnHdr, "driver2Status");
```

**Then add** to the assignments.push object:
```javascript
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

## 3. listBusAssignmentsForRange_ — Add driver1Status/driver2Status

This function builds the output manually. Add the new fields:

**Find:**
```javascript
    out.push({
      tripKey: k,
      busNumber: String(a.busNumber || "").trim(),
      busId,
      driver1: String(a.driver1 || "").trim(),
      driver2: String(a.driver2 || "").trim(),
    });
```

**Replace with:**
```javascript
    out.push({
      tripKey: k,
      busNumber: String(a.busNumber || "").trim(),
      busId,
      driver1: String(a.driver1 || "").trim(),
      driver2: String(a.driver2 || "").trim(),
      driver1Status: String(a.driver1Status || "").trim(),
      driver2Status: String(a.driver2Status || "").trim(),
    });
```

---

## 4. BusAssignments sheet

Ensure the sheet has `driver1Status` and `driver2Status` column headers. If you use `ensureHeaders_`, it will add them when the script runs. Or add them manually in Google Sheets after the `driver2` column.
