/* Confirmed collection and preparation facts; unknown values are never a failed task. */
(function(root){'use strict';
const C=root.DokkanCatalogModel||(typeof require==='function'?require('./catalog-model.js'):null);
const key='dokkanos-my-collection-v1',norm=C.norm;
function validate(p){if(!p||!['cards','prepare','favorites'].includes(p.tab)||!['name','recent','rarity','priority'].includes(p.sort)||!['all','todo','unknown'].includes(p.status))throw Error('Préférences de collection invalides.');return {tab:p.tab,sort:p.sort,status:p.status};}
function recentDates(history=[]){const out={};for(const h of history){const time=Date.parse(h.at);if(!Number.isFinite(time))continue;for(const x of h.changes||[]){const id=h.kind==='inventory'&&x.after==='owned'?x.id:h.kind==='edits'&&x.after?.validated===true?x.after.candidateId:null;if(id)out[String(id)]=Math.max(out[String(id)]||0,time);}}return out;}
function build(cards,owned,profiles={},favoriteIds=new Set(),usedIds=new Set(),recent={}){
 const ids=new Set([...owned].map(String)),g=C.awakeningGraph(cards),byId=new Map(cards.map(c=>[String(c.id),c])),zRank={base:0,ztur:1,zlr:1,superZtur:2,superZlr:2};
 return cards.filter(c=>ids.has(String(c.id))&&C.allowed(c)&&!g.descendants(c.id).some(id=>ids.has(id))).map(c=>{
  const id=String(c.id),p=profiles[id]||{},tasks=[],add=(kind,label,target)=>tasks.push({kind,label,...(target?{target}:{})}),versions=C.variants(c),real=C.selectKit(c,p.awakening||'base');
  const immediate=[...(g.next.get(id)||[])].filter(next=>byId.has(next)&&C.allowed(byId.get(next))),steps=immediate.filter(next=>!immediate.some(other=>other!==next&&g.descendants(other).includes(next)));
  if(steps.length)add('todo','Éveil suivant : '+steps.map(id=>byId.get(id).rarity+' · '+byId.get(id).name).join(' / '),steps[0]);
  if(versions.length){if(!p.awakening||p.awakening==='unknown')add('unknown','Éveil Z réalisé à renseigner');else if(p.awakening!=='base'&&!versions.some(v=>v.kind===p.awakening))add('unknown','Éveil Z déclaré à vérifier dans cette fiche');else{const next=versions.find(v=>(zRank[v.kind]||0)>(zRank[p.awakening]||0));if(next)add('todo',next.label+' disponible · réalisation à confirmer en jeu');}}
  const sa=Number.isInteger(p.sa)&&p.sa>=1?p.sa:null,max=Number(real.maxSALevel)||null;
  if(sa===null)add('unknown','Niveau ATT SP à renseigner');else if(max&&sa<max)add('todo','ATT SP : '+sa+'/'+max);else if(max&&sa>max)add('unknown','ATT SP déclarée supérieure au maximum de ce kit : vérifier l’éveil');
  const potential=Number.isInteger(p.potential)&&p.potential>=0&&p.potential<=100?p.potential:null;
  if(['UR','LR'].includes(c.rarity)){if(potential===null)add('unknown','Potentiel à renseigner');else if(potential<100)add('todo','Potentiel déclaré : '+potential+' % · à améliorer selon tes doublons');}
  const links=[...new Set(c.links||[])],known=links.filter(k=>Number.isInteger(p.links?.[k])&&p.links[k]>=1&&p.links[k]<=10),low=known.filter(k=>p.links[k]<10);
  if(known.length<links.length)add('unknown','Niveaux de liens à renseigner : '+known.length+'/'+links.length);
  if(low.length)add('todo',low.length+' lien(s) renseigné(s) sous le niveau 10');
  const used=usedIds.has(id),todo=tasks.some(t=>t.kind==='todo'),unknown=tasks.some(t=>t.kind==='unknown');
  return {card:c,id,tasks,used,todo,unknown,favorite:favoriteIds.has(id),recent:recent[id]||0,priority:(used?100:0)+(todo?20:0)+(unknown?1:0)};
 });
}
function preparationGroup(row,group){
 if(!group)return true;
 if(group==='ready')return !row.tasks.length;
 const prefixes={awakening:/^Éveil|disponible · réalisation/,sp:/ATT SP/,potential:/^Potentiel/};
 return row.tasks.some(task=>prefixes[group]?.test(task.label));
}
function filter(rows,p={}){const q=norm(p.query),rank={LR:3,UR:2,SSR:1};return rows.filter(r=>preparationGroup(r,p.group)&&(p.tab!=='favorites'||r.favorite)&&(p.tab!=='prepare'||p.group==='ready'||r.tasks.length>0)&&(p.tab!=='prepare'||p.status!=='todo'||r.todo)&&(p.tab!=='prepare'||p.status!=='unknown'||r.unknown)&&(!p.type||r.card.type===p.type)&&(!p.rarity||r.card.rarity===p.rarity)&&(!q||norm([r.id,r.card.name,...(r.card.categories||[]),...(r.card.links||[])].join(' ')).includes(q))).sort((a,b)=>p.sort==='recent'?b.recent-a.recent||a.card.name.localeCompare(b.card.name,'fr'):p.sort==='rarity'?(rank[b.card.rarity]||0)-(rank[a.card.rarity]||0)||a.card.name.localeCompare(b.card.name,'fr'):p.sort==='priority'?b.priority-a.priority||a.card.name.localeCompare(b.card.name,'fr'):a.card.name.localeCompare(b.card.name,'fr'));}
const API={key,validate,recentDates,build,filter};if(typeof module!=='undefined')module.exports=API;root.DokkanMyCollectionModel=API;
})(typeof window==='undefined'?globalThis:window);
