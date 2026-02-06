// ======================================================
// 1) THEME
// ======================================================
function initThemeSystem() {
  const html = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeText = document.getElementById("themeText");

  const savedTheme = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-theme", savedTheme);

  // Icon Handling
  const iconSpan = themeToggle?.querySelector("span");

  const updateIcon = (theme) => {
    if (!iconSpan) return;
    // Light theme -> show 'dark_mode' (moon) to indicate action to switch to dark
    // Dark theme -> show 'light_mode' (sun) to indicate action to switch to light
    iconSpan.textContent = theme === "light" ? "dark_mode" : "light_mode";
  };

  // Initial state
  updateIcon(savedTheme);

  themeToggle?.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    updateIcon(newTheme);

    if (themeText) themeText.textContent = newTheme === "light" ? "Light" : "Dark";
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

  weekPicker: $("weekPicker"),
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
  schedulerLayout: $("schedulerLayout"),
  tripScheduler: $("tripScheduler"),

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
  waitingCard: $("waitingCard"),

  // Settings Menu
  settingsBtn: $("settingsBtn"),
  settingsMenu: $("settingsMenu"),
  todayBtn2: $("todayBtn2"),
  themeToggle: $("themeToggle"),
  themeText2: $("themeText2"),
  printBtn2: $("printBtn2"),
  weekSun2: $("weekSun2"),
  weekMon2: $("weekMon2"),
  refreshBtn2: $("refreshBtn2"),
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
  
  // Abort controller for cancelling in-flight requests on week change
  activeAbortController: null,
  
  // Flag to prevent duplicate event listener wiring
  formListenersWired: false,
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
  return Math.max(0, (rowH - stackH) / 2);
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

  return { ok, trips, assignments, weekNotes, error: resp?.error };
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
}

/**
 * Retry wrapper with exponential backoff
 * Now works better with fetch's faster error detection
 * Includes total timeout to prevent excessive operation duration
 */
async function withRetry(
  fn,
  { tries = 3, baseDelayMs = 350, maxDelayMs = 2000, jitter = 0.25, totalTimeoutMs = 15000, shouldRetry = (err) => true } = {},
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
};

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
    else if (v === "confirmed") el.classList.add("status-confirmed");
    else el.classList.add("status-ok"); // Driver Info Sent
    return;
  }

  if (id === "paymentStatus") {
    if (v === "pending") el.classList.add("status-pending");
    else if (v === "signed contract" || v === "po received" || v === "deposit received")
      el.classList.add("status-blue");
    else el.classList.add("status-ok");
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
    "driverStatus",
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
      el.addEventListener("input", () => syncOne(el));
      el.addEventListener("change", () => syncOne(el));
      el.addEventListener("blur", () => syncOne(el));
    });

    form.addEventListener("reset", () => setTimeout(() => fields.forEach(syncOne), 0));
  }
}

// ======================================================
// 14) WEEK START UI + HEADER ORDER
// ======================================================
function syncWeekStartUI() {
  const isMon = state.weekStartsOnMonday;

  if (dom.weekStartMonBtn) dom.weekStartMonBtn.setAttribute("aria-pressed", isMon ? "true" : "false");
  if (dom.weekStartSunBtn) dom.weekStartSunBtn.setAttribute("aria-pressed", isMon ? "false" : "true");

  // Update dropdown items
  if (dom.weekMon2) dom.weekMon2.classList.toggle("is-active", isMon);
  if (dom.weekSun2) dom.weekSun2.classList.toggle("is-active", !isMon);
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

  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  const monthLong = (d) => d.toLocaleDateString("en-US", { month: "long" });

  let title = "";

  if (sameMonth && sameYear) {
    title = `${monthLong(start)} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  } else if (sameYear) {
    title = `${monthLong(start)} ${start.getDate()} – ${monthLong(end)} ${end.getDate()}, ${start.getFullYear()}`;
  } else {
    title =
      `${monthLong(start)} ${start.getDate()}, ${start.getFullYear()} – ` +
      `${monthLong(end)} ${end.getDate()}, ${end.getFullYear()}`;
  }

  const headerWeek = document.getElementById("headerWeek");
  if (headerWeek) headerWeek.textContent = title;
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
      icon.className = "bus-sleeper material-symbols-rounded";
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
      tr.appendChild(td);
    }

    tr.cells[1].classList.add("week-start-cell");

    const bars = document.createElement("div");
    bars.className = "row-bars";
    tr.cells[1].appendChild(bars);

    dom.agendaBody.appendChild(tr);
  });

  // WAITING LIST ROW -> Render into separate table
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
    tdBus.innerHTML = `<div class="bus-id-wrap"><span class="material-symbols-outlined" style="font-size: 24px;">pending_actions</span></div>`;
    tr.appendChild(tdBus);

    for (let i = 0; i < 7; i++) {
      const td = document.createElement("td");
      td.className = "day-cell";
      td.dataset.dayId = dayIds[i];
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
  const okWait = waitingBody && waitingBody.rows.length === 1;

  if (!okMain || !okWait) buildAgendaRows();

  return dom.agendaBody.rows.length === expected;
}

function getDayColumnMetricsRelativeToRows() {
  const firstBodyRow = dom.agendaBody?.rows?.[0];
  if (!firstBodyRow || firstBodyRow.cells.length < 8) return null;

  const startCell = firstBodyRow.cells[1];
  const baseRect = startCell.getBoundingClientRect();

  const starts = [];
  const widths = [];

  for (let i = 1; i <= 7; i++) {
    const cell = firstBodyRow.cells[i];
    if (!cell) continue;

    const r = cell.getBoundingClientRect();
    starts.push(r.left - baseRect.left);
    widths.push(r.width);
  }

  return { starts, widths };
}

function getColMetricsCached() {
  const firstBodyRow = dom.agendaBody?.rows?.[0];
  if (!firstBodyRow || firstBodyRow.cells.length < 8) return null;

  const startCell = firstBodyRow.cells[1];
  const r = startCell.getBoundingClientRect();
  const key = `${r.left}:${r.width}:${dom.agendaBody?.rows?.length || 0}`;

  if (state.lastColMetrics?.key === key) return state.lastColMetrics.col;

  const col = getDayColumnMetricsRelativeToRows();
  if (!col) return null;
  const total = col.widths.reduce((a, b) => a + (b || 0), 0);

  state.lastColMetrics = { key, col: { ...col, total } };
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

function positionBarWithinOverlay(bar, bars, col, startIdx, endIdx) {
  const inset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tripbar-inset")) || 6;

  const leftPx = (col.starts[startIdx] ?? 0) + inset;

  let spanW = 0;
  for (let i = startIdx; i <= endIdx; i++) spanW += col.widths[i] ?? 0;

  let widthPx = Math.max(0, spanW - inset * 2);
  const max = Math.max(0, col.total ?? col.widths.reduce((a, b) => a + (b || 0), 0));
  const EPS = 1;

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
  if (!conflicts || conflicts.length === 0) {
    dom.conflictPanel.style.display = "none";
    dom.conflictList.innerHTML = "";
    return;
  }

  dom.conflictPanel.style.display = "block";

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
    console.error('renderAgenda failed:', err);
    // Show error state with retry option
    if (dom.agendaBody) {
      dom.agendaBody.innerHTML = `
        <tr><td colspan="8" style="text-align:center;padding:40px;">
          <div style="color:var(--danger);margin-bottom:12px;">Failed to render schedule</div>
          <button onclick="location.reload()" class="btn">Reload Page</button>
        </td></tr>
      `;
    }
    toast('Render error - try refreshing', 'danger', 3000);
  }
}

function _renderAgendaInner() {
  if (!ensureAgendaGrid()) return;

  state.pendingConflictJob = null;

  clearConflictStyles();
  showConflictsPanel([]);
  dom.conflictBadge.style.display = "none";

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

    for (const a of assigns) {
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

        const line1 = document.createElement("div");
        line1.className = "bar-title";

        const line2 = document.createElement("div");
        line2.className = "bar-sub";

        const line3 = document.createElement("div");
        line3.className = "bar-sub bar-contact";

        const timeRow = document.createElement("div");
        timeRow.className = "bar-time-row";
        const left = document.createElement("span");
        left.className = "bar-time left";
        const right = document.createElement("span");
        right.className = "bar-time right";
        timeRow.append(left, right);

        const statusRow = document.createElement("div");
        statusRow.className = "bar-status-row";

        function makeMini(letter) {
          const b = document.createElement("span");
          b.className = "mini-badge";
          const g = document.createElement("span");
          g.className = "badge-glyph";
          g.textContent = letter;
          b.appendChild(g);
          return b;
        }

        const bI = makeMini("I");
        const bC = makeMini("C");
        const b$ = makeMini("$");
        const bD = makeMini("D");
        statusRow.append(bI, bC, b$, bD);

        const preDriversRow = document.createElement("div");
        preDriversRow.className = "bar-sub bar-pre-drivers";

        const driversRow = document.createElement("div");
        driversRow.className = "bar-sub bar-drivers";

        bar.append(line1, line2, line3, timeRow, statusRow, preDriversRow, driversRow);

        bar._line1 = line1;
        bar._line2 = line2;
        bar._line3 = line3;
        bar._left = left;
        bar._right = right;
        bar._bI = bI;
        bar._bC = bC;
        bar._b$ = b$;
        bar._bD = bD;
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
        const pending = s === "pending";
        const blue = s === "signed contract" || s === "po received" || s === "deposit received" || s === "confirmed";
        const yellow = s === "assigned";

        badgeEl.classList.toggle("is-pending", pending);
        badgeEl.classList.toggle("is-blue", blue);
        badgeEl.classList.toggle("is-yellow", yellow);
        badgeEl.classList.toggle("is-ok", !pending && !blue && !yellow && !!s);
      }

      if (bar._bI) setBadge(bar._bI, t.itineraryStatus);
      if (bar._bC) setBadge(bar._bC, t.contactStatus);
      if (bar._b$) setBadge(bar._b$, t.paymentStatus);
      if (bar._bD) setBadge(bar._bD, t.driverStatus);

      bar.classList.toggle("cont-left", continuesLeft);
      bar.classList.toggle("cont-right", continuesRight);

      const pay = String(t.paymentStatus || "").toLowerCase();
      bar.classList.toggle("unconfirmed", pay === "pending");

      const ds = String(t.driverStatus || "")
        .trim()
        .toLowerCase();
      bar.classList.toggle("driverstatus-pending", ds === "pending");
      bar.classList.toggle("driverstatus-assigned", ds === "assigned");
      bar.classList.toggle("driverstatus-confirmed", ds === "confirmed" || ds === "driver info sent");

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

      bar._preDrivers.textContent = t.notes ? clipText(t.notes, 28) : "";

      bar._drivers.innerHTML = `
            <span class="driver">${escHtml(d1)}</span>
            ${d2 && d2 !== "—" ? `<span class="driver">${escHtml(d2)}</span>` : ""}
        `;

      positionBarWithinOverlay(bar, bars, col, startIdx, endIdx);

      const itin = clipText(t.itinerary, 1200);
      const namePhone = [name, phone].filter(Boolean).join(" • ");
      bar.title = `${namePhone || "—"}\n\nITINERARY\n${itin || "—"}`;

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

    for (const bar of list) {
      const lane = Number(bar.dataset.lane);
      if (!Number.isFinite(lane)) continue;
      bar.style.top = `${top0 + lane * step}px`;
    }
  }

  for (const [ri, frag] of fragByRow) {
    barsByRowIdx.get(ri)?.appendChild(frag);
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
    dom.conflictBadge.style.display = conflicts.length ? "inline-block" : "none";
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
      dom.conflictBadge.style.display = conflicts.length ? "inline-block" : "none";
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
        .map((_, idx) => {
          const on = set.has(idx);
          return `<td class="${on ? "driver-cell-on" : "driver-cell-off"}"></td>`;
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

  const leftPanelVisible = !dom.tripScheduler.classList.contains("is-hidden");
  const driverCardVisible = !dom.driverWeekCard.classList.contains("is-hidden");

  if (leftPanelVisible && driverCardVisible) renderDriverWeekGrid();
}

// ======================================================
// 22) LEFT PANEL MODE + DESKTOP ENFORCEMENT
// ======================================================
function setLeftCardMode(mode) {
  const showTrip = mode === "trip";
  const showDrivers = mode === "drivers";
  const showNotes = mode === "notes";

  dom.tripInfoCard.classList.toggle("is-hidden", !showTrip);
  dom.driverWeekCard.classList.toggle("is-hidden", !showDrivers);
  dom.notesCard.classList.toggle("is-hidden", !showNotes);

  // Update notes week title when showing notes
  if (showNotes) updateNotesWeekTitle();

  scheduleAgendaReflow();
  if (showDrivers) updateDriverWeekIfVisible();
}

function updateNotesWeekTitle() {
  if (!dom.notesWeekTitle) return;
  const start = new Date(state.currentDate);
  const end = addDays(start, 6);
  const fmt = (d) => `${CONFIG.MONTHS[d.getMonth()]} ${d.getDate()}`;
  dom.notesWeekTitle.textContent = `(${fmt(start)} – ${fmt(end)})`;
}

function setLeftPanelMode(mode) {
  const showLeft = mode !== "off";

  dom.tripScheduler.classList.toggle("is-hidden", !showLeft);
  dom.schedulerLayout.classList.toggle("is-collapsed", !showLeft);

  if (showLeft) setLeftCardMode(mode);

  dom.tripInputBtn.setAttribute("aria-pressed", mode === "trip" ? "true" : "false");
  dom.driversBtn.setAttribute("aria-pressed", mode === "drivers" ? "true" : "false");
  dom.notesBtn.setAttribute("aria-pressed", mode === "notes" ? "true" : "false");

  if (dom.agendaBody?.rows?.length) scheduleAgendaReflow();
}

function enforceDesktopEditing() {
  const mobile = isMobileOnly();

  if (dom.tripInputBtn) {
    dom.tripInputBtn.disabled = mobile;
    dom.tripInputBtn.title = mobile ? "Trip editing is available on desktop" : "Trip Editor";
    dom.tripInputBtn.setAttribute("aria-disabled", mobile ? "true" : "false");
  }

  if (mobile) setLeftPanelMode("off");
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

    r.busSel.style.display = show ? "" : "none";
    r.d1Sel.style.display = show ? "" : "none";
    r.d2Sel.style.display = show ? "" : "none";

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
  h1.className = "bus-assign__head";
  h1.textContent = "Bus";

  const h2 = document.createElement("div");
  h2.className = "bus-assign__head";
  h2.textContent = "Driver 1";

  const h3 = document.createElement("div");
  h3.className = "bus-assign__head";
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
  const selected = dom.weekPicker?.value ? new Date(dom.weekPicker.value + "T00:00:00") : new Date();

  state.currentDate = startOfWeek(selected);
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
    th?.classList.toggle("day-today", ymd(date) === todayYmd);
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
  
  const selected = dom.weekPicker?.value ? new Date(dom.weekPicker.value + "T00:00:00") : new Date();
  const moved = addDays(selected, direction * 7);
  if (dom.weekPicker) dom.weekPicker.value = toLocalDateInputValue(moved);
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

    setBarsHidden(true);

    if (!silent) toastProgress(10, "Preparing… 10%");

    clearConflictStyles();
    showConflictsPanel([]);
    dom.conflictBadge.style.display = "none";

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
    if (reqId === state.weekReqId) setBarsHidden(false);
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
  refreshEmptyStateUI();
  setModeNew();

  setSelectToPlaceholder("busesNeeded");
  setSelectToPlaceholder("itineraryStatus");
  setSelectToPlaceholder("contactStatus");
  setSelectToPlaceholder("paymentStatus");
  setSelectToPlaceholder("driverStatus");

  dom.busesNeeded.value = "";
  updateBusRowVisibility();
  syncBusPanelState();
  refreshBusSelectOptions();

  ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus"].forEach((id) => updateStatusSelect($(id)));
}

// ======================================================
// 27) ITINERARY MODAL
// ======================================================
function openItineraryModal() {
  dom.itineraryModalField.value = dom.itineraryField.value || "";
  dom.itineraryModal.hidden = false;
  dom.itineraryModalField.focus();
}

function closeItineraryModal() {
  dom.itineraryField.value = dom.itineraryModalField.value || "";
  dom.itineraryField.dispatchEvent(new Event("input", { bubbles: true }));
  dom.itineraryModal.hidden = true;
}

// ======================================================
// 28) MOBILE TRIP DETAILS MODAL
// ======================================================
function renderTripDetailsModalFromData(t, assigns) {
  const lines = [];

  const depDate = String(t.departureDate || "").slice(0, 10);
  const arrDate = String(t.arrivalDate || "").slice(0, 10);
  const depTime = formatTime12(t.departureTime);
  const arrTime = formatTime12(t.arrivalTime);

  lines.push(`DESTINATION: ${t.destination || "—"}`);
  lines.push(`CUSTOMER: ${t.customer || "—"}`);
  lines.push(`CONTACT: ${t.contactName || "—"}`);
  lines.push(`PHONE: ${t.phone || "—"}`);
  lines.push("");
  lines.push(`DEPART: ${depDate || "—"} ${depTime ? `@ ${depTime}` : ""}`.trim());
  lines.push(`ARRIVE: ${arrDate || "—"} ${arrTime ? `@ ${arrTime}` : ""}`.trim());
  lines.push(`BUSES NEEDED: ${t.busesNeeded || "—"}`);
  lines.push("");
  lines.push(`ITINERARY STATUS: ${t.itineraryStatus || "—"}`);
  lines.push(`CONTACT STATUS: ${t.contactStatus || "—"}`);
  lines.push(`PAYMENT STATUS: ${t.paymentStatus || "—"}`);
  lines.push(`DRIVER STATUS: ${t.driverStatus || "—"}`);
  lines.push("");

  if (assigns && assigns.length) {
    lines.push("ASSIGNMENTS:");
    assigns.forEach((a) => {
      const n = a.busNumber ? `#${a.busNumber}` : "";
      const bus = a.busId ? `Bus ${a.busId}` : "Bus —";
      const d1 = a.driver1 && a.driver1 !== "None" ? a.driver1 : "—";
      const d2 = a.driver2 && a.driver2 !== "None" ? a.driver2 : "";
      lines.push(`  ${n} ${bus} • ${d1}${d2 ? " / " + d2 : ""}`.trim());
    });
    lines.push("");
  }

  lines.push("NOTES:");
  lines.push(t.notes ? String(t.notes) : "—");
  lines.push("");
  lines.push("COMMENTS:");
  lines.push(t.comments ? String(t.comments) : "—");
  lines.push("");
  lines.push("ITINERARY:");
  lines.push(t.itinerary ? String(t.itinerary) : "—");

  dom.tripDetailsBody.textContent = lines.join("\n");
  dom.tripDetailsModal.hidden = false;
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
      toastProgress(100, "Loaded ✓ 100%");
      toastHide(250);
      return;
    }

    toastProgress(30, "Fetching trip… 30%");

    const [tripResp, assignResp] = await Promise.all([api.getTrip(k), api.getBusAssignments(k)]);

    if (!tripResp?.ok) throw new Error(tripResp?.error || "Trip not found");

    t = tripResp.trip || {};
    assigns = assignResp?.ok && Array.isArray(assignResp.assignments) ? assignResp.assignments : [];

    toastProgress(70, "Rendering… 70%");
    renderTripDetailsModalFromData(t, assigns);

    toastProgress(100, "Loaded ✓ 100%");
    toastHide(250);
  } catch (e) {
    console.error(e);
    toast("Could not load details", "danger", 2200);
  }
}

function closeTripDetailsModal() {
  dom.tripDetailsModal.hidden = true;
}

// ======================================================
// 29) TRIP OPEN (DESKTOP EDIT)
// ======================================================
async function openTripForEdit(tripKey) {
  if (isMobileOnly()) return openTripDetailsModal(tripKey);

  toastShow("Loading trip… 0%", "loading");
  toastProgress(0);
  dom.saveBtn.disabled = true;

  try {
    toastProgress(15, "Fetching trip… 15%");

    const [tripResp, assignResp] = await Promise.all([api.getTrip(tripKey), api.getBusAssignments(tripKey)]);

    toastProgress(70, "Populating form… 70%");
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
    $("tripColor").value = t.tripColor || "";

    ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus"].forEach((id) => updateStatusSelect($(id)));

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

    toastProgress(100, "Loaded ✓ 100%");
    toastHide(400);

    toast("Trip loaded ✓", "success", 900);
    $("destination")?.focus?.({ preventScroll: true });
  } catch (e) {
    console.error(e);
    toast("Could not load trip", "danger", 2200);
    alert("Could not open trip for editing.");
  } finally {
    dom.saveBtn.disabled = false;
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

  const { action, tripKey } = state.pendingWrite;

  startProgressCreep({ from: 70, to: 95, label: "Verifying… " });

  const delays = [500, 1000, 1500, 2000, 3000, 4000, 5000]; // Extended polling (~17s total)

  let exists = false;
  let serverTrip = null;

  try {
    // DELETE: Wait for trip to disappear
    if (action === "delete") {
      for (let i = 0; i < delays.length; i++) {
        const resp = await api.getTrip(tripKey);
        exists = !!(resp?.ok && resp.trip);
        if (!exists) break; // It's gone! Success.
        await delay(delays[i]);
      }

      if (!exists) {
        toastProgress(100, "Deleted ✓ 100%");
        toastHide(300);
        toast("Trip deleted ✓", "success", 1400);

        dom.tripForm.reset();
        setModeNew();

        setSelectToPlaceholder("busesNeeded");
        setSelectToPlaceholder("itineraryStatus");
        setSelectToPlaceholder("contactStatus");
        setSelectToPlaceholder("paymentStatus");
        setSelectToPlaceholder("driverStatus");

        dom.busesNeeded.value = "";
        updateBusRowVisibility();
        refreshBusSelectOptions();

        state.weekCache.clear();
        await refreshWeekData({ silent: true });
      } else {
        toast("Delete may have failed", "danger", 2400);
        dom.action.value = dom.tripKey.value ? "update" : "create";
      }
    } else {
      // CREATE/UPDATE: Wait for trip to appear
      for (let i = 0; i < delays.length; i++) {
        const resp = await api.getTrip(tripKey);
        exists = !!(resp?.ok && resp.trip);
        serverTrip = exists ? resp.trip : null;
        if (exists) break; // Found it!
        await delay(delays[i]);
      }

      if (exists) {
        const serverTripId = serverTrip?.tripId ? String(serverTrip.tripId) : "";

        toastProgress(100, "Saved ✓ 100%");
        toastHide(300);
        toast("Saved ✓", "success", 1200);

        // Update UI with server data
        state.weekCache.clear();
        await refreshWeekData({ silent: true });

        // Cleanup
        dom.tripForm.reset();
        refreshEmptyStateUI();
        setModeNew();

        setSelectToPlaceholder("busesNeeded");
        setSelectToPlaceholder("itineraryStatus");
        setSelectToPlaceholder("contactStatus");
        setSelectToPlaceholder("paymentStatus");
        setSelectToPlaceholder("driverStatus");

        dom.busesNeeded.value = "";
        updateBusRowVisibility();
        syncBusPanelState();
        refreshBusSelectOptions();

        ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus"].forEach((id) =>
          updateStatusSelect($(id)),
        );
      } else {
        toast("Saved (syncing…) — refresh if needed", "warning", 2200);
      }
    }
  } catch (e) {
    console.error(e);
    toast("Could not verify save/delete", "danger", 2400);
  } finally {
    stopProgressCreep();
    clearVerifyFallback();
    state.pendingWrite = null;
    dom.saveBtn.disabled = false;
    dom.action.value = dom.tripKey.value ? "update" : "create";
  }
}

// ======================================================
// 31) TOP CONTROLS MOVE (DESKTOP)
// ======================================================

// ======================================================
// 32) PRINT
// ======================================================
function buildPrintScheduleTwoPages() {
  const printRoot = document.getElementById("printRoot");
  if (!printRoot) return;

  const weekTable = document.querySelector(".week-table");
  if (!weekTable) return;

  const weekTitle = document.getElementById("headerWeek")?.textContent || "Schedule";

  function makeTableForRows(startIdx, endIdx) {
    const clone = weekTable.cloneNode(true);
    clone.querySelector("#agendaBody")?.removeAttribute("id");

    const body = clone.querySelector("tbody");
    if (!body) return clone;

    const rows = Array.from(body.querySelectorAll("tr"));
    rows.forEach((tr, idx) => {
      if (idx < startIdx || idx >= endIdx) tr.remove();
    });

    clone.classList.add("print-table");
    return clone;
  }

  const page1Table = makeTableForRows(0, 5);
  const page2Table = makeTableForRows(5, 10);

  const safeTitle = escHtml(weekTitle);
  printRoot.innerHTML = `
<div class="print-page">
  <div class="print-card">
    <div class="print-title">${safeTitle} — Buses 1–5</div>
  </div>
</div>
<div class="print-page">
  <div class="print-card">
    <div class="print-title">${safeTitle} — Buses 6–10</div>
  </div>
</div>
`;

  const pages = printRoot.querySelectorAll(".print-page .print-card");
  pages[0].appendChild(page1Table);
  pages[1].appendChild(page2Table);
}

function clearPrintRoot() {
  const printRoot = document.getElementById("printRoot");
  if (printRoot) printRoot.innerHTML = "";
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
function wireDelegatedBarEvents() {
  const containers = document.querySelectorAll(".week-table-container");
  if (!containers.length) return;

  containers.forEach((container) => {
    container.addEventListener("click", (e) => {
      const bar = e.target.closest(".trip-bar");
      if (!bar) return;

      const tripKey = bar.dataset.tripkey;
      if (!tripKey) return;

      if (isMobileOnly()) openTripDetailsModal(tripKey);
      else openTripForEdit(tripKey);
    });

    container.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const bar = e.target.closest(".trip-bar");
      if (!bar) return;

      e.preventDefault();
      const tripKey = bar.dataset.tripkey;
      if (!tripKey) return;

      openTripForEdit(tripKey);
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
  dom.weekPicker.addEventListener("change", updateWeekDates);

  dom.tripInputBtn.addEventListener("click", () => {
    if (isMobileOnly()) return;
    const isOn = dom.tripInputBtn.getAttribute("aria-pressed") === "true";
    setLeftPanelMode(isOn ? "off" : "trip");
  });

  dom.driversBtn.addEventListener("click", () => {
    const isOn = dom.driversBtn.getAttribute("aria-pressed") === "true";
    setLeftPanelMode(isOn ? "off" : "drivers");
  });

  dom.notesBtn.addEventListener("click", () => {
    const isOn = dom.notesBtn.getAttribute("aria-pressed") === "true";
    
    // Warn if closing with unsaved changes
    if (isOn && state.notesDirty) {
      if (!confirm("You have unsaved notes changes. Discard them?")) return;
      // Reset to saved value
      dom.scheduleNotes.value = state.savedNotesValue;
      state.notesDirty = false;
    }
    
    setLeftPanelMode(isOn ? "off" : "notes");
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
    if (dom.waitingCard) {
      dom.waitingCard.style.display = visible ? "block" : "none";
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
    const isVisible = dom.waitingCard.style.display !== "none";
    setWaitingListVisible(!isVisible);
  });

  syncWeekStartUI();
  // applyWeekStart moved to global scope
  // Old buttons (weekStartSunBtn) removed from DOM

  dom.itineraryBtn.addEventListener("click", openItineraryModal);
  dom.itineraryModal.addEventListener("click", (e) => {
    if (e.target.dataset.close !== undefined) closeItineraryModal();
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

  dom.agendaBody.addEventListener("click", (e) => {
    // Find if we clicked a day cell (but NOT a trip bar)
    const cell = e.target.closest("td.day-cell");
    if (!cell) return;
    if (e.target.closest(".trip-bar")) return; // Ignore if clicking a trip

    // Get the bus ID from the row
    const tr = cell.closest("tr");
    if (!tr) return;
    const busCell = tr.querySelector(".bus-id-num");
    const busId = busCell ? busCell.textContent.trim() : "";

    // Get the date using standard cellIndex
    // cellIndex 0 is bus-id-cell, so day 0 is cellIndex 1.
    const colIdx = cell.cellIndex;
    if (colIdx < 1) return;

    const dayIndex = colIdx - 1; // 0..6
    const weekDates = getWeekDates();

    // Safety check: ensure dayIndex is valid
    if (dayIndex < 0 || dayIndex >= weekDates.length) return;

    const dateStr = weekDates[dayIndex]; // YYYY-MM-DD

    if (busId && dateStr) {
      // Pre-fill "New Trip" form
      dom.newBtn.click();

      // Set Bus
      if (dom.busesNeeded) {
        // 1. Defaul to 1 bus
        dom.busesNeeded.value = "1";
        updateBusRowVisibility();
        syncBusPanelState();

        // 2. Set the first bus select to the chosen bus
        // We need to wait for the options? No, they should be there.
        // state.busRows is populated in initBusGrid()
        if (state.busRows && state.busRows.length > 0) {
          const firstRow = state.busRows[0];
          if (firstRow && firstRow.busSel) {
            // Try to set it
            // Check if option exists first to be safe, or just set it
            const opts = Array.from(firstRow.busSel.options);
            const match = opts.some((o) => o.value === busId);
            if (match) {
              firstRow.busSel.value = busId;
              syncBusSelectEmptyState(); // update UI color
            }
          }
        }
      }

      // Set Date
      if ($("tripDate")) {
        $("tripDate").value = dateStr;
        // Trigger change to update arrival date auto-fill logic
        $("tripDate").dispatchEvent(new Event("change", { bubbles: true }));
      }

      // Provide feedback
      // Simplified toast to confirm action
      toast(`New Trip: Bus ${busId} • ${formatDateForToast(dateStr)}`, "info", 1800);

      // Ensure panel is visible on mobile if needed
      if (isMobileOnly() && dom.tripInputBtn && dom.tripInputBtn.getAttribute("aria-pressed") !== "true") {
        dom.tripInputBtn.click();
      }
    }
  });
  dom.busGrid.addEventListener("change", (e) => {
    if (e.target && e.target.tagName === "SELECT") syncBusSelectEmptyState();
  });

  dom.busesNeeded.addEventListener("input", () => {
    updateBusRowVisibility();
    syncBusPanelState();
  });
  dom.busesNeeded.addEventListener("change", () => {
    updateBusRowVisibility();
    syncBusPanelState();
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
  });

  dom.hiddenIframe.addEventListener("load", () => {
    if (!state.pendingWrite) return;
    toastProgress(60, "Server responded… verifying… 60%");
    clearVerifyFallback();
    verifyWriteResult();
  });

  dom.newBtn.addEventListener("click", () => {
    dom.tripForm.reset();
    refreshEmptyStateUI();
    setModeNew();

    setSelectToPlaceholder("busesNeeded");
    setSelectToPlaceholder("itineraryStatus");
    setSelectToPlaceholder("contactStatus");
    setSelectToPlaceholder("paymentStatus");
    setSelectToPlaceholder("driverStatus");
    setSelectToPlaceholder("tripColor");

    dom.busesNeeded.value = "";
    updateBusRowVisibility();
    syncBusPanelState();
    refreshBusSelectOptions();

    ["itineraryStatus", "contactStatus", "paymentStatus", "driverStatus"].forEach((id) => updateStatusSelect($(id)));

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

    toastShow("Deleting trip… 0%", "loading");
    toastProgress(0);
    toastProgress(25, "Sending delete… 25%");

    state.pendingWrite = {
      action: "delete",
      tripKey: String(dom.tripKey.value),
    };
    startVerifyFallback();
    dom.tripForm.submit();
  });

  dom.tripForm.addEventListener("submit", (e) => {
    e.preventDefault();
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

    if (dom.action.value === "create" && !dom.tripKey.value) dom.tripKey.value = safeUUID();

    $("departureTime").value = normalizeTime($("departureTime").value);
    $("arrivalTime").value = normalizeTime($("arrivalTime").value);

    toastShow("Saving… 0%", "loading");
    toastProgress(0, "Preparing… 0%");
    toastProgress(20, "Sending… 20%");

    dom.saveBtn.disabled = true;

    state.pendingWrite = {
      action: dom.action.value,
      tripKey: String(dom.tripKey.value || ""),
    };
    startVerifyFallback();
    dom.tripForm.submit();
  });

  dom.tripDetailsModal?.addEventListener("click", (e) => {
    if (e.target.dataset.closeDetails !== undefined) closeTripDetailsModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!dom.tripDetailsModal?.hidden && e.key === "Escape") closeTripDetailsModal();
  });

  $("todayBtn")?.addEventListener("click", () => {
    const today = new Date();
    dom.weekPicker.value = toLocalDateInputValue(today);
    updateWeekDates();
  });
}

// ======================================================
// 37) WIRE SETTINGS MENU
// ======================================================
function wireSettingsMenu() {
  if (!dom.settingsBtn || !dom.settingsMenu) return;

  // Toggle Menu
  dom.settingsBtn.addEventListener("click", (e) => {
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
    dom.weekPicker.value = toLocalDateInputValue(today);
    updateWeekDates();
    dom.settingsMenu.hidden = true;
  });

  // 3. Print
  dom.printBtn2?.addEventListener("click", () => {
    dom.settingsMenu.hidden = true;
    setLeftPanelMode("off");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        buildPrintScheduleTwoPages();
        window.print();
      });
    });
  });

  // 4. Week Start
  dom.weekSun2?.addEventListener("click", () => {
    applyWeekStart(false);
    dom.settingsMenu.hidden = true;
  });

  dom.weekMon2?.addEventListener("click", () => {
    applyWeekStart(true);
    dom.settingsMenu.hidden = true;
  });

  // 5. Refresh
  dom.refreshBtn2?.addEventListener("click", () => {
    dom.settingsMenu.hidden = true;
    CACHE.clearAll();
    state.weekCache.clear();
    loadDriversAndBuses(true).then(() => refreshWeekData());
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

  setLeftPanelMode("off");
  enforceDesktopEditing();

  loadPrefs();
  syncWeekStartUI();

  const today = new Date();
  dom.weekPicker.value = toLocalDateInputValue(today);
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
  const weekPicker = document.getElementById("weekPicker");

  if (weekPicker) {
    // When the overlay input is clicked, force the picker dialog
    weekPicker.addEventListener("click", (e) => {
      // Prevent default to avoid focusing/typing if possible, just show picker
      // e.preventDefault(); // careful, might block showPicker in some browsers

      try {
        if (typeof weekPicker.showPicker === "function") {
          weekPicker.showPicker();
        }
      } catch (err) {
        // Fallback or already open
      }
    });
  }
})();

// ======================================================
// HELPER: Auto-scale Title Font (Mobile)
// ======================================================
function fitDateTitle() {
  const title = document.querySelector(".brand-title");
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
