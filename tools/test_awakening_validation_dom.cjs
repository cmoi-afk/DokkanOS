const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));const saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};const context={console,window,document,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),alert:m=>{console.log('ALERT',m)},setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(context);
vm.runInContext(fs.readFileSync('team-engine.js','utf8'),context);vm.runInContext(fs.readFileSync('app.js','utf8').split('boot().catch(')[0],context);vm.runInContext(fs.readFileSync('event-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-search.js','utf8'),context);vm.runInContext(fs.readFileSync('teams.js','utf8'),context);vm.runInContext(fs.readFileSync('events.js','utf8'),context);vm.runInContext(fs.readFileSync('catalog-model.js','utf8'),context);vm.runInContext(fs.readFileSync('catalogue.js','utf8'),context);
context.requestAnimationFrame=fn=>setTimeout(fn,0);context.queueMicrotask=queueMicrotask;context.Event=window.Event;context.MutationObserver=class{observe(){}};window.scrollTo=()=>{};window.scrollY=0;vm.runInContext(fs.readFileSync('team-battle-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-battles.js','utf8'),context);
(async()=>{
await vm.runInContext('boot()',context);
vm.runInContext("inventory={};DB.cards=DB.cards.filter(c=>!['1034180','1034181','1034191','1034201'].includes(String(c.candidateId)));missingQuery='1034181';renderMissing()",context);
assert(document.querySelector('[data-catalog-open="1034181"]'));
vm.runInContext('openCard("CATALOG-1034201")',context);
document.querySelector('[data-card-own="1034201"]').click();
assert(!document.querySelector('#missingList [data-catalog-open="1034181"]'));
assert.equal(vm.runInContext("inventory['1034181']",context),undefined);
document.querySelector('[data-catalog-view="encyclopedia"]').click();
assert(document.querySelector('#missingList [data-catalog-open="1034181"]'));
assert(document.querySelector('#missingList').textContent.includes('Éveil ultérieur possédé'));
vm.runInContext('openCard("CATALOG-1034201")',context);assert.equal(document.querySelectorAll('.card-chain button').length,4);
vm.runInContext("delete inventory['1034201'];renderMissing()",context);document.querySelector('[data-catalog-view="validation"]').click();assert(document.querySelector('[data-catalog-open="1034181"]'));
console.log('Validation DOM: confirm LR hides its initial UR, no inferred ownership, encyclopedia retains it, four-form chain, undo restores validation: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
