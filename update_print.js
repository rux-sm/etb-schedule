const fs = require('fs');

// 1. Update app.js
const appFile = '/Volumes/T7 Shield/etb_trip_schedule/app.js';
let app = fs.readFileSync(appFile, 'utf8');

const appReplacement = `function buildPrintScheduleFullLetter() {
  const printRoot = document.getElementById("printRoot");
  if (!printRoot) return;

  const weekTitle = document.getElementById("headerWeek")?.textContent || "Schedule";
  const dates = getWeekDates();
  const dayIds = getDayIds();

  let html = \`
    <div class="print-page">
      <div class="print-header">
        <h2 class="print-title">\${escHtml(weekTitle)}</h2>
      </div>
      <table class="print-data-table">
        <thead>
          <tr>
            <th class="col-bus">Bus</th>
            \${dates.map((d, i) => {
              const dObj = parseYMD(d);
              const dayStr = dObj ? dObj.toLocaleDateString('en-US', {weekday: 'short'}) : dayIds[i];
              const dateStr = dObj ? \`\${dObj.getMonth()+1}/\${dObj.getDate()}\` : d;
              return \`<th class="col-day">\${escHtml(dayStr)} \${escHtml(dateStr)}</th>\`;
            }).join("")}
          </tr>
        </thead>
        <tbody>
  \`;

  const buses = state.busesList || [];
  for (const bus of buses) {
    const busId = String(bus.busId || bus.id || "").trim();
    if (!busId || busId === "None" || busId === "WAITING_LIST") continue;

    const busTrips = state.trips.filter(t => {
      const a = state.assignmentsByTripKey[t.tripKey] || {};
      return String(a.busId).trim() === busId;
    });
    
    // Only print rows for buses that actually have trips? The prompt says "Group the data by Bus (Y-axis)"
    // Let's print all active buses, or maybe only buses with trips? The user said "loop through state.busesList", so we'll do all buses.

    html += \`<tr>\`;
    html += \`<td class="bus-id-cell"><strong>\${escHtml(busId)}</strong></td>\`;

    let skipDays = 0;
    for (let i = 0; i < 7; i++) {
      if (skipDays > 0) {
        skipDays--;
        continue;
      }

      const currentYMD = dates[i];
      const tripsToday = busTrips.filter(t => {
        const start = ymd(parseYMD(t.departureDate));
        const end = ymd(parseYMD(t.arrivalDate) || parseYMD(t.departureDate));
        return currentYMD >= start && currentYMD <= end;
      });

      if (tripsToday.length === 0) {
        html += \`<td></td>\`;
      } else {
        tripsToday.sort((a, b) => (a.departureTime || "").localeCompare(b.departureTime || ""));
        const t = tripsToday[0];
        const a = state.assignmentsByTripKey[t.tripKey] || {};
        
        const tEndYMD = ymd(parseYMD(t.arrivalDate) || parseYMD(t.departureDate));
        let colspan = 1;
        for (let j = i + 1; j < 7; j++) {
           if (dates[j] <= tEndYMD) colspan++;
           else break;
        }

        html += \`<td colspan="\${colspan}" class="trip-cell">
          <div class="trip-content">
            <div class="trip-dest-cust"><strong>\${escHtml(t.destination)}</strong> - \${escHtml(t.customer)}</div>
            <div class="trip-times">⏱ \${normalizeTime(t.departureTime)} - \${normalizeTime(t.arrivalTime)}</div>
            <div class="trip-drivers">👤 D1: \${escHtml(a.driver1 || '—')} | D2: \${escHtml(a.driver2 || '—')}</div>
            <div class="trip-notes">📝 \${escHtml(t.notes || '')}</div>
          </div>
        </td>\`;

        skipDays = colspan - 1;
      }
    }
    html += \`</tr>\`;
  }

  html += \`</tbody></table></div>\`;

  printRoot.innerHTML = html;
  printRoot.classList.add("print-mode-letter-full");
}\`;

// Replace lines 3665 to 3793 (0-indexed, which corresponds to lines 3666 to 3794 inclusive)
let appLines = app.split('\n');
appLines.splice(3665, 129, appReplacement);
fs.writeFileSync(appFile, appLines.join('\n'));
console.log('Updated app.js');

// 2. Update styles.css
const cssFile = '/Volumes/T7 Shield/etb_trip_schedule/styles.css';
let css = fs.readFileSync(cssFile, 'utf8');

const cssReplacement = `@media print {
  @page {
    size: letter landscape;
    margin: 0.25in;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100%;
    height: 100%;
    background: white !important;
    color: black !important;
    font-size: 10pt;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .app, .topbar, .theme-toggle, .context-menu, .modal, .loading-overlay, #toast, #toastBackdrop {
    display: none !important;
  }

  #printRoot {
    display: block !important;
    visibility: visible !important;
    position: static !important;
    width: 100% !important;
    background: white !important;
    overflow: visible !important;
  }

  .print-page {
    width: 100%;
    page-break-after: always;
  }
  
  .print-page:last-child {
    page-break-after: auto;
  }

  .print-header {
    margin-bottom: 15px;
    padding-bottom: 5px;
  }

  .print-title {
    font-size: 18pt;
    font-weight: bold;
    color: black;
    margin: 0;
  }

  .print-data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .print-data-table th, .print-data-table td {
    border: 1px solid #ccc !important;
    padding: 6px !important;
    font-size: 9pt !important;
    vertical-align: top;
    color: black !important;
    background: white !important;
  }

  .print-data-table th {
    background-color: #f8f9fa !important;
    font-weight: bold !important;
    text-align: center;
  }

  .print-data-table .col-bus {
    width: 60px;
  }
  
  .print-data-table tbody tr {
    page-break-inside: avoid;
  }

  .bus-id-cell strong {
    font-size: 11pt;
  }

  .trip-cell {
    background-color: white !important;
  }

  .trip-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .trip-dest-cust {
    font-size: 9.5pt;
  }

  .trip-times, .trip-drivers, .trip-notes {
    font-size: 9pt;
  }
}`;

let cssLines = css.split('\n');
// lines 4104 through 4487 inclusive (384 lines starting at index 4104)
cssLines.splice(4104, 384, cssReplacement);
fs.writeFileSync(cssFile, cssLines.join('\n'));
console.log('Updated styles.css');
