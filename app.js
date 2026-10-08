(function () {
  "use strict";

  const TZ = "Europe/London";
  const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS_LONG = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const MONTHS_TITLE = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const MONTHS_SMALL = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
  const IDEOLOGIES = [
    { id: "libertarian", label: "Libertarian", color: "#E37014", text: "#8c400b" },
    { id: "conservative", label: "Conservative", color: "#C64D2D" },
    { id: "progressive", label: "Progressive", color: "#4002B3" },
    { id: "foreign_policy", label: "Foreign policy", color: "#16374D" },
    { id: "abundance_yimby", label: "Abundance / YIMBY", color: "#006600" },
    { id: "nonpartisan", label: "Nonpartisan", color: "#0F5F6B" },
    { id: "centrist", label: "Centrist", color: "#3043B4" },
    { id: "other", label: "Other / unclassified", color: "#7A3E52" },
    { id: "law", label: "Law", color: "#7C756D", text: "#5c564f" },
  ];
  const IDEO_BY_ID = Object.fromEntries(IDEOLOGIES.map((item) => [item.id, item]));
  const FORMAT_LABELS = {
    in_person: "In person",
    hybrid: "Hybrid",
    online: "Online",
  };
  const LAW_AREA = /\blaw\b|\blegal\b|constitutional|supreme court|\bcourts?\b|judiciary|first amendment|\bcle\b/i;
  const TOPIC_MIN = 2;
  const TOPIC_MAX = 16;
  const TOPIC_RULES = [
    { id: "foreign-policy", label: "Foreign policy", pattern: "foreign policy|diplomacy|\\bgeopolitic|\\bus-eu\\b|cross-strait|\\ballies\\b" },
    { id: "economy", label: "Economy", pattern: "\\beconom(?:y|ic|ies)\\b|\\bfiscal\\b|\\bdebt\\b|bank of england|financial regulation|retirement sav" },
    { id: "tech", label: "Tech", pattern: "\\btechnology\\b|\\btech\\b|artificial intelligence|\\bai\\b" },
    { id: "courts", label: "Courts", pattern: "supreme court|\\bcourts?\\b|first amendment|constitutional|judiciary" },
    { id: "immigration", label: "Immigration", pattern: "immigration|\\bmigrants?\\b|\\brefugees?\\b|\\basylum\\b" },
    { id: "defense", label: "Defence", pattern: "\\bdefen[cs]e\\b|\\bdeterrence\\b|\\bmilitary\\b|\\bnato\\b|maritime great power|island chain" },
    { id: "climate", label: "Climate", pattern: "\\bclimate\\b|\\bemissions?\\b|\\bdecarbon|environmental" },
    { id: "education", label: "Education", pattern: "\\beducation\\b|\\bcollege\\b|\\badmissions\\b|\\babsenteeism\\b|\\bstudents\\b" },
    { id: "health", label: "Health", pattern: "\\bhealth\\b|healthcare|long-term care" },
    { id: "democracy", label: "Democracy", pattern: "\\bdemocracy\\b|\\belection\\b|\\bpolls\\b|gerrymander|\\bvoting\\b" },
    { id: "china", label: "China", pattern: "\\bchina\\b|\\bchinese\\b|trump-xi|\\bxi\\b" },
    { id: "ukraine", label: "Ukraine", pattern: "\\bukraine\\b|\\bkyiv\\b|\\bzelensky" },
    { id: "russia", label: "Russia", pattern: "\\brussia\\b|\\brussian\\b|\\bputin\\b|\\bkremlin\\b" },
    { id: "energy", label: "Energy", pattern: "\\benergy\\b|\\bgrid\\b|transmission|\\bhormuz\\b" },
    { id: "labor", label: "Labour", pattern: "\\blabou?r\\b|\\bworkers?\\b|\\bemployment\\b|\\bwages?\\b" },
    { id: "regulation", label: "Regulation", pattern: "\\bregulat" },
    { id: "latin-america", label: "Latin America", pattern: "latin america|\\bcaribbean\\b|\\bvenezuela\\b|\\bpanama\\b" },
    { id: "development", label: "Development", pattern: "global south|(?<!leadership )\\bdevelopment\\b" },
    { id: "housing", label: "Housing", pattern: "\\bhousing\\b|\\bhomeless|\\byimby\\b|\\bzoning\\b" },
    { id: "trade", label: "Trade", pattern: "\\btrade\\b|\\btariffs?\\b" },
    { id: "tax", label: "Tax", pattern: "\\btax(?:es|ing)?\\b" },
    { id: "japan", label: "Japan", pattern: "\\bjapan\\b|\\bjapanese\\b" },
    { id: "korea", label: "Korea", pattern: "\\bkorea\\b|\\bkorean\\b" },
  ];
  const TOPIC_STOP = new Set(
    "about after again against ahead also america american among annual around author authors because before being between book books briefing briefings both chapter chapters conversation conversations could discussion during each event events every featuring fireside from future gala happy have here hosted hybrid into join just keynote launch many moderator more most much must next online only onto other over panel panelist panelists person please policy public really reception register registration remarks seminar seminars series should some such summit summits talk talks than that their them then there these they this those through today under upcoming very virtual london simulated sample fictional webinar webinars what when where which while with within without would your".split(
      /\s+/
    )
  );
  const SHARE_FORMATS = new Set(["in_person", "hybrid", "online"]);
  const LOCAL_EVENTS_URL = "data/events.json";
  const INSTALL_TIP_KEY = "london-events-install-tip-dismissed";
  const FOCUS_REFRESH_MS = 60 * 1000;

  const els = {
    listView: document.getElementById("list-view"),
    eventList: document.getElementById("event-list"),
    calView: document.getElementById("cal-view"),
    weekBoard: document.getElementById("week-board"),
    dayStrip: document.getElementById("day-strip"),
    stripDay: document.getElementById("strip-day"),
    meta: document.getElementById("results-meta"),
    search: document.getElementById("search"),
    dateFrom: document.getElementById("date-from"),
    dateTo: document.getElementById("date-to"),
    dateRange: document.getElementById("date-range"),
    moreDates: document.getElementById("more-dates"),
    clear: document.getElementById("clear-filters"),
    sheetClear: document.getElementById("sheet-clear"),
    calendarMonth: document.getElementById("calendar-month"),
    calendarGrid: document.getElementById("calendar-grid"),
    calPrev: document.getElementById("cal-prev"),
    calNext: document.getElementById("cal-next"),
    topicBlock: document.getElementById("topic-block"),
    topicGroup: document.getElementById("topic-group"),
    refresh: document.getElementById("refresh-events"),
    refreshStatus: document.getElementById("refresh-status"),
    install: document.getElementById("install-app"),
    installTip: document.getElementById("install-tip"),
    installTipDismiss: document.getElementById("dismiss-install-tip"),
    pullIndicator: document.getElementById("pull-indicator"),
    viewToggle: document.getElementById("view-toggle"),
    viewToggleLabel: document.getElementById("view-toggle-label"),
    mainTitle: document.getElementById("main-title"),
    mainRange: document.getElementById("main-range"),
    backToday: document.getElementById("back-today"),
    weekPrev: document.getElementById("week-prev"),
    weekNext: document.getElementById("week-next"),
    openCalendar: document.getElementById("open-calendar"),
    openFilters: document.getElementById("open-filters"),
    openFiltersPhone: document.getElementById("open-filters-phone"),
    closeFilters: document.getElementById("close-filters"),
    sheetClearBottom: document.getElementById("sheet-clear-bottom"),
    sheetBackdrop: document.getElementById("sheet-backdrop"),
    menuToggle: document.getElementById("menu-toggle"),
    phoneStrip: document.getElementById("phone-strip"),
    monthSheet: document.getElementById("month-sheet"),
    monthPanel: document.querySelector(".month-panel"),
    openMonth: document.getElementById("open-month"),
    closeMonth: document.getElementById("close-month"),
    monthBackdrop: document.getElementById("month-backdrop"),
    sidebar: document.getElementById("sidebar"),
    brand: document.getElementById("brand-home"),
    aboutOpen: document.getElementById("about-open"),
    aboutClose: document.getElementById("about-close"),
    aboutDialog: document.getElementById("about-dialog"),
  };

  const state = {
    view: "list",
    listStart: null,
    weekStart: null,
    stripDay: null,
    miniYear: null,
    miniMonth: null,
    openEventId: null,
    deepLinkApplied: false,
    pendingScroll: false,
  };

  let allEvents = [];
  let topicCatalog = [];
  let eventsLoaded = false;
  let focusYmdKey = null;
  let lastPayload = "";
  let lastPayloadDay = "";
  let lastFetchedAt = 0;
  let refreshInFlight = null;
  let deferredInstallPrompt = null;
  let preparedEvents = [];
  let preparedById = new Map();
  let dayIndex = new Map();
  let viewCache = null;
  let dataGeneration = 0;
  let listWindowCache = null;
  let publishedWindow = null;
  let todayStamp = 0;
  let todayValue = null;
  let ideoCountKey = "";
  let ideoCountCache = null;
  let htmlMemo = new Map();
  let phoneStripScroll = false;
  let searchTimer = 0;
  const NO_PREPS = [];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function domId(prefix, id) {
    return prefix + "-" + String(id).replace(/[^A-Za-z0-9_-]/g, "");
  }

  function cssEscape(value) {
    if (window.CSS && typeof CSS.escape === "function") return CSS.escape(String(value));
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function parseLocalDateInput(value) {
    if (!value) return null;
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return { y, m, d };
  }

  function ymdKey(ymd) {
    return `${ymd.y}-${pad2(ymd.m)}-${pad2(ymd.d)}`;
  }

  function parseYmdKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return { y, m, d };
  }

  function isRealYmd(ymd) {
    return ymd.m >= 1 && ymd.m <= 12 && ymd.d >= 1 && ymd.d <= daysInMonthUtc(ymd.y, ymd.m);
  }

  const ymdFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const clockFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const minuteFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const timeLabelFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  });

  function eventYmdInTz(iso) {
    const d = iso instanceof Date ? iso : new Date(iso);
    const parts = ymdFormatter.formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t).value;
    return {
      y: Number(get("year")),
      m: Number(get("month")),
      d: Number(get("day")),
    };
  }

  function ymdCmp(a, b) {
    if (a.y !== b.y) return a.y - b.y;
    if (a.m !== b.m) return a.m - b.m;
    return a.d - b.d;
  }

  function addDays(ymd, days) {
    const utc = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d + days));
    return {
      y: utc.getUTCFullYear(),
      m: utc.getUTCMonth() + 1,
      d: utc.getUTCDate(),
    };
  }

  function inYmdRange(ymd, range) {
    return ymdCmp(ymd, range.start) >= 0 && ymdCmp(ymd, range.end) <= 0;
  }

  function daysBetween(a, b) {
    const ms = Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d);
    return Math.round(ms / 86400000);
  }

  function clockInTz(date) {
    const parts = clockFormatter.formatToParts(date);
    const get = (type) => {
      const part = parts.find((item) => item.type === type);
      return part ? part.value : "";
    };
    let hour = Number(get("hour"));
    if (hour === 24) hour = 0;
    return { hour, minute: Number(get("minute")), second: Number(get("second")) };
  }

  /* London midnight uses GMT or BST, including the day clocks change. */
  function midnightInTz(ymd) {
    return LondonEventData.midnight(ymd);
  }

  /* Last UK time (BST / GMT) calendar day the event still occupies.
     An end at or before 00:00 does not occupy that calendar day.
     A missing end, or an end that is not after start, stays on the start day. */
  function eventEndYmd(event) {
    if (!event || !event.start) return null;
    const startDate = new Date(event.start);
    if (Number.isNaN(startDate.getTime())) return null;
    const startYmd = eventYmdInTz(startDate);
    if (!event.end) return startYmd;
    const endDate = new Date(event.end);
    if (Number.isNaN(endDate.getTime()) || endDate <= startDate) return startYmd;
    let endYmd = eventYmdInTz(endDate);
    if (ymdCmp(endYmd, startYmd) <= 0) return startYmd;
    const midnight = midnightInTz(endYmd);
    if (midnight && endDate.getTime() <= midnight.getTime()) endYmd = addDays(endYmd, -1);
    if (ymdCmp(endYmd, startYmd) < 0) return startYmd;
    return endYmd;
  }

  function eventCoversDay(event, ymd) {
    if (!event || !event.start || !ymd) return false;
    const startDate = new Date(event.start);
    if (Number.isNaN(startDate.getTime())) return false;
    const startYmd = eventYmdInTz(startDate);
    const endYmd = eventEndYmd(event);
    if (!endYmd) return false;
    return ymdCmp(ymd, startYmd) >= 0 && ymdCmp(ymd, endYmd) <= 0;
  }

  function eventSpan(event) {
    if (!event || !event.start) return null;
    const startDate = new Date(event.start);
    if (Number.isNaN(startDate.getTime())) return null;
    const startYmd = eventYmdInTz(startDate);
    const endYmd = eventEndYmd(event);
    if (!endYmd || ymdCmp(endYmd, startYmd) <= 0) return null;
    return { startYmd, endYmd, days: daysBetween(startYmd, endYmd) + 1 };
  }

  function formatSpanDates(a, b) {
    if (a.y === b.y && a.m === b.m) return `${MONTHS_TITLE[a.m - 1]} ${a.d}-${b.d}`;
    if (a.y === b.y) return `${MONTHS_TITLE[a.m - 1]} ${a.d}-${MONTHS_TITLE[b.m - 1]} ${b.d}`;
    return `${MONTHS_TITLE[a.m - 1]} ${a.d}, ${a.y}-${MONTHS_TITLE[b.m - 1]} ${b.d}, ${b.y}`;
  }

  function spanBadgeText(event, ymd) {
    if (!event || !ymd) return "";
    const prep = preparedById.get(event.id);
    if (prep) return prep.badges.get(ymdKey(ymd)) || "";
    const span = eventSpan(event);
    if (!span) return "";
    if (ymdCmp(ymd, span.startYmd) < 0 || ymdCmp(ymd, span.endYmd) > 0) return "";
    const index = daysBetween(span.startYmd, ymd) + 1;
    return `Day ${index} of ${span.days} · ${formatSpanDates(span.startYmd, span.endYmd)}`;
  }

  function spanBadgeHtml(event, ymd) {
    const text = spanBadgeText(event, ymd);
    if (!text) return "";
    return `<span class="span-badge">${escapeHtml(text)}</span>`;
  }

  function todayYmd() {
    const now = Date.now();
    if (todayValue && now - todayStamp < 30000) return todayValue;
    todayStamp = now;
    todayValue = eventYmdInTz(new Date(now));
    return todayValue;
  }

  function listWindow() {
    const start = todayYmd();
    const key = ymdKey(start);
    if (listWindowCache && listWindowCache.key === key) return listWindowCache.value;
    const value = LondonEventData.browsingWindow(new Date());
    listWindowCache = { key, value };
    return value;
  }

  function horizonEnd() {
    return listWindow().end;
  }

  function calendarWindow() {
    return listWindow();
  }

  function clippedEnd(start, daysAhead) {
    const end = addDays(start, daysAhead);
    const hard = horizonEnd();
    return ymdCmp(end, hard) > 0 ? hard : end;
  }

  function inListWindow(event) {
    if (!event || !event.start) return false;
    const startDate = new Date(event.start);
    if (Number.isNaN(startDate.getTime())) return false;
    // A midnight placeholder never expires an unknown-time event on its own day.
    // The publication rule excludes already-started sessions with an unpublished end.
    if (event.end && Date.parse(event.end) <= Date.now()) return false;
    if (!event.end && !timeIsUnknown(event) && Date.parse(event.start) <= Date.now()) return false;
    const startYmd = eventYmdInTz(startDate);
    const window = listWindow();
    if (ymdCmp(startYmd, window.end) > 0) return false;
    const last = eventEndYmd(event);
    if (!last || ymdCmp(last, window.start) < 0) return false;
    return true;
  }

  function monthOf(year, month, delta) {
    let m = month + delta;
    let y = year;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    return { y, m };
  }

  function daysInMonthUtc(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function weekdayIndex(ymd) {
    return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d)).getUTCDay();
  }

  function monthOverlapsCalendar(year, month) {
    const cal = calendarWindow();
    const start = { y: year, m: month, d: 1 };
    const end = { y: year, m: month, d: daysInMonthUtc(year, month) };
    return ymdCmp(end, cal.start) >= 0 && ymdCmp(start, cal.end) <= 0;
  }

  function minutesInTz(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const parts = minuteFormatter.formatToParts(d);
    let hour = Number(parts.find((p) => p.type === "hour").value);
    const minute = Number(parts.find((p) => p.type === "minute").value);
    if (hour === 24) hour = 0;
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return hour * 60 + minute;
  }

  function timeBucket(iso) {
    const mins = minutesInTz(iso);
    if (mins == null) return null;
    if (mins < 11 * 60) return "morning";
    if (mins < 13 * 60) return "midday";
    if (mins < 15 * 60 + 30) return "early_afternoon";
    if (mins < 17 * 60 + 30) return "late_afternoon";
    return "evening";
  }

  function formatStartTime(iso) {
    return timeLabelFormatter.format(new Date(iso));
  }

  /* notes/time marked unknown, TBC, TBA, or TBD — or the whole field is just that word. */
  function marksTimeUnknown(value) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        if (marksTimeUnknown(value[i])) return true;
      }
      return false;
    }
    const text = fieldText(value).toLowerCase();
    if (!text) return false;
    if (text === "unknown" || text === "tbc" || text === "tba" || text === "tbd") return true;
    return (
      /\btime\b(?:\s+(?:is|of))?\s*[:\-–—]?\s*(?:unknown|tbc|tba|tbd)\b/.test(text) ||
      /\b(?:unknown|tbc|tba|tbd)\s+time\b/.test(text)
    );
  }

  /* No real clock time: an explicit notes/time marker, or midnight with no end. */
  function timeIsUnknown(event) {
    if (!event) return false;
    if (marksTimeUnknown(event.time) || (!admissionLabel(event) && marksTimeUnknown(event.notes))) return true;
    return minutesInTz(event.start) === 0 && !fieldText(event.end);
  }

  function startTimeLabel(event) {
    const prep = event && preparedById.get(event.id);
    if (prep) return prep.timeLabel;
    return sourceTimeLabel(event);
  }

  function admissionLabel(event) {
    return event.start_label === "doors" ? "Doors" : event.start_label === "arrival" ? "Arrival" : "";
  }

  function sourceTimeLabel(event) {
    if (timeIsUnknown(event)) return "Time TBC";
    return [admissionLabel(event), formatStartTime(event.start)].filter(Boolean).join(" ");
  }

  function eventCalendarTitle(event) {
    const label = admissionLabel(event);
    return (event.simulated ? "[Simulated] " : "") + (label ? `[${label}] ` : "") + (event.title || "Event");
  }

  function formatLongDate(ymd) {
    return `${WEEKDAYS_LONG[weekdayIndex(ymd)]}, ${MONTHS_LONG[ymd.m - 1]} ${ymd.d}`;
  }

  function formatMonthTitle(y, m) {
    return `${MONTHS_LONG[m - 1]} ${y}`;
  }

  function formatTitleRange(a, b) {
    return `${MONTHS_TITLE[a.m - 1]} ${a.d} – ${MONTHS_TITLE[b.m - 1]} ${b.d}`;
  }

  function formatSmallRange(a, b) {
    return `${MONTHS_SMALL[a.m - 1]} ${a.d} – ${MONTHS_SMALL[b.m - 1]} ${b.d}`;
  }

  function relLabel(ymd, today) {
    if (ymdCmp(ymd, today) === 0) return "Today";
    if (ymdCmp(ymd, addDays(today, 1)) === 0) return "Tomorrow";
    return WEEKDAYS_LONG[weekdayIndex(ymd)];
  }

  function fieldText(value) {
    if (value == null) return "";
    return String(value).trim();
  }

  function usableVenueName(venue) {
    if (venue == null) return "";
    const v = String(venue).trim();
    if (!v) return "";
    if (v.startsWith("{") || v.includes("@type") || v.includes("VirtualLocation")) return "";
    return v;
  }

  function locationText(event) {
    const venue = usableVenueName(event.venue);
    const address = event.address ? String(event.address).trim() : "";
    let location = venue && address && venue !== address ? `${venue}, ${address}` : venue || address || "";
    if (event.format !== "online") for (const field of ["city","country"]) {
      const value = fieldText(event[field]);
      if (value && !location.toLowerCase().includes(value.toLowerCase())) location = [location,value].filter(Boolean).join(", ");
    }
    return location;
  }

  function speakersLabel(speakers) {
    if (speakers == null || speakers === "") return "";
    const items = Array.isArray(speakers) ? speakers : [speakers];
    return items
      .map((item) => {
        if (item == null) return "";
        if (typeof item === "string") return item.trim();
        if (typeof item === "number") return String(item);
        if (typeof item === "object") {
          const name = item.name || item.speaker || "";
          const extra = item.title || item.role || item.affiliation || "";
          return [name, extra].filter(Boolean).join(", ");
        }
        return "";
      })
      .filter(Boolean)
      .join("; ");
  }

  function costKind(cost) {
    const text = fieldText(cost).toLowerCase();
    if (!text || text === "unknown") return "unknown";
    if (text === "free") return "free";
    if (/\bfree\b/.test(text) && /members|non-members|£/.test(text)) return "mixed";
    if (/\bfree\b/.test(text) && !/£\s*\d/.test(text)) return "free";
    if (!/£\s*\d/.test(text) && /unknown|not stated|not published|not verified|price depends|no.*price.*published|accreditation\/pass required/.test(text)) return "unknown";
    return "paid";
  }

  function matchesCost(event, cost) {
    if (!cost || cost === "all") return true;
    const kind = costKind(event.cost);
    if (cost === "free") return kind === "free" || kind === "mixed" || kind === "unknown";
    if (cost === "paid") return kind === "paid" || kind === "mixed" || kind === "unknown";
    return true;
  }

  function costShort(event) {
    const kind = costKind(event.cost);
    if (kind === "free") return "Free";
    if (kind === "paid") return "Paid";
    if (kind === "mixed") return "Free / paid";
    return "Cost unlisted";
  }

  function costDetail(event) {
    const kind = costKind(event.cost);
    if (kind === "free") return "Free";
    if (kind === "unknown") return "Cost unlisted";
    const raw = fieldText(event.cost);
    return raw.toLowerCase() === "paid" ? "Paid" : raw;
  }

  function formatKind(format) {
    const raw = fieldText(format).toLowerCase();
    if (!raw) return "in_person";
    const normalized = raw.replace(/[\s-]+/g, "_");
    if (normalized === "in_person" || normalized === "inperson") return "in_person";
    if (normalized === "online") return "online";
    if (normalized === "hybrid" || raw.startsWith("hybrid")) return "hybrid";
    return "in_person";
  }

  function formatLabel(format) {
    return FORMAT_LABELS[formatKind(format)];
  }

  function isSimpleFormat(format) {
    const raw = fieldText(format).toLowerCase();
    if (!raw) return true;
    const normalized = raw.replace(/[\s-]+/g, "_");
    return (
      normalized === "in_person" ||
      normalized === "inperson" ||
      normalized === "hybrid" ||
      normalized === "online"
    );
  }

  function matchesLawArea(event) {
    return LAW_AREA.test(`${event.title || ""} ${event.description || ""}`);
  }

  function matchesIdeology(event, selected) {
    if (selected.includes(event.ideology)) return true;
    return selected.includes("law") && event.ideology !== "law" && matchesLawArea(event);
  }

  function ideologyView(event) {
    const raw = fieldText(event.ideology);
    if (IDEO_BY_ID[raw]) return IDEO_BY_ID[raw];
    if (matchesLawArea(event)) return IDEO_BY_ID.law;
    return null;
  }

  function orgLine(event) {
    const name = fieldText(event.org);
    const acronym = fieldText(event.org_acronym);
    if (name && acronym && name.toLowerCase() !== acronym.toLowerCase()) {
      return `${name} (${acronym})`;
    }
    return name || acronym;
  }

  function metaLine(event) {
    const parts = [costDetail(event)];
    const tags = event.tags || {};
    if (tags.free_food) parts.push("Free food");
    if (tags.free_drinks) parts.push("Free drinks");
    if (tags.young_professionals) parts.push("Young professionals");
    return parts.join(" · ");
  }

  function topicHay(event) {
    return `${event.title || ""} ${event.description || ""}`;
  }

  function deriveTopics(events) {
    const scored = TOPIC_RULES.map((rule) => {
      const re = new RegExp(rule.pattern, "i");
      let count = 0;
      events.forEach((event) => {
        if (re.test(topicHay(event))) count += 1;
      });
      return { id: rule.id, label: rule.label, re, count };
    }).filter((topic) => topic.count >= TOPIC_MIN);

    scored.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    const picked = scored.slice(0, TOPIC_MAX);
    const covered = new Set();
    picked.forEach((topic) => {
      topic.label
        .toLowerCase()
        .split(/[^a-z]+/)
        .forEach((word) => {
          if (word) covered.add(word);
        });
    });

    const titleCounts = new Map();
    events.forEach((event) => {
      const words = new Set(
        String(event.title || "")
          .toLowerCase()
          .match(/[a-z][a-z'’-]{4,}/g) || []
      );
      words.forEach((word) => {
        const bare = word.replace(/['’]/g, "");
        if (!bare || TOPIC_STOP.has(bare) || covered.has(bare)) return;
        titleCounts.set(bare, (titleCounts.get(bare) || 0) + 1);
      });
    });

    const room = Math.max(0, TOPIC_MAX - picked.length);
    const extras = [...titleCounts.entries()]
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, room)
      .map(([word, count]) => ({
        id: `kw-${word}`,
        label: word.charAt(0).toUpperCase() + word.slice(1),
        re: new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
        count,
      }));

    return picked.concat(extras);
  }

  function chipButtons(name) {
    const group = document.querySelector(`[data-filter="${name}"]`);
    if (!group) return [];
    return Array.from(group.querySelectorAll("button.chip"));
  }

  function selectedChipValues(name) {
    return chipButtons(name)
      .filter((btn) => btn.dataset.value !== "all" && btn.getAttribute("aria-pressed") === "true")
      .map((btn) => btn.dataset.value);
  }

  function setChipValues(name, values) {
    const wanted = new Set(values || []);
    const buttons = chipButtons(name);
    let any = false;
    buttons.forEach((btn) => {
      if (btn.dataset.value === "all") return;
      const on = wanted.has(btn.dataset.value);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) any = true;
    });
    const all = buttons.find((btn) => btn.dataset.value === "all");
    if (all) all.setAttribute("aria-pressed", any ? "false" : "true");
  }

  function toggleChip(btn) {
    const group = btn.closest("[data-filter]");
    const name = group && group.dataset.filter;
    const value = btn.dataset.value;
    if (!name || !value) return;
    if (value === "all") {
      setChipValues(name, []);
      return;
    }
    const on = btn.getAttribute("aria-pressed") === "true";
    btn.setAttribute("aria-pressed", on ? "false" : "true");
    if (!selectedChipValues(name).length) {
      setChipValues(name, []);
      return;
    }
    const all = chipButtons(name).find((el) => el.dataset.value === "all");
    if (all) all.setAttribute("aria-pressed", "false");
  }

  function setSegment(name, value) {
    const group = document.querySelector(`.segmented[data-filter="${name}"]`);
    if (!group) return;
    let matched = false;
    group.querySelectorAll("[data-value]").forEach((btn) => {
      const on = btn.dataset.value === value;
      if (on) matched = true;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    if (!matched) {
      const all = group.querySelector('[data-value="all"]');
      if (all) all.setAttribute("aria-checked", "true");
    }
  }

  function selectedSegment(name) {
    const group = document.querySelector(`.segmented[data-filter="${name}"]`);
    if (!group) return "all";
    const on = group.querySelector('[aria-checked="true"]');
    return on ? on.dataset.value : "all";
  }

  function selectedIdeologies() {
    return [...document.querySelectorAll("#ideo-list input:checked")].map((input) => input.value);
  }

  function setIdeologies(values) {
    const wanted = new Set(values || []);
    document.querySelectorAll("#ideo-list input").forEach((input) => {
      input.checked = wanted.has(input.value);
    });
  }

  function renderTopicChips(topics) {
    const group = els.topicGroup;
    const block = els.topicBlock;
    if (!group || !block) return;
    const selected = selectedChipValues("topic");
    group.querySelectorAll(".chip").forEach((el) => el.remove());
    if (!topics.length) {
      block.hidden = true;
      return;
    }
    block.hidden = false;
    const all = document.createElement("button");
    all.type = "button";
    all.className = "chip";
    all.dataset.value = "all";
    all.setAttribute("aria-pressed", "true");
    all.textContent = "All";
    group.appendChild(all);
    topics.forEach((topic) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip";
      button.dataset.value = topic.id;
      button.title = `${topic.count} upcoming`;
      button.textContent = topic.label;
      button.setAttribute("aria-pressed", "false");
      group.appendChild(button);
    });
    setChipValues("topic", selected);
  }

  function selectedTopicsMatch(event, ids) {
    if (!ids.length) return false;
    const hay = topicHay(event);
    return topicCatalog.some((topic) => ids.includes(topic.id) && topic.re.test(hay));
  }

  function searchHit(event, query) {
    const hay = [event.title, event.description, event.org, event.org_acronym, event.venue, event.address, speakersLabel(event.speakers)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  }

  function getFilters() {
    const perks = selectedChipValues("perk");
    return {
      search: (els.search.value || "").trim().toLowerCase(),
      topics: selectedChipValues("topic"),
      ideologies: selectedIdeologies(),
      freeFood: perks.includes("free_food"),
      freeDrinks: perks.includes("free_drinks"),
      yp: perks.includes("young_professionals"),
      cost: selectedSegment("cost"),
      format: selectedSegment("format"),
      time: selectedChipValues("time"),
      from: parseLocalDateInput(els.dateFrom.value),
      to: parseLocalDateInput(els.dateTo.value),
    };
  }

  function filtersKey(f) {
    return [
      f.search,
      (f.topics || []).join("\n"),
      (f.ideologies || []).join("\n"),
      f.freeFood ? "1" : "0",
      f.freeDrinks ? "1" : "0",
      f.yp ? "1" : "0",
      f.cost || "all",
      f.format || "all",
      (f.time || []).join("\n"),
      f.from ? ymdKey(f.from) : "",
      f.to ? ymdKey(f.to) : "",
    ].join("\u0001");
  }

  function filtersActive(f) {
    return Boolean(
      f.search ||
        (f.topics && f.topics.length) ||
        (f.ideologies && f.ideologies.length) ||
        f.freeFood ||
        f.freeDrinks ||
        f.yp ||
        (f.cost && f.cost !== "all") ||
        (f.format && f.format !== "all") ||
        (f.time && f.time.length) ||
        f.from ||
        f.to
    );
  }

  function matchesIdeologyPrep(prep, selected) {
    if (selected.includes(prep.event.ideology)) return true;
    return selected.includes("law") && prep.event.ideology !== "law" && prep.lawArea;
  }

  function matchesCostKind(kind, cost) {
    if (!cost || cost === "all") return true;
    if (cost === "free") return kind === "free" || kind === "mixed" || kind === "unknown";
    if (cost === "paid") return kind === "paid" || kind === "mixed" || kind === "unknown";
    return true;
  }

  function matchesPrep(prep, f) {
    const topicOn = f.topics && f.topics.length > 0;
    const searchOn = Boolean(f.search);
    if (topicOn || searchOn) {
      let hit = false;
      if (topicOn) {
        for (let i = 0; i < f.topics.length; i += 1) {
          if (prep.topicIds.has(f.topics[i])) {
            hit = true;
            break;
          }
        }
      }
      if (!hit && searchOn && prep.searchHay.includes(f.search)) hit = true;
      if (!hit) return false;
    }
    if (f.ideologies.length && !matchesIdeologyPrep(prep, f.ideologies)) return false;
    const tags = prep.event.tags || {};
    if (f.freeFood && !tags.free_food) return false;
    if (f.freeDrinks && !tags.free_drinks) return false;
    if (f.yp && !tags.young_professionals) return false;
    if (!matchesCostKind(prep.costKind, f.cost)) return false;
    if (f.format && f.format !== "all" && f.format !== prep.formatKind) return false;
    if (f.time && f.time.length && !f.time.includes(prep.timeBucket)) return false;
    if (f.from && ymdCmp(prep.endYmd, f.from) < 0) return false;
    if (f.to && ymdCmp(prep.startYmd, f.to) > 0) return false;
    return true;
  }

  function matches(event, f) {
    const prep = preparedById.get(event.id);
    if (prep) return matchesPrep(prep, f);
    const topicOn = f.topics && f.topics.length > 0;
    const searchOn = Boolean(f.search);
    if (topicOn || searchOn) {
      const hit =
        (topicOn && selectedTopicsMatch(event, f.topics)) ||
        (searchOn && searchHit(event, f.search));
      if (!hit) return false;
    }
    if (f.ideologies.length && !matchesIdeology(event, f.ideologies)) return false;
    const tags = event.tags || {};
    if (f.freeFood && !tags.free_food) return false;
    if (f.freeDrinks && !tags.free_drinks) return false;
    if (f.yp && !tags.young_professionals) return false;
    if (!matchesCost(event, f.cost)) return false;
    if (f.format && f.format !== "all" && f.format !== formatKind(event.format)) return false;
    if (f.time && f.time.length && !f.time.includes(timeIsUnknown(event) ? null : timeBucket(event.start))) return false;
    const startYmd = eventYmdInTz(event.start);
    const endYmd = eventEndYmd(event) || startYmd;
    if (f.from && ymdCmp(endYmd, f.from) < 0) return false;
    if (f.to && ymdCmp(startYmd, f.to) > 0) return false;
    return true;
  }

  function prepareEvent(event) {
    const startDate = new Date(event.start);
    const startYmd = eventYmdInTz(startDate);
    const endYmd = eventEndYmd(event) || startYmd;
    const endDate = event.end ? new Date(event.end) : null;
    const span =
      ymdCmp(endYmd, startYmd) > 0
        ? {
            startYmd,
            endYmd,
            days: daysBetween(startYmd, endYmd) + 1,
            datesLabel: formatSpanDates(startYmd, endYmd),
          }
        : null;
    const badges = new Map();
    if (span) {
      let ymd = span.startYmd;
      for (let i = 1; i <= span.days; i += 1) {
        badges.set(ymdKey(ymd), `Day ${i} of ${span.days} · ${span.datesLabel}`);
        ymd = addDays(ymd, 1);
      }
    }
    const speakers = speakersLabel(event.speakers);
    const topicIds = new Set();
    const hay = topicHay(event);
    topicCatalog.forEach((topic) => {
      if (topic.re.test(hay)) topicIds.add(topic.id);
    });
    const lawArea = matchesLawArea(event);
    const timeUnknown = timeIsUnknown(event);
    return {
      event,
      id: event.id,
      startMs: startDate.getTime(),
      startYmd,
      endYmd,
      endMs: endDate && !Number.isNaN(endDate.getTime()) ? endDate.getTime() : NaN,
      badges,
      timeUnknown,
      timeLabel: sourceTimeLabel(event),
      endTimeLabel: !timeUnknown && event.end ? formatStartTime(event.end) : "",
      timeBucket: timeUnknown ? null : timeBucket(event.start),
      formatKind: formatKind(event.format),
      formatLabel: formatLabel(event.format),
      simpleFormat: isSimpleFormat(event.format),
      costKind: costKind(event.cost),
      costShort: costShort(event),
      orgLine: orgLine(event),
      meta: metaLine(event),
      searchHay: [event.title, event.description, event.org, event.org_acronym, event.venue, event.address, speakers]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      topicIds,
      lawArea,
      ideo: ideologyView(event),
    };
  }

  function buildDayIndex(events) {
    const index = new Map();
    events.forEach((prep) => {
      let ymd = prep.startYmd;
      const last = prep.endYmd;
      let guard = 0;
      while (ymd && last && ymdCmp(ymd, last) <= 0 && guard < 4000) {
        const key = ymdKey(ymd);
        let bucket = index.get(key);
        if (!bucket) {
          bucket = [];
          index.set(key, bucket);
        }
        bucket.push(prep);
        ymd = addDays(ymd, 1);
        guard += 1;
      }
    });
    return index;
  }

  function rebuildEventIndex() {
    preparedEvents = allEvents.map(prepareEvent).sort((a, b) => a.startMs - b.startMs);
    preparedById = new Map(preparedEvents.map((prep) => [prep.id, prep]));
    dayIndex = buildDayIndex(preparedEvents);
    dataGeneration += 1;
    viewCache = null;
    ideoCountKey = "";
    ideoCountCache = null;
    htmlMemo = new Map();
  }

  function getView() {
    const filters = getFilters();
    const key = filtersKey(filters);
    if (viewCache && viewCache.key === key) return viewCache;
    const unfiltered = !filtersActive(filters);
    const list = unfiltered ? preparedEvents : preparedEvents.filter((prep) => matchesPrep(prep, filters));
    viewCache = {
      key,
      filters,
      list,
      idSet: unfiltered ? null : new Set(list),
      unfiltered,
      dayCache: new Map(),
      counts: null,
    };
    return viewCache;
  }

  function dayInDateFilter(ymd, filters) {
    const f = filters || getFilters();
    if (f.from && ymdCmp(ymd, f.from) < 0) return false;
    if (f.to && ymdCmp(ymd, f.to) > 0) return false;
    return true;
  }

  function prepsOnDay(ymd, view) {
    if (!inYmdRange(ymd, listWindow())) return NO_PREPS;
    if (!dayInDateFilter(ymd, view.filters)) return NO_PREPS;
    const bucket = dayIndex.get(ymdKey(ymd));
    if (!bucket || !bucket.length) return NO_PREPS;
    if (view.unfiltered) return bucket;
    const key = ymdKey(ymd);
    const cached = view.dayCache.get(key);
    if (cached) return cached;
    const list = bucket.filter((prep) => view.idSet.has(prep));
    view.dayCache.set(key, list);
    return list;
  }

  function eventsOnDay(ymd) {
    return prepsOnDay(ymd, getView()).map((prep) => prep.event);
  }

  function toUtcStamp(iso) {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return (
      String(d.getUTCFullYear()) +
      pad2(d.getUTCMonth() + 1) +
      pad2(d.getUTCDate()) +
      "T" +
      pad2(d.getUTCHours()) +
      pad2(d.getUTCMinutes()) +
      pad2(d.getUTCSeconds()) +
      "Z"
    );
  }

  function eventEndIso(event) {
    const start = new Date(event.start);
    if (event.end) {
      const end = new Date(event.end);
      if (!Number.isNaN(end.getTime()) && end > start) return event.end;
    }
    return new Date(start.getTime() + 60 * 60 * 1000).toISOString();
  }

  function calendarDetails(event) {
    const lines = event.simulated ? ["SIMULATED EVENT — fictional example. Do not attend."] : [];
    const description = fieldText(event.description);
    if (description) lines.push(description);
    const label = admissionLabel(event);
    if (label && !timeIsUnknown(event)) lines.push(`Calendar start is the advertised ${label.toLowerCase()} time: ${formatStartTime(event.start)} UK time.`);
    for (const field of ["doors","arrival"]) if (event[field]) lines.push(`${field === "doors" ? "Doors" : "Arrival"}: ${formatStartTime(event[field])} UK time.`);
    if (!event.end && !timeIsUnknown(event)) lines.push("End time is unpublished; the calendar end uses a one-hour placeholder.");
    const speakers = speakersLabel(event.speakers);
    if (speakers) lines.push(`Speakers: ${speakers}`);
    const formatRaw = fieldText(event.format);
    if (formatRaw) {
      lines.push(isSimpleFormat(formatRaw) ? `Format: ${formatLabel(formatRaw)}` : `Format: ${formatRaw}`);
    }
    const access = fieldText(event.access);
    if (access) lines.push(`Access: ${access}`);
    if (event.cost) lines.push(`Cost: ${event.cost}`);
    for (const [key,label] of [["booking_fees","Booking fees"],["age_restrictions","Age restrictions"],["physical_accessibility","Accessibility"]]) if (event[key]) lines.push(`${label}: ${fieldText(event[key])}`);
    const notes = fieldText(event.notes);
    if (notes) lines.push(`Notes: ${notes}`);
    if (event.url) lines.push(String(event.url).trim());
    const rsvp = fieldText(event.rsvp_url);
    if (rsvp && rsvp !== fieldText(event.url)) lines.push(`RSVP: ${rsvp}`);
    return lines.join("\n\n");
  }

  function ymdCompact(ymd) {
    return `${ymd.y}${pad2(ymd.m)}${pad2(ymd.d)}`;
  }

  function ymdIsoDate(ymd) {
    return `${ymd.y}-${pad2(ymd.m)}-${pad2(ymd.d)}`;
  }

  /* All-day export uses the days the listing already occupies. End is exclusive. */
  function allDayBounds(event) {
    const startYmd = eventYmdInTz(event.start);
    const lastYmd = eventEndYmd(event) || startYmd;
    return { startYmd, endExclusive: addDays(lastYmd, 1) };
  }

  function googleCalendarUrl(event) {
    let dates;
    if (timeIsUnknown(event)) {
      const bounds = allDayBounds(event);
      dates = `${ymdCompact(bounds.startYmd)}/${ymdCompact(bounds.endExclusive)}`;
    } else {
      dates = `${toUtcStamp(event.start)}/${toUtcStamp(eventEndIso(event))}`;
    }
    const parts = [
      "action=TEMPLATE",
      `text=${encodeURIComponent(eventCalendarTitle(event))}`,
      `dates=${dates}`,
      `ctz=${encodeURIComponent(TZ)}`,
    ];
    const details = calendarDetails(event);
    if (details) parts.push(`details=${encodeURIComponent(details)}`);
    const loc = locationText(event);
    if (loc) parts.push(`location=${encodeURIComponent(loc)}`);
    return `https://calendar.google.com/calendar/render?${parts.join("&")}`;
  }

  function toLocalStamp(iso) {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "longOffset",
    }).formatToParts(d);
    const value = (type) => {
      const part = parts.find((item) => item.type === type);
      return part ? part.value : "";
    };
    let hour = value("hour");
    if (hour === "24") hour = "00";
    const offsetMatch = value("timeZoneName").match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    const offset = offsetMatch
      ? `${offsetMatch[1]}${offsetMatch[2].padStart(2, "0")}:${offsetMatch[3] || "00"}`
      : "+00:00";
    return `${value("year")}-${value("month")}-${value("day")}T${hour}:${value("minute")}:${value("second")}${offset}`;
  }

  function outlookCalendarUrl(event) {
    const parts = [
      "path=/calendar/action/compose",
      "rru=addevent",
      `subject=${encodeURIComponent(eventCalendarTitle(event))}`,
    ];
    if (timeIsUnknown(event)) {
      const bounds = allDayBounds(event);
      parts.push("allday=true");
      parts.push(`startdt=${encodeURIComponent(ymdIsoDate(bounds.startYmd))}`);
      parts.push(`enddt=${encodeURIComponent(ymdIsoDate(bounds.endExclusive))}`);
    } else {
      parts.push(`startdt=${encodeURIComponent(toLocalStamp(event.start))}`);
      parts.push(`enddt=${encodeURIComponent(toLocalStamp(eventEndIso(event)))}`);
    }
    const loc = locationText(event);
    if (loc) parts.push(`location=${encodeURIComponent(loc)}`);
    const details = calendarDetails(event);
    if (details) parts.push(`body=${encodeURIComponent(details)}`);
    return `https://outlook.office.com/calendar/0/deeplink/compose?${parts.join("&")}`;
  }

  function icsEscape(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\n|\r/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function foldIcs(text) {
    const out = [];
    text.split("\r\n").forEach((line) => {
      let rest = line;
      let first = true;
      while (rest.length > 73) {
        const take = first ? 73 : 72;
        out.push(rest.slice(0, take));
        rest = rest.slice(take);
        first = false;
        if (rest) rest = " " + rest;
      }
      out.push(rest);
    });
    return out.join("\r\n");
  }

  function icsContent(event) {
    const uid = `${event.id || "event"}@london-political-events`;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//London Political Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${icsEscape(uid)}`,
      `DTSTAMP:${toUtcStamp(new Date())}`,
    ];
    if (timeIsUnknown(event)) {
      const bounds = allDayBounds(event);
      lines.push(`DTSTART;VALUE=DATE:${ymdCompact(bounds.startYmd)}`);
      lines.push(`DTEND;VALUE=DATE:${ymdCompact(bounds.endExclusive)}`);
    } else {
      lines.push(`DTSTART:${toUtcStamp(event.start)}`);
      lines.push(`DTEND:${toUtcStamp(eventEndIso(event))}`);
    }
    lines.push(`SUMMARY:${icsEscape(eventCalendarTitle(event))}`);
    const loc = locationText(event);
    if (loc) lines.push(`LOCATION:${icsEscape(loc)}`);
    const details = calendarDetails(event);
    if (details) lines.push(`DESCRIPTION:${icsEscape(details)}`);
    lines.push("END:VEVENT", "END:VCALENDAR");
    return foldIcs(lines.join("\r\n")) + "\r\n";
  }

  function downloadIcs(event) {
    const blob = new Blob([icsContent(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = String(event.id || "event").replace(/[^\w.-]+/g, "-");
    a.href = url;
    a.download = `${safe}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function siteRoot() {
    return new URL("./", window.location.href);
  }

  function shareUrl(event) {
    const url = siteRoot();
    if (event.id) url.searchParams.set("event", event.id);
    if (event.start) {
      const ymd = eventYmdInTz(event.start);
      if (ymd.y && ymd.m && ymd.d) url.searchParams.set("date", ymdKey(ymd));
    }
    const ideology = fieldText(event.ideology);
    if (IDEO_BY_ID[ideology]) url.searchParams.set("ideology", ideology);
    const format = formatKind(event.format);
    if (SHARE_FORMATS.has(format)) url.searchParams.set("format", format);
    return url.href;
  }

  function sourceUrl(event) {
    return fieldText(event.url) || fieldText(event.rsvp_url);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      /* Fall through to the selection copy below. */
    }
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch (err) {
      return false;
    }
  }

  function showShareFeedback(button, message) {
    if (!button) return;
    const label = button.querySelector(".share-label");
    if (label) label.textContent = message;
    button.classList.toggle("is-copied", message === "Copied");
    window.setTimeout(() => {
      if (!button.isConnected) return;
      const live = button.querySelector(".share-label");
      if (live) live.textContent = "Share";
      button.classList.remove("is-copied");
    }, 1800);
  }

  async function shareEvent(event, button) {
    const url = shareUrl(event);
    const payload = {
      title: event.title || "London Political Events",
      text: event.title || "London Political Events",
      url,
    };
    let canShare = typeof navigator.share === "function";
    if (canShare && typeof navigator.canShare === "function") {
      try {
        canShare = navigator.canShare(payload);
      } catch (err) {
        canShare = false;
      }
    }
    if (canShare) {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    const copied = await copyText(url);
    showShareFeedback(button, copied ? "Copied" : "Copy failed");
  }

  function uniqueValues(values) {
    const seen = new Set();
    return values.filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  function paramValues(params, key) {
    return uniqueValues(
      params
        .getAll(key)
        .flatMap((part) => String(part).split(","))
        .map((part) => part.trim())
        .filter(Boolean)
    );
  }

  function applyDeepLink() {
    if (state.deepLinkApplied) return;
    state.deepLinkApplied = true;
    const params = new URLSearchParams(window.location.search);
    const eventId = (params.get("event") || "").trim();
    const event = eventId ? allEvents.find((item) => item.id === eventId) : null;
    const dateKey = (params.get("date") || "").trim();
    const ideologies = paramValues(params, "ideology").filter((value) => IDEO_BY_ID[value]);
    const formats = paramValues(params, "format").filter((value) => SHARE_FORMATS.has(value));
    setIdeologies(ideologies);
    if (formats.length) setSegment("format", formats[0]);

    const today = todayYmd();
    let start = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      const ymd = parseYmdKey(dateKey);
      if (isRealYmd(ymd) && ymdCmp(ymd, today) >= 0 && inYmdRange(ymd, listWindow())) start = ymd;
    }
    if (event && event.start) {
      const ymd = eventYmdInTz(event.start);
      if (ymdCmp(ymd, today) >= 0 && inYmdRange(ymd, listWindow())) start = ymd;
    }
    if (start) {
      state.listStart = start;
      state.weekStart = start;
      state.stripDay = start;
      state.miniYear = start.y;
      state.miniMonth = start.m;
    }
    if (!event) {
      if (params.get("view") === "calendar") state.view = "calendar";
      return;
    }
    if (!matches(event, getFilters())) {
      if (ideologies.length && !matchesIdeology(event, ideologies)) setIdeologies([]);
      if (formats.length && formats[0] !== formatKind(event.format)) setSegment("format", "all");
    }
    if (!matches(event, getFilters())) return;
    state.openEventId = event.id;
    state.view = "list";
    state.pendingScroll = true;
  }

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function actionsHtml(event, variant) {
    const menuId = domId(variant === "card" ? "card-menu" : "cal-menu", event.id);
    const page = event.simulated ? "" : sourceUrl(event);
    const rsvp = event.simulated ? "" : fieldText(event.rsvp_url);
    const url = event.simulated ? "" : fieldText(event.url);
    const share = shareUrl(event);
    const primaryClass = variant === "card" ? "btn-primary cal-menu-btn" : "btn-primary cal-menu-btn";
    const parts = [
      `<div class="cal-menu">
        <button type="button" class="${primaryClass}" aria-expanded="false" aria-haspopup="menu" aria-controls="${menuId}">
          <span class="ms" aria-hidden="true">event</span> ${event.simulated ? "Add sample to calendar" : "Add to calendar"}
        </button>
        <div class="cal-menu-panel" id="${menuId}" role="menu" hidden>
          <a role="menuitem" href="${escapeHtml(googleCalendarUrl(event))}" target="_blank" rel="noopener noreferrer">Google Calendar</a>
          <button type="button" role="menuitem" data-ics="${escapeHtml(event.id)}">ICS file</button>
          <a role="menuitem" href="${escapeHtml(outlookCalendarUrl(event))}" target="_blank" rel="noopener noreferrer">Outlook</a>
        </div>
      </div>`,
      `<a class="btn-secondary share-link" data-share="${escapeHtml(event.id)}" href="${escapeHtml(share)}" aria-label="Share link to this event on this site"><span class="share-label">Share</span></a>`,
    ];
    if (page) {
      parts.push(
        `<a class="btn-secondary" href="${escapeHtml(page)}" target="_blank" rel="noopener noreferrer">Event page ↗</a>`
      );
    }
    if (rsvp && url && rsvp !== url) {
      parts.push(
        `<a class="btn-secondary" href="${escapeHtml(rsvp)}" target="_blank" rel="noopener noreferrer">Booking page ↗</a>`
      );
    }
    return `<div class="event-actions">${parts.join("")}</div>`;
  }

  function detailsInner(event) {
    const parts = [];
    if (event.simulated) parts.push('<p class="sample-detail">Simulated event. All details are fictional; no registration is available.</p>');
    const description = fieldText(event.description);
    if (description) {
      parts.push(`<p class="event-description">${escapeHtml(description).replace(/\n/g, "<br>")}</p>`);
    } else {
      parts.push(`<p class="event-description is-empty">No description posted.</p>`);
    }
    const speakers = speakersLabel(event.speakers);
    if (speakers) {
      parts.push(`<p class="detail-line"><span class="detail-label">Speakers</span> ${escapeHtml(speakers)}</p>`);
    }
    const prep = preparedById.get(event.id);
    const timeUnknown = prep ? prep.timeUnknown : timeIsUnknown(event);
    const label = admissionLabel(event);
    if (label && !timeUnknown) parts.push(`<p class="detail-line"><span class="detail-label">${label}</span> ${escapeHtml(formatStartTime(event.start))}</p>`);
    for (const field of ["doors","arrival"]) if (event[field]) parts.push(`<p class="detail-line"><span class="detail-label">${field === "doors" ? "Doors" : "Arrival"}</span> ${escapeHtml(formatStartTime(event[field]))}</p>`);
    if (timeUnknown) {
      parts.push(`<p class="detail-line">Time TBC</p>`);
    } else if (event.end) {
      const endMs = prep ? prep.endMs : new Date(event.end).getTime();
      const startMs = prep ? prep.startMs : new Date(event.start).getTime();
      if (!Number.isNaN(endMs) && endMs > startMs) {
        const endLabel = prep && prep.endTimeLabel ? prep.endTimeLabel : formatStartTime(event.end);
        parts.push(`<p class="detail-line"><span class="detail-label">Ends</span> ${escapeHtml(endLabel)}</p>`);
      }
    }
    const loc = locationText(event);
    if (loc) {
      const maps = event.simulated ? "" : fieldText(event.maps_url);
      const body = maps
        ? `<a href="${escapeHtml(maps)}" target="_blank" rel="noopener noreferrer">${escapeHtml(loc)}</a>`
        : escapeHtml(loc);
      parts.push(
        `<div class="event-venue"><span class="ms" aria-hidden="true">location_on</span><span>${body}</span></div>`
      );
    }
    const access = fieldText(event.access);
    if (access && access.toLowerCase() !== "rsvp") {
      parts.push(`<p class="detail-line"><span class="detail-label">Access</span> ${escapeHtml(access)}</p>`);
    }
    const notes = fieldText(event.notes);
    if (notes) parts.push(`<p class="detail-line"><span class="detail-label">Notes</span> ${escapeHtml(notes)}</p>`);
    for (const [key,label] of [["booking_fees","Booking fees"],["age_restrictions","Age"],["physical_accessibility","Accessibility"]]) {
      if (event[key]) parts.push(`<p class="detail-line"><span class="detail-label">${label}</span> ${escapeHtml(fieldText(event[key]))}</p>`);
    }
    const formatRaw = fieldText(event.format);
    const simpleFormat = prep ? prep.simpleFormat : isSimpleFormat(formatRaw);
    if (formatRaw && !simpleFormat) {
      parts.push(`<p class="detail-line"><span class="detail-label">Format</span> ${escapeHtml(formatRaw)}</p>`);
    }
    const paid = fieldText(event.cost);
    if (paid && !["free","paid","unknown"].includes(paid.toLowerCase())) {
      parts.push(`<p class="detail-line"><span class="detail-label">Cost</span> ${escapeHtml(paid)}</p>`);
    }
    parts.push(actionsHtml(event, "list"));
    return parts.join("");
  }

  function formatCardWhen(event) {
    const prep = preparedById.get(event.id);
    const ymd = prep ? prep.startYmd : eventYmdInTz(event.start);
    const today = todayYmd();
    let day;
    if (ymdCmp(ymd, today) === 0) day = "Today";
    else if (ymdCmp(ymd, addDays(today, 1)) === 0) day = "Tomorrow";
    else day = `${WEEKDAYS_SHORT[weekdayIndex(ymd)]}, ${MONTHS_SMALL[ymd.m - 1]} ${ymd.d}`;
    const time = startTimeLabel(event);
    return `${day} · ${time}`;
  }

  function renderEventRow(event, ymd) {
    const prep = preparedById.get(event.id);
    const open = state.openEventId === event.id;
    const ideo = prep ? prep.ideo : ideologyView(event);
    const detailsId = domId("details", `${event.id}-${ymd ? ymdKey(ymd) : "x"}`);
    const org = prep ? prep.orgLine : orgLine(event);
    const badge = spanBadgeHtml(event, ymd);
    const time = startTimeLabel(event);
    const format = prep ? prep.formatLabel : formatLabel(event.format);
    const meta = prep ? prep.meta : metaLine(event);
    const cost = prep ? prep.costShort : costShort(event);
    return `
      <article class="event-row${open ? " is-open" : ""}" data-id="${escapeHtml(event.id)}">
        <button type="button" class="event-summary" aria-expanded="${open ? "true" : "false"}" aria-controls="${detailsId}">
          <span class="event-when">
            <span class="event-time">${escapeHtml(time)}</span>
            <span class="event-format">${escapeHtml(format)}</span>
          </span>
          <span class="event-main">
            <span class="event-dateline">${escapeHtml(formatCardWhen(event))}</span>
            <span class="event-eyebrow">
              ${event.simulated ? '<span class="sample-badge">Simulated</span>' : ""}
              ${org ? `<span class="event-org">${escapeHtml(org)}</span>` : ""}
              ${ideo ? `<span class="event-ideo" style="color:${ideo.text || ideo.color}">${escapeHtml(ideo.label)}</span>` : ""}
            </span>
            <span class="event-title">${escapeHtml(event.title || "Untitled event")}</span>
            ${badge}
            <span class="event-meta">${escapeHtml(meta)}</span>
            <span class="event-badges">
              <span class="event-badge">${escapeHtml(format)}</span>
              <span class="event-badge">${escapeHtml(cost)}</span>
            </span>
          </span>
          <span class="ms chevron" aria-hidden="true">${open ? "expand_less" : "expand_more"}</span>
        </button>
        <div class="event-details" id="${detailsId}"${open ? "" : " hidden"}>${open ? detailsInner(event) : ""}</div>
      </article>
    `;
  }

  function renderDaySection(ymd, events, today) {
    const headingId = domId("day", ymdKey(ymd));
    const body = events.length
      ? events.map((event) => renderEventRow(event, ymd)).join("")
      : `<p class="day-empty">Nothing listed for this day.</p>`;
    return `
      <section class="day-group" aria-labelledby="${headingId}">
        <div class="day-head" id="${headingId}">
          <span class="day-rel">${escapeHtml(relLabel(ymd, today))}</span>
          <h3 class="day-date">${escapeHtml(formatLongDate(ymd))}</h3>
        </div>
        ${body}
      </section>
    `;
  }

  function renderCalendarCard(event, ymd) {
    const prep = preparedById.get(event.id);
    const open = state.openEventId === event.id;
    const ideo = prep ? prep.ideo : ideologyView(event);
    const color = ideo ? ideo.color : "#AFC0CA";
    const detailsId = domId("card-details", `${event.id}-${ymd ? ymdKey(ymd) : "x"}`);
    const org = prep ? prep.orgLine : orgLine(event);
    const badge = spanBadgeHtml(event, ymd);
    const time = startTimeLabel(event);
    const format = prep ? prep.formatLabel : formatLabel(event.format);
    const cost = prep ? prep.costShort : costShort(event);
    const more = open
      ? `<div class="cal-card-more" id="${detailsId}">
          ${detailsInner(event)}
        </div>`
      : `<div class="cal-card-more" id="${detailsId}" hidden></div>`;
    return `
      <article class="cal-card" data-id="${escapeHtml(event.id)}" style="--ideo:${color}">
        <button type="button" class="cal-card-hit" aria-expanded="${open ? "true" : "false"}" aria-controls="${detailsId}">
          <span class="cal-card-time">${escapeHtml(time)}</span>
          ${event.simulated ? '<span class="sample-badge">Simulated</span>' : ""}
          ${badge}
          <span class="cal-card-title">${escapeHtml(event.title || "Untitled event")}</span>
          ${org ? `<span class="cal-card-org">${escapeHtml(org)}</span>` : ""}
          <span class="cal-tags">
            <span class="cal-tag">${escapeHtml(format)}</span>
            <span class="cal-tag">${escapeHtml(cost)}</span>
          </span>
        </button>
        ${more}
      </article>
    `;
  }

  function setHtml(el, key, html) {
    if (!el) return false;
    if (htmlMemo.get(el) === key) return false;
    htmlMemo.set(el, key);
    el.innerHTML = html;
    return true;
  }

  function renderList() {
    if (!eventsLoaded) {
      setHtml(els.eventList, "loading", `<p class="loading">Loading events…</p>`);
      return;
    }
    const today = todayYmd();
    const view = getView();
    const open = state.openEventId || "";
    if (isPhoneLayout()) {
      const ymd = state.listStart || today;
      const html = renderDaySection(ymd, eventsOnDay(ymd), today);
      setHtml(els.eventList, `${dataGeneration}|phone|${view.key}|${ymdKey(ymd)}|${open}|${ymdKey(today)}`, html);
      return;
    }
    const end = clippedEnd(state.listStart, 2);
    const parts = [];
    for (let ymd = state.listStart; ymdCmp(ymd, end) <= 0; ymd = addDays(ymd, 1)) {
      parts.push(renderDaySection(ymd, eventsOnDay(ymd), today));
    }
    setHtml(
      els.eventList,
      `${dataGeneration}|desk|${view.key}|${ymdKey(state.listStart)}|${ymdKey(end)}|${open}|${ymdKey(today)}`,
      parts.join("")
    );
  }

  function isMobileLayout() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function isPhoneLayout() {
    return window.matchMedia("(max-width: 700px)").matches;
  }

  function activeFilterCount() {
    const f = viewCache ? viewCache.filters : getFilters();
    let count = 0;
    if (f.search) count += 1;
    if (f.from || f.to) count += 1;
    count += (f.topics || []).length;
    count += f.ideologies.length;
    count += (f.time || []).length;
    if (f.freeFood) count += 1;
    if (f.freeDrinks) count += 1;
    if (f.yp) count += 1;
    if (f.cost && f.cost !== "all") count += 1;
    if (f.format && f.format !== "all") count += 1;
    return count;
  }

  function syncPhoneDom() {
    const phone = isPhoneLayout();
    document.body.classList.toggle("is-phone", phone);
    const search = document.getElementById("search-block");
    const searchHome = document.getElementById("search-home");
    const searchSlot = document.getElementById("phone-search-slot");
    const mini = document.querySelector(".mini-cal-block");
    const miniHome = document.getElementById("mini-home");
    const monthSlot = document.getElementById("month-slot");
    if (search && searchHome && searchSlot) {
      const target = phone ? searchSlot : searchHome;
      if (search.parentElement !== target) target.appendChild(search);
    }
    if (mini && miniHome && monthSlot) {
      const target = phone ? monthSlot : miniHome;
      if (mini.parentElement !== target) target.appendChild(mini);
    }
    document.querySelectorAll(".section-toggle").forEach((btn) => {
      if (phone) btn.removeAttribute("tabindex");
      else btn.setAttribute("tabindex", "-1");
    });
    if (els.dateRange && els.moreDates) {
      if (phone) els.dateRange.hidden = false;
      else els.dateRange.hidden = els.moreDates.getAttribute("aria-expanded") !== "true";
    }
    if (!phone) {
      closeMenu();
      closeMonthSheet(false);
    }
  }

  function renderPhoneStrip() {
    if (!els.phoneStrip) return;
    const today = todayYmd();
    const selected = state.listStart || today;
    const last = horizonEnd();
    const view = getView();
    const parts = [];
    for (let ymd = today; ymdCmp(ymd, last) <= 0; ymd = addDays(ymd, 1)) {
      const count = prepsOnDay(ymd, view).length;
      const selectedDay = ymdCmp(ymd, selected) === 0;
      const dow = ymdCmp(ymd, today) === 0 ? "Today" : WEEKDAYS_SHORT[weekdayIndex(ymd)];
      parts.push(
        `<button type="button" class="phone-day${selectedDay ? " is-selected" : ""}${count ? " has-events" : ""}" role="tab" data-ymd="${ymdKey(ymd)}" aria-selected="${selectedDay ? "true" : "false"}" aria-label="${escapeHtml(formatLongDate(ymd))}, ${count} event${count === 1 ? "" : "s"}">` +
          `<span class="phone-dow">${escapeHtml(dow)}</span>` +
          `<span class="phone-num">${ymd.d}</span>` +
          `<span class="phone-dot"></span>` +
        `</button>`
      );
    }
    const key = `${dataGeneration}|${view.key}|${ymdKey(today)}|${ymdKey(selected)}|${ymdKey(last)}`;
    if (setHtml(els.phoneStrip, key, parts.join(""))) phoneStripScroll = true;
  }

  function scrollPhoneStrip() {
    if (!phoneStripScroll || !els.phoneStrip) return;
    phoneStripScroll = false;
    const current = els.phoneStrip.querySelector(".is-selected");
    if (!current) return;
    const left = current.offsetLeft - (els.phoneStrip.clientWidth - current.offsetWidth) / 2;
    els.phoneStrip.scrollLeft = Math.max(0, left);
  }

  function renderWeek() {
    const today = todayYmd();
    const mobile = isMobileLayout();
    const view = getView();
    const columns = [];
    const strip = [];
    for (let i = 0; i < 7; i += 1) {
      const ymd = addDays(state.weekStart, i);
      const dayEvents = eventsOnDay(ymd);
      const isToday = ymdCmp(ymd, today) === 0;
      const selected = state.stripDay && ymdCmp(ymd, state.stripDay) === 0;
      if (!mobile) {
        const body = dayEvents.length
          ? dayEvents.map((event) => renderCalendarCard(event, ymd)).join("")
          : `<p class="week-empty">Nothing listed</p>`;
        columns.push(`
          <div class="week-col${isToday ? " is-today" : ""}">
            <div class="week-col-head">
              <span class="week-col-dow">${WEEKDAYS_SHORT[weekdayIndex(ymd)]}</span>
              <span class="week-col-num">${ymd.d}</span>
            </div>
            <div class="week-col-body">${body}</div>
          </div>
        `);
      } else {
        strip.push(`
          <button type="button" class="strip-btn${selected ? " is-selected" : ""}${dayEvents.length ? " has-events" : ""}" role="tab" data-ymd="${ymdKey(ymd)}" aria-selected="${selected ? "true" : "false"}" aria-label="${escapeHtml(formatLongDate(ymd))}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}">
            <span class="dow">${WEEKDAYS_SHORT[weekdayIndex(ymd)]}</span>
            <span class="n">${ymd.d}</span>
            <span class="strip-dot"></span>
          </button>
        `);
      }
    }
    const open = state.openEventId || "";
    if (mobile) {
      setHtml(els.weekBoard, "empty", "");
      const stripYmd = state.stripDay && inYmdRange(state.stripDay, { start: state.weekStart, end: addDays(state.weekStart, 6) })
        ? state.stripDay
        : state.weekStart;
      state.stripDay = stripYmd;
      const base = `${dataGeneration}|m|${view.key}|${ymdKey(state.weekStart)}|${ymdKey(stripYmd)}|${ymdKey(today)}`;
      setHtml(els.dayStrip, `${base}|strip`, strip.join(""));
      const stripEvents = eventsOnDay(stripYmd);
      const stripBody = stripEvents.length
        ? stripEvents.map((event) => renderEventRow(event, stripYmd)).join("")
        : `<p class="day-empty">Nothing listed for this day.</p>`;
      setHtml(els.stripDay, `${base}|${open}`, `
        <section class="day-group" aria-labelledby="strip-heading">
          <div class="day-head" id="strip-heading">
            <span class="day-rel">${escapeHtml(relLabel(stripYmd, today))}</span>
            <h3 class="day-date">${escapeHtml(formatLongDate(stripYmd))}</h3>
          </div>
          ${stripBody}
        </section>
      `);
    } else {
      const base = `${dataGeneration}|w|${view.key}|${ymdKey(state.weekStart)}|${open}|${ymdKey(today)}`;
      setHtml(els.weekBoard, base, columns.join(""));
      setHtml(els.dayStrip, "empty", "");
      setHtml(els.stripDay, "empty", "");
    }
  }

  function dayCounts() {
    const view = getView();
    if (view.counts) return view.counts;
    const counts = new Map();
    const cal = calendarWindow();
    view.list.forEach((prep) => {
      let ymd = ymdCmp(prep.startYmd, cal.start) > 0 ? prep.startYmd : cal.start;
      const stop = ymdCmp(prep.endYmd, cal.end) < 0 ? prep.endYmd : cal.end;
      if (ymdCmp(ymd, stop) > 0) return;
      for (; ymdCmp(ymd, stop) <= 0; ymd = addDays(ymd, 1)) {
        if (!dayInDateFilter(ymd, view.filters)) continue;
        const key = ymdKey(ymd);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    view.counts = counts;
    return counts;
  }

  function renderMiniCalendar() {
    if (state.miniYear == null || state.miniMonth == null) {
      const today = todayYmd();
      state.miniYear = today.y;
      state.miniMonth = today.m;
    }
    const title = formatMonthTitle(state.miniYear, state.miniMonth);
    els.calendarMonth.textContent = title;
    const today = todayYmd();
    const counts = dayCounts();
    const firstWeekday = weekdayIndex({ y: state.miniYear, m: state.miniMonth, d: 1 });
    const dim = daysInMonthUtc(state.miniYear, state.miniMonth);
    const prevDays = daysInMonthUtc(state.miniYear, state.miniMonth === 1 ? 12 : state.miniMonth - 1);
    const totalCells = Math.ceil((firstWeekday + dim) / 7) * 7;
    const rangeStart = state.listStart;
    const rangeEnd = clippedEnd(state.listStart, 2);
    const cal = calendarWindow();
    const view = getView();
    const gridKey = `${dataGeneration}|${state.miniYear}-${state.miniMonth}|${view.key}|${rangeStart ? ymdKey(rangeStart) : ""}|${state.view}|${ymdKey(today)}`;
    if (htmlMemo.get(els.calendarGrid) === gridKey) {
      if (focusYmdKey) {
        const button = els.calendarGrid.querySelector(`button[data-ymd="${focusYmdKey}"]`);
        focusYmdKey = null;
        if (button) button.focus();
      }
      return;
    }
    const cells = [];
    for (let i = 0; i < totalCells; i += 1) {
      let dayNum;
      let cellYear = state.miniYear;
      let cellMonth = state.miniMonth;
      let outside = false;
      if (i < firstWeekday) {
        dayNum = prevDays - firstWeekday + 1 + i;
        const prev = monthOf(state.miniYear, state.miniMonth, -1);
        cellYear = prev.y;
        cellMonth = prev.m;
        outside = true;
      } else if (i >= firstWeekday + dim) {
        dayNum = i - firstWeekday - dim + 1;
        const next = monthOf(state.miniYear, state.miniMonth, 1);
        cellYear = next.y;
        cellMonth = next.m;
        outside = true;
      } else {
        dayNum = i - firstWeekday + 1;
      }
      const ymd = { y: cellYear, m: cellMonth, d: dayNum };
      const key = ymdKey(ymd);
      const count = counts.get(key) || 0;
      const inWindow = inYmdRange(ymd, cal);
      const isToday = ymdCmp(today, ymd) === 0;
      const inRange = state.view === "list" && ymdCmp(ymd, rangeStart) >= 0 && ymdCmp(ymd, rangeEnd) <= 0;
      const classes = ["cal-cell"];
      if (outside) classes.push("is-outside");
      if (count) classes.push("has-events");
      if (inRange && inWindow) classes.push("is-range");
      if (isToday) classes.push("is-today");
      const label = !inWindow
        ? ymdCmp(ymd, cal.start) < 0
          ? `${formatLongDate(ymd)}, in the past`
          : `${formatLongDate(ymd)}, outside the calendar`
        : count
          ? `${formatLongDate(ymd)}, ${count} event${count === 1 ? "" : "s"}`
          : `${formatLongDate(ymd)}, no events`;
      cells.push(
        `<button type="button" class="${classes.join(" ")}" data-ymd="${key}" aria-pressed="${inRange && inWindow ? "true" : "false"}"${isToday ? ' aria-current="date"' : ""}${inWindow ? "" : " disabled"} aria-label="${escapeHtml(label)}"><span>${dayNum}</span><span class="cal-dot"></span></button>`
      );
    }
    setHtml(els.calendarGrid, gridKey, cells.join(""));
    els.calendarGrid.setAttribute("aria-label", title);
    const prevMonth = monthOf(state.miniYear, state.miniMonth, -1);
    const nextMonth = monthOf(state.miniYear, state.miniMonth, 1);
    els.calPrev.disabled = !monthOverlapsCalendar(prevMonth.y, prevMonth.m);
    els.calNext.disabled = !monthOverlapsCalendar(nextMonth.y, nextMonth.m);
    if (focusYmdKey) {
      const button = els.calendarGrid.querySelector(`button[data-ymd="${focusYmdKey}"]`);
      focusYmdKey = null;
      if (button) button.focus();
    }
  }

  function updateIdeologyCounts() {
    const f = viewCache ? viewCache.filters : getFilters();
    const base = { ...f, ideologies: [] };
    const key = `${filtersKey(base)}:${dataGeneration}`;
    if (key !== ideoCountKey || !ideoCountCache) {
      const counts = Object.fromEntries(IDEOLOGIES.map((item) => [item.id, 0]));
      const source =
        f.ideologies && f.ideologies.length
          ? preparedEvents.filter((prep) => matchesPrep(prep, base))
          : viewCache
            ? viewCache.list
            : [];
      source.forEach((prep) => {
        IDEOLOGIES.forEach((ideo) => {
          if (matchesIdeologyPrep(prep, [ideo.id])) counts[ideo.id] += 1;
        });
      });
      ideoCountKey = key;
      ideoCountCache = counts;
    }
    IDEOLOGIES.forEach((ideo) => {
      const el = document.querySelector(`[data-count-for="${ideo.id}"]`);
      if (el) el.textContent = String(ideoCountCache[ideo.id] || 0);
    });
  }

  function visibleCount() {
    const days = state.view === "calendar" ? 7 : 3;
    const origin = state.view === "calendar" ? state.weekStart : state.listStart;
    const hard = horizonEnd();
    const view = getView();
    const seen = new Set();
    for (let i = 0; i < days; i += 1) {
      const ymd = addDays(origin, i);
      if (ymdCmp(ymd, hard) > 0) break;
      prepsOnDay(ymd, view).forEach((prep) => seen.add(prep));
    }
    return seen.size;
  }

  function canShiftWeek(delta) {
    const next = addDays(state.weekStart, delta * 7);
    if (delta < 0 && ymdCmp(next, todayYmd()) < 0) return false;
    if (delta > 0 && ymdCmp(next, horizonEnd()) > 0) return false;
    return true;
  }

  function updateChrome() {
    const today = todayYmd();
    const phone = isPhoneLayout();
    const calendar = state.view === "calendar" && !phone;
    document.body.classList.toggle("is-calendar", calendar);
    els.listView.hidden = calendar;
    els.calView.hidden = !calendar;
    els.weekPrev.hidden = !calendar;
    els.weekNext.hidden = !calendar;
    if (calendar) {
      els.weekPrev.disabled = !canShiftWeek(-1);
      els.weekNext.disabled = !canShiftWeek(1);
    }
    const icon = els.viewToggle.querySelector(".ms");
    if (icon) icon.textContent = calendar ? "view_agenda" : "calendar_month";
    if (els.viewToggleLabel) els.viewToggleLabel.textContent = calendar ? "List view" : "Calendar";
    els.viewToggle.setAttribute("aria-pressed", calendar ? "true" : "false");

    if (phone) {
      const ymd = state.listStart || today;
      const rel = relLabel(ymd, today);
      els.mainTitle.textContent = rel === "Today" || rel === "Tomorrow" ? rel : formatLongDate(ymd);
      els.mainRange.textContent = formatLongDate(ymd);
      els.backToday.hidden = ymdCmp(ymd, today) === 0;
    } else if (calendar) {
      const a = state.weekStart;
      const b = addDays(a, 6);
      els.mainTitle.textContent = ymdCmp(a, today) === 0 ? "This week" : formatTitleRange(a, b);
      els.mainRange.textContent = formatSmallRange(a, b);
      els.backToday.hidden = ymdCmp(a, today) === 0;
    } else {
      const a = state.listStart;
      const b = clippedEnd(a, 2);
      const spanDays = daysBetween(a, b) + 1;
      if (ymdCmp(a, today) === 0 && spanDays === 3) els.mainTitle.textContent = "Next three days";
      else if (spanDays === 1) {
        const rel = relLabel(a, today);
        els.mainTitle.textContent = rel === "Today" || rel === "Tomorrow" ? rel : formatLongDate(a);
      } else els.mainTitle.textContent = formatTitleRange(a, b);
      els.mainRange.textContent = spanDays === 1 ? formatLongDate(a) : formatSmallRange(a, b);
      els.backToday.hidden = ymdCmp(a, today) === 0;
    }

    const shown = eventsLoaded
      ? phone
        ? eventsOnDay(state.listStart || today).length
        : visibleCount()
      : 0;
    if (els.closeFilters) {
      els.closeFilters.textContent = eventsLoaded
        ? `Show ${shown} event${shown === 1 ? "" : "s"}`
        : "Show events";
    }
    if (els.meta) {
      if (!eventsLoaded) els.meta.textContent = "Loading events";
      else if (phone) {
        els.meta.textContent = `${shown} event${shown === 1 ? "" : "s"}, ${formatLongDate(state.listStart || today)}`;
      } else if (calendar) {
        els.meta.textContent = `${shown} event${shown === 1 ? "" : "s"}, ${formatSmallRange(state.weekStart, addDays(state.weekStart, 6))}`;
      } else {
        const listEnd = clippedEnd(state.listStart, 2);
        const listRange = ymdCmp(state.listStart, listEnd) === 0
          ? formatLongDate(state.listStart)
          : formatSmallRange(state.listStart, listEnd);
        els.meta.textContent = `${shown} event${shown === 1 ? "" : "s"}, ${listRange}`;
      }
    }
    const filtersOn = activeFilterCount();
    document.querySelectorAll("[data-filter-count]").forEach((badge) => {
      badge.hidden = filtersOn === 0;
      badge.textContent = String(filtersOn);
    });
  }

  function flushLayoutReads() {
    scrollPhoneStrip();
    scrollPending();
  }

  function scrollPending() {
    if (!state.pendingScroll || !state.openEventId) return;
    const root = state.view === "calendar" ? els.calView : els.eventList;
    const card = root.querySelector(`[data-id="${cssEscape(state.openEventId)}"]`);
    state.pendingScroll = false;
    if (!card) return;
    const target = card.querySelector(".event-summary, .cal-card-hit");
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "center",
    });
    target.focus({ preventScroll: true });
  }

  function render() {
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = 0;
    }
    syncPhoneDom();
    if (eventsLoaded) getView();
    updateChrome();
    updateIdeologyCounts();
    renderMiniCalendar();
    if (isPhoneLayout()) {
      renderPhoneStrip();
      renderList();
      setHtml(els.weekBoard, "empty", "");
      setHtml(els.dayStrip, "empty", "");
      setHtml(els.stripDay, "empty", "");
    } else if (state.view === "list") {
      renderList();
      setHtml(els.weekBoard, "empty", "");
      setHtml(els.dayStrip, "empty", "");
      setHtml(els.stripDay, "empty", "");
      if (els.phoneStrip) setHtml(els.phoneStrip, "empty", "");
    } else {
      setHtml(els.eventList, "empty", "");
      renderWeek();
    }
    requestAnimationFrame(flushLayoutReads);
  }

  function clearFilters() {
    els.search.value = "";
    els.dateFrom.value = "";
    els.dateTo.value = "";
    setIdeologies([]);
    setSegment("format", "all");
    setSegment("cost", "all");
    ["time", "topic", "perk"].forEach((name) => setChipValues(name, []));
    if (els.dateRange) els.dateRange.hidden = true;
    if (els.moreDates) els.moreDates.setAttribute("aria-expanded", "false");
    render();
  }

  function goToday() {
    const today = todayYmd();
    state.view = "list";
    state.listStart = today;
    state.weekStart = today;
    state.stripDay = today;
    state.miniYear = today.y;
    state.miniMonth = today.m;
    state.openEventId = null;
    closeFilterSheet(false);
    render();
  }

  function shiftWeek(delta) {
    if (!canShiftWeek(delta)) return;
    state.weekStart = addDays(state.weekStart, delta * 7);
    state.stripDay = state.weekStart;
    render();
  }

  function closeMenus(restore) {
    document.querySelectorAll(".cal-menu.is-open").forEach((menu) => {
      menu.classList.remove("is-open");
      const btn = menu.querySelector(".cal-menu-btn");
      const panel = menu.querySelector(".cal-menu-panel");
      if (btn) btn.setAttribute("aria-expanded", "false");
      if (panel) {
        panel.hidden = true;
        panel.classList.remove("is-up");
      }
      if (restore && btn) btn.focus();
    });
  }

  function openMenu(menu) {
    closeMenus(false);
    const btn = menu.querySelector(".cal-menu-btn");
    const panel = menu.querySelector(".cal-menu-panel");
    if (!btn || !panel) return;
    menu.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    const rect = panel.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 8) panel.classList.add("is-up");
    const first = panel.querySelector("[role='menuitem']");
    if (first) first.focus({ preventScroll: true });
  }

  function setCardsOpen(id, open) {
    const prep = preparedById.get(id);
    const nodes = document.querySelectorAll(`[data-id="${cssEscape(id)}"]`);
    if (!nodes.length) return false;
    nodes.forEach((card) => {
      if (card.classList.contains("event-row")) card.classList.toggle("is-open", open);
      const button = card.querySelector(".event-summary, .cal-card-hit");
      if (button) button.setAttribute("aria-expanded", open ? "true" : "false");
      const chevron = card.querySelector(".chevron");
      if (chevron) chevron.textContent = open ? "expand_less" : "expand_more";
      const details = card.querySelector(".event-details, .cal-card-more");
      if (!details) return;
      if (open) {
        details.innerHTML = prep ? detailsInner(prep.event) : "";
        details.removeAttribute("hidden");
      } else {
        details.textContent = "";
        details.setAttribute("hidden", "");
      }
    });
    return true;
  }

  function toggleOpen(id) {
    const prev = state.openEventId;
    const next = prev === id ? null : id;
    state.openEventId = next;
    const closed = !prev || setCardsOpen(prev, false);
    const opened = !next || setCardsOpen(next, true);
    if (!closed || !opened) render();
  }

  function findEvent(id) {
    return allEvents.find((item) => item.id === id);
  }

  function onResultClick(e) {
    const ics = e.target.closest("[data-ics]");
    if (ics) {
      e.preventDefault();
      const event = findEvent(ics.dataset.ics);
      if (event) downloadIcs(event);
      closeMenus(false);
      return;
    }
    const share = e.target.closest("[data-share]");
    if (share) {
      e.preventDefault();
      const event = findEvent(share.dataset.share);
      if (event) shareEvent(event, share);
      return;
    }
    const calBtn = e.target.closest(".cal-menu-btn");
    if (calBtn) {
      e.preventDefault();
      const menu = calBtn.closest(".cal-menu");
      if (!menu) return;
      if (menu.classList.contains("is-open")) closeMenus(false);
      else openMenu(menu);
      return;
    }
    if (e.target.closest(".cal-menu-panel")) {
      if (e.target.closest("a")) closeMenus(false);
      return;
    }
    if (e.target.closest("a, button")) {
      const summary = e.target.closest(".event-summary, .cal-card-hit");
      if (!summary) return;
    }
    const details = e.target.closest(".event-details, .cal-card-more");
    if (details && !e.target.closest("a, button")) {
      const selection = window.getSelection && window.getSelection();
      if (selection && !selection.isCollapsed && details.contains(selection.anchorNode)) return;
      const card = details.closest("[data-id]");
      if (card) toggleOpen(card.getAttribute("data-id"));
      return;
    }
    const summary = e.target.closest(".event-summary, .cal-card-hit");
    if (!summary) return;
    const card = summary.closest("[data-id]");
    if (!card) return;
    toggleOpen(card.getAttribute("data-id"));
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    if (!els.menuToggle) return;
    els.menuToggle.setAttribute("aria-expanded", "false");
    els.menuToggle.setAttribute("aria-label", "Open menu");
    const icon = els.menuToggle.querySelector(".ms");
    if (icon) icon.textContent = "menu";
  }

  function openMenuPanel() {
    closeMonthSheet(false);
    closeFilterSheet(false);
    document.body.classList.add("menu-open");
    els.menuToggle.setAttribute("aria-expanded", "true");
    els.menuToggle.setAttribute("aria-label", "Close menu");
    const icon = els.menuToggle.querySelector(".ms");
    if (icon) icon.textContent = "close";
    const first = [...document.querySelectorAll("#overflow-menu button, #overflow-menu a")].find(
      (el) => !el.hidden && el.offsetParent !== null
    );
    if (first) first.focus();
  }

  function openMonthSheet() {
    if (!isPhoneLayout() || !els.monthSheet) return;
    closeMenu();
    closeFilterSheet(false);
    document.body.classList.add("month-open");
    els.monthSheet.hidden = false;
    if (els.closeMonth) els.closeMonth.focus();
  }

  function closeMonthSheet(restore) {
    const was = document.body.classList.contains("month-open");
    document.body.classList.remove("month-open");
    if (els.monthSheet) els.monthSheet.hidden = true;
    if (was && restore && els.openMonth) els.openMonth.focus();
  }

  function filtersOpener() {
    if (isPhoneLayout() && els.openFiltersPhone) return els.openFiltersPhone;
    return els.openFilters;
  }

  function openFilterSheet() {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    closeMenu();
    closeMonthSheet(false);
    document.body.classList.add("filters-open");
    els.sidebar.setAttribute("role", "dialog");
    els.sidebar.setAttribute("aria-modal", "true");
    els.sidebar.setAttribute("aria-labelledby", "filters-heading");
    if (els.sheetBackdrop) els.sheetBackdrop.hidden = false;
    const start = isPhoneLayout()
      ? [...els.sidebar.querySelectorAll(".section-toggle")].find((el) => !el.closest("[hidden]"))
      : document.getElementById("sheet-clear") || els.search;
    if (start) start.focus();
  }

  function closeFilterSheet(restore) {
    const was = document.body.classList.contains("filters-open");
    document.body.classList.remove("filters-open");
    els.sidebar.removeAttribute("role");
    els.sidebar.removeAttribute("aria-modal");
    if (els.sheetBackdrop) els.sheetBackdrop.hidden = true;
    const opener = filtersOpener();
    if (was && restore && opener) opener.focus();
  }

  function trapIn(e, root) {
    if (e.key !== "Tab" || !root) return;
    const focusable = root.querySelectorAll("button, [href], input, select, textarea");
    const list = [...focusable].filter((el) => !el.disabled && !el.closest("[hidden]") && el.offsetParent !== null);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function bind() {
    els.search.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchTimer = 0;
        render();
      }, 200);
    });
    els.search.addEventListener("change", render);
    [els.dateFrom, els.dateTo].forEach((el) => {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
    document.getElementById("ideo-list").addEventListener("change", render);
    els.sidebar.addEventListener("click", (e) => {
      const toggle = e.target.closest(".section-toggle");
      if (toggle && isPhoneLayout()) {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        const panel = document.getElementById(toggle.getAttribute("aria-controls"));
        toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        const block = toggle.closest(".filter-block");
        if (block) block.classList.toggle("is-collapsed", expanded);
        const icon = toggle.querySelector(".section-chevron");
        if (icon) icon.textContent = expanded ? "expand_more" : "expand_less";
        if (panel) panel.hidden = expanded;
        return;
      }
      const radio = e.target.closest(".segmented [role='radio']");
      if (radio && els.sidebar.contains(radio)) {
        setSegment(radio.closest(".segmented").dataset.filter, radio.dataset.value);
        render();
        return;
      }
      const chip = e.target.closest("button.chip");
      if (chip && els.sidebar.contains(chip)) {
        toggleChip(chip);
        render();
      }
    });
    els.sidebar.addEventListener("keydown", (e) => {
      const radio = e.target.closest(".segmented [role='radio']");
      if (!radio) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const buttons = [...radio.parentElement.querySelectorAll("[role='radio']")];
      const index = buttons.indexOf(radio);
      if (index < 0) return;
      e.preventDefault();
      const next = buttons[(index + (e.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length];
      setSegment(radio.parentElement.dataset.filter, next.dataset.value);
      next.focus();
      render();
    });
    els.clear.addEventListener("click", clearFilters);
    if (els.sheetClear) els.sheetClear.addEventListener("click", clearFilters);
    if (els.sheetClearBottom) els.sheetClearBottom.addEventListener("click", clearFilters);
    els.moreDates.addEventListener("click", () => {
      const open = els.dateRange.hidden;
      els.dateRange.hidden = !open;
      els.moreDates.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && els.dateFrom) els.dateFrom.focus();
    });
    els.refresh.addEventListener("click", () => loadEvents("refresh"));
    els.brand.addEventListener("click", goToday);
    els.backToday.addEventListener("click", goToday);
    els.viewToggle.addEventListener("click", () => {
      if (state.view === "list") {
        state.view = "calendar";
        state.weekStart = state.listStart;
        state.stripDay = state.listStart;
      } else {
        state.view = "list";
      }
      closeFilterSheet(false);
      render();
    });
    els.openCalendar.addEventListener("click", () => {
      state.view = "calendar";
      state.weekStart = state.listStart;
      state.stripDay = state.listStart;
      closeFilterSheet(false);
      render();
    });
    els.weekPrev.addEventListener("click", () => shiftWeek(-1));
    els.weekNext.addEventListener("click", () => shiftWeek(1));
    els.calPrev.addEventListener("click", () => {
      const next = monthOf(state.miniYear, state.miniMonth, -1);
      if (!monthOverlapsCalendar(next.y, next.m)) return;
      state.miniYear = next.y;
      state.miniMonth = next.m;
      renderMiniCalendar();
    });
    els.calNext.addEventListener("click", () => {
      const next = monthOf(state.miniYear, state.miniMonth, 1);
      if (!monthOverlapsCalendar(next.y, next.m)) return;
      state.miniYear = next.y;
      state.miniMonth = next.m;
      renderMiniCalendar();
    });
    els.calendarGrid.addEventListener("click", (e) => {
      const button = e.target.closest("button[data-ymd]");
      if (!button || button.disabled) return;
      const ymd = parseYmdKey(button.dataset.ymd);
      focusYmdKey = button.dataset.ymd;
      state.listStart = ymd;
      state.weekStart = ymd;
      state.stripDay = ymd;
      state.view = "list";
      state.miniYear = ymd.y;
      state.miniMonth = ymd.m;
      state.openEventId = null;
      closeFilterSheet(false);
      closeMonthSheet(false);
      render();
    });
    if (els.phoneStrip) {
      els.phoneStrip.addEventListener("click", (e) => {
        const button = e.target.closest("button[data-ymd]");
        if (!button) return;
        const ymd = parseYmdKey(button.dataset.ymd);
        state.listStart = ymd;
        state.weekStart = ymd;
        state.stripDay = ymd;
        state.view = "list";
        state.miniYear = ymd.y;
        state.miniMonth = ymd.m;
        state.openEventId = null;
        render();
      });
    }
    if (els.menuToggle) {
      els.menuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (document.body.classList.contains("menu-open")) closeMenu();
        else openMenuPanel();
      });
    }
    const overflow = document.getElementById("overflow-menu");
    if (overflow) {
      overflow.addEventListener("click", () => {
        if (isPhoneLayout()) closeMenu();
      });
    }
    if (els.openMonth) els.openMonth.addEventListener("click", openMonthSheet);
    if (els.closeMonth) els.closeMonth.addEventListener("click", () => closeMonthSheet(true));
    if (els.monthBackdrop) els.monthBackdrop.addEventListener("click", () => closeMonthSheet(true));
    els.dayStrip.addEventListener("click", (e) => {
      const button = e.target.closest("button[data-ymd]");
      if (!button) return;
      state.stripDay = parseYmdKey(button.dataset.ymd);
      render();
    });
    els.eventList.addEventListener("click", onResultClick);
    els.calView.addEventListener("click", onResultClick);
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".cal-menu")) closeMenus(false);
      if (document.body.classList.contains("menu-open") && !e.target.closest(".top-actions")) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (document.body.classList.contains("month-open")) trapIn(e, els.monthPanel);
      else if (document.body.classList.contains("filters-open")) trapIn(e, els.sidebar);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const panel = e.target.closest(".cal-menu-panel");
        if (!panel) return;
        const items = [...panel.querySelectorAll("[role='menuitem']")];
        const index = items.indexOf(document.activeElement);
        if (index < 0) return;
        e.preventDefault();
        const next = e.key === "ArrowDown"
          ? items[(index + 1) % items.length]
          : items[(index - 1 + items.length) % items.length];
        next.focus();
        return;
      }
      if (e.key !== "Escape") return;
      if (els.aboutDialog && els.aboutDialog.open) return;
      const openMenuEl = document.querySelector(".cal-menu.is-open");
      if (openMenuEl) {
        closeMenus(true);
        e.preventDefault();
        return;
      }
      if (document.body.classList.contains("month-open")) {
        closeMonthSheet(true);
        e.preventDefault();
        return;
      }
      if (document.body.classList.contains("menu-open")) {
        closeMenu();
        if (els.menuToggle) els.menuToggle.focus();
        e.preventDefault();
        return;
      }
      if (document.body.classList.contains("filters-open")) {
        closeFilterSheet(true);
        e.preventDefault();
        return;
      }
      if (state.openEventId) {
        const id = state.openEventId;
        state.openEventId = null;
        if (!setCardsOpen(id, false)) render();
        const card = document.querySelector(`[data-id="${cssEscape(id)}"] .event-summary, [data-id="${cssEscape(id)}"] .cal-card-hit`);
        if (card) card.focus();
      }
    });
    els.openFilters.addEventListener("click", openFilterSheet);
    if (els.openFiltersPhone) els.openFiltersPhone.addEventListener("click", openFilterSheet);
    els.closeFilters.addEventListener("click", () => closeFilterSheet(true));
    els.sheetBackdrop.addEventListener("click", () => closeFilterSheet(true));
    let wasMobile = isMobileLayout();
    let wasPhone = isPhoneLayout();
    window.addEventListener("resize", () => {
      if (!isMobileLayout()) closeFilterSheet(false);
      if (!isPhoneLayout()) {
        closeMenu();
        closeMonthSheet(false);
      }
      const mobile = isMobileLayout();
      const phone = isPhoneLayout();
      if (mobile !== wasMobile || phone !== wasPhone) {
        wasMobile = mobile;
        wasPhone = phone;
        render();
      }
    });

    els.aboutOpen.addEventListener("click", () => {
      if (els.aboutDialog.showModal) els.aboutDialog.showModal();
      else els.aboutDialog.setAttribute("open", "");
    });
    els.aboutClose.addEventListener("click", () => {
      if (els.aboutDialog.close) els.aboutDialog.close();
      else els.aboutDialog.removeAttribute("open");
    });

    bindInstall();
    bindPullToRefresh();
  }

  function abortAfter(ms) {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      return AbortSignal.timeout(ms);
    }
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }

  function setRefreshStatus(message, kind) {
    const el = els.refreshStatus;
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("is-error", kind === "error");
  }

  function eventsFromPayload(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    /* Published dates stay fixed. Future reserves are never loaded by the app. */
    if (Array.isArray(data.events)) return data.events;
    return [];
  }

  function applyEventsPayload(data) {
    if (data.mode !== "live") throw new Error("Only source-verified live events can be shown.");
    const prepared = LondonEventData.preparePayload(data);
    publishedWindow = prepared.mode === "live" ? prepared.window || null : null;
    listWindowCache = null;
    const raw = eventsFromPayload(prepared);
    const hasSamples = raw.some((event) => event.simulated === true);
    document.getElementById("data-status").textContent = hasSamples
      ? "Includes simulated listings, clearly labelled on each event."
      : `Check each organiser's event page for the latest details.${publishedWindow ? " Researched dates: " + publishedWindow.start + " to " + publishedWindow.end + "." : ""}`;
    allEvents = raw.filter(inListWindow);
    const win = listWindow();
    if (state.listStart && ymdCmp(state.listStart, win.start) < 0) state.listStart = win.start;
    if (state.weekStart && ymdCmp(state.weekStart, win.start) < 0) state.weekStart = win.start;
    if (state.stripDay && ymdCmp(state.stripDay, win.start) < 0) state.stripDay = win.start;
    const min = ymdKey(win.start);
    const max = ymdKey(win.end);
    if (els.dateFrom) {
      els.dateFrom.min = min;
      els.dateFrom.max = max;
    }
    if (els.dateTo) {
      els.dateTo.min = min;
      els.dateTo.max = max;
    }
    topicCatalog = deriveTopics(allEvents);
    rebuildEventIndex();
    renderTopicChips(topicCatalog);
    eventsLoaded = true;
    applyDeepLink();
    render();
  }

  function showLoadFailure(err) {
    setRefreshStatus("Failed — try again", "error");
    if (eventsLoaded) return;
    if (els.meta) els.meta.textContent = "Could not load events.";
    els.eventList.innerHTML = `<p class="day-empty">Could not load events. ${escapeHtml(
      err && err.message ? err.message : err
    )}</p>`;
  }

  async function fetchEventsDocument(url) {
    const res = await fetch(url, {
      cache: "no-store",
      signal: abortAfter(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const fromCache = res.headers.get("X-London-Events-Source") === "cache";
    const text = await res.text();
    return { text, fromCache };
  }

  function parseEventsText(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error("Invalid events JSON");
    }
    const events = Array.isArray(data) ? data : data && data.events;
    if (!Array.isArray(events)) throw new Error("No events array");
    return data;
  }

  async function loadEvents(reason) {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = loadEventsNow(reason).finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  }

  async function loadEventsNow(reason) {
    const explicit = reason === "refresh" || reason === "pull";
    if (els.refresh) els.refresh.disabled = true;
    if (explicit) setRefreshStatus("Updating…");
    try {
      const payload = await fetchEventsDocument(`${LOCAL_EVENTS_URL}?ts=${Date.now()}`);
      lastFetchedAt = Date.now();
      const payloadDay = ymdKey(todayYmd());
      if (payload.text === lastPayload && lastPayloadDay === payloadDay && eventsLoaded && !allEvents.some(event => !inListWindow(event))) {
        if (explicit) {
          setRefreshStatus(payload.fromCache ? "Offline — saved copy" : "Updated just now", payload.fromCache ? "error" : "");
        }
        return;
      }
      const data = parseEventsText(payload.text);
      applyEventsPayload(data);
      lastPayload = payload.text;
      lastPayloadDay = payloadDay;
      if (payload.fromCache) setRefreshStatus("Offline — saved copy", "error");
      else if (explicit) setRefreshStatus("Updated just now");
      else setRefreshStatus("");
    } catch (err) {
      showLoadFailure(err);
      console.error(err);
    } finally {
      if (els.refresh) els.refresh.disabled = false;
    }
  }

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function isIos() {
    const ua = window.navigator.userAgent || "";
    const classic = /iPad|iPhone|iPod/.test(ua);
    const ipadOs = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
    return classic || ipadOs;
  }

  function bindInstall() {
    const tipDismissed = (() => {
      try {
        return localStorage.getItem(INSTALL_TIP_KEY) === "1";
      } catch (err) {
        return false;
      }
    })();
    if (els.installTip && isIos() && !isStandalone() && !tipDismissed) {
      els.installTip.hidden = false;
    }
    if (els.installTipDismiss) {
      els.installTipDismiss.addEventListener("click", () => {
        if (els.installTip) els.installTip.hidden = true;
        try {
          localStorage.setItem(INSTALL_TIP_KEY, "1");
        } catch (err) {
          /* Private mode can block storage; the tip still closes. */
        }
      });
    }
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      if (els.install && !isStandalone()) els.install.hidden = false;
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      if (els.install) els.install.hidden = true;
      if (els.installTip) els.installTip.hidden = true;
    });
    if (els.install) {
      els.install.addEventListener("click", async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        try {
          await deferredInstallPrompt.userChoice;
        } catch (err) {
          /* The prompt can be dismissed without a choice result. */
        }
        deferredInstallPrompt = null;
        els.install.hidden = true;
      });
    }
  }

  function bindPullToRefresh() {
    const indicator = els.pullIndicator;
    if (!indicator) return;
    let startY = 0;
    let pulling = false;
    let dy = 0;
    const threshold = 72;

    window.addEventListener(
      "touchstart",
      (event) => {
        if (window.scrollY > 0 || event.touches.length !== 1) {
          pulling = false;
          return;
        }
        startY = event.touches[0].clientY;
        dy = 0;
        pulling = true;
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (event) => {
        if (!pulling || event.touches.length !== 1) return;
        if (window.scrollY > 0) {
          pulling = false;
          indicator.hidden = true;
          return;
        }
        dy = event.touches[0].clientY - startY;
        if (dy > 28) {
          indicator.hidden = false;
          indicator.textContent = dy > threshold ? "Release to refresh" : "Pull to refresh";
        } else {
          indicator.hidden = true;
        }
      },
      { passive: true }
    );

    window.addEventListener("touchend", () => {
      const release = pulling && dy > threshold;
      pulling = false;
      dy = 0;
      indicator.hidden = true;
      indicator.textContent = "Pull to refresh";
      if (release) loadEvents("pull");
    });
  }

  function bindFocusRefresh() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      if (eventsLoaded && Date.now() - lastFetchedAt < FOCUS_REFRESH_MS) return;
      loadEvents("focus");
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    let reloading = false;
    const reloadOnce = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (!event.data || event.data.type !== "shell-updated") return;
      const port = event.ports && event.ports[0];
      if (port) {
        try {
          port.postMessage("ok");
        } catch (err) {
          /* The worker falls back to navigating this window itself. */
        }
      }
      setTimeout(reloadOnce, 40);
    });
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => {
        const check = () => reg.update().catch(() => {});
        check();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }

  function init() {
    const today = todayYmd();
    state.listStart = today;
    state.weekStart = today;
    state.stripDay = today;
    state.miniYear = today.y;
    state.miniMonth = today.m;
    bind();
    bindFocusRefresh();
    registerServiceWorker();
    render();
    loadEvents("startup");
    // Prune confirmed-ended listings while the page stays open; this checks no sources.
    window.setInterval(() => {
      if (!eventsLoaded || !lastPayload) return;
      const day = ymdKey(todayYmd());
      if (lastPayloadDay !== day || allEvents.some(event => !inListWindow(event))) {
        applyEventsPayload(parseEventsText(lastPayload));
        lastPayloadDay = day;
      }
    }, 60000);
  }

  init();
})();
