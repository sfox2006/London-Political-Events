# London Political Events

A static London edition of [DC Political Events](https://sfox2006.github.io/DC-Political-events/), adapted from upstream commit `e7d50fe`. It uses Fighting for a Free Future's dark blue (`#16374D`) and orange (`#E37014`) palette and original torch artwork, alongside local Inter and Crimson Pro fonts, searchable agenda, calendar, mobile filter sheets, sharing, calendar exports, refresh and an installable PWA. Sample prices use GBP and all times use `Europe/London`.

**This initial edition contains 43 simulated events.** All hosts, titles, speakers, venues, prices and perks are fictional examples. Each row and calendar card is labelled **Simulated**. Sample calendar exports are prefixed `[Simulated]`; no sample event registration is connected. London newsletter signup is open for a roundup of verified events when real listings are available.

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

The header and footer link to `organisations.html`. It includes all 371 records from the supplied `uk-right-of-centre-event-organisations.xlsx`: 241 on **Event hosts** and 130 on **Needs checking**. This replaces the earlier British directory and adds 36 entries. The import preserves their classifications, evidence, access notes, source links and checked dates. These are research sources, not claims that the simulated events came from these organisations. Coverage includes England, Scotland, Wales and Northern Ireland, with parent organisations and local groups listed separately. Non-London records are included.

Edit `data/organisations.json`, then run `node scripts/build-organisations.cjs` to rebuild the static directory. All records and links remain readable without JavaScript; JavaScript adds search and filters. Commit both the JSON and generated HTML, and bump the shell/asset versions for subsequent directory updates.

The Google Form accepts missing events or organisations and verification or corrections for existing organisations. It asks for the submission type, name and source link, with optional details and contact email. Verification submissions should identify the listed organisation and provide recent official event activity or other current evidence, its date, and any corrections. It is public to anyone with the link, with no required sign-in or automatic email collection. Responses are viewed in the owner's Google Forms **Responses** tab. Review submissions before adding listings or changing verification status.

- [Public suggestion form](https://docs.google.com/forms/d/e/1FAIpQLSe1uBIE4N7uRyIjUiO0GKFosXRj0UXuvFmdOlR7yx5oebiSGw/viewform)
- [Owner editor and responses](https://docs.google.com/forms/d/1r1FEVUBaNOkfsno3DtlUqpbCQSqFA04fwFPv4uueCh4/edit) (Google account access required)

## Replace the samples with real events

Research agents should read [AGENTS.md](AGENTS.md) and [docs/REAL_EVENTS.md](docs/REAL_EVENTS.md). **`data/events.json` is the only event feed consumed by the app.** No frontend edits are needed to publish verified events.

The top-level object contains `mode`, `timezone`, `generated` and `events`. In `mode: "demo"`, `demo_anchor` identifies the fixture's starting date. The browser shifts sample dates to the current London day while preserving local clock times and event IDs. The source file is never changed by the browser. This keeps the preview populated in future visits.

For real data, set `mode` to `"live"`, keep `timezone: "Europe/London"`, remove `demo_anchor`, and replace the entire sample array with verified events. Each real event must have `simulated: false`, its source event URL, and `verified_at`. **Live event dates are never shifted.** The sample banner disappears automatically. An empty live array is valid and shows an empty calendar.

## Weekly email signup

The header **Weekly email** button and **Get the weekly email** card open a dedicated London Google Form, matching the DC site's signup flow. The calendar and organisations page footers also link to it.

The form requires name, email (with email-address validation), and institution / affiliation. Optional questions capture interests, event format, days, cost, social extras and full-versus-short roundup preference. Evening preferences use UK time. Submitting opts the visitor into the free weekly Sunday London email. No Google sign-in is required, response summaries remain private, and existing DC subscribers are not imported.

- [Public London newsletter signup](https://docs.google.com/forms/d/e/1FAIpQLSejuH1vnLTDNu3QnVgmQhCxsP7wgsy8Ub2RRqu-tZeuxtR-5Q/viewform)
- [Owner editor and subscriber responses](https://docs.google.com/forms/d/1dvqMw-vdH5tzKS-MLCxbBjrFr-YhW3NoSHnT89oW3k4/edit) (Google account access required)

Subscribers are stored in this form's **Responses** tab. Newsletter preparation and delivery are managed separately, as on the DC site; this static repository does not send emails. The signup page explains that the calendar is still a simulated preview and roundups will cover verified listings when available.

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

## Brand assets

Branding updated at the owner's request from [Fighting for a Free Future](https://www.fightingforafreefuture.com/). `assets/fff-torch.png` preserves its published 192px site icon; `assets/fff-logo.png` preserves its full logo artwork. App icons export the torch at the required sizes, with padding for maskable icons. No artwork is redrawn. Sources:

- https://www.fightingforafreefuture.com/wp-content/uploads/2025/08/cropped-Favicon-1-scaled-1-192x192.png
- https://www.fightingforafreefuture.com/wp-content/uploads/2026/09/20260820-Final-FFF-Logo-Visually-Balanced-Centred-scaled.png

Keep both pages, the app icons, social preview and theme colour consistent when updating branding.
