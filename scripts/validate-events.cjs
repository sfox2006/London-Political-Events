#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { validatePayload } = require("../event-data.js");
const { excludesEvent } = require("./listing-policy.cjs");
const filename = process.argv[2] || path.join(__dirname, "../data/events.json");
try {
  const data = JSON.parse(fs.readFileSync(filename, "utf8"));
  const errors = validatePayload(data);
  if (data.mode === "live" && Array.isArray(data.events)) {
    for (const event of data.events.filter(excludesEvent)) errors.push(`${event.id}: Outside the non-religious editorial scope.`);
  }
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else console.log(`Validated ${data.events.length} ${data.mode} events in ${data.timezone}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
