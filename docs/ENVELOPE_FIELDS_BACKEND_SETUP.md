# Backend setup: save envelope fields to Google Sheet

The app sends four **envelope-only** fields when saving a trip. To persist them so you can print later, update your Google Sheet and Apps Script as below.

---

## 1. Google Sheet – add 4 columns

Add four new columns to the sheet where you store trip rows (same row as each trip). Name the columns however you like; the script will map them. Example:

| Column header (example) | Purpose |
|------------------------|--------|
| Envelope Pickup | Pickup address on the envelope |
| Envelope Trip Contact | Trip contact name on the envelope |
| Envelope Trip Phone | Trip contact phone on the envelope |
| Envelope Trip Notes | Trip notes on the envelope (multiline) |

Note where these columns are (e.g. column indices or header names). You’ll use them in the script in the next steps.

---

## 2. Apps Script – when you **save** a trip (form POST)

The form is submitted with `action=create` or `action=update`. It includes these **parameter names** (same as the form `name` attributes):

- `envelopePickup`
- `envelopeTripContact`
- `envelopeTripPhone`
- `envelopeTripNotes`

In the function that handles the form POST and writes a trip row:

1. Read the four parameters (e.g. from `e.parameter` in `doPost`, or from your request/parsed form object):
   - `envelopePickup`
   - `envelopeTripContact`
   - `envelopeTripPhone`
   - `envelopeTripNotes`

2. Write their values into the four new columns for that trip’s row (create or update).

Example (conceptual; adjust to your sheet/API style):

```javascript
// When building the row to write (create or update), add:
var envelopePickup     = (e.parameter.envelopePickup     || '').toString().trim();
var envelopeTripContact = (e.parameter.envelopeTripContact || '').toString().trim();
var envelopeTripPhone  = (e.parameter.envelopeTripPhone  || '').toString().trim();
var envelopeTripNotes  = (e.parameter.envelopeTripNotes  || '').toString().trim();

// Then write these to the 4 new columns for this trip's row.
// (Exact code depends on how you write rows: setValues, appendRow, etc.)
```

---

## 3. Apps Script – when you **return** trip data (weekData & getTrip)

The app expects each trip object to optionally include these **property names** (same as in the frontend):

- `envelopePickup`
- `envelopeTripContact`
- `envelopeTripPhone`
- `envelopeTripNotes`

In the code that builds the trip objects for:

- **weekData** (response that contains `trips`)
- **getTrip** (response that contains a single `trip`)

add the four envelope columns from the sheet into each trip object with the keys above.

Example (conceptual):

```javascript
// When building a trip object from a sheet row:
var trip = {
  tripKey: row.tripKey,
  destination: row.destination,
  contactName: row.contactName,
  phone: row.phone,
  notes: row.notes,
  // ... your existing fields ...

  // Envelope-only fields (from new columns)
  envelopePickup:      (row.envelopePickup      || '').toString().trim(),
  envelopeTripContact: (row.envelopeTripContact || '').toString().trim(),
  envelopeTripPhone:   (row.envelopeTripPhone   || '').toString().trim(),
  envelopeTripNotes:   (row.envelopeTripNotes   || '').toString().trim()
};
```

Use the same property names so the frontend can read them without changes.

---

## 4. Summary

| Step | Where | What to do |
|------|--------|------------|
| 1 | Sheet | Add 4 columns for envelope pickup, trip contact, trip phone, trip notes. |
| 2 | Script (save) | On form POST, read `envelopePickup`, `envelopeTripContact`, `envelopeTripPhone`, `envelopeTripNotes` and write them to the new columns. |
| 3 | Script (read) | In weekData and getTrip, include those 4 columns in each trip object as `envelopePickup`, `envelopeTripContact`, `envelopeTripPhone`, `envelopeTripNotes`. |

After this, saving from the envelope modal will store these values in the sheet, and loading the week or opening a trip will bring them back so you can print later.
