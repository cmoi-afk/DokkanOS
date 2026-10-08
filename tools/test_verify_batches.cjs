const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));const saved=new Map();window.HTMLElement.prototype.scrollIntoView=function(){};const context={console,window,document,navigator:{onLine:true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path,'utf8'))}),alert:m=>{console.log('ALERT',m)},setTimeout,clearTimeout,Date,location:{reload(){}}};vm.createContext(context);
vm.runInContext(fs.readFileSync('team-engine.js','utf8'),context);vm.runInContext(fs.readFileSync('app.js','utf8').split('boot().catch(')[0],context);vm.runInContext(fs.readFileSync('event-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-search.js','utf8'),context);vm.runInContext(fs.readFileSync('teams.js','utf8'),context);vm.runInContext(fs.readFileSync('events.js','utf8'),context);vm.runInContext(fs.readFileSync('catalog-model.js','utf8'),context);vm.runInContext(fs.readFileSync('catalogue.js','utf8'),context);
context.requestAnimationFrame=fn=>setTimeout(fn,0);context.queueMicrotask=queueMicrotask;context.Event=window.Event;context.MutationObserver=class{observe(){}};window.scrollTo=()=>{};window.scrollY=0;vm.runInContext(fs.readFileSync('team-battle-model.js','utf8'),context);vm.runInContext(fs.readFileSync('team-battles.js','utf8'),context);

(async()=>{
 await vm.runInContext('boot()',context);vm.runInContext(fs.readFileSync('verify-batch.js','utf8'),context);
 vm.runInContext('switchView("verify")',context);document.querySelector('[data-vb-mode="batch"]').click();
 assert.equal(document.querySelectorAll('.vb-row').length,20);assert.equal(document.querySelectorAll('[data-vb-check]:checked').length,0);assert(document.querySelector('#verifyBatchConfirm').disabled);
 const initial=vm.runInContext('verifyPending().length',context),state=window.DokkanVerifyBatch.state;
 const picks=state.ids.filter(id=>state.choices.has(id)).slice(0,3);assert.equal(picks.length,3);
 const originals=JSON.parse(vm.runInContext(`JSON.stringify(DB.cards.filter(c=>${JSON.stringify(picks)}.includes(c.boxId)))`,context));
 for(const id of picks){const input=document.querySelector('[data-vb-check="'+id+'"]');input.checked=true;input.dispatchEvent(new window.Event('change',{bubbles:true}));}
 document.querySelector('#verifyBatchConfirm').click();assert.equal(vm.runInContext('verifyPending().length',context),initial-3);assert(window.DokkanVerifyBatch.canUndo());
 await vm.runInContext('boot()',context);assert.equal(vm.runInContext('verifyPending().length',context),initial-3);
 document.querySelector('#verifyBatchUndo').click();assert.equal(vm.runInContext('verifyPending().length',context),initial);assert.equal(saved.has('dokkanos-edits'),false);
 for(const c of originals)assert.equal(vm.runInContext(`resolveCard(${JSON.stringify(c.boxId)}).candidateId`,context),c.candidateId);
 // Alternative resets an earlier check, preventing accidental confirmation of a changed candidate.
 let other=document.querySelector('.vb-alternatives [data-vb-choice]');const id=other.dataset.vbBox;state.checked.add(id);other.click();assert(!state.checked.has(id));
 const first=state.ids[0];document.querySelector('[data-vb-edit="'+first+'"]').click();assert(document.querySelector('.vb-quick'));const quick=document.querySelector('.vb-quick [data-vb-choice]');assert(quick);quick.click();assert(!document.querySelector('#verifyConfirm').disabled);document.querySelector('#verifyConfirm').click();assert.equal(vm.runInContext('verifyPending().length',context),initial-1);assert(document.querySelector('.vb-panel'));
 // Failure to persist must leave every card pending, including the prior metadata.
 const failId=state.ids.find(id=>state.choices.has(id)),before=vm.runInContext('verifyPending().length',context),write=context.localStorage.setItem;
 state.checked.add(failId);context.localStorage.setItem=()=>{throw Error('quota')};window.DokkanVerifyBatch.commit();assert.equal(vm.runInContext('verifyPending().length',context),before);context.localStorage.setItem=write;
 // A later user edit makes an old batch undo unavailable, preventing loss of new work.
 window.DokkanVerifyBatch.commit();assert(window.DokkanVerifyBatch.canUndo());saved.set('dokkanos-edits','[]');assert(!window.DokkanVerifyBatch.canUndo());
 const oldIds=[...state.ids];document.querySelector('[data-vb-next]').click();assert(!state.ids.some(id=>oldIds.includes(id)));assert(vm.runInContext('verifyPending().length',context)>0);
 document.querySelector('[data-vb-reset]').click();assert.equal(state.deferred.size,0);
 document.querySelector('[data-vb-mode="single"]').click();assert(document.querySelector('[data-vb-mode="batch"]'));
 console.log('Batch verification: explicit checks, partial lot, saved reload, exact undo, alternatives reset checks, quick correction, storage failure rollback, stale undo protection and deferral: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
