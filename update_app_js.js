const fs = require('fs');

const appJsPath = '/Volumes/T7 Shield/etb_trip_schedule/app.js';
let js = fs.readFileSync(appJsPath, 'utf-8');

js = js.replace(
`function setRequirementTogglesFromTrip(t = {}) {
  const ids = ["req56Pass", "reqSleeper", "reqLift", "reqRelief", "reqCoDriver", "reqHotel"];
  ids.forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.setAttribute("aria-pressed", truthyRequirement(t[id]) ? "true" : "false");
  });
}`,
`function setRequirementTogglesFromTrip(t = {}) {
  const ids = ["req56Pass", "reqSleeper", "reqLift", "reqRelief", "reqCoDriver", "reqHotel"];
  ids.forEach((id) => {
    const toggle = document.getElementById(id + "Toggle");
    if (!toggle) return;
    toggle.checked = truthyRequirement(t[id]);
  });
}`
);

js = js.replace(
`function resetRequirementToggles() {
  document.querySelectorAll(".toggle-pill").forEach((btn) => {
    btn.setAttribute("aria-pressed", "false");
  });
}`,
`function resetRequirementToggles() {
  const ids = ["req56Pass", "reqSleeper", "reqLift", "reqRelief", "reqCoDriver", "reqHotel"];
  ids.forEach((id) => {
    const toggle = document.getElementById(id + "Toggle");
    if (toggle) toggle.checked = false;
  });
}`
);

js = js.replace(
`      req56Pass: $("req56Pass")?.getAttribute("aria-pressed") === "true",
      reqSleeper: $("reqSleeper")?.getAttribute("aria-pressed") === "true",
      reqLift: $("reqLift")?.getAttribute("aria-pressed") === "true",
      reqRelief: $("reqRelief")?.getAttribute("aria-pressed") === "true",
      reqCoDriver: $("reqCoDriver")?.getAttribute("aria-pressed") === "true",
      reqHotel: $("reqHotel")?.getAttribute("aria-pressed") === "true",`,
`      req56Pass: $("req56PassToggle")?.checked || false,
      reqSleeper: $("reqSleeperToggle")?.checked || false,
      reqLift: $("reqLiftToggle")?.checked || false,
      reqRelief: $("reqReliefToggle")?.checked || false,
      reqCoDriver: $("reqCoDriverToggle")?.checked || false,
      reqHotel: $("reqHotelToggle")?.checked || false,`
);

js = js.replace(
`    // Sync requirement toggles to hidden inputs so backend receives them
    ["req56Pass", "reqSleeper", "reqLift", "reqRelief", "reqCoDriver", "reqHotel"].forEach((id) => {
      const btn = $(id);
      const hidden = $(id + "Value");
      if (btn && hidden) {
        hidden.value = btn.getAttribute("aria-pressed") === "true" ? "true" : "false";
      }
    });`,
`    // Sync requirement toggles to hidden inputs so backend receives them
    ["req56Pass", "reqSleeper", "reqLift", "reqRelief", "reqCoDriver", "reqHotel"].forEach((id) => {
      const toggle = $(id + "Toggle");
      const hidden = $(id + "Value");
      if (toggle && hidden) {
        hidden.value = toggle.checked ? "true" : "false";
      }
    });`
);

// remove the click listener for toggle pills, since they're just checkboxes now
js = js.replace(
`  // Toggle pills — click toggles aria-pressed
  document.querySelectorAll(".toggle-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", pressed ? "false" : "true");
    });
  });`,
``
);

fs.writeFileSync(appJsPath, js);
console.log("App.js updated");
