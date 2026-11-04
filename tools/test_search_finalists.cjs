const assert=require('node:assert/strict'),S=require('../team-search.js');
(async()=>{
 const calls=[],leaders=Array.from({length:12},(_,id)=>({id,boxId:String(id)}));
 const E={identity:c=>c.id,leaderCandidates:()=>leaders.map(c=>({c})),build:(pool,c,o)=>{calls.push([c.id,o.context.searchMode]);return {team:Array(6).fill(c),check:{deficit:c.id===11?1:0},score:c.id===11?9999:c.id+(o.context.searchMode==='deep'?100:0)};}};
 const request={pool:leaders,compare:true,options:{context:{searchMode:'deep',friend:'mirror'}}};
 const r=await S.run(E,request);
 assert.equal(r.leader.id,10);
 assert.equal(calls.filter(x=>x[1]==='fast').length,12);
 assert(calls.some(x=>x[0]===10&&x[1]==='deep'));
 assert(!calls.some(x=>x[0]===11&&x[1]==='deep'));
 const n=calls.length;assert((await S.run(E,request)).cached);assert.equal(calls.length,n);
 await assert.rejects(S.run(E,{...request,pool:[...leaders]},()=>{},()=>true),/annulée/);
 console.log('Search: all leaders screened, actual valid teams refined, invalid high score rejected, cache and cancellation OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
