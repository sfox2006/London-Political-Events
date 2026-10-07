# Supplying verified UK event data

Research drafts should use the same envelope as the live feed. Validate a draft with `node scripts/validate-events.cjs path/to/draft.json`. The app loads only `data/events.json`.

## Feed example

This is a schema example, not an event to publish. Replace every placeholder with source-verified information.

```json
{
  "mode": "live",
  "timezone": "Europe/London",
  "generated": "2026-10-06T12:00:00+01:00",
  "window": { "start": "2026-10-06", "end": "2026-11-03" },
  "events": [
    {
      "id": "organiser-event-slug-2026-10-12",
      "title": "Verified event title",
      "org": "Verified organiser",
      "org_acronym": "",
      "start": "2026-10-12T18:00:00+01:00",
      "end": "2026-10-12T19:30:00+01:00",
      "venue": "Verified venue name",
      "address": "Verified UK address",
      "maps_url": "",
      "url": "https://example.org/replace-with-original-event-page",
      "rsvp_url": "",
      "ideology": "nonpartisan",
      "format": "in_person",
      "cost": "Unknown",
      "tags": {
        "free_food": false,
        "free_drinks": false,
        "young_professionals": false
      },
      "access": "Check the organiser's page",
      "source": "Original organiser event page",
      "description": "Source-grounded description, with no invented details.",
      "speakers": [],
      "simulated": false,
      "verified_at": "2026-10-06T12:00:00+01:00"
    }
  ]
}
```

## Required fields

| Field | Convention |
| --- | --- |
| `id` | Non-empty, unique, stable string. Use organiser, event slug and date. |
| `title`, `org` | Original event title and organiser. |
| `start` | ISO timestamp with an explicit offset. London dates use BST or GMT as appropriate. |
| `ideology` | `libertarian`, `conservative`, `progressive`, `foreign_policy`, `abundance_yimby`, `nonpartisan`, `centrist`, `other` or `law`. Classify from evidence; use `other` if uncertain. |
| `format` | `in_person`, `hybrid` or `online`. |
| `cost` | `Free`, a GBP display string such as `£10` or `£5 students / £20 general`, or `Unknown`. |
| `tags` | `free_food`, `free_drinks`, `young_professionals` as booleans. Only mark true when advertised. |
| `source`, `access` | Source identification and verified access conditions. If unknown, say to check the organiser's page. |
| `url` | Original event page, using HTTP(S). Required in live mode. |
| `simulated` | `false` for every live event. |
| `verified_at` | ISO timestamp with offset recording the source check. Required in live mode. |

Optional: `end`, `venue`, `address`, `maps_url`, `rsvp_url`, `description`, `speakers`, `org_acronym`, `notes`, `time`. Speakers may be strings or objects with `name` and `role`. Omit unknown details or leave text fields blank. If the end is unknown, omit it; calendar exports use a one-hour default.

Use `notes` for source-supported doors times, fees, availability and other qualifications. Notes are shown in expanded details and calendar exports. A false perk tag means no verified offer; it does not establish that food or drink is unavailable. Retain an explicit unverified note where those details are unpublished. Use the programme start for `start` when doors and programme times are separately advertised.

When only admission time is published, set `start` to that timestamp and `start_label` to `"doors"` or `"arrival"`; say in `notes` that the programme start is unknown. The label is retained in agenda rows, calendar cards, details and exports. A programme-time TBC note does not hide a verified doors time. Alternatively, use the programme's midnight/TBC placeholder and put the separate admission timestamp in `doors` or `arrival`. These optional fields use full ISO timestamps with the actual BST/GMT offset; they appear in details and calendar descriptions. Never silently present admission time as programme start.

If the day is known but the time is not, set `start` to that day's London midnight, omit `end`, and add `time: "TBC"` and `notes: "Time TBC"`. Calendar exports become all-day entries. Exclude listings whose day is unknown.

Use the offset at the actual event date, not the verification date. In 2026, the UK changes to GMT on 25 October. Avoid guessing an ambiguous clock-change-hour time; resolve it with the organiser.

## Consolidation

1. Collect every event type from original sources within the researched dates. Include in-person events in England, Scotland, Wales and Northern Ireland and relevant UK-hosted online events. Preserve exact venues and online/hybrid distinctions; exclude overseas in-person events. Exclude past or cancelled listings. Preserve members-only or invitation restrictions and unknown booking availability without implying public registration. Do not invent dated occurrences from a recurring pattern.
2. Deduplicate by source URL, title, organiser and start time. Preserve IDs for already-published events so shared links keep working.
3. Replace the sample array entirely. Set `mode: "live"`, retain `timezone: "Europe/London"`, remove `demo_anchor`, and set `generated` to the actual publication time.
4. Run validation and tests. Both must pass before committing the feed.
5. Review the agenda and calendar in the browser. Check access restrictions and unknown costs against their sources before publication.

The top-level `window` records the inclusive publication slice as YYYY-MM-DD dates. Public browsing rolls from the current London day through 28 days ahead: initially 6 October through 3 November 2026 inclusive. Live dates never shift. Confirmed-ended timed listings are hidden. Already-started timed sessions with unpublished ends are excluded without inventing a completion time. Time-TBC events remain visible throughout their listed day.

Import a completed reviewed dataset with `node scripts/import-reviewed-events.cjs path/to/reviewed.json`. The importer validates timestamps and offsets, preserves existing stable IDs, rejects suspected duplicate host/title/day records, and splits public listings from later discoveries. `data/future-events.json` is a durable research reserve and is never loaded by the app. Recheck its original dated sources, booking availability, access, costs and cancellations before including any reserve record in a new reviewed public import. Save later events found in the initial sweep through 6 January 2027, plus any farther events discovered incidentally. Do not fabricate recurring occurrences or automatically promote a reserve.

The validator verifies structure, not whether a source page is accurate or still open; agents must perform source checks themselves. Keep all 371 organisation coverage rows and omission/access-limit reasons in the Library research audit. Refreshes are intended every two days and scheduling is managed separately; the browser's Refresh button only reloads the last published feed.

## Editorial scope

The owner excludes religious organisations and religious content. Do not collect or publish worship, prayer, carol services, religious education or religion-centred talks, including academic events primarily about religion. Check `data/listing-policy.json` for reviewed exclusions before researching or importing. Add newly reviewed exclusions to that file. Do not infer religion from a personal name, a church venue, a country or a political position. Seasonal social events and secular issue groups remain eligible. The original research coverage is an audit only; excluded sources must not be reintroduced from it.
