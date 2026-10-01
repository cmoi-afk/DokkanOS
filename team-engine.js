/* DokkanOS: conservative, explainable team analysis. No combat simulation. */
(function(root){
'use strict';
const NORMALIZED=new Map();
const norm=value=>{const s=String(value||'');if(NORMALIZED.has(s))return NORMALIZED.get(s);const n=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();if(NORMALIZED.size>=8192)NORMALIZED.clear();NORMALIZED.set(s,n);return n;};
const ALIASES={
 'dernier recours':'dernier atout','final trump card':'dernier atout','saiyans purs':'saiyan pur','pure saiyans':'saiyan pur',
 'sworn enemies':'ennemi jure','ennemis jures':'ennemi jure','demonic power':'pouvoir demoniaque','puissance demoniaque':'pouvoir demoniaque',
 'majin buu saga':'saga de boo','majin power':'pouvoir de majin','golden fighters':'combattant dore','combattants dores':'combattant dore',
 'famille de goku':'famille de son goku',"goku's family":'famille de son goku','saiyans de sang mele':'saiyan de sang-mele',
 'race saiyan':'race guerriere saiyan','saiyan warrior race':'race guerriere saiyan','prepared for battle':'pare au combat',
 'fierce battle':'combat acharne','legendary power':'pouvoir legendaire','infinite regeneration':'regeneration infinie',
 'big bad bosses':'boss','jugement serein':'jugement froid','genie':'prodiges','intello':'cerveau'
};
const canonical=s=>ALIASES[norm(s)]||norm(s);
const className=s=>norm(s)==='extreme'?'extreme':norm(s);
const TYPES=['AGI','TEC','INT','PUI','END'], aliases={AGL:'AGI',TEQ:'TEC',STR:'PUI',PHY:'END'};
const type=s=>aliases[String(s).toUpperCase()]||String(s).toUpperCase();
const skill=v=>typeof v==='string'?v:Array.isArray(v)?v.map(skill).join(' '):v?.description||'';
const identity=c=>String(c.candidateId||c.id||c.boxId);
const instance=c=>String(c.boxId||identity(c));
const same=(a,b)=>norm(a.name)&&norm(a.name)===norm(b.name);
const links=(a,b)=>same(a,b)?[]:[...new Set(a.links||[])].filter(x=>(b.links||[]).some(y=>canonical(y)===canonical(x)));
const CATEGORY_CACHE=new WeakMap();
const cats=c=>{const key=(c.categories||[]).join('\u0000'),old=CATEGORY_CACHE.get(c);if(old?.key===key)return old.value;const value=new Set((c.categories||[]).map(canonical));CATEGORY_CACHE.set(c,{key,value});return value;};
function quoted(s){return [...s.matchAll(/["«“]([^"»”]+)["»”]/g)].map(x=>x[1]);}
function percentages(s){s=s.replace(/\//g,' et ');const out={hp:0,atk:0,def:0};let found=false;for(const m of s.matchAll(/((?:(?:PV|HP|ATT|ATK|D[EÉ]F|DEF|et|and|,|\s)+))\s*\+\s*(\d+)\s*%/gi)){const k=norm(m[1]),p=+m[2];if(/\b(pv|hp)\b/.test(k))out.hp=p;if(/\b(att|atk)\b/.test(k))out.atk=p;if(/\bdef\b/.test(k))out.def=p;found=true;}return {stats:out,found};}
function selector(s,known){let q=quoted(s),categories=q.length?q:known.filter(c=>norm(s).includes(norm(c)));const types=TYPES.filter(t=>new RegExp('\\b'+t+'\\b','i').test(s)).concat(Object.keys(aliases).filter(t=>new RegExp('\\b'+t+'\\b','i').test(s)).map(type));const n=norm(s),classes=[];if(/extreme|\bext\.|type e\./.test(n))classes.push('extreme');if(/\bsuper\b|type s\.|\bs\.\s*(agi|tec|int|pui|end)/.test(n))classes.push('super');return {categories,types:[...new Set(types)],classes,all:/tous les types|all types/.test(n)};}
function matches(rule,c){const ct=cats(c);if(rule.categories.length)return rule.categories.some(x=>ct.has(canonical(x)));if(rule.types.length||rule.classes.length)return (!rule.types.length||rule.types.includes(type(c.type)))&&(!rule.classes.length||rule.classes.includes(className(c.class)));return rule.all;}
function leaderRules(c,known=[]){if(c?.teamRules?.leader)return {clauses:c.teamRules.leader,verified:true};const s=skill(c?.leader).replace(/\n/g,' ');if(!s)return {clauses:[],unknown:true};
 // Explicit additional clauses never grant base coverage on their own.
 const split=s.split(/(?:;\s*|\s+(?:et|and)\s+)?(?=(?:PV|HP|ATT|ATK|D[EÉ]F)(?:\s|,|et|and|PV|HP|ATT|ATK|D[EÉ]F)*\+\s*\d+\s*%\s*(?:supplementaires|supplémentaires|en plus|additional))/i);
 const base=split.shift()||'',bonus=split.join(' ');const chunks=base.split(/\s*(?:;|\bou\b|\bor\b)\s*(?=ki\s*\+)/i);let clauses=chunks.map(t=>{const p=percentages(t),r=selector(t,known);return {...r,...p.stats,kind:'base',known:p.found&&(r.categories.length>0||r.types.length>0||r.classes.length>0||r.all)};});
 if(bonus){const p=percentages(bonus);clauses.push({...selector(bonus,known),...p.stats,kind:'bonus',known:p.found});}
 return {clauses,unknown:clauses.some(x=>!x.known),verified:false};}
function coverage(leader,c,known=[]){const r=leaderRules(leader,known),base=r.clauses.filter(x=>x.kind!=='bonus'&&x.known&&matches(x,c));if(!base.length)return {covered:false,unknown:!!r.unknown||!r.clauses.length,hp:0,atk:0,def:0,reasons:[]};let best=base.sort((a,b)=>(b.hp+b.atk+b.def)-(a.hp+a.atk+a.def))[0],bonus=r.clauses.filter(x=>x.kind==='bonus'&&x.known&&matches(x,c)),extra={hp:0,atk:0,def:0};bonus.forEach(x=>['hp','atk','def'].forEach(k=>extra[k]=Math.max(extra[k],x[k]||0)));return {covered:true,unknown:!!r.unknown,...Object.fromEntries(['hp','atk','def'].map(k=>[k,(best[k]||0)+extra[k]])),reasons:best.categories.length?best.categories:best.types.length?best.types:best.classes.length?best.classes:['Tous types']};}
// Keep a manually selected Z kit; otherwise the optional projection uses verified available kits.
function combatCard(c,context={}){if(!c||context.useZA!==true||c._kitVersion&&c._kitVersion!=='base')return c;const order={ztur:1,zlr:1,superZtur:2,superZlr:2};const v=(c.zAwakenings||[]).filter(x=>x.verified===true&&x.available!==false&&x.kit&&order[x.kind]).sort((a,b)=>order[b.kind]-order[a.kind])[0];return v?{...c,...v.kit,fr:undefined,_kitVersion:v.kind,_kitLabel:({ztur:'ZTUR',zlr:'ZLR',superZtur:'Super ZTUR',superZlr:'Super ZLR'})[v.kind],_kitProjected:true}:c;}
function effectWeight(e,context){if(e.state==='active')return 1;if(e.state==='missing'||e.state==='unknown')return 0;const n=norm(e.condition);
 // Enemy/HP/random/one-shot effects do not become guaranteed strength.
 if(/pv|hp|ennemi|enemy|chance|[1１] fois|activation.*active/.test(n))return .15;
 if(/2e|3e|2nd|3rd/.test(n))return .65;
 if(/1re|1er|1st/.test(n))return .45;
 if(/lors de l'attaque|when attacking|ki a (12|18)|au moment d'encaisser/.test(n))return .7;
 if(/chaque attaque|chaque att sp|attaques.*combat|att sp.*combat/.test(n))return context.combat==='short'?.25:.6;
 if(/tours.*apparition|tour.*apparition/.test(n))return context.combat==='short'?.9:.45;
 if(/sph.*ki|ki.*24/.test(n))return .35;
 return .2;}
function effectFeatures(text,context={}){const n=norm(text),stats=percentages(text).stats;
 const reduction=Math.min(90,[...n.matchAll(/(?:reduction des degats|damage reduction)[^\d%]{0,24}\+?\s*(\d+)\s*%/g)].reduce((v,x)=>v+Number(x[1]),0));
 const guard=/garde.*(?:toutes|tous)|guard.*all/.test(n),dodge=!context.disableDodge&&/esquiv|dodge/.test(n);
 return {stats,reduction,guard,dodge,defense:Math.min(35,stats.def/12)+reduction*.55+(guard?28:0)+(dodge?16:0),offense:Math.min(40,stats.atk/12)+(/critique|critical/.test(n)?10:0)+(/att sp supplementaire|attaque supplementaire|additional/.test(n)?14:0),ki:/ki.*(?:en plus|arc-en-ciel)|changement.*sph/.test(n)?6:0};}
function passive(c,team=[],context={}){const text=skill(c.passive),sections=text.split(/\*([^*]+)\*/),effects=[],warnings=[];if(sections[0].trim())effects.push({condition:'À vérifier',text:sections[0],state:'unknown'});for(let i=1;i<sections.length;i+=2){const condition=sections[i],n=norm(condition);let state=/effets de base|basic effect|unconditional/.test(n)?'active':'conditional';const requirements=quoted(condition);if(requirements.length&&/alli|equipe|team|categorie|category/.test(n)&&!/tour|rotation|turn|pv|hp|ennemi|enemy|pour chaque|for each/.test(n)){
 const others=team.filter(x=>instance(x)!==instance(c));
 const count=Math.max(0,...requirements.map(r=>others.filter(x=>cats(x).has(canonical(r))||norm(x.name)===norm(r)).length));
 const needed=Number(n.match(/(?:au moins|at least)\s*(\d+)/)?.[1]||1);
 state=/tous les allies|all allies/.test(n)?(team.length>=7&&team.every(x=>requirements.some(r=>cats(x).has(canonical(r))))?'active':'conditional'):count>=needed?'active':'missing';
 }if(/esquiv|dodge/.test(n)&&context.disableDodge)state='missing';effects.push({condition,text:sections[i+1]||'',state});}
 if(!text)warnings.push('Passif absent : puissance non évaluée.');const active=effects.filter(x=>x.state==='active').map(x=>x.text).join(' '),conditional=effects.filter(x=>x.state!=='active').map(x=>x.text).join(' ');const n=norm(active),all=norm(text),roles=[];const reduction=Math.max(0,...[...n.matchAll(/(?:reduction des degats|damage reduction)[^\d%]{0,20}?\+?\s*(\d+)\s*%/g)].map(x=>+x[1]));const healing=Math.max(0,...[...n.matchAll(/(?:recuperation|recupere|soin|recover)[^\d%]{0,20}?(\d+)\s*%/g)].map(x=>+x[1]));if(healing)roles.push('Soin');const guard=/garde.*(?:toutes|tous)|guard.*all/.test(n);const dodge=!context.disableDodge&&/esquiv|dodge/.test(n);if(reduction||guard)roles.push('Protection détectée');if(dodge)roles.push('Esquive');if(/alli[eé]s|allies/.test(n)&&/ki|att|atk|def/.test(n))roles.push('Soutien');if(/critique|critical/.test(n))roles.push('Critique');if(/supplementaire|additional/.test(n))roles.push('Attaques supplémentaires');if(/reanim|reviv/.test(all))roles.push('Réanimation conditionnelle');const special=norm(skill(c.superAttack));if(/augmente.*def|raises.*def/.test(special)&&!/pendant \d|for \d.*turn/.test(special))roles.push('Accumulation DEF possible');if(context.disableDodge&&/esquiv|dodge/.test(all))warnings.push('Esquive désactivée pour ce combat.');effects.filter(x=>x.state==='missing').forEach(x=>warnings.push('Condition non remplie : '+x.condition));const base=effectFeatures(active,context),projected=effects.filter(e=>e.state==='conditional').map(e=>({e,f:effectFeatures(e.text,context),w:effectWeight(e,context)}));
 const potentialDefense=Math.min(45,projected.reduce((v,x)=>v+x.f.defense*x.w,0)),potentialOffense=Math.min(55,projected.reduce((v,x)=>v+x.f.offense*x.w,0));
 let defense=base.defense+Math.min(15,healing*.3)+potentialDefense,utility=(roles.includes('Soutien')?8:0)+base.ki,offense=base.offense+potentialOffense;
 // Slot 1 cannot rely on bonuses that require launching an attack first.
 const slot1=base.defense+Math.min(24,projected.filter(x=>/1re|1er|avant.*attaque|au moment d.encaisser|tours.*apparition/.test(norm(x.e.condition))).reduce((v,x)=>v+x.f.defense*x.w,0));
 const sa=norm(skill(c.superAttack)+' '+skill(c.ultraSuperAttack));if(/augmente.*def|raises.*def/.test(sa))defense+=/fortement|greatly/.test(sa)?12:8;
 if(potentialDefense>0)roles.push('Protection conditionnelle');return {effects,roles,reduction,healing,guard,defense,slot1,potentialDefense,potentialOffense,utility,offense,conditional:!!conditional,warnings,complete:!!text&&!!c.links?.length&&!!c.categories?.length&&c.categoriesComplete!==false};}
function constraints(team,mission={},friend=null){const rows=[];for(const r of mission.requirements||[]){let cards=r.includeFriend&&friend?[...team,friend]:team;let count=0,need=r.count||1;if(r.kind==='category')count=cards.filter(c=>cats(c).has(canonical(r.value))).length;else if(r.kind==='type')count=cards.filter(c=>type(c.type)===type(r.value)).length;else if(r.kind==='class')count=cards.filter(c=>className(c.class)===norm(r.value)).length;else if(r.kind==='card')count=cards.filter(c=>String(c.candidateId||c.id)===String(r.value)).length;else if(r.kind==='types'){count=new Set(cards.map(c=>type(c.type)).filter(t=>TYPES.includes(t))).size;need=r.count||5;}else if(r.kind==='excludeRarity'){count=cards.filter(c=>c.rarity===r.value).length;rows.push({r,count,need:0,ok:count===0});continue;}else{rows.push({r,unknown:true,ok:false});continue;}rows.push({r,count,need,ok:count>=need});}return {rows,ok:team.length===6&&rows.every(x=>x.ok),deficit:rows.reduce((s,x)=>s+(x.unknown?0:Math.max(0,x.need-x.count)),0),unknown:!!mission.manualCheck||rows.some(x=>x.unknown)};}
function interactionRows(c,team,rotation=null){const rules=[...(c.teamRules?.interactions||[])];
 // Official passive headings also describe rotation composition on cards without manual rules.
 if(!rules.length){const sections=skill(c.passive).split(/\*([^*]+)\*/);for(let i=1;i<sections.length;i+=2){const condition=sections[i],n=norm(condition),categories=quoted(condition);if(!categories.length||!/categorie|category/.test(n)||!/allies attaquants|meme tour|same turn|attacking.*turn/.test(n)||/ennemi|enemy|pour chaque|for each/.test(n))continue;const min=Number(n.match(/(\d+)\s*(?:persos|personnages|allies|characters)/)?.[1]||1);rules.push({id:'passive-'+i,kind:'category',scope:'rotation',categories,class:/classe extreme|extreme class/.test(n)?'extreme':/classe super|super class/.test(n)?'super':'',min,includeSelf:min>=3,label:condition,weight:12});}}
 return rules.map(rule=>{
 const all=rule.scope==='rotation'&&rotation?rotation:team;
 const pool=(rule.includeSelf===false?all.filter(x=>instance(x)!==instance(c)):all).filter(x=>!rule.class||className(x.class)===className(rule.class));
 let matching=[];
 if(rule.kind==='name')matching=pool.filter(x=>(rule.names||[]).some(n=>norm(x.name).includes(norm(n)))&&!(rule.excludeNames||[]).some(n=>norm(x.name).includes(norm(n))));
 else if(rule.kind==='allCategory')matching=pool.filter(x=>(rule.categories||[]).some(n=>cats(x).has(canonical(n))));
 else {matching=(rule.categories||[]).map(n=>pool.filter(x=>cats(x).has(canonical(n)))).sort((a,b)=>b.length-a.length)[0]||[];}
 const satisfied=rule.kind==='allCategory'?all.length>=7&&matching.length===pool.length:matching.length>=(rule.min||1);
 const state=rule.scope==='rotation'&&!rotation?(satisfied?'possible':'missing'):(satisfied?'available':rule.kind==='allCategory'&&all.length<7?'unknown':'missing');
 return {card:c,rule,state,count:matching.length,partners:matching.map(identity),weight:rule.weight||10};
 });}
function supports(c,team){
 const declared=c.teamRules?.support||[],rows=declared.filter(r=>!r.requiresAllCategory||(team.length>=7&&team.every(t=>cats(t).has(canonical(r.requiresAllCategory)))));
 const p=passive(c,team),active=p.effects.filter(e=>e.state==='active').map(e=>e.text).join(' ');
 if(!declared.length)for(const line of active.split(/\n|;/)){
  if(!/alli[eé]s|allies/i.test(line))continue;
  const parsed=percentages(line).stats,n=norm(line),ki=Number(n.match(/ki\s*\+\s*(\d+)/)?.[1]||0);
  if(!parsed.atk&&!parsed.def&&!ki)continue;
  rows.push({categories:quoted(line),class:/classe extreme|extreme class/.test(n)?'Extrême':/classe super|super class/.test(n)?'Super':'',atk:parsed.atk,def:parsed.def,ki,scope:/tour|rotation|turn/.test(n)?'rotation':'team'});
 }
 return rows.flatMap(rule=>team.filter(t=>instance(t)!==instance(c)&&(!rule.class||className(t.class)===className(rule.class))&&(!rule.categories?.length||rule.categories.some(n=>cats(t).has(canonical(n))))).map(target=>({source:c,target,rule,conditional:rule.scope==='rotation',value:(rule.atk||0)*.06+(rule.def||0)*.09+(rule.ki||0)*1.8+(rule.crit||0)*.04})));
}
function synergy(team,friend=null){const all=friend?[...team,friend]:team;
 const support=all.flatMap(c=>supports(c,all)),interactions=team.flatMap(c=>interactionRows(c,all));
 let linkTotal=0;const matrix=team.map((a,i)=>team.map((b,j)=>{const common=i===j?[]:links(a,b);if(j>i)linkTotal+=common.length;return common}));
 return {matrix,linkTotal,support,interactions,score:support.reduce((n,x)=>n+x.value*(x.conditional?.4:1),0)+interactions.reduce((n,x)=>n+(x.state==='available'?x.weight:x.state==='possible'?x.weight*.35:x.state==='missing'?-x.weight*.3:0),0)};
}
function rotations(team,friend=null,context={}){const cards=friend?[...team,friend]:team;if(cards.length<4)return[];const pairs=[];
 for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){
  let a=cards[i],b=cards[j],pa=passive(a,cards,context),pb=passive(b,cards,context),common=links(a,b);
  const first=pa.slot1>=pb.slot1?a:b,second=first===a?b:a;
  let third=null,interactionScore=-Infinity;
  for(const floater of cards.filter((_,k)=>k!==i&&k!==j)){const rot=[a,b,floater];const score=rot.flatMap(c=>interactionRows(c,cards,rot)).reduce((n,x)=>n+(x.state==='available'?x.weight:x.state==='missing'?-x.weight*.2:0),0);if(score>interactionScore){interactionScore=score;third=floater;}}
  const rows=[a,b,...(third?[third]:[])].flatMap(c=>interactionRows(c,cards,[a,b,...(third?[third]:[])]));
  pairs.push({a:first,b:second,third,interactions:rows,indices:[i,j],links:common,score:common.length*10+Math.max(pa.slot1,pb.slot1)+Math.min(pa.defense,pb.defense)*.2+Math.max(0,interactionScore),uncertain:!passive(first,cards,context).guard&&!passive(first,cards,context).reduction});
 }
 let best=[],score=-Infinity;for(let i=0;i<pairs.length;i++)for(let j=i+1;j<pairs.length;j++){if(pairs[i].indices.some(x=>pairs[j].indices.includes(x)))continue;const n=pairs[i].score+pairs[j].score;if(n>score){score=n;best=[pairs[i],pairs[j]];}}const fixed=new Set(best.flatMap(r=>[instance(r.a),instance(r.b)]));
 for(const r of best){const floaters=cards.filter(c=>!fixed.has(instance(c)));let winner=null,value=-Infinity;for(const c of floaters){const rotation=[r.a,r.b,c],rows=rotation.flatMap(x=>interactionRows(x,cards,rotation)),n=rows.reduce((n,x)=>n+(x.state==='available'?x.weight:0),0);if(n>value){winner={third:c,interactions:rows};value=n;}}if(winner)Object.assign(r,winner);else{r.third=null;r.interactions=[];}}
 return best;
}
function evaluate(team,leader,friend,mission,known,context={}){team=team.map(c=>combatCard(c,context));leader=combatCard(leader,context);friend=combatCard(friend,context);const check=constraints(team,mission,friend),profiles=team.map(c=>passive(c,friend?[...team,friend]:team,context)),cover=team.map(c=>coverage(leader,c,known)),friendCover=friend?team.map(c=>coverage(friend,c,known)):[];const defensiveWeight=context.combat==='survival'?1.7:context.combat==='short'?.7:1,offensiveWeight=context.combat==='short'?1.7:1;let score=cover.reduce((n,x)=>n+(x.covered?100+(x.hp+x.atk+x.def)/30:-300),0);score+=friendCover.reduce((n,x)=>n+(x.covered?20:-120),0);score+=profiles.reduce((n,x)=>n+x.defense*defensiveWeight+x.offense*offensiveWeight+x.utility-(x.complete?0:15),0);const rot=context.quick?[]:rotations(team,friend,context),syn=synergy(team,friend);const linkWeight=context.combat==='links'?7:context.combat==='synergy'?3:1.5;score+=syn.linkTotal*linkWeight+syn.score*(context.combat==='synergy'?1.6:1);score+=rot.reduce((n,p)=>n+p.score*.35,0);
 // A weak sixth unit remains a liability even when it shares seven links.
 const strengths=profiles.map(p=>p.defense*defensiveWeight+p.offense*offensiveWeight+p.utility).sort((a,b)=>a-b);
 score+=(strengths[0]||0)*1.2+(strengths[1]||0)*.6;
 const anchors=profiles.filter(p=>p.slot1>=32).length;if(team.length===6&&anchors<2)score-=(2-anchors)*35;score-=check.deficit*600;check.rows.filter(x=>x.r.kind==='excludeRarity'&&!x.ok).forEach(()=>score-=2000);return {score,check,profiles,cover,friendCover,rotations:rot,synergy:syn};}
function build(pool,leader,{friend=null,mission={},known=[],context={},locked=[],excluded=[]}={}){pool=pool.map(c=>combatCard(c,context));leader=combatCard(leader,context);friend=combatCard(friend,context);locked=locked.map(c=>combatCard(c,context));const owned=new Set(pool.map(identity));if(!leader||!owned.has(identity(leader))||locked.some(c=>!owned.has(identity(c))))return {team:[],error:'Leader ou carte imposée non confirmé dans la Box.'};let start=[leader,...locked.filter(x=>identity(x)!==identity(leader))];start=start.filter((x,i,a)=>a.findIndex(y=>identity(y)===identity(x))===i);if(start.length>6)return {team:start,error:'Plus de six cartes imposées.'};if(start.some(c=>!coverage(leader,c,known).covered||(friend&&!coverage(friend,c,known).covered)))return {team:start,error:'Une carte imposée est hors aptitude de ton leader ou du leader ami, ou sa couverture est inconnue.'};const excludedIds=new Set(excluded.map(String));const eligible=pool.filter(c=>!excludedIds.has(identity(c))&&!start.some(x=>identity(x)===identity(c))&&coverage(leader,c,known).covered&&(!friend||coverage(friend,c,known).covered)&&!(mission.requirements||[]).some(r=>r.kind==='excludeRarity'&&c.rarity===r.value));const searchContext={...context,quick:true};const scoreTeam=t=>evaluate(t,leader,friend,mission,known,searchContext).score;const rank=c=>scoreTeam([...start,c]);let candidates=eligible.map(c=>({c,s:rank(c)})).sort((a,b)=>b.s-a.s).slice(0,36).map(x=>x.c);
 // Link partners and condition enablers must survive individual power ranking.
 for(const anchor of start){for(const c of eligible.slice().sort((a,b)=>links(anchor,b).length-links(anchor,a).length).slice(0,10))if(!candidates.includes(c))candidates.push(c);}
 for(const anchor of [...start,...candidates.slice(0,8)])for(const c of eligible){if(candidates.includes(c))continue;const before=interactionRows(anchor,start),after=interactionRows(anchor,[...start,c]);if(after.some((x,i)=>x.count>before[i].count)){candidates.push(c);if(candidates.length>=56)break;}}
 // Retain candidates that satisfy every quota, even when their kit ranks lower.
 for(const r of mission.requirements||[]){if(r.kind==='types'){for(const t of TYPES){const c=eligible.filter(c=>type(c.type)===t).sort((a,b)=>rank(b)-rank(a))[0];if(c&&!candidates.includes(c))candidates.push(c);}}else{const matchesR=eligible.filter(c=>constraints([c],{requirements:[{...r,count:1}]}).rows[0]?.ok).sort((a,b)=>rank(b)-rank(a)).slice(0,r.count||1);for(const c of matchesR)if(!candidates.includes(c))candidates.push(c);}}
 let beam=[start];while(beam[0]?.length<6){const next=new Map();for(const team of beam)for(const c of candidates){if(team.some(x=>identity(x)===identity(c)))continue;const t=[...team,c],key=t.map(identity).sort().join('|');if(!next.has(key))next.set(key,{team:t,score:scoreTeam(t)});}if(!next.size)break;beam=[...next.values()].sort((a,b)=>b.score-a.score).slice(0,24).map(x=>x.team);}// Rerank the complete beam with actual disjoint rotations, then refine one member at a time.
 const fullScore=t=>evaluate(t,leader,friend,mission,known,context).score;
 let finalists=beam.map(team=>({team,score:fullScore(team)})).sort((a,b)=>b.score-a.score),team=finalists[0]?.team||start;
 const fixed=new Set(start.map(identity));for(let round=0;round<2;round++){let best=fullScore(team),replacement=null;for(let i=0;i<team.length;i++){if(fixed.has(identity(team[i])))continue;for(const c of candidates){if(team.some(x=>identity(x)===identity(c)))continue;const t=team.map((x,j)=>j===i?c:x),score=fullScore(t);if(score>best+.01){best=score;replacement=t;}}}if(!replacement)break;team=replacement;}
 finalists=[{team,score:fullScore(team)},...finalists].sort((a,b)=>b.score-a.score);
 const alternatives=[];for(const {team:candidate} of finalists){if(candidate.length!==team.length)continue;if(alternatives.length&&alternatives.some(t=>candidate.filter(c=>!t.some(x=>identity(x)===identity(c))).length<2))continue;alternatives.push(candidate);if(alternatives.length===3)break;}
 return {team,...evaluate(team,leader,friend,mission,known,context),alternatives,approximate:true};}

const API={combatCard,norm,canonical,type,identity,interactionRows,supports,synergy,links,leaderRules,coverage,passive,constraints,rotations,evaluate,build};if(typeof module!=='undefined')module.exports=API;root.DokkanTeamEngine=API;
})(typeof window!=='undefined'?window:globalThis);
