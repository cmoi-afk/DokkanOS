/* Browse acquisition paths and turn a known training rate into a copy budget. */
(function(){
'use strict';
const M=window.DokkanF2PModel,esc=teamEsc;
let bank,data,load,query='',type='',kind='',openOnly=false,limit=30,selected='',target='',methodIndex=0,targetFilter='',targetLimit=12;
let current=1,goal=10,manualRate='',ownedOnly=false,graph,graphSource,cacheSource,cacheMeta;
const resolved=new Map();
const host=()=>document.querySelector('#f2pCatalogue');
const searchable=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const checked=x=>x?' checked':'';
const renderIfOpen=()=>{if(host())render();};
function ensure(){
 if(load)return load;
 load=window.DokkanSAFarm.ensure().then(()=>{
  data=window.DokkanSAFarm.data;
  if(data)bank=M.index(data,(CATALOG.cards||[]).map(c=>({id:c.id,name:META.cards[c.id]?.name||c.fr?.name||c.name})));
  renderIfOpen();
 });
 return load;
}
function card(id){
 if(cacheSource!==CATALOG.cards||cacheMeta!==META.cards){resolved.clear();cacheSource=CATALOG.cards;cacheMeta=META.cards;}
 if(!resolved.has(id))resolved.set(id,verifyCandidate(id)||null);
 return resolved.get(id);
}
function eventStatus(location){
 if(!location.event)return '';
 const event=teamEvents.events.find(e=>e.id===location.event);
 if(!event)return 'Disponibilité à vérifier';
 const status=window.DokkanEventModel.status(event);
 return ({active:'En jeu',permanent:'Permanent',closed:'Fermé',upcoming:'À venir',unknown:'Disponibilité à vérifier'})[status];
}
function locations(row){
 return (row.locations||[]).map(l=>{
  const label=l.name||'Consulter la source';
  const event=l.event?'<button data-sa-event="'+esc(l.event)+'">Ouvrir l’événement</button>':'';
  const source=/^https:\/\/(?:www\.)?dbz-dokkanbattle\.com\//.test(l.source||'')
   ?'<a href="'+esc(l.source)+'" target="_blank" rel="noopener">'+(event?'Source':'Voir la source')+'</a>':'';
  return '<li><b>'+esc(label)+'</b>'+ (l.price?' · '+esc(l.price):'')+
   (l.event?' <small>'+eventStatus(l)+'</small>':'')+'<div class="f2p-actions">'+event+source+'</div></li>';
 }).join('');
}
function compatible(id){
 const linked=bank.methodsByCard.get(id)||[];
 return linked.some(e=>e.method.donor===id)?linked:[{name:data.cards?.[id]||bank.cards.get(id)?.name,reference:id,method:{donor:id}},...linked];
}
function targetIds(entries,id){
 const ids=new Set([id]);
 for(const entry of entries)for(const t of bank.targetsByName.get(entry.name)||[])ids.add(t);
 const owned=ownedOnly?ownedIds():null;
 return [...ids].filter(t=>!owned||owned.has(t));
}
function currentMax(c){
 if(!c)return 30;
 const profile=window.DokkanProgress?.state.profiles[String(c.id)];
 const kit=window.DokkanCatalogModel.selectKit(c,profile?.awakening);
 return Number.isInteger(kit?.maxSALevel)?kit.maxSALevel:30;
}
function resetGoal(id){
 const c=card(id),max=currentMax(c);
 const actual=window.DokkanProgress?.state.profiles[String(id)]?.sa;
 goal=max===30&&!Number.isInteger(c?.maxSALevel)?(c?.rarity==='LR'?20:10):max;
 current=Math.max(1,Math.min(goal,Number(actual)||1));
 manualRate='';
}
function awakeningForms(id){
 if(graphSource!==CATALOG.cards){
  graphSource=CATALOG.cards;
  graph=window.DokkanCatalogModel.awakeningGraph(window.DokkanCatalogUI.currentCards());
 }
 const descendants=graph?.descendants(id)||[];
 const verifiedDonors=(bank.methodsByCard.get(id)||[]).filter(e=>e.method.donor!==id&&e.method.origins?.some(o=>o.id===id)).map(e=>e.method.donor);
 return [...new Set([...descendants,...verifiedDonors])].map(card).filter(Boolean);
}
function budget(){
 const root=document.getElementById('f2pBudget');if(!root||!selected||!target)return;
 const methods=compatible(selected).filter(e=>e.method.donor===target||(bank.targetsByName.get(e.name)||[]).includes(target));
 const method=methods[methodIndex]||methods[0];
 const documented=method?M.rate(target,method):null;
 const chance=manualRate!==''?Number(manualRate):documented;
 const max=currentMax(card(target));
 const valid=Number.isInteger(current)&&Number.isInteger(goal)&&current>=1&&goal>=current&&goal<=max;
 const estimate=valid?M.copies(current,goal,chance):null;
 if(estimate?.count===0){root.textContent='Aucun exemplaire nécessaire : le niveau visé est déjà atteint.';return;}
 root.innerHTML=estimate?`<b>${estimate.count} exemplaire${estimate.count===1?'':'s'} ${estimate.guaranteed?'':'en moyenne'}</b><span> · ${chance} % par copie SP 1</span>`:
  valid?'<span>Saisis le taux affiché en jeu pour estimer les copies.</span>':'<span>Choisis deux niveaux de SP valides pour cette forme.</span>';
}
function detail(id){
 const row=bank.cards.get(id),entry=card(id),entries=compatible(id),ids=targetIds(entries,id);
 if(!ids.includes(target)){target=ids[0]||'';methodIndex=0;resetGoal(target);}
 const methods=entries.filter(e=>e.method.donor===target||(bank.targetsByName.get(e.name)||[]).includes(target));
 const method=methods[methodIndex]||methods[0],documented=method?M.rate(target,method):null,max=currentMax(card(target));
 const forms=awakeningForms(id);
 return `<section class="f2p-detail"><h3>${esc(entry?.name||row.name)} ${esc(entry?.type||row.type||'')}</h3>
 <div class="f2p-actions">${entry?`<button data-f2p-card="${esc(id)}">Voir la fiche</button>`:`<a href="https://www.dbz-dokkanbattle.com/card/${esc(id)}" target="_blank" rel="noopener">Fiche source</a>`}<button data-f2p-close>Fermer</button></div>
 <h4>Où l’obtenir</h4><ul>${locations(row)||'<li>Source d’obtention à préciser.</li>'}</ul>
 ${forms.length?`<details><summary>Formes éveillées</summary><div class="f2p-actions">${forms.map(c=>`<button data-f2p-card="${esc(c.id)}">${esc(c.rarity)} · ${esc(c.name)}</button>`).join('')}</div></details>`:''}
 <h4>Quelles cartes peut-elle entraîner ?</h4>
 <label class="team-checkbox"><input type="checkbox" id="f2pOwned"${checked(ownedOnly)}> Seulement mes cartes confirmées</label>
 ${ids.length?`<div class="f2p-grid" role="group" aria-label="Cartes compatibles">${(target&&!ids.slice(0,targetLimit).includes(target)?[target,...ids.slice(0,targetLimit)]:ids.slice(0,targetLimit)).map(t=>{
  const c=card(t),label=c?.name||bank.cards.get(t)?.name||t;
  return `<button class="f2p-card" data-f2p-target="${esc(t)}" aria-pressed="${t===target}">${c?teamImage(c):''}<b>${esc(label)}</b><small>${esc([c?.rarity,c?.type,c?.title,t].filter(Boolean).join(' · '))}</small></button>`;
 }).join('')}</div>
 ${ids.length>targetLimit?'<button data-f2p-more-targets>Afficher plus de cartes compatibles</button>':''}
 <h4 id="f2pTraining" tabindex="-1">Entraîner ${esc(card(target)?.name||bank.cards.get(target)?.name||target)} · ${esc(card(target)?.type||'')} ${esc(card(target)?.rarity||'')}</h4>
<div class="f2p-actions">${card(target)?`<button data-f2p-card="${esc(target)}">Voir la carte cible</button>`:`<a href="https://www.dbz-dokkanbattle.com/card/${esc(target)}" target="_blank" rel="noopener">Fiche source de la cible</a>`}</div>
 ${methods.length?`<label>Forme donnée en entraînement<select id="f2pMethod">${methods.map((e,i)=>teamOption(i,[e.method.rarity,e.method.type,e.method.name,e.method.donor,e.method.donor!==id?'éveil requis':''].filter(Boolean).join(' · '),methodIndex)).join('')}</select></label>`:''}
 <p>${documented===null?'Taux à vérifier pour cette forme cible.':'Taux indiqué pour cette paire : '+documented+' %.'}</p>
 <div class="f2p-calculator"><label>SP actuelle<input id="f2pCurrent" type="number" min="1" max="${max}" value="${current}"></label>
 <label>SP visée<input id="f2pGoal" type="number" min="1" max="${max}" value="${goal}"></label>
 <label>Taux en jeu (%)<input id="f2pRate" type="number" min="1" max="100" placeholder="${documented??'À vérifier'}" value="${esc(manualRate)}"></label></div>
 <p id="f2pBudget" role="status"></p><small>Une copie SP 1 par essai. En dessous de 100 %, le nombre réel peut varier. Vérifie le taux dans l’écran d’entraînement.</small>`:'<p>Aucune cible confirmée avec ce filtre.</p>'}</section>`;
}
function matching(){
 const q=searchable(query);
 return [...bank.cards.values()].filter(r=>{
  const c=card(r.id);
  const supportsTarget=!targetFilter||r.id===targetFilter||compatible(r.id).some(e=>e.method.donor===targetFilter||(bank.targetsByName.get(e.name)||[]).includes(targetFilter));
  return supportsTarget&&(!type||(c?.type||r.type)===type)&&(!kind||r.acquisition===kind||r.locations?.some(l=>l.acquisition===kind))&&
   (!openOnly||r.locations?.some(l=>['En jeu','Permanent'].includes(eventStatus(l))))&&
   (!q||searchable([r.name,c?.title,r.id,...(r.locations||[]).map(l=>l.name)].join(' ')).includes(q));
 }).sort((a,b)=>a.name.localeCompare(b.name,'fr')||a.id.localeCompare(b.id));
}
function list(){
 const root=host()?.querySelector('#f2pList');if(!root||!bank)return;
 const rows=matching();
 root.innerHTML=`<p class="muted">${rows.length} carte(s) · ${bank.cards.size} sources d’obtention recensées</p>
 <div class="f2p-grid">${rows.slice(0,limit).map(r=>{
  const c=card(r.id);
  return `<button class="f2p-card" data-f2p-select="${esc(r.id)}" aria-pressed="${r.id===selected}">${c?teamImage(c):''}<b>${esc(r.name)}</b><small>${esc([c?.rarity||r.rarity,c?.type||r.type,r.locations?.[0]?.name].filter(Boolean).join(' · '))}</small></button>`;
 }).join('')}</div>${rows.length>limit?'<button data-f2p-more>Afficher la suite</button>':''}`;
}
function render(){
 const root=host();if(!root)return;
 if(!bank){root.innerHTML=load?'<p>Chargement des cartes F2P…</p>':'<p>Chargement…</p>';if(!load)ensure();else if(data===null)root.innerHTML='<p>Les données F2P sont indisponibles. Rouvre l’app avec une connexion.</p>';return;}
 root.innerHTML=`<h2>Cartes F2P et farming SP</h2><p>Choisis une carte gratuite pour voir où l’obtenir et à qui la donner.</p>
 ${targetFilter?`<p><b>Cible · ${esc(card(targetFilter)?.name||targetFilter)}</b> <button data-f2p-clear-target>Voir toutes les cartes F2P</button></p>`:''}
 <div class="f2p-filters"><label>Rechercher<input id="f2pSearch" type="search" placeholder="Carte, événement, ID…" value="${esc(query)}"></label>
 <label>Type<select id="f2pType">${['','AGI','TEC','INT','PUI','END'].map(t=>teamOption(t,t||'Tous',type)).join('')}</select></label>
 <label>Obtention<select id="f2pKind">${[['','Toutes'],['event','Événement'],['exchange','Échange']].map(([v,l])=>teamOption(v,l,kind)).join('')}</select></label>
 <label class="team-checkbox"><input id="f2pOpen" type="checkbox"${checked(openOnly)}> Événements en jeu</label></div>
 <div id="f2pDetails">${selected?detail(selected):''}</div><div id="f2pList"></div>
 <p class="muted">Version Global · collecte du ${esc(eventDate(data.acquisitionVerifiedAt||data.verifiedAt,'day'))}. Les formes éveillées apparaissent dans la fiche de la carte d’origine. <a href="https://www.dbz-dokkanbattle.com/card-drops" target="_blank" rel="noopener">Source des cartes gratuites</a></p>`;
 list();budget();
}
function drawDetail(){
 const panel=document.getElementById('f2pDetails');if(!panel)return;
 panel.innerHTML=selected?detail(selected):'';budget();
}
document.addEventListener('input',e=>{
 const id=e.target.id;
 if(id==='f2pSearch'){query=e.target.value;limit=30;list();}
 if(id==='f2pCurrent'){current=Number(e.target.value);budget();}
 if(id==='f2pGoal'){goal=Number(e.target.value);budget();}
 if(id==='f2pRate'){manualRate=e.target.value;budget();}
});
document.addEventListener('change',e=>{
 const id=e.target.id;
 if(id==='f2pType'||id==='f2pKind'||id==='f2pOpen'){
  if(id==='f2pType')type=e.target.value;
  if(id==='f2pKind')kind=e.target.value;
  if(id==='f2pOpen'){openOnly=e.target.checked;if(openOnly)ensureEvents();}
  limit=30;list();
 }
 if(id==='f2pOwned'){ownedOnly=e.target.checked;drawDetail();}
 
 if(id==='f2pMethod'){methodIndex=Number(e.target.value);manualRate='';drawDetail();}
});
document.addEventListener('click',e=>{
 const d=e.target.closest?.('button')?.dataset;if(!d)return;
 if(d.f2pTarget){target=d.f2pTarget;methodIndex=0;resetGoal(target);drawDetail();document.getElementById('f2pTraining')?.focus();}
 if(d.f2pMoreTargets!==undefined){targetLimit+=12;drawDetail();}
 if(d.f2pSelect){targetLimit=12;selected=d.f2pSelect;target=targetFilter;methodIndex=0;resetGoal(target);ownedOnly=false;drawDetail();list();document.getElementById('f2pDetails')?.scrollIntoView({block:'start'});ensureEvents();}
 if(d.f2pClearTarget!==undefined){targetFilter='';selected='';render();}
 if(d.f2pClose!==undefined){selected='';drawDetail();list();}
 if(d.f2pMore!==undefined){limit+=30;list();}
 if(d.f2pCard)openCard('CATALOG-'+d.f2pCard);
});
window.addEventListener('dokkanos-events-loaded',()=>{if(host()){list();drawDetail();}});
window.DokkanF2P={render,focusTarget(id){targetFilter=String(id||'');selected='';target='';query='';type='';kind='';openOnly=false;limit=30;},html(){queueMicrotask(renderIfOpen);return '<div id="f2pCatalogue"><p>Chargement des cartes F2P…</p></div>';}};
})();
