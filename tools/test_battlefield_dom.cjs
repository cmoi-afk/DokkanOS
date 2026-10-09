const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8')),saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};
const context={console,window,document,performance,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),alert:m=>{throw Error(m)},confirm:()=>true,setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(context);
for(const f of ['team-engine.js','app.js','event-model.js','team-search.js','teams.js','catalog-model.js','catalogue.js','battlefield-model.js','battlefield.js','teams-ui.js'])vm.runInContext(fs.readFileSync(f,'utf8').split('boot().catch(')[0],context);
const run=s=>vm.runInContext(s,context);
(async()=>{
 await run('boot()');await run('teamBossReady');await window.DokkanBattlefield.ready;
 const inventory=run('JSON.stringify(inventory)'),edits=run('JSON.stringify(DB.cards)'),classic=run('JSON.stringify(selectedTeam)'),lead=run('teamLeader');
 window.DokkanBattlefield.open();assert(document.querySelector('[data-bf-action="generate"]'));assert(document.querySelector('#teams main').textContent.includes('70'));
 window.DokkanTeamUI.enhance();assert.equal(document.querySelector('#teams .team-heading h2').textContent,'Battlefield');
 const mine=window.DokkanBattlefield.getPool();assert(mine.length>=7);assert(run('window.DokkanBattlefield.getPool().every(teamFinalForm)'));
 const started=performance.now();await window.DokkanBattlefield.calculate('generate');const elapsed=Math.round(performance.now()-started);let state=window.DokkanBattlefield.getState(),s=state.sessions[state.active];assert(s);assert(Object.keys(s.plan).length>0);const planned=Object.values(s.plan).flat();assert.equal(new Set(planned).size,planned.length);assert(planned.every(i=>mine.some(c=>String(c.candidateId||c.id)===i)));console.log('Real confirmed Box generation: '+elapsed+' ms; '+Object.keys(s.plan).length+' teams, '+planned.length+' unique cards.');
 const b=Object.keys(s.plan)[0];const select=document.querySelector('#bfBoss');for(const option of select.querySelectorAll('option')){if(option.value===b)option.setAttribute('selected','');else option.removeAttribute('selected');}select.dispatchEvent(new window.Event('change',{bubbles:true}));
 document.querySelector('[data-bf-action="lock"]').click();state=window.DokkanBattlefield.getState();assert(state.sessions[state.active].locked.includes(b));
 document.querySelector('[data-bf-action="victory"]').click();state=window.DokkanBattlefield.getState();assert.equal(state.sessions[state.active].attempts.length,1);assert.equal(state.sessions[state.active].attempts[0].cards.length,7);
 document.querySelector('[data-bf-action="undo"]').click();assert.equal(window.DokkanBattlefield.getState().sessions[state.active].attempts.length,0);
 await window.DokkanBattlefield.calculate('generate');document.querySelector('[data-bf-action="reset"]').click();assert(window.DokkanBattlefield.getState().previous);document.querySelector('[data-bf-action="restore"]').click();assert(Object.keys(window.DokkanBattlefield.getState().sessions[state.active].plan).length);
 // A cancelled worker cannot overwrite the previous persisted plan with a late response.
 let fakeWorker;context.Worker=function(){fakeWorker=this;this.postMessage=()=>{};this.terminate=()=>{this.terminated=true};};const stored=saved.get('dokkanos-battlefield-v1'),pending=window.DokkanBattlefield.calculate('generate');document.querySelector('[data-bf-action="cancel"]').click();assert(fakeWorker.terminated);fakeWorker.onmessage({data:{value:{plan:{},warnings:[]}}});await pending;assert.equal(saved.get('dokkanos-battlefield-v1'),stored);delete context.Worker;
 // Reload module from persisted ledger; default classic view remains unchanged.
 vm.runInContext(fs.readFileSync('battlefield.js','utf8'),context);assert(Object.keys(window.DokkanBattlefield.getState().sessions[state.active].plan).length);
 assert.equal(run('JSON.stringify(inventory)'),inventory);assert.equal(run('JSON.stringify(DB.cards)'),edits);assert.equal(run('JSON.stringify(selectedTeam)'),classic);assert.equal(run('teamLeader'),lead);assert(!saved.has('dokkanos-inventory'));assert(!saved.has('dokkanos-edits'));
 console.log('Battlefield DOM: confirmed final forms, dual-leader generation, session outcome/undo/reset/recover/reload and Box/classic preservation OK');
})().catch(e=>{console.error(e);process.exitCode=1});
