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
 {boxId:"B01",candidateId:"10",validated:true,name:"Goku",image:"x.webp",rarity:"UR"},
 {boxId:"B02",candidateId:"10",validated:true,name:"Goku",image:"x.webp",rarity:"UR"},
 {boxId:"B03",candidateId:"10",validated:true,name:"Goku",image:"x.webp",rarity:"UR"},
 {boxId:"B04",candidateId:"11",validated:true,name:"Vegeta",image:"y.webp",rarity:"UR"}
]}`,context);
vm.runInContext('renderDuplicates()',context);
assert(Number(element('#dupCount').textContent.split(' ')[0])>0);
assert(element('#duplicateSummary').textContent.includes('cartes UR/LR'));
assert(element('#duplicateSummary').textContent.includes('possédées'));
assert(element('#duplicateList').innerHTML.includes('2/4'));
assert(element('#duplicateList').innerHTML.includes('Non possédée'));
assert(element('#duplicateList').innerHTML.includes('potential-line'));
console.log('potential full-catalog compact line tracker: OK');
vm.runInContext('rainbow100=new Set(); toggleRainbow100("10")',context);
assert.equal(JSON.parse(saved.get('dokkanos-rainbow100'))[0],'10');
assert.equal(vm.runInContext('rainbow100.has("10")',context),true);
assert(element('#duplicateSummary').textContent.includes('1 à 100 %'));
assert(element('#duplicateList').innerHTML.includes('🌈 100 %'));
assert(element('#duplicateList').innerHTML.includes('🌈 100 %'));
vm.runInContext('toggleRainbow100("10")',context);
assert.equal(vm.runInContext('rainbow100.has("10")',context),false);
console.log('100% potential persistence and remaining duplicates: OK');
vm.runInContext('potentialManual={}; changePotentialDuplicate("10",1); changePotentialDuplicate("10",1)',context);
assert.equal(vm.runInContext('potentialManual["10"]',context),2);
assert.equal(JSON.parse(saved.get('dokkanos-potential-manual'))["10"],2);
vm.runInContext('changePotentialDuplicate("10",1); changePotentialDuplicate("10",1); changePotentialDuplicate("10",1)',context);
assert.equal(vm.runInContext('potentialManual["10"]',context),4);
vm.runInContext('changePotentialDuplicate("10",-1)',context);
assert.equal(vm.runInContext('potentialManual["10"]',context),3);
vm.runInContext('changePotentialDuplicate("10",-1); changePotentialDuplicate("10",-1); changePotentialDuplicate("10",-1); changePotentialDuplicate("10",-1)',context);
assert.equal(vm.runInContext('potentialManual["10"]||0',context),0);
console.log('manual potential +/- persistence and bounds: OK');
vm.runInContext(`CATALOG={cards:[
{id:"900",name:"Test SSR",rarity:"SSR",awakensTo:"901"},
{id:"901",name:"Test UR",rarity:"UR",awakensTo:"902"},
{id:"902",name:"Test LR",rarity:"LR"},
{id:"910",name:"UR Final",rarity:"UR"}
]}; CACHED_FAMILIES=null; CACHED_FAMILY_BY_ID=null; DB={cards:[]}; potentialManual={}; rainbow100=new Set(); renderDuplicates()`,context);
assert(element('#duplicateList').innerHTML.includes('Test LR'));
assert(!element('#duplicateList').innerHTML.includes('Test UR'));
assert(!element('#duplicateList').innerHTML.includes('Test SSR'));
assert(element('#duplicateList').innerHTML.includes('UR Final'));
console.log('max-awakened potential family display: OK');
vm.runInContext(`CATALOG={cards:[
{id:"920",name:"Goku Super Saiyan",nameFr:"Son Goku Super Saiyan",rarity:"UR",type:"AGL"},
{id:"921",name:"Son Goku Super Saiyan",nameFr:"Son Goku Super Saiyan",rarity:"UR",type:"AGL"}
]}; CACHED_FAMILIES=null; CACHED_FAMILY_BY_ID=null; DB={cards:[]}; renderDuplicates()`,context);
const frenchDupRows=(element('#duplicateList').innerHTML.match(/potential-line /g)||[]).length;
assert.equal(frenchDupRows,1);
assert(element('#duplicateList').innerHTML.includes('Son Goku Super Saiyan'));
console.log('French canonical potential duplicate collapse: OK');
assert.equal(vm.runInContext("frCardName('Bojack')",context),'Boujack');
assert.equal(vm.runInContext("frCardName('Full Power Boujack')",context),'Boujack pleine puissance');
assert.equal(vm.runInContext("frCardName('Super Saiyan 4 Goku')",context),'Son Goku Super Saiyan 4');
assert.equal(vm.runInContext("frCardName('Super Saiyan 4 Vegeta')",context),'Vegeta Super Saiyan 4');
assert.equal(vm.runInContext("frCardName('Androids #17 & #18')",context),'C-17 & C-18');
console.log('residual English-to-French aliases: OK');
vm.runInContext('DB={cards:[{boxId:"SHEET-1",candidateId:"77",validated:true,name:"Test",image:"x.webp"}]}; rainbow100=new Set()',context);
vm.runInContext('openCard("SHEET-1")',context);
assert(element('#sheet').innerHTML.includes('Marquer potentiel 100 %'));
vm.runInContext('toggleRainbowFromCard("SHEET-1","77")',context);
assert.equal(vm.runInContext('rainbow100.has("77")',context),true);
assert(element('#sheet').innerHTML.includes('Retirer le 100 %'));
assert(element('#sheet').innerHTML.includes('Potentiel 100 %'));
console.log('100% potential character-sheet workflow: OK');
console.log('verification, persistence, unconfirmed list and catalogue images: OK');
