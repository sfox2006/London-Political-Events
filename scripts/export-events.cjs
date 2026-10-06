#!/usr/bin/env node
/* CSV faithfully distinguishes programme time, TBC and admission times. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname,"..");
const feed = JSON.parse(fs.readFileSync(path.join(root,"data/events.json"),"utf8"));
const columns = ["id","title","org","event_date","programme_start","doors","arrival","end","timezone","format","venue","address","city","country","cost","booking_fees","age_restrictions","physical_accessibility","access","availability","cancellation","free_food_status","free_drinks_status","young_professionals_status","source_url","booking_url","source_urls","source_row_ids","verified_at","ideology","notes"];
const safeCell = value => {const text = String(value ?? "");return '"'+(/^[=+@\-]/.test(text)?"'":"")+text.replace(/"/g,'""')+'"';};
const rows = feed.events.map(event=>{
  const row = {...event,event_date:event.start.slice(0,10),timezone:feed.timezone,
    programme_start:event.time === "TBC" || ["doors","arrival"].includes(event.start_label) ? "TBC" : event.start,
    doors:event.doors || (event.start_label === "doors" ? event.start : ""),
    arrival:event.arrival || (event.start_label === "arrival" ? event.start : ""),end:event.end || "Unknown",
    source_url:event.url,booking_url:event.rsvp_url || "",source_urls:(event.source_urls||[]).join(" | "),source_row_ids:(event.source_row_ids||[]).join(" | "),ideology:event.source_ideology || event.ideology};
  for(const key of ["free_food","free_drinks","young_professionals"])row[key+"_status"] = event.tags[key] ? "Source-confirmed offer" : "Not positively confirmed";
  return columns.map(key=>safeCell(row[key])).join(",");
});
fs.writeFileSync(path.join(root,"data/events.csv"),"\uFEFF"+columns.join(",")+"\r\n"+rows.join("\r\n")+"\r\n");
console.log(`Exported ${rows.length} source-preserving CSV rows.`);
