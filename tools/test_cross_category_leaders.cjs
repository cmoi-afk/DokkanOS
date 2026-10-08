const assert=require('node:assert/strict'),E=require('../team-engine.js'),S=require('../team-search.js');
const unit=id=>({id,boxId:id,name:id,type:'INT',rarity:'UR',class:'Super',categories:['A','B'],links:['Combat acharné'],passive:'*Effets de base*\nATT et DÉF +150 %'});
const lead=(id,category,percent)=>({...unit(id),teamRules:{leader:[{kind:'base',known:true,categories:[category],types:[],classes:[],hp:percent,atk:percent,def:percent}]},leader:'Leader vérifié'});
const old=lead('old','A',150),modern=lead('modern','B',200),outside={...lead('outside','B',230),categories:['B']};
const pool=[old,modern,outside,...Array.from({length:8},(_,i)=>unit('c'+i))],known=['A','B'],mission={requirements:[{kind:'category',value:'A',count:6}]},options={known,mission,context:{leadCategory:'A',friend:'mirror',searchMode:'fast'}};
(async()=>{
 const snapshot=JSON.stringify(pool),ranked=E.leaderCandidates(pool,options);
 assert.equal(ranked[0].c.id,'modern');assert(!ranked.some(x=>x.c.id==='outside'));
 assert(!E.leaderCategories(modern,known).includes('A'));
 const direct=E.build(pool,modern,options);assert.equal(direct.team.length,6);assert(direct.check.ok);assert(direct.cover.every(x=>x.hp===200));
 const progress=[],result=await S.run(E,{pool,options,compare:true},m=>progress.push(m));assert.equal(result.leader.id,'modern');assert(result.check.ok);assert(progress.some(m=>m.label?.includes('leader 2/')));
 assert.equal(E.leaderCandidates(pool,{...options,excluded:['modern']})[0].c.id,'old');
 const byMission=E.leaderCandidates(pool,{...options,context:{friend:'mirror'}});assert.equal(byMission[0].c.id,'modern');assert(!byMission.some(x=>x.c.id==='outside'));
 const friend={...outside,categories:['C'],teamRules:{leader:[{kind:'base',known:true,categories:['C'],types:[],classes:[],hp:200,atk:200,def:200}]}};
 assert.equal(E.leaderCandidates(pool,{...options,friend,context:{leadCategory:'A',friend:'fixed'}}).length,0);
 // The leader's own 230% bonus must not be advertised as 230% for everyone.
 const narrow={...lead('narrow','B',170),categories:['A','B','C'],teamRules:{leader:[{kind:'base',known:true,categories:['B'],types:[],classes:[],hp:170,atk:170,def:170},{kind:'additional',known:true,categories:['C'],types:[],classes:[],hp:60,atk:60,def:60}]}};
 assert.equal(E.leaderCandidates([...pool,narrow],options)[0].c.id,'modern');
 assert.equal(JSON.stringify(pool),snapshot);
 console.log('Cross-category leaders: stronger real bonuses, six category members, no literal leader-category requirement, partial bonuses, friend, exclusions, comparison and immutable Box: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
