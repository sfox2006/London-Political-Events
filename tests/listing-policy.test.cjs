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
  assert.equal(excludesEvent({id:'LUE-1fec2d9d116d',org:'University College London (UCL)',title:'Sickle and Veil: Communist Gender and Policies towards Muslim Minorities in Eastern Europe'}), false);
  assert.equal(excludesEvent({id:'B1-8edfb9d956b2',org:'UnHerd',title:'Tom Holland & Malcolm Guite: The case for re-enchantment'}), false);
  assert.equal(excludesEvent({id:'B3-2026-12-10-4874d13197',org:'North East Hertfordshire Conservatives',title:'Coffee, Cake & Carols'}), false);
});

test('public data and directory contain no reviewed excluded records', () => {
  for (const event of require('../data/events.json').events) assert.equal(excludesEvent(event),false,event.id);
  for (const org of require('../data/organisations.json').organisations) assert.equal(excludesOrganisation(org),false,org.name);
});
