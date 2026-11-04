const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.DOKKAN_TEST_URL||'http://127.0.0.1:8733/';
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.locator('.session-home h1').waitFor({timeout:30000});
 await page.waitForFunction(()=>CATALOG.cards.length>100);
 assert.equal(await page.locator('.session-actions button').count(),3);
 await page.getByRole('button',{name:'Réussir une mission',exact:false}).first().click();
 await page.locator('.event-quick-filters').waitFor();
 await page.getByRole('button',{name:'Ferme sous 7 jours'}).click();
 assert.equal(await page.getByRole('button',{name:'Ferme sous 7 jours'}).getAttribute('aria-pressed'),'true');
 await page.locator('nav [data-v="box"]').first().click();
 await page.locator('[data-mc-tab="prepare"]').click();
 await page.locator('[data-mc-group="sp"]').click();
 assert.equal(await page.locator('[data-mc-group="sp"]').getAttribute('aria-pressed'),'true');
 await page.locator('#openGlobalSearch').click();
 await page.locator('#globalSearchInput').fill('goku');
 await page.locator('[data-c-more-search]').click();
 assert(await page.locator('.global-result').count()>6);
 await page.locator('#closeGlobalSearch').click();
 await page.evaluate(()=>window.DokkanCopilot.open('farm','1034201'));
 await page.locator('[data-farm-queue-add]').click();
 await page.getByRole('heading',{name:'Mon carnet de farming'}).waitFor();
 assert.equal(await page.locator('[data-farm-queue-open="1034201"]').count(),1);
 await page.evaluate(()=>{
   teamSettings.pool='catalog';teamSettings.friend='mirror';
   teamLeader='CATALOG-1034201';selectedTeam=[teamLeader];saveTeamState();
   window.DokkanCopilot.open('combat');
 });
 await page.locator('[data-fight-sp="normal"][data-slot="0"][data-delta="1"]').click();
 await page.locator('[data-fight-sp="ultimate"][data-slot="1"][data-delta="1"]').click();
 await page.locator('[data-progress-undo]').click();
 const combat=await page.evaluate(()=>window.DokkanProgress.state.combat);
 assert.equal(combat.sp.slot0.normal,1);
 assert.equal(combat.sp.slot1,undefined);
 page.once('dialog',d=>d.accept());
 await page.locator('[data-progress-reset]').click();
 await page.locator('.combat-archive').first().locator('summary').click();
 await page.locator('[data-progress-resume]').click();
 assert.equal(await page.evaluate(()=>window.DokkanProgress.state.combat.sp.slot0.normal),1);
 await page.evaluate(()=>window.DokkanTeamLocker.showEditor());
 await page.evaluate(()=>{switchView('teams');renderTeam();});
 await page.locator('[data-locker="friend"]').click();
 await page.locator('#teamFriendSearch').fill('1034151');
 await page.locator('[data-team-friend="1034151"]').click();
 assert.equal(await page.evaluate(()=>teamSettings.friend),'1034151');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.evaluate(()=>{switchView('home');document.querySelector('#home [data-c-tool=backup]').click();});
 const roundtrip=await page.evaluate(()=>{
  const m=window.DokkanCompanionModel,backup=m.backup(localStorage);
  const parsed=m.parseBackup(JSON.stringify(backup));
  return JSON.stringify(parsed.entries)===JSON.stringify(backup.entries);
 });
 assert(roundtrip);
 await page.evaluate(()=>document.querySelector('[data-c-tool=freshness]').click());
 await page.locator('[data-release-check]').click();
 await page.getByText('Tu as la dernière version.').waitFor();
 assert.deepEqual(errors,[]);
 if(!process.env.DOKKAN_TEST_URL){
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:30000});
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.session-home h1').waitFor();
  assert.equal(await page.evaluate(()=>storedJSON('dokkanos-copilot-v1',{}).farmQueue['1034201']),'base');
 }
 console.log('390 px: home, events, preparation, paged search, farming, combat archive/undo, friend, backup, release'+(!process.env.DOKKAN_TEST_URL?', offline reload':'')+' OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
