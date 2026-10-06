const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const reviewed=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
const feed=JSON.parse(fs.readFileSync(path.join(root,"data/events.json"),"utf8"));
const file=path.join(root,"data/research-coverage.json");
const audit=JSON.parse(fs.readFileSync(file,"utf8"));
const ids=new Set(feed.events.map(e=>e.id));
const omitted=reviewed.filter(e=>!ids.has(e.id)).map(e=>({id:e.id,org:e.org,title:e.title,start:e.start,end:e.end,url:e.url,source_row_ids:e.source_row_ids,reason:e.end?"Confirmed ended before publication.":"Already started; end time unpublished."}));
const missing=new Set(omitted.map(e=>e.id));
for(const row of audit.coverage){
  const moved=row.events_by_status.public.filter(id=>missing.has(id));
  row.events_by_status.public=row.events_by_status.public.filter(id=>!missing.has(id));
  row.events_by_status.expired=[...new Set([...row.events_by_status.expired,...moved])];
}
audit.publication={generated:feed.generated,window:feed.window,public_events:feed.events.length,reserve_records:233,coverage_rows:audit.coverage.length,additional_omissions:omitted};
fs.writeFileSync(file,JSON.stringify(audit,null,2)+"\n");
console.log(`Publication audit: ${feed.events.length} public, ${omitted.length} additional omissions, ${audit.coverage.length} coverage rows.`);
