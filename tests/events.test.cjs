const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const data = require("../event-data.js");
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/events.json"), "utf8"));
const clone = () => structuredClone(fixture);

// Exercise the actual app's pure calendar functions, without booting its DOM.
const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8").replace(
  /  init\(\);\s*\}\)\(\);\s*$/,
  "  this.calendar = { eventEndYmd, googleCalendarUrl, outlookCalendarUrl, icsContent, searchHit, timeBucket, actionsHtml };\n}).call(this);"
);
const context = vm.createContext({
  Intl, Date, URL, URLSearchParams, Set, Map, TextEncoder, console,
  LondonEventData: data,
  document: { getElementById: () => null, querySelector: () => null },
  window: { location: { href: "https://sfox2006.github.io/London-Political-Events/", origin: "https://sfox2006.github.io", pathname: "/London-Political-Events/" } },
});
vm.runInContext(app, context);
const calendar = context.calendar;
assert.ok(calendar, "calendar functions loaded from production app");

test("the complete sample dataset validates and exercises all areas and formats", () => {
  assert.deepEqual(data.validatePayload(fixture), []);
  assert.equal(new Set(fixture.events.map((e) => e.ideology)).size, 9);
  assert.equal(new Set(fixture.events.map((e) => e.format)).size, 3);
  assert.equal(new Set(fixture.events.map((e) => e.id)).size, fixture.events.length);
});
test("London midnight remains correct at both daylight-saving transitions", () => {
  for (const [ymd, expected] of [
    [{y:2026,m:3,d:29}, "2026-03-29T00:00:00.000Z"],
    [{y:2026,m:3,d:30}, "2026-03-29T23:00:00.000Z"],
    [{y:2026,m:10,d:25}, "2026-10-24T23:00:00.000Z"],
    [{y:2026,m:10,d:26}, "2026-10-26T00:00:00.000Z"],
  ]) assert.equal(data.midnight(ymd).toISOString(), expected);
});
test("rebased samples preserve UK wall-clock times across BST to GMT", () => {
  const prepared = data.preparePayload(fixture, new Date("2026-10-26T12:00:00Z"));
  assert.equal(prepared.events[0].start, "2026-10-26T09:30:00+00:00");
  assert.equal(fixture.events[0].start, "2026-10-06T09:30:00+01:00");
  assert.equal(prepared.events[0].id, fixture.events[0].id);
  assert.equal(prepared.events[0].end, "2026-10-26T11:00:00+00:00");
});
test("real event timestamps stay fixed", () => {
  const live = clone(); live.mode = "live";
  live.events.forEach((e) => { e.simulated = false; e.url = "https://example.org/events/verified"; e.verified_at = "2026-10-06T12:00:00+01:00"; });
  assert.deepEqual(data.validatePayload(live), []);
  assert.equal(data.preparePayload(live, new Date("2027-01-01T12:00:00Z")), live);
});
test("live mode rejects samples, missing sources, and missing verification", () => {
  const live = clone(); live.mode = "live";
  const errors = data.validatePayload(live).join("\n");
  assert.match(errors, /simulated: false/); assert.match(errors, /original event page/); assert.match(errors, /verified_at/);
});
test("duplicate IDs, bad dates, invalid formats, and executable URLs fail validation", () => {
  const bad = clone();
  bad.events[1].id = bad.events[0].id;
  bad.events[0].start = "not a date";
  bad.events[0].format = "unknown";
  bad.events[0].url = "javascript:alert(1)";
  const errors = data.validatePayload(bad).join("\n");
  assert.match(errors, /duplicated/); assert.match(errors, /ISO timestamp/); assert.match(errors, /format is invalid/); assert.match(errors, /HTTP\(S\)/);
  assert.throws(() => data.preparePayload(bad), /Invalid event data/);
});
test("multi-day events ending at London midnight exclude the final day", () => {
  for (const end of ["2026-10-25T00:00:00+01:00", "2026-10-26T00:00:00+00:00"]) {
    const event = {...fixture.events[0], start:"2026-10-23T10:00:00+01:00", end};
    const last = calendar.eventEndYmd(event);
    assert.equal(last.d, end.includes("26T") ? 25 : 24);
  }
});
test("Google exports use UTC instants and the London timezone", () => {
  const url = new URL(calendar.googleCalendarUrl(fixture.events[0]));
  assert.equal(url.searchParams.get("ctz"), "Europe/London");
  assert.equal(url.searchParams.get("dates"), "20261006T083000Z/20261006T100000Z");
  assert.match(url.searchParams.get("text"), /^\[Simulated\]/);
  assert.match(url.searchParams.get("details"), /SIMULATED EVENT/);
});
test("Outlook exports include explicit BST and GMT offsets", () => {
  const summer = new URL(calendar.outlookCalendarUrl(fixture.events[0]));
  assert.equal(summer.searchParams.get("startdt"), "2026-10-06T09:30:00+01:00");
  const winter = {...fixture.events[0], start:"2026-10-26T09:30:00+00:00", end:"2026-10-26T11:00:00+00:00"};
  const url = new URL(calendar.outlookCalendarUrl(winter));
  assert.equal(url.searchParams.get("startdt"), "2026-10-26T09:30:00+00:00");
});
test("time-TBC exports are all-day and every calendar export labels samples", () => {
  const event = fixture.events.find((e) => e.time === "TBC");
  const google = new URL(calendar.googleCalendarUrl(event));
  assert.equal(google.searchParams.get("dates"), "20261008/20261009");
  const ics = calendar.icsContent(event).replace(/\r\n /g, "");
  assert.match(ics, /DTSTART;VALUE=DATE:20261008/);
  assert.match(ics, /DTEND;VALUE=DATE:20261009/);
  assert.match(ics, /SUMMARY:\[Simulated\]/);
  assert.match(ics, /PRODID:-\/\/London Political Events/);
});
test("sample actions cannot link to event registration, but sharing retains the Pages path", () => {
  const event = {...fixture.events[0], url:"https://example.org/event", rsvp_url:"https://example.org/rsvp"};
  const html = calendar.actionsHtml(event, "list");
  assert.doesNotMatch(html, /Event page ↗|RSVP ↗/);
  assert.match(html, /London-Political-Events\//);
  assert.match(html, /Add sample to calendar/);
});
test("speaker search and London time-of-day filtering work", () => {
  assert.equal(calendar.searchHit(fixture.events[0], "alex morgan"), true);
  assert.equal(calendar.searchHit(fixture.events[0], "no such speaker"), false);
  assert.equal(calendar.timeBucket("2026-10-06T17:30:00+01:00"), "evening");
  assert.equal(calendar.timeBucket("2026-10-26T17:30:00+00:00"), "evening");
});
