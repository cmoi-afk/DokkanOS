const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8')),saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};
const context={console,window,document,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),alert:m=>{throw Error(m)},setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(context);
for(const f of ['team-engine.js','app.js','event-model.js','team-search.js','teams.js','events.js','catalog-model.js','catalogue.js'])vm.runInContext(fs.readFileSync(f,'utf8').split('boot().catch(')[0],context);
const run=s=>vm.runInContext(s,context);
(async()=>{
 await run('boot()');await run('teamBossReady');
 const inventory=run('JSON.stringify(inventory)'),box=run('JSON.stringify(ownedTeamCards())');
 assert(run('teamCatalog().length>100&&teamCatalog().every(teamFinalForm)'));
 assert(run("!teamFinalForm(verifyCandidate('1000010'))&&teamFinalForm(verifyCandidate('1005541'))"));
 // Independent cards with the same character/name must remain available.
 assert(run("teamCatalog().filter(c=>c.name==='Son Goku Super Saiyan').length>1"));
 run("inventory['1000010']='owned';delete inventory['1005541'];teamSettings.pool='owned'");
 assert(run("!teamPool().some(c=>TE.identity(c)==='1000010'||TE.identity(c)==='1005541')"));
 assert.equal(run("inventory['1000010']"),'owned');assert.equal(run("inventory['1005541']"),undefined);
 run("inventory['1005541']='owned'");assert(run("teamPool().some(c=>TE.identity(c)==='1005541')"));
 run("teamSettings.pool='catalog';selectedTeam=['MANUAL-1000010','MANUAL-1005541'];teamLeader='MANUAL-1000010';teamSettings.leaderCatalog='1000010';teamSettings.locked=[teamLeader];teamSettings.friend='1000010';renderTeam()");
 assert.equal(run('selectedTeam.join()'),'MANUAL-1005541');assert.equal(run('teamLeader'),'');assert.equal(run('teamSettings.leaderCatalog'),'');assert.equal(run('teamSettings.friend'),'mirror');assert.equal(run('teamSettings.locked.length'),0);
 assert.equal(JSON.parse(saved.get('dokkanos-team')).join(),'MANUAL-1005541');
 run("chooseTeamLeader('1000010')");assert.equal(run('teamLeader'),'');
 assert(!document.querySelector('#leaderSelect option[value="MANUAL-1000010"]'));
 assert(!document.querySelector('[data-team-setting="friend"] option[value="1000010"]'));
 run("chooseTeamLeader('1034201')");await run('autoBuildTeam()');assert.equal(run('teamCards().length'),6);assert(run('teamCards().every(teamFinalForm)'));
 const target=run('selectedTeam.find(id=>id!==teamLeader)');await run(`autoReplaceTeamCard(${JSON.stringify(target)})`);
 assert(run('teamCards().every(teamFinalForm)'));
 // Restore only the test fixture mutations; composition must not affect the Box.
 run("delete inventory['1000010'];delete inventory['1005541']");
 assert.equal(run('JSON.stringify(inventory)'),inventory);assert.equal(run('JSON.stringify(ownedTeamCards())'),box);
 console.log('Final awakening forms: catalogue/Box, leaders/friends, legacy team cleanup, generation/replacement and ownership preservation OK');
})().catch(e=>{console.error(e);process.exitCode=1});
