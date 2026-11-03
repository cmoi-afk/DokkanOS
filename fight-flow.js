/* Shortcuts between an objective, its team, and the combat log. */
(function(){
'use strict';
const esc=teamEsc;
const active=event=>['active','permanent'].includes(EM.status(event));
function nextMission(event,state,stage=''){
 const level=event.stages?.find(s=>String(s.id)===String(stage));
 const available=event.missions.filter(m=>EM.missionAvailable(m)&&!state[m.id]?.done);
 const eligible=available.filter(m=>!level||(!m.stageId&&!m.stageNumber)||String(m.stageId)===String(level.id)||m.stageNumber===level.number);
 const preferred=eventSettings.pinnedObjective;
 return eligible.find(m=>preferred?.event===event.id&&preferred.mission===m.id)
  ||eligible.find(m=>eventSettings.selected===event.id&&eventSettings.missions.includes(m.id))||eligible[0];
}
function eventTop(event,state){
 if(!active(event))return '';
 const mission=nextMission(event,state,eventSettings.stage);
 const saved=[...teamSaved()].reverse().filter(s=>s.settings.event===event.id);
 const team=saved.find(s=>{
  if(eventSettings.stage&&String(s.settings.eventStage)!==eventSettings.stage)return false;
  return !mission||s.settings.mission===mission.id||s.settings.eventMissions?.includes(mission.id);
 });
 const pinned=eventSettings.pinnedObjective?.event===event.id;
 const requirements=mission?.requirements||[];
 const stage=mission&&event.stages?.find(s=>String(s.id)===String(mission.stageId)||(mission.stageNumber!=null&&s.number===mission.stageNumber));
 const canBuild=event.kind!=='Pettan Battle';
 return `<section class="fight-event-next"><span class="eyebrow">MON PROCHAIN COMBAT</span>
 <h4>${esc(mission?.title||'Choisir un niveau')}</h4>
 ${stage?`<p>${esc(stage.name)}</p>`:''}
 ${requirements.length?`<div class="tags">${requirements.map(r=>`<span>${esc(eventRequirementText(r))}</span>`).join('')}</div>`:''}
 ${mission?.manualCheck?`<p>${esc(mission.description||'Vérifie les conditions en jeu.')}</p>`:''}
 ${team?`<p><b>${esc(team.name)}</b></p><div class="home-resume-roster">${team.cards.map(ref=>resolveCard(ref)).filter(Boolean).map(teamImage).join('')}</div>`:''}
 <div class="fight-actions">
 ${team?`<button class="primary" data-fight-play-team="${esc(team.id)}">Jouer avec cette équipe</button>`:''}
 ${canBuild&&mission?`<button class="${team?'':'primary'}" data-event-single-team="${esc(mission.id)}" data-event-id="${esc(event.id)}">Préparer pour cette mission</button>`:''}
 <button data-fight-pin="${esc(event.id)}" data-fight-mission="${esc(mission?.id||'')}" aria-pressed="${pinned}">${pinned?'Retirer de l’accueil':'Épingler sur l’accueil'}</button>
 </div></section>`;
}
const expandedEvents=new Set();
function foldEvent(root){
 const header=root.querySelector('.event-detail-heading'),hero=root.querySelector('.fight-event-next');
 if(!header||root.querySelector('.fight-event-details'))return;
 const details=document.createElement('details');
 details.className='fight-event-details';
 details.innerHTML='<summary>Niveaux, missions, récompenses et équipes</summary>';
 const nodes=[...(hero||header).parentElement.children].slice([...root.children].indexOf(hero||header)+1);
 const id=eventSettings.selected;details.open=expandedEvents.has(id);
 details.addEventListener('toggle',()=>{if(details.isConnected){if(details.open)expandedEvents.add(id);else expandedEvents.delete(id);}});
 details.append(...nodes);
 root.append(details);
}
let graphCards,graphMeta,graph;
function cardOverview(){
 const sheet=document.querySelector('#sheet.on'),id=sheet?.dataset.cardId;
 if(!window.DokkanCatalogUI||!id||sheet.querySelector('.fight-card-overview')||!CATALOG.cards?.length)return;
 if(graphCards!==CATALOG.cards||graphMeta!==META.cards){
  graphCards=CATALOG.cards;graphMeta=META.cards;
  graph=window.DokkanCatalogModel.awakeningGraph(window.DokkanCatalogUI.currentCards());
 }
 const targets=[...(graph.next.get(id)||[])];
 const next=targets.filter(target=>!targets.some(other=>other!==target&&graph.descendants(other).includes(target))).map(verifyCandidate).filter(Boolean);
 const teams=teamSaved().filter(s=>s.cards.some(ref=>String(resolveCard(ref)?.candidateId||ref).replace(/^(CATALOG-|MANUAL-)/,'')===id));
 const block=document.createElement('section');
 block.className='fight-card-overview';
 block.innerHTML=`<h3>Préparer cette carte</h3>
 ${teams.length?`<details><summary>Dans ${teams.length} équipe(s)</summary><div class="fight-actions">${teams.map(t=>`<button data-c-load-team="${esc(t.id)}">${esc(t.name)}</button>`).join('')}</div></details>`:''}
 <div class="fight-actions">${next.map(c=>`<button data-fight-card="${esc(c.id)}">Éveil suivant · ${esc(c.rarity)} ${esc(c.name)}</button>`).join('')}
 <button data-pilot="farmSources" data-pilot-card="${esc(id)}">Où farmer les médailles</button></div>`;
 sheet.querySelector('.hero')?.after(block);
}
let resultDialog;
function openResult(){
 if(resultDialog||selectedTeam.length!==6)return;
 const objective=window.DokkanBattles.objective(teamSettings);
 const event=teamEvents.events.find(e=>e.id===objective.event);
 const state=eventAllProgress();
 const stageMissions=window.DokkanWorkbenchModel?.stageMissions(event,objective.stage)||[];
 const selected=new Set(objective.missions.map(m=>m.id));
 const missions=stageMissions.filter(m=>EM.missionAvailable(m)&&!state[m.id]?.done)
  .sort((a,b)=>Number(selected.has(b.id))-Number(selected.has(a.id)))
  .map(m=>({id:m.id,title:m.title}));
 const signature=window.DokkanProgressModel.signature(window.DokkanCompanion.snapshot());
 const dialog=document.createElement('dialog');
 dialog.className='fight-result';
 dialog.setAttribute('aria-labelledby','fightResultTitle');
 dialog.innerHTML=`<form id="fightResultForm"><h2 id="fightResultTitle">Noter le résultat</h2>
 <p>${esc(event?.name||'Équipe libre')}</p>
 <label>Résultat<select name="result"><option value="victory">Réussi</option><option value="defeat">À revoir</option></select></label>
 ${missions.length?`<fieldset><legend>Missions réalisées</legend>${missions.map(m=>`<label class="team-checkbox"><input type="checkbox" name="mission" value="${esc(m.id)}"> ${esc(m.title)}</label>`).join('')}</fieldset>`:''}
 <label>Note facultative<textarea name="note" rows="2" maxlength="1500" placeholder="Une rotation à garder, un placement à revoir…"></textarea></label>
 <p class="fight-error" role="alert"></p><div class="fight-actions"><button class="primary" type="submit">Enregistrer</button><button type="button" data-fight-cancel>Fermer</button></div></form>`;
 dialog.addEventListener('close',()=>{dialog.remove();resultDialog=null;});
 dialog.querySelector('[name="result"]').addEventListener('change',e=>{
  const fields=dialog.querySelector('fieldset');if(fields){fields.hidden=e.target.value==='defeat';fields.disabled=fields.hidden;}
 });
 dialog.querySelector('form').addEventListener('submit',e=>{
  e.preventDefault();
  const data=new FormData(e.currentTarget);
  try{
   if(signature!==window.DokkanProgressModel.signature(window.DokkanCompanion.snapshot()))throw Error('L’équipe a changé. Rouvre la fiche de résultat.');
   const saved=teamSaved(),current=saved.find(t=>t.id===teamSettings.savedSource);
   const same=current&&JSON.stringify([current.cards,current.leader,current.objective])===JSON.stringify([selectedTeam,teamLeader,objective]);
   const team=same?current:{id:crypto.randomUUID(),name:current?.name||event?.name||'Mon équipe',cards:[...selectedTeam],leader:teamLeader,settings:JSON.parse(JSON.stringify(teamSettings))};
   if(!same)window.DokkanBattles.enrich(team,current);
   const next=window.DokkanBattleModel.add(window.DokkanBattles.rows(),team,{
    count:1,result:data.get('result'),validated:data.getAll('mission'),missions,note:data.get('note')
   });
   const before=storageRead('dokkanos-saved-teams-v2');
   if(!same&&!storageWrite('dokkanos-saved-teams-v2',JSON.stringify([...saved,team])))throw Error('La sauvegarde locale est indisponible.');
   try{window.DokkanBattles.persistResult(next);}
   catch(error){if(!same)storageWrite('dokkanos-saved-teams-v2',before??'[]');throw error;}
   teamSettings.savedSource=team.id;teamSaveSettings();
   dialog.close();
   window.dispatchEvent(new Event('dokkanos-state-change'));
   window.DokkanExperience?.notify('Résultat enregistré.');
  }catch(error){dialog.querySelector('.fight-error').textContent=error.message;}
 });
 document.body.append(dialog);resultDialog=dialog;dialog.showModal();
}
document.addEventListener('click',async e=>{
 const b=e.target.closest?.('button');if(!b)return;
 const d=b.dataset;
 if(d.fightPin){
  eventSettings.pinnedObjective=eventSettings.pinnedObjective?.event===d.fightPin?null:{event:d.fightPin,mission:d.fightMission||''};
  eventSave();
  b.setAttribute('aria-pressed',String(!!eventSettings.pinnedObjective));
  b.textContent=eventSettings.pinnedObjective?'Retirer de l’accueil':'Épingler sur l’accueil';
 }
 if(d.fightCard)openCard('CATALOG-'+d.fightCard);
 if(d.cLoadTeam&&b.closest('#sheet'))closeSheet();
 if(d.fightResult!==undefined)openResult();
 if(d.fightCancel!==undefined)resultDialog?.close();
 if(d.fightPlayCurrent!==undefined){window.DokkanCopilot.open('combat');return;}
 if(d.fightPlayTeam){
  if(teamEvents.preview)await ensureEvents();
  const team=teamSaved().find(t=>t.id===d.fightPlayTeam);
  if(team){window.DokkanTeamLocker?.showEditor();window.DokkanBattles.load(team);window.DokkanCopilot.open('combat');}
 }
});
window.addEventListener('dokkanos-sheet-render',cardOverview);
window.DokkanFightFlow={eventTop,foldEvent,nextMission};
})();
