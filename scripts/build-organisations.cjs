/* Rebuild the public directory after editing data/organisations.json. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/organisations.json'), 'utf8'));
const form = 'https://docs.google.com/forms/d/e/1FAIpQLSe1uBIE4N7uRyIjUiO0GKFosXRj0UXuvFmdOlR7yx5oebiSGw/viewform';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const records = data.organisations;
const names = new Set();
for (const org of records) {
  if (!org.name || names.has(org.name)) throw new Error(`Missing or duplicate name: ${org.name}`);
  names.add(org.name);
  if (!['https:', 'http:'].includes(new URL(org.url).protocol)) throw new Error(`Invalid source URL: ${org.name}`);
  if (!['Event hosts', 'Needs checking'].includes(org.source_sheet)) throw new Error(`Unknown source status: ${org.name}`);
}
const evidenced = records.filter(org => org.source_sheet === 'Event hosts').length;
const candidates = records.length - evidenced;
const options = key => [...new Set(records.map(org => org[key]))].sort((a,b)=>a.localeCompare(b,'en-GB')).map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join('\n');
const field = (label,value) => value ? `<div><dt>${label}</dt><dd>${escape(value)}</dd></div>` : '';
const cards = [...records].sort((a,b)=>a.name.localeCompare(b.name,'en-GB')).map(org => `
    <article class="organisation" data-type="${escape(org.type)}" data-reach="${escape(org.reach)}" data-status="${escape(org.source_sheet)}">
      <details>
        <summary>
          <span class="organisation-heading"><span class="organisation-name">${escape(org.name)}</span><span class="organisation-meta">${escape(org.type)} · ${escape(org.area)}</span></span>
          <span class="evidence-label${org.source_sheet === 'Needs checking' ? ' evidence-pending' : ''}">${escape(org.evidence_status)}</span>
        </summary>
        <div class="organisation-details">
          <dl>${field('Political tradition / connection',org.tradition)}${field('Country / reach',org.reach)}${field('Event activity',org.events)}${field('Evidence / example',org.evidence)}${field('Access',org.access)}${field('Notes',org.notes)}</dl>
          <a href="${escape(org.url)}" target="_blank" rel="noopener noreferrer">View source / event page <span aria-hidden="true">↗</span></a>
          <p class="organisation-checked">Checked in the supplied directory: ${escape(org.checked_on)}.</p>
        </div>
      </details>
    </article>`).join('\n');
const suggestion = `<p>Know an event or organisation that should be listed but is missing? Have current evidence for an organisation that needs verification? Please fill out our Google Form to suggest a listing or help verify an existing organisation. For verification, include a recent official event page or other current evidence, its date, and any corrections.</p><a class="suggestion-button" href="${form}" target="_blank" rel="noopener noreferrer">Suggest a listing or submit verification <span aria-hidden="true">↗</span></a>`;
const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="description" content="Browse the organisations and event sources for London Political Events. Suggest missing listings or submit current evidence to help verify an organisation." />
  <meta name="theme-color" content="#0D0E51" />
  <title>Organisations | London Political Events</title>
  <link rel="canonical" href="https://sfox2006.github.io/London-Political-Events/organisations.html" />
  <link rel="icon" href="assets/icon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png" />
  <link rel="stylesheet" href="styles.css?v=7" />
</head>
<body class="directory-page">
  <a class="skip-link" href="#organisations">Skip to organisations</a>
  <header class="topbar directory-topbar">
    <a class="brand-home" href="./" aria-label="London Political Events home">
      <span class="eyebrow">London, UK</span>
      <span class="london-lockup"><img src="assets/mark.svg" width="40" height="56" alt="" /><span>London Political Events</span></span>
      <span class="brand-sub">Events, my dear boy, events</span>
    </a>
    <nav class="directory-nav" aria-label="Main navigation"><a href="./">Events</a><a href="organisations.html" aria-current="page">Organisations</a></nav>
  </header>
  <main id="organisations" class="directory-main">
    <section class="suggestion-callout" aria-labelledby="suggestion-heading">
      <div><h2 id="suggestion-heading">Suggest a listing or help verify an organisation</h2>${suggestion}</div>
    </section>
    <section aria-labelledby="organisations-heading">
      <div class="directory-intro">
        <p class="eyebrow">Our sources</p>
        <h1 id="organisations-heading">Organisations</h1>
        <p>The organisations we look to for event listings, from think tanks and campaign groups to local associations and university societies.</p>
        <p class="directory-context">This UK-wide directory includes England, Scotland, Wales and Northern Ireland. Parent organisations and local groups are listed separately. The calendar currently uses simulated events. This source list is for collecting real listings, and includes organisations outside London.</p>
        <p class="directory-context"><strong>${evidenced} with event evidence · ${candidates} needing verification.</strong> Evidence may be historical and does not guarantee an upcoming public event. Expand an organisation to see its notes and source. Directory checked on 6 October 2026.</p>
      </div>
      <form class="directory-filters" id="directory-filters" role="search" hidden>
        <div class="directory-search"><label for="org-search">Search organisations</label><input id="org-search" type="search" placeholder="Name, location or political tradition" /></div>
        <div><label for="org-status">Evidence</label><select id="org-status"><option value="">All organisations</option><option value="Event hosts">With event evidence</option><option value="Needs checking">Needs verification</option></select></div>
        <div><label for="org-type">Organisation type</label><select id="org-type"><option value="">All types</option>${options('type')}</select></div>
        <div><label for="org-reach">Country / reach</label><select id="org-reach"><option value="">All areas</option>${options('reach')}</select></div>
        <button id="org-reset" type="reset">Clear</button>
      </form>
      <p class="directory-count" id="org-count" role="status" aria-live="polite">${records.length} organisations</p>
      <div class="organisation-list" id="organisation-list">${cards}
      </div>
      <p id="org-empty" class="directory-empty" hidden>No organisations match these filters. Try a different search or clear the filters.</p>
    </section>
  </main>
  <footer class="site-footer">
    <div class="footer-suggestion"><h2>Suggest a listing or help verify an organisation</h2>${suggestion}</div>
    <p>An independent calendar of London politics and ideas events. <a href="./">Back to events</a>. The calendar currently contains simulated events only.</p>
  </footer>
  <script src="organisations.js?v=7" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(root,'organisations.html'),html);
console.log(`Built directory: ${records.length} organisations (${evidenced} with evidence, ${candidates} needing verification).`);
