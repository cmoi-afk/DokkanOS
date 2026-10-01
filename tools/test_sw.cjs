const fs=require('fs'),vm=require('vm'),assert=require('assert');
const handlers={},deleted=[],entries=new Map(),hits=[];
const current='dokkanos-v'+fs.readFileSync('sw.js','utf8').match(/const VERSION='([^']+)'/)[1];
const scope='https://example.org/DokkanOS/';
const cache={addAll:async paths=>{for(const p of paths)entries.set(new URL(p,scope).href,{body:p});},put:async()=>{},match:async(req,options)=>{const u=new URL(typeof req==='string'?req:req.url,scope);if(options?.ignoreSearch)u.search='';hits.push(u.href);return entries.get(u.href);}};
const context={URL,Response:{error:()=>({error:true})},fetch:async()=>{throw Error('offline')},caches:{open:async()=>cache,keys:async()=>['dokkanos-vold','other-app-v1',current],delete:async k=>deleted.push(k)},self:{registration:{scope},skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(k,fn)=>handlers[k]=fn}};
vm.runInNewContext(fs.readFileSync('sw.js','utf8'),context);
(async()=>{let pending;handlers.install({waitUntil:p=>pending=p});await pending;handlers.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['dokkanos-vold']);
for(const name of ['app.js','teams.js','team-engine.js','style.css','interface.css','interface.js','companion.js','companion-model.js','manifest.webmanifest','team-worker.js','recent-cards.json','catalog-model.js','catalogue.js','catalogue-report.json']){handlers.fetch({request:{method:'GET',url:scope+name+'?v=1210',mode:'cors'},respondWith:p=>pending=p});assert.equal((await pending).body,'./'+name);}
handlers.fetch({request:{method:'GET',url:scope+'nested-route',mode:'navigate'},respondWith:p=>pending=p});assert.equal((await pending).body,'./index.html');
handlers.fetch({request:{method:'GET',url:scope+'missing.webp',mode:'cors'},respondWith:p=>pending=p});assert.equal((await pending).error,true);
let intercepted=false;for(const url of ['https://images.example.org/card.png','https://example.org/other-app/app.js'])handlers.fetch({request:{method:'GET',url},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
context.fetch=async()=>({ok:false,status:404});handlers.fetch({request:{method:'GET',url:scope+'app.js',mode:'cors'},respondWith:p=>pending=p});assert.equal((await pending).status,404);
console.log('PWA: offline versioned core, navigation fallback, missing resource, cache isolation and HTTP errors: OK');})().catch(e=>{console.error(e);process.exitCode=1});
