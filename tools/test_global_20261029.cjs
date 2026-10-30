const assert=require('node:assert/strict'),fs=require('fs'),cp=require('child_process');
const C=require('../catalog-model.js'),E=require('../event-model.js'),T=require('../team-engine.js');
const read=n=>JSON.parse(fs.readFileSync(n)),cat=read('catalog.json'),meta=read('card-meta.json').cards,data=read('events.json'),by=Object.fromEntries(data.events.map(e=>[e.id,e])),frontier=read('frontier-data.json'),boss=read('boss-profiles.json').profiles;
const ids=['1034720','1034721','1034731','1034940','1034941','1034861'];assert.equal(cat.cards.length,4503);
for(const id of ids){const c=cat.cards.find(c=>c.id===id);assert(c&&fs.existsSync(c.image));assert.equal(meta[id].source.exactId,id);assert.equal(meta[id].dataStatus.kit,'verified');assert(meta[id].fr._official);assert(meta[id].categories.length);assert.equal(c.openAt,1793250000);}
for(const chain of [['1034720','1034721','1034731'],['1034940','1034941','1034861']])for(let i=0;i<2;i++)assert.equal(meta[chain[i]].awakensTo,chain[i+1]);
assert(meta['1034731'].supers.some(s=>s.condition.includes('90 %')&&s.condition.includes('ATT SP EX')));
assert(C.variants(meta['1013391']).some(z=>z.kind==='superZlr'));assert(C.selectKit(meta['1013391'],'superZlr').passive);assert.equal(meta['1013391'].awakensFrom,'1013381');
assert.equal(by['quest-319'].stages.filter(s=>s.difficulty.toLowerCase()==='super').length,24);assert.equal(by['quest-320'].stages.filter(s=>s.difficulty.toLowerCase()==='super').length,25);
assert(by['quest-737'].stages.some(s=>s.number===2));assert(by['quest-1751'].stages.some(s=>s.number===13));assert.equal(by['quest-1228'].end,'2026-11-18T08:59:00+01:00');
const linked=E.linkMissions(data.events),battle=linked.find(e=>e.id==='quest-1751');
const mono=battle.missions.find(m=>m.origin&&m.requirements.some(r=>r.kind==='type'&&r.value==='AGI'&&r.count===6));assert(mono);assert.equal(mono.stageNumber,13);
assert(T.constraints(Array.from({length:6},(_,i)=>({id:String(i),type:'AGI'})),mono).ok);assert(!T.constraints(Array.from({length:6},(_,i)=>({id:String(i),type:i===5?'TEC':'AGI'})),mono).ok);
assert(battle.missions.some(m=>m.origin&&m.requirements.length===5));assert(linked.find(e=>e.id==='quest-1524').missions.some(m=>m.origin&&m.requirements.some(r=>r.kind==='category'&&r.count===3)));
assert.equal(by['board-missions-3042'].missions.length,11);assert.equal(by['board-missions-3044'].missions.length,11);assert(by['mission-1228'].hidden&&by['mission-737'].hidden);
assert.equal(frontier.nodes.length,81);for(const [id,count,phases] of [['cell-12',3,1],['cell-13',5,3],['cell-14',2,2]]){const n=frontier.nodes.find(n=>n.id===id);assert(n);assert.equal(n.missions.length,count);assert.equal(n.phases.length,phases);assert(n.heat.length);}
assert.equal(frontier.nodes.find(n=>n.id==='cell-13').missions.find(m=>m.id==='34957').category,'En mission');
const n12=frontier.nodes.find(n=>n.id==='cell-12');assert.equal(n12.phases[0].stunImmune,null,'A two-use resistance is not permanent immunity');assert(n12.phases[0].effects.some(s=>s.includes('2 fois')));
const baseline='517a835f90391d4ceb09aee5f63884a407641110';const old=JSON.parse(cp.execFileSync('git',['show',baseline+':events.json'],{maxBuffer:50e6}));
for(const e of old.events){assert(by[e.id]);const mids=new Set(by[e.id].missions.map(m=>m.id));for(const m of e.missions)assert(mids.has(m.id),'Lost progress identity '+m.id);}
const oldnodes=JSON.parse(cp.execFileSync('git',['show',baseline+':frontier-data.json'],{maxBuffer:5e6}));for(const n of oldnodes.nodes)assert.deepEqual(frontier.nodes.find(x=>x.id===n.id),n);
const oldSources=new Set(old.events.flatMap(e=>(e.stages||[]).map(s=>s.source)));const fresh=data.events.flatMap(e=>(e.stages||[]).filter(s=>s.source&&!oldSources.has(s.source)));assert.equal(fresh.length,55);for(const s of fresh){assert.equal(boss[s.source]?.status,'verified');assert(s.rulesVerified);}
assert(!read('data-download.json').announced.some(a=>a.name.startsWith('Prévu le 29')));assert.equal(read('visual-index.json').cards.length,4503);
console.log('29 October: six exact forms/chains/EX, Super Z-LR, 55 verified stages, linked EX quotas, dated boards, Frontier phases/resistances and all historical progress identities preserved: OK');
