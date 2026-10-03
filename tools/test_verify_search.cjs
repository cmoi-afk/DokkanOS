const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));const saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};const context={console,window,document,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),alert:m=>{console.log('ALERT',m)},setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(context);
vm.runInContext(fs.readFileSync('team-engine.js','utf8'),context);vm.runInContext(fs.readFileSync('app.js','utf8').split('boot().catch(')[0],context);vm.runInContext(fs.readFileSync('event-model.js','utf8'),context);vm.runInContext(fs.readFileSync('teams.js','utf8'),context);vm.runInContext(fs.readFileSync('events.js','utf8'),context);vm.runInContext(fs.readFileSync('catalog-model.js','utf8'),context);vm.runInContext(fs.readFileSync('catalogue.js','utf8'),context);
context.requestAnimationFrame=fn=>setTimeout(fn,0);context.queueMicrotask=queueMicrotask;context.Event=window.Event;context.MutationObserver=class{observe(){}};window.scrollTo=()=>{};window.scrollY=0;vm.runInContext(fs.readFileSync('team-battle-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-battles.js','utf8'),context);


(async()=>{
 await vm.runInContext('boot()',context);vm.runInContext('var priorVerifyResults=verifyResults;',context);
 vm.runInContext(fs.readFileSync('verify-search.js','utf8'),context);
 window.DokkanVerifySearch.prepare();const initial=window.DokkanVerifySearch.metrics;
 const times={before:[],after:[]};for(const q of ['goku','Végéta','1034201','ssr agi','xyzaucunresultat']){
 vm.runInContext('verifyDraft.query='+JSON.stringify(q),context);let t=performance.now();const old=vm.runInContext('priorVerifyResults().map(c=>String(c.id))',context);times.before.push(performance.now()-t);
 t=performance.now();const newer=vm.runInContext('verifyResults().map(c=>String(c.id))',context);times.after.push(performance.now()-t);assert.deepEqual(Array.from(newer),Array.from(old));
 }
 const scans=window.DokkanVerifySearch.metrics.scans;vm.runInContext('verifyResults()',context);assert.equal(window.DokkanVerifySearch.metrics.scans,scans);assert.equal(window.DokkanVerifySearch.metrics.builds,initial.builds);
 vm.runInContext('verifySelectPosition(verifyPending()[0].boxId)',context);
 // Fast typing runs only the final query and immediately removes stale results.
 const starting=window.DokkanVerifySearch.metrics.scans;
 vm.runInContext("verifySetQuery('ve');verifySetQuery('veg');verifySetQuery('vegeta')",context);assert.equal(document.querySelectorAll('#verifyResults input').length,0);
 await new Promise(r=>setTimeout(r,180));assert.equal(window.DokkanVerifySearch.metrics.scans,starting+1);assert.equal(document.querySelectorAll('#verifyResults input').length,12);
 assert.equal(document.querySelectorAll('#verifyResults img[loading="lazy"][decoding="async"]').length,12);document.querySelector('#verifySearchMore').click();assert.equal(document.querySelectorAll('#verifyResults input').length,24);
 const choice=document.querySelector('#verifyResults input');choice.checked=true;choice.dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(vm.runInContext('verifyDraft.cardId',context),choice.value);
 vm.runInContext("verifySetQuery('goku');verifySetQuery('')",context);await new Promise(r=>setTimeout(r,180));assert.equal(document.querySelectorAll('#verifyResults input').length,0);
 // The index must refresh after a new data load, retaining no stale candidates.
 await vm.runInContext('boot()',context);window.DokkanVerifySearch.prepare();assert(window.DokkanVerifySearch.metrics.builds>initial.builds);
 console.log('Indexed verification search: exact ranking equivalence, query reuse, rapid-input coalescing, no stale choices, 12/24 results, lazy async images, clear and data refresh: OK');console.log('Query timings ms:',JSON.stringify(times));
})().catch(e=>{console.error(e);process.exitCode=1});
