/* Provenance and exact-form SP calculations for the free-card catalogue. */
(function(root){
'use strict';
function index(data,catalogue=[]){
 const cards=new Map(Object.entries(data?.acquisition||{}));
 const targetsByName=new Map(),methodsByCard=new Map();
 for(const [id,name] of Object.entries(data?.cards||{})){
  if(!targetsByName.has(name))targetsByName.set(name,[]);
  targetsByName.get(name).push(id);
 }
 for(const card of catalogue){
  if(data?.cards?.[card.id]||!Object.hasOwn(data?.characters||{},card.name))continue;
  if(!targetsByName.has(card.name))targetsByName.set(card.name,[]);
  targetsByName.get(card.name).push(String(card.id));
 }
 for(const [name,row] of Object.entries(data?.characters||{})){
  for(const method of row.methods||[]){
   const ids=new Set([method.donor]);
   for(const origin of method.origins||[]){
    if(!cards.has(origin.id))cards.set(origin.id,origin);
    ids.add(origin.id);
   }
   for(const id of ids){
    if(!methodsByCard.has(id))methodsByCard.set(id,[]);
    methodsByCard.get(id).push({name,reference:String(row.sourceCardId||''),method});
   }
  }
 }
 return {cards,targetsByName,methodsByCard};
}
// Only positively identified no-payment exchange routes belong in the F2P browser.
// Selection 11: https://www.dbz-dokkanbattle.com/announcement/107165
// Super selection stones are paid and must never match the ordinary selection stone.
function freeExchange(location){
 if(location.requiresPurchase===true)return false;
 return /^(Souvenir de combat|Gemme incroyable \(verte\)|Majilite|Chocolats extra fins|Peluche Penenko \(grande\)|Pierre de richesse|Pierre Dragon sélection 11)$/.test(location.name||'')||
  /^Pièce (Festival Dokkan|Célébrations?) \(/.test(location.name||'');
}
function acquisitionLocations(row,kind){
 return (row.locations||[]).filter(l=>(l.acquisition||row.acquisition)===kind&&(kind!=='exchange'||freeExchange(l)));
}
function inAcquisition(row,kind){
 return acquisitionLocations(row,kind).length>0||(kind==='event'&&!(row.locations||[]).length&&row.acquisition===kind);
}
function acquisitionLabel(location,kind){
 const name=(location.name||'Lieu à préciser')+(location.name==='Pierre Dragon sélection 11'?' (gratuite : 30 Laits, mission quotidienne de l’école Tortue)':'');
 return kind==='exchange'?'Baba Shop · '+name+(location.price?' · '+location.price:' · Coût à vérifier'):name;
}
function rate(target,entry){
 if(String(target)===String(entry.method.donor))return 100;
 return String(target)===entry.reference&&Number.isFinite(entry.method.sourceRate)&&entry.method.sourceRate>0&&entry.method.sourceRate<=100
  ?entry.method.sourceRate:null;
}
function copies(current,goal,chance){
 if(!Number.isInteger(current)||!Number.isInteger(goal)||current<1||goal<current||goal>30)return null;
 if(goal===current)return {count:0,guaranteed:true};
 if(!Number.isFinite(chance)||chance<=0||chance>100)return null;
 const gap=goal-current;
 return {count:Math.ceil(gap*100/chance),guaranteed:chance===100};
}
const api={freeExchange,index,rate,copies,acquisitionLocations,inAcquisition,acquisitionLabel};
if(typeof module!=='undefined')module.exports=api;
root.DokkanF2PModel=api;
})(typeof window==='undefined'?globalThis:window);
