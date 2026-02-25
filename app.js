// ======================================================
// 1) THEME
// ======================================================
function initThemeSystem() {
  const html = document.documentElement;
  const toggles = [document.getElementById("themeToggle"), document.getElementById("themeToggle2")].filter(Boolean);

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
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
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
    } catch {}
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

  // Context Menu
  ctxMenu: $("tripContextMenu"),
  ctxHeader: $("ctxHeader"),
  ctxEditBtn: $("ctxEditBtn"),
  ctxViewBtn: $("ctxViewBtn"),
  ctxCopyBtn: $("ctxCopyBtn"),

  // Cell Context Menu
  cellCtxMenu: $("cellContextMenu"),
  ctxNewTripBtn: $("ctxNewTripBtn"),
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
  } catch {}
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
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "on" || s === "lift" || s === "x" || s === "✅";
}

function computeLiftSet() {
  const set = new Set();

  for (const b of state.busesList || []) {
    const rawHasLift = b.hasLift ?? b.lift ?? b.wheelchairLift ?? b.wheelchair ?? b.wcLift ?? b.accessible;

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
        arrivalTime: normalizeTime(t?.arrivalTime),
        busesNeeded: String(clamp(asInt(t?.busesNeeded, 0), 0, 10) || ""),
        tripColor: asStr(t?.tripColor).trim(),
        itineraryStatus: asStr(t?.itineraryStatus).trim(),
        contactStatus: asStr(t?.contactStatus).trim(),
        paymentStatus: asStr(t?.paymentStatus).trim(),
        driverStatus: asStr(t?.driverStatus).trim(),
        invoiceStatus: asStr(t?.invoiceStatus).trim(),
        invoiceNumber: asStr(t?.invoiceNumber).trim(),
        notes: asStr(t?.notes),
        comments: asStr(t?.comments),
        itinerary: asStr(t?.itinerary),
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
// 13) STATUS SELECT CLASSES
// ======================================================
function updateStatusSelect(el) {
  if (!el) return;

  const id = el.id;
  const v = String(el.value || "")
    .trim()
    .toLowerCase();

  el.classList.remove("status-pending", "status-ok", "status-assigned", "status-confirmed", "status-blue");
  if (!v) return;

  if (id === "driverStatus") {
    if (v === "pending") el.classList.add("status-pending");
    else if (v === "assigned") el.classList.add("status-assigned");
    else if (v === "confirmed") el.classList.add("status-ok");
    else el.classList.add("status-ok"); // Driver Info Sent
    return;
  }

  if (id === "paymentStatus") {
    if (v === "pending quote")
      el.classList.add("status-pending"); // Red
    else if (v === "quoted")
      el.classList.add("status-assigned"); // Yellow (reusing assigned)
    else el.classList.add("status-ok"); // Contract Signed, PO Received, Not Required (Green)
    return;
  }

  if (id === "invoiceStatus") {
    if (v === "pending invoice")
      el.classList.add("status-pending"); // Red
    else if (v === "invoiced")
      el.classList.add("status-assigned"); // Yellow
    else if (v === "deposit received")
      el.classList.add("status-blue"); // Blue
    else if (v === "paid in full") el.classList.add("status-ok"); // Green
    return;
  }

  if (v === "pending") el.classList.add("status-pending");
  else el.classList.add("status-ok");
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

  const ids = ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus", "invoiceStatus"];
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

  if (dom.weekStartMonBtn) dom.weekStartMonBtn.setAttribute("aria-pressed", isMon ? "true" : "false");
  if (dom.weekStartSunBtn) dom.weekStartSunBtn.setAttribute("aria-pressed", isMon ? "false" : "true");

  // Update toggle button icon and text
  if (dom.weekStartToggle) {
    const icon = dom.weekStartToggle.querySelector(".dropdown-icon");
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
  } catch {}

  syncWeekStartUI();

  setHeaderOrder();
  buildAgendaRows();
  scheduleAgendaReflow();
  updateWeekDates();
}

function setHeaderOrder() {
  const theadRow = document.querySelector(".week-table thead tr");
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
    fetchWeekDataCached(start, end, notesKey).catch(() => {});
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
  const wrap = document.querySelector(".week-table-container");
  wrap?.classList?.toggle("is-loading-bars", !!hidden);
}

// ======================================================
// 17) BAR ELEMENT REUSE HELPERS
// ======================================================
function clearBarsNow() {
  dom.agendaBody?.querySelectorAll(".row-bars").forEach((b) => (b.innerHTML = ""));
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

    // Data-driven coloring - apply as left border on row (enterprise style)
    const colorVal =
      busObj.busColor || busObj.buscolor || busObj.BusColor || busObj["Bus Color"] || busObj["bus color"];
    if (colorVal) {
      tr.style.setProperty("--bus-accent-color", String(colorVal).trim());
      tr.classList.add("has-bus-color");
    }

    const tdBus = document.createElement("td");
    tdBus.className = "bus-id-cell";

    const wrap = document.createElement("div");
    wrap.className = "bus-id-wrap";

    const num = document.createElement("span");
    num.className = "bus-id-num";
    num.textContent = busId;

    wrap.appendChild(num);

    const icons = document.createElement("div");
    icons.className = "bus-icons";

    const busKey = String(busId ?? "").trim();
    if (liftSet.has(busKey)) {
      const icon = document.createElement("span");
      icon.className = "bus-lift material-symbols-outlined";
      icon.textContent = "accessible";
      icon.title = "Wheelchair lift equipped";
      icon.setAttribute("aria-label", "Wheelchair lift equipped");
      icons.appendChild(icon);
    }

    if (sleeperSet.has(busKey)) {
      const icon = document.createElement("span");
      icon.className = "bus-sleeper material-symbols-outlined";
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
      td.className = "day-cell";
      td.dataset.dayId = dayIds[i];
      if (i === todayColIndex) td.classList.add("day-today");
      tr.appendChild(td);
    }

    tr.cells[1].classList.add("week-start-cell");

    const bars = document.createElement("div");
    bars.className = "row-bars";
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
    tr.className = "waiting-list-row";

    const tdBus = document.createElement("td");
    tdBus.className = "bus-id-cell";
    tdBus.innerHTML = `<div class="bus-id-wrap"><span class="material-symbols-outlined" style="font-size: 24px;">low_priority</span></div>`;
    tr.appendChild(tdBus);

    for (let i = 0; i < 7; i++) {
      const td = document.createElement("td");
      td.className = "day-cell";
      td.dataset.dayId = dayIds[i];
      if (i === todayColIndex) td.classList.add("day-today");
      tr.appendChild(td);
    }

    // Border logic
    tr.cells[1].classList.add("week-start-cell");

    const bars = document.createElement("div");
    bars.className = "row-bars";
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
  dom.agendaBody.querySelectorAll(".row-bars").forEach((bars) => {
    bars.style.width = `${total}px`;
  });

  // Sync waiting list rows
  const wb = document.getElementById("waitingBody");
  if (wb) {
    wb.querySelectorAll(".row-bars").forEach((bars) => {
      bars.style.width = `${total}px`;
    });
  }
}

function positionBarWithinOverlay(bar, bars, col, startIdx, endIdx, overrides) {
  const el = bar.closest("#printRoot") || document.documentElement;
  const root = getComputedStyle(el);
  const insetAll = parseFloat(root.getPropertyValue("--tripbar-inset")) || 6;
  const insetL =
    overrides?.insetL !== undefined
      ? overrides.insetL
      : parseFloat(root.getPropertyValue("--tripbar-inset-left")) || insetAll;
  const insetR =
    overrides?.insetR !== undefined
      ? overrides.insetR
      : parseFloat(root.getPropertyValue("--tripbar-inset-right")) || insetAll;

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
          <div class="trip-chip conflict-indicator" data-tripkey="${tripKey}" style="margin-top:10px;" role="button" tabindex="0">
            <div class="title">⚠ ${title}</div>
            <div class="meta">${cust}${cust ? " • " : ""}Bus ${bus} • ${d1}${d2 && d2 !== "—" ? " / " + d2 : ""}</div>
          </div>
        `;
        })
        .join("");

      return `
      <div style="margin-top:${idx === 0 ? 0 : 14}px;">
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
      isMobileOnly() ? openTripDetailsModal(el.dataset.tripkey) : openTripForEdit(el.dataset.tripkey);

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
        <tr><td colspan="8" style="text-align:center;padding:40px;">
          <div style="color:var(--danger);margin-bottom:12px;">Failed to render schedule</div>
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
    const bars = r.querySelector(".row-bars");
    if (bars) barsByRowIdx.set(i, bars);
  }

  // Waiting List Mapping
  const waitingBody = document.getElementById("waitingBody");
  if (waitingBody && waitingBody.rows.length > 0) {
    const wRow = waitingBody.rows[0];
    const wBars = wRow.querySelector(".row-bars");
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
        bar.className = "trip-bar";
        bar.setAttribute("draggable", "false");

        // Helper: fixed slot row
        function makeRow(slotClass) {
          const el = document.createElement("div");
          el.className = `bar-row ${slotClass}`;
          return el;
        }

        // 7 fixed rows
        const r1 = makeRow("r1");
        const r2 = makeRow("r2");
        const r3 = makeRow("r3");
        const r4 = makeRow("r4");
        const r5 = makeRow("r5");
        const r6 = makeRow("r6");
        const r7 = makeRow("r7");

        // Row 1: Multi-bus badge (top-left) + Title
        const multiBadge = document.createElement("span");
        multiBadge.className = "trip-bar-multi-badge";
        multiBadge.setAttribute("aria-hidden", "true");
        r1.appendChild(multiBadge);
        const line1 = document.createElement("div");
        line1.className = "bar-title";
        r1.appendChild(line1);

        // Row 2: Customer (sub)
        const line2 = document.createElement("div");
        line2.className = "bar-sub";
        r2.appendChild(line2);

        // Row 3: Contact name (sub)
        const line3 = document.createElement("div");
        line3.className = "bar-sub bar-contact";
        r3.appendChild(line3);

        // Row 4: Time row (left/right)
        const timeRow = document.createElement("div");
        timeRow.className = "bar-time-row";
        const left = document.createElement("span");
        left.className = "bar-time left";
        const right = document.createElement("span");
        right.className = "bar-time right";
        timeRow.append(left, right);
        r4.appendChild(timeRow);

        // Row 5: Status icons
        const statusRow = document.createElement("div");
        statusRow.className = "bar-status-row";

        function makeMini(content, isIcon = false) {
          const b = document.createElement("span");
          b.className = "mini-badge";
          const g = document.createElement("span");
          if (isIcon) {
            g.className = "badge-glyph material-symbols-outlined badge-icon";
          } else {
            g.className = "badge-glyph";
          }
          g.textContent = content;
          b.appendChild(g);
          return b;
        }

        const bI = makeMini("description", true); // Itinerary
        const bC = makeMini("phone_enabled", true); // Contact
        const b$ = makeMini("request_quote", true); // Payment
        const bD = makeMini("person", true); // Driver
        const bInv = makeMini("receipt_long", true); // Invoice
        const invText = document.createElement("span");
        invText.className = "mini-badge-text";
        bInv.appendChild(invText);
        bInv._text = invText;

        bInv.classList.add("is-hidden"); // start hidden

        const barReqIcons = document.createElement("div");
        barReqIcons.className = "bar-req-icons";

        const statusBadgesWrap = document.createElement("div");
        statusBadgesWrap.className = "bar-status-badges";
        statusBadgesWrap.append(b$, bI, bC, bD, bInv);

        statusBadgesWrap.append(b$, bI, bC, bD, bInv, barReqIcons);
        statusRow.append(statusBadgesWrap);

        r5.appendChild(statusRow);

        // Row 6: Notes / pre-drivers
        const preDriversRow = document.createElement("div");
        preDriversRow.className = "bar-pre-drivers";
        r6.appendChild(preDriversRow);

        // Row 7: Drivers
        const driversRow = document.createElement("div");
        driversRow.className = "bar-drivers";
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
      if (bar._bInv) {
        const inv = String(t.invoiceStatus || "")
          .trim()
          .toLowerCase();
        const showInv = inv === "invoiced" || inv === "deposit received" || inv === "paid in full";

        bar._bInv.classList.toggle("is-hidden", !showInv);
        // set number inside badge (right after icon)
        const num = String(t.invoiceNumber || "").trim();
        if (bar._bInv._text) bar._bInv._text.textContent = num;

        // only make it "pill style" when we actually have a number to show
        bar._bInv.classList.toggle("has-text", showInv && !!num);
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
          span.className = "bar-req-icon material-symbols-outlined";
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
      bar.classList.remove("color-green", "color-yellow", "color-gray", "color-violet", "color-pink");
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
          bar._right.textContent = "";
        } else {
          bar._left.textContent = tDep || "TBD";
          bar._right.textContent = tArr || "TBD";
        }
      } else {
        // Multi-Day:
        // Left side shows Dep Time (only if this bar is the trip start)
        // Right side shows Arr Time (only if this bar is the trip end)
        if (isStartDay) {
          bar._left.textContent = formatTime12(depTime) || "TBD";
        } else {
          bar._left.textContent = "";
        }

        if (isEndDay) {
          bar._right.textContent = formatTime12(arrTime) || "TBD";
        } else {
          bar._right.textContent = "";
        }
      }

      bar._preDrivers.textContent = t.notes ? clipText(t.notes, 500) : "";

      bar._drivers.innerHTML = `
            <span class="driver">${escHtml(d1)}</span>
            ${d2 && d2 !== "—" ? `<span class="driver">${escHtml(d2)}</span>` : ""}
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

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  for (const dStr of weekDates) {
    // dStr is YYYY-MM-DD
    // We can parse it to get the day of week, or use the index if we trust standard alignment.
    // Safer to parse:
    const dObj = parseYMD(dStr);
    const dayIdx = dObj.getDay(); // 0=Sun, 1=Mon...

    const th = document.createElement("th");
    th.textContent = dayLabels[dayIdx];
    dom.driverWeekHeadRow.appendChild(th);
  }

  const thCount = document.createElement("th");
  thCount.textContent = "";
  thCount.className = "driver-week-count";
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

  const driverNames = (state.driversList || []).map((d) => String(d.driverName || "").trim()).filter(Boolean);

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
          let cls = "driver-cell-off";
          if (on) cls = "driver-cell-on";
          else if (unavailable) cls = "driver-cell-unavailable";

          return `<td class="${cls}" data-driver="${escHtml(name)}" data-date="${dStr}"></td>`;
        })
        .join("");

      return `
<tr>
<td>${escHtml(name)}</td>
${cells}
<td class="driver-week-count">${set.size}</td>
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
    panelStart.classList.remove("panel-collapsed");
  } else if (panel === "right" && panelEndEl) {
    panelEndEl.appendChild(config.card);
    panelEndEl.classList.remove("panel-collapsed");
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
    panelStart.classList.add("panel-collapsed");
  }
  if (panelEndEl && !rightHasCards) {
    panelEndEl.classList.add("panel-collapsed");
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
      const leftCard = Object.keys(state.cardPanelAssignments).find((k) => state.cardPanelAssignments[k] === "left");
      if (leftCard) {
        hideCard(leftCard);
      }
      showCardInPanel(cardType, "left");
    }
  }
}

function updateNotesWeekTitle() {
  if (!dom.notesWeekTitle) return;
  const start = new Date(state.currentDate);
  const end = addDays(start, 6);
  const fmt = (d) => `${CONFIG.MONTHS[d.getMonth()]} ${d.getDate()}`;
  dom.notesWeekTitle.textContent = `(${fmt(start)} – ${fmt(end)})`;
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

  panelStart.classList.toggle("panel-collapsed", !show);

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
    el.classList.toggle("is-empty", !v || v === "None");
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

    r.busSel.classList.toggle("is-hidden", !show);
    r.d1Sel.classList.toggle("is-hidden", !show);
    r.d2Sel.classList.toggle("is-hidden", !show);

    r.busSel.disabled = !enabled;
    r.d1Sel.disabled = !enabled;
    r.d2Sel.disabled = !enabled;

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

  ids.forEach((dayId, index) => {
    const date = addDays(state.currentDate, index);
    const th = document.getElementById(dayId);
    const dateSpan = th?.querySelector?.(".day-date");
    if (dateSpan) dateSpan.textContent = `${date.getDate()}`;

    const isToday = ymd(date) === todayYmd;
    th?.classList.toggle("day-today", isToday);

    // Update body cells in this column too
    document.querySelectorAll(`td[data-day-id="${dayId}"]`).forEach((td) => {
      td.classList.toggle("day-today", isToday);
    });
  });

  const { start, end } = getWeekRange();
  const key = weekKey(start, end);
  const cached = getCachedWeek(key);

  // Update notes week title if notes panel is visible
  if (!dom.notesCard?.classList.contains("is-hidden")) {
    updateNotesWeekTitle();
  }

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
  setSelectToPlaceholder("itineraryStatus");
  setSelectToPlaceholder("contactStatus");
  setSelectToPlaceholder("paymentStatus");
  setSelectToPlaceholder("driverStatus");
  setSelectToPlaceholder("invoiceStatus");

  dom.busesNeeded.value = "";
  updateBusRowVisibility();
  syncBusPanelState();
  refreshBusSelectOptions();

  ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus", "invoiceStatus"].forEach((id) =>
    updateStatusSelect($(id)),
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
    const wrapClass = itemClass ? `detail-grid-item ${itemClass}` : "detail-grid-item";
    return `<div class="${wrapClass}"><span class="toggle-pill-grid-label">${label}:</span> <span class="detail-value">${display}</span></div>`;
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
    const wrapClass = extraClass ? `detail-grid-item ${extraClass}` : "detail-grid-item";
    const valueSpan = cls
      ? `<span class="detail-value ${cls}">${display}</span>`
      : `<span class="detail-value">${display}</span>`;
    return `<div class="${wrapClass}"><span class="toggle-pill-grid-label">${label}:</span> ${valueSpan}</div>`;
  }

  function section(title) {
    return `<div class="detail-section-title toggle-pill-grid-label">${title}</div>`;
  }

  html += `<div class="detail-meta-grid detail-status-grid">`;
  html += rowStatus("Itinerary Status", t.itineraryStatus, "itineraryStatus", "detail-hide-mobile");
  html += rowStatus("Contact Status", t.contactStatus, "contactStatus", "detail-hide-mobile");
  html += rowStatus("Approval Status", t.paymentStatus, "paymentStatus", "detail-hide-mobile");
  html += rowStatus("Driver Status", t.driverStatus, "driverStatus", "detail-hide-mobile");
  html += rowStatus("Invoice Status", t.invoiceStatus, "invoiceStatus", "detail-hide-mobile");
  html += detailGridItem("Invoice Number", t.invoiceNumber, "detail-hide-mobile");
  html += detailGridItem("Contact", t.contactName);
  html += detailGridItem("Phone", t.phone);
  html += `</div>`;

  html += `<div class="detail-divider"></div>`;

  if (t.itinerary) {
    html += `<div class="detail-text pre-wrap detail-itinerary-scroll">${escHtml(t.itinerary)}</div>`;
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
      (cachedTrip.destination || cachedTrip.customer || cachedTrip.departureDate || cachedTrip.arrivalDate);

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
// 29) TRIP OPEN (DESKTOP EDIT)
// ======================================================
async function openTripForEdit(tripKey) {
  if (isMobileOnly()) return openTripDetailsModal(tripKey);

  // Loading Overlay Logic
  const overlay = document.getElementById("loadingOverlay");
  const bar = overlay?.querySelector(".loading-bar__inner");
  if (overlay) overlay.hidden = false;
  if (bar) bar.style.width = "0%";

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

    const [tripResp, assignResp] = await Promise.all([api.getTrip(tripKey), api.getBusAssignments(tripKey)]);

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
    $("arrivalTime").value = normalizeTime(t.arrivalTime) || "";

    $("itineraryStatus").value = t.itineraryStatus || "";
    $("contactStatus").value = t.contactStatus || "";
    $("paymentStatus").value = t.paymentStatus || "";
    $("driverStatus").value = t.driverStatus || "";
    $("invoiceStatus").value = t.invoiceStatus || "";
    $("invoiceNumber").value = t.invoiceNumber || "";
    $("tripColor").value = t.tripColor || "";
    setRequirementTogglesFromTrip(t);

    ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus", "invoiceStatus"].forEach((id) =>
      updateStatusSelect($(id)),
    );
    updateInvoiceNumberVisibility();

    dom.itineraryField.value = t.itinerary || "";
    $("notes").value = t.notes || "";
    $("comments").value = t.comments || "";

    setBusesNeededAndSync(t.busesNeeded ? String(t.busesNeeded) : "");
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
    syncBusPanelState();
    syncBusSelectEmptyState();
    refreshEmptyStateUI();

    if (bar) bar.style.width = "100%";

    // Slight delay to show 100% before hiding
    setTimeout(() => {
      if (overlay) overlay.hidden = true;
    }, 500);

    $("destination")?.focus?.({ preventScroll: true });
  } catch (e) {
    if (overlay) overlay.hidden = true;
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

  const { action, tripKey, originalTrips, originalTripByKey, originalAssignments } = state.pendingWrite;

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
        toast("Save could not be verified — changes were rolled back. Please try saving again.", "danger", 3500);
      }
    }
  } catch (e) {
    console.error(e);
    // On verification error, always restore previous state so UI does not
    // show trips that may not exist on the server.
    rollbackState();
    toast("Connection error during verification — schedule restored to the previous state.", "danger", 3000);
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
 * Build Legal-landscape print layout by cloning the live week-table.
 * Layout: 2 pages, 5 bus rows each, 2 empty note rows below each bus.
 * Trip bars are in the clone; repositionBarsForPrint sets pixel-based left/width.
 */
function buildPrintScheduleTwoPages() {
  const printRoot = document.getElementById("printRoot");
  if (!printRoot) return;

  const weekTable = document.querySelector(".week-table");
  if (!weekTable) return;

  const weekTitle = document.getElementById("headerWeek")?.textContent || "Schedule";

  /** Reposition trip bars using fixed column metrics for print alignment */
  function repositionBarsForPrint(table, col) {
    if (!col) return;
    const body = table.querySelector("tbody:not([hidden])");
    if (!body) return;
    const total = Math.round(col.total);
    body.querySelectorAll(".row-bars").forEach((bars) => {
      bars.style.width = `${total}px`;
      bars.querySelectorAll(".trip-bar").forEach((bar) => {
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
          notesRow.className = "notes-row";
          const tdEmpty = document.createElement("td");
          tdEmpty.className = "bus-id-cell";
          notesRow.appendChild(tdEmpty);
          for (let i = 0; i < 7; i++) {
            const td = document.createElement("td");
            td.className = "day-cell";
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
        .querySelectorAll(".nav-controls, .date-input-overlay, input.weekpicker, .weekpicker-trigger-wrap")
        .forEach((el) => el.remove());
      const topbarLogo = document.querySelector(".logo-wrap");
      const headerInner = headerClone.querySelector(".agenda-header-inner");
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
  const busColWidth = 50;
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

  const weekTable = document.querySelector(".week-table");
  if (!weekTable) return;

  const weekTitle = document.getElementById("headerWeek")?.textContent || "Schedule";

  function repositionBarsForPrint(table, col) {
    if (!col) return;
    const body = table.querySelector("tbody:not([hidden])");
    if (!body) return;
    const total = Math.round(col.total);
    body.querySelectorAll(".row-bars").forEach((bars) => {
      bars.style.width = `${total}px`;
      bars.querySelectorAll(".trip-bar").forEach((bar) => {
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

  function computePrintScale() {
    const card = printRoot.querySelector(".print-card");
    if (!card) return 1;
    const contentW = card.scrollWidth || card.offsetWidth;
    const contentH = card.scrollHeight || card.offsetHeight;
    // Letter printable area (approx 10in x 7.5in) -> 960x720
    const letterPrintableW = 960;
    const letterPrintableH = 720;
    const scaleW = contentW > 0 ? letterPrintableW / contentW : 1;
    const scaleH = contentH > 0 ? letterPrintableH / contentH : 1;
    const scale = Math.min(1, scaleW, scaleH) * 0.98;
    return Math.max(0.4, Math.min(1, scale));
  }

  function makeFullTable() {
    const clone = weekTable.cloneNode(true);
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

    const body = clone.querySelector("tbody:not([hidden])");
    if (!body) return null;

    clone.querySelectorAll("tbody[hidden]").forEach((el) => el.remove());

    // Add 2 empty note rows under each bus row
    const rows = Array.from(body.querySelectorAll("tr"));
    rows.forEach((tr) => {
      for (let j = 0; j < 2; j++) {
        const notesRow = document.createElement("tr");
        notesRow.className = "notes-row";
        const tdEmpty = document.createElement("td");
        tdEmpty.className = "bus-id-cell";
        notesRow.appendChild(tdEmpty);
        for (let i = 0; i < 7; i++) {
          const td = document.createElement("td");
          td.className = "day-cell";
          notesRow.appendChild(td);
        }
        tr.parentNode.insertBefore(notesRow, tr.nextSibling);
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
        .querySelectorAll(".nav-controls, .date-input-overlay, input.weekpicker, .weekpicker-trigger-wrap")
        .forEach((el) => el.remove());
      const topbarLogo = document.querySelector(".logo-wrap");
      const headerInner = headerClone.querySelector(".agenda-header-inner");
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
  printRoot.classList.add("print-mode-letter-full");
  printRoot.appendChild(makeFullTable());

  // Fixed metrics matched to the CSS widths
  const printCardWidth = 1400;
  const busColWidth = 52;
  const dayColTotal = 1400 - busColWidth;
  const dayColWidth = dayColTotal / 7;
  const colMetrics = {
    starts: Array.from({ length: 7 }, (_, i) => i * dayColWidth),
    widths: Array(7).fill(dayColWidth),
    total: dayColWidth * 7,
  };

  printRoot.classList.remove("is-hidden");
  printRoot.style.cssText = `position:absolute;left:-9999px;visibility:hidden;width:${printCardWidth}px;`;

  // Force layout recalculation
  void printRoot.offsetHeight;

  printRoot.querySelectorAll(".print-table").forEach((t) => repositionBarsForPrint(t, colMetrics));
  printRoot.style.setProperty("--print-scale", String(computePrintScale()));

  printRoot.classList.add("is-hidden");
  printRoot.style.cssText = "";
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
  if (state.driversList.length) CACHE.set("cache_drivers", state.driversList, CONFIG.CACHE_TTL_DRIVERS);

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
        d.driverName && String(d.driverName).trim() ? String(d.driverName).trim() : String(d.driverId || "").trim(),
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
  const tripBar = e.target.closest(".trip-bar");

  if (tripBar) {
    if (isContext) e.preventDefault(); // Stop browser menu
    e.stopPropagation();

    const tripKey = tripBar.dataset.tripkey;
    if (!tripKey) return;

    showTripContextMenu(e.pageX, e.pageY, tripKey);
    return;
  }

  // 2. Check for Day Cell (Context Menu)
  const cell = e.target.closest("td.day-cell");
  if (cell) {
    if (isContext) e.preventDefault(); // Stop browser menu
    e.stopPropagation(); // Prevent immediate close via document listener

    // Get the bus ID from the row
    const tr = cell.closest("tr");
    if (!tr) return;

    let busId = "";
    const busCell = tr.querySelector(".bus-id-num");
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
  const containers = document.querySelectorAll(".week-table-container");
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
      } else {
        console.warn("Could not find select[name='bus1']");
      }

      // Trip Date
      const tripDateInput = document.getElementById("tripDate");
      if (tripDateInput) {
        tripDateInput.value = dateStr;
        tripDateInput.dispatchEvent(new Event("change")); // To auto-fill arrival
      }
    }
  });

  containers.forEach((container) => {
    // 1. Context Menu (Right Click) - Desktop & Mobile Long Press
    container.addEventListener("contextmenu", (e) => handleScheduleInteraction(e, true));

    // 2. Click (Tap) - Mobile Only
    container.addEventListener("click", (e) => {
      // Only handle Taps on touch devices
      if (isMobileOnly()) {
        handleScheduleInteraction(e, false);
      }
    });

    // Keep Enter/Space for accessibility (default to Edit for now, or open menu?)
    // Let's act like left click -> Open Menu
    container.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const bar = e.target.closest(".trip-bar");
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
// 36) EVENTS
// ======================================================
function wireEvents() {
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
  ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus"].forEach((id) => {
    const el = $(id);
    updateStatusSelect(el);
    el.addEventListener("change", () => updateStatusSelect(el));
  });

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
    if (td.classList.contains("driver-cell-on")) return;

    state.dragSelection.active = true;
    state.dragSelection.driver = td.dataset.driver;
    state.dragSelection.mode = td.classList.contains("driver-cell-unavailable") ? "remove" : "add";
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
      if (td.classList.contains("driver-cell-on")) return;

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
        toast(mode === "add" ? "Marked as unavailable ✓" : "Marked as available ✓", "success", 1500);
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
      td.className = "driver-cell-unavailable";
      (state.unavailabilityByDriver[driver] ||= {})[date] = true;
    } else {
      td.className = "driver-cell-off";
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
    $("arrivalTime").value = normalizeTime($("arrivalTime").value);

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
      // Focus first bus select for convenience
      const firstBusRow = state.busRows[0];
      firstBusRow?.busSel?.focus?.();
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

    // Status dropdowns
    ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus", "invoiceStatus"].forEach((id) =>
      updateStatusSelect($(id)),
    );
    updateInvoiceNumberVisibility();

    // Bus panel
    dom.busesNeeded.value = "";
    updateBusRowVisibility();
    syncBusPanelState();
    refreshBusSelectOptions();

    // Form has just been reset after save/delete; treat as clean.
    state.tripFormDirty = false;
  }

  function clearCacheForCurrentView() {
    const { start, end } = getWeekRange();
    const cacheKey = "week_" + weekKey(start, end);
    state.weekCache.delete(cacheKey);
    CACHE.remove(cacheKey);
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
    if (!dom.settingsMenu.hidden && !dom.settingsMenu.contains(e.target) && !dom.settingsBtn.contains(e.target)) {
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
    if (e.target.closest(".dropdown-item")) {
      dom.settingsMenu.hidden = true;
      dom.settingsBtn.setAttribute("aria-expanded", "false");
    }
  });
}

// ======================================================
// 38) BOOT
// ======================================================
(function boot() {
  try {
    const style = document.createElement("style");
    style.textContent = `
.week-table-container.is-loading-bars .trip-bar { opacity: 0.18; pointer-events: none; }
`;
    document.head.appendChild(style);
  } catch {}

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

  const tableWrap = document.querySelector(".week-table-container");
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
      state.driversList = [{ driverName: "None" }, { driverName: "Driver A" }, { driverName: "Driver B" }];
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
