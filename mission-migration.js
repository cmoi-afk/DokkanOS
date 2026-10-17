/* Reconcile sourced mission identities without changing unplayed objectives. */
(function(root){'use strict';
const jsonKeys=['dokkanos-events-progress-v1','dokkanos-saved-teams-v2','dokkanos-team-battles-v1','dokkanos-team-settings-v2','dokkanos-events-settings-v1','dokkanos-journal-v1','dokkanos-progression-v1','dokkanos-workbench-v1','dokkanos-team-planner-v1'];
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function transform(value,aliases){
 if(typeof value==='string')return aliases[value]||value;
 if(Array.isArray(value)){const next=value.map(v=>transform(v,aliases));return next.every(v=>typeof v==='string')&&value.some((v,i)=>v!==next[i])?[...new Set(next)]:next;}
 if(record(value))return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,transform(v,aliases)]));
 return value;
}
function plan(entries,input){
 const aliases=Object.fromEntries(Object.entries(input||{}).filter(([a,b])=>/^[\w-]{1,180}$/.test(a)&&typeof b==='string'&&/^[\w-]{1,180}$/.test(b)&&a!==b));
 const result={...entries};
 for(const key of jsonKeys){
  if(typeof entries[key]!=='string')continue;
  const value=JSON.parse(entries[key]);
  if(key==='dokkanos-events-progress-v1'){
   if(!record(value))throw Error('Progression de missions illisible');
   const next={...value};
   for(const [from,to]of Object.entries(aliases)){
    const old=next[from],current=next[to];
    const proved=old?.done===true||entries['dokkanos-mission-done-'+from]==='yes';
    if(!old&&!proved)continue;
    const done=proved||current?.done===true;
    next[to]={...current,done,claimed:done&&(old?.claimed===true||current?.claimed===true)};
   }
   if(JSON.stringify(next)!==JSON.stringify(value))result[key]=JSON.stringify(next);
  }else{
   const next=transform(value,aliases);
   if(JSON.stringify(next)!==JSON.stringify(value))result[key]=JSON.stringify(next);
  }
 }
 for(const [from,to]of Object.entries(aliases)){
  const oldKey='dokkanos-mission-done-'+from,newKey='dokkanos-mission-done-'+to;
  if(entries[oldKey]==='yes')result[newKey]='yes';
 }
 return result;
}
function apply(storage,aliases){
 const keys=[...jsonKeys,...Object.entries(aliases||{}).flatMap(([a,b])=>['dokkanos-mission-done-'+a,'dokkanos-mission-done-'+b])];
 const before=Object.fromEntries([...new Set(keys)].map(k=>[k,storage.getItem(k)])),next=plan(before,aliases);
 const changed=Object.keys(next).filter(k=>next[k]!==before[k]);
 try{for(const k of changed)storage.setItem(k,next[k]);}
 catch(error){let reverted=true;for(const k of changed)try{if(before[k]===null)storage.removeItem(k);else storage.setItem(k,before[k]);}catch(_){reverted=false;}throw Error(reverted?'Rattachement des missions reporté : stockage indisponible.':'Rattachement interrompu : conserve ta sauvegarde.');}
 return changed;
}
const API={plan,apply};if(typeof module!=='undefined')module.exports=API;root.DokkanMissionMigration=API;
})(typeof window!=='undefined'?window:globalThis);
