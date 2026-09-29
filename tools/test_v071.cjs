const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('app.js','utf8').split('boot().catch(')[0];
const data=JSON.parse(fs.readFileSync('catalog.json','utf8'));
const saved=new Map(),elements=new Map();
const element=selector=>{if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',hidden:true,classList:{add(){},remove(){},toggle(){}}});return elements.get(selector)};
const context={
  console,
  window:{addEventListener(){}},
  navigator:{onLine:true},
  document:{querySelector:element,querySelectorAll(){return []},getElementById(id){return element('#'+id)},addEventListener(){}},
  localStorage:{setItem(k,v){saved.set(k,v)},getItem(k){return saved.get(k)||null}},
  alert(){throw Error('unexpected alert')}
};
vm.createContext(context);
vm.runInContext(source+'\nCATALOG='+JSON.stringify(data)+'; META={cards:{}}; DB={cards:[{boxId:"BOX-TEST",candidateId:"",validated:false,image:""}]}; inventory={};',context);
for(const key of ['render','stats','renderInventory','renderManualOwned','renderAnalysis'])vm.runInContext(key+'=()=>{}',context);
assert.equal(vm.runInContext('catalogFamilies().length > 1000',context),true);
assert.equal(vm.runInContext('catalogFamilies()===catalogFamilies()',context),true);
vm.runInContext('renderMissing()',context);
assert(parseInt(element('#missingCount').textContent,10)>1000);
assert(element('#missingList').innerHTML.includes('À confirmer'));
const card=data.cards.find(x=>x.image&&x.rarity==='UR');
assert(card);
vm.runInContext('verifyDraft={boxId:"BOX-TEST",cardId:"",query:""}; verifyChooseCard('+JSON.stringify(card.id)+'); verifyConfirm()',context);
assert.equal(vm.runInContext('DB.cards[0].candidateId',context),String(card.id));
assert.equal(vm.runInContext('DB.cards[0].image',context),card.image);
assert.equal(vm.runInContext('DB.cards[0].validated',context),true);
assert(element('#verificationStatus').textContent.includes('validée'));
assert.equal(JSON.parse(saved.get('dokkanos-edits'))[0].candidateId,String(card.id));
vm.runInContext('DB.cards=[{boxId:"BOX-TEST",candidateId:"",validated:false,image:""}]; restoreEdits()',context);
assert.equal(vm.runInContext('DB.cards[0].image',context),card.image);
assert.equal(data.cards.filter(x=>!x.image).length,0);
vm.runInContext(`DB={cards:[
 {boxId:"A",candidateId:"1",validated:true,rarity:"SSR",type:"AGI",class:"Super",categories:["Kamehameha"],links:["Super Saiyan"],eza:true},
 {boxId:"B",candidateId:"2",validated:false,rarity:"UR",type:"TEC",class:"Extrême",categories:["Boss des films"],links:["Boss"],eza:false},
 {boxId:"C",candidateId:"3",validated:true,rarity:"LR",type:"INT",class:"Super",categories:["Kamehameha"],links:["Pouvoir légendaire"],eza:false}
]}; filter="all"; rarityFilter="SSR"; typeFilter=classFilter=categoryFilter=linkFilter=ezaFilter=""; favoriteOnly=false; query=""`,context);
assert.deepEqual(Array.from(vm.runInContext('visibleCards().map(c=>c.boxId)',context)),['A']);
vm.runInContext('rarityFilter=""; typeFilter="TEC"',context); assert.deepEqual(Array.from(vm.runInContext('visibleCards().map(c=>c.boxId)',context)),['B']);
vm.runInContext('typeFilter=""; classFilter="Super"',context); assert.deepEqual(Array.from(vm.runInContext('visibleCards().map(c=>c.boxId)',context)),['A','C']);
vm.runInContext('classFilter=""; categoryFilter="Kamehameha"',context); assert.deepEqual(Array.from(vm.runInContext('visibleCards().map(c=>c.boxId)',context)),['A','C']);
vm.runInContext('categoryFilter=""; linkFilter="Boss"',context); assert.deepEqual(Array.from(vm.runInContext('visibleCards().map(c=>c.boxId)',context)),['B']);
vm.runInContext('linkFilter=""; ezaFilter="yes"',context); assert.deepEqual(Array.from(vm.runInContext('visibleCards().map(c=>c.boxId)',context)),['A']);
vm.runInContext('ezaFilter=""; filter="valid"',context); assert.deepEqual(Array.from(vm.runInContext('visibleCards().map(c=>c.boxId)',context)),['A','C']);
vm.runInContext('filter="check"',context); assert.deepEqual(Array.from(vm.runInContext('visibleCards().map(c=>c.boxId)',context)),['B']);
console.log('top rarity/type/class/category/link/EZA/status filters: OK');
vm.runInContext(`DB={cards:[
 {boxId:"B01",candidateId:"10",validated:true,name:"Goku",image:"x.webp"},
 {boxId:"B02",candidateId:"10",validated:true,name:"Goku",image:"x.webp"},
 {boxId:"B03",candidateId:"10",validated:true,name:"Goku",image:"x.webp"},
 {boxId:"B04",candidateId:"11",validated:true,name:"Vegeta",image:"y.webp"}
]}`,context);
vm.runInContext('renderDuplicates()',context);
assert.equal(element('#dupCount').textContent,'2 persos');
assert(element('#duplicateSummary').textContent.includes('2 personnages'));
assert(element('#duplicateList').innerHTML.includes('2/4'));
assert(element('#duplicateList').innerHTML.includes('0/4'));
assert(element('#duplicateList').innerHTML.includes('2 doublons détectés'));
console.log('potential 0-4 tracker including zero duplicates: OK');
vm.runInContext('rainbow100=new Set(); toggleRainbow100("10")',context);
assert.equal(JSON.parse(saved.get('dokkanos-rainbow100'))[0],'10');
assert.equal(vm.runInContext('rainbow100.has("10")',context),true);
assert(element('#duplicateSummary').textContent.includes('1 confirmés 🌈'));
assert(element('#duplicateList').innerHTML.includes('🌈 100 %'));
assert(element('#duplicateList').innerHTML.includes('2 doublons détectés'));
vm.runInContext('toggleRainbow100("10")',context);
assert.equal(vm.runInContext('rainbow100.has("10")',context),false);
console.log('100% potential persistence and remaining duplicates: OK');
vm.runInContext('DB={cards:[{boxId:"SHEET-1",candidateId:"77",validated:true,name:"Test",image:"x.webp"}]}; rainbow100=new Set()',context);
vm.runInContext('openCard("SHEET-1")',context);
assert(element('#sheet').innerHTML.includes('Marquer potentiel 100 %'));
vm.runInContext('toggleRainbowFromCard("SHEET-1","77")',context);
assert.equal(vm.runInContext('rainbow100.has("77")',context),true);
assert(element('#sheet').innerHTML.includes('Retirer le 100 %'));
assert(element('#sheet').innerHTML.includes('Potentiel 100 %'));
console.log('100% potential character-sheet workflow: OK');
console.log('verification, persistence, unconfirmed list and catalogue images: OK');
