const assert=require('node:assert/strict'),M=require('../burst-model'),E=require('../team-engine');
assert.equal(M.groups.reduce((s,g)=>s+Math.max(...g.options.map(o=>o.points)),0),8450);
assert.throws(()=>M.score(['atk-0','atk-1']));
assert.throws(()=>M.score(['absent']));
for(const category of ['Arc enfant','Combattant ayant grandi sur Terre']){
 const unknown=M.plan(category,[]);assert.equal(M.score(unknown.ids),8000);assert(!M.value(unknown,'cost'));
 const card={cost:60,categories:[category]},cards=Array(7).fill(card),p=M.plan(category,cards);
 assert.equal(M.score(p.ids),8000);assert(M.check(p,cards,E));
 assert(!M.check(p,[...cards.slice(0,6),{cost:60,categories:[]}],E));
 assert(!E.constraints(cards.slice(0,6),{requirements:[{kind:'cost',value:400,includeFriend:true}]},card).ok);
 const b=M.boss({},p);assert.equal(!!b.burstEffects.ki,!!M.value(p,'ki'));assert.equal(b.immuneSeal,!!M.value(p,'seal'));
}
console.log('Burst: exact score, exclusive groups, unknown costs, seven-card category/cost checks and applied enemy effects OK');
