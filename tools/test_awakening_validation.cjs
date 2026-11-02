const assert=require('node:assert/strict'),fs=require('fs'),M=require('../catalog-model');
const cards=JSON.parse(fs.readFileSync('catalog.json','utf8')).cards,graph=M.awakeningGraph(cards);
const owned=new Set(['1034201']),inventory={'1034201':'owned'},before=JSON.stringify(inventory);
let rows=M.collectionState(cards,owned,inventory,graph);
for(const id of ['1034180','1034181','1034191']){const c=rows.find(c=>c.id===id);assert.equal(c._coveredBy,'1034201');assert.notEqual(c._state,'owned');}
assert(!M.filter(rows,{view:'validation',forms:'all',scope:'review'}).some(c=>['1034180','1034181','1034191'].includes(c.id)));
assert(M.filter(rows,{view:'encyclopedia',forms:'all',scope:'all'}).some(c=>c.id==='1034181'));
assert.equal(rows.find(c=>c.id==='1034201')._state,'owned');assert.equal(JSON.stringify(inventory),before);
rows=M.collectionState(cards,new Set(['1034181']),{'1034181':'owned'},graph);
assert.equal(rows.find(c=>c.id==='1034201')._state,'review');assert(!rows.find(c=>c.id==='1034201')._coveredBy);
rows=M.collectionState(cards,new Set(),{},graph);assert(M.filter(rows,{view:'validation',forms:'all',scope:'review'}).some(c=>c.id==='1034181'));
assert.deepEqual(graph.family('1034201').map(c=>c.id).sort(),['1034180','1034181','1034191','1034201']);
const independent=[{id:'1',name:'Même nom',rarity:'UR',type:'AGI'},{id:'2',name:'Même nom',rarity:'LR',type:'AGI'}];assert(!M.collectionState(independent,new Set(['2']))[0]._coveredBy);
const reverse=[{id:'a',rarity:'UR'},{id:'b',rarity:'LR',awakensFrom:'a'}];assert.equal(M.collectionState(reverse,new Set(['b']))[0]._coveredBy,'b');
const cycle=[{id:'a',rarity:'UR',awakensTo:'b'},{id:'b',rarity:'LR',awakensTo:'a'}];assert.equal(M.collectionState(cycle,new Set()).length,2);
console.log('Awakening validation: real SSR/Z-UR/TUR/LR chain, both link directions, exact ownership, no name grouping, undo, encyclopedia and cycle safety: OK');
