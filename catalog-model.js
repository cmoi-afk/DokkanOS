/* Catalogue data rules; no inferred awakenings or ownership. */
(function(root){
'use strict';
const labels={ztur:'ZTUR',superZtur:'Super ZTUR',zlr:'ZLR',superZlr:'Super ZLR'};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\bssj\s*(\d?)\b/g,(_,n)=>'super saiyan '+n).replace(/\bkid\s+(?:boo|buu)\b/g,'boo petit').replace(/[()]/g,' ').replace(/\s+/g,' ').trim();
const allowed=c=>!!c&&['SSR','UR','LR'].includes(c.rarity)&&!c.isSellingOnly&&!c.nonPlayable;
const variants=c=>(c?.zAwakenings||[]).filter(v=>v&&labels[v.kind]&&v.verified===true&&v.available!==false&&v.kit&&typeof v.kit==='object').map(v=>({...v,label:labels[v.kind]}));
const selectKit=(c,key='base')=>{const v=variants(c).find(v=>v.kind===key);return v?{...c,...v.kit,fr:undefined,_kitVersion:key,_kitLabel:v.label,_kitSource:v.source}: {...c,_kitVersion:'base',_kitLabel:'Avant éveil Z'};};
function filter(cards,state={}){
 const playable=cards.filter(allowed),byId=new Map(playable.map(c=>[String(c.id),c])),terms=norm(state.query).split(' ').filter(Boolean);
 return playable.filter(c=>{
  if(state.forms!=='all'&&c.awakensTo&&byId.has(String(c.awakensTo)))return false;
  if(state.scope==='owned'&&c._state!=='owned')return false;
  if(state.scope==='missing'&&c._state==='owned')return false;
  if(state.scope==='review'&&c._state!=='review')return false;
  if(state.rarity&&c.rarity!==state.rarity)return false;
  if(state.type&&c.type!==state.type)return false;
  if(state.class&&c.class!==state.class)return false;
  const z=variants(c);
  if(state.z==='any'&&!z.length)return false;
  if(state.z==='none'&&z.length)return false;
  if(state.z&&labels[state.z]&&!z.some(v=>v.kind===state.z))return false;
  if(state.kit==='complete'&&c.dataStatus?.kit!=='verified')return false;
  if(state.kit==='partial'&&c.dataStatus?.kit==='verified')return false;
  const text=norm([c.id,c.name,c.title,c.rarity,c.type,c.class,...(c.categories||[]),...(c.links||[])].join(' '));return terms.every(t=>text.includes(t));
 }).sort((a,b)=>state.sort==='name'?String(a.name).localeCompare(String(b.name),'fr'):state.sort==='id'?Number(b.id)-Number(a.id):(Number(b.openAt||0)-Number(a.openAt||0)||Number(b.id)-Number(a.id)));
}
const API={allowed,variants,selectKit,filter,norm,labels};if(typeof module!=='undefined')module.exports=API;root.DokkanCatalogModel=API;
})(typeof window!=='undefined'?window:globalThis);
