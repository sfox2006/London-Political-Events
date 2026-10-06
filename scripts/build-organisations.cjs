/* Rebuild the public directory after editing data/organisations.json. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const eventsPage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// Derive shared header and About content from the events page to prevent drift.
const header = eventsPage.match(/<header class="topbar">[\s\S]*?<\/header>/)[0]
  .replace(/<button type="button" class="brand-home" id="brand-home">([\s\S]*?)<\/button>/,
    '<a class="brand-home" id="brand-home" href="./" aria-label="London Political Events home">$1</a>')
  .replace(/<button type="button" class="view-toggle" id="view-toggle" aria-pressed="false">([\s\S]*?)<\/button>/,
    '<a class="view-toggle" id="view-toggle" href="./?view=calendar">$1</a>')
  .replace('href="organisations.html"', 'href="organisations.html" aria-current="page"');
const about = eventsPage.match(/<dialog id="about-dialog"[\s\S]*?<\/dialog>/)[0];
const installTip = eventsPage.match(/<div class="install-tip"[\s\S]*?<\/div>/)[0];
const symbolStyles = eventsPage.match(/<link rel="stylesheet" href="https:\/\/fonts.googleapis.com\/css2\?family=Material[^\n]+/)[0];
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/organisations.json'), 'utf8'));
const form = 'https://docs.google.com/forms/d/e/1FAIpQLSe1uBIE4N7uRyIjUiO0GKFosXRj0UXuvFmdOlR7yx5oebiSGw/viewform';
const newsletterForm = 'https://docs.google.com/forms/d/e/1FAIpQLSejuH1vnLTDNu3QnVgmQhCxsP7wgsy8Ub2RRqu-tZeuxtR-5Q/viewform';
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
  <meta name="theme-color" content="#16374D" />
  <title>Organisations | London Political Events</title>
  <link rel="canonical" href="https://sfox2006.github.io/London-Political-Events/organisations.html" />
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" href="assets/icon.svg?v=14" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png?v=14" />
  <link rel="stylesheet" href="styles.css?v=14" />
  ${symbolStyles}
</head>
<body class="directory-page">
  <a class="skip-link" href="#organisations">Skip to organisations</a>
  <div class="sticky-chrome">${header}</div>
  ${installTip}
  <main id="organisations" class="directory-main">
    <section class="suggestion-callout" aria-labelledby="suggestion-heading">
      <div><h2 id="suggestion-heading">Suggest a listing or help verify an organisation</h2>${suggestion}</div>
    </section>
    <section aria-labelledby="organisations-heading">
      <div class="directory-intro">
        <p class="eyebrow">Our sources</p>
        <h1 id="organisations-heading">Organisations</h1>
        <p>The organisations we look to for event listings, from think tanks and campaign groups to local associations and university societies.</p>
        <p class="directory-context">This UK directory includes England, Scotland, Wales and Northern Ireland, plus UK-wide groups. Parent organisations and local groups are listed separately. The calendar researches events across the UK and online. In-person listings preserve their actual location, including venues outside London.</p>
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
    <a class="brand-credit" href="https://www.fightingforafreefuture.com/" target="_blank" rel="noopener noreferrer"><img src="assets/fff-logo.png?v=14" width="160" height="160" alt="Fighting for a Free Future" loading="lazy" /></a>
    <div class="footer-suggestion"><h2>Suggest a listing or help verify an organisation</h2>${suggestion}</div>
    <div class="footer-suggestion"><h2>Get the weekly email</h2><p>A free Sunday roundup of London politics and ideas events.</p><a class="suggestion-button" href="${newsletterForm}" target="_blank" rel="noopener noreferrer">Sign up for the London weekly email <span aria-hidden="true">↗</span></a></div>
    <p>An independent calendar of politics, ideas and social events across the UK and online. <a href="./">Back to events</a>. Check each organiser's event page for current details.</p>
  </footer>
  ${about}
  <script src="directory-header.js?v=14" defer></script>
  <script src="organisations.js?v=14" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(root,'organisations.html'),html);
console.log(`Built directory: ${records.length} organisations (${evidenced} with evidence, ${candidates} needing verification).`);
