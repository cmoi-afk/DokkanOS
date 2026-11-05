(function(){'use strict';
const M=window.DokkanBurstModel,ID='burst-quest-1524';let busy=false,message='';
function current(){const p=teamSettings.event===ID?teamSettings.burstPlan:null;try{return p&&M.score(p.ids)===8000?p:null;}catch(e){return null;}}
function render(event){if(event?.id!==ID&&!(document.body.dataset.view==='teams'&&teamSettings.event===ID))return '';const p=current(),cards=[...teamCards(),teamFriend(resolveCard(teamLeader))].filter(Boolean),ok=p&&M.check(p,cards,TE);return `<section class="panel"><h3>Objectif 8 000 points</h3><button class="primary" data-burst-build ${busy||teamBusy?'disabled':''}>${busy?'Recherche de l’équipe et des réglages…':'Préparer 8 000 points avec ma box'}</button><p role="status">${teamEsc(message)}</p>${p?`<p><b>${M.score(p.ids)} points · ${ok?'Catégorie et coût respectés, ami inclus':'Composition à recalculer après modification'}</b></p><p>${teamEsc(p.category)} · coût actuel ami inclus ${M.cost(cards)??'inconnu'}</p><details open><summary>Réglages à reproduire en jeu</summary>${M.groups.map(g=>{const o=g.options.find(o=>p.ids.includes(o.id));return '<p><b>'+teamEsc(g.label)+'</b> · '+(o?teamEsc(o.label)+' · '+o.points+' points':'Décoché')+'</p>';}).join('')}</details><p>Les immunités sélectionnées retirent la valeur des contrôles correspondants dans le classement. Les bonus ennemis imposent une priorité de survie, de ki et de dégâts. L’efficacité face au seuil de dégâts et la tenue au combat restent estimées.</p>`:''}<p>Les options sont transcrites de tes captures. Un seul choix par groupe. Le coût comprend les six cartes et l’ami. Vérifie que le jeu affiche bien 8 000 après avoir reproduit les réglages.</p></section>`;}
async function prepare(){
 if(busy||teamBusy)return;busy=true;teamBusy=true;const token=++teamJob;message='Comparaison des deux catégories et de leurs leaders…';renderEvents();
 try{
 await ensureEvents();await ensureTeamBoss();const event=teamEvents.events.find(e=>e.id===ID);if(!event||EM.status(event)!=='active')throw Error('Ce Burst Mode est terminé ou ses données sont indisponibles.');
 const pool=teamOwnedCards().map(c=>TE.combatCard(c,teamKitContext())),stage=event.stages[0],base=TE.bossAnalysis(teamBossData?.profiles?.[stage.source],stage.notes||[]);
 let best=null;
 for(const category of ['Arc enfant','Combattant ayant grandi sur Terre']){
  const mission={requirements:[{kind:'category',value:category,count:7,includeFriend:true}]};
  const preliminary=M.plan(category,[]);if(!preliminary)continue;
  const boss=M.boss(base,preliminary),encounter={...TE.combatProfile(event,stage,boss,mission,'progressive'),danger:'high',openingDanger:'high',demanding:true};
  const context={...teamKitContext(),pool:'owned',leadCategory:'',category:'',types:0,combat:'survival',duration:'progressive',searchMode:'fast',friend:'mirror',boss,encounter,preferredDuo:[]};
  const result=await executeTeamRequest({pool,leader:null,compare:true,options:{mission,known:teamKnown(),context,friend:null,locked:[],excluded:[]},seed:[]});
  if(!result?.check?.ok||result.team?.length!==6||!result.cover?.every(c=>c.covered)||!result.friendCover?.every(c=>c.covered))continue;
  const friend={...result.leader,boxId:'FRIEND-'+result.leader.boxId},plan=M.plan(category,[...result.team,friend]);
  if(!plan||!M.check(plan,[...result.team,friend],TE))continue;
  const evaluation=TE.evaluate(result.team,result.leader,friend,{requirements:M.requirements(plan)},teamKnown(),{...context,boss:M.boss(base,plan)});
  const rank=evaluation.score-plan.risk/10;
  if(!best||rank>best.rank)best={result,plan,rank};
 }
 if(token!==teamJob)throw Error('Recherche annulée.');
 if(!best)throw Error('Aucune équipe de six cartes confirmées et d’un ami compatible trouvée pour ces catégories.');
 rememberTeam();cancelTeamJob();selectedTeam=best.result.team.map(c=>c.boxId);teamLeader=best.result.leader.boxId;
 Object.assign(teamSettings,{event:ID,eventStage:String(stage.id),mission:event.missions.find(m=>m.score===8000).id,eventMissions:[event.missions.find(m=>m.score===8000).id],burstPlan:best.plan,friend:'mirror',pool:'owned',leadCategory:'',category:'',types:0,locked:[],excluded:[],leaderMode:'auto',combat:'survival',duration:'progressive'});
 saveTeamState();message='Équipe et réglages à 8 000 points préparés. Ami proposé à rechercher en jeu.';teamStatusText=message;switchView('teams');
 }catch(e){message=e.message;teamStatusText=message;}finally{busy=false;teamBusy=false;if(document.body.dataset.view==='teams')renderTeam();else renderEvents();}
}
document.addEventListener('click',e=>{if(e.target.closest?.('[data-burst-build]'))prepare();});
window.DokkanBurst={current,render,prepare};
})();
