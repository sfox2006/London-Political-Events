# Working on London Political Events

This is a self-contained static site, adapted from Sam's DC calendar. Preserve the existing interface unless asked to redesign it. No framework or build step is required.

## Event research

- Read `docs/REAL_EVENTS.md` before adding real listings.
- The production feed is `data/events.json`. Research drafts can be separate JSON files, then validated and consolidated into that feed.
- Do not treat any `demo-london-*` listing as evidence of a real event. The initial 43 events and their hosts, people, venues, prices and perks are fictional.
- Verify real events on the original organiser's event or registration page. Do not invent dates, speakers, access conditions, perks or price information.
- Use ISO 8601 timestamps with explicit UTC offsets. Apply `Europe/London` and the offset appropriate to each date: BST `+01:00` or GMT `+00:00`.
- Preserve the schema, unique stable IDs, enumerated ideology and format fields, and three boolean perk tags.
- To publish real data, replace the sample array, switch `mode` to `live`, remove `demo_anchor`, and set every event's `simulated` to `false`. Include an original source URL and `verified_at` timestamp for each event.
- Never silently relabel a sample listing as real. Real event dates stay fixed.
- Run `npm run validate` and `npm test` before committing changes.

## UI and assets

- Local fonts, icons, manifest and service worker use relative paths for GitHub Pages.
- Use the original Fighting for a Free Future torch and logo assets with its dark blue `#16374D` and orange `#E37014` palette. Keep the calendar, organisations page, app icons and social preview consistent. README.md records the artwork sources.
- All displayed and exported times use `Europe/London`.
- London newsletter signup uses the London-specific Google Form linked in the header, newsletter card and footer. Keep it separate from the DC signup form and the event/organisation suggestion form. See README.md for the owner editor and response-management link.
- If changing the app shell after publication, bump the shell cache version and HTML asset query versions together.
