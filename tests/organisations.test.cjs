const test = require('node:test');
const assert = require('node:assert/strict');
const status = require('../scripts/organisation-status.cjs');

test('original directory provenance does not imply current event verification', () => {
  assert.equal(status({source_sheet:'Event hosts',verification_status:'Needs checking'}),'Needs checking');
  assert.equal(status({source_sheet:'Event hosts'}),'Event hosts');
  const row = require('../data/organisations.json').organisations.find(org=>org.name==='Right To Life UK');
  assert.equal(row.source_sheet,'Event hosts');
  assert.equal(row.source_row,16);
  assert.equal(row.evidence_status,'Needs current verification');
  assert.equal(status(row),'Needs checking');
});
