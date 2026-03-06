// ======================================================
// 1) THEME
// ======================================================
function initThemeSystem() {
  const html = document.documentElement;
  const toggles = [
    document.getElementById("themeToggle"),
    document.getElementById("themeToggle2"),
  ].filter(Boolean);

  const savedTheme = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-theme", savedTheme);

  const updateIcons = (theme) => {
    const iconName = theme === "light" ? "dark_mode" : "light_mode";
    toggles.forEach((btn) => {
      // For themeToggle2 (dropdown), the icon is the first span.
      // For themeToggle (topbar), it's also the first/only span.
      const span = btn.querySelector("span");
      if (span) span.textContent = iconName;
    });
  };

  // Initial state
  updateIcons(savedTheme);

  const switchTheme = () => {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    updateIcons(newTheme);
  };

  toggles.forEach((btn) => {
    if (btn) btn.addEventListener("click", switchTheme);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeSystem);
} else {
  initThemeSystem();
}

// ── Empty-field class toggle (date/time inputs + default selects) ────
// Adds/removes .is-empty so CSS can dim unfilled placeholders
(function initEmptyFieldTracking() {
  const DATE_TIME = 'input[type="date"], input[type="time"]';
  const PLACEHOLDER_SELECTS = "#busesNeeded, #tripColor";
  const ALL = DATE_TIME + ", " + PLACEHOLDER_SELECTS;

  function sync(el) {
    el.classList.toggle("is-empty", !el.value);
  }
  function syncAll() {
    document.querySelectorAll(ALL).forEach(sync);
  }
  document.addEventListener("change", (e) => {
    if (e.target.matches(ALL)) sync(e.target);
  });
  // Run on load and after any programmatic .reset()
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncAll);
  } else {
    syncAll();
  }
  // Re-sync when forms are reset or trip data is loaded
  document.addEventListener("reset", () => requestAnimationFrame(syncAll));
  // Expose for manual calls after programmatic value changes
  window.syncEmptyFields = syncAll;
})();

// ======================================================
// 2) CONFIG
// ======================================================
const CONFIG = {
  ENDPOINT:
    "https://script.google.com/macros/s/AKfycbzSsVByHnMuzdmaITv2Ht-q1hUQ0y5cVVIEzV6E-h7-1EhnVWJDYlhj5K4RhY0wldBk/exec",
  BUS_LANES: ["218", "763", "470", "133", "506", "746", "607", "897", "898", "474"],
  MONTHS: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  JSONP_TIMEOUT: 20000,

  WEEK_CACHE_MAX_AGE_MS: 5 * 60 * 1000, // 5 minutes
  CONFLICT_DEFER_BARS_THRESHOLD: 70, // defer conflict scan if many bars
  CACHE_TTL_DRIVERS: 60 * 60 * 1000, // 1 hour
  AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
};

const CACHE = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() > data.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return data.value;
    } catch {
      return null;
    }
  },
  set(key, value, ttlMs) {
    try {
      const payload = {
        value,
        expiry: Date.now() + ttlMs,
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch { }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch { }
  },
  clearAll() {
    try {
      // Clear drivers/buses/weeks but maybe keep prefs?
      // For simplicity, we just clear specific keys we know about
      // or loop through keys. Let's precise-clear to be safe.
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("cache_") || k.startsWith("week_")) {
          localStorage.removeItem(k);
        }
      });
    } catch { }
  },
};

// ======================================================
// 3) DOM
// ======================================================
const $ = (id) => document.getElementById(id);

const dom = {
  toast: $("toast"),
  toastText: $("toastText"),
  toastBackdrop: $("toastBackdrop"),

  weekStartSunBtn: $("weekStartSunBtn"),
  weekStartMonBtn: $("weekStartMonBtn"),

  tripForm: $("tripForm"),
  hiddenIframe: $("hidden_iframe"),

  action: $("action"),
  tripKey: $("tripKey"),
  tripId: $("tripId"),
  tripIdBadge: $("tripIdBadge"),

  saveBtn: $("saveBtn"),
  deleteBtn: $("deleteBtn"),
  newBtn: $("newBtn"),

  itineraryBtn: $("itineraryBtn"),
  openItineraryPdfBtn: $("openItineraryPdfBtn"),
  removeItineraryPdfBtn: $("removeItineraryPdfBtn"),
  itineraryModal: $("itineraryModal"),
  itineraryField: $("itinerary"),
  itineraryModalField: $("itineraryModalField"),
  itineraryCopyBtn: $("itineraryCopyBtn"),
  itinerarySaveBtn: $("itinerarySaveBtn"),

  busesNeeded: $("busesNeeded"),
  busGrid: $("busGrid"),
  busPanel: $("busPanel"),

  agendaBody: $("agendaBody"),

  tripInputBtn: $("tripInputBtn"),
  layoutPanels: $("layoutPanels"),
  panelEnd: $("panelEnd"),

  headerWeek: $("headerWeek"), // Added for date title updates
  weekWrapper: $("dateWrapper"), // Added for width sync
  weekPicker: $("weekPicker"),
  agendaLeftBtn: $("agendaLeftBtn"),

  prevWeekBtn: $("prevWeekBtn"),
  nextWeekBtn: $("nextWeekBtn"),

  conflictPanel: $("conflictPanel"),
  conflictList: $("conflictList"),
  conflictBadge: $("overflowBadge"),

  tripDetailsModal: $("tripDetailsModal"),
  tripDetailsBody: $("tripDetailsBody"),

  driverWeekCard: $("driverWeekCard"),
  notesCard: $("notesCard"),
  notesWeekTitle: $("notesWeekTitle"),
  scheduleNotes: $("scheduleNotes"),
  saveNotesBtn: $("saveNotesBtn"),
  tripInfoCard: $("tripInfoCard"),
  driverWeekHeadRow: $("driverWeekHeadRow"),
  driverWeekBody: $("driverWeekBody"),

  driversBtn: $("driversBtn"),
  notesBtn: $("notesBtn"),
  waitingListBtn: $("waitingListBtn"),
  waitingBody: $("waitingBody"),
  waitingCard: $("waitingCard"),

  // Settings Menu
  settingsBtn: $("settingsBtn"),
  settingsMenu: $("settingsMenu"),
  todayBtn2: $("todayBtn2"),
  themeToggle: $("themeToggle"),
  themeText2: $("themeText2"),
  printBtn2: $("printBtn2"),
  printBtn2Full: $("printBtn2Full"),
  weekStartToggle: $("weekStartToggle"),
  refreshBtn2: $("refreshBtn2"),
  nextDayReportBtn: $("nextDayReportBtn"),

  // Next Day Report Modal
  nextDayReportModal: $("nextDayReportModal"),
  nextDayReportBody: $("nextDayReportBody"),
  closeNextDayReportBtn: $("closeNextDayReportBtn"),
  closeNextDayReportBackdrop: $("closeNextDayReportBackdrop"),
  printNextDayReportBtn: $("printNextDayReportBtn"),
  nextDayReportDateInput: $("nextDayReportDateInput"),

  // Daily Maintenance Plan Modal
  dailyMaintenancePlanBtn: $("dailyMaintenancePlanBtn"),
  dailyMaintenancePlanModal: $("dailyMaintenancePlanModal"),
  dailyMaintenancePlanBody: $("dailyMaintenancePlanBody"),
  closeDailyMaintenancePlanBtn: $("closeDailyMaintenancePlanBtn"),
  closeDailyMaintenancePlanBackdrop: $("closeDailyMaintenancePlanBackdrop"),
  printDailyMaintenancePlanBtn: $("printDailyMaintenancePlanBtn"),
  dailyMaintenancePlanDateInput: $("dailyMaintenancePlanDateInput"),

  // Driver Contact Modal
  driverContactModal: $("driverContactModal"),
  driverContactBody: $("driverContactBody"),
  driverReminderBody: $("driverReminderBody"),
  closeDriverContactBtn: $("closeDriverContactBtnFooter"),
  closeDriverContactBackdrop: $("closeDriverContactBackdrop"),
  copyDriverContactBtn: $("copyDriverContactBtn"),
  copyDriverReminderBtn: $("copyDriverReminderBtn"),

  // Envelope Modal & Overrides
  envelopeBtn: $("envelopeBtn"),
  envelopeOverridesSection: $("envelopeOverridesSection"),
  envelopeNote1: $("envelopeNote1"),
  envelopeNote2: $("envelopeNote2"),
  envelopeNote3: $("envelopeNote3"),
  envelopeModal: $("envelopeModal"),
  envelopeModalPages: $("envelopeModalPages"),
  envelopeAssignmentSelect: $("envelopeAssignmentSelect"),
  envelopeSaveBtn: $("envelopeSaveBtn"),
  envelopePrintBtn: $("envelopePrintBtn"),
  envelopeYellowBtn: $("envelopeYellowBtn"),
  envelopeWhiteBtn: $("envelopeWhiteBtn"),
  closeEnvelopeBtn: $("closeEnvelopeBtn"),
  closeEnvelopeBackdrop: $("closeEnvelopeBackdrop"),

  // Context Menu
  ctxMenu: $("tripContextMenu"),
  ctxHeader: $("ctxHeader"),
  ctxEditBtn: $("ctxEditBtn"),
  ctxViewBtn: $("ctxViewBtn"),
  ctxEnvelopeBtn: $("ctxEnvelopeBtn"),
  ctxOpenItineraryPdfBtn: $("ctxOpenItineraryPdfBtn"),
  ctxAttachItineraryPdfBtn: $("ctxAttachItineraryPdfBtn"),
  ctxCopyBtn: $("ctxCopyBtn"),

  // Cell Context Menu
  cellCtxMenu: $("cellContextMenu"),
  ctxNewTripBtn: $("ctxNewTripBtn"),

  // Hidden file input for itinerary PDF upload
  itineraryPdfInput: $("itineraryPdfInput"),
};

// ======================================================
// 4) STATE
// ======================================================
const state = {
  currentDate: new Date(),
  weekStartsOnMonday: false,

  busesList: [],
  driversList: [],
  busRows: [],

  trips: [],
  assignmentsByTripKey: {},
  tripByKey: {},
  busRowIndex: new Map(),

  pendingWrite: null,
  verifyFallbackTimer: null,
  toastTimer: null,

  progressCreepTimer: null,
  weekRenderDoneResolver: null,

  barElByKey: new Map(),
  renderPass: 0,

  weekCache: new Map(),
  weekInFlight: new Map(),
  weekReqId: 0,

  barMetrics: null,
  lastColMetrics: null,

  pendingConflictJob: null,

  // Pending trip key for itinerary PDF upload
  pendingItineraryTripKey: null,

  // Notes dirty tracking
  notesDirty: false,
  savedNotesValue: "",

  // Trip form dirty tracking
  tripFormDirty: false,

  // Abort controller for cancelling in-flight requests on week change
  activeAbortController: null,

  // Flag to prevent duplicate event listener wiring
  formListenersWired: false,

  // Driver unavailability tracking
  unavailabilityByDriver: {}, // { "Driver Name": { "YYYY-MM-DD": true } }

  dragSelection: {
    active: false,
    driver: null,
    mode: null, // "add" or "remove"
    dates: new Set(),
  },

  lastFocusedElement: null,

  // Card panel assignments: tracks which card is in which panel (left/right)
  // Format: { "trip" | "drivers" | "notes": "left" | "right" | null }
  cardPanelAssignments: {},
};

// ======================================================
// 5) BASIC UTILS
// ======================================================
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function debounce(fn, wait = 120) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeUUID() {
  try {
    return crypto.randomUUID();
  } catch { }
  return `tk_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clipText(s, n = 240) {
  const t = String(s || "").trim();
  return !t ? "" : t.length > n ? t.slice(0, n).trimEnd() + "…" : t;
}

function asArray(x) {
  return Array.isArray(x) ? x : [];
}

function asStr(x) {
  return x == null ? "" : String(x);
}

function asInt(x, def = 0) {
  const n = parseInt(x, 10);
  return isNaN(n) ? def : n;
}

// ======================================================
// 6) DATE + WEEK UTILS
// ======================================================
function toLocalDateInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatDateForToast(dateStr) {
  if (!dateStr) return "";
  const d = parseYMD(dateStr);
  if (!d) return dateStr;
  // Format: "Mon, Jan 2"
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function ymd(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();

  if (!state.weekStartsOnMonday) {
    date.setDate(date.getDate() - day);
    return date;
  }
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  return date;
}

function getDayIds() {
  return state.weekStartsOnMonday
    ? ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    : ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
}

function getWeekDates(base = state.currentDate) {
  const out = [];
  for (let i = 0; i < 7; i++) out.push(ymd(addDays(base, i)));
  return out;
}

function getWeekRange(base = state.currentDate) {
  const dates = getWeekDates(base);
  return {
    start: dates[0],
    end: dates[6],
    notesKey: dates[state.weekStartsOnMonday ? 0 : 1],
  };
}

function parseYMD(s) {
  if (!s) return null;
  const iso = String(s).trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ======================================================
// 7) TIME UTILS
// ======================================================
function normalizeTime(t) {
  if (!t) return "";
  if (t instanceof Date && !isNaN(t.getTime())) {
    return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  }
  const s = String(t).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s;

  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if (m) {
    let hh = Number(m[1]);
    const mm = Number(m[2]);
    const ap = m[4].toLowerCase();
    if (ap === "pm" && hh !== 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const mIso = s.match(/T(\d{2}):(\d{2})/);
    if (mIso) return `${mIso[1]}:${mIso[2]}`;
  }

  const d2 = new Date(s);
  if (!isNaN(d2.getTime())) {
    return `${String(d2.getHours()).padStart(2, "0")}:${String(d2.getMinutes()).padStart(2, "0")}`;
  }
  return "";
}

function formatTime12(timeValue) {
  const hhmm = normalizeTime(timeValue);
  if (!hhmm) return "";
  let [hh, mm] = hhmm.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;
  return `${hh}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function truthyRequirement(v) {
  if (v === true) return true;
  if (v === false || v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "on";
}

function setRequirementTogglesFromTrip(t = {}) {
  const ids = ["req56Pass", "reqSleeper", "reqLift", "reqRelief", "reqCoDriver", "reqHotel"];
  ids.forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.setAttribute("aria-pressed", truthyRequirement(t[id]) ? "true" : "false");
  });
}

function resetRequirementToggles() {
  document.querySelectorAll(".toggle-pill").forEach((btn) => {
    btn.setAttribute("aria-pressed", "false");
  });
}

// ======================================================
// 8) LIFT UTILS
// ======================================================
function truthyLift(v) {
  if (v === true) return true;
  if (v === false || v == null) return false;

  const s = String(v).trim().toLowerCase();
  return (
    s === "true" ||
    s === "yes" ||
    s === "y" ||
    s === "1" ||
    s === "on" ||
    s === "lift" ||
    s === "x" ||
    s === "✅"
  );
}

function computeLiftSet() {
  const set = new Set();

  for (const b of state.busesList || []) {
    const rawHasLift =
      b.hasLift ?? b.lift ?? b.wheelchairLift ?? b.wheelchair ?? b.wcLift ?? b.accessible;

    const has = truthyLift(rawHasLift);
    const busKey = String(b.busId ?? b.id ?? b.busNumber ?? "").trim();

    if (has && busKey) set.add(busKey);
  }

  return set;
}

function truthySleeper(v) {
  if (v === true) return true;
  if (v === false || v == null) return false;

  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "sleeper";
}

function computeSleeperSet() {
  const set = new Set();

  for (const b of state.busesList || []) {
    const rawHasSleeper = b.hasSleeper ?? b.sleeper;
    const has = truthySleeper(rawHasSleeper);
    const busKey = String(b.busId ?? b.id ?? b.busNumber ?? "").trim();

    if (has && busKey) set.add(busKey);
  }
  return set;
}

// ======================================================
// 9) PLATFORM / LAYOUT UTILS
// ======================================================
function isMobileOnly() {
  return window.matchMedia?.("(pointer: coarse)").matches || window.innerWidth <= 900;
}

function stackOffset(rowH, barH, step, laneCount) {
  const stackH = barH + (laneCount - 1) * step;
  return Math.max(0, Math.round((rowH - 1 - stackH) / 2));
}

function waitForAgendaPaint(timeoutMs = 2000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      if (state.weekRenderDoneResolver === done) state.weekRenderDoneResolver = null;
      resolve();
    }, timeoutMs);

    function done() {
      clearTimeout(t);
      resolve();
    }

    state.weekRenderDoneResolver = done;
  });
}

// ======================================================
// 10) RESPONSE SANITIZING / OK NORMALIZATION
// ======================================================
function safeOk(resp) {
  if (!resp || typeof resp !== "object") return false;
  const ok = resp.ok;
  if (ok === true) return true;
  const s = String(ok).trim().toLowerCase();
  return s === "true" || s === "ok" || s === "1";
}

function sanitizeWeekResp(resp) {
  const ok = safeOk(resp);

  const trips = asArray(resp?.trips)
    .map((t) => {
      const tripKey = asStr(t?.tripKey).trim();
      return {
        ...t,
        tripKey,
        destination: asStr(t?.destination).trim(),
        customer: asStr(t?.customer).trim(),
        contactName: asStr(t?.contactName).trim(),
        phone: asStr(t?.phone).trim(),
        departureDate: asStr(t?.departureDate).slice(0, 10),
        arrivalDate: asStr(t?.arrivalDate).slice(0, 10),
        departureTime: normalizeTime(t?.departureTime),
        spotTime: normalizeTime(t?.spotTime),
        arrivalTime: normalizeTime(t?.arrivalTime),
        busesNeeded: String(clamp(asInt(t?.busesNeeded, 0), 0, 10) || ""),
        tripColor: asStr(t?.tripColor).trim(),
        itineraryStatus: asStr(t?.itineraryStatus).trim(),
        contactStatus: asStr(t?.contactStatus).trim(),
        paymentStatus: asStr(t?.paymentStatus).trim(),
        driverStatus: asStr(t?.driverStatus).trim(),
        invoiceStatus: asStr(t?.invoiceStatus).trim(),
        invoiceNumber: asStr(t?.invoiceNumber).trim(),
        // Core text fields
        notes: asStr(t?.notes),
        comments: asStr(t?.comments),
        itinerary: asStr(t?.itinerary),
        itineraryPdfUrl: asStr(t?.itineraryPdfUrl).trim(),
        // Envelope-specific fields (optional; may not be present in older data)
        envelopePickup: asStr(t?.envelopePickup),
        envelopeTripContact: asStr(t?.envelopeTripContact),
        envelopeTripPhone: asStr(t?.envelopeTripPhone),
        envelopeTripNotes: asStr(t?.envelopeTripNotes),
      };
    })
    .filter((t) => t.tripKey);

  const assignments = asArray(resp?.assignments)
    .map((a) => ({
      tripKey: asStr(a?.tripKey).trim(),
      busId: asStr(a?.busId).trim(),
      driver1: asStr(a?.driver1).trim(),
      driver2: asStr(a?.driver2).trim(),
    }))
    .filter((a) => a.tripKey);

  // Preserve weekNotes for caching
  const weekNotes = asStr(resp?.weekNotes);

  // Preserve unavailability data
  const unavailability = asArray(resp?.unavailability)
    .map((u) => ({
      driverName: asStr(u?.driverName).trim(),
      dateYmd: asStr(u?.dateYmd).trim(),
    }))
    .filter((u) => u.driverName && u.dateYmd);

  return { ok, trips, assignments, weekNotes, unavailability, error: resp?.error };
}

// ======================================================
// 11) FETCH + RETRY + API
// ======================================================

/**
 * Modern fetch-based API call with automatic retry and timeout
 * Benefits over JSONP:
 * - 10% faster (no script element overhead)
 * - Better error detection (HTTP status codes)
 * - CSP compatible (no script injection)
 * - No global namespace pollution
 * - Request cancellation support
 */
async function fetchAPI(fn, params = {}, timeoutMs = CONFIG.JSONP_TIMEOUT) {
  return withRetry(
    async (attempt) => {
      const url = new URL(CONFIG.ENDPOINT);
      url.searchParams.set("fn", fn);

      // Add cache buster
      url.searchParams.set("_", Date.now().toString());

      // Add all parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url.toString(), {
          method: "GET",
          mode: "cors",
          cache: "no-cache",
          credentials: "omit",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const err = new Error(`HTTP ${response.status}: ${response.statusText}`);
          err.status = response.status;
          err.url = url.toString();
          throw err;
        }

        return await response.json();
      } catch (err) {
        clearTimeout(timeoutId);

        // Better error messages
        if (err.name === "AbortError") {
          const timeoutErr = new Error(`Request timeout after ${timeoutMs}ms`);
          timeoutErr.url = url.toString();
          throw timeoutErr;
        }

        if (err instanceof TypeError && err.message.includes("fetch")) {
          const networkErr = new Error("Network error - check connection");
          networkErr.url = url.toString();
          networkErr.originalError = err;
          throw networkErr;
        }

        throw err;
      }
    },
    {
      tries: 3,
      baseDelayMs: 500,
      shouldRetry: (err) => {
        // Don't retry client errors (4xx)
        if (err.status && err.status >= 400 && err.status < 500) return false;
        return true;
      },
    },
  );
}

/**
 * Retry wrapper with exponential backoff
 * Now works better with fetch's faster error detection
 * Includes total timeout to prevent excessive operation duration
 */
async function withRetry(
  fn,
  {
    tries = 3,
    baseDelayMs = 350,
    maxDelayMs = 2000,
    jitter = 0.25,
    totalTimeoutMs = 15000,
    shouldRetry = (err) => true,
  } = {},
) {
  const deadline = Date.now() + totalTimeoutMs;
  let lastErr;

  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      // Check if we've exceeded total timeout
      if (Date.now() > deadline) {
        throw new Error(`Operation timed out after ${totalTimeoutMs}ms`);
      }
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt === tries || !shouldRetry(err) || Date.now() > deadline) break;

      const expo = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      const j = expo * jitter * (Math.random() * 2 - 1);
      const wait = Math.min(Math.max(0, expo + j), deadline - Date.now());
      if (wait <= 0) break;
      await delay(wait);
    }
  }

  throw lastErr;
}

/**
 * Main API - Modern fetch-based implementation
 */
const api = {
  listDrivers(activeOnly = true) {
    return fetchAPI("listDrivers", { activeOnly: activeOnly ? "true" : "false" });
  },

  listBuses(activeOnly = true) {
    return fetchAPI("listBuses", { activeOnly: activeOnly ? "true" : "false" });
  },

  weekData(start, end, notesKey) {
    return withRetry(
      async () => {
        return await fetchAPI("weekData", { start, end, notesKey });
      },
      {
        tries: 3,
        shouldRetry: (err) => {
          // Retry on timeout or network errors, but not on 4xx errors
          if (err.status >= 400 && err.status < 500) return false;
          return true;
        },
      },
    );
  },

  saveWeekNote(notesKey, notes) {
    return fetchAPI("saveWeekNote", { notesKey, notes });
  },

  getTrip(tripKey) {
    return fetchAPI("getTrip", { tripKey });
  },

  getBusAssignments(tripKey) {
    return fetchAPI("getBusAssignments", { tripKey });
  },

  toggleUnavailability(driverName, dateYmd) {
    return fetchAPI("toggleUnavailability", { driverName, dateYmd });
  },

  batchUnavailability(driverName, dates, mode) {
    return fetchAPI("batchUnavailability", {
      driverName,
      dates: dates.join(","),
      mode,
    });
  },
};

/**
 * Proactive Conflict Check
 * Returns conflict details if trip overlaps with existing trip on same bus
 */
function checkPotentialConflicts(trip, assignments) {
  const depY = ymd(parseYMD(trip.departureDate));
  const arrY = ymd(parseYMD(trip.arrivalDate) || parseYMD(trip.departureDate));

  for (const a of assignments) {
    const busId = String(a.busId || "").trim();
    if (!busId || busId === "None" || busId === "WAITING_LIST") continue;

    // Filter out the current trip if we are updating
    const existingTrips = state.trips.filter((t) => String(t.tripKey) !== String(trip.tripKey));

    for (const t of existingTrips) {
      const tDepY = ymd(parseYMD(t.departureDate));
      const tArrY = ymd(parseYMD(t.arrivalDate) || parseYMD(t.departureDate));

      // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
      if (depY <= tArrY && arrY >= tDepY) {
        const tAssigns = state.assignmentsByTripKey[t.tripKey] || [];
        if (tAssigns.some((ta) => String(ta.busId).trim() === busId)) {
          return {
            busId,
            dateRange: depY === arrY ? depY : `${depY} to ${arrY}`,
            otherTrip: t.destination || "another trip",
          };
        }
      }
    }
  }
  return null;
}

// ======================================================
// ERROR LOGGING (Production Debugging)
// ======================================================

/**
 * Error logging system - tracks production errors to Google Sheets
 * Logs include: timestamp, message, stack trace, URL, and user agent
 * Errors are logged to "ErrorLogs" sheet in your Google Spreadsheet
 */
const errorLogger = {
  async log(error, context = {}) {
    try {
      const errorData = {
        message: error?.message || String(error),
        stack: error?.stack || "",
        url: context.url || window.location.href,
        userAgent: navigator.userAgent,
        context: JSON.stringify(context),
      };

      // Log to backend (non-blocking, silently fails if unavailable)
      await fetchAPI("logError", errorData);
    } catch (e) {
      // Silently fail - don't break app if logging fails
    }
  },
};

// Global error handlers - automatically log errors in production
window.addEventListener("error", (e) => {
  errorLogger.log(e.error || e.message, {
    type: "global_error",
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
  });
});

window.addEventListener("unhandledrejection", (e) => {
  errorLogger.log(e.reason, {
    type: "unhandled_rejection",
    promise: String(e.promise),
  });
});

// ======================================================
// 12) TOAST + LOADING PROGRESS
// ======================================================
function setToastBackdrop(on) {
  if (!dom.toastBackdrop) return;
  dom.toastBackdrop.hidden = !on;
}

function toast(message, variant = "info", duration = 1400) {
  if (!dom.toast || !dom.toastText) return;

  dom.toast.dataset.variant = variant;
  dom.toastText.textContent = message;
  dom.toast.hidden = false;

  setToastBackdrop(["loading"].includes(variant));

  if (state.toastTimer) clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    dom.toast.hidden = true;
    setToastBackdrop(false);
  }, duration);
}

function toastShow(message, variant = "info", { backdrop = null } = {}) {
  if (!dom.toast || !dom.toastText) return;

  dom.toast.dataset.variant = variant;
  dom.toastText.textContent = message;
  dom.toast.hidden = false;

  const shouldBackdrop = backdrop != null ? !!backdrop : ["loading", "warning"].includes(variant);
  setToastBackdrop(shouldBackdrop);

  if (state.toastTimer) clearTimeout(state.toastTimer);
  state.toastTimer = null;
}

function toastHide(delayMs = 0) {
  if (!dom.toast) return;

  if (state.toastTimer) clearTimeout(state.toastTimer);

  const hideNow = () => {
    dom.toast.hidden = true;
    setToastBackdrop(false);
  };

  if (delayMs > 0) state.toastTimer = setTimeout(hideNow, delayMs);
  else hideNow();
}

function toastProgress(pct, label) {
  const inner = dom.toast?.querySelector(".toast-progress__inner");
  if (!inner) return;

  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  inner.style.width = `${clamped}%`;

  if (label != null && dom.toastText) dom.toastText.textContent = label;
}

function stopProgressCreep() {
  if (state.progressCreepTimer) clearInterval(state.progressCreepTimer);
  state.progressCreepTimer = null;
}

function startProgressCreep({ from = 70, to = 95, everyMs = 250, label = "Verifying… " } = {}) {
  stopProgressCreep();

  toastProgress(from, `${label}${from}%`);
  let current = from;

  state.progressCreepTimer = setInterval(() => {
    const remaining = to - current;
    if (remaining <= 0.2) return;

    const bump = Math.max(0.3, remaining * 0.12);
    current = Math.min(to, current + bump);

    toastProgress(current, `${label}${Math.floor(current)}%`);
  }, everyMs);
}

// ======================================================
// 13) STATUS SELECT CLASSES & ICONS
// ======================================================
function getStatusIcon(fieldId, statusValue) {
  const s = String(statusValue || "")
    .trim()
    .toLowerCase();
  if (!s || s === "none") return "";

  if (fieldId === "itineraryStatus") {
    return "attach_file_off"; // Base icon, overridden by has-pdf logic elsewhere
  }
  if (fieldId === "contactStatus") {
    return "phone_enabled"; // Base icon
  }
  if (fieldId === "paymentStatus") {
    if (s === "contract signed") return "edit_document";
    if (s === "pending quote" || s === "quoted") return "draft";
    if (s === "po received") return "request_quote";
    if (s === "not required") return "scan_delete";
    return "description";
  }
  if (fieldId === "driverStatus") {
    if (s === "pending") return "sentiment_dissatisfied";
    if (s === "assigned") return "sentiment_neutral";
    if (s === "confirmed") return "sentiment_satisfied";
    if (s === "driver info sent") return "mood";
    return "person";
  }
  if (fieldId === "invoiceStatus") {
    return "attach_money";
  }
  return "";
}

function updateStatusSelect(el) {
  if (!el) return;

  const id = el.id;
  const v = String(el.value || "")
    .trim()
    .toLowerCase();

  const classes = [
    "status-pending",
    "status-ok",
    "status-assigned",
    "status-confirmed",
    "status-blue",
  ];
  el.classList.remove(...classes);
  const trigger = el.closest?.(".select-dropdown")?.querySelector(".select-trigger");
  if (trigger) trigger.classList.remove(...classes);
  if (!v) return;

  let addClass = "";
  if (id === "driverStatus") {
    if (v === "pending") addClass = "status-pending";
    else if (v === "assigned") addClass = "status-assigned";
    else if (v === "confirmed") addClass = "status-ok";
    else addClass = "status-ok";
  } else if (id === "paymentStatus") {
    if (v === "pending quote") addClass = "status-pending";
    else if (v === "quoted") addClass = "status-assigned";
    else addClass = "status-ok";
  } else if (id === "invoiceStatus") {
    if (v === "pending invoice") addClass = "status-pending";
    else if (v === "invoiced") addClass = "status-assigned";
    else if (v === "deposit received") addClass = "status-blue";
    else if (v === "paid in full") addClass = "status-ok";
  } else {
    addClass = v === "pending" ? "status-pending" : "status-ok";
  }
  if (addClass) {
    el.classList.add(addClass);
    if (trigger) trigger.classList.add(addClass);
  }
}

function setSelectToPlaceholder(id) {
  const el = $(id);
  if (!el) return;
  el.selectedIndex = 0;
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function hasSelectedBusForTrip() {
  const busSel = document.querySelector("#busGrid select[name='bus1']");
  if (!busSel) return false;
  const v = String(busSel.value || "").trim();
  return v && v !== "None";
}

function maybeApplyPendingDefaults() {
  if (!dom.tripForm || dom.action?.value !== "create") return;

  const dep = $("tripDate")?.value;
  if (!dep || !hasSelectedBusForTrip()) return;

  const ids = [
    "itineraryStatus",
    "contactStatus",
    "paymentStatus",
    "driverStatus",
    "invoiceStatus",
  ];
  let changed = false;

  ids.forEach((id) => {
    const el = $(id);
    if (!el || el.value) return;

    if (id === "paymentStatus") el.value = "Pending Quote";
    else if (id === "invoiceStatus") el.value = "Pending Invoice";
    else el.value = "Pending";

    el.dispatchEvent(new Event("change", { bubbles: true }));
    changed = true;
  });

  if (changed) ids.forEach((id) => updateStatusSelect($(id)));
}

function updateInvoiceNumberVisibility() {
  const el = $("invoiceStatus");
  const numGroup = $("invoiceNumberGroup");
  const numInput = $("invoiceNumber");
  if (!el || !numGroup) return;

  const v = String(el.value || "")
    .trim()
    .toLowerCase();
  // Show if Invoiced, Deposit Received, or Paid in Full
  const show = v === "invoiced" || v === "deposit received" || v === "paid in full";

  numGroup.classList.toggle("is-hidden", !show);
  // Intentionally DO NOT clear numInput.value when hiding, so toggling status
  // does not wipe an already-entered invoice number.
}

function refreshEmptyStateUI() {
  const ids = [
    "destination",
    "customer",
    "contactName",
    "phone",
    "tripDate",
    "arrivalDate",
    "departureTime",
    "arrivalTime",
    "busesNeeded",
    "itineraryStatus",
    "contactStatus",
    "paymentStatus",
    "contactStatus",
    "paymentStatus",
    "driverStatus",
    "invoiceStatus",
    "invoiceNumber",
    "tripColor",
    "itinerary",
    "notes",
    "comments",
  ];

  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;

    const v = el.value ?? "";
    const empty = el.tagName === "TEXTAREA" ? !String(v).trim() : !String(v);
    el.classList.toggle("is-empty", empty);
  }
}

function syncEmptyStateForForm() {
  const form = dom.tripForm;
  if (!form) return;

  const fields = Array.from(form.querySelectorAll("input, select, textarea")).filter(
    (el) => el.id && el.type !== "hidden",
  );

  function isEmpty(el) {
    const v = el.value ?? "";
    if (el.tagName === "TEXTAREA") return !String(v).trim();
    if (el.tagName === "SELECT") return !String(v);
    return !String(v);
  }

  function syncOne(el) {
    el.classList.toggle("is-empty", isEmpty(el));
  }

  // Always sync current state
  fields.forEach(syncOne);

  // Only wire event listeners once to prevent memory leak
  if (!state.formListenersWired) {
    state.formListenersWired = true;

    fields.forEach((el) => {
      const markDirtyAndSync = () => {
        state.tripFormDirty = true;
        syncOne(el);
      };

      el.addEventListener("input", markDirtyAndSync);
      el.addEventListener("change", markDirtyAndSync);
      el.addEventListener("blur", () => syncOne(el));
    });

    const invSel = $("invoiceStatus");
    if (invSel) {
      invSel.addEventListener("change", () => {
        updateInvoiceNumberVisibility();
        updateStatusSelect(invSel);
      });
    }

    form.addEventListener("reset", () =>
      setTimeout(() => {
        fields.forEach(syncOne);
        state.tripFormDirty = false;
      }, 0),
    );
  }
}

// ======================================================
// 14) WEEK START UI + HEADER ORDER
// ======================================================
function syncWeekStartUI() {
  const isMon = state.weekStartsOnMonday;

  if (dom.weekStartMonBtn)
    dom.weekStartMonBtn.setAttribute("aria-pressed", isMon ? "true" : "false");
  if (dom.weekStartSunBtn)
    dom.weekStartSunBtn.setAttribute("aria-pressed", isMon ? "false" : "true");

  // Update toggle button icon and text
  if (dom.weekStartToggle) {
    const icon = dom.weekStartToggle.querySelector(".dropdown__icon");
    if (icon) {
      icon.textContent = isMon ? "toggle_on" : "toggle_off";
      icon.classList.toggle("is-active", isMon);
    }
  }
}

function applyWeekStart(isMonday) {
  state.weekStartsOnMonday = !!isMonday;

  try {
    localStorage.setItem("weekStartMonday", state.weekStartsOnMonday ? "1" : "0");
  } catch { }

  syncWeekStartUI();

  // NORMALIZE ANCHOR: Use a date in the middle of our current 7-day span
  // to find the start-of-week that covers the same days visually.
  const middleOfCurrentWeek = addDays(state.currentDate, 3);
  state.currentDate = startOfWeek(middleOfCurrentWeek);

  setHeaderOrder();
  buildAgendaRows();
  scheduleAgendaReflow();
  updateWeekDates();

  // Force driver panel to re-render its headers/days for the new week Start
  updateDriverWeekIfVisible();
}

function setHeaderOrder() {
  const theadRow = document.querySelector(".schedule-grid thead tr");
  if (!theadRow) return;

  const cells = Array.from(theadRow.children);
  const corner = cells[0];
  const byId = {};
  for (const th of cells.slice(1)) if (th.id) byId[th.id] = th;

  while (theadRow.firstChild) theadRow.removeChild(theadRow.firstChild);
  theadRow.appendChild(corner);
  for (const id of getDayIds()) if (byId[id]) theadRow.appendChild(byId[id]);

  state.lastColMetrics = null;
}

function updateWeekTitle() {
  const start = new Date(state.currentDate);
  const end = addDays(start, 6);

  const monthOpt = { month: "long" };
  const startMonth = start.toLocaleDateString("en-US", monthOpt);
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  let html;

  // Scenario 1: Same Month & Year (Feb 3 – 9, 2026)
  if (start.getMonth() === end.getMonth() && startYear === endYear) {
    html =
      `<span class="wk-month">${startMonth}</span> ` +
      `<span class="wk-dates">${start.getDate()} – ${end.getDate()},</span> ` +
      `<span class="wk-year">${startYear}</span>`;
  }
  // Scenario 2: Different Month, Same Year (Feb 24 – Mar 2, 2026)
  else if (startYear === endYear) {
    const endMonth = end.toLocaleDateString("en-US", monthOpt);
    html =
      `<span class="wk-month">${startMonth}</span> ` +
      `<span class="wk-dates">${start.getDate()}</span> ` +
      `<span class="wk-sep">–</span> ` +
      `<span class="wk-month">${endMonth}</span> ` +
      `<span class="wk-dates">${end.getDate()},</span> ` +
      `<span class="wk-year">${startYear}</span>`;
  }
  // Scenario 3: Different Year (Dec 29, 2025 – Jan 4, 2026)
  else {
    const endMonth = end.toLocaleDateString("en-US", monthOpt);
    html =
      `<span class="wk-month">${startMonth}</span> ` +
      `<span class="wk-dates">${start.getDate()},</span> ` +
      `<span class="wk-year">${startYear}</span> ` +
      `<span class="wk-sep">–</span> ` +
      `<span class="wk-month">${endMonth}</span> ` +
      `<span class="wk-dates">${end.getDate()},</span> ` +
      `<span class="wk-year">${endYear}</span>`;
  }

  if (dom.headerWeek) {
    dom.headerWeek.innerHTML = html;
  }
}

// ======================================================
// 15) WEEK CACHE + STALE GUARDS
// ======================================================
function weekKey(start, end) {
  return `${start}..${end}`;
}

function getCachedWeek(key, maxAgeMs = CONFIG.WEEK_CACHE_MAX_AGE_MS) {
  const hit = state.weekCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > maxAgeMs) return null;
  return hit.resp;
}

function getAnyCachedWeek(key) {
  return state.weekCache.get(key)?.resp || null;
}

async function fetchWeekDataCached(start, end, notesKey, force = false) {
  const key = weekKey(start, end);

  if (!force) {
    const fresh = getCachedWeek(key);
    if (fresh) return fresh;
  }

  if (state.weekInFlight.has(key)) return state.weekInFlight.get(key);

  const p = (async () => {
    try {
      const raw = await api.weekData(start, end, notesKey);
      const resp = sanitizeWeekResp(raw);

      if (!resp.ok) {
        const err = new Error(resp.error || "weekData returned ok:false");
        err.resp = raw;
        throw err;
      }

      // Save to Memory Cache
      state.weekCache.set(key, { ts: Date.now(), resp });

      // Save to Persistent Cache (7 days)
      CACHE.set("week_" + key, resp, 7 * 24 * 60 * 60 * 1000);

      return resp;
    } catch (err) {
      const stale = getAnyCachedWeek(key);
      if (stale) return { ...stale, __stale: true };
      throw err;
    } finally {
      state.weekInFlight.delete(key);
    }
  })();

  state.weekInFlight.set(key, p);
  return p;
}

function applyWeekRespToState(resp) {
  const ok = !!resp?.ok;

  state.trips = ok ? asArray(resp.trips) : [];
  state.trips = state.trips
    .map((t) => ({
      ...t,
      tripKey: String(t.tripKey || "").trim(),
      departureTime: normalizeTime(t.departureTime),
      arrivalTime: normalizeTime(t.arrivalTime),
    }))
    .filter((t) => t.tripKey);

  state.tripByKey = {};
  for (const t of state.trips) state.tripByKey[t.tripKey] = t;

  const asnList = ok ? asArray(resp.assignments) : [];
  state.assignmentsByTripKey = {};
  for (const a of asnList) {
    const k = String(a.tripKey || "").trim();
    if (!k) continue;
    (state.assignmentsByTripKey[k] ||= []).push({
      busId: String(a.busId || "").trim(),
      driver1: String(a.driver1 || "").trim(),
      driver2: String(a.driver2 || "").trim(),
    });
  }

  // Populate Notes if present
  if (dom.scheduleNotes) {
    const notesValue = resp.weekNotes || "";
    dom.scheduleNotes.value = notesValue;
    state.savedNotesValue = notesValue;
    state.notesDirty = false;
  }

  // Populate Unavailability
  state.unavailabilityByDriver = {};
  if (ok && resp.unavailability) {
    for (const u of asArray(resp.unavailability)) {
      const name = String(u.driverName || "").trim();
      const date = String(u.dateYmd || "").trim();
      if (!name || !date) continue;
      (state.unavailabilityByDriver[name] ||= {})[date] = true;
    }
  }
}

let _prefetchTimer = null;

const RADIUS_WEEKS = 2;

function prefetchAdjacentWeeks() {
  const base = state.currentDate;
  for (let w = -RADIUS_WEEKS; w <= RADIUS_WEEKS; w++) {
    if (w === 0) continue;
    const targetDate = addDays(base, w * 7);
    const start = ymd(targetDate);
    const end = ymd(addDays(targetDate, 6));

    // ✅ FIX: Calculate Monday for the adjacent week
    const { notesKey } = getWeekRange(targetDate); // We will update getWeekRange to support a date arg
    fetchWeekDataCached(start, end, notesKey).catch(() => { });
  }
}

// ======================================================
// 16) BAR RENDER TOAST + LOADING DIMMER
// ======================================================
let scheduleRenderToastTimer = null;

function showScheduleRenderToastDelayed() {
  clearTimeout(scheduleRenderToastTimer);

  scheduleRenderToastTimer = setTimeout(() => {
    if (!(dom.toast && dom.toast.hidden === false && dom.toast.dataset.variant === "loading")) {
      toastShow("Rendering schedule…", "loading");
      toastProgress(80, "Rendering… 80%");
    }
  }, 120);
}

function hideScheduleRenderToast() {
  clearTimeout(scheduleRenderToastTimer);
  scheduleRenderToastTimer = null;

  if (typeof state.weekRenderDoneResolver === "function") {
    const r = state.weekRenderDoneResolver;
    state.weekRenderDoneResolver = null;
    r();
  }

  if (dom.toast && dom.toast.hidden === false && dom.toast.dataset.variant === "loading") {
    toastProgress(100, "Done ✓ 100%");
    toastHide(350);
  }
}

function setBarsHidden(hidden) {
  const wrap = document.querySelector(".schedule-grid-container");
  wrap?.classList?.toggle("is-loading-bars", !!hidden);
}

// ======================================================
// 17) BAR ELEMENT REUSE HELPERS
// ======================================================
function clearBarsNow() {
  dom.agendaBody?.querySelectorAll(".schedule-grid__row-bars").forEach((b) => (b.innerHTML = ""));
  state.barElByKey?.clear?.();
}

function barKey(tripKey, busId, driver1, driver2) {
  return `${tripKey}|${busId}|${driver1 || ""}|${driver2 || ""}`;
}

function pruneOldBars(pass) {
  for (const [k, el] of state.barElByKey) {
    if (el._renderPass !== pass) {
      el.remove();
      state.barElByKey.delete(k);
    }
  }
}

function getBarMetrics() {
  const rootCss = getComputedStyle(document.documentElement);
  const barH = parseFloat(rootCss.getPropertyValue("--tripbar-height")) || 100;

  let step = parseFloat(rootCss.getPropertyValue("--tripbar-lane-step"));
  if (!step || Number.isNaN(step)) step = barH + 10;

  return { barH, step };
}
function getBarMetricsCached() {
  return state.barMetrics || (state.barMetrics = getBarMetrics());
}

// ======================================================
// 18) AGENDA GRID BUILD + COLUMN METRICS CACHE
// ======================================================
function buildAgendaRows() {
  if (!dom.agendaBody) return;

  const liftSet = computeLiftSet();
  const sleeperSet = computeSleeperSet();

  // Calculate today's column index for highlighting
  const todayYmd = ymd(new Date());
  const weekDates = getWeekDates(state.currentDate);
  const todayColIndex = weekDates.indexOf(todayYmd); // -1 if not in this week

  dom.agendaBody.innerHTML = "";
  state.busRowIndex = new Map();

  const dayIds = getDayIds();

  // DYNAMIC BUSES: Trust the API/Sheet order
  // We slice() just to make a shallow copy so we don't mutate the original state if we push to it.
  const buses = (state.busesList || []).slice();

  // Fallback if API failed but we still want to render *something*
  if (buses.length === 0 && CONFIG.BUS_LANES && CONFIG.BUS_LANES.length > 0) {
    CONFIG.BUS_LANES.forEach((id) => buses.push({ busId: id }));
  }

  buses.forEach((busObj, idx) => {
    const busId = busObj.busId;
    state.busRowIndex.set(String(busId), idx);

    const tr = document.createElement("tr");
    tr.className = "schedule-grid__row";

    // Data-driven coloring - apply as left border on row (enterprise style)
    const colorVal =
      busObj.busColor ||
      busObj.buscolor ||
      busObj.BusColor ||
      busObj["Bus Color"] ||
      busObj["bus color"];
    if (colorVal) {
      tr.style.setProperty("--bus-accent-color", String(colorVal).trim());
      tr.classList.add("schedule-grid__row--has-bus-color");
    }

    const tdBus = document.createElement("td");
    tdBus.className = "schedule-grid__bus-cell schedule-grid__cell";

    const wrap = document.createElement("div");
    wrap.className = "schedule-grid__bus-indicator";

    const num = document.createElement("span");
    num.className = "schedule-grid__bus-num";
    num.textContent = busId;

    wrap.appendChild(num);

    const icons = document.createElement("div");
    icons.className = "schedule-grid__bus-icons";

    const busKey = String(busId ?? "").trim();
    if (liftSet.has(busKey)) {
      const icon = document.createElement("span");
      icon.className =
        "schedule-grid__bus-icon icon-bus icon-bus--lift material-symbols-outlined";
      icon.textContent = "accessible";
      icon.title = "Wheelchair lift equipped";
      icon.setAttribute("aria-label", "Wheelchair lift equipped");
      icons.appendChild(icon);
    }

    if (sleeperSet.has(busKey)) {
      const icon = document.createElement("span");
      icon.className =
        "schedule-grid__bus-icon icon-bus icon-bus--sleeper material-symbols-outlined";
      icon.textContent = "airline_seat_flat";
      icon.title = "Sleeper bus";
      icon.setAttribute("aria-label", "Sleeper bus");
      icons.appendChild(icon);
    }

    if (icons.childElementCount) wrap.appendChild(icons);
    tdBus.appendChild(wrap);
    tr.appendChild(tdBus);

    for (let i = 0; i < 7; i++) {
      const td = document.createElement("td");
      td.className = "schedule-grid__day-cell schedule-grid__cell";
      td.dataset.dayId = dayIds[i];
      if (i === todayColIndex) td.classList.add("schedule-grid__day-cell--today");
      tr.appendChild(td);
    }

    tr.cells[1].classList.add("week-start-cell");

    const bars = document.createElement("div");
    bars.className = "schedule-grid__row-bars";
    tr.cells[1].appendChild(bars);

    dom.agendaBody.appendChild(tr);
  });

  // WAITING LIST ROW -> Render into SAME table (it's a tbody now)
  const waitingBody = document.getElementById("waitingBody");
  if (waitingBody) {
    waitingBody.innerHTML = "";

    // Explicitly map WAITING_LIST to a row index?
    // Actually, `state.busRowIndex` is used to look up `dom.agendaBody.rows[i]`.
    // Since we are now in a DIFFERENT table, we can't use `state.busRowIndex` pointing to a row number for the MAIN table.
    // We should treat WAITING_LIST specially in renderAgenda.
    // So we invoke a special render for it here.

    const tr = document.createElement("tr");
    tr.className = "waiting-list-row schedule-grid__row";

    const tdBus = document.createElement("td");
    tdBus.className = "schedule-grid__bus-cell schedule-grid__cell";
    tdBus.innerHTML = `<div class="schedule-grid__bus-indicator"><span class="material-symbols-outlined">low_priority</span></div>`;
    tr.appendChild(tdBus);

    for (let i = 0; i < 7; i++) {
      const td = document.createElement("td");
      td.className = "schedule-grid__day-cell schedule-grid__cell";
      td.dataset.dayId = dayIds[i];
      if (i === todayColIndex) td.classList.add("schedule-grid__day-cell--today");
      tr.appendChild(td);
    }

    // Border logic
    tr.cells[1].classList.add("week-start-cell");

    const bars = document.createElement("div");
    bars.className = "schedule-grid__row-bars";
    tr.cells[1].appendChild(bars);

    waitingBody.appendChild(tr);
  }

  clearBarsNow();
  state.lastColMetrics = null;
}

function ensureAgendaGrid() {
  if (!dom.agendaBody) return false;

  let expected = 0;
  // Basic buses
  if (state.busesList && state.busesList.length > 0) {
    expected = state.busesList.length;
  } else {
    expected = CONFIG.BUS_LANES.length;
  }
  // The main body should strictly match the buses list

  const okMain = dom.agendaBody.rows && dom.agendaBody.rows.length === expected;

  // Check waiting body too
  const waitingBody = document.getElementById("waitingBody");
  // It's in the same table now, so just check if it exists
  const okWait = !!waitingBody;

  if (!okMain || !okWait) buildAgendaRows();

  return dom.agendaBody.rows.length === expected;
}

function getColMetricsCached() {
  const firstBodyRow = dom.agendaBody?.rows?.[0];
  if (!firstBodyRow || firstBodyRow.cells.length < 8) return null;

  const startCell = firstBodyRow.cells[1];
  const r = startCell.getBoundingClientRect();
  const key = `${r.left}:${r.width}:${dom.agendaBody?.rows?.length || 0}`;

  if (state.lastColMetrics?.key === key) return state.lastColMetrics.col;

  const baseRect = r;
  const starts = [];
  const widths = [];
  let total = 0;

  for (let i = 1; i <= 7; i++) {
    const cell = firstBodyRow.cells[i];
    if (!cell) continue;

    const cellRect = cell.getBoundingClientRect();
    const w = cellRect.width;
    starts.push(cellRect.left - baseRect.left);
    widths.push(w);
    total += w;
  }

  state.lastColMetrics = { key, col: { starts, widths, total } };
  return state.lastColMetrics.col;
}

function syncRowBarsWidth(col) {
  if (!col || !dom.agendaBody) return;
  const total = col.total ?? col.widths.reduce((a, b) => a + (b || 0), 0);

  // Sync main table rows
  dom.agendaBody.querySelectorAll(".schedule-grid__row-bars").forEach((bars) => {
    bars.style.width = `${total}px`;
  });

  // Sync waiting list rows
  const wb = document.getElementById("waitingBody");
  if (wb) {
    wb.querySelectorAll(".schedule-grid__row-bars").forEach((bars) => {
      bars.style.width = `${total}px`;
    });
  }
}

function positionBarWithinOverlay(bar, bars, col, startIdx, endIdx, overrides) {
  const el = bar.closest("#printRoot") || document.documentElement;
  const root = getComputedStyle(el);

  const parseCss = (val, fallback) => {
    const p = parseFloat(val);
    return isNaN(p) ? fallback : p;
  };

  const insetAll = parseCss(root.getPropertyValue("--tripbar-inset"), 6);
  const insetL =
    overrides?.insetL !== undefined
      ? overrides.insetL
      : parseCss(root.getPropertyValue("--tripbar-inset-left"), insetAll);
  const insetR =
    overrides?.insetR !== undefined
      ? overrides.insetR
      : parseCss(root.getPropertyValue("--tripbar-inset-right"), insetAll);

  const insetT =
    overrides?.insetT !== undefined
      ? overrides.insetT
      : parseCss(root.getPropertyValue("--tripbar-inset-top"), 0);

  const insetB =
    overrides?.insetB !== undefined
      ? overrides.insetB
      : parseCss(root.getPropertyValue("--tripbar-inset-bottom"), 3);

  // Simplified: exactly match the calculated start and width without extends
  const leftPx = Math.max(0, (col.starts[startIdx] ?? 0) + insetL);

  let spanW = 0;
  for (let i = startIdx; i <= endIdx; i++) spanW += col.widths[i] ?? 0;

  const numCols = endIdx - startIdx + 1;
  const widthExtra = (overrides?.barWidthExtraPerCol ?? 0) * numCols;
  let widthPx = Math.max(0, spanW - insetL - insetR + widthExtra);

  // Guard rails to prevent overflow beyond the row overlay (use overlayWidth when set, e.g. letter print)
  const totalCol = col.total ?? col.widths?.reduce((a, b) => a + (b || 0), 0) ?? 0;
  const max = Math.max(0, col.overlayWidth ?? totalCol);
  const EPS = 0; // No safety margin - bars fill the column width

  if (leftPx >= max) {
    bar.style.left = `${max}px`;
    bar.style.width = `0px`;
    return;
  }

  widthPx = Math.max(0, Math.min(widthPx, max - leftPx - EPS));

  bar.style.left = `${leftPx}px`;
  bar.style.width = `${widthPx}px`;
  bar.style.top = `${insetT}px`;
  bar.style.height = `calc(100% - ${insetT + insetB}px)`;
}

// ======================================================
// 19) CONFLICT UI
// ======================================================
function clearConflictStyles() {
  if (!dom.agendaBody) return;
  for (let r = 0; r < dom.agendaBody.rows.length; r++) {
    const row = dom.agendaBody.rows[r];
    row.cells[0]?.classList?.remove("bus-conflict");
    for (let c = 1; c <= 7; c++) row.cells[c]?.classList?.remove("conflict");
  }
}

function showConflictsPanel(conflicts) {
  const hasConflicts = !!(conflicts && conflicts.length > 0);
  dom.conflictPanel?.classList.toggle("is-hidden", !hasConflicts);
  // Update the small badge summary as well
  if (dom.conflictBadge) {
    if (!hasConflicts) {
      dom.conflictBadge.classList.add("is-hidden");
    } else {
      const count = conflicts.length;
      dom.conflictBadge.textContent = count === 1 ? "1 conflict" : `${count} conflicts`;
      dom.conflictBadge.classList.remove("is-hidden");
    }
  }

  if (!hasConflicts) {
    dom.conflictList.innerHTML = "";
    return;
  }

  const html = conflicts
    .map((c, idx) => {
      const when = escHtml(c.dayLabel);
      const bus = escHtml(c.busId);

      const tripsHtml = c.items
        .map((it) => {
          const t = it.trip || {};
          const title = escHtml(t.destination || "Trip");
          const cust = escHtml(t.customer || "");
          const d1 = escHtml(it.driver1 || "—");
          const d2 = escHtml(it.driver2 || "—");
          const tripKey = escHtml(String(it.tripKey || ""));

          return `
          <div class="trip-chip conflict-indicator" data-tripkey="${tripKey}" role="button" tabindex="0">
            <div class="title">⚠ ${title}</div>
            <div class="meta">${cust}${cust ? " • " : ""}Bus ${bus} • ${d1}${d2 && d2 !== "—" ? " / " + d2 : ""}</div>
          </div>
        `;
        })
        .join("");

      return `
      <div class="conflict-group">
        <div class="conflict-title">Bus ${bus} — ${when}</div>
        <div class="help">${c.items.length} trip(s) overlap</div>
        ${tripsHtml}
      </div>
    `;
    })
    .join("");

  dom.conflictList.innerHTML = html;

  dom.conflictList.querySelectorAll("[data-tripkey]").forEach((el) => {
    const open = () =>
      isMobileOnly()
        ? openTripDetailsModal(el.dataset.tripkey)
        : openTripForEdit(el.dataset.tripkey);

    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}

// ======================================================
// 20) AGENDA RENDER + REFLOW
// ======================================================
function rerenderAgendaAfterLayout() {
  showScheduleRenderToastDelayed();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderAgenda();
      requestAnimationFrame(() => hideScheduleRenderToast());
    });
  });
}

const scheduleAgendaReflow = debounce(() => {
  rerenderAgendaAfterLayout();
}, 120);

function renderAgenda() {
  try {
    _renderAgendaInner();
  } catch (err) {
    console.error("renderAgenda failed:", err);
    // Show error state with retry option
    if (dom.agendaBody) {
      dom.agendaBody.innerHTML = `
        <tr><td colspan="8" class="schedule-error__cell">
          <div class="schedule-error__message">Failed to render schedule</div>
          <button onclick="location.reload()" class="btn">Reload Page</button>
        </td></tr>
      `;
    }
    toast("Render error - try refreshing", "danger", 3000);
  }
}

function _renderAgendaInner() {
  if (!ensureAgendaGrid()) return;

  state.pendingConflictJob = null;

  clearConflictStyles();
  showConflictsPanel([]);

  const week = getWeekDates();
  const weekStart = week[0];
  const weekEnd = week[6];

  const weekIndex = new Map(week.map((d, i) => [d, i]));

  const col = getColMetricsCached();
  if (!col) {
    scheduleAgendaReflow();
    return;
  }

  syncRowBarsWidth(col);

  const barsByRowIdx = new Map();
  for (let i = 0; i < dom.agendaBody.rows.length; i++) {
    const r = dom.agendaBody.rows[i];
    const bars = r.querySelector(".schedule-grid__row-bars");
    if (bars) barsByRowIdx.set(i, bars);
  }

  // Waiting List Mapping
  const waitingBody = document.getElementById("waitingBody");
  if (waitingBody && waitingBody.rows.length > 0) {
    const wRow = waitingBody.rows[0];
    const wBars = wRow.querySelector(".schedule-grid__row-bars");
    if (wBars) barsByRowIdx.set("WAITING", wBars);
  }

  const rootCss = getComputedStyle(document.documentElement);
  const { barH, step } = getBarMetricsCached();

  const rowH =
    dom.agendaBody?.rows?.[0]?.cells?.[1]?.getBoundingClientRect()?.height ||
    parseFloat(rootCss.getPropertyValue("--schedule-row-height")) ||
    110;

  const fragByRow = new Map();
  const barsByBus = new Map();

  state.renderPass++;
  const pass = state.renderPass;

  const visibleTrips = state.trips
    .map((t) => {
      const dep = parseYMD(t.departureDate);
      const arr = parseYMD(t.arrivalDate) || dep;
      return { ...t, _dep: dep, _arr: arr };
    })
    .filter((t) => t._dep && t._arr)
    .filter((t) => !(ymd(t._arr) < weekStart || ymd(t._dep) > weekEnd));

  let barsEstimate = 0;
  for (const t of visibleTrips) {
    const assigns = state.assignmentsByTripKey[String(t.tripKey)] || [];
    barsEstimate += assigns.length;
    if (barsEstimate > CONFIG.CONFLICT_DEFER_BARS_THRESHOLD) break;
  }
  const deferConflicts = barsEstimate > CONFIG.CONFLICT_DEFER_BARS_THRESHOLD;

  let cellCounts = null;
  let cellItems = null;

  if (!deferConflicts) {
    cellCounts = {};
    cellItems = {};

    for (const t of visibleTrips) {
      const depY = ymd(t._dep);
      const arrY = ymd(t._arr);

      const start = depY < weekStart ? weekStart : depY;
      const end = arrY > weekEnd ? weekEnd : arrY;

      const startIdx = weekIndex.get(start);
      const endIdx = weekIndex.get(end);
      if (startIdx == null || endIdx == null) continue;

      const assigns = state.assignmentsByTripKey[String(t.tripKey)] || [];
      for (const a of assigns) {
        const busId = String(a.busId || "").trim();
        if (state.busRowIndex.get(busId) === undefined) continue;

        for (let d = startIdx; d <= endIdx; d++) {
          const key = `${busId}|${d}`;
          cellCounts[key] = (cellCounts[key] || 0) + 1;
          (cellItems[key] ||= []).push({
            tripKey: t.tripKey,
            driver1: a.driver1 && a.driver1 !== "None" ? a.driver1 : "—",
            driver2: a.driver2 && a.driver2 !== "None" ? a.driver2 : "—",
            trip: t,
          });
        }
      }
    }
  }

  const lanesByBus = {};
  function allocateLane(busId, startIdx, endIdx) {
    lanesByBus[busId] ||= [];
    const lanes = lanesByBus[busId];

    for (let li = 0; li < lanes.length; li++) {
      const occ = lanes[li];
      let ok = true;
      for (let d = startIdx; d <= endIdx; d++) {
        if (occ[d]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        for (let d = startIdx; d <= endIdx; d++) occ[d] = true;
        return li;
      }
    }

    const newOcc = Array(7).fill(false);
    for (let d = startIdx; d <= endIdx; d++) newOcc[d] = true;
    lanes.push(newOcc);
    return lanes.length - 1;
  }

  for (const t of visibleTrips) {
    const depY = ymd(t._dep);
    const arrY = ymd(t._arr);

    const start = depY < weekStart ? weekStart : depY;
    const end = arrY > weekEnd ? weekEnd : arrY;

    const startIdx = weekIndex.get(start);
    const endIdx = weekIndex.get(end);
    if (startIdx == null || endIdx == null) continue;

    const assigns = state.assignmentsByTripKey[String(t.tripKey)] || [];
    if (!assigns.length) continue;

    const continuesLeft = depY < weekStart;
    const continuesRight = arrY > weekEnd;

    // Sort by schedule row order: top row = 1/2, next = 2/2, etc. (order as rendered in agenda)
    const sortedAssigns = [...assigns].sort((a, b) => {
      const busIdA = String(a.busId || "").trim();
      const busIdB = String(b.busId || "").trim();
      const rowA = busIdA === "WAITING_LIST" ? 9999 : (state.busRowIndex.get(busIdA) ?? 9999);
      const rowB = busIdB === "WAITING_LIST" ? 9999 : (state.busRowIndex.get(busIdB) ?? 9999);
      return rowA - rowB;
    });

    for (let assignIdx = 0; assignIdx < sortedAssigns.length; assignIdx++) {
      const a = sortedAssigns[assignIdx];
      const busId = String(a.busId || "").trim();

      let bars = null;
      let lane = 0;
      let rowIdx = null;

      if (busId === "WAITING_LIST") {
        rowIdx = "WAITING";
        bars = barsByRowIdx.get("WAITING");

        // We can reuse the same allocator relative to "WAITING_LIST"
        lane = allocateLane(busId, startIdx, endIdx);
      } else {
        rowIdx = state.busRowIndex.get(busId);
        if (rowIdx === undefined) continue;
        bars = barsByRowIdx.get(rowIdx);
        lane = allocateLane(busId, startIdx, endIdx);
      }

      if (!bars) continue;

      const d1 = a.driver1 && a.driver1 !== "None" ? a.driver1 : "";
      const d2 = a.driver2 && a.driver2 !== "None" ? a.driver2 : "";

      const key = barKey(t.tripKey, busId, d1, d2);
      let bar = state.barElByKey.get(key);

      if (!bar) {
        bar = document.createElement("div");
        bar.className = "schedule-grid__trip-bar";
        bar.setAttribute("draggable", "false");

        // Helper: fixed slot row
        function makeRow(slotMod) {
          const el = document.createElement("div");
          el.className = `schedule-grid__trip-bar__row schedule-grid__trip-bar__row--${slotMod}`;
          return el;
        }

        // 7 fixed rows
        const r1 = makeRow("1");
        const r2 = makeRow("2");
        const r3 = makeRow("3");
        const r4 = makeRow("4");
        const r5 = makeRow("5");
        const r6 = makeRow("6");
        const r7 = makeRow("7");

        // Row 1: Multi-bus badge (top-left) + Title
        const multiBadge = document.createElement("span");
        multiBadge.className = "schedule-grid__trip-bar__multi-badge";
        multiBadge.setAttribute("aria-hidden", "true");
        r1.appendChild(multiBadge);
        const line1 = document.createElement("div");
        line1.className = "schedule-grid__trip-bar__title";
        r1.appendChild(line1);

        // Row 2: Customer (sub)
        const line2 = document.createElement("div");
        line2.className = "schedule-grid__trip-bar__sub";
        r2.appendChild(line2);

        // Row 3: Contact name (sub)
        const line3 = document.createElement("div");
        line3.className = "schedule-grid__trip-bar__sub schedule-grid__trip-bar__contact";
        r3.appendChild(line3);

        // Row 4: Time row (left/right)
        const timeRow = document.createElement("div");
        timeRow.className = "schedule-grid__trip-bar__time-row";
        const left = document.createElement("span");
        left.className = "schedule-grid__trip-bar__time schedule-grid__trip-bar__time--left";
        const center = document.createElement("span");
        center.className = "schedule-grid__trip-bar__time schedule-grid__trip-bar__time--center";
        const right = document.createElement("span");
        right.className = "schedule-grid__trip-bar__time schedule-grid__trip-bar__time--right";
        timeRow.append(left, center, right);
        r4.appendChild(timeRow);

        // Row 5: Status icons
        const statusRow = document.createElement("div");
        statusRow.className = "schedule-grid__trip-bar__status-row";

        function makeMini(content, isIcon = false) {
          const b = document.createElement("span");
          b.className = "schedule-grid__trip-bar__mini-badge icon-status";
          const g = document.createElement("span");
          if (isIcon) {
            g.className =
              "schedule-grid__trip-bar__badge-glyph icon-badge-glyph material-symbols-outlined schedule-grid__trip-bar__badge-icon";
          } else {
            g.className = "schedule-grid__trip-bar__badge-glyph";
          }
          g.textContent = content;
          b.appendChild(g);
          return b;
        }

        const bI = makeMini("attach_file_off", true); // Itinerary
        bI.addEventListener("click", (e) => {
          if (bI.classList.contains("has-pdf")) {
            e.stopPropagation();
            const tk = bar.dataset.tripkey;
            const trip = state.tripByKey?.[tk];
            if (trip && trip.itineraryPdfUrl) {
              window.open(trip.itineraryPdfUrl, "_blank");
            }
          }
        });
        const bC = makeMini("phone_enabled", true); // Contact
        const b$ = makeMini("description", true); // Payment / Approval
        const bD = makeMini("person", true); // Driver
        const bInv = makeMini("attach_money", true); // Invoice
        const invText = document.createElement("span");
        invText.className = "schedule-grid__trip-bar__mini-badge-text icon-invoice-text";
        bInv.appendChild(invText);
        bInv._text = invText;

        bInv.classList.add("is-hidden"); // start hidden

        const barReqIcons = document.createElement("div");
        barReqIcons.className = "schedule-grid__trip-bar__req-icons";

        const statusBadgesWrap = document.createElement("div");
        statusBadgesWrap.className = "schedule-grid__trip-bar__status-badges";
        statusBadgesWrap.append(barReqIcons, b$, bI, bC, bD, bInv);
        statusRow.append(statusBadgesWrap);

        r5.appendChild(statusRow);

        // Row 6: Notes / pre-drivers
        const preDriversRow = document.createElement("div");
        preDriversRow.className = "schedule-grid__trip-bar__pre-drivers";
        r6.appendChild(preDriversRow);

        // Row 7: Drivers
        const driversRow = document.createElement("div");
        driversRow.className = "schedule-grid__trip-bar__drivers";
        r7.appendChild(driversRow);

        // Append all 7 fixed rows to bar (critical)
        bar.append(r1, r2, r3, r4, r5, r6, r7);

        // Keep your existing references working
        bar._multiBadge = multiBadge;
        bar._reqIcons = barReqIcons;
        bar._line1 = line1;
        bar._line2 = line2;
        bar._line3 = line3;
        bar._left = left;
        bar._center = center;
        bar._right = right;
        bar._bI = bI;
        bar._bC = bC;
        bar._b$ = b$;
        bar._bD = bD;
        bar._bInv = bInv;
        bar._preDrivers = preDriversRow;
        bar._drivers = driversRow;

        bar.dataset.tripkey = String(t.tripKey || "");
        bar.setAttribute("role", "button");
        bar.setAttribute("tabindex", "0");

        state.barElByKey.set(key, bar);
      }

      bar._renderPass = pass;
      bar.dataset.busid = busId;
      bar.dataset.lane = String(lane);

      let list = barsByBus.get(busId);
      if (!list) {
        list = [];
        barsByBus.set(busId, list);
      }
      list.push(bar);

      bar.dataset.sidx = String(startIdx);
      bar.dataset.eidx = String(endIdx);

      function setBadge(badgeEl, statusValue) {
        const s = String(statusValue || "")
          .trim()
          .toLowerCase();

        // 1) Red: Pending, Pending Quote, Pending Invoice
        const pending = s === "pending" || s === "pending quote" || s === "pending invoice";

        // 2) Yellow: Assigned, Quoted, Invoiced
        const yellow = s === "assigned" || s === "quoted" || s === "invoiced";

        // 3) Blue: Deposit Received, Blue
        const blue = s === "deposit received" || s === "blue";

        // 4) Green: PO Received, Not Required, Paid in Full, OK
        // (Handled by !pending && !yellow && !blue && !!s in the toggle)

        badgeEl.classList.toggle("is-pending", pending);
        badgeEl.classList.toggle("is-blue", blue);
        badgeEl.classList.toggle("is-yellow", yellow);
        badgeEl.classList.toggle("is-ok", !pending && !blue && !yellow && !!s);
      }

      if (bar._bI) setBadge(bar._bI, t.itineraryStatus);
      if (bar._bC) setBadge(bar._bC, t.contactStatus);
      if (bar._b$) setBadge(bar._b$, t.paymentStatus);
      if (bar._bD) setBadge(bar._bD, t.driverStatus);
      if (bar._bInv) setBadge(bar._bInv, t.invoiceStatus);

      // Swap payment status icon based on value
      if (bar._b$) {
        const glyph = bar._b$.querySelector(".schedule-grid__trip-bar__badge-glyph");
        if (glyph) {
          const iconName = getStatusIcon("paymentStatus", t.paymentStatus);
          glyph.textContent = iconName || "description";
        }
      }

      // Swap itinerary status icon when a PDF URL exists
      if (bar._bI) {
        const glyph = bar._bI.querySelector(".schedule-grid__trip-bar__badge-glyph");
        if (glyph) {
          if (t.itineraryPdfUrl) {
            glyph.textContent = "attach_file";
            bar._bI.classList.add("has-pdf");
            bar._bI.title = "Open itinerary PDF";
          } else {
            glyph.textContent = "attach_file_off";
            bar._bI.classList.remove("has-pdf");
            bar._bI.title = "Itinerary status";
          }
        }
      }

      // Swap driver status icon based on value
      if (bar._bD) {
        bar._bD.classList.add("has-action");
        const glyph = bar._bD.querySelector(".schedule-grid__trip-bar__badge-glyph");
        if (glyph) {
          const iconName = getStatusIcon("driverStatus", t.driverStatus);
          glyph.textContent = iconName || "person";
          glyph.dataset.action = "showDriverContact";
          glyph.dataset.tripkey = t.tripKey;
          glyph.style.cursor = "pointer";
        }
      }

      if (bar._bInv) {
        const inv = String(t.invoiceStatus || "")
          .trim()
          .toLowerCase();
        const showInv = inv === "invoiced" || inv === "deposit received" || inv === "paid in full";

        bar._bInv.classList.toggle("is-hidden", !showInv);
        // set number inside badge (right after icon)
        const num = String(t.invoiceNumber || "").trim();
        if (bar._bInv._text) bar._bInv._text.textContent = num;

        // always show the white text box when invoice icon is visible (even if no number)
        bar._bInv.classList.toggle("has-text", showInv);
      }

      // Requirement icons (left of status badges) from trip req flags
      const reqSpec = [
        { key: "req56Pass", icon: "tatami_seat" },
        { key: "reqSleeper", icon: "airline_seat_flat" },
        { key: "reqLift", icon: "accessible" },
        { key: "reqRelief", icon: "warning" },
        { key: "reqCoDriver", icon: "person_add" },
        { key: "reqHotel", icon: "apartment" },
      ];
      if (bar._reqIcons) {
        bar._reqIcons.innerHTML = "";
        reqSpec.forEach(({ key, icon }) => {
          if (!truthyRequirement(t[key])) return;
          const span = document.createElement("span");
          span.className = "schedule-grid__trip-bar__req-icon icon-req material-symbols-outlined";
          span.textContent = icon;
          span.setAttribute("aria-hidden", "true");
          bar._reqIcons.appendChild(span);
        });
      }

      bar.classList.toggle("cont-left", continuesLeft);
      bar.classList.toggle("cont-right", continuesRight);




      const pay = String(t.paymentStatus || "").toLowerCase();
      // Red unconfirmed if "Pending Quote" or "Quoted" (or legacy "pending")
      const isUnconfirmed = pay === "pending quote" || pay === "quoted" || pay === "pending";
      bar.classList.toggle("unconfirmed", isUnconfirmed);

      const ds = String(t.driverStatus || "")
        .trim()
        .toLowerCase();
      bar.classList.toggle("driverstatus-pending", ds === "pending");
      bar.classList.toggle("driverstatus-assigned", ds === "assigned");
      bar.classList.toggle("driverstatus-confirmed", ds === "confirmed");

      // Color Override
      bar.classList.remove(
        "color-green",
        "color-yellow",
        "color-gray",
        "color-violet",
        "color-pink",
      );
      const tripColor = String(t.tripColor || "")
        .trim()
        .toLowerCase();
      if (tripColor) {
        bar.classList.add(`color-${tripColor}`);
      }

      let touchesConflict = false;
      if (cellCounts) {
        for (let d = startIdx; d <= endIdx; d++) {
          const k2 = `${busId}|${d}`;
          if ((cellCounts[k2] || 0) > 1) {
            touchesConflict = true;
            break;
          }
        }
      }
      bar.classList.toggle("danger", touchesConflict);

      // Multi-bus indicator: e.g. 1/3, 2/3, 3/3 (only when trip has multiple buses)
      const total = sortedAssigns.length;
      bar.classList.toggle("has-multi-bus", total > 1);
      if (bar._multiBadge) {
        if (total > 1) {
          bar._multiBadge.textContent = `${assignIdx + 1}/${total}`;
          bar._multiBadge.classList.remove("is-hidden");
        } else {
          bar._multiBadge.textContent = "";
          bar._multiBadge.classList.add("is-hidden");
        }
      }

      const dest = t.destination || "Trip";
      const cust = t.customer || "";
      bar._line1.textContent = dest;
      bar._line2.textContent = cust;

      const name = (t.contactName || "").trim();
      const phone = (t.phone || "").trim();
      bar._line3.textContent = name;

      const depTime = t.departureTime;
      const spotTime = t.spotTime;
      const arrTime = t.arrivalTime;

      const isActualSingleDay = depY === arrY;
      bar.classList.toggle("single-day", isActualSingleDay);

      // For text rendering: are we on the actual start or end day of the trip?
      const isStartDay = start === depY;
      const isEndDay = end === arrY;

      if (isActualSingleDay) {
        const tDep = formatTime12(depTime);
        const tArr = formatTime12(arrTime);

        // Single-Day: show depart on left and arrive on right
        if (!tDep && !tArr) {
          bar._left.textContent = "TBD";
          bar._center.textContent = formatTime12(spotTime) || "";
          bar._right.textContent = "";
        } else {
          bar._left.textContent = tDep || "TBD";
          bar._center.textContent = formatTime12(spotTime) || "";
          bar._right.textContent = tArr || "TBD";
        }
      } else {
        // Multi-Day:
        // Left side shows Dep Time (only if this bar is the trip start)
        // Right side shows Arr Time (only if this bar is the trip end)
        if (isStartDay) {
          bar._left.textContent = formatTime12(depTime) || "TBD";
          bar._center.textContent = formatTime12(spotTime) || "";
        } else {
          bar._left.textContent = "";
          bar._center.textContent = "";
        }

        if (isEndDay) {
          bar._right.textContent = formatTime12(arrTime) || "TBD";
        } else {
          bar._right.textContent = "";
        }
      }

      bar._preDrivers.textContent = t.notes ? clipText(t.notes, 500) : "";

      bar._drivers.innerHTML = `
            <span class="schedule-grid__trip-bar__driver">${escHtml(d1)}</span>
            ${d2 && d2 !== "—" ? `<span class="schedule-grid__trip-bar__driver">${escHtml(d2)}</span>` : ""}
        `;

      positionBarWithinOverlay(bar, bars, col, startIdx, endIdx);

      /* Tooltip removed by user request (modal is used instead) */
      // const itin = clipText(t.itinerary, 1200);
      // const namePhone = [name, phone].filter(Boolean).join(" • ");
      // bar.title = `${namePhone || "—"}\n\nITINERARY\n${itin || "—"}`;

      let frag = fragByRow.get(rowIdx);
      if (!frag) {
        frag = document.createDocumentFragment();
        fragByRow.set(rowIdx, frag);
      }
      frag.appendChild(bar);
    }
  }

  for (const [busId, list] of barsByBus) {
    const laneCount = (lanesByBus[busId] || []).length || 1;
    const top0 = stackOffset(rowH, barH, step, laneCount);

    // Waiting list row grows to fit stacked trips; others use single row height
    const isWaitingList = busId === "WAITING_LIST";
    const effectiveRowH = isWaitingList ? Math.max(1, laneCount) * rowH : rowH;
    const maxTop = Math.max(0, effectiveRowH - barH - 1); // -1 for safety margin

    if (isWaitingList) {
      const wlTr = waitingBody?.rows?.[0];
      if (wlTr) {
        const h = `${effectiveRowH}px`;
        wlTr.style.setProperty("--waiting-list-dynamic-height", h);
        for (let c = 0; c < wlTr.cells.length; c++) {
          wlTr.cells[c].style.setProperty("--waiting-list-dynamic-height", h);
        }
      }
    }

    for (const bar of list) {
      const lane = Number(bar.dataset.lane);
      if (!Number.isFinite(lane)) continue;

      let topPx = top0 + lane * step;
      // Clamp to ensure bar stays within its row bounds
      topPx = Math.max(0, Math.min(topPx, maxTop));
      bar.style.top = `${Math.round(topPx)}px`; // <— snap
    }
  }

  for (const [ri, frag] of fragByRow) {
    barsByRowIdx.get(ri)?.appendChild(frag);
  }

  // When no trips on waiting list, keep row at single height
  const wlLanes = (lanesByBus["WAITING_LIST"] || []).length;
  if (wlLanes === 0 && waitingBody?.rows?.[0]) {
    const h = `${rowH}px`;
    const wlTr = waitingBody.rows[0];
    wlTr.style.setProperty("--waiting-list-dynamic-height", h);
    for (let c = 0; c < wlTr.cells.length; c++) {
      wlTr.cells[c].style.setProperty("--waiting-list-dynamic-height", h);
    }
  }

  pruneOldBars(pass);

  if (!deferConflicts && cellCounts && cellItems) {
    const conflicts = [];
    for (const k of Object.keys(cellCounts)) {
      if (cellCounts[k] <= 1) continue;

      const [busId, dayIdxStr] = k.split("|");
      const dayIdx = Number(dayIdxStr);

      const rowIdx = state.busRowIndex.get(busId);
      const row = dom.agendaBody.rows[rowIdx];
      if (!row) continue;

      row.cells[0].classList.add("bus-conflict");
      row.cells[dayIdx + 1]?.classList.add("conflict");

      const dateObj = addDays(state.currentDate, dayIdx);
      conflicts.push({
        busId,
        dayLabel: `${CONFIG.MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}`,
        items: cellItems[k] || [],
      });
    }

    showConflictsPanel(conflicts);
    dom.conflictBadge?.classList.toggle("is-hidden", !conflicts.length);
  } else if (deferConflicts) {
    const thisReq = state.weekReqId;
    const { start, end } = getWeekRange();
    const wk = weekKey(start, end);
    state.pendingConflictJob = { reqId: thisReq, weekKey: wk };

    const run = () => {
      if (!state.pendingConflictJob) return;
      if (state.pendingConflictJob.reqId !== state.weekReqId) return;
      const nowRange = getWeekRange();
      if (weekKey(nowRange.start, nowRange.end) !== state.pendingConflictJob.weekKey) return;

      const cc = {};
      const ci = {};

      for (const t of visibleTrips) {
        const depY = ymd(t._dep);
        const arrY = ymd(t._arr);

        const start = depY < weekStart ? weekStart : depY;
        const end = arrY > weekEnd ? weekEnd : arrY;

        const startIdx = weekIndex.get(start);
        const endIdx = weekIndex.get(end);
        if (startIdx == null || endIdx == null) continue;

        const assigns = state.assignmentsByTripKey[String(t.tripKey)] || [];
        for (const a of assigns) {
          const busId = String(a.busId || "").trim();
          if (state.busRowIndex.get(busId) === undefined) continue;

          for (let d = startIdx; d <= endIdx; d++) {
            const key = `${busId}|${d}`;
            cc[key] = (cc[key] || 0) + 1;
            (ci[key] ||= []).push({
              tripKey: t.tripKey,
              driver1: a.driver1 && a.driver1 !== "None" ? a.driver1 : "—",
              driver2: a.driver2 && a.driver2 !== "None" ? a.driver2 : "—",
              trip: t,
            });
          }
        }
      }

      clearConflictStyles();

      const conflicts = [];
      for (const k of Object.keys(cc)) {
        if (cc[k] <= 1) continue;

        const [busId, dayIdxStr] = k.split("|");
        const dayIdx = Number(dayIdxStr);

        const rowIdx = state.busRowIndex.get(busId);
        const row = dom.agendaBody.rows[rowIdx];
        if (!row) continue;

        row.cells[0].classList.add("bus-conflict");
        row.cells[dayIdx + 1]?.classList.add("conflict");

        const dateObj = addDays(state.currentDate, dayIdx);
        conflicts.push({
          busId,
          dayLabel: `${CONFIG.MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}`,
          items: ci[k] || [],
        });
      }

      for (const [, bar] of state.barElByKey) {
        if (bar._renderPass !== state.renderPass) continue;

        const busId = bar.dataset.busid;
        const sidx = Number(bar.dataset.sidx);
        const eidx = Number(bar.dataset.eidx);
        if (!busId || Number.isNaN(sidx) || Number.isNaN(eidx)) continue;

        let danger = false;
        for (let d = sidx; d <= eidx; d++) {
          if ((cc[`${busId}|${d}`] || 0) > 1) {
            danger = true;
            break;
          }
        }
        bar.classList.toggle("danger", danger);
      }

      showConflictsPanel(conflicts);
      dom.conflictBadge?.classList.toggle("is-hidden", !conflicts.length);
    };

    if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 600 });
    else setTimeout(run, 0);
  }
}

// ======================================================
// 21) DRIVER WEEK CARD (LEFT PANEL)
// ======================================================
function renderDriverWeekHeader() {
  if (!dom.driverWeekHeadRow) return;

  dom.driverWeekHeadRow.innerHTML = "";

  const thName = document.createElement("th");
  thName.textContent = "Driver";
  dom.driverWeekHeadRow.appendChild(thName);

  const weekDates = getWeekDates(); // Returns 7 days in correct order
  // In a Monday-start world, index 5 is Saturday.
  // In a Sunday-start world, index 6 is Saturday.
  const dayLabels = state.weekStartsOnMonday
    ? ["M", "T", "W", "T", "F", "S", "S"]
    : ["S", "M", "T", "W", "T", "F", "S"];

  weekDates.forEach((dStr, i) => {
    const th = document.createElement("th");
    th.textContent = dayLabels[i];

    // Highlight today in driver week header too
    if (dStr === ymd(new Date())) {
      th.classList.add("driver-week__header-cell--today");
    }

    dom.driverWeekHeadRow.appendChild(th);
  });

  const thCount = document.createElement("th");
  thCount.textContent = "";
  thCount.className = "driver-week__count";
  dom.driverWeekHeadRow.appendChild(thCount);
}
function renderDriverWeekGrid() {
  if (!dom.driverWeekHeadRow || !dom.driverWeekBody) return;

  renderDriverWeekHeader();

  const weekDates = getWeekDates(); // Full 7 days

  const weekIndex = new Map(weekDates.map((d, i) => [d, i]));
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6]; // 7 days, so last index is 6

  const onDaysByDriver = new Map();

  const visibleTrips = state.trips
    .map((t) => {
      const dep = parseYMD(t.departureDate);
      const arr = parseYMD(t.arrivalDate) || dep;
      return { ...t, _dep: dep, _arr: arr };
    })
    .filter((t) => t._dep && t._arr)
    .filter((t) => !(ymd(t._arr) < weekStart || ymd(t._dep) > weekEnd));

  for (const t of visibleTrips) {
    const depY = ymd(t._dep);
    const arrY = ymd(t._arr);

    const start = depY < weekStart ? weekStart : depY;
    const end = arrY > weekEnd ? weekEnd : arrY;

    const assigns = state.assignmentsByTripKey[String(t.tripKey)] || [];
    if (!assigns.length) continue;

    const startD = parseYMD(start);
    const endD = parseYMD(end);
    if (!startD || !endD) continue;

    for (let d = new Date(startD); d <= endD; d = addDays(d, 1)) {
      const k = ymd(d);
      const idx = weekIndex.get(k);
      if (idx == null) continue;

      for (const a of assigns) {
        const d1 = String(a.driver1 || "").trim();
        const d2 = String(a.driver2 || "").trim();
        const drivers = [d1, d2].filter((x) => x && x !== "None");

        for (const name of drivers) {
          if (!onDaysByDriver.has(name)) onDaysByDriver.set(name, new Set());
          onDaysByDriver.get(name).add(idx);
        }
      }
    }
  }

  const driverNames = (state.driversList || [])
    .map((d) => String(d.driverName || "").trim())
    .filter(Boolean);

  for (const name of onDaysByDriver.keys()) {
    if (!driverNames.includes(name)) driverNames.push(name);
  }

  dom.driverWeekBody.innerHTML = driverNames
    .map((name) => {
      const set = onDaysByDriver.get(name) || new Set();

      const cells = weekDates
        .map((dStr, idx) => {
          const on = set.has(idx);
          const unavailable = state.unavailabilityByDriver[name]?.[dStr];
          let cls = "driver-week__cell--off";
          if (on) cls = "driver-week__cell--on";
          else if (unavailable) cls = "driver-week__cell--unavailable";

          return `<td class="${cls}" data-driver="${escHtml(name)}" data-date="${dStr}"></td>`;
        })
        .join("");

      return `
<tr>
<td>${escHtml(name)}</td>
${cells}
<td class="driver-week__count">${set.size}</td>
</tr>
`;
    })
    .join("");
}

function updateDriverWeekIfVisible() {
  if (!dom.driverWeekCard) return;

  const driverCardVisible = getCardPanel("drivers") !== null;

  if (driverCardVisible) renderDriverWeekGrid();
}

// ======================================================
// 22) LEFT PANEL MODE + DESKTOP ENFORCEMENT
// ======================================================
// Card-to-panel mapping
const CARD_CONFIG = {
  trip: { card: dom.tripInfoCard, btn: dom.tripInputBtn },
  drivers: { card: dom.driverWeekCard, btn: dom.driversBtn },
  notes: { card: dom.notesCard, btn: dom.notesBtn },
};

function getCardPanel(cardType) {
  return state.cardPanelAssignments[cardType] || null;
}

/** Suppress horizontal scrollbar during layout changes (panel open/close, window resize) */
let _resizeTimer = 0;
function suppressScrollbarDuringResize() {
  const layout = document.getElementById("layoutPanels");
  if (!layout) return;
  layout.classList.add("is-resizing");
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => layout.classList.remove("is-resizing"), 800);
}

function getFirstAvailablePanel() {
  const panelStart = document.getElementById("panelStart");
  const panelEndEl = dom.panelEnd;

  const leftHasCard = Object.values(state.cardPanelAssignments).includes("left");
  const rightHasCard = Object.values(state.cardPanelAssignments).includes("right");

  if (!leftHasCard && panelStart) return "left";
  if (!rightHasCard && panelEndEl) return "right";
  return null; // Both panels occupied
}

function showCardInPanel(cardType, panel) {
  const config = CARD_CONFIG[cardType];
  if (!config || !config.card) return;

  suppressScrollbarDuringResize();

  const panelStart = document.getElementById("panelStart");
  const panelEndEl = dom.panelEnd;

  // Remove card from current location if it's a direct child
  const currentParent = config.card.parentElement;
  if (currentParent === panelStart || currentParent === panelEndEl) {
    currentParent.removeChild(config.card);
  }

  // Add to target panel
  if (panel === "left" && panelStart) {
    panelStart.appendChild(config.card);
    panelStart.classList.remove("app-layout__sidebar--collapsed");
  } else if (panel === "right" && panelEndEl) {
    panelEndEl.appendChild(config.card);
    panelEndEl.classList.remove("app-layout__sidebar--collapsed");
  }

  // Show the card
  config.card.classList.remove("is-hidden");

  // Reset animation
  config.card.classList.remove("fade-in");
  void config.card.offsetWidth; // force reflow
  config.card.classList.add("fade-in");

  // Update state
  state.cardPanelAssignments[cardType] = panel;

  // Update button state
  if (config.btn) {
    config.btn.setAttribute("aria-pressed", "true");
  }

  // Special handling for specific cards
  if (cardType === "notes") {
    updateNotesWeekTitle();
  }
  if (cardType === "drivers") {
    updateDriverWeekIfVisible();
  }

  scheduleAgendaReflow();
}

function hideCard(cardType) {
  const config = CARD_CONFIG[cardType];
  if (!config || !config.card) return;

  suppressScrollbarDuringResize();

  const panel = state.cardPanelAssignments[cardType];
  config.card.classList.add("is-hidden");
  state.cardPanelAssignments[cardType] = null;

  // Update button state
  if (config.btn) {
    config.btn.setAttribute("aria-pressed", "false");
  }

  // Collapse panel if it's now empty (check state, not DOM)
  const panelStart = document.getElementById("panelStart");
  const panelEndEl = dom.panelEnd;

  const leftHasCards = Object.values(state.cardPanelAssignments).includes("left");
  const rightHasCards = Object.values(state.cardPanelAssignments).includes("right");

  if (panelStart && !leftHasCards) {
    panelStart.classList.add("app-layout__sidebar--collapsed");
  }
  if (panelEndEl && !rightHasCards) {
    panelEndEl.classList.add("app-layout__sidebar--collapsed");
  }

  scheduleAgendaReflow();
}

function toggleCard(cardType) {
  const currentPanel = getCardPanel(cardType);

  if (currentPanel) {
    // Card is open, close it
    hideCard(cardType);
  } else {
    // Card is closed, find available panel
    const availablePanel = getFirstAvailablePanel();
    if (availablePanel) {
      showCardInPanel(cardType, availablePanel);
    } else {
      // Both panels full - close leftmost card and open new one there
      const leftCard = Object.keys(state.cardPanelAssignments).find(
        (k) => state.cardPanelAssignments[k] === "left",
      );
      if (leftCard) {
        hideCard(leftCard);
      }
      showCardInPanel(cardType, "left");
    }
  }
}

// Legacy function for backward compatibility (if needed)
function setSidePanelMode(mode) {
  if (mode === "off") {
    // Close all cards
    Object.keys(CARD_CONFIG).forEach((cardType) => hideCard(cardType));
  } else {
    // Ensure card is shown (don't toggle if already open)
    const currentPanel = getCardPanel(mode);
    if (!currentPanel) {
      // Card is not open, find available panel and show it
      const availablePanel = getFirstAvailablePanel();
      if (availablePanel) {
        showCardInPanel(mode, availablePanel);
      }
    }
    // If card is already open, do nothing (don't toggle it off)
  }
}

function setPanelStartMode(show) {
  const panelStart = document.getElementById("panelStart");
  if (!panelStart) return;

  panelStart.classList.toggle("app-layout__sidebar--collapsed", !show);

  const btn = document.getElementById("panelStartBtn");
  if (btn) {
    btn.setAttribute("aria-pressed", show ? "true" : "false");
  }

  if (dom.agendaBody?.rows?.length) scheduleAgendaReflow();
}

function enforceDesktopEditing() {
  const mobile = isMobileOnly();

  if (dom.tripInputBtn) {
    dom.tripInputBtn.disabled = mobile;
    dom.tripInputBtn.title = mobile ? "Trip editing is available on desktop" : "Trip Editor";
    dom.tripInputBtn.setAttribute("aria-disabled", mobile ? "true" : "false");
  }

  if (mobile) setSidePanelMode("off");
}

// ======================================================
// 23) BUS ASSIGNMENTS UI
// ======================================================
function makeSelect(name) {
  const sel = document.createElement("select");
  sel.name = name;
  return sel;
}

function setSelectOptions(sel, options, selectedValue) {
  const prev = selectedValue ?? sel.value;
  sel.innerHTML = "";
  for (const o of options) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  }
  const has = options.some((o) => String(o.value) === String(prev));
  sel.value = has ? String(prev) : "None";
}

function getBusOptions() {
  const base = [
    { value: "None", label: "None" },
    { value: "WAITING_LIST", label: "Waiting List" },
  ];
  const mapped = state.busesList.map((b) => ({
    value: String(b.busId),
    label: b.busName ? `${b.busName}` : `Bus ${b.busId}`,
  }));
  return base.concat(mapped);
}

function getDriverOptions() {
  const base = [{ value: "None", label: "None" }];
  const mapped = state.driversList.map((d) => ({
    value: d.driverName ? String(d.driverName) : String(d.driverId),
    label: d.driverName ? String(d.driverName) : String(d.driverId),
  }));
  return base.concat(mapped);
}

function syncBusSelectEmptyState() {
  document.querySelectorAll("#busGrid select").forEach((el) => {
    const v = (el.value ?? "").trim();
    const cell = el.closest(".select-dropdown") || el;
    cell.classList.toggle("is-empty", !v || v === "None");
  });
}

function refreshBusSelectOptions() {
  const busOpts = getBusOptions();
  const drvOpts = getDriverOptions();
  state.busRows.forEach((r) => {
    setSelectOptions(r.busSel, busOpts);
    setSelectOptions(r.d1Sel, drvOpts);
    setSelectOptions(r.d2Sel, drvOpts);
  });
  syncBusSelectEmptyState();
}

function updateBusRowVisibility() {
  const raw = Number(dom.busesNeeded.value);
  const n = raw > 0 ? Math.min(10, raw) : 1;

  state.busRows.forEach((r, idx) => {
    const show = idx < n;
    const enabled = raw > 0 && show;

    const busCell = r.busSel.closest(".select-dropdown") || r.busSel;
    const d1Cell = r.d1Sel.closest(".select-dropdown") || r.d1Sel;
    const d2Cell = r.d2Sel.closest(".select-dropdown") || r.d2Sel;
    busCell.classList.toggle("is-hidden", !show);
    d1Cell.classList.toggle("is-hidden", !show);
    d2Cell.classList.toggle("is-hidden", !show);

    r.busSel.disabled = !enabled;
    r.d1Sel.disabled = !enabled;
    r.d2Sel.disabled = !enabled;

    // Disable custom dropdown triggers when select is disabled (native select is hidden)
    const busTrigger = busCell.querySelector?.(".select-trigger");
    const d1Trigger = d1Cell.querySelector?.(".select-trigger");
    const d2Trigger = d2Cell.querySelector?.(".select-trigger");
    if (busTrigger) busTrigger.disabled = !enabled;
    if (d1Trigger) d1Trigger.disabled = !enabled;
    if (d2Trigger) d2Trigger.disabled = !enabled;

    if (!show) {
      r.busSel.value = "None";
      r.d1Sel.value = "None";
      r.d2Sel.value = "None";
    }
  });

  syncBusSelectEmptyState();
}

function syncBusPanelState() {
  const unlocked = Number(dom.busesNeeded.value) > 0;
  dom.busPanel.classList.toggle("is-disabled", !unlocked);
}

function setBusesNeededAndSync(value) {
  dom.busesNeeded.value = value;
  updateBusRowVisibility();
  syncBusPanelState();
}

function buildBusRowsOnce() {
  dom.busGrid.innerHTML = "";
  state.busRows.length = 0;

  dom.busGrid.className = "bus-assign";

  const h1 = document.createElement("div");
  h1.className = "field-label";
  h1.textContent = "Bus";

  const h2 = document.createElement("div");
  h2.className = "field-label";
  h2.textContent = "Driver 1";

  const h3 = document.createElement("div");
  h3.className = "field-label";
  h3.textContent = "Driver 2";

  dom.busGrid.append(h1, h2, h3);

  for (let i = 1; i <= 10; i++) {
    const busSel = makeSelect(`bus${i}`);
    const d1Sel = makeSelect(`bus${i}_driver1`);
    const d2Sel = makeSelect(`bus${i}_driver2`);

    busSel.classList.add("bus-assign__cell");
    d1Sel.classList.add("bus-assign__cell");
    d2Sel.classList.add("bus-assign__cell");

    dom.busGrid.append(busSel, d1Sel, d2Sel);

    state.busRows.push({ row: null, busSel, d1Sel, d2Sel });
  }

  refreshBusSelectOptions();
  updateBusRowVisibility();
  syncBusSelectEmptyState();
  refreshEmptyStateUI();
}

// ======================================================
// 24) WEEK DATE UI + WEEK NAV
// ======================================================
function updateWeekDates() {
  if (!state.currentDate) state.currentDate = startOfWeek(new Date());

  if (dom.weekPicker) dom.weekPicker.value = toLocalDateInputValue(state.currentDate);

  updateWeekTitle();
  fitDateTitle();

  const today = new Date();
  const todayYmd = ymd(today);
  const ids = getDayIds();

  // Strip all "today" classes completely first to avoid them getting stuck
  // when the DOM element order is swapped by the week toggle.
  document.querySelectorAll(".schedule-grid__day-cell--today").forEach((el) => {
    el.classList.remove("schedule-grid__day-cell--today");
  });
  document.querySelectorAll(".schedule-grid__header-cell--today").forEach((el) => {
    el.classList.remove("schedule-grid__header-cell--today");
  });

  ids.forEach((dayId, index) => {
    const date = addDays(state.currentDate, index);
    const th = document.getElementById(dayId);
    const dateSpan = th?.querySelector?.(".schedule-grid__day-date");
    if (dateSpan) dateSpan.textContent = `${date.getDate()}`;

    const isToday = ymd(date) === todayYmd;
    th?.classList.toggle("schedule-grid__header-cell--today", isToday);

    // Update body cells in this column too
    document.querySelectorAll(`td[data-day-id="${dayId}"]`).forEach((td) => {
      td.classList.toggle("schedule-grid__day-cell--today", isToday);
    });
  });

  const { start, end } = getWeekRange();
  const key = weekKey(start, end);
  const cached = getCachedWeek(key);

  if (cached?.ok) {
    applyWeekRespToState(cached);
    updateDriverWeekIfVisible();
    scheduleAgendaReflow();
    refreshWeekData({ silent: true });
  } else {
    refreshWeekData({ silent: false });
  }
}

function changeWeek(direction) {
  // Warn if there are unsaved notes
  if (state.notesDirty) {
    if (!confirm("You have unsaved notes changes. Discard them?")) return;
    state.notesDirty = false;
  }

  // Abort any in-flight requests to prevent stale data
  if (state.activeAbortController) {
    state.activeAbortController.abort();
    state.activeAbortController = null;
  }

  const moved = addDays(state.currentDate, direction * 7);
  state.currentDate = startOfWeek(moved);
  updateWeekDates();
}

// ======================================================
// 25) WEEK REFRESH PIPELINE
// ======================================================
async function loadTripsForWeek(reqId) {
  const { start, end, notesKey } = getWeekRange();

  // 1. Instant Load from LocalStorage (SWR)
  const localKey = "week_" + weekKey(start, end);
  const localData = CACHE.get(localKey);

  if (localData && localData.ok) {
    if (reqId != null && reqId !== state.weekReqId) return;
    applyWeekRespToState(localData);
    updateDriverWeekIfVisible();
    scheduleAgendaReflow();

    // FIXED: Reveal the bars immediately if we have local data!
    setBarsHidden(false);

    // Show "Updating..." toast non-intrusively
    toastShow("Updating…", "loading", { backdrop: false });
  }

  // 2. Always Fetch Fresh Data (Force)
  const resp = await fetchWeekDataCached(start, end, notesKey, true);

  if (reqId != null && reqId !== state.weekReqId) return;

  applyWeekRespToState(resp);
  updateDriverWeekIfVisible();
  scheduleAgendaReflow();
}

async function refreshWeekData({ silent = false } = {}) {
  const reqId = ++state.weekReqId;

  try {
    if (!silent) {
      toastShow("Loading week… 0%", "loading", { backdrop: false });
      toastProgress(0);
    }

    // Only dim/hide bars for explicit (non-silent) refreshes so that
    // background syncs don't cause visible flicker during editing.
    if (!silent) setBarsHidden(true);

    if (!silent) toastProgress(10, "Preparing… 10%");

    clearConflictStyles();
    showConflictsPanel([]);
    dom.conflictBadge?.classList.add("is-hidden");

    if (!silent) toastProgress(20, "Fetching… 20%");

    await loadTripsForWeek(reqId);

    if (!silent) toastProgress(60, "Building schedule… 60%");

    startProgressCreep({ from: 60, to: 95, label: "Loading week… " });

    await waitForAgendaPaint();

    stopProgressCreep();
    if (!silent) {
      toastProgress(100, "Done ✓ 100%");
      toastHide(350);
      toast("Up to date ✓", "success", 900);
    } else {
      toastHide(0);
    }

    prefetchAdjacentWeeks();
  } catch (e) {
    stopProgressCreep();
    console.error(e);
    toast("Refresh failed", "danger", 2200);
  } finally {
    if (!silent && reqId === state.weekReqId) setBarsHidden(false);
  }
}

// ======================================================
// 26) TRIP MODE + CLEAR
// ======================================================
function setTripIdBadge(text, show = true) {
  if (!dom.tripIdBadge) return;
  dom.tripIdBadge.textContent = text;
  dom.tripIdBadge.classList.toggle("is-hidden", !show);
}

function setModeNew() {
  dom.action.value = "create";
  dom.tripKey.value = "";
  dom.tripId.value = "";
  setTripIdBadge("", false);
  dom.deleteBtn.disabled = true;
}

function setModeEdit(tripKey, tripId) {
  dom.action.value = "update";
  dom.tripKey.value = tripKey;
  dom.tripId.value = tripId || "";
  setTripIdBadge(tripId, true);
  dom.deleteBtn.disabled = false;
}

function clearTripInfoCardForNextTrip() {
  dom.tripForm.reset();
  resetRequirementToggles();
  refreshEmptyStateUI();
  setModeNew();

  setSelectToPlaceholder("busesNeeded");
  setSelectToPlaceholder("tripColor");
  setSelectToPlaceholder("itineraryStatus");
  setSelectToPlaceholder("contactStatus");
  setSelectToPlaceholder("paymentStatus");
  setSelectToPlaceholder("driverStatus");
  setSelectToPlaceholder("invoiceStatus");

  dom.busesNeeded.value = "";
  updateBusRowVisibility();
  syncBusPanelState();
  refreshBusSelectOptions();

  ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus", "invoiceStatus"].forEach(
    (id) => updateStatusSelect($(id)),
  );
  updateInvoiceNumberVisibility();

  // Form has been cleared intentionally; mark as not dirty.
  state.tripFormDirty = false;
}

// ======================================================
// 27) ITINERARY MODAL
// ======================================================
function openItineraryModal() {
  state.lastFocusedElement = document.activeElement;
  dom.itineraryModalField.value = dom.itineraryField.value || "";
  dom.itineraryModal.hidden = false;
  dom.itineraryModalField.focus();
}

function closeItineraryModal() {
  dom.itineraryField.value = dom.itineraryModalField.value || "";
  dom.itineraryField.dispatchEvent(new Event("input", { bubbles: true }));
  dom.itineraryModal.hidden = true;
  if (state.lastFocusedElement) {
    state.lastFocusedElement.focus();
    state.lastFocusedElement = null;
  }
}

// ======================================================
// 28) MOBILE TRIP DETAILS MODAL
// ======================================================
// ======================================================
function renderTripDetailsModalFromData(t, assigns) {
  let html = "";

  function detailGridItem(label, val, itemClass) {
    const display = val ? escHtml(val) : "—";
    const wrapClass = itemClass
      ? `trip-details__grid-item ${itemClass}`
      : "trip-details__grid-item";
    return `<div class="${wrapClass}"><span class="toggle-pill-grid-label">${label}:</span> <span class="trip-details__value">${display}</span></div>`;
  }

  function getDetailStatusClass(fieldId, val) {
    const v = String(val || "")
      .trim()
      .toLowerCase();
    if (!v) return "";
    if (fieldId === "driverStatus") {
      if (v === "pending") return "status-pending";
      if (v === "assigned") return "status-assigned";
      return "status-ok";
    }
    if (fieldId === "paymentStatus") {
      if (v === "pending quote") return "status-pending";
      if (v === "quoted") return "status-assigned";
      return "status-ok";
    }
    if (fieldId === "invoiceStatus") {
      if (v === "pending invoice") return "status-pending";
      if (v === "invoiced") return "status-assigned";
      if (v === "deposit received") return "status-blue";
      if (v === "paid in full") return "status-ok";
      return "";
    }
    if (v === "pending") return "status-pending";
    return "status-ok";
  }

  function rowStatus(label, val, fieldId, extraClass) {
    const display = val ? escHtml(val) : "—";
    const cls = val ? getDetailStatusClass(fieldId, val) : "";
    const wrapClass = extraClass
      ? `trip-details__grid-item ${extraClass}`
      : "trip-details__grid-item";
    const valueSpan = cls
      ? `<span class="trip-details__value ${cls}">${display}</span>`
      : `<span class="trip-details__value">${display}</span>`;
    return `<div class="${wrapClass}"><span class="toggle-pill-grid-label">${label}:</span> ${valueSpan}</div>`;
  }

  function section(title) {
    return `<div class="trip-details__section-title toggle-pill-grid-label">${title}</div>`;
  }

  html += `<div class="trip-details__meta-grid detail-status-grid">`;
  html += rowStatus(
    "Itinerary Status",
    t.itineraryStatus,
    "itineraryStatus",
    "trip-details__hide-mobile",
  );
  html += rowStatus(
    "Contact Status",
    t.contactStatus,
    "contactStatus",
    "trip-details__hide-mobile",
  );
  html += rowStatus(
    "Approval Status",
    t.paymentStatus,
    "paymentStatus",
    "trip-details__hide-mobile",
  );
  html += rowStatus("Driver Status", t.driverStatus, "driverStatus", "trip-details__hide-mobile");
  html += rowStatus(
    "Invoice Status",
    t.invoiceStatus,
    "invoiceStatus",
    "trip-details__hide-mobile",
  );
  html += detailGridItem("Invoice Number", t.invoiceNumber, "trip-details__hide-mobile");
  html += detailGridItem("Contact", t.contactName);
  html += detailGridItem("Phone", t.phone);
  html += `</div>`;

  html += `<div class="detail-divider"></div>`;

  if (t.itinerary) {
    html += `<div class="trip-details__itinerary-scroll pre-wrap">${escHtml(t.itinerary)}</div>`;
  }

  dom.tripDetailsBody.innerHTML = html;
  state.lastFocusedElement = document.activeElement;
  dom.tripDetailsModal.hidden = false;
  const firstBtn = dom.tripDetailsModal.querySelector("button");
  if (firstBtn) firstBtn.focus();
}

async function openTripDetailsModal(tripKey) {
  try {
    toastShow("Loading details… 0%", "loading");
    toastProgress(0);

    const k = String(tripKey || "").trim();
    if (!k) throw new Error("Missing tripKey");

    toastProgress(15, "Checking cache… 15%");

    const cachedTrip = state.tripByKey?.[k] || null;
    const cachedAssigns = state.assignmentsByTripKey?.[k] || [];

    const hasCore =
      cachedTrip &&
      (cachedTrip.destination ||
        cachedTrip.customer ||
        cachedTrip.departureDate ||
        cachedTrip.arrivalDate);

    let t = cachedTrip || {};
    let assigns = Array.isArray(cachedAssigns) ? cachedAssigns : [];

    if (hasCore) {
      toastProgress(55, "Rendering… 55%");
      renderTripDetailsModalFromData(t, assigns);
      toastProgress(100, "Loaded ✓");
      toastHide(800);
      return;
    }

    const startTime = Date.now();
    toastProgress(30, "Fetching trip… 30%");

    const [tripResp, assignResp] = await Promise.all([api.getTrip(k), api.getBusAssignments(k)]);

    // Force minimum delay for UX consistency
    const elapsed = Date.now() - startTime;
    if (elapsed < 600) {
      toastProgress(50, "Processing…");
      await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
    }

    if (!tripResp?.ok) throw new Error(tripResp?.error || "Trip not found");

    t = tripResp.trip || {};
    assigns = assignResp?.ok && Array.isArray(assignResp.assignments) ? assignResp.assignments : [];

    toastProgress(70, "Rendering… 70%");
    renderTripDetailsModalFromData(t, assigns);

    toastProgress(100, "Loaded ✓");
    toastHide(800);
  } catch (e) {
    console.error(e);
    toast("Could not load details", "danger", 2200);
  }
}

function closeTripDetailsModal() {
  dom.tripDetailsModal.hidden = true;
  if (state.lastFocusedElement) {
    state.lastFocusedElement.focus();
    state.lastFocusedElement = null;
  }
}

// ======================================================
// DRIVER CONTACT MODAL
// ======================================================

function openDriverContactModal(tripKey) {
  const trip = state.tripByKey[tripKey];
  if (!trip) return;

  state.lastFocusedElement = document.activeElement;

  // Retrieve assignments for the trip
  const rowA = state.assignmentsByTripKey[tripKey];

  // Helper: get driver object from name
  const getDriverObj = (name) => {
    if (!name) return null;
    return (
      state.driversList.find(
        (d) => String(d.driverName).trim().toLowerCase() === String(name).trim().toLowerCase(),
      ) || null
    );
  };

  const isAssigned = (name) => {
    const n = String(name || "").trim();
    return n && n.toLowerCase() !== "none";
  };

  // --- 1. Generate OFFICE/CUSTOMER Message ---
  const dDate = trip.departureDate ? parseYMD(trip.departureDate) : null;
  const dDateStr = dDate
    ? dDate.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    })
    : "the upcoming date";
  const destName = trip.destination || "your destination";

  let officeText = `Hello,\n\nBelow is the driver contact information for your trip on ${dDateStr} going to ${destName}:\n\n`;
  const officeBlocks = [];

  if (rowA && rowA.length > 0) {
    rowA.forEach((assignment) => {
      const busId = assignment.busId && assignment.busId !== "—" ? assignment.busId : trip.busId || "None";
      const d1Name = assignment.driver1 && assignment.driver1 !== "—" ? assignment.driver1 : "";
      const d2Name = assignment.driver2 && assignment.driver2 !== "—" ? assignment.driver2 : "";

      if (isAssigned(d1Name)) {
        const d1 = getDriverObj(d1Name);
        officeBlocks.push(`Name:  ${d1Name}\nPhone: ${d1 ? d1.phone || "None" : "None"}\nBus:   ${busId}`);
      }
      if (isAssigned(d2Name)) {
        const d2 = getDriverObj(d2Name);
        officeBlocks.push(`Name:  ${d2Name}\nPhone: ${d2 ? d2.phone || "None" : "None"}\nBus:   ${busId}`);
      }
    });
  }

  if (officeBlocks.length === 0) {
    officeText += `No drivers assigned yet.\n\n`;
  } else {
    officeText += officeBlocks.join("\n\n") + "\n\n";
  }
  officeText += `Thank you!`;

  // --- 2. Generate DRIVER REMINDER Message ---
  let reminderText = "";
  if (dDate) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isTomorrow = dDate.getFullYear() === tomorrow.getFullYear() &&
      dDate.getMonth() === tomorrow.getMonth() &&
      dDate.getDate() === tomorrow.getDate();

    const dateLabel = isTomorrow ? "Tomorrow" : dDate.toLocaleDateString("en-US", { weekday: "long" });
    const fullDate = dDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const spotTime = envFormatTime(trip.spotTime || trip.departureTime || "");

    reminderText = `Reminder for your trip ${dateLabel}, ${fullDate} at ${spotTime}\n\n`;

    if (officeBlocks.length > 0) {
      reminderText += officeBlocks.join("\n\n");
    } else {
      reminderText += "No drivers assigned yet.";
    }
  } else {
    reminderText = "No trip date set.";
  }

  // Set values and show modal
  dom.driverContactBody.value = officeText;
  dom.driverReminderBody.value = reminderText;
  dom.driverContactModal.hidden = false;
}

// ======================================================
// TRIP ENVELOPE MODAL (from schedule trip data)
// ======================================================

const ENVELOPE_BRAND_ADDR =
  "2801 Zinnia Ave. McAllen TX 78504\n(956) 994-1169 / Fax 994-9491 / Cell 648-9691";

function envFormatDate(ymdStr) {
  if (!ymdStr) return "";
  const d = parseYMD(ymdStr);
  if (!d) return String(ymdStr).slice(0, 10);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function envFormatWeekday(ymdStr) {
  if (!ymdStr) return "";
  const d = parseYMD(ymdStr);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
}

function envFormatTime(val) {
  if (val == null || val === "") return "";
  const s = String(val).trim();
  // Already 12-hour (e.g. "7:30 PM") — normalize to "7:30 PM"
  const match12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    const h = parseInt(match12[1], 10);
    const m = match12[2];
    const ampm = (match12[3] || "").toUpperCase();
    return `${h}:${m} ${ampm}`;
  }
  // Parse 24-hour or time-only and format as 12-hour (e.g. 7:30 PM)
  const iso = s.length <= 5 ? s + ":00" : s.replace(" ", "");
  const d = new Date("1970-01-01T" + iso);
  if (isNaN(d.getTime())) return s;
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function createEnvelopePageElement() {
  const page = document.createElement("div");
  page.className = "envelope-page env-yellow";

  const brandAddr = ENVELOPE_BRAND_ADDR.replace(/\n/g, "<br>");
  page.innerHTML = `
    <div class="env-panel">
      <div class="env-header">
        <div class="env-day" data-field="day"></div>
        <div class="env-brand">
          <img src="logo.png" alt="Logo" onerror="this.style.display='none'">
          <div class="env-addr">${brandAddr}</div>
        </div>
      </div>
      <div class="env-section-title">TRIP INFORMATION</div>
      <div class="env-trip-contact">
        <div class="env-trip">
          <div class="env-trip-row env-cols-3">
            <div class="env-cell"><span class="env-label">BUS #</span><span class="env-value" data-field="busno"></span></div>
            <div class="env-cell"><span class="env-label">BUS DRIVER</span><span class="env-value" data-field="driver"></span></div>
            <div class="env-cell"><span class="env-label">CO-DRIVER</span><span class="env-value" data-field="codriver"></span></div>
          </div>
          <div class="env-trip-row env-cols-2">
            <div class="env-cell">
              <div style="display:flex;justify-content:space-between;align-items:baseline;width:100%;">
                <span class="env-label">TRIP DATE</span>
                <span class="env-label" data-field="returnlabel" style="text-align:right;">RETURN</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.08in;">
                <span class="env-value" data-field="tripdate" style="width:120px;"></span>
                <span style="flex:1 1 auto;"></span>
                <span class="env-value" data-field="returndate" style="width:120px;text-align:right;"></span>
              </div>
            </div>
            <div class="env-cell"><span class="env-label">SPOT TIME</span><span class="env-value" data-field="spottime"></span></div>
          </div>
          <div class="env-trip-row env-cols-1">
            <div class="env-cell"><span class="env-label">PICK UP ADDRESS</span><span class="env-value" data-field="pickup"></span></div>
          </div>
          <div class="env-trip-row env-cols-1">
            <div class="env-cell"><span class="env-label">DESTINATION</span><span class="env-value" data-field="destination"></span></div>
          </div>
        </div>
        <div class="env-grid-row">
          <div class="env-cell"><span class="env-label">CONTACT</span><span class="env-value" data-field="contact"></span></div>
          <div class="env-cell"><span class="env-label">PHONE</span><span class="env-value" data-field="phone"></span></div>
        </div>
      </div>
      <div class="env-odometer-box">
        <div class="env-grid-row">
          <div class="env-cell"><span class="env-label">STARTING ODOMETER</span><span class="env-value" data-field="startodo"></span></div>
          <div class="env-cell"><span class="env-label">ENDING ODOMETER</span><span class="env-value" data-field="endodo"></span></div>
        </div>
      </div>
      <div class="env-mini">
        <table>
          <tr><td>ELD BACKUP USED</td><td><span class="env-choice">YES</span> <span class="env-choice">NO</span></td><td>DIESEL/BLUE DEF</td><td><div class="money"><span class="dollar">$</span><span class="amount-space"></span></div></td></tr>
          <tr><td>ELD VERIFIED</td><td>DRIVER / OFFICE</td><td>HOTEL</td><td><div class="money"><span class="dollar">$</span><span class="amount-space"></span></div></td></tr>
          <tr><td>CC FOR TRIP <span class="material-symbols-outlined env-cc-icon">credit_card</span></td><td><span class="env-choice">YES</span> <span class="env-choice">NO</span></td><td>REPAIRS</td><td><div class="money"><span class="dollar">$</span><span class="amount-space"></span></div></td></tr>
          <tr><td colspan="2" class="env-mini-td-left">CC RECEIVED BY</td><td>MISCELLANEOUS</td><td><div class="money"><span class="dollar">$</span><span class="amount-space"></span></div></td></tr>
          <tr><td colspan="2" class="env-mini-td-left">TOTAL TRIP MILES</td><td>TOTAL</td><td><div class="money"><span class="dollar">$</span><span class="amount-space"></span></div></td></tr>
        </table>
      </div>
      <div class="env-footer">
        <span class="env-label">NOTES</span>
        <div class="env-notes-lines">
          <span class="env-value env-notes-line" data-field="notes1"></span>
          <span class="env-value env-notes-line" data-field="notes2"></span>
          <span class="env-value env-notes-line" data-field="notes3"></span>
        </div>
      </div>
    </div>
  `;
  return page;
}

function fillEnvelopePage(pageEl, trip, assignment) {
  if (!pageEl || !trip) return;
  const busId = assignment ? assignment.busId || trip.busId || "" : trip.busId || "";
  const driver1 = assignment ? assignment.driver1 || "" : "";
  const rawDriver2 = assignment ? assignment.driver2 || "" : "";
  // Treat common \"no co-driver\" markers as empty
  const driver2 =
    rawDriver2 && rawDriver2.toString().trim().toLowerCase() !== "none" && rawDriver2 !== "—"
      ? rawDriver2
      : "";

  const set = (field, text) => {
    const el = pageEl.querySelector(`[data-field="${field}"]`);
    if (!el) return;
    let val = String(text ?? "").trim();
    // Uppercase envelope display fields (driver names, trip text, dates, notes)
    const upperFields = new Set([
      "day",
      "busno",
      "driver",
      "codriver",
      "tripdate",
      "returndate",
      "arrivaltime",
      "pickup",
      "destination",
      "contact",
      "notes1",
      "notes2",
      "notes3",
    ]);
    if (upperFields.has(field)) {
      val = val.toUpperCase();
    }
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.value = val;
      el.setAttribute("value", val);
      if (el.tagName === "TEXTAREA") el.innerHTML = String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } else {
      el.textContent = val;
    }
  };

  const notesSrc = (trip.envelopeTripNotes || "").toString();
  const notesLines = notesSrc.split("\n");

  const tripDateStr = envFormatDate(trip.departureDate);
  const returnDateStr = envFormatDate(trip.arrivalDate);
  const showReturn = !!returnDateStr && (!tripDateStr || returnDateStr !== tripDateStr); // blank if same as trip date

  set("day", envFormatWeekday(trip.departureDate));
  set("busno", busId);
  set("driver", driver1);
  // If there is no real co-driver, field stays blank
  set("codriver", driver2);
  set("tripdate", tripDateStr);
  set("returndate", showReturn ? returnDateStr : "");
  set("returnlabel", showReturn ? "RETURN" : "");
  set("spottime", envFormatTime(trip.spotTime || trip.departureTime));
  set("pickup", trip.envelopePickup || "");
  set("destination", trip.destination || "");
  set("contact", trip.envelopeTripContact || "");
  set("phone", trip.envelopeTripPhone || "");
  set("startodo", "");
  set("endodo", "");
  set("notes1", notesLines[0] || "");
  set("notes2", notesLines[1] || "");
  set("notes3", notesLines[2] || "");
}

let stateEnvelope = { tripKey: null, trip: null, assignments: [], bg: "yellow" };

function openEnvelopeModal(tripKey) {
  let trip = state.tripByKey?.[tripKey];
  if (!trip) {
    toast("Trip not found.", "danger", 2000);
    return;
  }

  // If the envelope is opened for the trip currently being edited,
  // merge the unsaved form values so the envelope preview is accurate.
  if (dom.action?.value === "update" && dom.tripKey?.value === tripKey) {
    const unsavedNotes1 = $("envelopeNote1")?.value || "";
    const unsavedNotes2 = $("envelopeNote2")?.value || "";
    const unsavedNotes3 = $("envelopeNote3")?.value || "";
    const combinedNotes = [unsavedNotes1, unsavedNotes2, unsavedNotes3].filter(Boolean).join("\n");

    trip = {
      ...trip,
      destination: $("destination")?.value || trip.destination,
      departureDate: $("tripDate")?.value || trip.departureDate,
      spotTime: $("spotTime")?.value || trip.spotTime,
      departureTime: $("departureTime")?.value || trip.departureTime,
      arrivalDate: $("arrivalDate")?.value || trip.arrivalDate,
      contactName: $("contactName")?.value || trip.contactName,
      phone: $("phone")?.value || trip.phone,
      envelopePickup: $("envelopePickup") ? $("envelopePickup").value : (trip.envelopePickup || ""),
      envelopeTripContact: $("envelopeTripContact") ? $("envelopeTripContact").value : (trip.envelopeTripContact || ""),
      envelopeTripPhone: $("envelopeTripPhone") ? $("envelopeTripPhone").value : (trip.envelopeTripPhone || ""),
      envelopeTripNotes: combinedNotes !== undefined ? combinedNotes : (trip.envelopeTripNotes || ""),
    };
  }

  state.lastFocusedElement = document.activeElement;
  stateEnvelope.tripKey = tripKey;
  stateEnvelope.trip = trip;
  stateEnvelope.bg = "yellow";

  const pagesContainer = dom.envelopeModalPages;
  if (!pagesContainer) return;
  pagesContainer.innerHTML = "";

  // Build envelope assignments. For trips with a co-driver, we create
  // two variants so each driver gets a version where they are BUS DRIVER.
  const rawAssignments = state.assignmentsByTripKey?.[tripKey] || [];
  const assignments = [];

  if (rawAssignments.length) {
    rawAssignments.forEach((a) => {
      const busId = a.busId || trip.busId || "";
      const d1 = (a.driver1 || "").toString().trim();
      const d2Raw = (a.driver2 || "").toString().trim();
      const hasD2 = d2Raw && d2Raw.toLowerCase() !== "none" && d2Raw !== "—";
      const d2 = hasD2 ? d2Raw : "";

      // Variant 1: as-is (driver1 primary)
      assignments.push({ busId, driver1: d1, driver2: d2 });

      // Variant 2: swapped (co-driver primary), only if real co-driver exists
      if (hasD2) {
        assignments.push({ busId, driver1: d2, driver2: d1 });
      }
    });
  } else {
    assignments.push({ busId: trip.busId || "", driver1: "", driver2: "" });
  }

  // Store the envelope assignments so print/save logic uses the same variants
  stateEnvelope.assignments = assignments;

  const select = dom.envelopeAssignmentSelect;
  if (select) {
    select.innerHTML = "";
    assignments.forEach((a, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      const bus = a.busId || "—";
      const d1 = a.driver1 || "—";
      const d2 = a.driver2 ? ` / ${a.driver2}` : "";
      opt.textContent = `Bus ${bus} — ${d1}${d2}`;
      select.appendChild(opt);
    });
    select.selectedIndex = 0;
    // Notify glass wrapper so trigger text & menu stay in sync
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  assignments.forEach((assignment, idx) => {
    const pageEl = createEnvelopePageElement();
    pageEl.classList.add(stateEnvelope.bg === "white" ? "env-white" : "env-yellow");
    fillEnvelopePage(pageEl, trip, assignment);
    if (assignments.length > 1) pageEl.style.display = idx === 0 ? "block" : "none";
    pageEl.dataset.index = String(idx);
    pagesContainer.appendChild(pageEl);
  });

  if (dom.envelopeYellowBtn)
    dom.envelopeYellowBtn.classList.toggle("active", stateEnvelope.bg === "yellow");
  if (dom.envelopeWhiteBtn)
    dom.envelopeWhiteBtn.classList.toggle("active", stateEnvelope.bg === "white");

  dom.envelopeModal.hidden = false;
}

function updateEnvelopeModalSelection(index) {
  const pages = dom.envelopeModalPages?.querySelectorAll(".envelope-page");
  if (!pages || !pages.length) return;
  pages.forEach((p, i) => {
    p.style.display = String(i) === String(index) ? "block" : "none";
  });
}

function printEnvelopePages() {
  const trip = stateEnvelope.trip;
  const assignments = stateEnvelope.assignments.length
    ? stateEnvelope.assignments
    : [{ busId: trip?.busId || "", driver1: "", driver2: "" }];
  if (!trip || !assignments.length) return;

  const edits = getEnvelopeEditsFromVisiblePage();
  const tripForPrint = edits
    ? {
      ...trip,
      envelopePickup: edits.pickup,
      envelopeTripContact: edits.contact,
      envelopeTripPhone: edits.phone,
      envelopeTripNotes: edits.notes,
    }
    : trip;

  // Always print the white style, regardless of screen toggle
  const bgClass = "env-white";
  const pagesHtml = assignments
    .map((assignment) => {
      const page = createEnvelopePageElement();
      page.classList.add(bgClass);
      fillEnvelopePage(page, tripForPrint, assignment);
      return page.outerHTML;
    })
    .join("");

  const cssLink =
    document.querySelector('link[href*="main.css"]')?.getAttribute("href") || "css/main.css";
  const cssHref = new URL(cssLink, window.location.href).href;
  const printDoc = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Trip envelope</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="${cssHref}">
<style>
  /* Base page setup for envelopes */
  @page {
    size: 6in 9in;
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  /* Hide modal chrome from the main app; only show the envelope page(s) */
  .modal--envelope .modal__card--envelope,
  .envelope-modal__toolbar,
  .modal__head,
  .modal__foot,
  .modal__backdrop {
    display: none !important;
  }

  .envelope-modal__body {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 0;
  }

  .envelope-page {
    box-shadow: none !important;
    margin: 0 auto;
    page-break-after: always;
    break-after: page;
  }

  .envelope-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  @media print {
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
    }

    .envelope-modal__body {
      justify-content: center !important;
      align-items: flex-start !important;
    }

    .envelope-page {
      page-break-after: always;
    }

    .envelope-page:last-child {
      page-break-after: auto;
    }
  }
</style>
</head><body class="modal--envelope"><div class="envelope-modal__body">${pagesHtml}</div></body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    toast("Popup blocked. Allow popups to print envelopes.", "danger", 3000);
    return;
  }
  win.document.write(printDoc);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
    win.onafterprint = () => win.close();
  };
}

function closeEnvelopeModal() {
  dom.envelopeModal.hidden = true;
  stateEnvelope.tripKey = null;
  stateEnvelope.trip = null;
  stateEnvelope.assignments = [];
  if (state.lastFocusedElement) {
    state.lastFocusedElement.focus();
    state.lastFocusedElement = null;
  }
}

/** Removed editable envelope functions */

/** Set main trip form from state (for saving envelope edits via existing submit flow) */
function setTripFormFromState(tripKey) {
  const t = state.tripByKey?.[tripKey];
  const assigns = state.assignmentsByTripKey?.[tripKey] || [];
  if (!t) return false;

  $("destination").value = t.destination || "";
  $("customer").value = t.customer || "";
  $("contactName").value = t.contactName || "";
  $("phone").value = t.phone || "";

  $("tripDate").value = String(t.departureDate || "").slice(0, 10);
  $("arrivalDate").value = String(t.arrivalDate || "").slice(0, 10);
  $("departureTime").value = normalizeTime(t.departureTime) || "";
  $("spotTime").value = normalizeTime(t.spotTime) || "";
  $("arrivalTime").value = normalizeTime(t.arrivalTime) || "";

  $("itineraryStatus").value = t.itineraryStatus || "";
  $("contactStatus").value = t.contactStatus || "";
  $("paymentStatus").value = t.paymentStatus || "";
  $("driverStatus").value = t.driverStatus || "";
  $("invoiceStatus").value = t.invoiceStatus || "";
  $("invoiceNumber").value = t.invoiceNumber || "";
  $("tripColor").value = t.tripColor || "";
  setRequirementTogglesFromTrip(t);

  // Envelope-specific fields (when editing in the main Trip Editor)
  if ($("envelopePickup")) $("envelopePickup").value = t.envelopePickup || "";
  if ($("envelopeTripContact")) $("envelopeTripContact").value = t.envelopeTripContact || "";
  if ($("envelopeTripPhone")) $("envelopeTripPhone").value = t.envelopeTripPhone || "";

  const notesStr = t.envelopeTripNotes || "";
  const notesLines = notesStr.split("\n");
  if ($("envelopeNote1")) $("envelopeNote1").value = notesLines[0] || "";
  if ($("envelopeNote2")) $("envelopeNote2").value = notesLines[1] || "";
  if ($("envelopeNote3")) $("envelopeNote3").value = notesLines[2] || "";
  if ($("envelopeTripNotes")) $("envelopeTripNotes").value = notesStr;

  [
    "itineraryStatus",
    "contactStatus",
    "paymentStatus",
    "driverStatus",
    "invoiceStatus",
    "tripColor",
  ].forEach((id) => {
    const el = $(id);
    if (el) el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  if (typeof updateInvoiceNumberVisibility === "function") updateInvoiceNumberVisibility();

  dom.itineraryField.value = t.itinerary || "";
  $("notes").value = t.notes || "";
  $("comments").value = t.comments || "";

  setBusesNeededAndSync(t.busesNeeded ? String(t.busesNeeded) : "");
  dom.busesNeeded?.dispatchEvent(new Event("change", { bubbles: true }));
  setModeEdit(String(t.tripKey || tripKey), String(t.tripId || ""));

  state.busRows.forEach((r) => {
    r.busSel.value = "None";
    r.d1Sel.value = "None";
    r.d2Sel.value = "None";
  });
  assigns.forEach((a, i) => {
    const row = state.busRows[i];
    if (!row) return;
    if (a.busId) row.busSel.value = String(a.busId);
    if (a.driver1) row.d1Sel.value = String(a.driver1);
    if (a.driver2) row.d2Sel.value = String(a.driver2);
  });
  updateBusRowVisibility();
  state.busRows.forEach((r) => {
    r.busSel.dispatchEvent(new Event("change", { bubbles: true }));
    r.d1Sel.dispatchEvent(new Event("change", { bubbles: true }));
    r.d2Sel.dispatchEvent(new Event("change", { bubbles: true }));
  });
  syncBusPanelState();
  if (typeof syncBusSelectEmptyState === "function") syncBusSelectEmptyState();
  if (typeof refreshEmptyStateUI === "function") refreshEmptyStateUI();
  if (typeof syncEmptyFields === "function") syncEmptyFields();

  dom.action.value = "update";
  dom.tripKey.value = tripKey;
  return true;
}

// Removed saveEnvelopeEdits

// ======================================================
// 29) TRIP OPEN (DESKTOP EDIT)
// ======================================================
async function openTripForEdit(tripKey) {
  if (isMobileOnly()) return openTripDetailsModal(tripKey);

  // Loading Overlay Logic (single overlay; message set for trip-edit context)
  const overlay = document.getElementById("loadingOverlay");
  const bar = overlay?.querySelector(".loading-overlay__bar-inner");
  const overlayText = document.getElementById("loadingOverlayText");
  const overlaySub = document.getElementById("loadingOverlaySub");
  if (overlay) overlay.hidden = false;
  if (bar) bar.style.width = "0%";
  if (overlayText) overlayText.textContent = "Loading Trip…";
  if (overlaySub) overlaySub.textContent = "Please wait";

  dom.saveBtn.disabled = true;

  // Ensure the left panel is open and showing the trip card
  setSidePanelMode("trip");

  // CLEAR PREVIOUS DATA
  if (dom.tripForm) dom.tripForm.reset();
  state.busRows.forEach((r) => {
    r.busSel.value = "None";
    r.d1Sel.value = "None";
    r.d2Sel.value = "None";
  });
  // Reset badges/status
  $("tripIdBadge").textContent = "";
  $("tripIdBadge").classList.add("is-hidden");

  // Force bus rows to update (hide extra rows)
  updateBusRowVisibility();

  try {
    const startTime = Date.now();
    if (bar) bar.style.width = "15%";

    const [tripResp, assignResp] = await Promise.all([
      api.getTrip(tripKey),
      api.getBusAssignments(tripKey),
    ]);

    // Force a minimum delay so the user feels the "loading" state (prevents instant flash)
    const elapsed = Date.now() - startTime;
    if (elapsed < 600) {
      if (bar) bar.style.width = "40%";
      await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
    }

    if (bar) bar.style.width = "70%";
    if (!tripResp?.ok) throw new Error(tripResp?.error || "Trip not found");

    const t = tripResp.trip || {};

    $("destination").value = t.destination || "";
    $("customer").value = t.customer || "";
    $("contactName").value = t.contactName || "";
    $("phone").value = t.phone || "";

    $("tripDate").value = String(t.departureDate || "").slice(0, 10);
    $("arrivalDate").value = String(t.arrivalDate || "").slice(0, 10);
    $("departureTime").value = normalizeTime(t.departureTime) || "";
    $("spotTime").value = normalizeTime(t.spotTime) || "";
    $("arrivalTime").value = normalizeTime(t.arrivalTime) || "";

    $("itineraryStatus").value = t.itineraryStatus || "";
    $("contactStatus").value = t.contactStatus || "";
    $("paymentStatus").value = t.paymentStatus || "";
    $("driverStatus").value = t.driverStatus || "";
    $("invoiceStatus").value = t.invoiceStatus || "";
    $("invoiceNumber").value = t.invoiceNumber || "";
    $("tripColor").value = t.tripColor || "";
    setRequirementTogglesFromTrip(t);

    // Sync custom dropdown triggers (values were set above; dispatch change so triggers update)
    [
      "itineraryStatus",
      "contactStatus",
      "paymentStatus",
      "driverStatus",
      "invoiceStatus",
      "tripColor",
    ].forEach((id) => {
      const el = $(id);
      if (el) el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    updateInvoiceNumberVisibility();
    if (typeof syncEmptyFields === "function") syncEmptyFields();

    if (dom.openItineraryPdfBtn) {
      if (t.itineraryPdfUrl) {
        dom.openItineraryPdfBtn.disabled = false;
        if (dom.removeItineraryPdfBtn) dom.removeItineraryPdfBtn.disabled = false;
      } else {
        dom.openItineraryPdfBtn.disabled = true;
        if (dom.removeItineraryPdfBtn) dom.removeItineraryPdfBtn.disabled = true;
      }
    }

    dom.itineraryField.value = t.itinerary || "";
    $("notes").value = t.notes || "";
    $("comments").value = t.comments || "";

    // Envelope-specific fields (when opening trip in the main Trip Editor)
    if ($("envelopePickup")) $("envelopePickup").value = t.envelopePickup || "";
    if ($("envelopeTripContact")) $("envelopeTripContact").value = t.envelopeTripContact || "";
    if ($("envelopeTripPhone")) $("envelopeTripPhone").value = t.envelopeTripPhone || "";

    const notesStr = t.envelopeTripNotes || "";
    const notesLines = notesStr.split("\n");
    if ($("envelopeNote1")) $("envelopeNote1").value = notesLines[0] || "";
    if ($("envelopeNote2")) $("envelopeNote2").value = notesLines[1] || "";
    if ($("envelopeNote3")) $("envelopeNote3").value = notesLines[2] || "";
    if ($("envelopeTripNotes")) $("envelopeTripNotes").value = notesStr;

    setBusesNeededAndSync(t.busesNeeded ? String(t.busesNeeded) : "");
    dom.busesNeeded?.dispatchEvent(new Event("change", { bubbles: true }));
    setModeEdit(String(t.tripKey || tripKey), String(t.tripId || ""));

    state.busRows.forEach((r) => {
      r.busSel.value = "None";
      r.d1Sel.value = "None";
      r.d2Sel.value = "None";
    });

    const assigns = assignResp?.ok && assignResp.assignments ? assignResp.assignments : [];
    assigns.forEach((a) => {
      const n = Number(a.busNumber);
      if (!n || n < 1 || n > 10) return;
      const row = state.busRows[n - 1];
      if (!row) return;

      if (a.busId) row.busSel.value = String(a.busId);
      if (a.driver1) row.d1Sel.value = String(a.driver1);
      if (a.driver2) row.d2Sel.value = String(a.driver2);
    });

    updateBusRowVisibility();
    state.busRows.forEach((r) => {
      r.busSel.dispatchEvent(new Event("change", { bubbles: true }));
      r.d1Sel.dispatchEvent(new Event("change", { bubbles: true }));
      r.d2Sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
    syncBusPanelState();
    syncBusSelectEmptyState();
    refreshEmptyStateUI();

    if (bar) bar.style.width = "100%";

    // Slight delay to show 100% before hiding
    setTimeout(() => {
      if (overlay) overlay.hidden = true;
      if (overlayText) overlayText.textContent = "Loading…";
      if (overlaySub) overlaySub.textContent = "Please wait";
    }, 500);

    $("destination")?.focus?.({ preventScroll: true });
  } catch (e) {
    if (overlay) overlay.hidden = true;
    if (overlayText) overlayText.textContent = "Loading…";
    if (overlaySub) overlaySub.textContent = "Please wait";
    console.error(e);
    toast("Could not load trip", "danger", 2200);
    alert("Could not open trip for editing.");
  } finally {
    dom.saveBtn.disabled = false;
    // Freshly loaded trip data should be considered clean until edited.
    state.tripFormDirty = false;
  }
}

// ======================================================
// 30) SAVE/DELETE VERIFY (IFRAME + POLL)
// ======================================================
function startVerifyFallback() {
  if (state.verifyFallbackTimer) clearTimeout(state.verifyFallbackTimer);
  state.verifyFallbackTimer = setTimeout(() => state.pendingWrite && verifyWriteResult(), 4500);
}
function clearVerifyFallback() {
  if (state.verifyFallbackTimer) clearTimeout(state.verifyFallbackTimer);
  state.verifyFallbackTimer = null;
}

async function verifyWriteResult() {
  if (!state.pendingWrite?.tripKey) return;

  const { action, tripKey, originalTrips, originalTripByKey, originalAssignments } =
    state.pendingWrite;

  startProgressCreep({ from: 70, to: 95, label: "Verifying… " });

  // Optimized polling: faster start, exponential backoff
  const delays = [200, 400, 800, 1500, 3000, 6000];

  let exists = false;
  let serverTrip = null;

  try {
    // DELETE: Wait for trip to disappear
    if (action === "delete") {
      for (let i = 0; i < delays.length; i++) {
        const resp = await api.getTrip(tripKey);
        exists = !!(resp?.ok && resp.trip);
        if (!exists) break;
        await delay(delays[i]);
      }

      if (!exists) {
        toastProgress(100, "Deleted ✓");
        toastHide(300);

        // Final sync: clear in-memory week cache so next explicit load
        // will refetch, but avoid a full background refresh here to
        // keep rapid delete/edit flows smooth.
        state.weekCache.clear();
      } else {
        toast("Delete may have failed — restoring", "danger", 3000);
        rollbackState();
      }
    } else {
      // CREATE/UPDATE: Wait for trip to appear
      for (let i = 0; i < delays.length; i++) {
        const resp = await api.getTrip(tripKey);
        exists = !!(resp?.ok && resp.trip);
        serverTrip = exists ? resp.trip : null;
        if (exists) break;
        await delay(delays[i]);
      }

      if (exists) {
        toastProgress(100, "Saved ✓");
        toastHide(300);

        // Final sync: clear in-memory week cache so the next explicit
        // load gets fresh data, but skip an immediate full week
        // refresh to avoid extra loading during rapid edits.
        state.weekCache.clear();
      } else {
        // Verification never saw the trip on the server — treat as failure.
        // Roll back optimistic changes so UI matches the last known server state.
        rollbackState();
        toast(
          "Save could not be verified — changes were rolled back. Please try saving again.",
          "danger",
          3500,
        );
      }
    }
  } catch (e) {
    console.error(e);
    // On verification error, always restore previous state so UI does not
    // show trips that may not exist on the server.
    rollbackState();
    toast(
      "Connection error during verification — schedule restored to the previous state.",
      "danger",
      3000,
    );
  } finally {
    stopProgressCreep();
    clearVerifyFallback();
    state.pendingWrite = null;
    dom.saveBtn.disabled = false;
    dom.action.value = dom.tripKey.value ? "update" : "create";
  }

  function rollbackState() {
    if (originalTrips) {
      state.trips = originalTrips;
      state.tripByKey = originalTripByKey;
      state.assignmentsByTripKey = originalAssignments;
      scheduleAgendaReflow();
      updateDriverWeekIfVisible();
      clearCacheForCurrentView();
    }
  }
}

// ======================================================
// 31) TOP CONTROLS MOVE (DESKTOP)
// ======================================================

// ======================================================
// 32) PRINT
// ======================================================

/**
 * Build Legal-landscape print layout by cloning the live schedule-grid.
 * Layout: 2 pages, 5 bus rows each, 2 empty note rows below each bus.
 * Trip bars are in the clone; repositionBarsForPrint sets pixel-based left/width.
 */
function buildPrintScheduleTwoPages() {
  const printRoot = document.getElementById("printRoot");
  if (!printRoot) return;

  const weekTable = document.querySelector(".schedule-grid");
  if (!weekTable) return;

  const weekTitle = document.getElementById("headerWeek")?.textContent || "Schedule";

  /** Reposition trip bars using fixed column metrics for print alignment */
  function repositionBarsForPrint(table, col) {
    if (!col) return;
    const body = table.querySelector("tbody:not([hidden])");
    if (!body) return;
    const total = Math.round(col.total);
    body.querySelectorAll(".schedule-grid__row-bars").forEach((bars) => {
      bars.style.width = `${total}px`;
      bars.querySelectorAll(".schedule-grid__trip-bar").forEach((bar) => {
        const sidx = Number(bar.dataset.sidx);
        const eidx = Number(bar.dataset.eidx);
        if (!Number.isFinite(sidx) || !Number.isFinite(eidx)) return;
        positionBarWithinOverlay(bar, bars, col, sidx, eidx, { insetL: 0, insetR: 0 });
        const left = bar.style.left;
        const w = bar.style.width;
        if (left) bar.style.left = `${Math.round(parseFloat(left))}px`;
        if (w) bar.style.width = `${Math.round(parseFloat(w))}px`;
      });
    });
  }

  /** Fit to page: Legal landscape — scale to fit both width and height */
  function computePrintScale() {
    const card = printRoot.querySelector(".print-card");
    if (!card) return 1;
    const contentW = card.scrollWidth || card.offsetWidth;
    const contentH = card.scrollHeight || card.offsetHeight;
    const legalPrintableW = 1296;
    const legalPrintableH = 720;
    const scaleW = contentW > 0 ? legalPrintableW / contentW : 1;
    const scaleH = contentH > 0 ? legalPrintableH / contentH : 1;
    const scale = Math.min(1, scaleW, scaleH) * 0.97;
    return Math.max(0.6, Math.min(1, scale));
  }

  function makeTableForRows(startIdx, endIdx) {
    const clone = weekTable.cloneNode(true);
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

    const body = clone.querySelector("tbody:not([hidden])");
    if (!body) return null;

    clone.querySelectorAll("tbody[hidden]").forEach((el) => el.remove());

    const rows = Array.from(body.querySelectorAll("tr"));
    rows.forEach((tr, idx) => {
      if (idx < startIdx || idx >= endIdx) {
        tr.remove();
      } else {
        for (let j = 0; j < 2; j++) {
          const notesRow = document.createElement("tr");
          notesRow.className = "schedule-grid__row--notes";
          const tdEmpty = document.createElement("td");
          tdEmpty.className = "schedule-grid__cell schedule-grid__bus-cell";
          notesRow.appendChild(tdEmpty);
          for (let i = 0; i < 7; i++) {
            const td = document.createElement("td");
            td.className = "schedule-grid__cell schedule-grid__day-cell";
            notesRow.appendChild(td);
          }
          tr.parentNode.insertBefore(notesRow, tr.nextSibling);
        }
      }
    });

    const page = document.createElement("div");
    page.className = "print-page";
    const card = document.createElement("div");
    card.className = "print-card";

    const agendaHeader = document.querySelector(".agenda-header");
    const headerClone = agendaHeader ? agendaHeader.cloneNode(true) : null;
    if (headerClone) {
      headerClone.classList.add("print-header");
      headerClone
        .querySelectorAll(
          ".agenda-header__nav-right, .agenda-header__date-left .btn--icon, .weekpicker-trigger-wrap",
        )
        .forEach((el) => el.remove());
      const topbarLogo = document.querySelector(".app-header__logo-wrap");
      const headerInner = headerClone.querySelector(".agenda-header__inner");
      if (topbarLogo && headerInner) {
        const logoClone = topbarLogo.cloneNode(true);
        logoClone.classList.add("print-header-logo");
        headerInner.insertBefore(logoClone, headerInner.firstChild);
      }
      card.appendChild(headerClone);
    } else {
      const title = document.createElement("div");
      title.className = "print-title";
      title.textContent = weekTitle;
      card.appendChild(title);
    }
    clone.classList.add("print-table");
    card.appendChild(clone);
    page.appendChild(card);
    return page;
  }

  printRoot.innerHTML = "";
  printRoot.appendChild(makeTableForRows(0, 5));
  printRoot.appendChild(makeTableForRows(5, 10));

  const printCardWidth = 1320;
  const busColWidth = 34;
  const effectivePrintW = 1296;
  const borderAllowance = 22;
  const dayColTotal = effectivePrintW - busColWidth - borderAllowance;
  const dayColWidth = dayColTotal / 7;
  const colMetrics = {
    starts: Array.from({ length: 7 }, (_, i) => i * dayColWidth),
    widths: Array(7).fill(dayColWidth),
    total: dayColWidth * 7,
  };

  printRoot.classList.remove("is-hidden");
  printRoot.style.cssText = `position:absolute;left:-9999px;visibility:hidden;width:${printCardWidth}px;`;
  void printRoot.offsetHeight;
  printRoot.querySelectorAll(".print-table").forEach((t) => repositionBarsForPrint(t, colMetrics));
  printRoot.style.setProperty("--print-scale", String(computePrintScale()));
  printRoot.classList.add("is-hidden");
  printRoot.style.cssText = "";
}

/**
 * Build Letter-landscape print layout (Full 10-row schedule on 1 page).
 */
function buildPrintScheduleFullLetter() {
  const printRoot = document.getElementById("printRoot");
  if (!printRoot) return;

  const weekTitle = document.getElementById("headerWeek")?.textContent || "Schedule";
  const dates = getWeekDates();
  const dayIds = getDayIds();

  // Create the fresh static tabular HTML based on State
  let html = `
    <div class="print-page print-page-letter">
      <div class="print-header">
        <h2 class="print-title">${escHtml(weekTitle)}</h2>
      </div>
      <table class="print-data-table">
        <thead>
          <tr>
            <th class="schedule-grid__col-bus">Bus</th>
            ${dates
      .map((d, i) => {
        const dObj = parseYMD(d);
        const dayStr = dObj
          ? dObj.toLocaleDateString("en-US", { weekday: "short" })
          : dayIds[i];
        const dateStr = dObj ? `${dObj.getMonth() + 1}/${dObj.getDate()}` : d;
        return `<th class="schedule-grid__col-day">${escHtml(dayStr)} ${escHtml(dateStr)}</th>`;
      })
      .join("")}
          </tr>
        </thead>
        <tbody>
  `;

  const buses = state.busesList || [];
  for (const bus of buses) {
    const busId = String(bus.busId || bus.id || "").trim();
    if (!busId || busId === "None" || busId === "WAITING_LIST") continue;

    const busTrips = state.trips.filter((t) => {
      const a = state.assignmentsByTripKey[t.tripKey] || {};
      return String(a.busId).trim() === busId;
    });

    html += `<tr>`;
    html += `<td class="schedule-grid__bus-cell"><strong>${escHtml(busId)}</strong></td>`;

    let skipDays = 0;
    for (let i = 0; i < 7; i++) {
      if (skipDays > 0) {
        skipDays--;
        continue;
      }

      const currentYMD = dates[i];
      const tripsToday = busTrips.filter((t) => {
        const start = ymd(parseYMD(t.departureDate));
        const end = ymd(parseYMD(t.arrivalDate) || parseYMD(t.departureDate));
        return currentYMD >= start && currentYMD <= end;
      });

      if (tripsToday.length === 0) {
        html += `<td></td>`;
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

        html += `<td colspan="${colspan}" class="trip-cell">
          <div class="trip-content">
            <div class="trip-dest-cust"><strong>${escHtml(t.destination)}</strong> - ${escHtml(t.customer)}</div>
            <div class="trip-times">⏱ ${normalizeTime(t.departureTime)} - ${normalizeTime(t.arrivalTime)}</div>
            <div class="trip-drivers">👤 D1: ${escHtml(a.driver1 || "—")} | D2: ${escHtml(a.driver2 || "—")}</div>
            <div class="trip-notes">📝 ${escHtml(t.notes || "")}</div>
          </div>
        </td>`;

        skipDays = colspan - 1;
      }
    }
    html += `</tr>`;
  }

  html += `</tbody></table></div>`;

  printRoot.innerHTML = html;
  printRoot.classList.add("print-mode-letter-full");
}

function clearPrintRoot() {
  const printRoot = document.getElementById("printRoot");
  if (printRoot) {
    printRoot.innerHTML = "";
    printRoot.classList.remove("print-mode-letter-full");
  }
}

function setPrintPageSize(size) {
  let el = document.getElementById("dynamicPrintPageSize");
  if (!el) {
    el = document.createElement("style");
    el.id = "dynamicPrintPageSize";
    document.head.appendChild(el);
  }
  const css =
    size === "letter"
      ? `@media print { @page { size: letter landscape; margin: 0.5in; } }`
      : `@media print { @page { size: legal landscape; margin: 0.25in; } }`;
  el.textContent = css;
}

window.addEventListener("afterprint", clearPrintRoot);

// ======================================================
// 33) DATA LOADING (DRIVERS/BUSES)
// ======================================================
async function loadDriversAndBuses(forceRefresh = false) {
  // Try cache first (only for drivers, buses always fetch fresh)
  if (!forceRefresh) {
    const cDrivers = CACHE.get("cache_drivers");

    if (cDrivers) {
      state.driversList = cDrivers;
      // Don't return early - still need to fetch buses
    }
  }

  // Always fetch buses fresh (no caching) to ensure hasLift data is current
  const [driversResp, busesResp] = await Promise.all([
    forceRefresh || !state.driversList.length
      ? api.listDrivers(true)
      : Promise.resolve({ ok: true, drivers: state.driversList }),
    api.listBuses(true),
  ]);

  state.driversList = driversResp?.ok && driversResp.drivers ? driversResp.drivers : [];
  state.busesList = busesResp?.ok && busesResp.buses ? busesResp.buses : [];

  // Save drivers to cache (but not buses)
  if (state.driversList.length)
    CACHE.set("cache_drivers", state.driversList, CONFIG.CACHE_TTL_DRIVERS);

  state.busesList = state.busesList
    .map((b) => ({
      ...b,
      busId: String(b.busId || "").trim(),
      busName: b.busName && String(b.busName).trim() ? String(b.busName).trim() : `Bus ${b.busId}`,
    }))
    .filter((b) => b.busId);

  state.driversList = state.driversList
    .map((d) => ({
      ...d,
      driverId: String(d.driverId || "").trim(),
      driverName:
        d.driverName && String(d.driverName).trim()
          ? String(d.driverName).trim()
          : String(d.driverId || "").trim(),
    }))
    .filter((d) => d.driverName);

  refreshBusSelectOptions();

  buildAgendaRows();
  setHeaderOrder();
  scheduleAgendaReflow();
}

// ======================================================
// 34) DELEGATED BAR EVENTS
// ======================================================
// ======================================================
// 34) DELEGATED BAR EVENTS (CONTEXT MENU)
// ======================================================
let activeContextTripKey = null;
let activeCellContext = null;

function closeTripContextMenu() {
  if (dom.ctxMenu) dom.ctxMenu.hidden = true;
  activeContextTripKey = null;
}

function closeCellContextMenu() {
  if (dom.cellCtxMenu) dom.cellCtxMenu.hidden = true;
  activeCellContext = null;
}

// Auto-close menus on mouse leave
dom.ctxMenu?.addEventListener("mouseleave", closeTripContextMenu);
dom.cellCtxMenu?.addEventListener("mouseleave", closeCellContextMenu);

function showTripContextMenu(x, y, tripKey) {
  if (!dom.ctxMenu) return;

  activeContextTripKey = tripKey;

  // Update Header (optional, could fetch trip details to show dest)
  // For now just generic "Trip Actions" or maybe the destination from the DOM?
  // Let's keep it simple for now.

  dom.ctxMenu.style.left = `${x}px`;
  dom.ctxMenu.style.top = `${y}px`;
  dom.ctxMenu.hidden = false;

  // Adjust if off-screen (using clientX to avoid scroll math complexity)
  const rect = dom.ctxMenu.getBoundingClientRect();
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;

  // Calculate viewport-relative X
  const clientX = x - scrollX;

  // If click is in the right 250px of the screen, force alignment to LEFT of cursor
  // This avoids waiting for rect.width to be valid (which might be 0 during animation)
  if (clientX > winW - 250) {
    // Force menu to be ~200px wide properties to left
    // x is pageX.
    dom.ctxMenu.style.left = `${Math.max(scrollX, x - 210)}px`;
  }

  // Check overflow bottom
  if (rect.bottom > winH) {
    dom.ctxMenu.style.top = `${y - rect.height}px`;
  }
}

function showCellContextMenu(x, y, busId, dateStr) {
  // console.log("showCellContextMenu called", { x, y, busId, dateStr, menu: dom.cellCtxMenu });
  if (!dom.cellCtxMenu) {
    console.error("cellCtxMenu DOM element not found!");
    return;
  }

  activeCellContext = { busId, dateStr };

  dom.cellCtxMenu.style.left = `${x}px`;
  dom.cellCtxMenu.style.top = `${y}px`;
  dom.cellCtxMenu.hidden = false;
  // dom.cellCtxMenu.style.display = "block"; // Removed, relies on hidden attribute
  // dom.cellCtxMenu.style.zIndex = "99999"; // Removed
  // ... rest of function default ...

  // Adjust if off-screen
  const rect = dom.cellCtxMenu.getBoundingClientRect();
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;

  // X adjustment
  const clientX = x - scrollX;
  if (clientX > winW - 200) {
    dom.cellCtxMenu.style.left = `${Math.max(scrollX, x - 180)}px`;
  }

  // Y adjustment
  if (rect.bottom > winH) {
    dom.cellCtxMenu.style.top = `${Math.max(scrollY, y - rect.height)}px`;
  }
}

function handleScheduleInteraction(e, isContext) {
  // 1. Check for Trip Bar
  const tripBar = e.target.closest(".schedule-grid__trip-bar");

  if (tripBar) {
    if (isContext) e.preventDefault(); // Stop browser menu
    e.stopPropagation();

    const tripKey = tripBar.dataset.tripkey;
    if (!tripKey) return;

    // Handle "Driver Status" icon click
    const driverContactIcon = e.target.closest('[data-action="showDriverContact"]');
    if (driverContactIcon && !isContext) {
      openDriverContactModal(tripKey);
      return;
    }

    showTripContextMenu(e.pageX, e.pageY, tripKey);
    return;
  }

  // 2. Check for Day Cell (Context Menu)
  const cell = e.target.closest("td.schedule-grid__day-cell");
  if (cell) {
    if (isContext) e.preventDefault(); // Stop browser menu
    e.stopPropagation(); // Prevent immediate close via document listener

    // Get the bus ID from the row
    const tr = cell.closest("tr");
    if (!tr) return;

    let busId = "";
    const busCell = tr.querySelector(".schedule-grid__bus-num");
    if (busCell) {
      busId = busCell.textContent.trim();
    } else if (tr.classList.contains("waiting-list-row")) {
      busId = "Waiting List";
    }

    // Get the date
    const colIdx = cell.cellIndex;
    if (colIdx < 1) return;
    const dayIndex = colIdx - 1;
    const weekDates = getWeekDates();
    if (dayIndex < 0 || dayIndex >= weekDates.length) return;
    const dateStr = weekDates[dayIndex];

    if (busId && dateStr) {
      showCellContextMenu(e.pageX, e.pageY, busId, dateStr);
    } else {
      console.warn("Missing busId or dateStr", { busId, dateStr });
    }
  }
}

function wireDelegatedBarEvents() {
  const containers = document.querySelectorAll(".schedule-grid-container");
  if (!containers.length) return;

  // Close context menu on any click outside
  document.addEventListener("click", (e) => {
    if (dom.ctxMenu && !dom.ctxMenu.hidden && !dom.ctxMenu.contains(e.target)) {
      closeTripContextMenu();
    }
    if (dom.cellCtxMenu && !dom.cellCtxMenu.hidden && !dom.cellCtxMenu.contains(e.target)) {
      closeCellContextMenu();
    }
  });

  // Wire Context Actions
  dom.ctxEditBtn?.addEventListener("click", () => {
    if (activeContextTripKey) {
      openTripForEdit(activeContextTripKey);
      closeTripContextMenu();
    }
  });

  dom.ctxViewBtn?.addEventListener("click", () => {
    if (activeContextTripKey) {
      openTripDetailsModal(activeContextTripKey);
      closeTripContextMenu();
    }
  });

  dom.ctxEnvelopeBtn?.addEventListener("click", () => {
    if (activeContextTripKey) {
      openEnvelopeModal(activeContextTripKey);
      closeTripContextMenu();
    }
  });

  dom.ctxOpenItineraryPdfBtn?.addEventListener("click", () => {
    if (!activeContextTripKey) return;
    const trip = state.tripByKey?.[activeContextTripKey];
    if (!trip || !trip.itineraryPdfUrl) {
      toast("No itinerary PDF attached for this trip.", "info", 2000);
      return;
    }
    window.open(trip.itineraryPdfUrl, "_blank");
    closeTripContextMenu();
  });

  dom.ctxAttachItineraryPdfBtn?.addEventListener("click", () => {
    if (!activeContextTripKey) return;
    if (!dom.itineraryPdfInput) {
      toast("Upload control not available.", "danger", 2000);
      return;
    }
    state.pendingItineraryTripKey = activeContextTripKey;
    dom.itineraryPdfInput.value = "";
    dom.itineraryPdfInput.click();
  });

  dom.itineraryPdfInput?.addEventListener("change", async (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    const tripKey = state.pendingItineraryTripKey;

    if (!file || !tripKey) {
      state.pendingItineraryTripKey = null;
      return;
    }

    if (file.type !== "application/pdf") {
      toast("Please select a PDF file.", "danger", 2500);
      state.pendingItineraryTripKey = null;
      input.value = "";
      return;
    }

    try {
      // Build URL with action + tripKey in query string
      const url = new URL(CONFIG.ENDPOINT);
      url.searchParams.set("action", "uploadItineraryPdf");
      url.searchParams.set("tripKey", tripKey);

      toast("Uploading itinerary…", "info", 1500);

      // Read file as Base64 Data URL
      const reader = new FileReader();
      const base64Url = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      // Prepare JSON payload
      const payload = {
        filename: file.name,
        mimeType: file.type,
        base64Data: base64Url,
      };

      const resp = await fetch(url.toString(), {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          // Sending as text/plain prevents the browser from sending a CORS preflight OPTIONS request
          "Content-Type": "text/plain;charset=utf-8",
        },
        mode: "cors",
        credentials: "omit",
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const json = await resp.json();
      if (!json.ok) {
        throw new Error(json.error || "Upload failed");
      }

      const pdfUrl = json.itineraryPdfUrl || json.url;
      if (!pdfUrl) {
        throw new Error("No URL returned from server");
      }

      const trip = state.tripByKey?.[tripKey];
      if (trip) {
        trip.itineraryPdfUrl = pdfUrl;
        scheduleAgendaReflow();
      }

      toast("Itinerary PDF uploaded.", "success", 1800);
    } catch (err) {
      console.error(err);
      toast(`Could not upload itinerary PDF: ${err.message || err}`, "danger", 3500);
    } finally {
      state.pendingItineraryTripKey = null;
      input.value = "";
      closeTripContextMenu();
    }
  });

  // NEW TRIP BUTTON (Cell Context Menu)
  dom.ctxNewTripBtn?.addEventListener("click", () => {
    if (activeCellContext) {
      const { busId, dateStr } = activeCellContext;
      closeCellContextMenu();

      // Switch to Trip Editor
      // dom.newBtn.click() calls setModeNew() which calls setSidePanelMode("trip")
      // But we call it explicit just in case
      setSidePanelMode("trip");

      // Trigger "New Trip" logic (resets form)
      dom.newBtn.click();

      // Force 1 bus needed -> triggers row visibility
      if (dom.busesNeeded) {
        dom.busesNeeded.value = "1";
        dom.busesNeeded.dispatchEvent(new Event("input"));
        dom.busesNeeded.dispatchEvent(new Event("change"));
      }

      // Allow a microtab for DOM to update bus rows? Usually synchronous if no animation delay blocks it.
      // But let's try setting it immediately.

      // Target the dynamic "bus1" select
      const bus1Input = document.querySelector('select[name="bus1"]');
      if (bus1Input) {
        bus1Input.value = busId;
        bus1Input.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        console.warn("Could not find select[name='bus1']");
      }

      // Trip Date
      const tripDateInput = document.getElementById("tripDate");
      if (tripDateInput) {
        tripDateInput.value = dateStr;
        tripDateInput.dispatchEvent(new Event("change")); // To auto-fill arrival
      }

      // Ensure status fields default to Pending (bus1 and tripDate are set above)
      maybeApplyPendingDefaults();
    }
  });

  containers.forEach((container) => {
    // 1. Context Menu (Right Click) - Desktop & Mobile Long Press
    container.addEventListener("contextmenu", (e) => handleScheduleInteraction(e, true));

    // 2. Click (Tap) - Mobile Only and specific icon clicks
    container.addEventListener("click", (e) => {
      // Always allow driver contact icon clicks (desktop and mobile)
      const driverContactIcon = e.target.closest('[data-action="showDriverContact"]');
      if (driverContactIcon) {
        e.stopPropagation();
        const tripBar = driverContactIcon.closest(".schedule-grid__trip-bar");
        if (tripBar && tripBar.dataset.tripkey) {
          openDriverContactModal(tripBar.dataset.tripkey);
        }
        return;
      }

      // Only handle Taps on touch devices for the general context menu
      if (isMobileOnly()) {
        handleScheduleInteraction(e, false);
      }
    });

    // Keep Enter/Space for accessibility (default to Edit for now, or open menu?)
    // Let's act like left click -> Open Menu
    container.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const bar = e.target.closest(".schedule-grid__trip-bar");
      if (!bar) return;

      e.preventDefault();
      const tripKey = bar.dataset.tripkey;
      if (!tripKey) return;

      // Calculate center of bar for position
      const rect = bar.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2 + window.scrollY;

      showTripContextMenu(x, y, tripKey);
    });
  });
}

// ======================================================
// 35) PREFS
// ======================================================
function loadPrefs() {
  try {
    state.weekStartsOnMonday = localStorage.getItem("weekStartMonday") === "1";
  } catch {
    state.weekStartsOnMonday = false;
  }
}

// ======================================================
// 35.5) GLASS SELECT DROPDOWNS (trip editor status fields + bus grid)
// ======================================================
function wrapSelectInGlassDropdown(sel, opts) {
  const { statusId, rebuildMenuOnOpen, cellClass } = opts || {};
  const statusIds = new Set([
    "itineraryStatus",
    "contactStatus",
    "paymentStatus",
    "driverStatus",
    "invoiceStatus",
  ]);

  const wrapper = document.createElement("div");
  wrapper.className = "dropdown select-dropdown" + (cellClass ? " " + cellClass : "");
  wrapper.dataset.selectName = sel.name || "";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const menu = document.createElement("div");
  menu.className = "dropdown__menu";
  menu.setAttribute("role", "listbox");
  menu.hidden = true;

  function getSelectedText() {
    const opt = sel.options[sel.selectedIndex];
    return opt ? opt.textContent.trim() : "";
  }

  function getSelectedIcon() {
    const opt = sel.options[sel.selectedIndex];
    if (opt && statusId && statusIds.has(statusId)) {
      return getStatusIcon(statusId, opt.value);
    }
    return "";
  }

  function updateTrigger() {
    trigger.innerHTML = "";

    // Add icon if applicable
    const iconName = getSelectedIcon();
    if (iconName) {
      const iconSpan = document.createElement("span");
      iconSpan.className = "material-symbols-outlined dropdown-icon is-active";
      iconSpan.style.marginRight = "8px";
      iconSpan.style.fontSize = "18px";
      iconSpan.textContent = iconName;
      trigger.appendChild(iconSpan);
    }

    // Add text container to flex grow properly
    const textSpan = document.createElement("span");
    textSpan.style.flex = "1";
    textSpan.style.textAlign = "left";
    textSpan.textContent = getSelectedText();
    trigger.appendChild(textSpan);

    if (statusId && statusIds.has(statusId)) updateStatusSelect(sel);
    // Toggle placeholder styling for default/empty values
    const v = (sel.value ?? "").trim();
    trigger.classList.toggle("is-empty", !v || v === "None");
  }

  function populateMenu() {
    menu.innerHTML = "";
    Array.from(sel.options).forEach((opt) => {
      if (opt.disabled && !String(opt.value).trim()) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dropdown__item";
      btn.setAttribute("role", "option");
      btn.dataset.value = opt.value;

      const v = String(opt.value).trim();
      // Add icon if applicable to the dropdown options
      if (statusId && statusIds.has(statusId) && v) {
        const itemIconName = getStatusIcon(statusId, v);
        if (itemIconName) {
          const iconSpan = document.createElement("span");
          iconSpan.className = "material-symbols-outlined dropdown-icon";
          iconSpan.textContent = itemIconName;
          btn.appendChild(iconSpan);
        }
      }

      const textNode = document.createTextNode(opt.textContent.trim());
      btn.appendChild(textNode);

      btn.addEventListener("click", () => {
        sel.value = opt.value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        updateTrigger();
        closeMenu();
      });
      menu.appendChild(btn);
    });
  }

  function closeMenu() {
    menu.hidden = true;
    menu.classList.remove("dropdown__menu--up");
    trigger.setAttribute("aria-expanded", "false");
    trigger.classList.remove("is-open");
    document.removeEventListener("click", outsideClick);
    document.removeEventListener("keydown", handleEscape);
  }

  function handleEscape(e) {
    if (e.key === "Escape") closeMenu();
  }

  function outsideClick(e) {
    if (!wrapper.contains(e.target)) closeMenu();
  }

  sel.parentNode.insertBefore(wrapper, sel);
  wrapper.appendChild(sel);
  sel.classList.add("select-native");

  if (!rebuildMenuOnOpen) populateMenu();

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu.hidden) {
      if (rebuildMenuOnOpen) populateMenu();
      menu.hidden = false;
      // Flip menu above trigger if near bottom edge (avoids card resize / page scroll)
      const triggerRect = trigger.getBoundingClientRect();
      const menuMaxH = 244; // ~240px max-height + gap
      const openUpward = triggerRect.bottom + menuMaxH > window.innerHeight;
      menu.classList.toggle("dropdown__menu--up", openUpward);
      trigger.setAttribute("aria-expanded", "true");
      trigger.classList.add("is-open");
      document.addEventListener("click", outsideClick);
      document.addEventListener("keydown", handleEscape);
    } else {
      closeMenu();
    }
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  sel.addEventListener("change", updateTrigger);
  updateTrigger();
}

function initGlassSelects() {
  const statusIds = new Set([
    "itineraryStatus",
    "contactStatus",
    "paymentStatus",
    "driverStatus",
    "invoiceStatus",
  ]);
  const ids = [
    "busesNeeded",
    "tripColor",
    "itineraryStatus",
    "contactStatus",
    "paymentStatus",
    "driverStatus",
    "invoiceStatus",
  ];
  ids.forEach((id) => {
    const sel = $(id);
    if (!sel || sel.tagName !== "SELECT") return;
    wrapSelectInGlassDropdown(sel, { statusId: id });
  });

  // Bus assignment and driver selects (dynamic options, rebuild menu on open)
  document.querySelectorAll("#busGrid select").forEach((sel) => {
    wrapSelectInGlassDropdown(sel, { rebuildMenuOnOpen: true, cellClass: "bus-assign__cell" });
  });
}

// ======================================================
// 36) EVENTS
// ======================================================
function wireEvents() {
  initGlassSelects();

  // Re-apply bus row visibility after wrapping (initGlassSelects wraps selects;
  // updateBusRowVisibility ran in buildBusRowsOnce before wrapping, so wrappers never got is-hidden)
  updateBusRowVisibility();
  syncBusPanelState();

  // Ensure status fields update to 'Pending' when a bus is selected after date is picked
  // (fix for manual entry case)
  const observeBusGrid = () => {
    // Listen for changes on any select in the busGrid
    dom.busGrid.addEventListener("change", (e) => {
      if (e.target && e.target.tagName === "SELECT") {
        maybeApplyPendingDefaults();
      }
    });
  };
  // Call once on load
  observeBusGrid();
  ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus", "invoiceStatus"].forEach(
    (id) => {
      const el = $(id);
      updateStatusSelect(el);
      el.addEventListener("change", () => updateStatusSelect(el));
    },
  );

  // Auto-Refresh
  setInterval(() => {
    if (navigator.onLine && !document.hidden) {
      refreshWeekData({ silent: true });
    }
  }, CONFIG.AUTO_REFRESH_INTERVAL);

  dom.prevWeekBtn.addEventListener("click", () => changeWeek(-1));
  dom.nextWeekBtn.addEventListener("click", () => changeWeek(1));

  dom.agendaLeftBtn?.addEventListener("click", () => {
    if (dom.weekPicker) {
      dom.weekPicker.focus();
      if (dom.weekPicker.showPicker) dom.weekPicker.showPicker();
    }
  });
  dom.weekPicker?.addEventListener("change", (e) => {
    const d = parseYMD(e.target.value);
    if (d) {
      state.currentDate = startOfWeek(d);
      updateWeekDates();
    }
  });

  dom.tripInputBtn.addEventListener("click", () => {
    if (isMobileOnly()) return;
    toggleCard("trip");
  });

  dom.driversBtn.addEventListener("click", () => {
    if (isMobileOnly()) return;
    toggleCard("drivers");
  });

  // Close-card buttons (×) inside card headers
  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest(".btn-close-card");
    if (!closeBtn) return;
    const cardType = closeBtn.dataset.card;
    if (!cardType) return;

    // Reuse notes dirty-check logic
    if (cardType === "notes" && state.notesDirty) {
      if (!confirm("You have unsaved notes changes. Discard them?")) return;
      dom.scheduleNotes.value = state.savedNotesValue;
      state.notesDirty = false;
    }

    hideCard(cardType);
  });

  dom.driverWeekBody.addEventListener("mousedown", (e) => {
    const td = e.target.closest("td");
    if (!td || !td.dataset.driver || !td.dataset.date) return;
    if (td.classList.contains("driver-week__cell--on")) return;

    state.dragSelection.active = true;
    state.dragSelection.driver = td.dataset.driver;
    state.dragSelection.mode = td.classList.contains("driver-week__cell--unavailable")
      ? "remove"
      : "add";
    state.dragSelection.dates.clear();

    // Toggle first cell immediately
    toggleDragCell(td);
  });

  dom.driverWeekBody.addEventListener(
    "mouseover",
    (e) => {
      if (!state.dragSelection.active) return;
      const td = e.target.closest("td");
      if (!td || td.dataset.driver !== state.dragSelection.driver || !td.dataset.date) return;
      if (td.classList.contains("driver-week__cell--on")) return;

      // Don't re-toggle the same cell in one drag pass
      if (state.dragSelection.dates.has(td.dataset.date)) return;

      toggleDragCell(td);
    },
    true,
  );

  window.addEventListener("mouseup", async () => {
    if (!state.dragSelection.active) return;

    const { driver, mode, dates } = state.dragSelection;
    state.dragSelection.active = false;

    if (dates.size === 0) return;

    const dateList = Array.from(dates);
    const action = mode === "add" ? "unavailable" : "available";
    const dayCount = dateList.length;
    const dayWord = dayCount === 1 ? "day" : "days";

    // Confirmation dialog
    if (!confirm(`Mark ${driver} as ${action} for ${dayCount} ${dayWord}?`)) {
      // User cancelled - rollback UI
      refreshWeekData({ silent: true });
      return;
    }

    toastShow(mode === "add" ? "Marking as unavailable..." : "Marking as available...", "loading");

    try {
      const resp = await api.batchUnavailability(driver, dateList, mode);
      if (resp.ok) {
        toast(
          mode === "add" ? "Marked as unavailable ✓" : "Marked as available ✓",
          "success",
          1500,
        );
      } else {
        toast("Failed to update status", "danger", 2500);
        refreshWeekData({ silent: true }); // Rollback UI
      }
    } catch (err) {
      console.error(err);
      toast("Error updating status", "danger", 2500);
      refreshWeekData({ silent: true }); // Rollback UI
    }
  });

  function toggleDragCell(td) {
    const date = td.dataset.date;
    const driver = td.dataset.driver;
    const mode = state.dragSelection.mode;

    if (mode === "add") {
      td.className = "driver-week__cell--unavailable";
      (state.unavailabilityByDriver[driver] ||= {})[date] = true;
    } else {
      td.className = "driver-week__cell--off";
      if (state.unavailabilityByDriver[driver]) {
        delete state.unavailabilityByDriver[driver][date];
      }
    }
    state.dragSelection.dates.add(date);
  }

  dom.notesBtn.addEventListener("click", () => {
    const isOpen = getCardPanel("notes") !== null;

    // Warn if closing with unsaved changes
    if (isOpen && state.notesDirty) {
      if (!confirm("You have unsaved notes changes. Discard them?")) return;
      // Reset to saved value
      dom.scheduleNotes.value = state.savedNotesValue;
      state.notesDirty = false;
    }

    toggleCard("notes");
  });

  // Track notes dirty state
  dom.scheduleNotes?.addEventListener("input", () => {
    state.notesDirty = dom.scheduleNotes.value !== state.savedNotesValue;
  });

  dom.saveNotesBtn?.addEventListener("click", async () => {
    const notes = dom.scheduleNotes.value;
    const { notesKey } = getWeekRange();

    if (!navigator.onLine) {
      toast("No internet connection", "danger", 3000);
      return;
    }

    dom.saveNotesBtn.disabled = true;
    toastShow("Saving notes...", "loading");

    try {
      const res = await api.saveWeekNote(notesKey, notes);
      if (res.ok) {
        state.savedNotesValue = notes;
        state.notesDirty = false;
        toast("Notes saved ✓", "success", 1500);
      } else {
        toast("Failed to save notes", "danger", 2500);
      }
    } catch (e) {
      console.error(e);
      toast("Error saving notes", "danger", 2500);
    } finally {
      dom.saveNotesBtn.disabled = false;
    }
  });

  // Waiting List Toggle
  const wlVisible = false; // Always start hidden (User Request)

  function setWaitingListVisible(visible) {
    if (dom.waitingBody) {
      dom.waitingBody.hidden = !visible;
      dom.waitingBody.classList.toggle("is-hidden", !visible);
    }
    if (dom.waitingListBtn) {
      dom.waitingListBtn.setAttribute("aria-pressed", String(visible));
      // Optional: change icon style/color if active
      dom.waitingListBtn.classList.toggle("active", visible);
    }
    localStorage.setItem("waitingListVisible", visible ? "1" : "0");
  }

  // Init
  setWaitingListVisible(wlVisible);

  dom.waitingListBtn?.addEventListener("click", () => {
    const isVisible = !dom.waitingBody.classList.contains("is-hidden");
    setWaitingListVisible(!isVisible);
  });

  syncWeekStartUI();
  // applyWeekStart moved to global scope
  // Old buttons (weekStartSunBtn) removed from DOM

  dom.itineraryBtn.addEventListener("click", openItineraryModal);

  dom.envelopeBtn?.addEventListener("click", () => {
    if (dom.envelopeOverridesSection) {
      dom.envelopeOverridesSection.classList.toggle("is-hidden");
    }
  });
  dom.openItineraryPdfBtn?.addEventListener("click", () => {
    const tripKey = dom.tripKey?.value;
    if (!tripKey) return;
    const trip = state.tripByKey?.[tripKey];
    if (trip && trip.itineraryPdfUrl) {
      window.open(trip.itineraryPdfUrl, "_blank");
    }
  });

  dom.removeItineraryPdfBtn?.addEventListener("click", () => {
    const tripKey = dom.tripKey?.value;
    if (!tripKey) return;
    const trip = state.tripByKey?.[tripKey];
    if (trip && trip.itineraryPdfUrl) {
      if (!confirm("Remove this PDF itinerary?")) return;

      trip.itineraryPdfUrl = ""; // Clear from local state

      // Disable buttons immediately to reflect change
      dom.openItineraryPdfBtn.disabled = true;
      dom.removeItineraryPdfBtn.disabled = true;

      // Trigger save process
      state.tripFormDirty = true;
      dom.saveBtn.click();
    }
  });
  dom.itineraryModal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeItineraryModal();
  });
  document.addEventListener("keydown", (e) => {
    if (!dom.itineraryModal.hidden && e.key === "Escape") closeItineraryModal();
  });
  dom.itinerarySaveBtn.addEventListener("click", closeItineraryModal);
  dom.itineraryCopyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(dom.itineraryModalField.value || "");
      toast("Copied ✓", "success", 900);
    } catch {
      toast("Copy failed", "danger", 1200);
    }
  });

  /* agendaBody click listener removed - refactoring to use delegation in wireDelegatedBarEvents */
  dom.busGrid.addEventListener("change", (e) => {
    if (e.target && e.target.tagName === "SELECT") syncBusSelectEmptyState();
  });

  dom.busesNeeded.addEventListener("input", () => {
    updateBusRowVisibility();
    syncBusPanelState();
    maybeApplyPendingDefaults();
  });
  dom.busesNeeded.addEventListener("change", () => {
    updateBusRowVisibility();
    syncBusPanelState();
    maybeApplyPendingDefaults();
  });

  $("tripDate").addEventListener("change", () => {
    const dep = $("tripDate").value;
    const arrival = $("arrivalDate");

    // Validate year is reasonable (e.g. >= 2000) before auto-filling
    const year = parseInt(dep.split("-")[0], 10);
    const isValidYear = !isNaN(year) && year >= 2000;

    if (isValidYear && dep && arrival && !arrival.value) {
      arrival.value = dep;
    }
    arrival.dispatchEvent(new Event("change", { bubbles: true }));
    maybeApplyPendingDefaults();
  });

  dom.hiddenIframe.addEventListener("load", () => {
    if (!state.pendingWrite) return;
    toastProgress(60, "Server responded… verifying… 60%");
    clearVerifyFallback();
    verifyWriteResult();
  });

  dom.newBtn.addEventListener("click", () => {
    // Warn if clearing while there are unsaved trip changes
    if (state.tripFormDirty) {
      const discard = confirm("You have unsaved trip changes. Discard them?");
      if (!discard) return;
    }

    clearTripInfoCardForNextTrip();
    toast("Ready", "info", 900);
  });
  // ✅ IMPORTANT: Always POST to the same Apps Script deployment as GET
  dom.tripForm.action = CONFIG.ENDPOINT;

  dom.deleteBtn.addEventListener("click", () => {
    if (!navigator.onLine) {
      toast("No internet connection", "danger", 3000);
      return;
    }
    if (!dom.tripKey.value) return;
    if (!confirm("Delete this trip?")) return;

    dom.action.value = "delete";
    dom.saveBtn.disabled = true;

    // OPTIMISTIC UPDATE: Remove locally immediately
    const key = String(dom.tripKey.value);

    // Backup for rollback
    const originalTrips = [...state.trips];
    const originalTripByKey = { ...state.tripByKey };
    const originalAssignments = { ...state.assignmentsByTripKey };

    // 1. Remove from state
    state.trips = state.trips.filter((t) => String(t.tripKey) !== key);
    delete state.tripByKey[key];
    delete state.assignmentsByTripKey[key];

    // 2. Invalidate cache for current view
    clearCacheForCurrentView();

    // 3. Re-render UI
    scheduleAgendaReflow();
    updateDriverWeekIfVisible();

    // 4. Feedback & Modal Close (don't reset form yet so it can submit)
    closeTripDetailsModal();
    toast("Trip deleted ✓", "success", 1500);

    // OPTIMISTIC UI: Clear form for next entry
    setTimeout(() => {
      resetTripFormUI();
    }, 100);

    state.pendingWrite = {
      action: "delete",
      tripKey: key,
      originalTrips,
      originalTripByKey,
      originalAssignments,
    };

    startVerifyFallback();

    // Explicitly set these for the native submission
    dom.action.value = "delete";
    dom.tripKey.value = key;

    dom.tripForm.submit();
  });

  dom.tripForm.addEventListener("submit", (e) => {
    // If we're deleting, don't preventDefault (in case form.submit() triggers this)
    if (dom.action.value === "delete") return;

    e.preventDefault();

    // Run native HTML5 constraint validation (respects `required`, etc.)
    // If any field is invalid, the browser will show messages and we skip saving.
    if (!dom.tripForm.reportValidity()) {
      return;
    }

    if (!navigator.onLine) {
      toast("No internet connection", "danger", 3000);
      return;
    }
    if (dom.saveBtn.disabled) return;
    if (dom.action.value === "delete") return;

    const dep = $("tripDate").value;
    const arr = $("arrivalDate").value;
    if (dep && !arr) {
      $("arrivalDate").value = dep;
      $("arrivalDate").dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Basic consistency check: arrival date should not be before departure date.
    const depDate = $("tripDate").value;
    const arrDate = $("arrivalDate").value;
    if (depDate && arrDate && arrDate < depDate) {
      toast("Arrival date can’t be before departure date.", "danger", 2500);
      $("arrivalDate").focus();
      return;
    }

    if (dom.action.value === "create" && !dom.tripKey.value) dom.tripKey.value = safeUUID();

    $("departureTime").value = normalizeTime($("departureTime").value);
    $("spotTime").value = normalizeTime($("spotTime").value);
    $("arrivalTime").value = normalizeTime($("arrivalTime").value);

    // Combine the 3 envelope notes into the hidden envelopeTripNotes field
    const n1 = $("envelopeNote1")?.value || "";
    const n2 = $("envelopeNote2")?.value || "";
    const n3 = $("envelopeNote3")?.value || "";
    if ($("envelopeTripNotes")) {
      // Join all 3 lines exactly as-is so blank middle lines are preserved
      $("envelopeTripNotes").value = [n1, n2, n3].join("\n");
    }

    // OPTIMISTIC UPDATE: Save locally immediately
    const action = dom.action.value;
    const key = String(dom.tripKey.value || "");

    // Backup for rollback
    const originalTrips = [...state.trips];
    const originalTripByKey = { ...state.tripByKey };
    const originalAssignments = { ...state.assignmentsByTripKey };

    // Construct assignments from state.busRows for instant rendering
    const numBuses = parseInt(dom.busesNeeded.value) || 0;
    const optimisticAssignments = [];
    let hasAssignedBus = false;
    for (let i = 0; i < numBuses; i++) {
      const row = state.busRows[i];
      if (row) {
        const busId = String(row.busSel.value || "").trim();
        const driver1 = String(row.d1Sel.value || "").trim();
        const driver2 = String(row.d2Sel.value || "").trim();

        if (busId && busId !== "None") hasAssignedBus = true;

        optimisticAssignments.push({
          busId,
          driver1,
          driver2,
        });
      }
    }

    // Guard: if buses are needed, require at least one actual bus assignment.
    if (numBuses > 0 && !hasAssignedBus) {
      toast("Select at least one bus for this trip.", "danger", 2500);
      // Focus first bus dropdown trigger (visible control; native select is hidden)
      const firstRow = state.busRows[0];
      const busTrigger = firstRow?.busSel
        ?.closest?.(".select-dropdown")
        ?.querySelector?.(".select-trigger");
      if (busTrigger && !busTrigger.disabled) busTrigger.focus();
      return;
    }

    // Construct trip from form
    const optimisticTrip = {
      tripKey: key,
      destination: $("destination").value,
      customer: $("customer").value,
      contactName: $("contactName").value,
      phone: $("phone").value,
      departureDate: $("tripDate").value,
      arrivalDate: $("arrivalDate").value,
      departureTime: $("departureTime").value,
      spotTime: $("spotTime").value,
      arrivalTime: $("arrivalTime").value,
      itineraryStatus: $("itineraryStatus").value,
      contactStatus: $("contactStatus").value,
      paymentStatus: $("paymentStatus").value,
      driverStatus: $("driverStatus").value,
      invoiceStatus: $("invoiceStatus").value,
      invoiceNumber: $("invoiceNumber").value,
      tripColor: $("tripColor").value,
      busesNeeded: $("busesNeeded").value,
      itinerary: dom.itineraryField.value,
      notes: $("notes").value,
      comments: $("comments").value,
      // Envelope-only fields (do not affect quote contact/phone/notes)
      envelopePickup: $("envelopePickup")?.value || "",
      envelopeTripContact: $("envelopeTripContact")?.value || "",
      envelopeTripPhone: $("envelopeTripPhone")?.value || "",
      envelopeTripNotes: $("envelopeTripNotes")?.value || "",
      req56Pass: $("req56Pass")?.getAttribute("aria-pressed") === "true",
      reqSleeper: $("reqSleeper")?.getAttribute("aria-pressed") === "true",
      reqLift: $("reqLift")?.getAttribute("aria-pressed") === "true",
      reqRelief: $("reqRelief")?.getAttribute("aria-pressed") === "true",
      reqCoDriver: $("reqCoDriver")?.getAttribute("aria-pressed") === "true",
      reqHotel: $("reqHotel")?.getAttribute("aria-pressed") === "true",
    };

    // Proactive Conflict Check
    const conflict = checkPotentialConflicts(optimisticTrip, optimisticAssignments);
    if (conflict) {
      const msg = `Schedule Overlap Detected!\n\nBus ${conflict.busId} is already assigned to "${conflict.otherTrip}" on ${conflict.dateRange}.\n\nDo you want to save anyway?`;
      if (!confirm(msg)) {
        dom.saveBtn.disabled = false;
        return;
      }
    }

    // Update state
    if (action === "create") {
      state.trips.push(optimisticTrip);
    } else {
      const idx = state.trips.findIndex((t) => String(t.tripKey) === key);
      if (idx >= 0) state.trips[idx] = optimisticTrip;
      else state.trips.push(optimisticTrip);
    }
    state.tripByKey[key] = optimisticTrip;
    state.assignmentsByTripKey[key] = optimisticAssignments;

    // Rerender UI
    scheduleAgendaReflow();
    updateDriverWeekIfVisible();

    // Invalidate cache
    clearCacheForCurrentView();

    toast("Saving…", "info", 1000);

    dom.saveBtn.disabled = true;

    // Sync requirement toggles to hidden inputs so backend receives them
    ["req56Pass", "reqSleeper", "reqLift", "reqRelief", "reqCoDriver", "reqHotel"].forEach((id) => {
      const btn = $(id);
      const hidden = $(id + "Value");
      if (btn && hidden) {
        hidden.value = btn.getAttribute("aria-pressed") === "true" ? "true" : "false";
      }
    });

    state.pendingWrite = {
      action,
      tripKey: key,
      originalTrips,
      originalTripByKey,
      originalAssignments,
    };
    startVerifyFallback();
    dom.tripForm.submit();

    // OPTIMISTIC UI: Clear form immediately for next entry
    // (Small delay to ensure browser captures data for hidden_iframe submit)
    setTimeout(() => {
      resetTripFormUI();
      toast("Saved ✓", "success", 1200);
    }, 100);
  });

  function resetTripFormUI() {
    dom.tripForm.reset();
    resetRequirementToggles();
    refreshEmptyStateUI();
    setModeNew();

    // Reset custom selects to placeholder so triggers sync (form.reset doesn't fire change)
    setSelectToPlaceholder("busesNeeded");
    setSelectToPlaceholder("tripColor");
    ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus", "invoiceStatus"].forEach(
      setSelectToPlaceholder,
    );

    dom.busesNeeded.value = "";
    updateBusRowVisibility();
    syncBusPanelState();
    refreshBusSelectOptions();

    // Reset bus/driver selects and sync triggers
    state.busRows.forEach((r) => {
      r.busSel.value = "None";
      r.d1Sel.value = "None";
      r.d2Sel.value = "None";
      r.busSel.dispatchEvent(new Event("change", { bubbles: true }));
      r.d1Sel.dispatchEvent(new Event("change", { bubbles: true }));
      r.d2Sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
    syncBusSelectEmptyState();

    ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus", "invoiceStatus"].forEach(
      (id) => updateStatusSelect($(id)),
    );
    updateInvoiceNumberVisibility();

    // Form has just been reset after save/delete; treat as clean.
    state.tripFormDirty = false;
    if (typeof syncEmptyFields === "function") syncEmptyFields();
  }

  function clearCacheForCurrentView() {
    // For simplicity and to avoid any stale local snapshots after edits,
    // clear all cached week data (both in-memory and persistent).
    try {
      state.weekCache.clear();
    } catch { }

    try {
      CACHE.clearAll();
    } catch { }
  }

  dom.tripDetailsModal?.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-details]")) closeTripDetailsModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!dom.tripDetailsModal?.hidden && e.key === "Escape") closeTripDetailsModal();
  });

  $("todayBtn")?.addEventListener("click", () => {
    const today = new Date();
    // dom.weekPicker.value = toLocalDateInputValue(today); // Removed
    state.currentDate = startOfWeek(today);
    updateWeekDates();
  });

  $("todayBtnMobile")?.addEventListener("click", () => {
    const today = new Date();
    // dom.weekPicker.value = toLocalDateInputValue(today); // Removed
    state.currentDate = startOfWeek(today);
    updateWeekDates();
  });

  // Toggle pills — click toggles aria-pressed
  document.querySelectorAll(".toggle-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", pressed ? "false" : "true");
    });
  });
}

// ======================================================
// 37) WIRE SETTINGS MENU
// ======================================================
function wireSettingsMenu() {
  console.log("[wireSettingsMenu] settingsBtn:", dom.settingsBtn);
  console.log("[wireSettingsMenu] settingsMenu:", dom.settingsMenu);
  if (!dom.settingsBtn || !dom.settingsMenu) {
    console.error("[wireSettingsMenu] settingsBtn or settingsMenu not found!");
    return;
  }

  // Toggle Menu

  dom.settingsBtn.addEventListener("click", (e) => {
    console.log("[wireSettingsMenu] settingsBtn clicked");
    e.stopPropagation();
    const isHidden = dom.settingsMenu.hidden;
    dom.settingsMenu.hidden = !isHidden;
    dom.settingsBtn.setAttribute("aria-expanded", isHidden);
  });

  // Close on click outside
  document.addEventListener("click", (e) => {
    if (
      !dom.settingsMenu.hidden &&
      !dom.settingsMenu.contains(e.target) &&
      !dom.settingsBtn.contains(e.target)
    ) {
      dom.settingsMenu.hidden = true;
      dom.settingsBtn.setAttribute("aria-expanded", "false");
    }
  });

  // 1. Jump directly to Today
  dom.todayBtn2?.addEventListener("click", () => {
    const today = new Date();
    // dom.weekPicker.value = toLocalDateInputValue(today); // Removed
    state.currentDate = startOfWeek(today);
    updateWeekDates();
    dom.settingsMenu.hidden = true;
  });

  // Next Day Maintenance Report
  dom.nextDayReportBtn?.addEventListener("click", () => {
    dom.settingsMenu.hidden = true;
    generateNextDayReport();
  });

  // Daily Maintenance Plan
  dom.dailyMaintenancePlanBtn?.addEventListener("click", () => {
    dom.settingsMenu.hidden = true;
    generateDailyMaintenancePlan();
  });

  // 3. Print (Legal, 2 pages)
  dom.printBtn2?.addEventListener("click", () => {
    dom.settingsMenu.hidden = true;
    setSidePanelMode("off");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPrintPageSize("legal");
        buildPrintScheduleTwoPages();
        window.print();
      });
    });
  });

  // 3b. Print Full (Letter, 1 page)
  dom.printBtn2Full?.addEventListener("click", () => {
    dom.settingsMenu.hidden = true;
    setSidePanelMode("off");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPrintPageSize("letter");
        buildPrintScheduleFullLetter();
        window.print();
      });
    });
  });

  // 4. Week Start
  dom.weekStartToggle?.addEventListener("click", () => {
    applyWeekStart(!state.weekStartsOnMonday);
    // Don't close menu so user can see the toggle change
  });

  // 5. Refresh
  dom.refreshBtn2?.addEventListener("click", () => {
    dom.settingsMenu.hidden = true;
    CACHE.clearAll();
    state.weekCache.clear();
    loadDriversAndBuses(true).then(() => refreshWeekData());
  });

  // 6. Auto-close whenever ANY dropdown item is clicked inside this menu
  dom.settingsMenu.addEventListener("click", (e) => {
    if (e.target.closest(".dropdown__item")) {
      dom.settingsMenu.hidden = true;
      dom.settingsBtn.setAttribute("aria-expanded", "false");
    }
  });
}

// ======================================================
// 38) WEEKLY MAINTENANCE REPORT
// ======================================================
function generateNextDayReport(selectedDate = null) {
  let startD = selectedDate ? new Date(selectedDate) : new Date(state.currentDate || new Date());

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

  let fullHtml = `<div class="next-day-report">`;

  // Loop 7 days
  for (let i = 0; i < 7; i++) {
    const today = addDays(startD, i);
    const tomorrow = addDays(today, 1);
    const todayYMD = ymd(today);
    const tomorrowYMD = ymd(tomorrow);

    // Find all buses that have a trip departing tomorrow
    const busesDepartingTomorrow = new Set();
    const tripsDepartingTomorrow = state.trips.filter((t) => t.departureDate === tomorrowYMD);

    tripsDepartingTomorrow.forEach((trip) => {
      const assigns = state.assignmentsByTripKey[trip.tripKey] || [];
      assigns.forEach((a) => {
        const busId = String(a.busId || "").trim();
        if (busId && busId !== "None" && busId !== "WAITING_LIST") {
          busesDepartingTomorrow.add(busId);
        }
      });
    });

    // For these buses, find when they arrive today
    const reportData = [];
    const priorityBusesInfo = [];

    busesDepartingTomorrow.forEach((busId) => {
      // Find trips for this bus arriving today
      let arrivalTimeToday = "Already in yard / No arrival today";
      let departureTimeTomorrow = "Unknown";
      let maintenanceWindow = "Flexible (Bus is in yard)";

      // Find departure time tomorrow
      const tomorrowTrip = tripsDepartingTomorrow.find((t) => {
        const assigns = state.assignmentsByTripKey[t.tripKey] || [];
        return assigns.some((a) => String(a.busId).trim() === busId);
      });

      if (tomorrowTrip && tomorrowTrip.departureTime) {
        departureTimeTomorrow = formatTime12(tomorrowTrip.departureTime);
      }

      // Find arrival time today
      const tripsArrivingToday = state.trips.filter((t) => {
        const arrDate = t.arrivalDate || t.departureDate;
        if (arrDate !== todayYMD) return false;
        const assigns = state.assignmentsByTripKey[t.tripKey] || [];
        return assigns.some((a) => String(a.busId).trim() === busId);
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
            arrHour = parseInt(normedArr.split(":")[0], 10);
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
            arrTimeNum =
              parseInt(normedArr.split(":")[0], 10) + parseInt(normedArr.split(":")[1], 10) / 60;
          }
        }

        let depTimeNum = 32; // Default 8 AM tomorrow
        if (tomorrowTrip && tomorrowTrip.departureTime) {
          const normedDep = normalizeTime(tomorrowTrip.departureTime);
          if (normedDep) {
            depTimeNum =
              24 +
              parseInt(normedDep.split(":")[0], 10) +
              parseInt(normedDep.split(":")[1], 10) / 60;
          }
        }
        priorityBusesInfo.push({ a: arrTimeNum, d: depTimeNum });

        reportData.push({
          busId,
          arrivalTimeToday,
          departureTimeTomorrow,
          maintenanceWindow,
          priority: tripsArrivingToday.length > 0 ? 1 : 2, // 1 High Priority (arriving today), 2 Low Priority (in yard)
        });
      } else {
        reportData.push({
          busId,
          arrivalTimeToday,
          departureTimeTomorrow,
          maintenanceWindow,
          priority: 2, // Low Priority (in yard)
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
          let ampm = h >= 12 ? "PM" : "AM";
          h = h % 12;
          if (h === 0) h = 12;
          let ms = String(m).padStart(2, "0");
          let dayStr = isTmrw ? " (Next Day)" : "";
          if (isTmrw && h === 12 && ampm === "AM") dayStr = ""; // it's just midnight
          return `${h}:${ms} ${ampm}${dayStr}`;
        };

        shiftDisplay = `<div class="next-day-report__shift">
        <strong class="next-day-report__shift-title">Optimal 8-Hour Maintenance Shift: <span class="next-day-report__shift-title--accent">${formatTimeNum(bestShift)} - ${formatTimeNum(bestShift + 8)}</span></strong>
        <span class="next-day-report__shift-desc">This window guarantees at least 2 hours of available yard time for every priority bus.</span>
      </div>`;
      } else {
        shiftDisplay = `<div class="next-day-report__shift next-day-report__shift--danger">
        <strong class="next-day-report__shift-title next-day-report__shift-title--danger">No single 8-hour shift possible</strong>
        <span class="next-day-report__shift-desc">Cannot find a single 8-hour window that gives 2+ hours to all priority buses. You may need staggered shifts.</span>
      </div>`;
      }
    } else if (reportData.length > 0) {
      shiftDisplay = `<div class="next-day-report__shift next-day-report__shift--success">
        <strong class="next-day-report__shift-title next-day-report__shift-title--success">All Buses in Yard (Flexible)</strong>
        <span class="next-day-report__shift-desc">No priority arrivals. Maintenance shifts can be scheduled anytime.</span>
      </div>`;
    }

    // Build HTML for loop iteration
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
    let dayHtml = `<div class="next-day-report__day weekly-report-day">
      <h3 class="next-day-report__day-title">
        ${dayName} Maintenance Schedule
        <span class="next-day-report__day-subtitle">
          (Handling arrivals from ${formatDateForToast(todayYMD)} for departures on ${formatDateForToast(tomorrowYMD)})
        </span>
      </h3>`;

    dayHtml += shiftDisplay;
    if (reportData.length === 0) {
      dayHtml += `<p class="next-day-report__empty">No buses found that depart tomorrow (${tomorrowYMD}).</p>`;
    } else {
      dayHtml += `<table class="next-day-report__table next-day-report-table">
        <thead>
          <tr>
            <th>Bus</th>
            <th>Status</th>
            <th>Depart Tomorrow</th>
            <th>Suggested Window</th>
          </tr>
        </thead>
        <tbody>`;
      reportData.forEach((row) => {
        const priorityLabel =
          row.priority === 1
            ? `<span class="next-day-report__badge--priority">PRIORITY</span>`
            : `<span class="next-day-report__badge--yard">IN YARD</span>`;

        dayHtml += `<tr>
          <td><strong>${row.busId}</strong><br/>${priorityLabel}</td>
          <td>${row.priority === 1 ? `Arrives Today: <br/><strong>${row.arrivalTimeToday}</strong>` : `Already in yard`}</td>
          <td><strong>${row.departureTimeTomorrow}</strong></td>
          <td>${row.maintenanceWindow}</td>
        </tr>`;
      });
      dayHtml += `</tbody></table>`;
    }

    dayHtml += `</div>`;
    fullHtml += dayHtml;
  }

  fullHtml += `</div>`;
  dom.nextDayReportBody.innerHTML = fullHtml;
  dom.nextDayReportModal.hidden = false;
}

// Close and Print handlers
if (dom.nextDayReportDateInput) {
  dom.nextDayReportDateInput.addEventListener("change", (e) => {
    const d = parseYMD(e.target.value);
    if (d) {
      generateNextDayReport(d);
    }
  });
}
if (dom.closeNextDayReportBtn) {
  dom.closeNextDayReportBtn.addEventListener("click", () => {
    dom.nextDayReportModal.hidden = true;
  });
}
if (dom.closeNextDayReportBackdrop) {
  dom.closeNextDayReportBackdrop.addEventListener("click", () => {
    dom.nextDayReportModal.hidden = true;
  });
}
if (dom.printNextDayReportBtn) {
  dom.printNextDayReportBtn.addEventListener("click", () => {
    const printWindow = window.open("", "", "height=800,width=1000");
    printWindow.document.write("<html><head><title>Weekly Maintenance Report</title>");

    // Inject custom print styles tailored for fitting 7 days into 1 page
    printWindow.document.write(`
      <style>
        @page { size: portrait; margin: 0.5in; }
        body { 
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
          padding: 0; 
          margin: 0;
          font-size: 11px;
          color: #222; 
          line-height: 1.3;
        }
        
        /* Clean Header */
        h2 { 
          text-align: center; 
          font-size: 18px; 
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #222;
          padding-bottom: 6px;
          color: #111;
        }
        
        .print-wrapper {
          display: block;
          width: 100%;
        }
        
        /* Day Blocks */
        .weekly-report-day {
          break-inside: avoid;
          page-break-inside: avoid;
          margin-bottom: 24px !important;
          padding-bottom: 12px !important;
          border-bottom: 1px dashed #ccc !important;
        }
        
        .weekly-report-day:last-child {
          border-bottom: none !important;
        }
        
        /* Date Headers */
        h3 { 
          font-size: 14px !important; 
          margin: 0 0 8px 0 !important; 
          color: #111 !important; 
          font-weight: 700 !important;
          line-height: 1.2 !important;
        }
        h3 span { 
          color: #555 !important; 
          font-weight: 400 !important; 
          font-size: 11px !important;
          display: block;
          margin-top: 2px !important;
        }
        
        /* Shift Alert Box */
        .next-day-report__shift {
          background: #fdfdfd !important;
          border: 1px solid #e0e0e0 !important;
          border-left: 3px solid #0284c7 !important; 
          padding: 8px 12px !important;
          box-shadow: none !important;
          border-radius: 4px !important;
          margin-bottom: 12px !important;
        }
        
        .next-day-report__shift--danger { border-left-color: #dc2626 !important; }
        .next-day-report__shift--success { border-left-color: #10b981 !important; }
        
        /* Table Styling */
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 8px !important; 
          font-size: 11px !important; 
          table-layout: auto;
        }
        
        th, td { 
          padding: 6px 4px !important; 
          border-bottom: 1px solid #f0f0f0 !important; 
          text-align: left; 
          color: #222 !important;
          vertical-align: top;
        }
        th { 
          color: #444 !important; 
          font-weight: 700 !important; 
          border-bottom: 1px solid #999 !important; 
          text-transform: capitalize;
        }
        
        td strong { 
          color: #111 !important; 
          font-weight: 600;
        }
        
        /* Override dark mode / ensure print-friendly text */
        .next-day-report__shift-title { color: #111 !important; font-size: 11px !important; }
        .next-day-report__shift-title--accent { color: #0369a1 !important; }
        .next-day-report__shift-title--danger { color: #b91c1c !important; }
        .next-day-report__shift-title--success { color: #047857 !important; }
        .next-day-report__shift-desc { color: #444 !important; font-size: 10px !important; display: block; margin-top: 2px; }
        .next-day-report__day-subtitle { color: #555 !important; }
        
        .next-day-report__badge--priority,
        .next-day-report__badge--yard {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          font-size: 9px !important;
          font-weight: 700 !important;
          letter-spacing: 0.5px;
          display: block;
          margin-top: 2px;
        }
        
        p { margin: 4px 0 !important; color: #444 !important; }
      </style>
    `);

    printWindow.document.write("</head><body>");
    printWindow.document.write("<h2>Weekly Maintenance Report</h2>");
    printWindow.document.write('<div class="print-wrapper">');
    printWindow.document.write(dom.nextDayReportBody.innerHTML);
    printWindow.document.write("</div>");
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();

    // setTimeout to allow rendering before the print dialog freezes the thread
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  });
}

function generateDailyMaintenancePlan(selectedDate = null) {
  let startD = selectedDate ? new Date(selectedDate) : new Date(state.currentDate || new Date());

  if (!selectedDate) {
    if (state.weekStartsMonday) {
      if (startD.getDay() === 0) startD = addDays(startD, -6);
      else startD = addDays(startD, 1 - startD.getDay());
    } else {
      startD = addDays(startD, -startD.getDay());
    }
  }

  const startYMD = ymd(startD);
  if (dom.dailyMaintenancePlanDateInput && dom.dailyMaintenancePlanDateInput.value !== startYMD) {
    dom.dailyMaintenancePlanDateInput.value = startYMD;
  }

  const buses = ["218", "763", "470", "133", "506", "746", "607", "897", "898", "474"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const endD = addDays(startD, 6);
  let titleStr = `${monthNames[startD.getMonth()]} ${startD.getDate()} - ${endD.getDate()}, ${endD.getFullYear()}`;
  if (startD.getMonth() !== endD.getMonth()) {
    titleStr = `${monthNames[startD.getMonth()]} ${startD.getDate()} - ${monthNames[endD.getMonth()]} ${endD.getDate()}, ${endD.getFullYear()}`;
  }

  let fullHtml = `<div class="daily-plan">`;
  fullHtml += `<h1 class="daily-plan__title">Weekly Maintenance Priority Plan: <span>${titleStr}</span></h1>`;

  for (let i = 0; i < 7; i++) {
    const currentDay = addDays(startD, i);
    const currentYMD = ymd(currentDay);
    const tomorrowYMD = ymd(addDays(currentDay, 1));
    const dayName = currentDay.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = `${monthNames[currentDay.getMonth()]} ${currentDay.getDate()}`;

    let tripsDepartingTomorrow = state.trips.filter((t) => t.departureDate === tomorrowYMD);
    let busesDepartingTomorrow = new Set();
    tripsDepartingTomorrow.forEach((trip) => {
      let assigns = state.assignmentsByTripKey[trip.tripKey] || [];
      assigns.forEach((a) => {
        let busId = String(a.busId || "").trim();
        if (busId && busId !== "None" && busId !== "WAITING_LIST") {
          busesDepartingTomorrow.add(busId);
        }
      });
    });

    let priority1 = []; // Arriving Today
    let priority3 = []; // Already in yard (Flexible)

    let nightShiftRequired = false;

    buses.forEach((busId) => {
      if (busesDepartingTomorrow.has(busId)) {
        let arrivalTimeToday = "In Yard";
        let departureTimeTomorrow = "Unknown";
        let arrivalHour = 0;
        let arrivingToday = false;

        let tomorrowTrip = tripsDepartingTomorrow.find((t) => {
          let assigns = state.assignmentsByTripKey[t.tripKey] || [];
          return assigns.some((a) => String(a.busId).trim() === busId);
        });
        if (tomorrowTrip && tomorrowTrip.departureTime) {
          departureTimeTomorrow = formatTime12(tomorrowTrip.departureTime);
        }

        let tripsArrivingToday = state.trips.filter((t) => {
          let arrDate = t.arrivalDate || t.departureDate;
          if (arrDate !== currentYMD) return false;
          let assigns = state.assignmentsByTripKey[t.tripKey] || [];
          return assigns.some((a) => String(a.busId).trim() === busId);
        });

        tripsArrivingToday.sort((a, b) => {
          let timeA = normalizeTime(a.arrivalTime) || "00:00";
          let timeB = normalizeTime(b.arrivalTime) || "00:00";
          return timeB.localeCompare(timeA);
        });

        if (tripsArrivingToday.length > 0) {
          arrivingToday = true;
          let lastTripToday = tripsArrivingToday[0];
          if (lastTripToday.arrivalTime) {
            arrivalTimeToday = formatTime12(lastTripToday.arrivalTime);
            let normedArr = normalizeTime(lastTripToday.arrivalTime);
            if (normedArr) arrivalHour = parseInt(normedArr.split(":")[0], 10);
          }
        }

        let info = { busId: busId, in: arrivalTimeToday, out: departureTimeTomorrow };

        if (arrivingToday) {
          priority1.push(info);
          if (arrivalHour >= 8) {
            nightShiftRequired = true; // Any late arrival forces a night shift to fix it
          }
        } else {
          priority3.push(info);
        }
      }
    });

    let recommendedShift = nightShiftRequired
      ? "Night Shift (6:00 PM - 2:00 AM)"
      : "Morning Shift (8:00 AM - 5:00 PM)";
    let shiftColor = nightShiftRequired ? "#b45309" : "#0e7490";
    if (priority1.length === 0 && priority3.length === 0) {
      recommendedShift = "No Shift Needed";
      shiftColor = "#9ca3af";
    }

    const shiftClass =
      recommendedShift === "No Shift Needed"
        ? "daily-plan__shift-summary--none"
        : nightShiftRequired
          ? "daily-plan__shift-summary--night"
          : "daily-plan__shift-summary--morning";

    fullHtml += `<div class="daily-plan__day">`;
    fullHtml += `<h2 class="daily-plan__day-header">${dayName} <span>- ${formattedDate}</span></h2>`;

    fullHtml += `<div class="daily-plan__shift-summary ${shiftClass}">Recommended Schedule: ${recommendedShift}</div>`;

    fullHtml += `<div class="daily-plan__section">`;
    fullHtml += `<h3 class="daily-plan__section-title daily-plan__section-title--priority">Priority:</h3>`;
    if (priority1.length > 0) {
      priority1.forEach((b) => {
        fullHtml += `<div class="daily-plan__bus-line"><b>Bus ${b.busId}</b> &nbsp;&nbsp;|&nbsp;&nbsp; <span class="daily-plan__in-arriving">In: ${b.in}</span> &nbsp;&nbsp;|&nbsp;&nbsp; <span class="daily-plan__out-tomorrow">Out: ${b.out} (Tomorrow)</span></div>`;
      });
    } else {
      fullHtml += `<div class="daily-plan__bus-line daily-plan__bus-line--muted">None</div>`;
    }

    fullHtml += `<h3 class="daily-plan__section-title daily-plan__section-title--yard">Already in Yard Today:</h3>`;
    if (priority3.length > 0) {
      priority3.forEach((b) => {
        fullHtml += `<div class="daily-plan__bus-line"><b>Bus ${b.busId}</b> &nbsp;&nbsp;|&nbsp;&nbsp; <span class="daily-plan__in-yard">In: Yard</span> &nbsp;&nbsp;|&nbsp;&nbsp; <span class="daily-plan__out-tomorrow">Out: ${b.out} (Tomorrow)</span></div>`;
      });
    } else {
      fullHtml += `<div class="daily-plan__bus-line daily-plan__bus-line--muted">None</div>`;
    }
    fullHtml += `</div></div>`;
  }

  fullHtml += `</div>`;
  dom.dailyMaintenancePlanBody.innerHTML = fullHtml;
  dom.dailyMaintenancePlanModal.hidden = false;
}

if (dom.dailyMaintenancePlanDateInput) {
  dom.dailyMaintenancePlanDateInput.addEventListener("change", (e) => {
    const d = parseYMD(e.target.value);
    if (d) {
      generateDailyMaintenancePlan(d);
    }
  });
}
if (dom.closeDailyMaintenancePlanBtn) {
  dom.closeDailyMaintenancePlanBtn.addEventListener("click", () => {
    dom.dailyMaintenancePlanModal.hidden = true;
  });
}
if (dom.closeDailyMaintenancePlanBackdrop) {
  dom.closeDailyMaintenancePlanBackdrop.addEventListener("click", () => {
    dom.dailyMaintenancePlanModal.hidden = true;
  });
}

// Driver Contact events
if (dom.closeDriverContactBtn) {
  dom.closeDriverContactBtn.addEventListener("click", () => {
    dom.driverContactModal.hidden = true;
  });
}
if (dom.closeDriverContactBackdrop) {
  dom.closeDriverContactBackdrop.addEventListener("click", () => {
    dom.driverContactModal.hidden = true;
  });
}
if (dom.driverContactModal) {
  document.addEventListener("keydown", (e) => {
    if (!dom.driverContactModal.hidden && e.key === "Escape") {
      dom.driverContactModal.hidden = true;
    }
  });
}
if (dom.copyDriverContactBtn) {
  dom.copyDriverContactBtn.addEventListener("click", async () => {
    const text = dom.driverContactBody.value;
    if (!text) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast("Office/Customer Info copied!");
      } else {
        dom.driverContactBody.select();
        document.execCommand("copy");
        toast("Office/Customer Info copied!");
      }
    } catch (err) {
      toast("Failed to copy", "danger");
    }
  });
}

if (dom.copyDriverReminderBtn) {
  dom.copyDriverReminderBtn.addEventListener("click", async () => {
    const text = dom.driverReminderBody.value;
    if (!text) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast("Driver Reminder copied!");
      } else {
        dom.driverReminderBody.select();
        document.execCommand("copy");
        toast("Driver Reminder copied!");
      }
    } catch (err) {
      toast("Failed to copy", "danger");
    }
  });
}

// Envelope modal events
if (dom.closeEnvelopeBtn) {
  dom.closeEnvelopeBtn.addEventListener("click", closeEnvelopeModal);
}
if (dom.closeEnvelopeBackdrop) {
  dom.closeEnvelopeBackdrop.addEventListener("click", closeEnvelopeModal);
}
if (dom.envelopeModal) {
  document.addEventListener("keydown", (e) => {
    if (!dom.envelopeModal.hidden && e.key === "Escape") closeEnvelopeModal();
  });
}
if (dom.envelopeAssignmentSelect) {
  dom.envelopeAssignmentSelect.addEventListener("change", () => {
    const idx = parseInt(dom.envelopeAssignmentSelect.value, 10);
    if (!isNaN(idx)) updateEnvelopeModalSelection(idx);
  });
}
// Removed envelopeSaveBtn event listener
if (dom.envelopePrintBtn) {
  dom.envelopePrintBtn.addEventListener("click", printEnvelopePages);
}
if (dom.envelopeYellowBtn) {
  dom.envelopeYellowBtn.addEventListener("click", () => {
    stateEnvelope.bg = "yellow";
    dom.envelopeModalPages?.querySelectorAll(".envelope-page").forEach((p) => {
      p.classList.remove("env-white");
      p.classList.add("env-yellow");
    });
    dom.envelopeYellowBtn?.classList.add("active");
    dom.envelopeWhiteBtn?.classList.remove("active");
  });
}
if (dom.envelopeWhiteBtn) {
  dom.envelopeWhiteBtn.addEventListener("click", () => {
    stateEnvelope.bg = "white";
    dom.envelopeModalPages?.querySelectorAll(".envelope-page").forEach((p) => {
      p.classList.remove("env-yellow");
      p.classList.add("env-white");
    });
    dom.envelopeWhiteBtn?.classList.add("active");
    dom.envelopeYellowBtn?.classList.remove("active");
  });
}
// Wrap envelope Bus / Driver select in the same glass dropdown treatment
const envSel = document.getElementById("envelopeAssignmentSelect");
if (envSel && envSel.tagName === "SELECT") {
  wrapSelectInGlassDropdown(envSel, { rebuildMenuOnOpen: true });
}

if (dom.printDailyMaintenancePlanBtn) {
  dom.printDailyMaintenancePlanBtn.addEventListener("click", () => {
    const printWindow = window.open("", "", "height=800,width=800");
    printWindow.document.write("<html><head><title>Daily Maintenance Plan</title>");
    printWindow.document.write(`
      <style>
        @page { size: portrait; margin: 0.5in; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style>
    `);
    printWindow.document.write("</head><body>");
    printWindow.document.write(dom.dailyMaintenancePlanBody.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  });
}

// ======================================================
// 39) BOOT
// ======================================================
(function boot() {
  try {
    const style = document.createElement("style");
    style.textContent = `
.schedule-grid-container.is-loading-bars .schedule-grid__trip-bar { opacity: 0.18; pointer-events: none; }
`;
    document.head.appendChild(style);
  } catch { }

  setSidePanelMode("off");
  enforceDesktopEditing();

  loadPrefs();
  syncWeekStartUI();

  const today = new Date();
  state.currentDate = startOfWeek(today);

  buildBusRowsOnce();
  syncBusPanelState();

  buildAgendaRows();
  setHeaderOrder();

  syncEmptyStateForForm();
  setModeNew();

  // moveTopControlsToButtonRow(); // Removed (Layout now static)

  wireSettingsMenu();
  wireEvents();
  wireDelegatedBarEvents();

  window.addEventListener(
    "resize",
    () => {
      suppressScrollbarDuringResize();
      enforceDesktopEditing();
      state.lastColMetrics = null;
      state.barMetrics = null;
      scheduleAgendaReflow();
    },
    { passive: true },
  );

  const tableWrap = document.querySelector(".schedule-grid-container");
  if (tableWrap && "ResizeObserver" in window) {
    const ro = new ResizeObserver(() => {
      state.lastColMetrics = null;
      scheduleAgendaReflow();
    });
    ro.observe(tableWrap);
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      state.lastColMetrics = null;
      scheduleAgendaReflow();
    });
  }

  (async function init() {
    try {
      await loadDriversAndBuses();
    } catch (e) {
      console.warn("Could not load drivers/buses yet. Using placeholders.", e);
      state.driversList = [
        { driverName: "None" },
        { driverName: "Driver A" },
        { driverName: "Driver B" },
      ];
      state.busesList = [
        { busId: "218", busName: "Bus 218" },
        { busId: "763", busName: "Bus 763" },
      ];
      refreshBusSelectOptions();
    }
    updateWeekDates();
  })();

  window.addEventListener("error", (e) => {
    console.error("Global error:", e?.error || e?.message || e);
    toast("Something went wrong (see console)", "danger", 2200);
  });

  window.addEventListener("unhandledrejection", (e) => {
    console.error("Unhandled promise rejection:", e?.reason || e);
    toast("Network / async error occurred", "danger", 2200);
  });

  // ========================================================================
  // DATE PICKER ICON TRIGGER (Overlay + Failsafe)
  // ========================================================================
  // ========================================================================
  // DATE PICKER AUTO-OPEN (For Clickable Title)
  // ========================================================================
  // Date picker click listener removed
})();

// ======================================================
// HELPER: Auto-scale Title Font (Mobile)
// ======================================================
function fitDateTitle() {
  const title = document.querySelector(".week-heading");
  if (!title) return;

  // Reset to max size first to check overflow
  title.style.fontSize = "";

  // Only run if overflow/scrollWidth > clientWidth
  // But wait, ellipsis hides overflow. We compare scrollWidth > clientWidth
  // Force a small delay to let bold/layout settle? usually safe immediately.

  if (window.innerWidth >= 900) return; // Only for mobile layout

  let size = 22; // Start max
  const minSize = 12;

  // Check if ScrollWidth > ClientWidth
  // Note: scrollWidth typically equals clientWidth if overflow:hidden + whitespace:nowrap is set unless content is actually clipped.
  // Wait, if text-overflow: ellipsis is active, scrollWidth might report the full width?
  // Let's assume clamping makes it fit. If scrollWidth > clientWidth, text is overflowing.

  // First, clear inline style to let CSS clamp work
  title.style.fontSize = "";

  if (title.scrollWidth > title.clientWidth) {
    size = parseFloat(window.getComputedStyle(title).fontSize);

    while (title.scrollWidth > title.clientWidth && size > minSize) {
      size--;
      title.style.fontSize = size + "px";
    }
  }
}

window.addEventListener("resize", fitDateTitle);
// Also call on load just in case
window.addEventListener("load", fitDateTitle);
