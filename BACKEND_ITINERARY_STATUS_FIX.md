# Backend fix: Auto-set itineraryStatus when PDF is uploaded

Your `uploadItineraryPdf_` function only updates `itineraryPdfUrl` in the Trips sheet. Add these lines to also set `itineraryStatus` to "Received" when a PDF is successfully uploaded.

## Change to make in your Google Apps Script

Find this block in `uploadItineraryPdf_`:

```javascript
  if (rowIndex > 0) {
    const headerRow = tripsSheet.getRange(1, 1, 1, tripsSheet.getLastColumn()).getValues()[0].map(String);
    const colIndex = headerRow.indexOf("itineraryPdfUrl");
    if (colIndex >= 0) {
      tripsSheet.getRange(rowIndex, colIndex + 1).setValue(viewUrl);
    }
  }
```

**Replace it with:**

```javascript
  if (rowIndex > 0) {
    const headerRow = tripsSheet.getRange(1, 1, 1, tripsSheet.getLastColumn()).getValues()[0].map(String);
    const colPdfUrl = headerRow.indexOf("itineraryPdfUrl");
    const colStatus = headerRow.indexOf("itineraryStatus");
    if (colPdfUrl >= 0) {
      tripsSheet.getRange(rowIndex, colPdfUrl + 1).setValue(viewUrl);
    }
    if (colStatus >= 0) {
      tripsSheet.getRange(rowIndex, colStatus + 1).setValue("Received");
    }
  }
```

This updates both the PDF URL and the itinerary status in one operation when the upload succeeds. The client already updates local state; this ensures the backend persists it so the status survives refresh.
