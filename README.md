# London Political Events

A static London edition of [DC Political Events](https://sfox2006.github.io/DC-Political-events/), adapted from upstream commit `e7d50fe`. It uses Fighting for a Free Future's dark blue (`#16374D`) and orange (`#E37014`) palette and original torch artwork, alongside local Inter and Crimson Pro fonts, searchable agenda, calendar, mobile filter sheets, sharing, calendar exports, refresh and an installable PWA. Prices use GBP and all times use `Europe/London`.

**The public calendar now uses source-reviewed UK event listings.** It publishes the rolling next four weeks and keeps later discoveries in a separate reserve requiring a fresh check. All fictional listings were removed from the production feed. The original 43 simulated events are retained only as test fixtures; the app never falls back to them. Booking links, restrictions, sold-out status and unknown costs or times remain source-grounded. London newsletter signup is available through its dedicated form.

## Run locally

There is no build step or dependency installation. From the repository root:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/`. JSON fetches require an HTTP server; opening `index.html` as a local file will not work.

## Features

- Agenda starts with today and the next two days; phones show one day with a date strip.
- Seven-day calendar and mini calendar browse today through 28 days ahead, using London calendar dates.
- Search covers titles, descriptions, organisations, speakers and locations. Topic chips are derived from event text.
- Filters include ideology/area, in person/hybrid/online, free/paid, UK time of day, dates, food, drinks and young professionals.
- Unknown costs remain visible in both cost filters. Unknown times show **Time TBC** and export as all-day events.
- Multi-day events appear on each occupied day; an end exactly at London midnight excludes that day.
- Expanded rows show source notes, access conditions, speakers, venue and cost, plus Google Calendar, Outlook, ICS and share actions. Confirmed-ended events and already-started timed sessions with unpublished ends are hidden. TBC-time listings remain for their London date.
- Share links use this site's own URL, retaining the GitHub Pages subpath.
- The installable app caches its shell and uses network-first event data with an offline fallback. Its cache names are separate from the DC app's caches.
- All clocks and exports use UK time, including the BST/GMT changes. Times display in 24-hour format.

## Organisations and suggestions

Both pages keep the same sticky header, desktop controls and mobile menu. Calendar on the organisations page returns to the events calendar; Refresh reloads the directory, and About, Install app and Weekly email work on either page. The directory header and About content are generated from `index.html` so they remain consistent. The header and footer link to `organisations.html`. It includes all 371 records from the replacement `uk-right-of-centre-event-organisations.xlsx`: 241 on **Event hosts** and 130 on **Needs checking**. The comparison preserved all 335 earlier records without field changes and added 36 Northern Ireland records. The import retains classifications, evidence, access notes, source links and checked dates. Original source-sheet provenance is separate from an optional current `verification_status`, which controls directory filters without overwriting provenance. These are research sources; historical evidence does not establish a current public event. The directory covers England, Scotland, Wales and Northern Ireland, with truthful venue labels for listings outside London.

Edit `data/organisations.json`, then run `node scripts/build-organisations.cjs` to rebuild the static directory. All records and links remain readable without JavaScript; JavaScript adds search and filters. Commit both the JSON and generated HTML, and bump the shell/asset versions for subsequent directory updates.

The Google Form accepts missing events or organisations and verification or corrections for existing organisations. It asks for the submission type, name and source link, with optional details and contact email. Verification submissions should identify the listed organisation and provide recent official event activity or other current evidence, its date, and any corrections. It is public to anyone with the link, with no required sign-in or automatic email collection. Responses are viewed in the owner's Google Forms **Responses** tab. Review submissions before adding listings or changing verification status.

- [Public suggestion form](https://docs.google.com/forms/d/e/1FAIpQLSe1uBIE4N7uRyIjUiO0GKFosXRj0UXuvFmdOlR7yx5oebiSGw/viewform)
- [Owner editor and responses](https://docs.google.com/forms/d/1r1FEVUBaNOkfsno3DtlUqpbCQSqFA04fwFPv4uueCh4/edit) (Google account access required)

## Replace the samples with real events

Research agents should read [AGENTS.md](AGENTS.md) and [docs/REAL_EVENTS.md](docs/REAL_EVENTS.md). **`data/events.json` is the only event feed consumed by the app.** No frontend edits are needed to publish verified events.

The top-level object contains `mode`, `timezone`, `generated`, `window` and `events`. The production app accepts only `mode: "live"`. Simulated fixtures are used by tests; production load failures show an error or the last valid live data, without fictional replacements.

For real data, set `mode` to `"live"`, keep `timezone: "Europe/London"`, remove `demo_anchor`, and replace the entire sample array with verified events. Each real event must have `simulated: false`, its source event URL, and `verified_at`. **Live event dates are never shifted.** Simulated labels and the footer's sample-data wording update according to the feed. An empty live array is valid and shows an empty calendar.

The publication slice records today through 28 days ahead in `window`. After setting `LONDON_PRIVATE_RESEARCH_DIR` to an existing absolute directory outside this repository, `node scripts/import-reviewed-events.cjs path/to/reviewed.json` imports completed source-reviewed records, checks UK offsets and deduplication, and splits later discoveries into a private `future-events.json` outside the repository. That durable reserve is never loaded or auto-promoted by the app; source details must be rechecked before publication. The initial research sweep can save events through 6 January 2027 and any farther discoveries. Full organisation coverage and omission reasons stay in the Library research audit. Refreshes are intended every two days, with scheduling managed separately; the browser's Refresh button reloads the last published data.

Reserve candidates use a separate `records` array with their reviewed, unreviewed and held flags intact. The private `research-coverage.json` retains the original 371 organisation rows plus 29 university/Intelligence Squared coverage rows, including source limits, holds, aliases and publication-time omissions; the complete evidence bundle stays in Library. `node scripts/export-events.cjs` regenerates the public CSV with programme time, separate doors/arrival times and unverified perks clearly distinguished.

## University and Intelligence Squared expansion

The reviewed 6 October supplement adds 125 approved current listings and 27 directory rows, giving 286 current events and 398 organisations in the 7 October–4 November publication slice. All existing event category IDs and original directory rows are preserved. This is a finite 29-source institution/organisation pass, not exhaustive departmental coverage. Costs, public-access evidence, ballot conditions, sold-out physical attendance, online routes, doors and programme/reception times retain their source qualifications.

The repository is a consumer-authored projection from supported text reads of `London university and Intelligence Squared import.json`, Library identity `libfile_79d46d336fc48191861922e8c6cd12a4`, version 0. Full source claims and independent-review evidence remain in Library. The 11 independent-review holds remain outside the public feed. The 44 added reserve candidates bring the reserve to 277; they require fresh source and booking checks before promotion. No private correspondence or precise private-home locations are published.

## 8 October refresh

The reviewed refresh publishes 277 events for 8 October–5 November 2026 inclusive: 21 additions, promotions or restorations, 32 narrow corrections, 14 expired removals and three material-gap holds. Original verification timestamps remain unchanged for retained records and narrow corrections; refresh evidence is recorded separately. Programme, doors, unknown prices, member restrictions, host approval and sold-out physical attendance retain their qualifications. No cancellation was verified.

All 386 directory rows received a source attempt: 104 bounded checks, 179 partial checks and 103 access-limited attempts. This does not mean every event detail or live inventory was verified. The directory covers all four UK countries; this approved physical-event slice currently has England and Wales listings, alongside UK-hosted online events. Scotland and Northern Ireland directory coverage is retained without inventing current events.

Future discoveries, held candidates and the full research audit are stored privately outside the public repository. The previously tracked reserve and audit were publicly accessible even though the app did not load them; this refresh removes them from the current tree without rewriting history. Right To Life UK's original Event hosts sheet and row 16 provenance are restored, while its current verification status remains Needs checking. All other directory rows are preserved.

## Weekly email signup

The header **Weekly email** button and **Get the weekly email** card open a dedicated London Google Form, matching the DC site's signup flow. The calendar and organisations page footers also link to it.

The form requires name, email (with email-address validation), and institution / affiliation. Optional questions capture interests, event format, days, cost, social extras and full-versus-short roundup preference. Evening preferences use UK time. Submitting opts the visitor into the free weekly Sunday London email. No Google sign-in is required, response summaries remain private, and existing DC subscribers are not imported.

- [Public London newsletter signup](https://docs.google.com/forms/d/e/1FAIpQLSejuH1vnLTDNu3QnVgmQhCxsP7wgsy8Ub2RRqu-tZeuxtR-5Q/viewform)
- [Owner editor and subscriber responses](https://docs.google.com/forms/d/1dvqMw-vdH5tzKS-MLCxbBjrFr-YhW3NoSHnT89oW3k4/edit) (Google account access required)

Subscribers are stored in this form's **Responses** tab. Newsletter preparation and delivery are managed separately, as on the DC site; this static repository does not send emails. The calendar now contains reviewed real listings; the separate signup form may retain wording from the preview edition.

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

## Non-religious editorial scope

At the owner’s request on 7 October 2026, 13 current events, 16 reserve candidates and 12 faith-based organisation rows were removed. That cleanup left 273 published events and 386 organisations, with 261 reserve candidates now retained privately. Right To Life UK remains as an issue-based group needing verification; its former prayer-breakfast evidence was replaced by its official policy-advocacy page. The clarified 8 October scope excludes actual religious institutions as sources or hosts. Religion topics under otherwise aligned, in-scope hosts remain eligible; genuinely ambiguous host classifications are held for review. The machine-readable reviewed exclusions are in `data/listing-policy.json`; import and directory generation enforce them. Review source and host evidence rather than relying on topic keywords or inferring personal beliefs. Church venues, personal names and ordinary seasonal social events alone do not determine eligibility. Original removed records remain in the private research audit, outside this repository and public assets.
