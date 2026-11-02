const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));const saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};const context={console,window,document,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),alert:m=>{console.log('ALERT',m)},setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(context);
vm.runInContext(fs.readFileSync('team-engine.js','utf8'),context);vm.runInContext(fs.readFileSync('app.js','utf8').split('boot().catch(')[0],context);vm.runInContext(fs.readFileSync('event-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-search.js','utf8'),context);vm.runInContext(fs.readFileSync('teams.js','utf8'),context);vm.runInContext(fs.readFileSync('events.js','utf8'),context);vm.runInContext(fs.readFileSync('catalog-model.js','utf8'),context);vm.runInContext(fs.readFileSync('catalogue.js','utf8'),context);
context.requestAnimationFrame=fn=>setTimeout(fn,0);context.queueMicrotask=queueMicrotask;context.Event=window.Event;context.MutationObserver=class{observe(){}};window.scrollTo=()=>{};window.scrollY=0;vm.runInContext(fs.readFileSync('team-battle-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-battles.js','utf8'),context);
(async()=>{
await vm.runInContext('boot()',context);await vm.runInContext('ensureEvents()',context);
window.HTMLElement.prototype.showModal=function(){this.open=true};window.HTMLElement.prototype.close=function(){this.open=false};
for(const f of ['collection-tools-model.js','collection-tools.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
vm.runInContext("inventory={};storageWrite('dokkanos-inventory','{}');window.DokkanCollectionTools.selected.add('1034201');window.DokkanCollectionTools.batchConfirm()",context);
assert.equal(vm.runInContext("inventory['1034201']",context),'owned');assert.equal(vm.runInContext("inventory['1034191']",context),undefined);
assert(window.DokkanCollectionTools.prefs.history.length);
window.DokkanCollectionTools.open('history');document.querySelector('[data-ct-undo="0"]').click();assert.equal(vm.runInContext("inventory['1034201']",context),undefined);
window.DokkanCollectionTools.open('filters');document.getElementById('ctPresetName').value='Mon filtre LR';document.querySelector('[data-ct-save-filter]').click();assert.equal(window.DokkanCollectionTools.prefs.presets[0].name,'Mon filtre LR');
window.DokkanCollectionTools.open('awakening');assert(document.querySelector('.ct-body').textContent.includes('éveils'));
vm.runInContext('openCard("CATALOG-1034201");window.DokkanCollectionTools.enhance()',context);assert(document.querySelector('[data-ct-add-compare="1034201"]'));
vm.runInContext('switchView("catalog");window.DokkanCollectionTools.enhance()',context);document.querySelector('[data-ct-bulk]').click();assert(document.querySelector('[data-ct-pick]'));
console.log('Collection DOM: bulk LR confirmation, exact form ownership, reversible history, named filters, awakening plan, sheet comparator and selection checkboxes: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
