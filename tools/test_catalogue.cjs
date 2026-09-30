const assert=require('node:assert/strict'),M=require('../catalog-model');
const z={kind:'ztur',verified:true,available:true,kit:{passive:'KIT Z',leader:'LEADER Z'},source:{url:'https://example.org/z'}};
const cards=[{id:'1',name:'Son Goku Super Saiyan 3',rarity:'SSR',type:'INT',class:'Super',awakensTo:'2',_state:'owned'},{id:'2',name:'Son Goku Super Saiyan 3',rarity:'UR',type:'INT',class:'Super',_state:'owned',passive:'BASE',eza:true,zAwakenings:[z],dataStatus:{kit:'verified'}},{id:'3',name:'Boo (petit)',rarity:'LR',type:'INT',class:'Extrême',_state:'review'},{id:'4',name:'SR',rarity:'SR'},{id:'5',name:'Statue',rarity:'SSR',isSellingOnly:true}];
assert.deepEqual(M.filter(cards).map(c=>c.id).sort(),['2','3']);assert.equal(M.filter(cards,{forms:'all'}).length,3);
assert.deepEqual(M.filter(cards,{query:'goku ssj3 int'}).map(c=>c.id),['2']);assert.deepEqual(M.filter(cards,{query:'kid boo'}).map(c=>c.id),['3']);
assert.equal(M.filter(cards,{scope:'owned'}).length,1);assert.equal(M.filter(cards,{scope:'missing'}).length,1);assert.equal(M.filter(cards,{z:'ztur'}).length,1);assert.equal(M.filter(cards,{kit:'partial'}).length,1);
assert.equal(M.variants({eza:true,ezaStep:8}).length,0);assert.equal(M.variants({zAwakenings:[{...z,verified:false}]}).length,0);assert.equal(M.variants({zAwakenings:[{...z,available:false}]}).length,0);
assert.equal(M.selectKit(cards[1],'ztur').passive,'KIT Z');assert.equal(M.selectKit(cards[1],'base').passive,'BASE');assert.equal(cards[1].passive,'BASE');assert.equal(M.selectKit(cards[1],'superZlr').passive,'BASE');
console.log('Catalogue: no SR/non-playable cards, maximum and all forms, SSJ3/Kid Boo search, ownership filters, verified-only Z versions and independent kits: OK');
