/* The Box tab becomes a preparation space. Legacy capture controls remain internal. */
(function(){'use strict';
const M=window.DokkanMyCollectionModel,esc=teamEsc,box=document.getElementById('box');
let preparationGroup='';
let prefs;try{prefs=M.validate(storedJSON(M.key,{tab:'cards',sort:'name',status:'all'}));}catch(e){prefs={tab:'cards',sort:'name',status:'all'};}
let limit=72,scheduled=false,lastSignature='',allRows=[],cacheKey='',cacheCards,cacheMeta,cacheRows;
const legacy=document.createElement('div');legacy.className='mc-legacy';legacy.hidden=true;while(box.firstChild)legacy.append(box.firstChild);box.append(legacy);
const main=document.createElement('main');main.className='my-collection';main.innerHTML='<header class="mc-heading"><span class="eyebrow">TES CARTES · TES PRIORITÉS</span><h1>Ma collection</h1><p>Organise les cartes que tu possèdes et prépare tes prochaines équipes.</p></header><div id="mcSummary" class="mc-summary"></div><div class="mc-tabs" role="group" aria-label="Rubriques de ma collection"><button data-mc-tab="cards">Mes cartes</button><button data-mc-tab="prepare">À préparer</button><button data-mc-tab="favorites">Favoris</button></div><div class="mc-controls"><label class="mc-search">Rechercher dans mes cartes<input id="mcSearch" type="search" placeholder="Nom, catégorie, lien ou ID…"></label><label>Type<select id="mcType"><option value="">Tous</option>'+['AGI','TEC','INT','PUI','END'].map(x=>'<option>'+x+'</option>').join('')+'</select></label><label>Rareté<select id="mcRarity"><option value="">Toutes</option><option>LR</option><option>UR</option><option>SSR</option></select></label><label>Trier<select id="mcSort"><option value="name">Nom A → Z</option><option value="recent">Confirmations récentes</option><option value="rarity">Rareté</option><option value="priority">Priorités</option></select></label><label id="mcStatusLabel" hidden>Préparation<select id="mcStatus"><option value="all">Tout</option><option value="todo">À faire · données connues</option><option value="unknown">À renseigner</option></select></label><button data-mc-reset>Effacer les filtres</button></div><div id="mcGroups" class="mc-tabs" role="group" aria-label="Objectifs de préparation" hidden><button data-mc-group="">Tous</button><button data-mc-group="awakening">Éveils</button><button data-mc-group="sp">SP</button><button data-mc-group="potential">Potentiel</button><button data-mc-group="ready">Prêtes</button></div><p class="mc-explanation"></p><details id="mcRecent" class="mc-recent"><summary>Dernières confirmations</summary><div></div></details><p id="mcCount" role="status"></p><div id="mcResults"><p class="muted">Chargement des cartes confirmées…</p></div><button id="mcMore" hidden>Afficher la suite</button><div class="mc-footer"><button data-c-tool="f2p">Cartes F2P et farming SP</button><button data-open-view="catalog">Déclarer une carte dans le catalogue</button><button data-open-view="verify">Identifier mes captures</button><button data-ct-open="audit">Contrôler ma collection</button></div>';box.append(main);
const controls=main.querySelector('.mc-controls');
const searchRow=document.createElement('div');
searchRow.className='mc-search-row';
searchRow.append(controls.querySelector('.mc-search'));
searchRow.insertAdjacentHTML('beforeend','<button type="button" id="mcFiltersButton" aria-haspopup="dialog">Filtres</button>');
controls.before(searchRow);
const filterDialog=document.createElement('dialog');
filterDialog.className='mc-filters-dialog';
filterDialog.setAttribute('aria-labelledby','mcFiltersTitle');
filterDialog.innerHTML='<h2 id="mcFiltersTitle">Filtres de la collection</h2>';
filterDialog.append(controls);
filterDialog.insertAdjacentHTML('beforeend','<form method="dialog"><button class="primary">Voir les cartes</button></form>');
searchRow.after(filterDialog);
const filterButton=document.getElementById('mcFiltersButton');
filterButton.addEventListener('click',()=>filterDialog.showModal());
const stats=document.createElement('details');
stats.className='mc-stats';
stats.innerHTML='<summary>Résumé et dernières confirmations</summary>';
stats.append(main.querySelector('#mcSummary'),main.querySelector('#mcRecent'));
main.querySelector('.mc-footer').before(stats);
document.querySelector('.nav-primary [data-v="box"] > span').textContent='Ma collection';
const save=()=>storageWrite(M.key,JSON.stringify(prefs));
function favoriteId(ref){const c=DB.cards.find(c=>c.boxId===ref);return String(c?.candidateId||String(ref).replace(/^(MANUAL-|CATALOG-)/,''));}
function proofProfiles(){const raw=window.DokkanProgress?.state.profiles||storedJSON('dokkanos-progression-v1',{}).profiles||{},copy={...raw};for(const id of rainbow100){if(raw[id]?.potential==null)copy[id]={...(raw[id]||{}),potential:100};}return copy;}
function gather(){const used=new Set([...(typeof teamCards==='function'?teamCards():[]).map(c=>String(c.candidateId||c.id)),...teamSaved().flatMap(s=>s.cards||[]).map(ref=>resolveCard(ref)).filter(Boolean).map(c=>String(c.candidateId||c.id))]),fav=new Set([...favorites].map(favoriteId)),history=window.DokkanCollectionTools?.prefs.history||storedJSON('dokkanos-collection-tools-v1',{}).history||[];const owned=ownedIds(),profiles=proofProfiles(),dates=M.recentDates(history),key=JSON.stringify([[...owned].sort(),profiles,[...fav].sort(),[...used].sort(),dates]);if(cacheRows&&cacheKey===key&&cacheCards===CATALOG.cards&&cacheMeta===META.cards)return cacheRows;cacheKey=key;cacheCards=CATALOG.cards;cacheMeta=META.cards;return cacheRows=M.build(window.DokkanCatalogUI.currentCards(),owned,profiles,fav,used,dates);}
let savedTeamsByCard=new Map();
function indexSavedTeams(){
 savedTeamsByCard=new Map();
 for(const team of teamSaved()){
  const ids=new Set(team.cards.map(ref=>resolveCard(ref)).filter(Boolean).map(c=>String(c.candidateId||c.id)));
  for(const id of ids){
   const list=savedTeamsByCard.get(id)||[];
   list.push(team);
   savedTeamsByCard.set(id,list);
  }
 }
}
function linkedTeams(id){
 const teams=savedTeamsByCard.get(id)||[];
 if(!teams.length)return '';
 return '<details class="mc-linked-teams"><summary>Dans '+teams.length+' équipe'+(teams.length>1?'s':'')+'</summary>'+
  teams.map(team=>'<button data-c-load-team="'+esc(team.id)+'">'+esc(team.name)+'</button>').join('')+'</details>';
}
function card(row){const c={...row.card,candidateId:row.id},favorite='<button class="mc-favorite" data-mc-favorite="'+esc(row.id)+'" aria-pressed="'+row.favorite+'" aria-label="'+(row.favorite?'Retirer des favoris':'Ajouter aux favoris')+' : '+esc(c.name)+'">'+(row.favorite?'★':'☆')+'</button>',open='<button class="mc-open" data-mc-card="'+esc(row.id)+'">'+teamImage(c)+'<strong>'+esc(c.name)+'</strong><small>'+esc(c.rarity)+' · '+esc(c.type)+' · '+esc(row.id)+'</small></button>';
 if(prefs.tab==='prepare')return '<article class="mc-preparation" data-type="'+esc(c.type)+'">'+open+'<div class="mc-preparation-info">'+(row.used?'<span class="mc-used">Utilisée dans tes équipes</span>':'')+'<div class="mc-preparation-badges">'+(row.todo?'<span class="mc-todo">À faire</span>':'')+(row.unknown?'<span class="mc-unknown">À renseigner</span>':'')+'</div><ul>'+row.tasks.map(t=>'<li><span>'+esc(t.kind==='unknown'?'À renseigner':'À faire')+'</span> '+esc(t.label)+(t.target?' <button data-mc-card="'+esc(t.target)+'">Voir cette forme</button> <button data-mc-farm="'+esc(row.id)+'">Médailles</button>':'')+'</li>').join('')+'</ul><button class="primary" data-mc-profile="'+esc(row.id)+'">Renseigner ma carte en jeu</button></div>'+favorite+'</article>';
 return '<article class="mc-card" data-type="'+esc(c.type)+'">'+favorite+open+linkedTeams(row.id)+'<button class="mc-profile" data-mc-profile="'+esc(row.id)+'">'+(row.unknown?'Renseigner':row.todo?'Préparer':'Voir mon profil')+'</button></article>';
}
function render(){if(document.body.dataset.view!=='box'||!CATALOG.cards?.length)return;if(!['','SSR','UR','LR'].includes(rarityFilter))rarityFilter='';allRows=gather();indexSavedTeams();const input=document.getElementById('mcSearch');if(document.activeElement!==input)input.value=query;document.getElementById('mcType').value=typeFilter;document.getElementById('mcRarity').value=rarityFilter;document.getElementById('mcSort').value=prefs.sort;document.getElementById('mcStatus').value=prefs.status;document.getElementById('mcStatusLabel').hidden=prefs.tab!=='prepare';
 const activeFilters=Number(!!typeFilter)+Number(!!rarityFilter)+Number(prefs.tab==='prepare'&&prefs.status!=='all');
 filterButton.textContent=activeFilters?'Filtres ('+activeFilters+')':'Filtres';
 const groups=document.getElementById('mcGroups');groups.hidden=prefs.tab!=='prepare';
 for(const button of groups.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.mcGroup===preparationGroup));
 const group=prefs.tab==='prepare'?preparationGroup:'';
 const rows=M.filter(allRows,{...prefs,group,status:group==='ready'?'all':prefs.status,query,type:typeFilter,rarity:rarityFilter}),signature=JSON.stringify([prefs,group,query,typeFilter,rarityFilter,limit,[...savedTeamsByCard],allRows.map(r=>[r.id,r.favorite,r.used,r.recent,r.tasks])]);if(signature===lastSignature)return;lastSignature=signature;
 main.querySelectorAll('[data-mc-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mcTab===prefs.tab)));
 document.getElementById('mcSummary').innerHTML='<span><b>'+allRows.length+'</b>cartes confirmées</span><span><b>'+allRows.filter(r=>r.used&&r.tasks.length).length+'</b>priorités dans tes équipes</span><span><b>'+allRows.filter(r=>r.unknown).length+'</b>profils à renseigner</span>';
 main.querySelector('.mc-explanation').textContent=prefs.tab==='prepare'?'Les cartes utilisées dans tes équipes sont prioritaires avec le tri « Priorités ». Une valeur inconnue reste « À renseigner » ; elle ne signifie pas que la carte est mal montée.':prefs.tab==='favorites'?'Tes favoris parmi les cartes confirmées de ta collection.':'Uniquement les cartes confirmées, dans leur forme réellement possédée. Les formes précédentes restent dans le catalogue complet.';
 const recent=allRows.filter(r=>r.recent).sort((a,b)=>b.recent-a.recent).slice(0,8),panel=document.getElementById('mcRecent');panel.hidden=prefs.tab!=='cards';panel.querySelector('div').innerHTML=recent.length?recent.map(r=>'<button data-mc-card="'+esc(r.id)+'">'+esc(r.card.name)+'<small>'+new Date(r.recent).toLocaleDateString('fr-FR')+'</small></button>').join(''):'<p>Aucune confirmation récente enregistrée dans l’historique.</p>';
 document.getElementById('mcCount').textContent=rows.length+' carte(s)'+(prefs.tab==='prepare'?' à préparer ou à renseigner':'');const results=document.getElementById('mcResults');results.className=prefs.tab==='prepare'?'mc-preparation-list':'mc-grid';results.innerHTML=rows.slice(0,limit).map(card).join('')||'<div class="panel"><h2>'+(prefs.tab==='favorites'?'Aucun favori pour ces filtres':prefs.tab==='prepare'?'Aucune préparation pour ces filtres':'Aucune carte confirmée pour ces filtres')+'</h2><p>'+(prefs.tab==='favorites'?'Utilise l’étoile sur tes cartes pour les retrouver ici.':'Modifie les filtres ou déclare tes cartes depuis le catalogue.')+'</p></div>';const more=document.getElementById('mcMore');more.hidden=rows.length<=limit;more.textContent='Afficher la suite · '+Math.max(0,rows.length-limit)+' cartes restantes';}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render();});}
function persistFilters(){storageWrite('dokkanos-box-filters-v1',JSON.stringify({...storedJSON('dokkanos-box-filters-v1',{}),query,rarityFilter,typeFilter}));}
document.addEventListener('input',e=>{if(e.target.id==='mcSearch'){query=norm(e.target.value);document.getElementById('search').value=e.target.value;limit=72;persistFilters();schedule();}});
document.addEventListener('change',e=>{if(e.target.id==='mcType'){typeFilter=e.target.value;document.getElementById('typeFilter').value=typeFilter;}else if(e.target.id==='mcRarity'){rarityFilter=e.target.value;document.getElementById('rarityFilter').value=rarityFilter;}else if(e.target.id==='mcSort')prefs.sort=e.target.value;else if(e.target.id==='mcStatus')prefs.status=e.target.value;else return;limit=72;save();persistFilters();schedule();});
document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(!b)return;const d=b.dataset;
 if(d.mcGroup!==undefined){preparationGroup=d.mcGroup;limit=72;schedule();return;}
 if(d.mcTab){prefs.tab=d.mcTab;prefs.sort=d.mcTab==='prepare'?'priority':'name';limit=72;save();schedule();}
 if(d.mcCard)openCard('CATALOG-'+d.mcCard);
 if(d.mcFarm)window.DokkanCopilot?.open('farmSources',d.mcFarm);
 if(d.mcProfile)window.DokkanCopilot?.open('profiles',d.mcProfile);
 if(d.mcFavorite){const id=d.mcFavorite,old=[...favorites].filter(ref=>favoriteId(ref)===id);if(old.length)old.forEach(ref=>favorites.delete(ref));else favorites.add(DB.cards.find(c=>c.validated&&String(c.candidateId)===id)?.boxId||'MANUAL-'+id);storageWrite('dokkanos-favorites',JSON.stringify([...favorites]));schedule();}
 if(d.mcReset!==undefined){query='';typeFilter='';rarityFilter='';document.getElementById('search').value='';document.getElementById('typeFilter').value='';document.getElementById('rarityFilter').value='';limit=72;persistFilters();schedule();}
 if(b.id==='mcMore'){limit+=72;schedule();}
});
window.addEventListener('dokkanos-data-ready',schedule);window.addEventListener('dokkanos-state-change',schedule);window.addEventListener('dokkanos-view-change',schedule);window.DokkanMyCollection={render,schedule,get rows(){return allRows},get prefs(){return prefs}};schedule();
})();
