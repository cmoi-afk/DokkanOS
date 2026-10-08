/* Cooperative orchestration; search work stays in a persistent worker when supported. */
(function(root){'use strict';
const results=new Map();
const pools=new WeakMap();let poolSequence=0;
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
function valid(r){return !r.error&&r.team?.length===6&&!r.check?.deficit;}
function better(a,b){if(!a)return b;if(valid(a)!==valid(b))return valid(b)?b:a;return b.score>a.score?b:a;}
async function run(E,request,progress=()=>{},cancelled=()=>false){
 const {pool,leader,options,compare,seed=[]}=request,start=Date.now();
 if(request.action==='replace'){
  progress({label:'Recherche de la meilleure alternative · cinq cartes conservées…'});
  await pause();if(cancelled())throw Error('Recherche annulée');
  const result=E.replace(pool,request.team,request.target,leader,options);
  if(cancelled())throw Error('Recherche annulée');
  return {...result,elapsedMs:Date.now()-start};
 }
 if(!pools.has(pool))pools.set(pool,++poolSequence);
 const key=JSON.stringify([pools.get(pool),leader,options,compare,seed.map(E.identity)]);
 if(results.has(key)){progress({label:'Composition identique réutilisée.'});return {...results.get(key),elapsedMs:Date.now()-start,cached:true};}
 const deep=options.context.searchMode==='deep';
 const leaders=compare?E.leaderCandidates(pool,options).map(x=>x.c):[leader];
 let best;
 for(let i=0;i<Math.min(leaders.length,deep?8:3);i++){
  await pause();if(cancelled())throw Error('Recherche annulée');const c=leaders[i];
  const base={...options,friend:options.context.friend==='mirror'?{...c,boxId:'FRIEND-'+c.boxId}:options.friend};
  progress({label:'Recherche rapide · leader '+(i+1)+'/'+Math.min(leaders.length,deep?8:3)});
  let quick={...E.build(pool,c,{...base,context:{...base.context,searchMode:'fast'},seed:!compare?seed:[]}),leader:c};
  // A seed is only an acceleration hint; never let it prevent mission completion.
  if(!valid(quick)&&seed.length&&!compare)quick={...E.build(pool,c,{...base,context:{...base.context,searchMode:'fast'}}),leader:c};
  best=better(best,quick);if(valid(best))progress({label:deep?'Équipe valide trouvée · optimisation en cours…':'Équipe rapide prête.',result:best});
  if(deep){await pause();if(cancelled())throw Error('Recherche annulée');progress({label:'Recherche approfondie · leader '+(i+1)+'/'+Math.min(leaders.length,8)});const full={...E.build(pool,c,{...base,context:{...base.context,searchMode:'deep'}}),leader:c};best=better(best,full);if(valid(best))progress({label:'Comparaison des variantes · '+(i+1)+'/'+Math.min(leaders.length,8),result:best});}
  else if(valid(best))break;
 }
 const result={...(best||{error:'Aucun leader compatible avec les cartes conservées.'}),elapsedMs:Date.now()-start,searchMode:deep?'deep':'fast'};
 if(valid(result)){if(results.size>=8)results.delete(results.keys().next().value);results.set(key,result);}
 return result;
}
root.DokkanTeamSearch={run};if(typeof module!=='undefined')module.exports={run};
})(typeof window!=='undefined'?window:globalThis);
