/* Global November 2026 edition, transcribed from the five in-game captures. */
(function(root){'use strict';
const groups=[
 ['special','Sélection spéciale',[[4000,'ATT et DÉF ennemies +400 %, PV +2 000 %',400,20]]],
 ['category','Catégorie',[[500,'Arc enfant',0,'Arc enfant'],[250,'Combattant ayant grandi sur Terre',0,'Combattant ayant grandi sur Terre']]],
 ['cost','Coût total, ami inclus',[[200,'375 ou moins',0,375],[150,'400 ou moins',0,400],[100,'500 ou moins',0,500]]],
 ...[['seal','Blocage ATT SP'],['stun','Étourdissement'],['atkDown','Réduction ATT'],['defDown','Réduction DÉF']].map(([id,label])=>[id,'Immunité · '+label,[[100,'Ennemis insensibles',8,true]]]),
 ['reduction','Réduction des dégâts ennemie',[[350,'25 %',60,25],[300,'20 %',40,20],[250,'15 %',25,15]]],
 ['growth','Hausse ATT/DÉF par tour dès la phase 3',[[200,'100 % par tour, maximum 500 %',200,100],[100,'50 % par tour, maximum 250 %',90,50]]],
 ['atk','ATT ennemie',[[400,'+3 500 %',350,3500],[350,'+3 000 %',300,3000],[300,'+2 500 %',250,2500],[250,'+2 000 %',200,2000],[150,'+1 000 %',100,1000]]],
 ['def','DÉF ennemie',[[250,'+300 %',60,300],[200,'+200 %',40,200],[150,'+150 %',30,150],[100,'+100 %',20,100],[50,'+50 %',10,50]]],
 ['hp','PV ennemis',[[400,'+4 000 %',80,4000],[300,'+3 000 %',60,3000],[200,'+2 000 %',40,2000],[150,'+1 500 %',30,1500],[100,'+1 000 %',20,1000]]],
 ['threshold','Dégâts réduits à zéro sous le seuil inclus',[[300,'3 000 000 ou moins',140,3000000],[200,'1 500 000 ou moins',60,1500000]]],
 ['orbs','Sphères de type avantageux contre le personnage',[[100,'7 % des PV max perdus par sphère, sans KO',55,true]]],
 ['ki','Ki des alliés',[[150,'−3, minimum 0',90,3],[100,'−2, minimum 0',60,2],[50,'−1, minimum 0',30,1]]],
 ['items','Objets de soutien',[[1000,'Interdits',80,true]]],
 ['memory','Mémoire de soutien',[[200,'Interdite',15,true]]]
].map(([id,label,options])=>({id,label,options:options.map(([points,label,risk,value],i)=>({id:id+'-'+i,points,label,risk,value}))}));
const all=groups.flatMap(g=>g.options);
function selected(ids){if(!Array.isArray(ids)||new Set(ids).size!==ids.length)throw Error('Sélection Burst invalide');const rows=ids.map(id=>all.find(o=>o.id===id));if(rows.some(o=>!o)||groups.some(g=>g.options.filter(o=>ids.includes(o.id)).length>1))throw Error('Options incompatibles');return rows;}
function score(ids){return selected(ids).reduce((n,o)=>n+o.points,0);}
function value(plan,id){return groups.find(g=>g.id===id).options.find(o=>plan?.ids?.includes(o.id))?.value;}
function cost(cards){return cards.length===7&&cards.every(c=>Number(c?.cost)>0)?cards.reduce((n,c)=>n+Number(c.cost),0):null;}
function plan(category,cards){const total=cost(cards);let states=new Map([[0,{ids:[],risk:0}]]);
 for(const g of groups){const choices=[null,...g.options].filter(o=>g.id==='category'?o?.value===category:g.id!=='cost'||!o||total!==null&&total<=o.value);const next=new Map();for(const [s,p]of states)for(const o of choices){const points=s+(o?.points||0);if(points>8000)continue;const candidate={ids:o?[...p.ids,o.id]:p.ids,risk:p.risk+(o?.risk||0)};if(!next.has(points)||next.get(points).risk>candidate.risk)next.set(points,candidate);}states=next;}
 const best=states.get(8000);return best?{...best,category,totalCost:total,score:8000}:null;
}
function requirements(p){if(!p)return [];const category=value(p,'category'),limit=value(p,'cost');return [...(category?[{kind:'category',value:category,count:7,includeFriend:true}]:[]),...(limit?[{kind:'cost',value:limit,count:limit,includeFriend:true}]:[])];}
function check(p,cards,E){try{if(score(p.ids)<8000)return false;return cards.length===7&&E.constraints(cards.slice(0,6),{requirements:requirements(p)},cards[6]).ok;}catch(e){return false;}}
function boss(base,p){if(!p)return base;return {...base,immuneSeal:base.immuneSeal||!!value(p,'seal'),immuneStun:base.immuneStun||!!value(p,'stun'),immuneAtk:base.immuneAtk||!!value(p,'atkDown'),immuneDef:base.immuneDef||!!value(p,'defDown'),kiDisrupt:base.kiDisrupt||!!value(p,'ki'),growth:base.growth||!!value(p,'growth'),pressure:2,burstEffects:{atk:value(p,'atk')||0,def:value(p,'def')||0,hp:value(p,'hp')||0,reduction:value(p,'reduction')||0,threshold:value(p,'threshold')||0,orbs:!!value(p,'orbs'),ki:value(p,'ki')||0,special:!!value(p,'special'),growth:value(p,'growth')||0},burst:p};}
const api={groups,score,selected,value,cost,plan,requirements,check,boss};if(typeof module!=='undefined')module.exports=api;root.DokkanBurstModel=api;
})(typeof window==='undefined'?globalThis:window);
