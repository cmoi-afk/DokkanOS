const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),E=require('../team-engine.js'),S=require('../team-search.js');
const unit=(id,categories=['A'])=>({id,boxId:id,name:id,type:'INT',rarity:'UR',class:'Super',categories,links:['Combat acharné'],passive:'*Effets de base*\nATT et DÉF +150 %'});
const leader={...unit('leader'),leader:'Ki +3, PV, ATT et DÉF +170 % pour la catégorie "A"'},pool=[leader,...Array.from({length:8},(_,i)=>unit('c'+i))];
const options={known:['A','B'],locked:[pool[2]],excluded:['c0'],context:{friend:'mirror',searchMode:'fast'},mission:{requirements:[{kind:'category',value:'A',count:6}]}};
(async()=>{
 const request={pool,leader,options,seed:[leader,pool[1],pool[2],pool[3],pool[4]]},messages=[];
 let result=await S.run(E,request,m=>messages.push(m));
 assert.equal(result.team.length,6);assert.equal(result.check.deficit,0);assert(result.team.some(c=>c.id==='c1'));assert(!result.team.some(c=>c.id==='c0'));assert(messages.some(m=>m.result));
 assert((await S.run(E,request)).cached);assert(!(await S.run(E,{...request,options:{...options,context:{...options.context,disableDodge:true}}})).cached);
 const deep=await S.run(E,{...request,options:{...options,context:{...options.context,searchMode:'deep'}}});assert.equal(deep.searchMode,'deep');assert(deep.team.some(c=>c.id==='c1'));assert(!deep.team.some(c=>c.id==='c0'));
 const multiPool=pool.map(c=>({...c,categories:c.id==='c7'?['A']:['A','B']}));const multi=await S.run(E,{...request,pool:multiPool,leader:multiPool[0],options:{...options,locked:[multiPool[2]],mission:{requirements:[{kind:'category',value:'A',count:6},{kind:'category',value:'B',count:6}]}}});assert.equal(multi.check.deficit,0);
 const snapshot=JSON.stringify(pool);await S.run(E,{pool,options,compare:true});assert.equal(JSON.stringify(pool),snapshot);
 await assert.rejects(()=>S.run(E,{...request,options:{...options,context:{...options.context,searchMode:'deep',combat:'survival'}}},()=>{},()=>true),/annulée/);
 assert(E.coverage(leader,pool[3],options.known).covered);const categories=pool[3].categories;pool[3].categories=['B'];assert(!E.coverage(leader,pool[3],options.known).covered);pool[3].categories=categories;assert(E.coverage(leader,pool[3],options.known).covered);
 // Real persistent-worker transport: second request omits the catalogue, third changes constraints.
 const worker={setTimeout,Date,console};worker.self=worker;vm.createContext(worker);worker.importScripts=(...files)=>files.forEach(f=>vm.runInContext(fs.readFileSync(f.split('?')[0],'utf8'),worker));let finish,progress=0;
 worker.postMessage=m=>{if(m.progress)progress++;else finish(m)};vm.runInContext(fs.readFileSync('team-worker.js','utf8'),worker);
 const send=data=>new Promise(resolve=>{finish=resolve;worker.onmessage({data})});
 const one=await send({...request,id:1});assert.equal(one.id,1);assert.equal(one.result.team.length,6);const two=await send({...request,pool:undefined,id:2});assert(two.result.cached);assert(progress>0);
 const three=await send({...request,pool:undefined,id:3,options:{...options,excluded:['c0','c2']}});assert(!three.result.team.some(c=>c.id==='c2'));assert(!three.result.cached);
 // A one-slot replacement cannot recompute any of the five retained cards.
 const team=[leader,pool[1],pool[2],pool[3],pool[4],pool[5]],target=team[3].boxId;
 const replaceRequest={pool,leader,team,target,action:'replace',options:{...options,excluded:['c5'],mission:{requirements:[{kind:'category',value:'A',count:6},{kind:'type',value:'INT',count:6}]}}};
 const unchanged=JSON.stringify({pool,team});
 const replaced=await S.run(E,replaceRequest);assert(replaced.check.ok);assert.notEqual(replaced.team[3].boxId,target);
 team.forEach((c,i)=>{if(i!==3)assert.equal(replaced.team[i].boxId,c.boxId)});
 assert(!replaced.team.some(c=>c.id==='c5'));assert.equal(JSON.stringify({pool,team}),unchanged);
 const transported=await send({...replaceRequest,pool:undefined,id:4});assert.deepEqual(transported.result.team.map(c=>c.boxId),replaced.team.map(c=>c.boxId));
 assert(E.replace(team,team,target,leader,replaceRequest.options).error);
 assert(E.replace(pool,team,leader.boxId,leader,replaceRequest.options).error);
 assert(E.replace(pool,team,team[2].boxId,leader,replaceRequest.options).error);
 assert(E.replace(pool,team.slice(0,5),target,leader,replaceRequest.options).error);
 assert(E.replace(pool,team,target,leader,{...replaceRequest.options,mission:{requirements:[{kind:'category',value:'B',count:6}]}}).error);
 const friend={...leader,leader:'Ki +3, PV, ATT et DÉF +170 % pour la catégorie "B"'};
 assert(E.replace(pool,team,target,leader,{...replaceRequest.options,friend}).error);
 await assert.rejects(()=>S.run(E,replaceRequest,()=>{},()=>true),/annulée/);
 console.log('Single-slot replacement: worker/fallback parity, five cards retained, constraints, exclusions, locks, friend, no candidate and cancellation: OK');
 console.log('Performance: fast/deep, valid progressive results, retained pool, cache isolation, excluded seed, locks, multi-category missions, immutable inventory: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
