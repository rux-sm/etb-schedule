const fs = require('fs');

const indexPath = '/Volumes/T7 Shield/etb_trip_schedule/index.html';
let html = fs.readFileSync(indexPath, 'utf-8');

// 1. Labels sentence case
html = html.replace(/<label for="tripDate">Departure Date<\/label>/g, '<label for="tripDate">Departure date</label>');
html = html.replace(/<label for="arrivalDate">Arrival Date<\/label>/g, '<label for="arrivalDate">Arrival date</label>');
html = html.replace(/<label for="departureTime">Departure Time<\/label>/g, '<label for="departureTime">Departure time</label>');
html = html.replace(/<label for="spotTime">Spot Time<\/label>/g, '<label for="spotTime">Spot time</label>');
html = html.replace(/<label for="arrivalTime">Arrival Time<\/label>/g, '<label for="arrivalTime">Arrival time</label>');
html = html.replace(/<label for="envelopePickup">Pick Up Address<\/label>/g, '<label for="envelopePickup">Pick up address</label>');
html = html.replace(/<label for="envelopeTripContact">Trip Contact<\/label>/g, '<label for="envelopeTripContact">Trip contact</label>');
html = html.replace(/<label for="envelopeTripPhone">Trip Contact Phone<\/label>/g, '<label for="envelopeTripPhone">Trip contact phone</label>');
html = html.replace(/<span class="field-label">Envelope Notes<\/span>/g, '<span class="field-label">Envelope notes</span>');
html = html.replace(/<label for="itineraryStatus">Itinerary Status<\/label>/g, '<label for="itineraryStatus">Itinerary status</label>');
html = html.replace(/<label for="contactStatus">Contact Status<\/label>/g, '<label for="contactStatus">Contact status</label>');
html = html.replace(/<label for="paymentStatus">Approval Status<\/label>/g, '<label for="paymentStatus">Approval status</label>');
html = html.replace(/<label for="driverStatus">Driver Status<\/label>/g, '<label for="driverStatus">Driver status</label>');
html = html.replace(/<label for="invoiceStatus">Invoice Status<\/label>/g, '<label for="invoiceStatus">Invoice status</label>');
html = html.replace(/<label for="invoiceNumber">Invoice Number<\/label>/g, '<label for="invoiceNumber">Invoice number</label>');

// 2. Button clusters - ghost/secondary & specific layout class
html = html.replace(
  /<div class="form-actions form-actions--grid">/g,
  '<div class="trip-editor__btn-cluster">'
);
html = html.replace(
  /<button\s+id="itineraryBtn"\s+type="button"\s+class="btn"/g,
  '<button\n                          id="itineraryBtn"\n                          type="button"\n                          class="trip-editor__cluster-btn"'
);
html = html.replace(
  /<button\s+id="envelopeBtn"\s+type="button"\s+class="btn"/g,
  '<button\n                          id="envelopeBtn"\n                          type="button"\n                          class="trip-editor__cluster-btn"'
);
html = html.replace(
  /<button\s+id="openItineraryPdfBtn"\s+type="button"\s+class="btn"/g,
  '<button\n                          id="openItineraryPdfBtn"\n                          type="button"\n                          class="trip-editor__cluster-btn"'
);
html = html.replace(
  /<button\s+id="removeItineraryPdfBtn"\s+type="button"\s+class="btn btn--danger"/g,
  '<button\n                          id="removeItineraryPdfBtn"\n                          type="button"\n                          class="trip-editor__cluster-btn trip-editor__cluster-btn--danger"'
);

// 3. Requirements Section
const oldReqs = `<div
                        class="toggle-pill__grid"
                        role="group"
                        aria-label="Requirements"
                      >
                        <button
                          type="button"
                          class="toggle-pill"
                          id="req56Pass"
                          aria-pressed="false"
                        >
                          <span
                            class="toggle-pill__icon material-symbols-outlined"
                            aria-hidden="true"
                            >tatami_seat</span
                          >
                          56 Pax
                        </button>
                        <button
                          type="button"
                          class="toggle-pill"
                          id="reqSleeper"
                          aria-pressed="false"
                        >
                          <span
                            class="toggle-pill__icon material-symbols-outlined"
                            aria-hidden="true"
                            >airline_seat_flat</span
                          >
                          Sleeper
                        </button>
                        <button
                          type="button"
                          class="toggle-pill"
                          id="reqLift"
                          aria-pressed="false"
                        >
                          <span
                            class="toggle-pill__icon material-symbols-outlined"
                            aria-hidden="true"
                            >accessible</span
                          >
                          Lift
                        </button>
                        <button
                          type="button"
                          class="toggle-pill"
                          id="reqRelief"
                          aria-pressed="false"
                        >
                          <span
                            class="toggle-pill__icon material-symbols-outlined"
                            aria-hidden="true"
                            >warning</span
                          >
                          Relief
                        </button>
                        <button
                          type="button"
                          class="toggle-pill"
                          id="reqCoDriver"
                          aria-pressed="false"
                        >
                          <span
                            class="toggle-pill__icon material-symbols-outlined"
                            aria-hidden="true"
                            >person_add</span
                          >
                          Co-Driver
                        </button>
                        <button
                          type="button"
                          class="toggle-pill"
                          id="reqHotel"
                          aria-pressed="false"
                        >
                          <span
                            class="toggle-pill__icon material-symbols-outlined"
                            aria-hidden="true"
                            >apartment</span
                          >
                          Hotel
                        </button>
                      </div>`;

const newReqs = `<div class="trip-editor__requirements-list">
                        <div class="trip-editor__req-item">
                          <span class="trip-editor__req-label">56 Pax</span>
                          <label class="toggle-switch">
                            <input type="checkbox" id="req56PassToggle" aria-label="56 Pax" />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                        <div class="trip-editor__req-item">
                          <span class="trip-editor__req-label">Sleeper</span>
                          <label class="toggle-switch">
                            <input type="checkbox" id="reqSleeperToggle" aria-label="Sleeper" />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                        <div class="trip-editor__req-item">
                          <span class="trip-editor__req-label">Lift</span>
                          <label class="toggle-switch">
                            <input type="checkbox" id="reqLiftToggle" aria-label="Lift" />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                        <div class="trip-editor__req-item">
                          <span class="trip-editor__req-label">Relief driver</span>
                          <label class="toggle-switch">
                            <input type="checkbox" id="reqReliefToggle" aria-label="Relief driver" />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                        <div class="trip-editor__req-item">
                          <span class="trip-editor__req-label">Co-Driver</span>
                          <label class="toggle-switch">
                            <input type="checkbox" id="reqCoDriverToggle" aria-label="Co-Driver" />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                        <div class="trip-editor__req-item">
                          <span class="trip-editor__req-label">Hotel</span>
                          <label class="toggle-switch">
                            <input type="checkbox" id="reqHotelToggle" aria-label="Hotel" />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                      </div>`;

html = html.replace(oldReqs, newReqs);

// 4. Status Dropdowns: I'll wrap them in an HR and format them via CSS inside `.status-grid`
// Add divider above action buttons (form-actions at bottom)
html = html.replace(
  /<div class="form-actions">\n\s*<button\n\s*type="button"\n\s*class="btn btn--danger"/,
  '<div class="trip-editor__divider"></div>\n                  <div class="trip-editor__bottom-actions">\n                    <button\n                      type="button"\n                      class="trip-editor__action-btn trip-editor__action-btn--delete"'
);

html = html.replace(
  /<button\n\s*type="button"\n\s*class="btn btn--secondary"\n\s*id="newBtn"/,
  '<button\n                      type="button"\n                      class="trip-editor__action-btn trip-editor__action-btn--clear"\n                      id="newBtn"'
);

html = html.replace(
  /<button\n\s*type="submit"\n\s*class="btn btn--primary"\n\s*id="saveBtn"\n\s*form="tripForm"/,
  '<button\n                      type="submit"\n                      class="trip-editor__action-btn trip-editor__action-btn--save"\n                      id="saveBtn"\n                      form="tripForm"'
);

// close it out properly
html = html.replace(
  /<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<iframe/,
  '</button>\n                  </div>\n                </div>\n\n                <iframe'
);

// Wrap separators above Requirements and Status Grid:
html = html.replace(
  /<span class="field-label">Requirements<\/span>/,
  '<div class="trip-editor__divider"></div>\n                      <span class="trip-editor__section-label">Requirements</span>'
);

// we can rename `.status-grid` to `.trip-editor__status-grid` or keep it but surround it with a divider
html = html.replace(
  /<\/div>\n\s*<div class="status-grid">/,
  '</div>\n                      <div class="trip-editor__divider"></div>\n                      <div class="status-grid trip-editor__status-grid">'
);


fs.writeFileSync(indexPath, html);
console.log("Trip Editor HTML updated");
