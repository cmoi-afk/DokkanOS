/* Catalogue data rules; no inferred awakenings or ownership. */
(function(root){
'use strict';
const labels={ztur:'ZTUR',superZtur:'Super ZTUR',zlr:'ZLR',superZlr:'Super ZLR'};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\bssj\s*(\d?)\b/g,(_,n)=>'super saiyan '+n).replace(/\bkid\s+(?:boo|buu)\b/g,'boo petit').replace(/[()]/g,' ').replace(/\s+/g,' ').trim();
const allowed=c=>!!c&&['SSR','UR','LR'].includes(c.rarity)&&!c.isSellingOnly&&!c.nonPlayable;
const variants=c=>(c?.zAwakenings||[]).filter(v=>v&&labels[v.kind]&&v.verified===true&&v.available!==false&&v.kit&&typeof v.kit==='object').map(v=>({...v,label:labels[v.kind]}));
const selectKit=(c,key='base')=>{const v=variants(c).find(v=>v.kind===key);if(!v)return {...c,_kitVersion:'base',_kitLabel:'Avant éveil Z'};const base=c._baseCombatKit||Object.fromEntries([...new Set((c.zAwakenings||[]).flatMap(v=>Object.keys(v.kit||{})))].map(k=>[k,c[k]??null]));return {...c,_baseCombatKit:base,...v.kit,fr:undefined,_kitVersion:key,_kitLabel:v.label,_kitSource:v.source};};
function awakeningGraph(cards){
 const byId=new Map(cards.map(c=>[String(c.id),c])),next=new Map(),previous=new Map();
 const link=(a,b)=>{a=String(a||'');b=String(b||'');if(!a||!b||a===b)return;if(!next.has(a))next.set(a,new Set());next.get(a).add(b);if(!previous.has(b))previous.set(b,new Set());previous.get(b).add(a);};
 for(const c of cards){if(c.awakensTo)link(c.id,c.awakensTo);if(c.awakensFrom)link(c.awakensFrom,c.id);}
 // The initial Z-awakened UR shares the exact SSR resource, title and type.
 // Never merge characters just because they have the same name.
 for(const c of cards){if(c.rarity!=='SSR')continue;const ur=byId.get(String(Number(c.id)+1));if(!ur||ur.rarity!=='UR'||!c.resourceId||String(c.resourceId)!==String(ur.resourceId)||c.name!==ur.name||c.title!==ur.title||c.type!==ur.type)continue;link(c.id,ur.id);if(c.awakensTo&&String(c.awakensTo)!==String(ur.id))link(ur.id,c.awakensTo);}
 function walk(id,edges){const seen=new Set([String(id)]),out=[],queue=[String(id)];for(let i=0;i<queue.length;i++)for(const n of edges.get(queue[i])||[]){if(seen.has(n))continue;seen.add(n);out.push(n);queue.push(n);}return out;}
 return {next,previous,descendants:id=>walk(id,next),family(id){const edges=new Map();for(const [a,bs] of next)for(const b of bs){if(!edges.has(a))edges.set(a,new Set());if(!edges.has(b))edges.set(b,new Set());edges.get(a).add(b);edges.get(b).add(a);}const rank={LR:4,UR:3,SSR:2,SR:1};return [String(id),...walk(id,edges)].map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>(rank[b.rarity]||0)-(rank[a.rarity]||0)||Number(b.id)-Number(a.id));}};
}
function collectionState(cards,owned,inventory={},graph=awakeningGraph(cards)){
 const confirmed=new Set([...owned].map(String)),playableIds=new Set(cards.filter(allowed).map(c=>String(c.id)));
 return cards.map(c=>{const id=String(c.id),covered=graph.descendants(id).find(id=>confirmed.has(id));return {...c,_state:confirmed.has(id)?'owned':inventory[id]==='missing'?'missing':'review',_coveredBy:covered||'',_hasNext:graph.descendants(id).some(id=>playableIds.has(id))};});
}
function filter(cards,state={}){
 const playable=cards.filter(allowed),byId=new Map(playable.map(c=>[String(c.id),c])),terms=norm(state.query).split(' ').filter(Boolean);
 return playable.filter(c=>{
  if(state.view==='validation'&&c._coveredBy)return false;
  if(state.forms!=='all'&&(c._hasNext||c.awakensTo&&byId.has(String(c.awakensTo))))return false;
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
const API={awakeningGraph,collectionState,allowed,variants,selectKit,filter,norm,labels};if(typeof module!=='undefined')module.exports=API;root.DokkanCatalogModel=API;
})(typeof window!=='undefined'?window:globalThis);
