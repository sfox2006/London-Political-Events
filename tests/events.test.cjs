const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const data = require("../event-data.js");
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/demo-events.json"), "utf8"));
const production = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/events.json"), "utf8"));
const clone = () => structuredClone(fixture);

// Exercise the actual app's pure calendar functions, without booting its DOM.
const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8").replace(
  /  init\(\);\s*\}\)\(\);\s*$/,
  "  this.calendar = { eventEndYmd, googleCalendarUrl, outlookCalendarUrl, icsContent, searchHit, timeBucket, actionsHtml, detailsInner, startTimeLabel, inListWindow, costKind, matchesCostKind };\n}).call(this);"
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

test("the published dataset validates independently of the simulated test fixture", () => {
  assert.deepEqual(data.validatePayload(production), []);
  if (production.mode === "live") {
    assert.ok(production.events.every((event) => event.simulated === false && !event.id.startsWith("demo-london-")));
  }
});
test("the four-week browsing range rolls across BST/GMT using London dates", () => {
  assert.deepEqual(data.browsingWindow(new Date("2026-10-06T14:00:00Z")), {start:{y:2026,m:10,d:6},end:{y:2026,m:11,d:3}});
  assert.deepEqual(data.browsingWindow(new Date("2026-10-24T23:30:00Z")), {start:{y:2026,m:10,d:25},end:{y:2026,m:11,d:22}});
  assert.deepEqual(data.browsingWindow(new Date("2026-10-26T00:30:00Z")), {start:{y:2026,m:10,d:26},end:{y:2026,m:11,d:23}});
  assert.deepEqual(data.browsingWindow(new Date("2026-12-31T14:00:00Z")), {start:{y:2026,m:12,d:31},end:{y:2027,m:1,d:28}});
  const bad = clone(); bad.window = {start:"2026-02-30",end:"2027-01-06"};
  assert.match(data.validatePayload(bad).join("\n"), /window requires/);
});
test("every real listing exports its source, exact price and honest timing", () => {
  if (production.mode !== "live") return;
  for (const event of production.events) {
    const google = new URL(calendar.googleCalendarUrl(event));
    const outlook = new URL(calendar.outlookCalendarUrl(event));
    assert.ok(google.searchParams.get("details").includes(event.url),event.id);
    assert.ok(google.searchParams.get("details").includes(event.cost),event.id);
    assert.ok(outlook.searchParams.get("body").includes(event.url),event.id);
    if (event.time === "TBC") {
      assert.equal(calendar.startTimeLabel(event),"Time TBC",event.id);
      assert.match(google.searchParams.get("dates"), /^\d{8}\/\d{8}$/);
      assert.match(calendar.icsContent(event), /DTSTART;VALUE=DATE:/);
    }
    if (event.doors) assert.ok(google.searchParams.get("details").includes("Doors:"),event.id);
    assert.equal(google.searchParams.get("ctz"),"Europe/London");
  }
});
test("ended events and already-started sessions with unpublished end are hidden", () => {
  const now = Date.now();
  const event = {...fixture.events[0],simulated:false,start:data.localStamp(new Date(now-3600000)),end:data.localStamp(new Date(now-1000))};
  assert.equal(calendar.inListWindow(event),false);
  event.time = "TBC";
  assert.equal(calendar.inListWindow(event),false, "A confirmed end expires a TBC programme start too");
  delete event.time;
  delete event.end;
  assert.equal(calendar.inListWindow(event),false, "An unknown end does not keep a started session visible");
  event.start = data.localStamp(new Date(now+3600000));
  delete event.end;
  assert.equal(calendar.inListWindow(event),true);
});
test("unknown and conditional member prices retain their meaning in filters", () => {
  assert.equal(calendar.costKind("No separate price published; conference pass needed"),"unknown");
  assert.equal(calendar.costKind("Free for members; £5 non-members on the door"),"mixed");
  assert.equal(calendar.matchesCostKind("mixed","free"),true);
  assert.equal(calendar.matchesCostKind("mixed","paid"),true);
  assert.equal(calendar.costKind("Free; optional donation"),"free");
});
test("live time-TBC events stay visible on their London day and export as all-day", () => {
  const p = new Intl.DateTimeFormat("en-CA", {timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const event = {...fixture.events[0], simulated:false, start:data.localStamp(data.midnight({y:+p.slice(0,4),m:+p.slice(5,7),d:+p.slice(8,10)})), time:"TBC", notes:"Time TBC; registration availability not published."};
  delete event.end;
  assert.equal(calendar.inListWindow(event),true);
  assert.equal(calendar.startTimeLabel(event),"Time TBC");
  assert.match(calendar.icsContent(event), /DTSTART;VALUE=DATE:/);
  assert.doesNotMatch(calendar.detailsInner(event), /00:00/);
});
test("UK-wide venue search and source notes are retained in details and exports", () => {
  const event = {...fixture.events[0],simulated:false,venue:"Assembly Rooms",address:"Edinburgh, Scotland",notes:"Doors 18:00; programme 18:30. Food and drinks unverified."};
  assert.equal(calendar.searchHit(event,"edinburgh"),true);
  assert.match(calendar.detailsInner(event), /Doors 18:00; programme 18:30/);
  assert.match(new URL(calendar.googleCalendarUrl(event)).searchParams.get("details"), /Food and drinks unverified/);
});
test("availability and refund qualifications reach details and calendar exports", () => {
  const event = {...fixture.events[0],simulated:false,availability:"Sold out for in-person attendance; livestream signup offered",cancellation:"Refund terms unknown"};
  assert.match(calendar.detailsInner(event),/Sold out for in-person attendance/);
  assert.match(calendar.detailsInner(event),/Refund terms unknown/);
  assert.match(new URL(calendar.googleCalendarUrl(event)).searchParams.get('details'),/Sold out for in-person attendance/);
  assert.match(calendar.icsContent(event),/Refund terms unknown/);
});
test("doors-only times remain labelled when programme time is TBC, including exports", () => {
  const event = {...fixture.events[0],simulated:false,start:"2026-10-12T18:15:00+01:00",start_label:"doors",notes:"Programme time TBC; only doors time is advertised."};
  delete event.end;
  assert.equal(calendar.startTimeLabel(event),"Doors 18:15");
  assert.match(calendar.detailsInner(event), /Doors<\/span> 18:15/);
  assert.match(new URL(calendar.googleCalendarUrl(event)).searchParams.get("text"), /^\[Doors\]/);
  assert.match(new URL(calendar.outlookCalendarUrl(event)).searchParams.get("subject"), /^\[Doors\]/);
  assert.match(calendar.icsContent(event), /SUMMARY:\[Doors\]/);
  assert.match(new URL(calendar.googleCalendarUrl(event)).searchParams.get("details"), /programme time is advertised|only doors time is advertised/);
  const tbc = {...event,start:"2026-10-12T00:00:00+01:00",start_label:"programme",time:"TBC",doors:"2026-10-12T18:15:00+01:00"};
  assert.equal(calendar.startTimeLabel(tbc),"Time TBC");
  assert.match(calendar.detailsInner(tbc), /Doors<\/span> 18:15/);
  assert.match(calendar.icsContent(tbc), /DTSTART;VALUE=DATE:/);
});
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
