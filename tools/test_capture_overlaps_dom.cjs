const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));const saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};const context={console,window,document,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),alert:m=>{console.log('ALERT',m)},setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(context);
vm.runInContext(fs.readFileSync('team-engine.js','utf8'),context);vm.runInContext(fs.readFileSync('app.js','utf8').split('boot().catch(')[0],context);vm.runInContext(fs.readFileSync('event-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-search.js','teams.js','utf8'),context);vm.runInContext(fs.readFileSync('events.js','utf8'),context);vm.runInContext(fs.readFileSync('catalog-model.js','utf8'),context);vm.runInContext(fs.readFileSync('catalogue.js','utf8'),context);

context.requestAnimationFrame=fn=>fn();
(async()=>{
 const collection=JSON.parse(fs.readFileSync('collection.json')),group=collection.cards.find(c=>!c.validated&&c.observations?.length>1),alias=group.observations.find(o=>o.boxId!==group.boxId).boxId;
 saved.set('dokkanos-edits',JSON.stringify([{boxId:alias,candidateId:'1034201',validated:true}]));
 saved.set('dokkanos-team',JSON.stringify([alias]));saved.set('dokkanos-team-leader',alias);saved.set('dokkanos-favorites',JSON.stringify([alias]));
 saved.set('dokkanos-saved-teams-v2',JSON.stringify([{id:'before-overlap',name:'Avant regroupement',cards:[alias],leader:alias,settings:{locked:[alias],excluded:[],replace:alias}}]));
 await vm.runInContext('boot()',context);
 assert.equal(vm.runInContext(`resolveCard(${JSON.stringify(alias)}).boxId`,context),group.boxId);
 assert.equal(vm.runInContext(`resolveCard(${JSON.stringify(alias)}).candidateId`,context),'1034201');
 assert(vm.runInContext(`resolveCard(${JSON.stringify(alias)}).validated`,context));
 assert.equal(vm.runInContext('selectedTeam[0]',context),group.boxId);assert.equal(vm.runInContext('teamLeader',context),group.boxId);assert(vm.runInContext(`favorites.has(${JSON.stringify(group.boxId)})`,context));
 assert.equal(vm.runInContext('teamSaved()[0].cards[0]',context),group.boxId);assert.equal(vm.runInContext('teamSaved()[0].settings.locked[0]',context),group.boxId);
 const before=vm.runInContext('verifyPending().length',context);
 vm.runInContext(`verifySelectPosition(${JSON.stringify(group.boxId)});verifyChooseCard('1034201');verifyConfirm()`,context);vm.runInContext('restoreEdits()',context);
 assert.equal(vm.runInContext('verifyPending().length',context),before);assert.equal(JSON.parse(saved.get('dokkanos-edits')).filter(x=>x.boxId===alias).length,0);
 // Disagreeing manual identifications remain one pending position; saving another card preserves both edits.
 saved.set('dokkanos-edits',JSON.stringify([{boxId:group.boxId,candidateId:'1034201',validated:true},{boxId:alias,candidateId:'1034211',validated:true}]));
 vm.runInContext('restoreEdits();renderVerify()',context);
 assert(vm.runInContext(`verifyPending().some(c=>c.boxId===${JSON.stringify(group.boxId)})`,context));
 vm.runInContext('saveEdits()',context);assert.equal(JSON.parse(saved.get('dokkanos-edits')).length,2);
 vm.runInContext(`verifySelectPosition(${JSON.stringify(group.boxId)})`,context);assert(document.querySelector('.verify-overlap'));assert.equal(document.querySelectorAll('.verify-overlap figure').length,group.observations.length);
 vm.runInContext("verifyChooseCard('1034201');verifyConfirm()",context);assert.equal(JSON.parse(saved.get('dokkanos-edits')).length,1);
 await vm.runInContext('boot()',context);assert(vm.runInContext(`resolveCard(${JSON.stringify(alias)}).validated`,context));
 console.log('Capture overlap migration: alias validations, current and saved teams, favorites, one-time confirmation, conflicting edits preserved, comparison UI and reload: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
