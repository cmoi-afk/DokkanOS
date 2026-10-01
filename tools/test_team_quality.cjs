const assert=require('node:assert/strict'),fs=require('node:fs'),E=require('../team-engine');
const m=JSON.parse(fs.readFileSync('card-meta.json')).cards;
const card=id=>({...m[id],id,boxId:id});
const leader=card('1034201'),vegeta=card('1033061'),duo=card('1025731');
const friend={...leader,boxId:'friend'};
// Real mixed Super/Extreme members from the reference remain fully covered at 220%.
for(const c of [leader,vegeta,duo])assert.equal(E.coverage(leader,c).def,220);
assert(E.passive(vegeta,[leader,vegeta,duo]).guard);
assert(E.passive(vegeta,[leader,vegeta,duo]).potentialOffense>0);
const upgraded=E.combatCard(duo,{useZA:true});assert.equal(upgraded._kitVersion,'zlr');assert(upgraded._kitProjected);
assert(E.passive(upgraded).guard);assert(!E.passive(duo).guard);
assert.equal(E.combatCard(duo,{useZA:false}),duo);
assert.equal(E.combatCard({...duo,_kitVersion:'zlr',passive:'MANUAL'},{useZA:true}).passive,'MANUAL');
assert(!E.combatCard({...duo,zAwakenings:duo.zAwakenings.map(z=>({...z,verified:false}))},{useZA:true})._kitProjected);
const unit=(id,passive,links=['Combat acharné'])=>({id,boxId:id,name:id,categories:['Saga de Boo'],rarity:'UR',type:'END',class:'Super',links,passive,superAttack:{description:'Augmente fortement la DÉF pendant 1 tour'}});
const weak=unit('weak','*Effets de base*\nATT et DÉF +30 %',leader.links);
const strong=Array.from({length:5},(_,i)=>unit('strong'+i,'*Effets de base*\nATT et DÉF +300 %\nGarde activée contre toutes les attaques\nTaux de réduction des dégâts +40 %'));
const result=E.build([leader,weak,...strong],leader,{friend,context:{combat:'synergy'}});
assert.equal(result.team.length,6);assert(!result.team.some(c=>c.id==='weak'));assert.equal(result.rotations.length,2);
// A post-attack specialist must not displace the pre-attack tank in slot 1.
const tank=unit('tank','*Effets de base*\nATT et DÉF +100 %\nGarde activée contre toutes les attaques');
const attacker=unit('attacker','*Effets de base*\nATT et DÉF +100 %\n*Lors de l\'attaque*\nDÉF +800 %\nTaux de réduction des dégâts +80 %');
assert(E.passive(attacker).defense>E.passive(tank).defense);assert(E.passive(attacker).slot1<E.passive(tank).slot1);
tank.links=attacker.links=['a','b','c','d','e','f','g'];
assert(E.rotations([tank,attacker,unit('x','',[]),unit('y','',[])]).some(r=>r.a.id==='tank'&&r.b.id==='attacker'));
const inferred=unit('inferred','*S\'il y a 3 persos de catégorie "Saga de Boo" parmi les alliés attaquants du tour*\nDÉF +100 %');
assert.equal(E.interactionRows(inferred,[inferred,tank,attacker],[inferred,tank,attacker])[0].state,'available');
assert.equal(E.interactionRows(inferred,[inferred,tank,weak],[inferred,tank,{...weak,categories:['A']}])[0].state,'missing');
// Friend coverage is mandatory, and a projection never mutates catalogue or ownership data.
const otherFriend={...friend,leader:'Ki +3, PV, ATT et DÉF +200 % pour la catégorie "A"',teamRules:undefined};
assert(E.build([leader,...strong],leader,{friend:otherFriend}).error);
assert(!duo._kitProjected);assert(!duo._kitVersion);
console.log('Team quality: real mixed Boo team, verified Z projection, weakest member, pre-attack placement, inferred rotation conditions, friend coverage and immutable source: OK');
