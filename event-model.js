/* Event progress is local and explicitly confirmed; composition never completes a mission. */
(function(root){'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
// Link existing mission identities; never generate completion, rewards or fuzzy targets.
function linkMissions(events){
 const copies=events.map(e=>({...e,missions:[...(e.missions||[])]})),byId=new Map(copies.map(e=>[e.id,e])),byName=new Map();
 const combat=e=>!e.hidden&&!e.aliasOf&&!/^Missions/.test(e.kind||'')&&!/^mission-|^board-missions-/.test(e.id)&&e.kind!=='Burst Mode';
 const nameKey=s=>norm(s).replace(/[^a-z0-9]/g,'');
 for(const e of copies)if(combat(e)){const key=nameKey(e.name);if(!byName.has(key))byName.set(key,[]);byName.get(key).push(e);}
 const signature=m=>JSON.stringify([norm(m.description||m.title),m.stageId||'',m.stageNumber||'',m.start||'',m.end||'',(m.rewards||[]).map(r=>[r.kind,r.name,r.amount]).sort()]);
 const seen=new Map(copies.map(e=>[e.id,{ids:new Set(e.missions.map(m=>m.id)),signatures:new Set(e.missions.map(signature))}]));
 for(const source of events){
  if(source.aliasOf)continue;
  const isEX=(source.missions||[]).some(m=>/missions?\s+EX\b/i.test(m.description||m.title||''))||/missions?\s+EX\b/i.test(source.name||'');
  for(const mission of source.missions||[]){
   let target=byId.get(mission.combatEventId);
   if(!target){const names=[...(mission.description||'').matchAll(/(?:événement|evenement)[^"«]{0,80}["«]([^"»]+)["»]/gi)].map(x=>x[1]),matches=[...new Set(names.flatMap(name=>byName.get(nameKey(name))||[]))];if(matches.length===1)target=matches[0];}
   if(!target||!combat(target)||target.id===source.id)continue;
   const linked={...mission,combatEventId:target.id,origin:{eventId:source.id,eventName:source.name,label:isEX?'Missions EX':source.kind||'Missions externes',source:source.source}};
   if(!linked.stageNumber&&!linked.stageId){const match=(linked.description||'').match(/\bniveau\s+(\d+)\b/i);if(match)linked.stageNumber=Number(match[1]);}
   if(!linked.start&&source.start)linked.start=source.start;if(!linked.end&&source.end)linked.end=source.end;
   const group=seen.get(target.id),key=signature(linked);if(group.ids.has(linked.id)||group.signatures.has(key))continue;
   target.missions.push(linked);group.ids.add(linked.id);group.signatures.add(key);
  }
 }
 return copies;
}
function missionSummary(events,state,now=Date.now()){const unique=new Map();for(const e of events){if(e.hidden)continue;const open=['active','permanent'].includes(status(e,now));for(const m of e.missions||[])if(!unique.has(m.id))unique.set(m.id,{m,open});else if(open)unique.get(m.id).open=true;}const rows=[...unique.values()];return {total:rows.length,completed:rows.filter(x=>done(x.m,state)).length,stones:rows.filter(x=>x.open).reduce((n,x)=>n+stones({missions:[x.m]},state),0)};}
function status(e,now=Date.now()){const start=Date.parse(e.start),end=Date.parse(e.end);if(e.datePrecision==='day'&&e.end&&new Date(now).toLocaleDateString('sv-SE',{timeZone:'Europe/Paris'})===e.end.slice(0,10))return'unknown';if(Number.isFinite(start)&&now<start)return'upcoming';if(Number.isFinite(end)&&now>=end)return'closed';if(e.permanent)return'permanent';return ['active','closed','upcoming'].includes(e.status)?e.status:'unknown';}
function done(m,progress){return progress[m.id]?.done===true;}
function rewards(m){return(m.rewards||[]).filter(r=>r&&typeof r.name==='string'&&Number.isFinite(r.amount)&&r.amount>0);}
function progress(e,state){const missions=e.missions||[],completed=missions.filter(m=>done(m,state)).length,claimed=missions.filter(m=>state[m.id]?.claimed===true).length;return {total:missions.length,completed,claimed,percent:missions.length?Math.round(100*completed/missions.length):0};}
function stones(e,state,onlyRemaining=true){return(e.missions||[]).filter(m=>!onlyRemaining||state[m.id]?.claimed!==true&&(!m.end||Date.parse(m.end)>Date.now())&&(!m.start||Date.parse(m.start)<=Date.now())).flatMap(rewards).filter(r=>r.kind==='stones').reduce((s,r)=>s+r.amount,0);}
function filter(events,settings,state,now=Date.now()){const query=norm(settings.query);return events.filter(e=>!e.hidden&&(!query||norm([e.name,e.kind,...(e.missions||[]).flatMap(m=>[m.title,m.description,...(m.requirements||[]).map(r=>r.value)])].join(' ')).includes(query))&&(!settings.kind||e.kind===settings.kind)&&(!settings.status||settings.status==='all'||(settings.status==='available'?['active','permanent'].includes(status(e,now)):status(e,now)===settings.status))&&(!settings.todo||(e.missions||[]).some(m=>!done(m,state)))&&(!settings.favorite||settings.favorites.includes(e.id))).sort((a,b)=>settings.sort==='stones'?stones(b,state)-stones(a,state):settings.sort==='name'?a.name.localeCompare(b.name,'fr'):(Date.parse(a.end)||Infinity)-(Date.parse(b.end)||Infinity)||a.name.localeCompare(b.name,'fr'));}
function combine(event,stageId,missionIds){const stage=(event?.stages||[]).find(s=>String(s.id)===String(stageId)),missions=(event?.missions||[]).filter(m=>missionIds.includes(m.id)),requirements=[...(stage?.requirements||[]),...missions.flatMap(m=>m.requirements||[])];const unique=new Map();for(const r of requirements){const key=JSON.stringify([r.kind,r.value,r.ids,r.includeFriend]);const old=unique.get(key);if(!old||r.count>old.count)unique.set(key,{...r});}return {requirements:[...unique.values()],stage,missions,manualCheck:!!stage?.manualCheck||missions.some(m=>m.manualCheck),title:missions.map(m=>m.title).join(' + ')||stage?.name||event?.name||'',notes:missions.map(m=>m.notes||m.description).filter(Boolean).join('\n'),disableDodge:!!stage?.disableDodge};}
const API={norm,status,done,rewards,progress,stones,filter,combine,linkMissions,missionSummary};if(typeof module!=='undefined')module.exports=API;root.DokkanEventModel=API;
})(typeof window!=='undefined'?window:globalThis);
