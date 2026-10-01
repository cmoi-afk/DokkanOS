/* Run the search away from the UI thread. No ownership changes in this worker. */
importScripts('team-engine.js?v=1510');
self.onmessage=e=>{try{const {pool,leader,options,compare}=e.data,E=self.DokkanTeamEngine;let result;
 if(compare){const ranked=pool.filter(c=>c.leader).map(c=>({c,count:pool.filter(x=>E.coverage(c,x,options.known).covered).length})).sort((a,b)=>b.count-a.count).slice(0,8);result=ranked.map(({c})=>({...E.build(pool,c,{...options,friend:options.context.friend==='mirror'?{...c,boxId:'FRIEND-'+c.boxId}:options.friend}),leader:c})).filter(x=>!x.error).sort((a,b)=>b.score-a.score)[0]||{error:'Aucun leader compatible avec les cartes conservées.'};}
 else result=E.build(pool,leader,options);self.postMessage({result});
 }catch(error){self.postMessage({error:error.message})}};
