const policy = require('../data/listing-policy.json');
const normal = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const organisations = policy.organisation_names.map(normal);
const hosts = [...organisations, ...policy.event_organiser_aliases.map(normal)];
const ids = new Set(policy.event_ids);
const domains = new Set(policy.source_domains);

function excludesOrganisation(org) {
  return organisations.includes(normal(org.name));
}

function excludesEvent(event) {
  if (ids.has(event.id) || hosts.some(host => normal(event.org).includes(host))) return true;
  return [event.url, event.rsvp_url, event.source, ...(event.source_urls || [])].some(value => {
    try {
      const hostname = new URL(value).hostname.replace(/^www\./, '');
      return [...domains].some(domain => hostname === domain || hostname.endsWith('.' + domain));
    } catch { return false; }
  });
}

module.exports = { excludesEvent, excludesOrganisation };
