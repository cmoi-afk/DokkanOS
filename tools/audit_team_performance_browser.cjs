const fs=require('fs'),assert=require('node:assert/strict'),{chromium,webkit,devices}=require('playwright');
const {spawn}=require('node:child_process');
fs.mkdirSync('audit-artifacts',{recursive:true});
(async()=>{const reports=[];for(const scenario of [{name:'mobile-chromium',engine:chromium,settings:{viewport:{width:390,height:980}}},{name:'desktop-chromium',engine:chromium,settings:{viewport:{width:1280,height:980}}},{name:'iphone-12-webkit',engine:webkit,settings:devices['iPhone 12']}]){const browser=await scenario.engine.launch();let originServer;try{
 const ctx=await browser.newContext(scenario.settings),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 let base='http://127.0.0.1:8765';if(scenario.name==='iphone-12-webkit'){base='http://127.0.0.1:8787';originServer=spawn('python',['-m','http.server','8787','--bind','127.0.0.1'],{stdio:'ignore'});let ready=false;for(let i=0;i<50;i++){try{const r=await fetch(base);await r.body.cancel();ready=r.ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready,'Dedicated iPhone test origin must start');}
 await p.goto(base);await p.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#grid .unit'),null,{timeout:90000});
 await p.evaluate(async()=>{await ensureEvents();await teamBossReady;chooseTeamLeader('1034201');switchView('teams');teamSettings.searchMode='fast';renderTeam();});
 assert.equal(await p.locator('#teamCandidates .candidate-row').count(),0);
 await p.evaluate(()=>{window.__fluid={ticks:0,busyTicks:0,maxGapMs:0,last:performance.now()};window.__fluidTimer=setInterval(()=>{const f=window.__fluid,now=performance.now();f.ticks++;if(teamBusy){f.busyTicks++;f.maxGapMs=Math.max(f.maxGapMs,now-f.last);}f.last=now;},50);});
 const started=Date.now();await p.locator('#autoTeam').click();await p.waitForFunction(()=>!teamBusy&&selectedTeam.length===6,null,{timeout:120000});const firstMs=Date.now()-started;
 const heartbeat=await p.evaluate(()=>{clearInterval(window.__fluidTimer);return window.__fluid;});assert(heartbeat.busyTicks>2,'The UI heartbeat must keep running during search');
 assert.equal(await p.locator('.team-acquisition').count(),6);assert.equal(await p.locator('#teamCandidates .candidate-row').count(),0);
 await p.evaluate(()=>window.__perfWorker=teamWorker);await p.locator('#autoTeam').click();await p.waitForFunction(()=>!teamBusy,null,{timeout:120000});assert(await p.evaluate(()=>teamWorker===window.__perfWorker));
 const cacheStart=Date.now();await p.locator('#autoTeam').click();await p.waitForFunction(()=>!teamBusy,null,{timeout:120000});const cachedMs=Date.now()-cacheStart;assert((await p.locator('#teamBuildStatus').textContent()).includes('Résultat réutilisé'));
 await p.evaluate(()=>{const d=document.querySelector('[data-team-timing]');d.open=true;});await p.waitForFunction(()=>document.querySelector('[data-team-timing][data-ready]'));
 const inventory=await p.evaluate(()=>JSON.stringify(window.inventory||inventory));
 const original=await p.evaluate(()=>[...selectedTeam]),target=await p.locator('[data-team-replace]').first().getAttribute('data-team-replace'),slot=original.indexOf(target);
 const replacementStart=Date.now();await p.locator('[data-team-replace]').first().click();await p.waitForFunction(()=>!teamBusy,null,{timeout:120000});const replacementMs=Date.now()-replacementStart;
 const replaced=await p.evaluate(()=>[...selectedTeam]);assert.notEqual(replaced[slot],target);original.forEach((id,i)=>{if(i!==slot)assert.equal(replaced[i],id)});
 assert(await p.evaluate(()=>TE.constraints(teamCards(),teamMission(),teamFriend(resolveCard(teamLeader))).ok));assert.equal(await p.evaluate(()=>JSON.stringify(window.inventory||inventory)),inventory);
 await p.locator('[data-team-action="undo"]').click();assert.deepEqual(await p.evaluate(()=>[...selectedTeam]),original);
 console.log(JSON.stringify({profile:scenario.name,replacementMs,singleSlotReplacement:true,replacementUndo:true}));
 await p.locator('[data-team-unavailable]').nth(1).click();const recomposeStart=Date.now();await p.locator('#autoTeam').click();await p.waitForFunction(()=>!teamBusy&&selectedTeam.length===6,null,{timeout:120000});const recomposeMs=Date.now()-recomposeStart;assert(await p.evaluate(()=>!teamCards().some(c=>teamSettings.excluded.includes(TE.identity(c)))));
 await p.evaluate(()=>{teamSettings.searchMode='deep';renderTeam();});await p.locator('#autoTeam').click();await p.waitForFunction(()=>teamPreview&&document.querySelector('[data-team-action="keepPreview"]'),null,{timeout:120000});await p.locator('[data-team-action="keepPreview"]').click();assert(await p.evaluate(()=>!teamBusy&&selectedTeam.length===6));assert.equal(await p.evaluate(()=>JSON.stringify(window.inventory||inventory)),inventory);
 await p.locator('#teamName').fill('Fluide');await p.locator('[data-team-action="save"]').click();console.log(JSON.stringify({profile:scenario.name,firstMs,cachedMs,recomposeMs,heartbeat}));
 // Playwright #42775: WebKit's offline flag rejects even literal SW responses.
 // Stop this test's own origin instead; require a successful cached navigation.
 const offlineMethod=originServer?'origin-stopped':'browser-offline';
 if(originServer){assert(await p.evaluate(async()=>!!(await caches.match('./team-search.js'))));await new Promise(resolve=>{originServer.once('exit',resolve);originServer.kill('SIGTERM');});await assert.rejects(()=>fetch(base));}else await ctx.setOffline(true);
 await p.reload();
 await p.waitForFunction(()=>document.querySelector('#grid .unit'),null,{timeout:90000});await p.evaluate(async()=>{await ensureEvents();await teamBossReady;switchView('teams');});assert.equal(await p.locator('.team-acquisition').count(),6);assert.equal(await p.evaluate(()=>teamSettings.searchMode),'deep');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await p.evaluate(()=>document.querySelector('#teamComposition').scrollIntoView({behavior:'instant',block:'start'}));await p.screenshot({path:`audit-artifacts/team-performance-${scenario.name}.png`});assert.deepEqual(errors,[]);reports.push({profile:scenario.name,firstMs,cachedMs,recomposeMs,replacementMs,singleSlotReplacement:true,replacementUndo:true,heartbeat,persistentWorker:true,cached:true,offlineReload:true,offlineMethod});console.log(JSON.stringify(reports.at(-1)));await ctx.close();
 }finally{if(originServer?.exitCode===null)originServer.kill('SIGTERM');await browser.close();}}fs.writeFileSync('audit-artifacts/team-performance.json',JSON.stringify(reports,null,2));console.log('Performance mobile/desktop/iPhone WebKit: persistent worker, heartbeat, cache, lazy details, exclusions, keep preview, inventory unchanged, offline: OK');})().catch(e=>{console.error(e);process.exitCode=1});
