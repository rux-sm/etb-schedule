# Backend (Google Apps Script) – Add requirement columns support

You already added the 6 columns to the Trips sheet. Apply these **three changes** in your Apps Script editor.

---

## 1. Add the 6 headers to `HEADERS.Trips`

Find the line that defines `HEADERS.Trips` and add the six requirement column names (e.g. after `"comments"`):

```javascript
const HEADERS = {
  Trips: [
    "tripKey", "tripId", "destination", "customer", "contactName", "phone",
    "departureDate", "arrivalDate", "departureTime", "arrivalTime",
    "itineraryStatus", "contactStatus", "paymentStatus", "driverStatus",
    "invoiceStatus", "invoiceNumber",
    "busesNeeded", "tripColor", "notes", "itinerary", "comments",
    "req56Pass", "reqSleeper", "reqLift", "reqRelief", "reqCoDriver", "reqHotel",
    "createdAt", "updatedAt"
  ],
  // ... rest unchanged
};
```

---

## 2. In `mapTripFromParams_` – persist the 6 requirement fields

Inside the object you return in `mapTripFromParams_(p, base)`, add the six requirement fields (after `comments` / before `createdAt`). Use the same pattern as other booleans: treat `"true"` as true, anything else as false.

Add these lines to the returned object:

```javascript
    comments: incomingComments,
    req56Pass: String(p.req56Pass || "").toLowerCase() === "true",
    reqSleeper: String(p.reqSleeper || "").toLowerCase() === "true",
    reqLift: String(p.reqLift || "").toLowerCase() === "true",
    reqRelief: String(p.reqRelief || "").toLowerCase() === "true",
    reqCoDriver: String(p.reqCoDriver || "").toLowerCase() === "true",
    reqHotel: String(p.reqHotel || "").toLowerCase() === "true",
    createdAt: base.createdAt,
    updatedAt: base.updatedAt
```

(If you prefer to store the literal strings `"true"`/`"false"` in the sheet instead of boolean, you can use:

```javascript
    req56Pass: String(p.req56Pass || "").trim() === "true" ? "true" : "false",
    reqSleeper: String(p.reqSleeper || "").trim() === "true" ? "true" : "false",
    reqLift: String(p.reqLift || "").trim() === "true" ? "true" : "false",
    reqRelief: String(p.reqRelief || "").trim() === "true" ? "true" : "false",
    reqCoDriver: String(p.reqCoDriver || "").trim() === "true" ? "true" : "false",
    reqHotel: String(p.reqHotel || "").trim() === "true" ? "true" : "false",
```

Google Sheets will display TRUE/FALSE for booleans; the frontend accepts both.)

---

## 3. In `weekData_` – read and return the 6 columns for each trip

**A) Add column indices** (with the other trip indices, e.g. after `iComments`):

```javascript
  const iComments = idx(tripsHdr, "comments");
  const iReq56Pass = idx(tripsHdr, "req56Pass");
  const iReqSleeper = idx(tripsHdr, "reqSleeper");
  const iReqLift = idx(tripsHdr, "reqLift");
  const iReqRelief = idx(tripsHdr, "reqRelief");
  const iReqCoDriver = idx(tripsHdr, "reqCoDriver");
  const iReqHotel = idx(tripsHdr, "reqHotel");
  const iCreatedAt = idx(tripsHdr, "createdAt");
  const iUpdatedAt = idx(tripsHdr, "updatedAt");
```

**B) In the loop where you build each trip object** (the `trips.push({ ... })` block), add the six properties (e.g. after `comments`). Use a small helper so both boolean and string sheet values work:

```javascript
    comments: iComments >= 0 ? (row[iComments] || "") : "",
    req56Pass: iReq56Pass >= 0 ? truthy_(row[iReq56Pass]) : false,
    reqSleeper: iReqSleeper >= 0 ? truthy_(row[iReqSleeper]) : false,
    reqLift: iReqLift >= 0 ? truthy_(row[iReqLift]) : false,
    reqRelief: iReqRelief >= 0 ? truthy_(row[iReqRelief]) : false,
    reqCoDriver: iReqCoDriver >= 0 ? truthy_(row[iReqCoDriver]) : false,
    reqHotel: iReqHotel >= 0 ? truthy_(row[iReqHotel]) : false,
    createdAt: iCreatedAt >= 0 ? (row[iCreatedAt] || "") : "",
    updatedAt: iUpdatedAt >= 0 ? (row[iUpdatedAt] || "") : ""
```

**C) Add this helper** near your other helpers (e.g. near `normalizeDateOut_`):

```javascript
function truthy_(v) {
  if (v === true) return true;
  if (v === false || v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "on";
}
```

---

## 4. (Optional) `getTrip_` / `listTrips_`

They use `getRowObject_` / `readAllAsObjects_` with `HEADERS.Trips`. Once the six names are in `HEADERS.Trips`, those functions will automatically read and return the six columns. No extra code needed.

---

## 5. After deploying

- Run **ensureAllSheets_** once (or let it run on the next doPost/doGet) so the Trips sheet gets the new headers if you use `ensureHeaders_` to add missing columns.
- If you added the columns manually in the sheet, ensure the header row has exactly:  
  `req56Pass`, `reqSleeper`, `reqLift`, `reqRelief`, `reqCoDriver`, `reqHotel`.
- Invalidate week cache (e.g. a trip save already calls `invalidateWeekCache_()`) so the next `weekData` load returns the new fields.

After these updates, create/update trip and weekData will persist and return the six requirement fields so the app can show the requirement icons on the bars.
