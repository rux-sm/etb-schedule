const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const targetFunctionStart = code.indexOf('function generateNextDayReport(selectedDate = null)');
const targetFunctionEnd = code.indexOf(`dom.nextDayReportModal.hidden = false;\n}`, targetFunctionStart) + 40;

if (targetFunctionStart === -1 || targetFunctionEnd === -1) {
  console.log("Could not find bounds of generateNextDayReport");
  process.exit(1);
}

const newLogic = `function generateNextDayReport(selectedDate = null) {
  // Use selected date, fallback to start of the currently viewed week
  let startD = selectedDate ? new Date(selectedDate) : new Date(state.currentDate || new Date());
  
  // If no date was selected manually, ensure we start on Monday/Sunday based on settings
  if (!selectedDate) {
    if (state.weekStartsMonday) {
      if (startD.getDay() === 0) startD = addDays(startD, -6);
      else startD = addDays(startD, 1 - startD.getDay());
    } else {
      startD = addDays(startD, -startD.getDay());
    }
  }

  const startYMD = ymd(startD);
  if (dom.nextDayReportDateInput && dom.nextDayReportDateInput.value !== startYMD) {
    dom.nextDayReportDateInput.value = startYMD;
  }

  let fullHtml = \\\`<div style="padding-bottom: 20px;">\\\`;
  
  // Loop 7 days
  for (let i = 0; i < 7; i++) {
    const today = addDays(startD, i);
    const tomorrow = addDays(today, 1);
    const todayYMD = ymd(today);
    const tomorrowYMD = ymd(tomorrow);

    // Find all buses that have a trip departing tomorrow
    const busesDepartingTomorrow = new Set();
    const tripsDepartingTomorrow = state.trips.filter(t => t.departureDate === tomorrowYMD);

    tripsDepartingTomorrow.forEach(trip => {
      const assigns = state.assignmentsByTripKey[trip.tripKey] || [];
      assigns.forEach(a => {
        const busId = String(a.busId || "").trim();
        if (busId && busId !== "None" && busId !== "WAITING_LIST") {
          busesDepartingTomorrow.add(busId);
        }
      });
    });

    // For these buses, find when they arrive today
    const reportData = [];
    const priorityBusesInfo = [];

    busesDepartingTomorrow.forEach(busId => {
      let arrivalTimeToday = "Already in yard / No arrival today";
      let departureTimeTomorrow = "Unknown";
      let maintenanceWindow = "Flexible (Bus is in yard)";

      // Find departure time tomorrow
      const tomorrowTrip = tripsDepartingTomorrow.find(t => {
        const assigns = state.assignmentsByTripKey[t.tripKey] || [];
        return assigns.some(a => String(a.busId).trim() === busId);
      });

      if (tomorrowTrip && tomorrowTrip.departureTime) {
        departureTimeTomorrow = formatTime12(tomorrowTrip.departureTime);
      }

      // Find arrival time today
      const tripsArrivingToday = state.trips.filter(t => {
        const arrDate = t.arrivalDate || t.departureDate;
        if (arrDate !== todayYMD) return false;
        const assigns = state.assignmentsByTripKey[t.tripKey] || [];
        return assigns.some(a => String(a.busId).trim() === busId);
      });

      // Sort by arrival time descending
      tripsArrivingToday.sort((a, b) => {
        const timeA = normalizeTime(a.arrivalTime) || "00:00";
        const timeB = normalizeTime(b.arrivalTime) || "00:00";
        return timeB.localeCompare(timeA);
      });

      if (tripsArrivingToday.length > 0) {
        const lastTripToday = tripsArrivingToday[0];
        if (lastTripToday.arrivalTime) {
          arrivalTimeToday = formatTime12(lastTripToday.arrivalTime);

          let arrHour = 0;
          const normedArr = normalizeTime(lastTripToday.arrivalTime);
          if (normedArr) {
            arrHour = parseInt(normedArr.split(':')[0], 10);
          }

          if (arrHour < 8) {
            maintenanceWindow = "8:00 AM - 4:00 PM";
          } else if (arrHour >= 8 && arrHour <= 16) {
            maintenanceWindow = "4:00 PM - 12:00 AM (Midnight)";
          } else {
            maintenanceWindow = "Night Shift (After Arrival)";
          }
        }
        
        let arrTimeNum = 0;
        if (lastTripToday.arrivalTime) {
          const normedArr = normalizeTime(lastTripToday.arrivalTime);
          if (normedArr) {
            arrTimeNum = parseInt(normedArr.split(':')[0], 10) + parseInt(normedArr.split(':')[1], 10) / 60;
          }
        }
        
        let depTimeNum = 32; // Default 8 AM tomorrow
        if (tomorrowTrip && tomorrowTrip.departureTime) {
          const normedDep = normalizeTime(tomorrowTrip.departureTime);
          if (normedDep) {
            depTimeNum = 24 + parseInt(normedDep.split(':')[0], 10) + parseInt(normedDep.split(':')[1], 10) / 60;
          }
        }
        priorityBusesInfo.push({ a: arrTimeNum, d: depTimeNum });

        reportData.push({
          busId,
          arrivalTimeToday,
          departureTimeTomorrow,
          maintenanceWindow,
          priority: 1 // High Priority
        });
      } else {
        reportData.push({
          busId,
          arrivalTimeToday,
          departureTimeTomorrow,
          maintenanceWindow,
          priority: 2 // Low Priority
        });
      }
    });

    // Sort by Priority first (1 then 2), then by bus number
    reportData.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return parseInt(a.busId) - parseInt(b.busId);
    });

    // Calculate best 8-hour shift
    let shiftDisplay = "";
    if (priorityBusesInfo.length > 0) {
      let bestShift = null;
      for (let s = 12; s <= 32; s += 0.5) {
        let valid = true;
        for (const b of priorityBusesInfo) {
          const overlap = Math.min(s + 8, b.d) - Math.max(s, b.a);
          if (overlap < 2) {
            valid = false;
            break;
          }
        }
        if (valid) {
          bestShift = s;
          break; // Earliest valid 8-hour window
        }
      }
      
      if (bestShift !== null) {
        const formatTimeNum = (num) => {
          let isTmrw = num >= 24;
          let h = Math.floor(num) % 24;
          let m = Math.round((num - Math.floor(num)) * 60);
          let ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12; if (h === 0) h = 12;
          let ms = String(m).padStart(2, '0');
          let dayStr = isTmrw ? " (Next Day)" : "";
          if (isTmrw && h === 12 && ampm === 'AM') dayStr = "";
          return \\\`\\\${h}:\\\${ms} \\\${ampm}\\\${dayStr}\\\`;
        };
        
        shiftDisplay = \\\`<div style="background: var(--card-bg, #1a1a1a); padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid var(--primary-color, #0284c7);">
          <strong style="display: block; font-size: 1.05rem; margin-bottom: 4px; color: var(--text-color, #fff);">Optimal 8-Hour Maintenance Shift: <span style="color: var(--primary-color, #38bdf8);">\\\${formatTimeNum(bestShift)} - \\\${formatTimeNum(bestShift + 8)}</span></strong>
          <span style="font-size: 0.85em; color: var(--text-muted, #9ca3af);">Guarantees at least 2 hours of available yard time for every priority bus.</span>
        </div>\\\`;
      } else {
        shiftDisplay = \\\`<div style="background: var(--card-bg, #1a1a1a); padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid var(--danger-color, #dc2626);">
          <strong style="display: block; font-size: 1.05rem; margin-bottom: 4px; color: var(--danger-color, #dc2626);">No single 8-hour shift possible</strong>
          <span style="font-size: 0.85em; color: var(--text-muted, #9ca3af);">Cannot find a single 8-hour window providing 2+ hours to all priority buses.</span>
        </div>\\\`;
      }
    }

    // Wrap daily report block
    let dayHtml = \\\`<div style="margin-bottom: 40px; border-bottom: 2px dashed var(--border-color); padding-bottom: 20px;">
      <h3 style="margin-top: 0; margin-bottom: 12px; color: var(--text-color, #fff); font-size: 1.25rem;">
        \\\${formatDateForToast(todayYMD)} <span style="color: var(--text-muted, #9ca3af); font-size: 0.85em; font-weight: normal;">(Arriving)</span> \u2192 
        \\\${formatDateForToast(tomorrowYMD)} <span style="color: var(--text-muted, #9ca3af); font-size: 0.85em; font-weight: normal;">(Departing)</span>
      </h3>\\\`;
      
    dayHtml += shiftDisplay;
    
    if (reportData.length === 0) {
      dayHtml += \\\`<p style="color: var(--text-muted);">No buses found that depart tomorrow (\\\${tomorrowYMD}).</p>\\\`;
    } else {
      dayHtml += \\\`<table class="next-day-report-table" style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
            <th style="padding: 8px; color: var(--text-muted);">Bus</th>
            <th style="padding: 8px; color: var(--text-muted);">Status</th>
            <th style="padding: 8px; color: var(--text-muted);">Depart Tomorrow</th>
            <th style="padding: 8px; color: var(--text-muted);">Suggested Window</th>
          </tr>
        </thead>
        <tbody>\\\`;
      reportData.forEach(row => {
        const priorityLabel = row.priority === 1 ?
          \\\`<span style="color: #dc2626; font-weight: bold; font-size: 0.85em; display: inline-block; background: #fef2f2; padding: 2px 6px; border-radius: 4px; border: 1px solid #fecaca;">PRIORITY</span>\\\` :
          \\\`<span style="color: #16a34a; font-size: 0.85em; display: inline-block; background: #f0fdf4; padding: 2px 6px; border-radius: 4px; border: 1px solid #bbf7d0;">IN YARD</span>\\\`;

        dayHtml += \\\`<tr style="border-bottom: 1px solid var(--row-border, rgba(0,0,0,0.05)); hover: background-color: rgba(0,0,0,0.02);">
          <td style="padding: 10px 8px;"><strong>\\\${row.busId}</strong><br/>\\\${priorityLabel}</td>
          <td style="padding: 10px 8px; line-height: 1.3;">\\\${row.priority === 1 ? \\\`Arrives Today: <br/><strong>\\\${row.arrivalTimeToday}</strong>\\\` : \\\`Already in yard\\\`}</td>
          <td style="padding: 10px 8px;"><strong>\\\${row.departureTimeTomorrow}</strong></td>
          <td style="padding: 10px 8px; color: var(--primary-color, #0284c7); font-weight: 500;">\\\${row.maintenanceWindow}</td>
        </tr>\\\`;
      });
      dayHtml += \\\`</tbody></table>\\\`;
    }
    
    dayHtml += \\\`</div>\\\`;
    fullHtml += dayHtml;
  }
  
  fullHtml += \\\`</div>\\\`;
  dom.nextDayReportBody.innerHTML = fullHtml;
  dom.nextDayReportModal.hidden = false;
}`;

code = code.substring(0, targetFunctionStart) + newLogic + code.substring(targetFunctionEnd);
fs.writeFileSync('app.js', code);
console.log("Updated generateNextDayReport successfully.");
