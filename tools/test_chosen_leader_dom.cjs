const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));const saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};const context={console,window,document,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),alert:m=>{console.log('ALERT',m)},setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(context);
vm.runInContext(fs.readFileSync('team-engine.js','utf8'),context);vm.runInContext(fs.readFileSync('app.js','utf8').split('boot().catch(')[0],context);vm.runInContext(fs.readFileSync('event-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-search.js','utf8'),context);vm.runInContext(fs.readFileSync('teams.js','utf8'),context);vm.runInContext(fs.readFileSync('events.js','utf8'),context);vm.runInContext(fs.readFileSync('catalog-model.js','utf8'),context);vm.runInContext(fs.readFileSync('catalogue.js','utf8'),context);
(async()=>{
 await vm.runInContext('boot()',context);
 const run=code=>vm.runInContext(code,context);
 run("teamSettings.pool='catalog';inventory['1034201']='owned';inventory['1034151']='owned';teamSettings.leadCategory='Saga de Boo';switchView('teams')");
 // Keep the real engine, but restrict the catalogue to a small deterministic pool.
 run("const regressionPool=teamPool().filter(c=>TE.inCategory(c,'Saga de Boo')).slice(0,18);for(const id of ['1034201','1034151']){const c=teamOwnedCards().find(c=>TE.identity(c)===id)||resolveCard('CATALOG-'+id);if(!regressionPool.some(x=>TE.identity(x)===id))regressionPool.push(c)};teamPool=()=>regressionPool;const regressionRequests=[];const regressionExecute=executeTeamRequest;executeTeamRequest=request=>{regressionRequests.push(request);return regressionExecute(request)}");
 document.querySelector('[data-team-leader="1034201"]').click();
 assert.equal(run('teamSettings.leaderMode'),'manual');
 await run('autoBuildTeam()');
 assert.equal(run('TE.identity(resolveCard(teamLeader))'),'1034201');
 document.querySelector('[data-team-leader="1034151"]').click();
 await run('autoBuildTeam()');
 assert.equal(run('TE.identity(resolveCard(teamLeader))'),'1034151');
 assert.equal(run('TE.identity(teamCards()[0])'),'1034151');
 assert(run('regressionRequests.every(r=>!r.compare)'));
 assert.equal(JSON.parse(saved.get('dokkanos-team-settings-v2')).leaderMode,'manual');
 assert.equal(JSON.parse(saved.get('dokkanos-team-settings-v2')).leaderCatalog,'1034151');
 // A mission incompatible with the chosen leader must never silently select another.
 run("teamSettings.leadCategory='DAIMA';teamSettings.event='regression';teamEvents.events=[{id:'regression',name:'Regression',missions:[{id:'six',title:'DAIMA',requirements:[{kind:'category',value:'DAIMA',count:6}]}]}];teamSettings.mission='six';teamSettings.eventMissions=['six'];renderTeam()");
 document.querySelector('[data-team-action="jointMissions"]').click();
 while(run('teamBusy'))await new Promise(r=>setTimeout(r,10));
 assert.equal(run('regressionRequests.at(-1).compare'),false);
 assert.equal(run('TE.identity(resolveCard(teamLeader))'),'1034151');
 // Explicit comparison remains available; a subsequent manual selection cancels stale work.
 run("teamSettings.event='';teamSettings.mission='';teamSettings.eventMissions=[];teamSettings.leadCategory='Saga de Boo';renderTeam()");
 await run('autoBuildTeam(true)');assert.equal(run('regressionRequests.at(-1).compare'),true);
 run("teamSettings.leaderMode='auto';let finishRegression;executeTeamRequest=()=>new Promise(resolve=>finishRegression=resolve);chooseTeamLeader('1034201')");
 const pending=run('autoBuildTeam(true)');await new Promise(r=>setTimeout(r,0));
 run("chooseTeamLeader('1034151');finishRegression({leader:resolveCard('CATALOG-1034201'),team:[resolveCard('CATALOG-1034201')]})");await pending;
 assert.equal(run('TE.identity(resolveCard(teamLeader))'),'1034151');
 assert.equal(run('teamSettings.leaderMode'),'manual');
 // Direct Box selection takes the same preservation path.
 const select=document.querySelector('#leaderSelect');for(const o of select.querySelectorAll('option'))o.selected=o.textContent.includes('1034201');select.dispatchEvent(new window.Event('change',{bubbles:true}));
 assert.equal(run('TE.identity(resolveCard(teamLeader))'),'1034201');assert.equal(run('teamSettings.leaderMode'),'manual');
 console.log('Chosen leader retained across regeneration, persisted settings, incompatible joint missions, explicit comparison and stale jobs: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
