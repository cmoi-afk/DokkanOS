/* Run the search away from the UI thread. No ownership changes in this worker. */
importScripts('team-engine.js?v=21100','team-search.js?v=21100');
let retainedPool;
self.onmessage=e=>{try{const {pool,leader,options,compare}=e.data,E=self.DokkanTeamEngine;let result;
 if(e.data.id){if(pool)retainedPool=pool;const id=e.data.id;self.DokkanTeamSearch.run(E,{...e.data,pool:retainedPool},progress=>self.postMessage({id,progress})).then(result=>self.postMessage({id,result}),error=>self.postMessage({id,error:error.message}));return;}
 if(e.data.action==='replace')result=E.replace(pool,e.data.team,e.data.target,leader,options);
 else if(compare){const ranked=E.leaderCandidates(pool,options);result=ranked.map(({c})=>({...E.build(pool,c,{...options,friend:options.context.friend==='mirror'?{...c,boxId:'FRIEND-'+c.boxId}:options.friend}),leader:c})).filter(x=>!x.error).sort((a,b)=>b.score-a.score)[0]||{error:'Aucun leader compatible avec les cartes conservées.'};}
 else result=E.build(pool,leader,options);self.postMessage({result});
 }catch(error){self.postMessage({error:error.message})}};
