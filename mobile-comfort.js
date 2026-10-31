/* iPhone comfort preferences. No inventory, combat or mission records are changed. */
(function(){
 'use strict';
 const KEY='dokkanos-mobile-comfort-v1';
 let saved={};try{saved=JSON.parse(storageRead(KEY)||'{}')||{}}catch(e){}
 const prefs={theme:saved.theme==='light'?'light':'dark',text:saved.text==='large'?'large':'normal',density:saved.density==='compact'?'compact':'comfort',recent:Array.isArray(saved.recent)?saved.recent.filter(x=>typeof x==='string').slice(0,6):[],pins:Array.isArray(saved.pins)?saved.pins.filter(x=>typeof x==='string').slice(0,3):[]};
 const persist=()=>storageWrite(KEY,JSON.stringify(prefs));
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
 function apply(){const root=document.documentElement;root.dataset.theme=prefs.theme;root.dataset.text=prefs.text;root.dataset.density=prefs.density;const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=prefs.theme==='light'?'#edf4fb':'#0b1425';}
 apply();
 const trigger=make('button','mobile-comfort-trigger','⚙');trigger.id='mobileComfortTrigger';trigger.setAttribute('aria-label','Confort et apparence');document.querySelector('.brand').append(trigger);
 const dialog=make('dialog','mobile-comfort-dialog');dialog.setAttribute('aria-labelledby','mobileComfortTitle');
 dialog.innerHTML='<div class="mobile-comfort-heading"><h2 id="mobileComfortTitle">Confort et apparence</h2><button aria-label="Fermer les réglages">×</button></div><p>Ces réglages sont conservés sur cet appareil.</p><label>Ambiance<select data-comfort="theme"><option value="dark">Bleu nuit</option><option value="light">Capsule clair</option></select></label><label>Lecture<select data-comfort="text"><option value="normal">Texte standard</option><option value="large">Texte plus grand</option></select></label><label>Ma box<select data-comfort="density"><option value="comfort">Confort · grandes cartes</option><option value="compact">Compact · plus de cartes</option></select></label><p class="mobile-type-legend"><span data-type="AGI">AGI · bleu</span><span data-type="TEC">TEC · vert</span><span data-type="INT">INT · violet</span><span data-type="PUI">PUI · rouge</span><span data-type="END">END · jaune</span></p><button data-clear-recent>Effacer mes recherches récentes</button>';
 document.body.append(dialog);trigger.addEventListener('click',()=>{dialog.querySelectorAll('[data-comfort]').forEach(el=>el.value=prefs[el.dataset.comfort]);dialog.showModal();});
 dialog.querySelector('.mobile-comfort-heading button').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('change',e=>{const k=e.target.dataset.comfort;if(!k)return;prefs[k]=e.target.value;persist();apply();});
 dialog.addEventListener('close',()=>trigger.focus({preventScroll:true}));
 const recent=make('datalist');recent.id='mobileRecentSearches';document.body.append(recent);
 function updateRecent(){recent.replaceChildren(...prefs.recent.map(value=>{const o=make('option');o.value=value;return o;}));}
 updateRecent();dialog.querySelector('[data-clear-recent]').addEventListener('click',()=>{prefs.recent=[];persist();updateRecent();window.DokkanExperience?.notify('Recherches récentes effacées.');});
 let nameSource,nameCache=[];function suggestions(value){const source=typeof CATALOG!=='undefined'?CATALOG.cards:undefined;if(source!==nameSource){nameSource=source;nameCache=(source||[]).map(c=>typeof frCardName==='function'?frCardName(c.fr?.name||c.name||''):c.name||'');}const names=nameCache;const q=value.trim().toLocaleLowerCase('fr');const options=[...new Set([...prefs.recent,...(q.length>1?names.filter(n=>n.toLocaleLowerCase('fr').includes(q)).slice(0,6):[])])].slice(0,12);recent.replaceChildren(...options.map(value=>{const o=make('option');o.value=value;return o;}));}
 const searchIds=new Set(['uxBoxSearch','missingQuery','inventorySearch','globalSearchInput']);
 let recentTimer;
 document.addEventListener('input',e=>{if(!searchIds.has(e.target.id))return;const value=e.target.value.trim().slice(0,100);suggestions(value);clearTimeout(recentTimer);if(value.length>1)recentTimer=setTimeout(()=>{prefs.recent=[value,...prefs.recent.filter(x=>x!==value)].slice(0,6);persist();updateRecent();},900);});
 function pinEvent(id){if(prefs.pins.includes(id))prefs.pins=prefs.pins.filter(x=>x!==id);else if(prefs.pins.length<3)prefs.pins.push(id);else{window.DokkanExperience?.notify('Trois combats sont déjà épinglés. Retire une épingle pour en choisir un autre.');return;}persist();enhance();}
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-mobile-pin]');if(b)pinEvent(b.dataset.mobilePin);});
 function enhance(){
  for(const id of searchIds){const input=document.getElementById(id);if(input&&!input.hasAttribute('list')){input.setAttribute('list',recent.id);input.setAttribute('autocomplete','off');}}
  document.querySelectorAll('.view.on img').forEach(img=>{if(!img.hasAttribute('decoding'))img.decoding='async';if(!img.hasAttribute('loading'))img.loading='lazy';});
  const host=document.querySelector('#events main');
  if(host&&typeof teamEvents!=='undefined'){
   host.querySelectorAll('.event-card').forEach(card=>{const id=card.querySelector('[data-event-open]')?.dataset.eventOpen;if(!id)return;let b=card.querySelector('[data-mobile-pin]');if(!b){b=make('button','mobile-event-pin');b.dataset.mobilePin=id;card.querySelector('.event-card-top')?.append(b);}const active=prefs.pins.includes(id),label=active?'Désépingler':'Épingler';if(b.textContent!==label)b.textContent=label;b.setAttribute('aria-pressed',String(active));});
   let pins=host.querySelector('.mobile-pinned-events');const signature=JSON.stringify([prefs.pins,teamEvents.events.length]);
   if(!pins){pins=make('section','mobile-pinned-events');host.querySelector('.event-heading')?.after(pins);}
   if(pins.dataset.signature!==signature){pins.dataset.signature=signature;pins.replaceChildren(make('h3','','Mes combats prioritaires'));const rows=prefs.pins.map(id=>teamEvents.events.find(e=>e.id===id)).filter(Boolean);if(!rows.length)pins.append(make('p','muted','Épingle jusqu’à trois combats pour les retrouver ici.'));for(const event of rows){const row=make('div','mobile-pin-row'),open=make('button','',event.name),remove=make('button','','×');open.dataset.eventOpen=event.id;remove.dataset.mobilePin=event.id;remove.setAttribute('aria-label','Désépingler '+event.name);row.append(open,remove);pins.append(row);}}
  }
  const sheet=document.getElementById('sheet');if(sheet?.classList.contains('on')){
   sheet.querySelectorAll('#cardSheetContent > .detail-section').forEach(section=>{if(section.querySelector('details'))return;const heading=section.querySelector('h3');if(!heading||heading.textContent==='Aptitude leader')return;const fold=make('details','mobile-card-detail'),summary=make('summary','',heading.textContent);heading.remove();fold.append(summary);while(section.firstChild)fold.append(section.firstChild);section.append(fold);});
  }
  const tools=document.querySelector('#tools main');if(tools&&!tools.querySelector('[data-mobile-combat]')){const b=make('button','primary mobile-combat-link','Ouvrir le suivi de combat compact');b.dataset.mobileCombat='';b.addEventListener('click',()=>{switchView('copilot');window.DokkanCopilot?.open?.('combat');});tools.prepend(b);}
 }
 let pending=false;const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;enhance();});};
 const observer=new MutationObserver(schedule);document.querySelectorAll('.view,#sheet').forEach(root=>observer.observe(root,{childList:true,subtree:true}));
 window.addEventListener('dokkanos-view-change',schedule);window.addEventListener('dokkanos-sheet-render',schedule);window.DokkanMobileComfort={prefs,enhance};enhance();
})();
