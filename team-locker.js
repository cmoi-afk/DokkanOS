/* Simple entry to the existing team builder and saved compositions. */
(function(){
'use strict';
let page='locker',nextEntry='',lastRender='',newEvent=false;
const esc=teamEsc;
const host=()=>document.querySelector('#teams main');
const heading=(name,description)=>`<header class="locker-heading"><h1>${name}</h1><p>${description}</p></header>`;
function portraits(cards){
 return '<div class="locker-portraits">'+Array.from({length:6},(_,i)=>cards[i]?teamImage(cards[i]):'<span class="locker-empty-slot" aria-hidden="true">+</span>').join('')+'</div>';
}
function teamCardSummary(saved,events,results){
 const event=events.get(saved.settings.event);
 const cards=saved.cards.map(ref=>resolveCard(ref)).map((card,i)=>card||verifyCandidate(String(saved.cards[i]).replace(/^(CATALOG-|MANUAL-)/,'')));
 const art=event?window.DokkanEventImages?.render(event,true)||'':'';
 const mission=event?.missions?.find(m=>m.id===saved.settings.mission);
 const result=results.get(saved.id);
 const last=result?`Dernier essai · ${result.result==='victory'?'Réussite':'Tentative'}${Number.isInteger(result.details?.phasesCompleted)?' · '+result.details.phasesCompleted+' phases terminées':''}`:'À tester';
 return `<article class="locker-card">${art}<div class="locker-card-body">
 <span class="eyebrow">${esc(event?.name||saved.objective?.eventName||'Équipe libre')}</span><h2>${esc(saved.name)}</h2>
 ${mission?`<p class="muted">${esc(mission.title)}</p>`:''}${portraits(cards)}<p class="locker-last">${esc(last)}</p>
 <div class="locker-actions"><button class="primary" data-locker-resume="${esc(saved.id)}" data-team-load="${esc(saved.id)}">Reprendre</button>
 <button data-locker-edit="${esc(saved.id)}" data-team-load="${esc(saved.id)}">Modifier</button></div>
 </div></article>`;
}
function render(){
 const root=host();
 if(!root||page==='editor')return false;
 const saved=teamSaved();
 const events=new Map(teamEvents.events.map(e=>[e.id,e]));
 const results=new Map((window.DokkanBattles?.rows()||[]).map(row=>[row.teamId,row]));
 const html=page==='create'?heading('Créer une équipe','Choisis où tu veux jouer.')+
  `<div class="locker-choices">
   <button class="primary" data-locker="event">Pour un événement <span>Choisir une bannière et une mission</span></button>
   <button data-locker="free">Équipe libre <span>Composer à partir de mes cartes</span></button>
   <button data-locker="back">‹ Mes équipes</button>
  </div>`:
  heading('Mes équipes','Retrouve tes compositions et prépare ton prochain combat.')+
  `<div class="locker-actions"><button class="primary" data-locker="create">＋ Créer une équipe</button>
   ${selectedTeam.length?`<button data-locker="draft">Mon équipe en cours · ${selectedTeam.length}/6</button>`:''}</div>
   <div class="locker-grid">${saved.slice().reverse().map(s=>teamCardSummary(s,events,results)).join('')||
    '<section class="locker-card locker-card-body"><h2>Ta première équipe</h2><p>Choisis un événement ou crée une équipe libre. Tes compositions sauvegardées apparaîtront ici.</p></section>'}</div>`;
 if(lastRender!==html||!root.querySelector('.locker-heading')){
  root.innerHTML=html;
  lastRender=html;
 }
 root.dataset.lockerPage=page;
 return true;
}
function showEditor(){
 page='editor';
 window.DokkanBattlefield?.classicMode();
}
function newDraft(){
 showEditor();
 cancelTeamJob();
 rememberTeam();
 selectedTeam=[];teamLeader='';teamVariants=[];teamStatusText='';
 Object.assign(teamSettings,{event:'',mission:'',eventStage:'',eventMissions:[],savedSource:'',
  leaderCatalog:'',leadCategory:'',friend:'mirror',category:'',count:6,types:0,locked:[],excluded:[],
  preferredDuo:[],bossTarget:'',disableDodge:false,replace:'',pool:'owned',leaderMode:'auto',
  leaderScope:'owned',combat:'synergy',duration:'auto',searchMode:'fast'});
 saveTeamState();
}
function editor(root,team,e,friend){
 root.dataset.lockerPage='editor';
 root.querySelector('.ux-team-steps')?.remove();
 const title=root.querySelector('.team-heading');
 const event=teamEvents.events.find(x=>x.id===teamSettings.event);
 const mission=teamMission();
 const active=teamSaved().find(s=>s.id===teamSettings.savedSource);
 title.innerHTML=`<div class="locker-editor-title">
 <button data-locker="back">‹ Mes équipes</button>
 ${event?window.DokkanEventImages?.render(event,true,true)||'':''}
 <h2>${esc(active?.name||event?.name||'Équipe libre')}</h2>
 <p>${event?esc(mission.stage?.name||mission.title||event.name):'Compose avec tes cartes ou choisis un leader.'}</p></div>`;
 const composition=root.querySelector('#teamComposition');
 title.after(composition);
 const leader=root.querySelector('#teamLeaderPanel');
 const objective=root.querySelector('#teamObjective');
 const tools=root.querySelector('.companion-team-tools');
 const settings=document.createElement('details');
 settings.className='locker-advanced panel';settings.id='lockerSettings';
 settings.innerHTML='<summary>Réglages avancés</summary>';
 settings.open=advancedOpen;
 settings.addEventListener('toggle',()=>{if(settings.isConnected)advancedOpen=settings.open;});
 composition.after(settings);
 settings.append(objective,leader);
 if(tools)settings.append(tools);
 const options=composition.querySelector('.team-generation-options');
 if(options)settings.append(options);
 const toolbar=composition.querySelector('.team-toolbar');
 const clear=toolbar?.querySelector('#clearTeam');if(clear)settings.append(clear);
 const best=toolbar?.querySelector('[data-team-action="bestLeader"]');
 if(best){best.textContent=team.length?'Proposer un autre leader':'Proposer une équipe';if(!teamLeader)best.classList.add('primary');}
 const auto=toolbar?.querySelector('#autoTeam');
 if(auto){auto.textContent=teamBusy?'Recherche en cours…':'Composer avec ce leader';if(!teamLeader&&!teamBusy)auto.hidden=true;}
 if(!team.length&&!teamBusy)toolbar?.insertAdjacentHTML('beforeend','<button data-locker="leader">Choisir mon leader</button>');
 const slots=composition.querySelector('#teamSlots');
 if(team.length&&slots){
  const compact=document.createElement('div');
  compact.className='locker-roster';
  compact.innerHTML=team.map((card,i)=>`<details class="locker-unit"><summary aria-label="Actions pour ${esc(card.name)}">${teamImage(card)}<small>${i===0&&teamLeader?'Leader':i+1}</small></summary><div>
  <button data-team-open="${esc(card.boxId)}">Fiche</button>
  <button data-team-lock="${esc(card.boxId)}">${teamSettings.locked.includes(card.boxId)?'Déverrouiller':'Verrouiller'}</button>
  ${card.boxId!==teamLeader?`<button data-team-manual-replace="${esc(card.boxId)}">Remplacer</button>`:''}
  </div></details>`).join('')+Array.from({length:6-team.length},()=>'<button class="locker-empty-slot" data-locker="partner" aria-label="Ajouter une carte">+</button>').join('');
  slots.before(compact);
  settings.append(slots);
  const full=document.createElement('details');
  full.innerHTML='<summary>Actions détaillées sur les cartes</summary>';
  slots.before(full);full.append(slots);
 }
 const savedPanel=root.querySelector('#teamSaved');
 if(savedPanel){
  const save=savedPanel.querySelector('.team-toolbar');
  const name=save?.querySelector('#teamName');
  if(name&&active)name.value=active.name;
  const button=save?.querySelector('[data-team-action="save"]');
  if(button){button.textContent=active?'Sauvegarder cette version':'Sauvegarder';button.disabled=!team.length;}
  if(save)composition.append(save);
  const exportOutput=savedPanel.querySelector('#teamExport');if(exportOutput)composition.append(exportOutput);
  const archive=document.createElement('details');
  archive.className='locker-advanced panel';
  archive.innerHTML='<summary>Versions sauvegardées et résultats</summary>';
  savedPanel.before(archive);archive.append(savedPanel);
 }
 const analysis=root.querySelector('#teamAnalysis');
 if(team.length){
  const floaters=[...team,...(friend?[friend]:[])].filter(c=>!e.rotations.some(r=>r.a.boxId===c.boxId||r.b.boxId===c.boxId));
  const plan=document.createElement('section');
  plan.id='lockerPlan';plan.className='panel locker-plan';
  const constraints=e.check?.rows||[];
  plan.innerHTML=`<h3>Plan de jeu</h3>${e.rotations.length?`
  ${e.rotations.map((r,i)=>`<p><b>Duo ${i+1}</b> · ${esc(teamRotationName(r.a))} + ${esc(teamRotationName(r.b))}</p>`).join('')}
  ${floaters.length?`<p><b>Flotteurs</b> · ${floaters.map(c=>esc(teamRotationName(c))).join(', ')}</p>`:''}`:'<p>Complète ton équipe pour obtenir les duos.</p>'}
  ${constraints.map(r=>`<p class="locker-condition">${r.ok&&!r.unknown?'✓':'À vérifier'} · ${esc(eventRequirementText(r.r))}</p>`).join('')}
  ${mission.manualCheck?'<p>Vérifie les actions demandées par la mission en jeu.</p>':''}
  <div class="locker-actions"><button data-pilot="combat">Jouer</button><button data-fight-result ${team.length!==6||teamBusy?'disabled':''}>Noter ce combat</button></div>`;
  composition.after(plan);
  const detail=document.createElement('details');
  detail.className='locker-advanced panel';
  detail.id='lockerStrategy';detail.innerHTML='<summary>Stratégie et synergies</summary>';
  analysis.before(detail);detail.append(analysis);
 }
}
let advancedOpen=false;
function entry(){
 page=nextEntry||'editor';
 nextEntry='';
 if(page==='locker'){newEvent=false;window.DokkanBattlefield?.classicMode();}
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('button');if(!b)return;
 if(b.dataset.uxScroll==='teamAnalysis'){
  const strategy=host()?.querySelector('#lockerStrategy');if(strategy)strategy.open=true;
 }
 if(b.matches('[data-c-load-team],[data-c-load-journal],[data-battle-review]'))showEditor();
},true);
document.addEventListener('click',e=>{
 const action=e.target.closest?.('button')?.dataset.locker;
 if(!action)return;
 if(action==='leader'){
  const advanced=host()?.querySelector('.locker-advanced');if(advanced)advanced.open=true;
  const search=host()?.querySelector('[data-team-fold="leader-search"]');if(search)search.open=true;renderTeamLeaders();
  host()?.querySelector('#teamLeaderSearch')?.focus();return;
 }
 if(action==='partner'){window.DokkanTeamUI?.openPartners();return;}
 if(action==='event'){
  newEvent=true;
  eventSettings.status='available';eventSettings.selected='';eventSettings.page=0;eventSettings.query='';
  eventSettings.kind='';eventSettings.todo=false;eventSettings.favorite=false;eventSettings.missions=[];
  eventSave();switchView('events');return;
 }
 if(action==='free')newDraft();
 if(action==='draft')showEditor();
 if(action==='create')page='create';
 if(action==='back'){page='locker';window.DokkanBattlefield?.classicMode();}
 renderTeam();
 host()?.querySelector('h1,h2')?.scrollIntoView({block:'start'});
});
window.addEventListener('dokkanos-events-loaded',()=>{if(document.body.dataset.view==='teams'&&host()?.dataset.teamMode==='classic'&&page!=='editor')renderTeam();});
window.DokkanTeamLocker={
 entry,render,editor,showEditor,
 openLanding(){nextEntry='locker';},
 beginEvent(){if(newEvent)newDraft();else showEditor();newEvent=false;},
 refreshArt(){if(host()?.dataset.teamMode==='classic')renderTeam();}
};
})();
