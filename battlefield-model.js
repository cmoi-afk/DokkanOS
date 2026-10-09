/* Seven owned cards, two internal leaders. No friend, no inventory mutations. */
(function(root){'use strict';
const key='dokkanos-battlefield-v1',id=c=>String(c.candidateId||c.id),record=x=>x&&typeof x==='object'&&!Array.isArray(x),types=['AGI','TEC','INT','PUI','END'],advantage={AGI:'TEC',TEC:'INT',INT:'END',PUI:'AGI',END:'PUI'};
const empty=()=>({attempts:[],plan:{},reserved:{},excluded:[],locked:[],missionTypes:{}});
function validateSession(s){
 if(!record(s)||!Array.isArray(s.attempts)||s.attempts.length>100||!record(s.plan)||!record(s.reserved)||!record(s.missionTypes)||!Array.isArray(s.excluded)||!Array.isArray(s.locked))throw Error('Session Battlefield invalide.');
 const ids=a=>Array.isArray(a)&&a.length<=10000&&a.every(v=>typeof v==='string'&&/^\d{1,20}$/.test(v))&&new Set(a).size===a.length;
 if(!ids(s.excluded)||s.locked.length>20||new Set(s.locked).size!==s.locked.length||s.locked.some(v=>typeof v!=='string'||v.length>100)||Object.keys(s.plan).length>20||Object.keys(s.reserved).length>20||Object.keys(s.missionTypes).length>20)throw Error('Cartes Battlefield invalides.');
 for(const a of Object.values(s.plan))if(!ids(a)||a.length!==7)throw Error('Une équipe Battlefield doit contenir sept cartes distinctes.');
 for(const [b,a] of Object.entries(s.reserved))if(b.length>100||!ids(a)||a.length>7)throw Error('Réservation invalide.');
 for(const t of Object.values(s.missionTypes))if(!types.includes(t))throw Error('Type de mission invalide.');
 const seen=new Set();for(const a of s.attempts){if(!record(a)||typeof a.boss!=='string'||a.boss.length>100||!ids(a.cards)||a.cards.length!==7||!['victory','defeat'].includes(a.result)||typeof a.date!=='string'||!Number.isFinite(Date.parse(a.date))||a.hp!==null&&(!Number.isFinite(a.hp)||a.hp<0||a.hp>100))throw Error('Résultat Battlefield invalide.');for(const c of a.cards){if(seen.has(c))throw Error('Carte déjà utilisée dans cette session.');seen.add(c);}}
 for(const a of Object.values(s.plan))for(const c of a){if(seen.has(c))throw Error('Carte réutilisée ou prévue pour plusieurs combats.');seen.add(c);}
 return s;
}
function validate(state){if(!record(state)||state.version!==1||typeof state.active!=='string'||state.active.length>100||!record(state.sessions)||Object.keys(state.sessions).length>8)throw Error('Suivi Battlefield invalide.');Object.values(state.sessions).forEach(validateSession);if(state.previous)validateSession(state.previous);return state;}
const used=s=>new Set(s.attempts.flatMap(a=>a.cards)),won=s=>new Set(s.attempts.filter(a=>a.result==='victory').map(a=>a.boss));
function result(s,edition,bossId,outcome,hp,pool){
 validateSession(s);const cards=s.plan[bossId],mine=new Set(pool.map(id)),spent=used(s);
 if(!edition.bosses.some(b=>b.id===bossId)||won(s).has(bossId)||!cards||cards.length!==7||cards.some(c=>!mine.has(c)||spent.has(c)))throw Error('Équipe indisponible ou combat déjà terminé. Recompose le plan.');
 if(spent.size+7>edition.slotLimit)throw Error('Budget de la session dépassé.');
 if(!['victory','defeat'].includes(outcome))throw Error('Résultat invalide.');
 const next=JSON.parse(JSON.stringify(s));next.attempts.push({boss:bossId,cards:[...cards],result:outcome,hp:outcome==='victory'?0:hp,date:new Date().toISOString()});delete next.plan[bossId];next.locked=next.locked.filter(b=>b!==bossId);for(const b of Object.keys(next.reserved))next.reserved[b]=next.reserved[b].filter(i=>!cards.includes(i));validateSession(next);return next;
}
function bossContext(E,b){return E.battleContext({combat:'survival',useZA:false,quick:true,boss:{pressure:true,available:false,locks:!!b.locks,immuneStun:!!b.stunImmune,immuneSeal:!!b.sealImmune,immuneAtk:!!b.atkDownImmune,immuneDef:!!b.defDownImmune,kiDisrupt:b.id==='yamu',seals:b.id==='evil-boo',growth:b.priority>1,bossTypes:[b.type],categoryHazards:[],maxSuperDamage:0,entries:[],bosses:[]}});}
function assess(E,team,boss,known){
 if(team.length!==7||new Set(team.map(id)).size!==7)return {valid:false,score:-Infinity};
 const [leader,sub]=team,context=bossContext(E,boss),cover=team.map(c=>[E.coverage(leader,c,known),E.coverage(sub,c,known)]);
 if(cover.some(a=>a.some(c=>!c.covered)))return {valid:false,score:-Infinity};
 const profiles=team.map(c=>E.passive(c,team,context));
 let score=cover.reduce((n,a)=>n+a.reduce((v,c)=>v+(c.hp+c.atk+c.def)/12+c.ki*2,0),0);
 score+=profiles.reduce((n,p)=>n+p.defense*1.5+p.offense+p.utility,0);
 score+=team.reduce((n,c,i)=>n+E.bossFit(c,profiles[i],context).score+(c.type===advantage[boss.type]?32:advantage[c.type]===boss.type?-35:0),0);
 const strength=profiles.map(p=>p.defense*1.5+p.offense+p.utility).sort((a,b)=>a-b);score+=(strength[0]||0)*1.4;
 score+=E.synergy(team,null,context).score;
 const anchors=profiles.filter(p=>p.slot1>=32).length;score-=Math.max(0,2-anchors)*45;
 for(let i=0;i<team.length;i++)for(let j=i+1;j<team.length;j++)score+=E.links(team[i],team[j]).length*1.2;
 return {valid:true,score,cover,profiles,anchors};
}
async function compose(E,pool,boss,known,required=[],progress=()=>{},cancel=()=>false){
 const context=bossContext(E,boss),cards=pool.map(c=>E.combatCard(c,context)),byId=new Map(cards.map(c=>[id(c),c])),fixed=required.map(c=>byId.get(c));
 if(fixed.some(c=>!c)||required.length>7)return null;
 const leaders=cards.filter(c=>c.leader&&E.coverage(c,c,known).covered).map(c=>{const cov=E.coverage(c,c,known);return {c,score:cov.hp+cov.atk+cov.def+cards.filter(x=>E.coverage(c,x,known).covered).length*.4};}).sort((a,b)=>b.score-a.score).slice(0,20);
 let best=null;for(let a=0;a<leaders.length;a++){
  if(cancel())throw Error('Recherche annulée.');
  const leader=leaders[a].c;
  for(let b=a+1;b<leaders.length;b++){
   const sub=leaders[b].c,allowed=cards.filter(c=>E.coverage(leader,c,known).covered&&E.coverage(sub,c,known).covered);
   if(allowed.length<7||!allowed.includes(leader)||!allowed.includes(sub)||fixed.some(c=>!allowed.includes(c)))continue;
   const team=[leader,sub,...fixed.filter(c=>id(c)!==id(leader)&&id(c)!==id(sub))];
   const ranked=allowed.filter(c=>!team.includes(c)).map(c=>{const p=E.passive(c,allowed,context),x=E.coverage(leader,c,known),y=E.coverage(sub,c,known);return {c,score:p.defense*1.5+p.offense+p.utility+(x.hp+x.atk+x.def+y.hp+y.atk+y.def)/12+(c.type===advantage[boss.type]?32:advantage[c.type]===boss.type?-35:0)+Math.max(0,...team.map(t=>E.links(c,t).length))*4};}).sort((a,b)=>b.score-a.score);
   team.push(...ranked.slice(0,7-team.length).map(x=>x.c));let evaluation=assess(E,team,boss,known);
   if(evaluation.valid&&(!best||evaluation.score>best.score))best={cards:team.map(id),score:evaluation.score};
  }
  progress();await new Promise(r=>setTimeout(r,0));
 }
 return best;
}
async function plan(E,pool,edition,session,known,progress=()=>{},cancel=()=>false){
 validateSession(session);const spent=used(session),completed=won(session),blocked=new Set(session.excluded),assigned=new Set(),output={},warnings=[],pending=edition.bosses.filter(b=>!completed.has(b.id));
 const mine=new Map(pool.map(c=>[id(c),c]));
 for(const b of pending.filter(b=>session.locked.includes(b.id))){const ids=session.plan[b.id]||[],team=ids.map(i=>mine.get(i));if(spent.size+assigned.size+7>edition.slotLimit||ids.length!==7||team.some(c=>!c||spent.has(id(c))||blocked.has(id(c))||assigned.has(id(c))||session.missionTypes[b.id]&&c.type!==session.missionTypes[b.id])||(session.reserved[b.id]||[]).some(i=>!ids.includes(i))||!assess(E,team,b,known).valid)throw Error('Équipe verrouillée indisponible : '+b.name);output[b.id]=[...ids];ids.forEach(i=>assigned.add(i));}
 const requests=Object.entries(session.reserved).filter(([b])=>pending.some(x=>x.id===b));const reservationOwner=new Map();for(const [b,ids]of requests)for(const i of ids){if(reservationOwner.has(i)&&reservationOwner.get(i)!==b)throw Error('Une carte est réservée à plusieurs combats.');reservationOwner.set(i,b);}
 for(const b of [...pending].sort((a,b)=>b.priority-a.priority)){
  if(cancel())throw Error('Recherche annulée.');if(output[b.id])continue;
  if(spent.size+assigned.size+7>edition.slotLimit){warnings.push(b.name+' : budget insuffisant pour une nouvelle équipe.');continue;}
  const allowed=pool.filter(c=>!spent.has(id(c))&&!assigned.has(id(c))&&!blocked.has(id(c))&&(!reservationOwner.has(id(c))||reservationOwner.get(id(c))===b.id)&&(!session.missionTypes[b.id]||c.type===session.missionTypes[b.id]));
  progress('Recherche pour '+b.name+'…');const found=await compose(E,allowed,b,known,session.reserved[b.id]||[],()=>{},cancel);
  if(found){output[b.id]=found.cards;found.cards.forEach(i=>assigned.add(i));}else warnings.push(b.name+' : sept cartes sous deux leaders compatibles introuvables. Change les réservations ou la mission.');
 }
 return {plan:output,warnings,remaining:pool.filter(c=>!spent.has(id(c))&&!assigned.has(id(c))&&!blocked.has(id(c))).map(id)};
}
function replace(E,pool,team,boss,known,index,reserved=[]){if(team.length!==7||team.some(c=>!c)||!Number.isInteger(index)||index<0||index>6)throw Error('Équipe ou position invalide.');let best=null;const required=new Set(reserved);if(required.has(id(team[index])))throw Error('Cette carte est réservée : retire sa réservation avant de la remplacer.');for(const c of pool){if(team.some(t=>id(t)===id(c)))continue;const proposed=team.map((t,i)=>i===index?c:t),evaluation=assess(E,proposed,boss,known);if(evaluation.valid&&(!best||evaluation.score>best.score))best={cards:proposed.map(id),score:evaluation.score};}return best;}
const API={key,empty,validate,validateSession,used,won,result,assess,compose,plan,replace,advantage};if(typeof module!=='undefined')module.exports=API;root.DokkanBattlefieldModel=API;
})(typeof window!=='undefined'?window:globalThis);
