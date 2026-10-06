# London Political Events

A static London edition of [DC Political Events](https://sfox2006.github.io/DC-Political-events/), adapted from upstream commit `e7d50fe`. It retains the DC site's navy and gold identity, local Inter and Crimson Pro fonts, searchable agenda, calendar, mobile filter sheets, sharing, calendar exports, refresh and installable PWA. London's mark combines Big Ben with a gold flame of liberty, alongside GBP sample prices and `Europe/London` throughout.

**This initial edition contains 43 simulated events.** All hosts, titles, speakers, venues, prices and perks are fictional examples. Each row and calendar card is labelled **Simulated**. Sample calendar exports are prefixed `[Simulated]`; no event registration or newsletter signup is connected.

## Run locally

There is no build step or dependency installation. From the repository root:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/`. JSON fetches require an HTTP server; opening `index.html` as a local file will not work.

## Features

- Agenda starts with today and the next two days; phones show one day with a date strip.
- Seven-day calendar and mini calendar cover today through 21 days ahead.
- Search covers titles, descriptions, organisations and speakers. Topic chips are derived from event text.
- Filters include ideology/area, in person/hybrid/online, free/paid, UK time of day, dates, food, drinks and young professionals.
- Unknown costs remain visible in both cost filters. Unknown times show **Time TBC** and export as all-day events.
- Multi-day events appear on each occupied day; an end exactly at London midnight excludes that day.
- Expanded rows show details, speakers, venue and cost, plus Google Calendar, Outlook, ICS and share actions.
- Share links use this site's own URL, retaining the GitHub Pages subpath.
- The installable app caches its shell and uses network-first event data with an offline fallback. Its cache names are separate from the DC app's caches.
- All clocks and exports use UK time, including the BST/GMT changes. Times display in 24-hour format.

## Organisations and suggestions

The header and footer link to `organisations.html`. It includes all 335 records from the supplied `british-right-of-centre-event-organisations.xlsx`: 227 on **Event hosts** and 108 on **Needs checking**. The import preserves their classifications, evidence, access notes, source links and checked dates. These are research sources, not claims that the simulated events came from these organisations. Britain-wide and non-London records are included.

Edit `data/organisations.json`, then run `node scripts/build-organisations.cjs` to rebuild the static directory. All records and links remain readable without JavaScript; JavaScript adds search and filters. Commit both the JSON and generated HTML, and bump the shell/asset versions for subsequent directory updates.

The suggestion Google Form accepts missing events or organisations, including a name and source link, optional details and optional contact email. It is public to anyone with the link, with no required sign-in or automatic email collection. Responses are viewed in the owner's Google Forms **Responses** tab. Suggestions require review before adding them to the calendar or directory.

- [Public suggestion form](https://docs.google.com/forms/d/e/1FAIpQLSe1uBIE4N7uRyIjUiO0GKFosXRj0UXuvFmdOlR7yx5oebiSGw/viewform)
- [Owner editor and responses](https://docs.google.com/forms/d/1r1FEVUBaNOkfsno3DtlUqpbCQSqFA04fwFPv4uueCh4/edit) (Google account access required)

## Replace the samples with real events

Research agents should read [AGENTS.md](AGENTS.md) and [docs/REAL_EVENTS.md](docs/REAL_EVENTS.md). **`data/events.json` is the only event feed consumed by the app.** No frontend edits are needed to publish verified events.

The top-level object contains `mode`, `timezone`, `generated` and `events`. In `mode: "demo"`, `demo_anchor` identifies the fixture's starting date. The browser shifts sample dates to the current London day while preserving local clock times and event IDs. The source file is never changed by the browser. This keeps the preview populated in future visits.

For real data, set `mode` to `"live"`, keep `timezone: "Europe/London"`, remove `demo_anchor`, and replace the entire sample array with verified events. Each real event must have `simulated: false`, its source event URL, and `verified_at`. **Live event dates are never shifted.** The sample banner disappears automatically. An empty live array is valid and shows an empty calendar.

The London newsletter remains **Coming soon** until a London-specific signup destination is supplied. The copied DC form is intentionally absent.

## Validate and test

Node 18 or newer is sufficient; no npm packages are required:

```sh
npm run validate
npm test
```

The validator also accepts a draft file: `node scripts/validate-events.cjs data/my-draft.json`. Tests cover real-versus-sample handling, schema failures, UK daylight-saving boundaries, multi-day midnight endings, calendar exports and search. GitHub Actions runs validation and tests on pushes and pull requests.

## GitHub Pages

In **Settings → Pages**, choose **Deploy from a branch**, then **main**, **/ (root)**. All assets and fetches use relative paths. The expected URL after merging and enabling Pages is:

`https://sfox2006.github.io/London-Political-Events/`

Publishing is separate from the review branch. The PR does not turn on Pages or merge itself.

When changing HTML, CSS, JS or assets after deployment, bump the shell cache version in `sw.js` and asset query versions in `index.html`. Changes to event JSON do not require a cache bump.
