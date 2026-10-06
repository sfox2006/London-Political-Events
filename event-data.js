/* Shared by the static app and the data validator. No dependencies. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LondonEventData = factory();
})(typeof window === "object" ? window : this, function () {
  "use strict";
  const TZ = "Europe/London";
  const IDEOLOGIES = new Set(["libertarian", "conservative", "progressive", "foreign_policy", "abundance_yimby", "nonpartisan", "centrist", "other", "law"]);
  const FORMATS = new Set(["in_person", "hybrid", "online"]);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  function parts(iso) {
    return Object.fromEntries(formatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  }
  function fromLocal(ymd, hour = 0, minute = 0, second = 0) {
    // London offsets are 0 and +1. Verify the candidate against the IANA zone.
    const target = Date.UTC(ymd.y, ymd.m - 1, ymd.d, hour, minute, second);
    for (const offset of [0, 1]) {
      const date = new Date(target - offset * 3600000);
      const p = parts(date);
      if (+p.year === ymd.y && +p.month === ymd.m && +p.day === ymd.d &&
          +p.hour === hour && +p.minute === minute && +p.second === second) return date;
    }
    // Demo events rebased into the missing spring hour move forward one hour.
    return new Date(target);
  }
  function midnight(ymd) { return fromLocal(ymd); }
  function localStamp(date) {
    const p = parts(date);
    const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    const offset = Math.round((wall - date.getTime()) / 3600000);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${offset === 1 ? "+01:00" : "+00:00"}`;
  }
  function shiftStamp(iso, days) {
    if (!iso) return iso;
    const p = parts(iso);
    const shifted = new Date(Date.UTC(+p.year, +p.month - 1, +p.day + days));
    return localStamp(fromLocal({ y: shifted.getUTCFullYear(), m: shifted.getUTCMonth() + 1, d: shifted.getUTCDate() }, +p.hour, +p.minute, +p.second));
  }
  function safeUrl(value) {
    if (!value) return true;
    if (typeof value !== "string") return false;
    try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; }
    catch (_) { return false; }
  }
  function isoStamp(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  }
  function dateOnly(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  }
  function browsingWindow(now = new Date()) {
    const p = parts(now);
    const end = new Date(Date.UTC(+p.year, +p.month - 1, +p.day + 28));
    return { start: {y:+p.year,m:+p.month,d:+p.day}, end: {y:end.getUTCFullYear(),m:end.getUTCMonth()+1,d:end.getUTCDate()} };
  }
  function validatePayload(data) {
    const errors = [];
    if (!data || Array.isArray(data) || typeof data !== "object") return ["Use an object containing mode, timezone and events."];
    if (!["demo", "live"].includes(data.mode)) errors.push('mode must be "demo" or "live".');
    if (data.timezone !== TZ) errors.push(`timezone must be "${TZ}".`);
    if (data.window && (!dateOnly(data.window.start) || !dateOnly(data.window.end) || data.window.end < data.window.start)) errors.push("window requires ordered YYYY-MM-DD start and end dates (inclusive).");
    if (!Array.isArray(data.events)) return [...errors, "events must be an array."];
    if (data.mode === "demo" && (!/^\d{4}-\d{2}-\d{2}$/.test(data.demo_anchor || "") || !Number.isFinite(Date.parse(data.demo_anchor)))) errors.push("Demo mode requires demo_anchor (YYYY-MM-DD).");
    const ids = new Set();
    for (const [i, event] of data.events.entries()) {
      const label = `events[${i}]`;
      if (!event || typeof event !== "object") { errors.push(`${label} must be an object.`); continue; }
      for (const field of ["id", "title", "org", "cost", "source", "access"]) {
        if (typeof event[field] !== "string" || !event[field].trim()) errors.push(`${label}.${field} must be a non-empty string.`);
      }
      if (ids.has(event.id)) errors.push(`${label}.id is duplicated: ${event.id}`);
      ids.add(event.id);
      if (!isoStamp(event.start)) errors.push(`${label}.start must be an ISO timestamp with a UTC offset.`);
      if (event.end && (!isoStamp(event.end) || Date.parse(event.end) <= Date.parse(event.start))) errors.push(`${label}.end must be after start, with an offset.`);
      for (const field of ["doors","arrival"]) if (event[field] && !isoStamp(event[field])) errors.push(`${label}.${field} must be an ISO timestamp with a UTC offset.`);
      if (!IDEOLOGIES.has(event.ideology)) errors.push(`${label}.ideology is invalid.`);
      if (!FORMATS.has(event.format)) errors.push(`${label}.format is invalid.`);
      if (event.start_label && !["doors","arrival","programme"].includes(event.start_label)) errors.push(`${label}.start_label must be doors, arrival or programme.`);
      if (!event.tags || ["free_food", "free_drinks", "young_professionals"].some((key) => typeof event.tags[key] !== "boolean")) errors.push(`${label}.tags requires three booleans.`);
      for (const key of ["url", "rsvp_url", "maps_url"]) if (!safeUrl(event[key])) errors.push(`${label}.${key} must be blank or an HTTP(S) URL.`);
      if (data.mode === "demo" && event.simulated !== true) errors.push(`${label} must have simulated: true in demo mode.`);
      if (data.mode === "live") {
        if (event.simulated !== false) errors.push(`${label} must have simulated: false in live mode.`);
        if (typeof event.url !== "string" || !event.url) errors.push(`${label}.url must link to the original event page in live mode.`);
        if (!isoStamp(event.verified_at)) errors.push(`${label}.verified_at is required in live mode, with an offset.`);
      }
    }
    return errors;
  }
  function preparePayload(data, now = new Date()) {
    const errors = validatePayload(data);
    if (errors.length) throw new Error(`Invalid event data: ${errors[0]}`);
    if (data.mode !== "demo") return data;
    const p = parts(now);
    const today = Date.UTC(+p.year, +p.month - 1, +p.day);
    const days = Math.round((today - Date.parse(`${data.demo_anchor}T00:00:00Z`)) / 86400000);
    return { ...data, events: data.events.map((event) => ({ ...event, start: shiftStamp(event.start, days), end: shiftStamp(event.end, days) })) };
  }
  return { TZ, midnight, localStamp, shiftStamp, browsingWindow, safeUrl, validatePayload, preparePayload };
});
