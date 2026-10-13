const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML}=require('linkedom');const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));const saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};const ctx={window,document,console,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))},fetch:async p=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))}),setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(ctx);for(const file of ['team-engine.js','app.js','event-model.js','team-search.js','teams.js','events.js'])vm.runInContext(fs.readFileSync(file,'utf8').split('boot().catch(')[0],ctx);

vm.runInContext(fs.readFileSync('workbench-model.js','utf8'),ctx);
(async()=>{
 await vm.runInContext('boot();',ctx);await vm.runInContext('ensureEvents()',ctx);
 const run=s=>vm.runInContext(s,ctx);
 run("eventSettings.selected='quest-1782';eventSettings.stage='17820035';switchView('events')");
 const id=run("teamEvents.events.find(e=>e.id==='quest-1782').missions.find(m=>m.origin?.label==='Missions EX'&&m.stageNumber===3).id");
 const origin=run("teamEvents.events.find(e=>e.id==='quest-1782').missions.find(m=>m.id==='"+id+"').origin.eventId");
 const row=document.querySelector('[data-event-pick="'+id+'"]').closest('.event-mission');assert(row.textContent.includes('Missions EX'));assert(row.textContent.includes('Fin :'));assert(row.querySelector('a[href*="/mission/10422"]'));
 assert(!document.querySelector('#eventDetail').textContent.includes('Mission Z'),'Other-stage EX not shown');
 const stateBefore=run('JSON.stringify(eventProgress)');
 row.querySelector('[data-event-single-team]').click();assert.equal(run('teamSettings.event'),'quest-1782');assert.equal(run('teamSettings.eventStage'),'17820035');assert(run('teamMission().missions.some(m=>m.id==="'+id+'")'));assert.equal(run('JSON.stringify(eventProgress)'),stateBefore,'Preparing team never completes EX');
 run("eventConfirmMissions('quest-1782',['"+id+"'],{stage:'17820035'})");assert.equal(JSON.parse(saved.get('dokkanos-events-progress-v1'))[id].done,true);
 run("eventSettings.selected='"+origin+"';eventSettings.stage='';switchView('events')");assert(document.querySelector('[data-event-done="'+id+'"]').hasAttribute('checked'),'Shared completion in original campaign');
 const claimed=document.querySelector('[data-event-claimed="'+id+'"]');claimed.checked=true;claimed.dispatchEvent(new window.Event('change',{bubbles:true}));
 run("eventSettings.selected='quest-1782';eventSettings.stage='17820035';renderEvents()");assert(document.querySelector('[data-event-claimed="'+id+'"]').hasAttribute('checked'));
 const done=document.querySelector('[data-event-done="'+id+'"]');done.checked=false;done.dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(run("eventProgress['"+id+"'].claimed"),false);
 // Starting from the external mission rubric also selects the real boss/stage.
 run("eventSettings.selected='"+origin+"';eventSettings.stage='';renderEvents()");document.querySelector('[data-event-single-team="'+id+'"]').click();assert.equal(run('teamSettings.event'),'quest-1782');assert.equal(run('teamSettings.eventStage'),'17820035');
 console.log('EX visible on correct Cell stage; safe source link/date; team/boss transfer in both directions; shared completion/claim/reset; batch validation without automatic victory: OK');
})().catch(e=>{console.error(e);process.exitCode=1});

