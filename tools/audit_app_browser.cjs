const fs=require('fs'),path=require('path'),assert=require('assert'),{chromium}=require('playwright');
const report={checkedAt:new Date().toISOString(),viewports:[],errors:[],warnings:[],data:{}};
fs.mkdirSync('audit-artifacts',{recursive:true});
const cat=JSON.parse(fs.readFileSync('catalog.json')),meta=JSON.parse(fs.readFileSync('card-meta.json')),events=JSON.parse(fs.readFileSync('events.json'));
const visible=events.events.filter(e=>!e.hidden);
report.data={catalogueCards:cat.cards.length,missingVerifiedKits:cat.cards.filter(c=>(meta.cards[c.id]||c).dataStatus?.kit!=='verified').map(c=>({id:c.id,name:c.name})),events:visible.length,missions:visible.reduce((n,e)=>n+e.missions.length,0),failedEventSourcePages:events.coverage.failedPages,eventFileBytes:fs.statSync('events.json').size};
const catalogIds=cat.cards.map(c=>String(c.id));assert.equal(new Set(catalogIds).size,catalogIds.length);
const missionIds=events.events.flatMap(e=>e.missions.map(m=>m.id));assert.equal(new Set(missionIds).size,missionIds.length);
report.data.missingLocalResources=cat.cards.filter(c=>{const id=c.resourceId||c.resource_id||c.imageId||c.id;return !['webp','png','jpg','jpeg'].some(ext=>fs.existsSync('assets/cards/'+id+'.'+ext))&&!String(c.image||'').startsWith('https://');}).map(c=>c.id);
(async()=>{const browser=await chromium.launch({headless:true});try{
for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'allow'});
 const page=await context.newPage();const errors=[],failed=new Set();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.add(r.url()+' '+r.status())});
 const started=Date.now();await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>document.querySelector('#grid .unit')&&Number(document.querySelector('#nAll').textContent)>0,{timeout:60000});
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#grid .unit'),{timeout:60000});
 const result={width,bootMs:Date.now()-started,tabs:[],offline:false};report.viewports.push(result);
 for(const id of ['box','duplicates','catalog','inventory','teams','events','analysis','verify']){
  await page.locator('nav [data-v="'+id+'"]').click();await page.locator('#'+id+'.on').waitFor();await page.waitForTimeout(100);
  const geometry=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,active:document.querySelector('nav [aria-current="page"]')?.dataset.v,boxControlsVisible:getComputedStyle(document.querySelector('#search')).display!=='none'}));
  result.tabs.push({id,geometry});assert.equal(geometry.active,id);assert(geometry.document<=geometry.viewport+2,'page overflows at '+width+' '+id+' '+JSON.stringify(geometry));assert.equal(geometry.boxControlsVisible,id==='box');
  if(['events','teams','box'].includes(id))await page.screenshot({path:'audit-artifacts/'+id+'-'+width+'.png'});
 }
 await page.locator('nav [data-v="events"]').click();await page.locator('#eventSearch').fill('Recueil');
 await page.waitForFunction(()=>document.querySelector('#events').textContent.includes('Recueil'));
 await page.locator('#events [data-event-setting="status"]').selectOption('all');
 const open=page.locator('#events [data-event-open]').first();await open.click();await page.locator('#eventDetail').waitFor();
 const pick=page.locator('#eventDetail [data-event-pick]').first();if(await pick.count()){
  await pick.check();await page.locator('#eventDetail [data-event-team]').click();await page.locator('#teams.on').waitFor();
  assert((await page.locator('#teamObjective').innerText()).includes('Recueil'));result.eventToTeam=true;
 }
 await context.setOffline(true);await page.reload();await page.waitForFunction(()=>document.querySelector('#grid .unit'),{timeout:60000});await page.locator('nav [data-v="events"]').click();await page.waitForFunction(()=>document.querySelector('#events .event-grid .event-card'),{timeout:60000});result.offline=true;
 assert.equal(errors.length,0,JSON.stringify(errors));result.runtimeErrors=errors;result.httpFailures=[...failed].slice(0,20);await context.close();
}
 const context=await browser.newContext();await context.addInitScript(()=>{Object.defineProperty(Storage.prototype,'getItem',{value(){throw new Error('storage blocked')}});Object.defineProperty(Storage.prototype,'setItem',{value(){throw new Error('storage blocked')}});});const page=await context.newPage();page.on('dialog',d=>d.dismiss());const blockedErrors=[];page.on('pageerror',e=>blockedErrors.push(e.message));await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>document.querySelector('#grid .unit'),{timeout:60000});await page.locator('nav [data-v="events"]').click();await page.waitForFunction(()=>document.querySelector('#events .event-card'),{timeout:60000});assert.equal(blockedErrors.length,0,JSON.stringify(blockedErrors));report.blockedStorageWorks=true;await context.close();
}catch(e){report.errors.push(e.stack||String(e));process.exitCode=1;}finally{await browser.close();fs.writeFileSync('audit-artifacts/report.json',JSON.stringify(report,null,2));console.log('AUDIT_RESULT '+JSON.stringify(report));}})();
