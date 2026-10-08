const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const input=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
const reviewed=Array.isArray(input)?input:input.events;
const feed=JSON.parse(fs.readFileSync(path.join(root,"data/events.json"),"utf8"));
const privateDirectory=require('./private-research.cjs')();
const file=path.join(privateDirectory,"research-coverage.json");
const audit=JSON.parse(fs.readFileSync(file,"utf8"));
const ids=new Set(feed.events.map(e=>e.id));
const {excludesEvent}=require('./listing-policy.cjs');
const reasonFor=e=>{
  if(excludesEvent(e)) return "Excluded religious source or host.";
  if(e.start.slice(0,10)>feed.window.end) return "Outside publication window; private reserve only.";
  if(e.end&&Date.parse(e.end)<=Date.parse(feed.generated)) return "Confirmed ended before publication.";
  if(e.start.slice(0,10)<feed.window.start&&!e.end) return "Listed day passed; end time unpublished.";
  if(!e.end&&e.time!=="TBC"&&Date.parse(e.start)<=Date.parse(feed.generated)) return "Already started; end time unpublished.";
  return "Not published; consult reviewed import decisions.";
};
const omitted=reviewed.filter(e=>!ids.has(e.id)).map(e=>({id:e.id,org:e.org,title:e.title,start:e.start,end:e.end,url:e.url,source_row_ids:e.source_row_ids,reason:reasonFor(e)}));
const expired=new Set(omitted.filter(e=>/^(Confirmed ended|Already started|Listed day passed)/.test(e.reason)).map(e=>e.id));
for(const row of audit.coverage){
  if(!row.events_by_status) continue;
  const moved=row.events_by_status.public.filter(id=>expired.has(id));
  row.events_by_status.public=row.events_by_status.public.filter(id=>ids.has(id));
  row.events_by_status.expired=[...new Set([...row.events_by_status.expired,...moved])];
}
const previousOmissions=audit.publication?.additional_omissions||[];
const allOmissions=[...new Map([...previousOmissions,...omitted].map(event=>[event.id,event])).values()];
const reserve=JSON.parse(fs.readFileSync(path.join(privateDirectory,"future-events.json"),"utf8"));
audit.publication={generated:feed.generated,window:feed.window,public_events:feed.events.length,reserve_records:(reserve.records||reserve.events||[]).length,coverage_rows:audit.coverage.length,additional_omissions:allOmissions};
fs.writeFileSync(file,JSON.stringify(audit,null,2)+"\n");
console.log(`Publication audit: ${feed.events.length} public, ${omitted.length} additional omissions, ${audit.coverage.length} coverage rows.`);
