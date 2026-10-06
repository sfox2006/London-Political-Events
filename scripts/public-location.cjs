/* Keep private-home locations with the organiser rather than in public assets. */
module.exports = function publicLocation(source) {
  const event = structuredClone(source);
  if (!/private\s+(?:home|house|residence)|home of\b/i.test([event.venue, event.address, event.notes].filter(Boolean).join(' '))) return event;
  event.venue = 'Private home; ask organiser for location';
  event.address = [event.city, event.country].filter(Boolean).join(', ') || 'Location from organiser';
  delete event.maps_url;
  event.public_location_redacted = true;
  const note = 'Private-home location omitted from this public calendar; ask organiser for details.';
  if (!String(event.notes || '').includes(note)) event.notes = [event.notes, note].filter(Boolean).join(' ');
  return event;
};
