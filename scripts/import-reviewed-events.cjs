#!/usr/bin/env node
/* Import reviewed records only. This script does not discover or verify source pages. */
const fs = require("node:fs");
const path = require("node:path");
const data = require("../event-data.js");
const root = path.join(__dirname, "..");
const filename = process.argv[2];
if (!filename) throw new Error("Supply the reviewed event JSON file.");
const reviewed = JSON.parse(fs.readFileSync(filename, "utf8"));
const rows = Array.isArray(reviewed) ? reviewed : reviewed.events;
if (!Array.isArray(rows)) throw new Error("Reviewed input must contain an events array.");
const now = new Date();
const dateKey = day => `${day.y}-${String(day.m).padStart(2,"0")}-${String(day.d).padStart(2,"0")}`;
const range = data.browsingWindow(now);
const window = { start:dateKey(range.start), end:dateKey(range.end) };
const current = JSON.parse(fs.readFileSync(path.join(root, "data/events.json"), "utf8"));
const reservePath = path.join(root,"data/future-events.json");
const reserve = fs.existsSync(reservePath) ? JSON.parse(fs.readFileSync(reservePath,"utf8")) : {events:[]};
const incomingErrors = data.validatePayload({mode:"live",timezone:data.TZ,events:rows});
if (incomingErrors.length) throw new Error(incomingErrors.join("\n"));
const normal = value => String(value).normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim();
const eventKey = event => [normal(event.org), normal(event.title), event.start.slice(0,10)].join("|");
const reserveRecords = reserve.records || reserve.events || [];
const currentIds = new Map([...(current.mode === "live" ? current.events : []),...reserveRecords].map(event => [eventKey(event), event.id]));
const keys = new Map();
const events = rows.map(source => {
  const event = structuredClone(source);
  if (event.simulated !== false || String(event.id).startsWith("demo-london-")) throw new Error(`Not a reviewed real event: ${event.id}`);
  if (event.publication_approved !== true) throw new Error(`Record lacks publication approval: ${event.id}`);
  for (const key of ["start", "end", "doors", "arrival"]) {
    if (!event[key]) continue;
    const value = event[key].replace(/(T\d{2}:\d{2})([+-])/, "$1:00$2").replace(/Z$/, "+00:00");
    if (data.localStamp(new Date(event[key])) !== value) throw new Error(`${event.id}.${key} must use the actual Europe/London wall time and BST/GMT offset.`);
  }
  const key = eventKey(event);
  if (keys.has(key)) throw new Error(`Review possible duplicate host/title/day: ${keys.get(key)} and ${event.id}`);
  keys.set(key, event.id);
  if (currentIds.has(key)) event.id = currentIds.get(key);
  const perkNote = "Free food, free drinks and young-professional offers are unverified unless labelled.";
  if (!String(event.notes || "").includes(perkNote)) event.notes = [event.notes, perkNote].filter(Boolean).join(" ");
  return event;
}).sort((a,b) => Date.parse(a.start) - Date.parse(b.start) || a.org.localeCompare(b.org,"en-GB") || a.id.localeCompare(b.id));
const publicEvents = [];
const futureByKey = new Map(reserveRecords.map(event => [eventKey(event),event]));
const omitted = [];
for (const event of events) {
  const day = event.start.slice(0,10);
  const last = event.end ? event.end.slice(0,10) : day;
  if (day > window.end) futureByKey.set(eventKey(event),event);
  else if (last < window.start || (event.end && Date.parse(event.end) <= now.getTime()) || (event.time !== "TBC" && !event.end && Date.parse(event.start) <= now.getTime())) omitted.push({id:event.id,org:event.org,title:event.title,url:event.url,reason:event.end ? "Confirmed ended before publication." : "Already started; end time unpublished."});
  else publicEvents.push(event);
  // Keep previously saved reserves even after a reviewed promotion or their date passes.
  // Updating a reserve with newly reviewed details preserves its source history and stable ID.
  if (futureByKey.has(eventKey(event))) futureByKey.set(eventKey(event),event);
}
const payload = { mode:"live", timezone:data.TZ, generated:data.localStamp(now), window, events:publicEvents };
const errors = data.validatePayload(payload);
if (errors.length) throw new Error(errors.join("\n"));
const futurePayload = {...reserve,timezone:data.TZ,generated:data.localStamp(now),publication:"research_reserve",requires_reverification:true,
  instructions:"Research reserve only. May retain historical reserve records after promotion or expiry. Never auto-promote: recheck dated original sources, registration, access, prices and cancellations before a fresh public import.",
  records:[...futureByKey.values()].sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)||a.id.localeCompare(b.id))};
delete futurePayload.events;
fs.writeFileSync(path.join(root,"data/events.json"), JSON.stringify(payload,null,2)+"\n");
fs.writeFileSync(reservePath, JSON.stringify(futurePayload,null,2)+"\n");
console.log(JSON.stringify({public_events:publicEvents.length,reserve_events:futurePayload.records.length,window,omitted}));
