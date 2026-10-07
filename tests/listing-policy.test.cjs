const test = require('node:test');
const assert = require('node:assert/strict');
const { excludesEvent, excludesOrganisation } = require('../scripts/listing-policy.cjs');

test('reviewed exclusions cover renamed events, religious cohosts and source subdomains', () => {
  assert.equal(excludesEvent({id:'B2-011', title:'Renamed event'}), true);
  assert.equal(excludesEvent({org:'CRC Scotland; Christian Concern speaker Andrea Williams'}), true);
  assert.equal(excludesEvent({org:'St Mary’s University, Twickenham; CCLA'}), true);
  assert.equal(excludesEvent({org:'Unite for Education'}), true);
  assert.equal(excludesEvent({url:'https://events.care.org.uk/new-event'}), true);
  assert.equal(excludesEvent({source_urls:['https://christianconcern.com/ccevents/new-event/']}), true);
});

test('names, venues, secular policy positions and seasonal socials do not trigger exclusions', () => {
  assert.equal(excludesEvent({org:'UCL',title:'Language revival',speakers:['Christian Henderson'],venue:'Church House'}), false);
  assert.equal(excludesEvent({org:'Conservative club',title:'Christmas dinner'}), false);
  assert.equal(excludesOrganisation({name:'Right To Life UK'}), false);
  assert.equal(excludesOrganisation({name:"Queen's University Belfast Pro-Life Society"}), false);
  assert.equal(excludesEvent({url:'https://care.org.uk.example.com/event'}), false);
});

test('public data, future reserve and directory contain no reviewed excluded records', () => {
  for (const event of require('../data/events.json').events) assert.equal(excludesEvent(event),false,event.id);
  for (const event of require('../data/future-events.json').records) assert.equal(excludesEvent(event),false,event.id);
  for (const org of require('../data/organisations.json').organisations) assert.equal(excludesOrganisation(org),false,org.name);
});
