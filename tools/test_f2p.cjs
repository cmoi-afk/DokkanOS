const assert=require('node:assert/strict');
const M=require('../f2p-model.js');
const model=M.index({
 acquisition:{'1':{id:'1',name:'Test'},'4':{id:'4',name:'Sans donneur'}},
 cards:{'2':'Test','3':'Test'},
 characters:{Test:{sourceCardId:'2',methods:[{donor:'5',sourceRate:50,origins:[{id:'1'}]}]}}
},[{id:'6',name:'Test'},{id:'7',name:'Test bis'}]);
assert.equal(model.cards.size,2);
assert.deepEqual(model.targetsByName.get('Test'),['2','3','6']);
const [method]=model.methodsByCard.get('1');
assert.equal(M.rate('2',method),50);
assert.equal(M.rate('3',method),null);
assert.equal(M.rate('6',method),null);
assert.equal(M.rate('5',method),100);
assert.deepEqual(M.copies(1,10,100),{count:9,guaranteed:true});
assert.deepEqual(M.copies(1,10,50),{count:18,guaranteed:false});
assert.deepEqual(M.copies(5,10,30),{count:17,guaranteed:false});
assert.equal(M.copies(8,6,100),null);
console.log('F2P: independent acquisition inventory, exact-name targets, exact-form rates and copy estimates OK');
const event={name:'Équipe Bardock',acquisition:'event',event:'bardock'};
const shop={name:'Gemme incroyable (verte)',acquisition:'exchange',price:'300'};
const mixed={acquisition:'event',locations:[event,shop]};
assert.deepEqual(M.acquisitionLocations(mixed,'event'),[event]);
assert.deepEqual(M.acquisitionLocations(mixed,'exchange'),[shop]);
assert.equal(M.inAcquisition({acquisition:'exchange',locations:[shop]},'event'),false);
assert.equal(M.inAcquisition({acquisition:'event',locations:[event]},'exchange'),false);
assert.equal(M.acquisitionLabel(shop,'exchange'),'Baba Shop · Gemme incroyable (verte) · 300');
assert.equal(M.inAcquisition({acquisition:'event'},'event'),true);
console.log('F2P: event/shop isolation, mixed sources and currency labels OK');

assert.equal(M.freeExchange({name:'Super Pierre Dragon sélection 6'}),false);
assert.equal(M.freeExchange({name:"Coupon d'échange"}),false);
assert.equal(M.freeExchange({name:'Pierre Dragon sélection 11'}),true);
assert.equal(M.freeExchange({name:'Gemme incroyable (verte)',requiresPurchase:true}),false);
assert.equal(M.inAcquisition({acquisition:'exchange'},'exchange'),false);
assert.deepEqual(M.acquisitionLocations({locations:[{acquisition:'exchange',name:'Super Pierre Dragon sélection 6'},shop]},'exchange'),[shop]);
