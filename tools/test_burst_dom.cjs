const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8')),saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};
const context={console,window,document,performance,URL,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),alert:m=>{throw Error(m)},confirm:()=>true,setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(context);
for(const f of ['team-engine.js','app.js','event-model.js','team-search.js','teams.js','catalog-model.js','catalogue.js','battlefield-model.js','battlefield.js','teams-ui.js'])vm.runInContext(fs.readFileSync(f,'utf8').split('boot().catch(')[0],context);
const run=s=>vm.runInContext(s,context);

(async()=>{
 for(const f of ['event-calendar.js','events.js','burst-model.js','burst.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
 await run('boot()');await run('ensureEvents()');await run('teamBossReady');
 const before=run('JSON.stringify(inventory)');
 await window.DokkanBurst.prepare();
 const plan=window.DokkanBurst.current();
 assert(plan,run('teamStatusText'));
 assert.equal(window.DokkanBurstModel.score(plan.ids),8000);
 assert(run('window.DokkanBurstModel.check(teamSettings.burstPlan,[...teamCards(),teamFriend(resolveCard(teamLeader))],TE)'));
 assert.equal(before,run('JSON.stringify(inventory)'));
 assert(document.querySelector('[data-burst-build]'));
 assert(run('teamMission().requirements.some(r=>r.kind==="category"&&r.count===7)'));
 assert(run('teamBoss().burstEffects.threshold>0'));
 console.log('Burst DOM: owned box, leader and friend, 8000 points, enemy effects, saved configuration and unchanged inventory OK');
})().catch(e=>{console.error(e);process.exitCode=1});
