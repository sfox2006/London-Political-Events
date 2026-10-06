# Supplying verified London event data

Research drafts should use the same envelope as the live feed. Validate a draft with `node scripts/validate-events.cjs path/to/draft.json`. The app loads only `data/events.json`.

## Feed example

This is a schema example, not an event to publish. Replace every placeholder with source-verified information.

```json
{
  "mode": "live",
  "timezone": "Europe/London",
  "generated": "2026-10-06T12:00:00+01:00",
  "events": [
    {
      "id": "organiser-event-slug-2026-10-12",
      "title": "Verified event title",
      "org": "Verified organiser",
      "org_acronym": "",
      "start": "2026-10-12T18:00:00+01:00",
      "end": "2026-10-12T19:30:00+01:00",
      "venue": "Verified venue name",
      "address": "Verified London address",
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

If the day is known but the time is not, set `start` to that day's London midnight, omit `end`, and add `time: "TBC"` and `notes: "Time TBC"`. Calendar exports become all-day entries. Exclude listings whose day is unknown.

Use the offset at the actual event date, not the verification date. In 2026, the UK changes to GMT on 25 October. Avoid guessing an ambiguous clock-change-hour time; resolve it with the organiser.

## Consolidation

1. Collect from original sources; exclude past, cancelled, invitation-only-unavailable or non-London in-person events. Online listings should be relevant to this London calendar.
2. Deduplicate by source URL, title, organiser and start time. Preserve IDs for already-published events so shared links keep working.
3. Replace the sample array entirely. Set `mode: "live"`, retain `timezone: "Europe/London"`, remove `demo_anchor`, and set `generated` to the actual publication time.
4. Run validation and tests. Both must pass before committing the feed.
5. Review the agenda and calendar in the browser. Check access restrictions and unknown costs against their sources before publication.

The app displays today through 21 days ahead, using London calendar days. Events outside that window are not displayed. The validator verifies structure, not whether a source page is accurate or still open; agents must perform those source checks themselves.
