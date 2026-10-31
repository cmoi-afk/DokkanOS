const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));const saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};const context={console,window,document,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),alert:m=>{console.log('ALERT',m)},setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(context);
vm.runInContext(fs.readFileSync('team-engine.js','utf8'),context);vm.runInContext(fs.readFileSync('app.js','utf8').split('boot().catch(')[0],context);vm.runInContext(fs.readFileSync('event-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-search.js','utf8'),context);vm.runInContext(fs.readFileSync('teams.js','utf8'),context);vm.runInContext(fs.readFileSync('events.js','utf8'),context);vm.runInContext(fs.readFileSync('catalog-model.js','utf8'),context);vm.runInContext(fs.readFileSync('catalogue.js','utf8'),context);
context.requestAnimationFrame=fn=>setTimeout(fn,0);context.queueMicrotask=queueMicrotask;context.Event=window.Event;context.MutationObserver=class{observe(){}};window.scrollTo=()=>{};window.scrollY=0;vm.runInContext(fs.readFileSync('team-battle-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-battles.js','utf8'),context);
(async()=>{
await vm.runInContext('boot()',context);await vm.runInContext('ensureEvents()',context);
vm.runInContext(fs.readFileSync('experience.js','utf8'),context);
vm.runInContext(fs.readFileSync('mobile-comfort.js','utf8'),context);
assert.equal(document.documentElement.dataset.theme,'dark');
for(const type of ['AGI','TEC','INT','PUI','END']){
 const id=vm.runInContext("CATALOG.cards.find(c=>c.type==='"+type+"'&&window.DokkanCatalogModel.allowed(c)).id",context);
 vm.runInContext('openCard("CATALOG-'+id+'");window.DokkanMobileComfort.enhance()',context);
 assert.equal(document.querySelector('#sheet').dataset.type,type);
 assert(document.querySelector('#sheet .mobile-card-detail'));
}
const before=vm.runInContext('JSON.stringify(inventory)',context);
const theme=document.querySelector('[data-comfort="theme"]');Object.defineProperty(theme,'value',{value:'light',configurable:true});theme.dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(document.documentElement.dataset.theme,'light');
const density=document.querySelector('[data-comfort="density"]');Object.defineProperty(density,'value',{value:'compact',configurable:true});density.dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(document.documentElement.dataset.density,'compact');
assert.equal(vm.runInContext('JSON.stringify(inventory)',context),before);
vm.runInContext('closeSheet();switchView("catalog");window.DokkanMobileComfort.enhance()',context);
assert(document.querySelector('.catalog-grid .unit[data-type]'));assert.equal(document.querySelector('#missingQuery').getAttribute('list'),'mobileRecentSearches');
vm.runInContext('switchView("events");window.DokkanMobileComfort.enhance()',context);
const pin=document.querySelector('[data-mobile-pin]');assert(pin);pin.click();assert(document.querySelector('.mobile-pin-row'));assert(saved.get('dokkanos-mobile-comfort-v1').includes(pin.dataset.mobilePin));
vm.runInContext('eventSettings.selected=teamEvents.events.find(e=>e.missions.length>0).id;renderEvents()',context);
const todo=document.querySelector('[data-event-setting="missionTodo"]');assert(todo);todo.checked=true;todo.dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(vm.runInContext('eventSettings.missionTodo',context),true);assert.equal(document.querySelectorAll('.event-mission.completed').length,0);
console.log('Mobile comfort: five typed card sheets, catalogue types, non-destructive persisted theme/density, suggestions, pinned combat and unfinished missions: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
