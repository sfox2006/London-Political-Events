const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawnSync} = require('node:child_process');
const data = require('../event-data.js');
const root = path.join(__dirname, '..');

test('reviewed imports keep the inclusive London window public and reserves private without auto-promotion', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'london-import-'));
  try {
    const repository = path.join(temporary, 'repository');
    const privateDirectory = path.join(temporary, 'private');
    fs.mkdirSync(privateDirectory);
    for (const file of ['event-data.js','scripts/import-reviewed-events.cjs','scripts/private-research.cjs','scripts/public-location.cjs','scripts/listing-policy.cjs','data/listing-policy.json']) {
      fs.mkdirSync(path.dirname(path.join(repository,file)), {recursive:true});
      fs.copyFileSync(path.join(root,file),path.join(repository,file));
    }
    const now = new Date();
    const range = data.browsingWindow(now);
    const nextDay = new Date(Date.UTC(range.start.y, range.start.m-1, range.start.d+1));
    const afterWindow = new Date(Date.UTC(range.end.y, range.end.m-1, range.end.d+1));
    const stamp = date => data.localStamp(date);
    const make = (id,start,extra={}) => ({
      id, title:id, org:'Test host', start, url:'https://example.com/'+id,
      ideology:'nonpartisan',format:'online',cost:'Unknown',source:'Test fixture',
      access:'Eligibility unknown; ask organiser',tags:{free_food:false,free_drinks:false,young_professionals:false},
      simulated:false,verified_at:stamp(now),publication_approved:true,...extra,
    });
    const stable = make('stable-id',stamp(nextDay));
    const held = make('held',stamp(nextDay),{publication_approved:false,review_decision:'hold',hold_reason:'Access unresolved'});
    const unreviewed = make('unreviewed',stamp(nextDay),{publication_approved:false,fresh_check_required:true});
    const reserve = {records:[held,unreviewed,{...stable,id:'reserve-conflicting-id'}],requires_reverification:true};
    fs.writeFileSync(path.join(privateDirectory,'future-events.json'),JSON.stringify(reserve));
    fs.writeFileSync(path.join(repository,'data/events.json'),JSON.stringify({mode:'live',timezone:data.TZ,events:[stable],editorial_scope:'Host-based scope'}));
    const rows = [
      {...stable,id:'incoming-id'},
      make('tbc-today',stamp(data.midnight(range.start)),{time:'TBC'}),
      make('last-day',stamp(new Date(data.midnight(range.end).getTime()+23*3600000))),
      make('later',stamp(afterWindow)),
      make('ended-tbc',stamp(new Date(now.getTime()-3600000)),{time:'TBC',end:stamp(new Date(now.getTime()-1000))}),
      make('started-unknown-end',stamp(new Date(now.getTime()-3600000))),
    ];
    const reviewed = path.join(temporary,'reviewed.json');
    fs.writeFileSync(reviewed,JSON.stringify({events:rows}));
    const run = directory => spawnSync(process.execPath,[path.join(repository,'scripts/import-reviewed-events.cjs'),reviewed],{encoding:'utf8',env:{...process.env,LONDON_PRIVATE_RESEARCH_DIR:directory}});
    assert.notEqual(run(repository).status,0,'Private storage inside the Pages tree is rejected');
    const result = run(privateDirectory);
    assert.equal(result.status,0,result.stderr);
    const feed = JSON.parse(fs.readFileSync(path.join(repository,'data/events.json')));
    assert.deepEqual(new Set(feed.events.map(e=>e.id)),new Set(['stable-id','tbc-today','last-day']));
    assert.equal(feed.editorial_scope,'Host-based scope');
    assert.deepEqual(data.validatePayload(feed),[]);
    assert.equal(feed.events.find(e=>e.id==='stable-id').cost,'Unknown');
    const saved = JSON.parse(fs.readFileSync(path.join(privateDirectory,'future-events.json')));
    assert.deepEqual(saved.records.find(e=>e.id==='held'),held);
    assert.deepEqual(saved.records.find(e=>e.id==='unreviewed'),unreviewed);
    assert.ok(saved.records.some(e=>e.id==='later'));
    assert.equal(fs.existsSync(path.join(repository,'data/future-events.json')),false);
    const report = JSON.parse(result.stdout);
    assert.equal(report.omitted.length,2);
    const stalePromotion = {...held,publication_approved:true,review_decision:'pass_with_caveats',verified_at:stamp(new Date(now.getTime()-86400000))};
    fs.writeFileSync(reviewed,JSON.stringify({events:[stalePromotion]}));
    const stale = run(privateDirectory);
    assert.notEqual(stale.status,0);
    assert.match(stale.stderr,/requires fresh source verification before promotion/);
    fs.writeFileSync(reviewed,JSON.stringify({events:[{...stalePromotion,verified_at:stamp(now)}]}));
    const fresh = run(privateDirectory);
    assert.equal(fresh.status,0,fresh.stderr);
    assert.equal(JSON.parse(fs.readFileSync(path.join(repository,'data/events.json'))).events[0].id,'held');
  } finally { fs.rmSync(temporary,{recursive:true,force:true}); }
});

test('live validation rejects out-of-window dates and wrong offsets across the October clock change', () => {
  const event = {...require('./fixtures/demo-events.json').events[0],simulated:false,url:'https://example.com/test',verified_at:'2026-10-08T13:00:00+01:00',start:'2026-11-05T23:30:00+00:00'};
  delete event.end;
  const feed = {mode:'live',timezone:data.TZ,window:{start:'2026-10-08',end:'2026-11-05'},events:[event]};
  assert.deepEqual(data.validatePayload(feed),[]);
  event.start='2026-11-06T00:00:00+00:00';
  assert.match(data.validatePayload(feed).join('\n'),/outside the inclusive publication window/);
  event.start='2026-10-26T18:00:00+01:00';
  assert.match(data.validatePayload(feed).join('\n'),/BST\/GMT offset/);
  event.start='2026-10-24T18:00:00+01:00';
  assert.deepEqual(data.validatePayload(feed),[]);
  event.start='2026-10-07T18:00:00+01:00';
  event.end='2026-10-08T00:00:00+01:00';
  assert.match(data.validatePayload(feed).join('\n'),/outside the inclusive publication window/);
});

test('the public tree contains neither the future reserve nor full research audit', () => {
  for (const file of ['data/future-events.json','data/research-coverage.json']) assert.equal(fs.existsSync(path.join(root,file)),false,file);
});
