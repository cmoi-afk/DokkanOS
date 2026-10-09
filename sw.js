const VERSION='2.6.1-final-awakening-teams';
const CACHE='dokkanos-v'+VERSION;
const CORE=['./','./index.html','./style.css','./interface.css','./interface.js','./experience.js','./teams-ui.js','./teams-ui.css','./verify-search.js','./verify-search.css','./verify-batch.js','./verify-batch.css','./companion-model.js','./companion.js','./progress-model.js','./progression.js','./sync.js','./data-download.js','./data-download.json','./game-items.json','./progress-data.json','./boss-profiles.json','./copilot-model.js','./copilot.js','./copilot-worker.js','./visual-index.json','./events-preview.json','./app.js','./team-engine.js','./team-search.js','./teams.js','./team-battle-model.js','./team-battles.js','./event-model.js','./events.js','./team-worker.js','./recent-cards.json','./catalog-model.js','./catalogue.js','./sa-farm.js','./sa-farm.json','./catalogue-report.json','./events.json','./data.json','./collection.json','./overlap-map.json','./overlap-conflicts.json','./card-meta.json','./catalog.json','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dokkanos-v')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url),scope=new URL(self.registration.scope);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const bulk=/\.(?:json|webp|png|jpg|jpeg)$/.test(url.pathname)&&!url.pathname.includes('/assets/icon-');if(bulk&&!['reload','no-store'].includes(e.request.cache)){const hit=await cache.match(e.request)||await cache.match(e.request,{ignoreSearch:true});if(hit)return hit;}
  try{const res=await fetch(e.request);if(res.ok)try{await cache.put(e.request,res.clone())}catch(cacheError){}return res}
  catch(error){
   const hit=await cache.match(e.request)||await cache.match(e.request,{ignoreSearch:true});
   if(hit)return hit;
   if(e.request.mode==='navigate')return await cache.match('./index.html')||Response.error();
   return Response.error();
  }
 })());
});
