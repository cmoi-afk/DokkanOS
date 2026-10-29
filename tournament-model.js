/* Personal tournament results. Rewards are observations, never inventory grants. */
(function(root){'use strict';
const key='dokkanos-tournaments-v1';
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const integer=(n,max)=>Number.isInteger(n)&&n>0&&n<=max;
const text=(v,max)=>typeof v==='string'&&v.length<=max;
function validate(rows){
 if(!Array.isArray(rows)||rows.length>500)throw Error('Historique Tenkaichi invalide');
 const ids=new Set();
 for(const r of rows){
  if(!record(r)||!text(r.id,120)||!r.id||ids.has(r.id)||!integer(r.edition,999)||!Number.isFinite(Date.parse(r.date))||!text(r.period||'',160)||!text(r.notes||'',3000)||!['unknown','received'].includes(r.rewardReceipt)||!Array.isArray(r.rankings)||r.rankings.length<1||r.rankings.length>2)throw Error('Résultat Tenkaichi invalide');
  ids.add(r.id);const scopes=new Set();
  for(const s of r.rankings){
   if(!record(s)||!['local','general'].includes(s.scope)||scopes.has(s.scope)||!integer(s.rank,10000000)||typeof s.completeRewards!=='boolean'||!Array.isArray(s.rewards)||s.rewards.length>100)throw Error('Classement Tenkaichi invalide');
   scopes.add(s.scope);
   for(const a of s.rewards)if(!record(a)||!text(a.name,200)||!a.name||!integer(a.amount,100000000))throw Error('Récompense Tenkaichi invalide');
  }
 }
 return rows;
}
const API={key,validate};if(typeof module!=='undefined')module.exports=API;root.DokkanTournamentModel=API;
})(typeof window!=='undefined'?window:globalThis);
