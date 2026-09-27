let DB={cards:[]}, META={cards:{}}, CATALOG={cards:[]}, OVERLAP={conflicts:[]}, filter='all', query='', sortMode='box', selectedTeam=[], verifyLimit=30, inventory={}, inventoryFilter='review', inventoryQuery='', missingQuery='', rarityFilter='', typeFilter='', classFilter='', categoryFilter='', linkFilter='', ezaFilter='', favoriteOnly=false, favorites=new Set(), teamLeader='';
const norm=s=>(s??'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const FR_TERMS={
'Movie Bosses':'Boss des films','Wicked Bloodline':'Lignée diabolique','Resurrected Warriors':'Ressuscité','Giant Form':'Forme géante','Artificial Life Forms':'Forme de vie artificielle','Terrifying Conquerors':'Terrifiants conquérants','Target: Goku':'Objectif Son Goku','Corroded Body and Mind':'Corps et esprit corrompus','Gifted Warriors':'Guerriers de génie','Otherworld Warriors':"Combattants de l’au-delà",'Transformation Boost':'Transformation fortifiante','Power Absorption':'Absorption de puissance','Revenge':'Vengeance','Planetary Destruction':'Destruction planétaire','Accelerated Battle':'Combat accéléré','Battle of Fate':'Combat du destin','Final Trump Card':'Dernier recours','Joined Forces':'Forces jointes','Pure Saiyans':'Saiyans purs','Hybrid Saiyans':'Saiyans de sang mêlé','Realm of Gods':'Puissance divine','Majin Buu Saga':'Saga de Boo','Future Saga':'Saga du futur','Androids':'Cyborge','Androids/Cell Saga':'Saga des cyborgs/Cell','Full Power':'Pleine puissance','Time Travelers':'Voyageurs du temps','Kamehameha':'Kamehameha','Bond of Parent and Child':'Lien parent-enfant','Bond of Friendship':"Lien d’amitié",'Earth-Bred Fighters':'Combattants élevés sur Terre','Power Beyond Super Saiyan':'Pouvoir au-delà du Super Saiyan','Super Heroes':'Super héros','Movie Heroes':'Héros des films','Fusion':'Fusion','Fused Fighters':'Combattants fusionnés','Legendary Power':'Pouvoir légendaire','Big Bad Bosses':'Boss','Thirst for Conquest':'Ambition de conquête','Strongest Clan in Space':'Le plus puissant peuple','Auto Regeneration':'Auto-régénération','Nightmare':'Cauchemar','Fear and Faith':'Peur et désespoir','Shocking Speed':'Vitesse époustouflante','Brutal Beatdown':'Boost de handicap','Metamorphosis':'Métamorphose','Fierce Battle':'Combat acharné','Shattering the Limit':'Briser la limite','Prepared for Battle':'Préparé au combat','Super Saiyan':'Super Saiyan','Golden Warrior':'Guerrier doré','Royal Lineage':'Lignée royale','Saiyan Warrior Race':'Race guerrière Saiyan','Prodigies':'Prodiges','Cold Judgment':'Jugement froid','Brainiacs':'Cerveau','Infighter':'Combattant aguerri','Over in a Flash':'Vitesse éclair','Tournament of Power':'Tournoi du pouvoir','Godly Power':'Pouvoir divin','Warrior Gods':'Dieux guerriers','Kamehameha':'Kamehameha'
};
function frTerm(v){return FR_TERMS[v]||v}
function frList(a){return (a||[]).map(frTerm)}

async function boot(){
  DB=await fetch('collection.json').then(r=>r.ok?r.json():fetch('data.json').then(x=>x.json()));
  try{META=await fetch('card-meta.json').then(r=>r.ok?r.json():({cards:{}}))}catch(e){META={cards:{}}}
  try{CATALOG=await fetch('catalog.json').then(r=>r.ok?r.json():({cards:[]}))}catch(e){CATALOG={cards:[]}}
  try{OVERLAP=await fetch('overlap-conflicts.json').then(r=>r.ok?r.json():({conflicts:[]}))}catch(e){OVERLAP={conflicts:[]}}
  applyMetadata(); restoreEdits(); initAdvancedFilters();
  render(); stats(); renderDuplicates(); renderMissing(); renderInventory(); renderManualOwned(); renderTeam(); renderAnalysis();
}
function localized(m){if(!m)return null;let fr=m.fr||{};return {...m,name:fr.name||m.name,title:fr.title||m.title,type:fr.type||m.type,class:fr.class||m.class,categories:frList(fr.categories||m.categories),links:frList(fr.links||m.links),leader:fr.leader||m.leader,passive:fr.passive||m.passive,superAttack:fr.superAttack||m.superAttack,active:fr.active||m.active}}
function applyMetadata(){DB.cards.forEach(c=>{let m=localized(META.cards?.[String(c.candidateId)]);if(m)Object.assign(c,m)})}
function confClass(c){return c==='Très forte'?'tf':c==='Forte'?'f':c==='Moyenne'?'m':c==='Validée manuellement'?'manual':'v'}
function restoreEdits(){
  let edits=[]; try{edits=JSON.parse(localStorage.getItem('dokkanos-edits')||'[]')}catch(e){}
  edits.forEach(a=>{let c=DB.cards.find(x=>x.boxId===a.boxId);if(!c)return;Object.assign(c,a);if(a.candidateId){let m=localized(META.cards?.[String(a.candidateId)]);if(m)Object.assign(c,m);let choice=verifyCandidate(a.candidateId);c.image=choice?.image||'assets/cards/'+a.candidateId+'.webp';c.name=choice?.name||c.name;c.rarity=choice?.rarity||c.rarity;c.type=choice?.type||c.type}});
  try{inventory=JSON.parse(localStorage.getItem('dokkanos-inventory')||'{}')}catch(e){inventory={}}
  try{selectedTeam=JSON.parse(localStorage.getItem('dokkanos-team')||'[]').filter(id=>DB.cards.some(c=>c.boxId===id)||(String(id).startsWith('MANUAL-')&&inventory[String(id).slice(7)]==='owned')).slice(0,6)}catch(e){selectedTeam=[]}
  try{teamLeader=localStorage.getItem('dokkanos-team-leader')||'';if(teamLeader&&!resolveCard(teamLeader))teamLeader=''}catch(e){teamLeader=''}
  try{favorites=new Set(JSON.parse(localStorage.getItem('dokkanos-favorites')||'[]'))}catch(e){favorites=new Set()}
}
function searchText(c){return norm([c.boxId,c.candidateId,c.name,c.title,c.rarity,c.type,c.class,c.leader,c.passive,c.superAttack,c.active,...(c.categories||[]),...(c.links||[])].join(' '))}
function visibleCards(){
  let a=DB.cards.filter(c=>(filter==='all'||(filter==='valid'&&c.validated)||(filter==='check'&&!c.validated))&&(!query||searchText(c).includes(query))&&(!rarityFilter||c.rarity===rarityFilter)&&(!typeFilter||c.type===typeFilter)&&(!classFilter||c.class===classFilter)&&(!categoryFilter||(c.categories||[]).includes(categoryFilter))&&(!linkFilter||(c.links||[]).includes(linkFilter))&&(!ezaFilter||(ezaFilter==='yes'?!!c.eza:!c.eza))&&(!favoriteOnly||favorites.has(c.boxId)));
  if(sortMode==='confidence')a.sort((x,y)=>(y.inliers||0)-(x.inliers||0));
  if(sortMode==='id')a.sort((x,y)=>String(x.candidateId).localeCompare(String(y.candidateId)));if(sortMode==='name')a.sort((x,y)=>(x.name||'').localeCompare(y.name||'','fr'));if(sortMode==='rarity'){let r={LR:5,UR:4,SSR:3,SR:2,R:1,N:0};a.sort((x,y)=>(r[y.rarity]??-1)-(r[x.rarity]??-1))}if(sortMode==='type'){let t={AGI:0,TEC:1,INT:2,PUI:3,END:4};a.sort((x,y)=>(t[x.type]??9)-(t[y.type]??9))}
  return a;
}
function initAdvancedFilters(){let cats=[...new Set(DB.cards.flatMap(c=>c.categories||[]))].sort((a,b)=>a.localeCompare(b,'fr')),links=[...new Set(DB.cards.flatMap(c=>c.links||[]))].sort((a,b)=>a.localeCompare(b,'fr'));$('#categoryFilter').innerHTML='<option value="">Catégorie</option>'+cats.map(x=>`<option>${x}</option>`).join('');$('#linkFilter').innerHTML='<option value="">Lien</option>'+links.map(x=>`<option>${x}</option>`).join('')}
function toggleFavorite(id){favorites.has(id)?favorites.delete(id):favorites.add(id);localStorage.setItem('dokkanos-favorites',JSON.stringify([...favorites]));render();renderManualOwned();renderAnalysis();openCard(id)}
function activeFilterSummary(){let x=[];if(query)x.push('Recherche');if(filter!=='all')x.push(filter==='valid'?'Validées':'À vérifier');if(rarityFilter)x.push(rarityFilter);if(typeFilter)x.push(typeFilter);if(classFilter)x.push(classFilter);if(categoryFilter)x.push(categoryFilter);if(linkFilter)x.push(linkFilter);if(ezaFilter)x.push(ezaFilter==='yes'?'EZA':'Non-EZA');if(favoriteOnly)x.push('★ Favoris');let el=$('#activeFilters');if(el)el.innerHTML=x.length?x.map(v=>`<span>${v}</span>`).join(''):''}
function render(){
  let a=visibleCards();activeFilterSummary();
  $('#grid').innerHTML=a.map(c=>`<article class="unit" onclick="openCard('${c.boxId}')"><i class="dot ${confClass(c.confidence)}"></i>${favorites.has(c.boxId)?'<b class="favmark">★</b>':''}<img loading="lazy" src="${c.image}" onerror="this.classList.add('imgfail')"><div class="meta"><strong>${c.name||'ID '+(c.candidateId||'—')}</strong><small>${c.boxId} · ${c.confidence}</small></div></article>`).join('')||'<div class="empty">Aucune carte</div>';
  $('#resultCount').textContent=a.length+' résultat'+(a.length>1?'s':'');
  renderVerify();
}
function stats(){
  let v=DB.cards.filter(c=>c.validated).length, unique=ownedIds().size;
  $('#nAll').textContent=DB.cards.length;$('#nVal').textContent=v;$('#nCheck').textContent=DB.cards.length-v;$('#nUnique').textContent=unique;
  $('#progressBar').style.width=(DB.cards.length?Math.round(v/DB.cards.length*100):0)+'%';
  $('#progressText').textContent=(DB.cards.length?Math.round(v/DB.cards.length*100):0)+'% validé';
}
function verifyCandidate(id){id=String(id||'');if(!id)return null;let m=localized(META.cards?.[id])||{},cat=(CATALOG.cards||[]).find(x=>String(x.id)===id)||{};return {id,...m,...cat,rarity:cat.rarity||m.rarity,type:cat.type||m.type,class:cat.class||m.class,name:(cat.name||m.name||'').replace(/Metal Cooler/g,'Métal Cooler').replace(/Metal Cooler Army/g,'Armée de Métal Cooler'),categories:frList(m.categories||cat.categories),links:frList(m.links||cat.links),image:cat.image||('assets/cards/'+id+'.webp')}}
function verifyCatalogue(){let seen=new Set(),out=[];(CATALOG.cards||[]).forEach(c=>{let id=String(c.id||'');if(id&&!seen.has(id)){seen.add(id);out.push(verifyCandidate(id))}});Object.keys(META.cards||{}).forEach(id=>{if(!seen.has(String(id))){seen.add(String(id));out.push(verifyCandidate(id))}});return out}
function verifySearch(boxId,value){
  const host=document.querySelector('[data-verify-results="'+CSS.escape(String(boxId))+'"]');if(!host)return;
  const raw=String(value||'').trim(),q=norm(raw);if(q.length<1){host.innerHTML='';return}
  const terms=q.split(/\s+/).filter(Boolean);
  const rows=verifyCatalogue().map(card=>{
    const hay=norm([card.id,card.name,card.title,card.rarity,card.type,card.class,...(card.categories||[])].join(' '));
    let score=0;for(const t of terms)if(hay.includes(t))score+=1;
    if(String(card.id)===raw)score+=100;if(norm(card.name||'').startsWith(q))score+=20;if(hay.includes(q))score+=10;
    return {card,score};
  }).filter(x=>x.score>0).sort((x,y)=>y.score-x.score||String(x.card.name||'').localeCompare(String(y.card.name||''),'fr')).slice(0,60);
  host.innerHTML=rows.length?rows.map(({card})=>'<button type="button" class="verify-search-card" data-pick-box="'+String(boxId).replace(/"/g,'&quot;')+'" data-pick-card="'+String(card.id).replace(/"/g,'&quot;')+'"><img loading="lazy" src="'+(card.image||'')+'" onerror="this.classList.add(\'imgfail\')"><b>'+(card.name||'ID '+card.id)+'</b><small>'+([card.rarity||'',card.type||'','ID '+card.id].filter(Boolean).join(' · '))+'</small></button>').join(''):'<div class="empty compact">Aucune carte trouvée. Essaie une partie du nom ou son ID.</div>';
}
function verifyPick(boxId,cardId){
  const c=DB.cards.find(x=>String(x.boxId)===String(boxId));
  if(!c){alert('DokkanOS : position introuvable ('+boxId+').');return false}
  const candidate=verifyCandidate(cardId);
  if(!candidate){alert('DokkanOS : carte introuvable ('+cardId+').');return false}
  c._edited=true;c.candidateId=String(cardId);c.image=candidate.image||('assets/cards/'+cardId+'.webp');
  c.name=candidate.name||c.name;c.rarity=candidate.rarity||c.rarity;c.type=candidate.type||c.type;
  const m=localized(META.cards?.[String(cardId)]);if(m)Object.assign(c,m);
  c.validated=true;c.confidence='Validée manuellement';
  saveEdits();
  const status=$('#verificationStatus');if(status){status.textContent='✓ '+(c.name||'ID '+cardId)+' validée pour '+boxId+'.';status.hidden=false}
  render();stats();renderDuplicates();renderMissing();renderInventory();renderManualOwned();renderAnalysis();
  return false;
}
function renderVerify(){
  let priority=new Set((OVERLAP.conflicts||[]).flatMap(x=>x.observations||[])), pending=DB.cards.filter(c=>!c.validated).sort((a,b)=>(priority.has(b.boxId)?1:0)-(priority.has(a.boxId)?1:0)), a=pending.slice(0,verifyLimit);
  $('#verifyList').innerHTML=a.map(c=>{let one=verifyCandidate(c.candidateId),two=verifyCandidate(c.runnerId);return `<article class="verify-workbench"><div class="verify-head"><div><h3>${c.boxId}</h3><p class="muted">${c.capture||''} · ${c.position||''}</p></div><span class="badge neutral">${c.confidence||'À vérifier'}</span></div><div class="verify-capture"><img src="${c.crop}" onerror="this.classList.add('imgfail')"><small>Carte détectée dans ta capture</small></div><div class="verify-help">Choisis une suggestion seulement si l’image correspond vraiment. Sinon, utilise la recherche : elle parcourt tout le catalogue disponible, pas uniquement les deux candidats automatiques.</div><div class="verify-suggestions">${[one,two].filter(Boolean).map((x,i)=>`<button type="button" class="verify-choice" onclick="verifyPick('${encodeURIComponent(c.boxId)}','${encodeURIComponent(x.id)}',this)"><img src="${x.image}" onerror="this.classList.add('imgfail')"><b>${x.name||'Suggestion '+(i+1)}</b><small>${x.rarity||''} · ${x.type||''} · ID ${x.id}</small></button>`).join('')}</div><div class="verify-search"><input class="search" style="margin-top:0" placeholder="Chercher la bonne carte : nom ou ID…" oninput="verifySearch('${c.boxId}',this.value)"><div class="verify-search-results" data-verify-results="${c.boxId}"></div></div><div class="verify-actions"><button onclick="choose('${c.boxId}','')">Aucune / à revoir</button></div></article>`}).join('')+(pending.length>verifyLimit?`<button class="loadmore" onclick="loadMoreVerify()">Afficher ${Math.min(30,pending.length-verifyLimit)} de plus · ${pending.length-verifyLimit} restantes</button>`:'')||'<div class="empty">Tout est validé 🎉</div>';
}
function loadMoreVerify(){verifyLimit+=30;renderVerify()}
function bindVerifyChoices(){
  if(document.documentElement.dataset.verifyChoicesBound==='2')return;
  document.documentElement.dataset.verifyChoicesBound='2';
  document.addEventListener('click',function(e){
    const btn=e.target.closest&&e.target.closest('[data-pick-card]');
    if(!btn)return;
    e.preventDefault();e.stopPropagation();
    verifyPick(btn.getAttribute('data-pick-box'),btn.getAttribute('data-pick-card'));
  },true);
}
bindVerifyChoices();

function saveEdits(){
  try{
    localStorage.setItem('dokkanos-edits',JSON.stringify(DB.cards.filter(x=>x._edited).map(x=>({boxId:x.boxId,candidateId:x.candidateId,validated:x.validated,confidence:x.confidence,_edited:true}))));
    return true;
  }catch(e){
    console.warn('DokkanOS: sauvegarde locale impossible',e);
    return false;
  }
}
function choose(id,val){
  let c=DB.cards.find(x=>x.boxId===id);if(!c)return;
  c._edited=true;
  if(val){
    let candidate=verifyCandidate(val),m=localized(META.cards?.[String(val)]);
    if(m)Object.assign(c,m);
    c.candidateId=String(val);
    c.image=candidate?.image||'assets/cards/'+val+'.webp';
    c.name=candidate?.name||c.name;
    c.rarity=candidate?.rarity||c.rarity;
    c.type=candidate?.type||c.type;
    c.validated=true;c.confidence='Validée manuellement';
  }else{c.candidateId='';c.validated=false;c.confidence='À revoir'}
  const saved=saveEdits();
  let status=$('#verificationStatus');
  if(status){status.textContent=val?'Carte '+id+' validée : '+(c.name||'ID '+val)+' (ID '+val+').'+(saved?'':' Attention : sauvegarde locale indisponible.'):'Carte '+id+' laissée à vérifier.';status.hidden=false}
  render();stats();renderDuplicates();renderMissing();renderInventory();renderManualOwned();renderAnalysis();
}

function skillText(v){if(!v)return '—';if(typeof v==='string')return v;if(Array.isArray(v))return v.map(skillText).join(' · ');return [v.name,v.description,v.condition].filter(Boolean).join(' — ')||'—'}
function tagBlock(title,arr){return arr?.length?`<section class="detail-section"><h3>${title}</h3><div class="tags">${arr.map(x=>`<span>${x}</span>`).join('')}</div></section>`:''}
function statsBlock(c){let vals=[['PV',c.maxHP||c.rainbowHP],['ATQ',c.maxATK||c.rainbowATK],['DEF',c.maxDEF||c.rainbowDEF],['Coût',c.cost],['Niv. max',c.maxLevel],['SP max',c.maxSALevel]].filter(x=>x[1]!==undefined&&x[1]!==null&&x[1]!=='');return vals.length?`<section class="detail-section"><h3>Statistiques</h3><div class="statline">${vals.map(([k,v])=>`<span><small>${k}</small><b>${Number(v).toLocaleString('fr-FR')}</b></span>`).join('')}</div></section>`:''}
function resolveCard(id){let c=DB.cards.find(x=>x.boxId===id);if(c)return c;if(String(id).startsWith('MANUAL-')){let cid=String(id).slice(7),m=localized(META.cards?.[cid]);if(m)return {boxId:id,candidateId:cid,confidence:'Confirmée manuellement',image:'assets/cards/'+cid+'.webp',validated:true,_manual:true,...m}}return null}
function openCard(id){
  let c=resolveCard(id);if(!c)return;let inTeam=selectedTeam.includes(id);
  let sa=skillText(c.superAttack),usa=skillText(c.ultraSuperAttack),trans=(c.transformations||[]).map(x=>x.name||x.id||x), active=skillText(c.active);
  $('#sheet').innerHTML=`<button onclick="closeSheet()" class="close">Fermer</button><div class="hero"><img src="${c.image}"><div><h2>${c.name||'Carte '+(c.candidateId||'—')}</h2><div>${c.title||''}</div><div class="card-badges"><span>${c.rarity||'—'}</span><span>${c.type||'—'}</span>${c.class?'<span>'+c.class+'</span>':''}${c.eza?'<span>EZA</span>':''}</div><p class="muted">ID ${c.candidateId||'—'} · ${c.confidence}</p><div class="detail-actions"><button class="primary" onclick="toggleTeam('${id}')">${inTeam?'Retirer de l’équipe':'Ajouter à l’équipe'}</button><button class="favorite-btn ${favorites.has(id)?'on':''}" onclick="toggleFavorite('${id}')">${favorites.has(id)?'★ Favori':'☆ Ajouter aux favoris'}</button></div></div></div><section class="detail-section"><h3>Aptitude Leader</h3><p>${c.leader||'—'}</p></section><section class="detail-section"><h3>Passif${c.passiveName?' · '+c.passiveName:''}</h3><p>${c.passive||'—'}</p></section><section class="detail-section"><h3>Attaque spéciale</h3><p>${sa}</p>${usa!=='—'?'<h4>Ultra attaque spéciale</h4><p>'+usa+'</p>':''}</section>${active!=='—'?'<section class="detail-section"><h3>Compétence active</h3><p>'+active+'</p></section>':''}${statsBlock(c)}${profileBlock(c)}${conditionBlock(c)}${tagBlock('Catégories',c.categories)}${tagBlock('Liens',c.links)}${trans.length?tagBlock('Transformations',trans):''}<section class="detail-section provenance"><small>Source des données : ${c.source?.provider||c.sources?.map(x=>x.provider).join(' + ')||'DokkanOS'} · Fiche ${c.fr?'française':'source'}</small></section>`;
  $('#sheet').classList.add('on')
}
function closeSheet(){$('#sheet').classList.remove('on')}
function toggleTeam(id){
  if(selectedTeam.includes(id))selectedTeam=selectedTeam.filter(x=>x!==id);else if(selectedTeam.length<6)selectedTeam.push(id);else return alert('Équipe complète : 6 cartes maximum.');
  localStorage.setItem('dokkanos-team',JSON.stringify(selectedTeam));renderTeam();openCard(id);
}
function ownedTeamCards(){let seen=new Set(),out=[];DB.cards.filter(c=>c.validated&&c.candidateId).forEach(c=>{let id=String(c.candidateId);if(!seen.has(id)){seen.add(id);out.push(c)}});Object.entries(inventory).filter(([id,s])=>s==='owned'&&!seen.has(id)).forEach(([id])=>{let m=localized(META.cards?.[id]);if(m){seen.add(id);out.push({boxId:'MANUAL-'+id,candidateId:id,confidence:'Confirmée manuellement',image:'assets/cards/'+id+'.webp',validated:true,_manual:true,...m})}});return out}
function allKnownCategories(){return [...new Set(Object.values(META.cards||{}).flatMap(m=>(localized(m)?.categories)||[]))].sort((a,b)=>b.length-a.length)}
function leaderCategories(c){let text=norm(c?.leader||''),own=new Set(c?.categories||[]),hits=allKnownCategories().filter(x=>text.includes(norm(x)));return [...new Set([...hits,...[...own].filter(x=>text.includes(norm(x)))])]}
function leaderRule(c){let text=norm(c?.leader||''),cats=leaderCategories(c),types=['AGI','TEC','INT','PUI','END'].filter(t=>text.includes(norm(t))),classes=['Super','Extrême'].filter(k=>text.includes(norm(k))),all=text.includes('tous les types')||text.includes('all types');return {cats,types,classes,all,text}}

function leaderCoverageFor(leader,card){if(!leader||!card)return {covered:false,reasons:[]};let r=leaderRule(leader),reasons=[];for(let cat of r.cats)if((card.categories||[]).includes(cat))reasons.push(cat);if(r.all)reasons.push('Tous types');if(r.types.includes(card.type))reasons.push(card.type);if(r.classes.includes(card.class))reasons.push(card.class);return {covered:reasons.length>0,reasons:[...new Set(reasons)]}}
function sharedCount(a,b,key){let s=new Set(a?.[key]||[]);return (b?.[key]||[]).filter(x=>s.has(x)).length}
const ROLE_RULES=[
 ['Tank',/(reduction des degats|damage reduction|garde|guard|defense \+|def \+|defense augmente|raises def)/,14],
 ['Esquive',/(esquiv|dodge|evade)/,10],
 ['Stack DEF',/(augmente.*defense|raises def).*?(infini|continu|permanent|greatly raises def)/,12],
 ['Support',/(alli[eé]s|allies).*?(ki|atk|def|attaque|defense)/,12],
 ['Soin',/(recupere|restaure|recover|heal).*?(pv|hp)/,8],
 ['Critique',/(coup critique|critical hit|critique)/,7],
 ['Additionnelle',/(attaque supplementaire|additional attack)/,7],
 ['Ki',/(ki \+|ki de|ki +\d)/,5],
 ['Revive',/(revive|revival|reanimation)/,12],
 ['Standby',/(standby|mise en attente)/,9],
 ['Domaine',/(domain|domaine)/,9]
];
function kitText(c){return norm([skillText(c?.passive),skillText(c?.superAttack),skillText(c?.ultraSuperAttack),skillText(c?.active)].join(' '))}
function cardProfile(c){let text=kitText(c),roles=[];ROLE_RULES.forEach(([name,re,w])=>{if(re.test(text))roles.push({name,weight:w})});let offense=roles.filter(x=>['Critique','Additionnelle','Ki'].includes(x.name)).reduce((n,x)=>n+x.weight,0),defense=roles.filter(x=>['Tank','Esquive','Stack DEF','Soin'].includes(x.name)).reduce((n,x)=>n+x.weight,0),utility=roles.filter(x=>['Support','Revive','Standby','Domaine'].includes(x.name)).reduce((n,x)=>n+x.weight,0);return {roles,offense,defense,utility,score:offense+defense+utility}}
const CONDITION_RULES=[
 ['PV',/(pv|hp).{0,35}(%|inferieur|superieur|moins|plus)/],
 ['Slot',/(1er|2e|3e|premier|deuxieme|troisieme|position|slot)/],
 ['Tours',/(pendant|a partir|tour|turn).{0,25}[0-9]/],
 ['Attaques reçues',/(attaque.{0,15}recue|receives an attack|apres avoir recu)/],
 ['Attaques lancées',/(attaque.{0,20}(effectuee|lancee)|after attacking|super attack performed)/],
 ['Allié requis',/(allie|ally).{0,45}(categorie|category|nom|name|equipe|team)/],
 ['Ennemi requis',/(ennemi|enemy).{0,45}(categorie|category|type|classe|class)/],
 ['Ki',/(ki).{0,20}(egal|superieur|inferieur|orbe|sphere)/],
 ['Transformation',/(transform|transformation).{0,45}(condition|lorsque|when|tour|turn)/]
];
function conditionProfile(c){let text=kitText(c),conditions=CONDITION_RULES.filter(([,re])=>re.test(text)).map(([name])=>name),conditionalSignals=(text.match(/(si |lorsque|quand|a condition|avec |pour chaque|apres |avant |when |if |after |with )/g)||[]).length,reliability=Math.max(35,100-conditions.length*8-Math.min(25,conditionalSignals*3));return {conditions:[...new Set(conditions)],signals:conditionalSignals,reliability}}
function intelligenceProfile(c){let p=cardProfile(c),cond=conditionProfile(c);return {...p,...cond}}
function conditionBlock(c){let p=conditionProfile(c);return `<section class="detail-section"><h3>Conditions détectées</h3>${p.conditions.length?`<div class="tags condition-tags">${p.conditions.map(x=>`<span>${x}</span>`).join('')}</div>`:'<p class="muted">Aucune contrainte majeure détectée automatiquement.</p>'}<p class="muted">Disponibilité structurelle estimée : ${p.reliability}/100. Cette valeur mesure la dépendance aux conditions, pas la puissance de la carte.</p></section>`}
function roleNames(c){return cardProfile(c).roles.map(x=>x.name)}
function teamRoleBalance(team){let profiles=team.map(cardProfile),names=profiles.flatMap(x=>x.roles.map(r=>r.name)),has=n=>names.includes(n),def=team.filter(x=>{let p=cardProfile(x);return p.defense>=10}).length,support=team.filter(x=>roleNames(x).includes('Support')).length,off=team.filter(x=>{let p=cardProfile(x);return p.offense>=7}).length;let score=Math.min(100,def*18+Math.min(20,support*10)+Math.min(20,off*7)+(has('Soin')?8:0)+(has('Revive')?8:0));return {score,def,support,off,names:[...new Set(names)]}}
function profileBlock(c){let p=cardProfile(c);return p.roles.length?`<section class="detail-section"><h3>Profil DokkanOS</h3><div class="tags role-tags">${p.roles.map(x=>`<span>${x.name}</span>`).join('')}</div><p class="muted">Profil détecté automatiquement à partir des aptitudes de la carte.</p></section>`:''}
function candidateScore(card,leader,team){let cov=leaderCoverageFor(leader,card),links=team.reduce((n,x)=>n+sharedCount(card,x,'links'),0),cats=team.reduce((n,x)=>n+sharedCount(card,x,'categories'),0),rar={LR:8,UR:5,SSR:2}[card.rarity]||0,eza=card.eza?3:0,profile=intelligenceProfile(card),balance=teamRoleBalance(team),needDefense=balance.def<2&&profile.defense>=10?12:0,needSupport=balance.support<1&&roleNames(card).includes('Support')?10:0;return {score:(cov.covered?70:0)+links*5+cats*2+rar+eza+Math.min(18,profile.score)+Math.round((profile.reliability-70)/10)+needDefense+needSupport,coverage:cov,links,cats,profile}}
function pairScore(a,b){return sharedCount(a,b,'links')*8+sharedCount(a,b,'categories')*2}
function teamMetrics(cards,leader){let pairs=[],totalLinks=0,totalCats=0;for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){let l=sharedCount(cards[i],cards[j],'links'),ca=sharedCount(cards[i],cards[j],'categories');totalLinks+=l;totalCats+=ca;pairs.push({a:cards[i],b:cards[j],links:l,cats:ca,score:l*8+ca*2})}pairs.sort((x,y)=>y.score-x.score);let covered=leader?cards.filter(x=>leaderCoverageFor(leader,x).covered).length:0,score=Math.round((cards.length?covered/cards.length*55:0)+Math.min(25,totalLinks*2)+Math.min(15,totalCats*.5)+(cards.filter(x=>x.eza).length?5:0));let roles=teamRoleBalance(cards);score=Math.round(score*.75+roles.score*.25);return {pairs,totalLinks,totalCats,covered,roles,score:Math.min(100,score)}}
function bestRotations(cards){let pairs=[];for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++)pairs.push({a:cards[i],b:cards[j],score:pairScore(cards[i],cards[j]),links:sharedCount(cards[i],cards[j],'links')});pairs.sort((a,b)=>b.score-a.score);let used=new Set(),out=[];for(let p of pairs){if(!used.has(p.a.boxId)&&!used.has(p.b.boxId)){out.push(p);used.add(p.a.boxId);used.add(p.b.boxId);if(out.length===2)break}}return out}
function teamIntelligence(team,leader){let profiles=team.map(intelligenceProfile),avg=profiles.length?Math.round(profiles.reduce((n,p)=>n+p.reliability,0)/profiles.length):0,conditional=profiles.filter(p=>p.conditions.length>=2).length,slot=profiles.filter(p=>p.conditions.includes('Slot')).length,hp=profiles.filter(p=>p.conditions.includes('PV')).length,warnings=[];if(leader&&team.some(c=>!leaderCoverageFor(leader,c).covered))warnings.push('Une ou plusieurs unités ne profitent pas du Leader Skill.');if(slot>=3)warnings.push('Plusieurs kits dépendent du placement : les rotations peuvent être contraintes.');if(conditional>=4)warnings.push('Équipe très conditionnelle : ses performances peuvent varier fortement selon le combat.');if(teamRoleBalance(team).def<2&&team.length>=5)warnings.push('Peu de profils défensifs détectés.');return {avg,conditional,slot,hp,warnings}}
function explainCandidate(card,leader,team){let s=candidateScore(card,leader,team),bits=[];if(s.coverage.covered)bits.push('Leader ✓');if(s.links)bits.push(s.links+' liens');if(s.profile.roles.length)bits.push(s.profile.roles.slice(0,2).map(x=>x.name).join('/'));if(s.profile.conditions.length)bits.push(s.profile.conditions.length+' condition(s)');bits.push('dispo '+s.profile.reliability+'/100');return bits.join(' · ')}
function autoBuildTeam(){let leader=teamLeader?resolveCard(teamLeader):null;if(!leader)return alert('Choisis d’abord un leader.');let pool=ownedTeamCards().filter(x=>x.boxId!==teamLeader),team=[leader];while(team.length<6){let candidates=pool.filter(x=>!team.some(t=>t.boxId===x.boxId)).map(x=>({card:x,...candidateScore(x,leader,team)})).sort((a,b)=>b.score-a.score);let best=candidates.find(x=>x.coverage.covered)||candidates[0];if(!best)break;team.push(best.card)}selectedTeam=team.map(x=>x.boxId);localStorage.setItem('dokkanos-team',JSON.stringify(selectedTeam));renderTeam()}
function cardTeamDiagnostic(card,leader,team){let cov=leaderCoverageFor(leader,card),others=team.filter(x=>x.boxId!==card.boxId),best=others.map(x=>({card:x,links:sharedCount(card,x,'links'),cats:sharedCount(card,x,'categories'),score:pairScore(card,x)})).sort((a,b)=>b.score-a.score)[0],flags=[];if(leader&&!cov.covered)flags.push('Hors Leader Skill');if(!best||best.links===0)flags.push('Aucun lien actif détecté');if(card.eza)flags.push('EZA');return {cov,best,flags}}
function replacementFor(card,leader,team){let pool=ownedTeamCards().filter(x=>!team.some(t=>t.boxId===x.boxId)),current=candidateScore(card,leader,team.filter(x=>x.boxId!==card.boxId)).score;let alt=pool.map(x=>({card:x,...candidateScore(x,leader,team.filter(t=>t.boxId!==card.boxId))})).filter(x=>x.coverage.covered&&x.score>current).sort((a,b)=>b.score-a.score)[0];return alt||null}
function teamDiagnostics(team,leader){if(!team.length)return'';return `<div class="team-insights"><h3>Diagnostic des unités</h3>${team.map(c=>{let d=cardTeamDiagnostic(c,leader,team),rep=replacementFor(c,leader,team);return `<div class="unit-diagnostic ${leader&&!d.cov.covered?'warn':''}"><img src="${c.image}"><div><b>${c.name||c.candidateId}</b><small>${d.cov.covered?'✓ Leader : '+d.cov.reasons.join(', '):leader?'⚠ Hors Leader Skill':'Leader non défini'}</small><p>${d.best?'Meilleure paire : '+(d.best.card.name||d.best.card.candidateId)+' · '+d.best.links+' lien(s)':'Aucune paire'}${rep?' · Remplacement structurel possible : '+(rep.card.name||rep.card.candidateId):''}</p></div></div>`}).join('')}</div>`}
function autoExplanation(team,leader){if(!leader||team.length<2)return'';return `<div class="team-insights"><h3>Pourquoi cette composition ?</h3>${team.map((c,i)=>{let d=candidateScore(c,leader,team.filter(x=>x.boxId!==c.boxId));return `<div class="row"><span>${i===0?'Leader · ':''}${c.name||c.candidateId}</span><b>${d.coverage.covered?'Couvert':'Hors leader'} · ${d.links} liens</b></div>`}).join('')}<p class="muted">Le classement privilégie la couverture du Leader Skill puis les liens et catégories partagés. Il ne représente pas encore les performances en combat tour par tour.</p></div>`}
function initLeaderSelect(){let el=$('#leaderSelect');if(!el)return;let cards=ownedTeamCards().filter(c=>c.leader).sort((a,b)=>(a.name||'').localeCompare(b.name||'','fr'));el.innerHTML='<option value="">Choisir le leader</option>'+cards.map(c=>`<option value="${c.boxId}" ${teamLeader===c.boxId?'selected':''}>${c.name||c.candidateId} · ${c.rarity||''}</option>`).join('')}
function addCandidate(id){if(selectedTeam.includes(id))return;if(selectedTeam.length>=6)return alert('Équipe complète : 6 cartes maximum.');selectedTeam.push(id);localStorage.setItem('dokkanos-team',JSON.stringify(selectedTeam));renderTeam()}
function clearTeam(){selectedTeam=[];localStorage.setItem('dokkanos-team','[]');renderTeam()}
function removeFromTeam(id){selectedTeam=selectedTeam.filter(x=>x!==id);localStorage.setItem('dokkanos-team',JSON.stringify(selectedTeam));renderTeam()}
function commonValues(cards,key){if(cards.length<2)return[];let count={};cards.forEach(c=>new Set(c[key]||[]).forEach(v=>count[v]=(count[v]||0)+1));return Object.entries(count).filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,8)}
function teamInsights(){let cards=selectedTeam.map(resolveCard).filter(Boolean),cats=commonValues(cards,'categories'),links=commonValues(cards,'links');if(!cards.length)return '<p class="muted">Ajoute des cartes pour analyser les synergies.</p>';return `<div class="team-insights"><h3>Synergies détectées</h3><p class="muted">${cards.filter(c=>c.name||c.categories?.length||c.links?.length).length}/${cards.length} cartes avec données enrichies</p>${cats.length?`<h4>Catégories communes</h4><div class="tags">${cats.map(([x,n])=>`<span>${x} · ${n}</span>`).join('')}</div>`:''}${links.length?`<h4>Liens communs</h4><div class="tags">${links.map(([x,n])=>`<span>${x} · ${n}</span>`).join('')}</div>`:''}${!cats.length&&!links.length?'<p class="muted">Les synergies apparaîtront automatiquement à mesure que les fiches seront enrichies.</p>':''}</div>`}
function renderDuplicates(){let el=$('#duplicateList');if(!el)return;let groups={};DB.cards.filter(c=>c.validated&&c.candidateId).forEach(c=>(groups[c.candidateId]??=[]).push(c));let d=Object.entries(groups).filter(([,a])=>a.length>1).sort((a,b)=>b[1].length-a[1].length);$('#dupCount').textContent=d.length+' IDs';el.innerHTML=d.map(([id,a])=>`<div class="panel dup-row clickable" onclick="openCard('${a[0].boxId}')"><img src="${a[0].image}"><div><b>${a[0].name||'ID '+id}</b><p class="muted">${a.length} exemplaires · ${a.length-1} doublon(s)</p><small>${a.map(x=>x.boxId).join(' · ')}</small></div></div>`).join('')||'<div class="empty">Aucun doublon détecté.</div>'}
function catalogSelectable(c){return ['SSR','UR','LR'].includes(c.rarity)||(c.rarity==='SR'&&!!c.awakensTo)}
let CACHED_FAMILIES=null, CACHED_FAMILY_BY_ID=null;
function catalogFamilies(){
  if(CACHED_FAMILIES)return CACHED_FAMILIES;
  const cards=(CATALOG.cards||[]).filter(catalogSelectable), byId=new Map(cards.map(c=>[String(c.id),c])), parent=new Map(cards.map(c=>[String(c.id),String(c.id)]));
  const root=id=>{id=String(id);if(!parent.has(id))return id;let p=parent.get(id);while(p!==parent.get(p))p=parent.get(p);return p};
  for(const c of cards){let from=String(c.id),to=String(c.awakensTo||'');if(to&&byId.has(to)){let a=root(from),b=root(to);if(a!==b)parent.set(a,b)}}
  const groups=new Map();for(const c of cards){let key=root(c.id);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c)}
  const rank={LR:4,UR:3,SSR:2,SR:1};
  CACHED_FAMILIES=[...groups.values()].map(group=>{group.sort((a,b)=>(rank[b.rarity]||0)-(rank[a.rarity]||0)||Number(b.id)-Number(a.id));return group});
  CACHED_FAMILY_BY_ID=new Map(CACHED_FAMILIES.flatMap(group=>group.map(card=>[String(card.id),group])));
  return CACHED_FAMILIES
}
function familyFor(id){catalogFamilies();return CACHED_FAMILY_BY_ID.get(String(id))||[{id:String(id)}]}
function familyState(group){
  const ids=group.map(c=>String(c.id));
  if(ids.some(id=>capturedOwned(id)||inventory[id]==='owned'))return 'owned';
  if(ids.some(id=>inventory[id]==='missing'))return 'missing';
  return 'review'
}
function familyCard(group){return group.find(c=>capturedOwned(c.id)||inventory[String(c.id)]==='owned')||group[0]}
function renderMissing(){let el=$('#missingList');if(!el)return;let q=norm(missingQuery),all=catalogFamilies().filter(group=>familyState(group)!=='owned').map(group=>({card:familyCard(group),state:familyState(group)})).filter(({card})=>!q||norm(`${card.id} ${card.name} ${card.title} ${card.rarity} ${card.type}`).includes(q)),a=all.slice(0,300);$('#missingCount').textContent=all.length+(all.length>300?' · 300 affichées':'');el.innerHTML=a.map(({card:c,state})=>`<article class="unit"><img loading="lazy" src="${c.image||''}" onerror="this.classList.add('imgfail')"><div class="meta"><strong>${c.name||'ID '+c.id}</strong><small>${c.rarity||''} · ${c.type||''} · ${state==='missing'?'Non possédée':'À confirmer'}</small></div></article>`).join('')||'<div class="empty">Aucune carte à confirmer pour cette recherche.</div>'}
function capturedOwned(id){return DB.cards.some(c=>c.validated&&String(c.candidateId)===String(id))}
function inventoryState(card){return familyState(familyFor(card.id||card.candidateId||''))}
function ownedIds(){let s=new Set(DB.cards.filter(c=>c.validated&&c.candidateId).map(c=>String(c.candidateId)));Object.entries(inventory).forEach(([id,state])=>{if(state==='owned')s.add(id)});return s}
function setInventory(id,state){id=String(id);let family=familyFor(id);if(state==='missing'&&family.some(c=>capturedOwned(c.id))){alert('Une forme de cette unité est déjà confirmée dans tes captures. Corrige d’abord son identification dans « À vérifier » si nécessaire.');return}for(const c of family)delete inventory[String(c.id)];if(state!=='review')inventory[id]=state;localStorage.setItem('dokkanos-inventory',JSON.stringify(inventory));renderInventory();renderMissing();renderManualOwned();renderDuplicates();stats();renderAnalysis()}
function renderInventory(){let el=$('#inventoryList');if(!el)return;let groups=catalogFamilies(),base=groups.map(familyCard);if(!base.length)base=Object.entries(META.cards||{}).map(([id,c])=>({id,name:c.fr?.name||c.name,title:c.fr?.title||c.title,rarity:c.rarity,type:c.fr?.type||c.type,image:'assets/cards/'+id+'.webp'}));let q=norm(inventoryQuery),all=base.filter(c=>(inventoryFilter==='all'?true:inventoryState(c)===inventoryFilter)&&(!q||norm(`${c.id} ${c.name} ${c.title} ${c.rarity} ${c.type}`).includes(q))),a=all.slice(0,300);$('#inventoryCount').textContent=all.length+(all.length>300?' · 300 affichées':'');el.innerHTML=a.map(c=>{let id=String(c.id||''),st=inventoryState(c);return `<div class="panel inventory-row"><img src="${c.image||('assets/cards/'+id+'.webp')}" onerror="this.classList.add('imgfail')"><div class="inventory-info"><b>${c.name||'ID '+id}</b><small>${c.rarity||''} · ${c.type||''} · ID ${id}</small><div class="inventory-actions"><button class="${st==='owned'?'selected':''}" onclick="setInventory('${id}','owned')">✓ Je possède</button><button class="${st==='missing'?'selected':''}" onclick="setInventory('${id}','missing')">✕ Non</button><button class="${st==='review'?'selected':''}" onclick="setInventory('${id}','review')">? À vérifier</button></div></div></div>`}).join('')||'<div class="empty">Aucune carte dans ce filtre.</div>'}
function openMetaCard(id){openCard('MANUAL-'+id)}
function renderManualOwned(){let el=$('#manualOwned');if(!el)return;let ids=Object.entries(inventory).filter(([id,s])=>s==='owned'&&!capturedOwned(id)).map(([id])=>id),cards=ids.map(id=>{let m=localized(META.cards?.[id])||{},cat=(CATALOG.cards||[]).find(x=>String(x.id)===id)||{};return {id,...cat,...m,image:cat.image||('assets/cards/'+id+'.webp')}});el.innerHTML=cards.map(x=>`<article class="unit manual-owned" onclick="openMetaCard('${x.id}')"><i class="dot manual"></i>${favorites.has('MANUAL-'+x.id)?'<b class="favmark">★</b>':''}<img loading="lazy" src="${x.image}" onerror="this.classList.add('imgfail')"><div class="meta"><strong>${x.name||'ID '+x.id}</strong><small>${x.rarity||''} · confirmé manuellement</small></div></article>`).join('');$('#manualOwnedTitle').style.display=cards.length?'flex':'none'}
function renderTeam(){
  let el=$('#teamSlots');if(!el)return;initLeaderSelect();
  let leader=teamLeader?resolveCard(teamLeader):null,team=selectedTeam.map(resolveCard).filter(Boolean);
  el.innerHTML=[0,1,2,3,4,5].map(i=>{let id=selectedTeam[i],c=resolveCard(id);return c?`<button class="slot filled" onclick="openCard('${id}')"><img src="${c.image}"><small>${c.name||c.candidateId}</small><i onclick="event.stopPropagation();removeFromTeam(\'${id}\')">×</i></button>`:`<div class="slot"><b>+</b><small>Slot ${i+1}</small></div>`}).join('');
  $('#teamCount').textContent=selectedTeam.length+'/6';let ins=$('#teamInsights');if(ins)ins.innerHTML=teamInsights();
  let metrics=teamMetrics(team,leader),intel=teamIntelligence(team,leader),scoreEl=$('#teamScore');if(scoreEl)scoreEl.innerHTML=team.length?`<div class="team-score"><div><small>Cohérence structurelle</small><b>${metrics.score}/100</b></div><div><small>Couverture Leader</small><b>${metrics.covered}/${team.length}</b></div><div><small>Liens partagés</small><b>${metrics.totalLinks}</b></div><div><small>Équilibre des rôles</small><b>${metrics.roles.score}/100</b></div><div><small>Disponibilité des kits</small><b>${intel.avg}/100</b></div></div>`:'';
  let rolePanel=document.querySelector('#teamRoles');if(!rolePanel){rolePanel=document.createElement('div');rolePanel.id='teamRoles';$('#teamScore').after(rolePanel)}rolePanel.innerHTML=team.length?`<div class="team-insights"><h3>Équilibre de l’équipe</h3><div class="tags role-tags">${metrics.roles.names.map(x=>`<span>${x}</span>`).join('')}</div><div class="row"><span>Unités défensives détectées</span><b>${metrics.roles.def}</b></div><div class="row"><span>Supports détectés</span><b>${metrics.roles.support}</b></div><div class="row"><span>Profils offensifs détectés</span><b>${metrics.roles.off}</b></div></div>`:'';
  let rot=$('#rotations'),rots=bestRotations(team);if(rot)rot.innerHTML=rots.length?`<div class="team-insights"><h3>Rotations suggérées</h3>${rots.map((p,i)=>`<div class="rotation-row"><b>Rotation ${i+1}</b><span>${p.a.name||p.a.candidateId} + ${p.b.name||p.b.candidateId}</span><small>${p.links} lien(s) commun(s)</small></div>`).join('')}</div>`:'';

  let intelEl=document.querySelector('#teamIntelligence');if(!intelEl){intelEl=document.createElement('div');intelEl.id='teamIntelligence';$('#teamRoles').after(intelEl)}intelEl.innerHTML=team.length?`<div class="team-insights"><h3>Lecture intelligente</h3><div class="row"><span>Unités très conditionnelles</span><b>${intel.conditional}</b></div><div class="row"><span>Dépendances de placement</span><b>${intel.slot}</b></div>${intel.warnings.map(x=>`<p class="ai-warning">⚠ ${x}</p>`).join('')||'<p class="ai-ok">✓ Aucun déséquilibre structurel majeur détecté.</p>'}</div>`:'';
  let diag=document.querySelector('#teamDiagnostics');if(!diag){diag=document.createElement('div');diag.id='teamDiagnostics';$('#rotations').after(diag)}diag.innerHTML=teamDiagnostics(team,leader)+autoExplanation(team,leader);
  let cover=$('#leaderCoverage');if(cover)cover.innerHTML=leader?`<div class="leader-card"><img src="${leader.image}"><div><small>Leader sélectionné</small><b>${leader.name||leader.candidateId}</b><p>${leader.leader||'Aptitude Leader indisponible'}</p></div></div>`:'<div class="empty compact">Choisis un leader pour calculer la couverture de l’équipe.</div>';
  let cand=$('#teamCandidates');if(cand){let rows=ownedTeamCards().filter(x=>!selectedTeam.includes(x.boxId)&&x.boxId!==teamLeader).map(x=>({card:x,...candidateScore(x,leader,team)})).sort((a,b)=>b.score-a.score).slice(0,30);cand.innerHTML=rows.map(x=>`<div class="candidate-row ${x.coverage.covered?'covered':'uncovered'}"><img src="${x.card.image}"><div><b>${x.card.name||x.card.candidateId}</b><small>${x.card.rarity||''} · ${x.card.type||''}</small><p>${leader?explainCandidate(x.card,leader,team):'Sélectionne un leader'}</p></div><button onclick="addCandidate('${x.card.boxId}')">+</button></div>`).join('')||'<div class="empty">Aucun candidat.</div>'}
}
function countBy(cards,key){let o={};cards.forEach(c=>{let v=c[key];if(v)o[v]=(o[v]||0)+1});return Object.entries(o).sort((a,b)=>b[1]-a[1])}
function topMulti(cards,key,n=12){let o={};cards.forEach(c=>(c[key]||[]).forEach(v=>o[v]=(o[v]||0)+1));return Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n)}
function synergyReadiness(cards){let withCats=cards.filter(c=>c.categories?.length).length,withLinks=cards.filter(c=>c.links?.length).length,leaders=cards.filter(c=>c.leader).length;return {withCats,withLinks,leaders,ready:cards.length?Math.round(((withCats+withLinks+leaders)/(cards.length*3))*100):0}}
function collectionWarnings(valid,manualIds){let out=[],captured=new Set(valid.map(c=>String(c.candidateId)));for(const [id,state] of Object.entries(inventory)){if(state==='missing'&&captured.has(id))out.push('Conflit inventaire sur ID '+id)}let unresolved=(OVERLAP.conflicts||[]).filter(x=>x.status!=='resolved').length;if(unresolved)out.push(unresolved+' conflit(s) de chevauchement encore à vérifier');let noMeta=valid.filter(c=>!c.name&&!c.title).length;if(noMeta)out.push(noMeta+' position(s) validée(s) sans fiche enrichie');return out}
function bars(title,rows,total){return `<div class="panel collection-panel"><h3>${title}</h3>${rows.map(([k,n])=>`<div class="metric-row"><div><span>${k}</span><b>${n}</b></div><div class="metric-track"><i style="width:${Math.max(2,Math.round(n/Math.max(1,total)*100))}%"></i></div></div>`).join('')||'<p class="muted">Pas encore de données.</p>'}</div>`}
function renderAnalysis(){
  let el=$('#analysisContent');if(!el)return;
  let valid=DB.cards.filter(c=>c.validated&&c.candidateId),manualIds=Object.entries(inventory).filter(([,s])=>s==='owned').map(([id])=>id),seen=new Set(),owned=[];
  valid.forEach(c=>{let id=String(c.candidateId);if(!seen.has(id)){seen.add(id);owned.push(c)}});
  manualIds.forEach(id=>{if(seen.has(id))return;let m=localized(META.cards?.[id]);if(m){seen.add(id);owned.push({candidateId:id,...m})}});
  let copies={};valid.forEach(c=>copies[c.candidateId]=(copies[c.candidateId]||0)+1);let duplicateCopies=Object.values(copies).reduce((n,x)=>n+Math.max(0,x-1),0);
  let conf={};DB.cards.forEach(c=>conf[c.confidence]=(conf[c.confidence]||0)+1);
  let rarity=countBy(owned,'rarity'),types=countBy(owned,'type'),classes=countBy(owned,'class'),cats=topMulti(owned,'categories'),links=topMulti(owned,'links');
  let eza=owned.filter(c=>c.eza).length,lr=owned.filter(c=>c.rarity==='LR').length,fav=[...favorites].filter(id=>DB.cards.some(c=>c.boxId===id)||(String(id).startsWith('MANUAL-')&&inventory[String(id).slice(7)]==='owned')).length,review=DB.cards.filter(c=>!c.validated).length,synergy=synergyReadiness(owned),warnings=collectionWarnings(valid,manualIds);
  el.innerHTML=`<div class="collection-kpis"><div><b>${owned.length}</b><span>cartes uniques possédées</span></div><div><b>${lr}</b><span>LR</span></div><div><b>${eza}</b><span>EZA</span></div><div><b>${duplicateCopies}</b><span>copies en doublon</span></div><div><b>${fav}</b><span>favoris</span></div><div><b>${review}</b><span>positions à vérifier</span></div></div><div class="analysis-grid">${bars('Raretés',rarity,owned.length)}${bars('Types',types,owned.length)}${bars('Classes',classes,owned.length)}<div class="panel collection-panel"><h3>Origine de l’inventaire</h3><div class="row"><span>Confirmées depuis les captures</span><b>${new Set(valid.map(c=>String(c.candidateId))).size}</b></div><div class="row"><span>Ajouts manuels uniques</span><b>${manualIds.filter(id=>!new Set(valid.map(c=>String(c.candidateId))).has(id)).length}</b></div><div class="row"><span>Progression de validation</span><b>${Math.round((DB.cards.length-review)/Math.max(1,DB.cards.length)*100)}%</b></div></div></div><div class="panel"><h3>Catégories les plus représentées</h3><div class="rank-grid">${cats.map(([x,n])=>`<button onclick="useCollectionFilter('category','${String(x).replace(/'/g,"\\'")}')"><span>${x}</span><b>${n}</b></button>`).join('')}</div></div><div class="panel"><h3>Liens les plus représentés</h3><div class="rank-grid">${links.map(([x,n])=>`<button onclick="useCollectionFilter('link','${String(x).replace(/'/g,"\\'")}')"><span>${x}</span><b>${n}</b></button>`).join('')}</div></div><div class="panel"><h3>Préparation du moteur d’équipes</h3><div class="row"><span>Fiches avec catégories</span><b>${synergy.withCats}/${owned.length}</b></div><div class="row"><span>Fiches avec liens</span><b>${synergy.withLinks}/${owned.length}</b></div><div class="row"><span>Leader Skills disponibles</span><b>${synergy.leaders}/${owned.length}</b></div><div class="readiness"><i style="width:${synergy.ready}%"></i></div><p class="muted">Données de synergie prêtes à ${synergy.ready}%.</p></div>${warnings.length?`<div class="panel warning-panel"><h3>Contrôles restants</h3>${warnings.map(x=>`<div class="row"><span>${x}</span><b>À vérifier</b></div>`).join('')}</div>`:'<div class="panel success-panel"><h3>Contrôle collection</h3><p>✓ Aucun conflit structurel détecté.</p></div>'}<div class="panel"><h3>Qualité des identifications</h3>${Object.entries(conf).map(([k,v])=>`<div class="row"><span><i class="legend ${confClass(k)}"></i>${k}</span><b>${v}</b></div>`).join('')}</div>`;
}
function useCollectionFilter(kind,value){if(kind==='category'){categoryFilter=value;$('#categoryFilter').value=value}else{linkFilter=value;$('#linkFilter').value=value}switchView('box');render()}
function switchView(v){$$('.view').forEach(x=>x.classList.remove('on'));$('#'+v).classList.add('on');$$('nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));if(v==='duplicates')renderDuplicates();if(v==='inventory')renderInventory();if(v==='catalog')renderMissing();if(v==='teams')renderTeam();if(v==='analysis')renderAnalysis();let active=document.querySelector('nav button.on');if(active)active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})}
document.addEventListener('click',e=>{if(e.target.id==='resetFilters'){rarityFilter=typeFilter=classFilter=categoryFilter=linkFilter=ezaFilter='';favoriteOnly=false;['rarityFilter','typeFilter','classFilter','categoryFilter','linkFilter','ezaFilter'].forEach(id=>$('#'+id).value='');$('#favoriteFilter').classList.remove('on');render()}if(e.target.id==='favoriteFilter'){favoriteOnly=!favoriteOnly;e.target.classList.toggle('on',favoriteOnly);render()}if(e.target.matches('.invchip')){$('.invchip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');inventoryFilter=e.target.dataset.invf;renderInventory()}if(e.target.matches('.chip')){$$('.chip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');filter=e.target.dataset.f;render()}if(e.target.id==='autoTeam')autoBuildTeam();if(e.target.id==='clearTeam')clearTeam();if(e.target.matches('nav button'))switchView(e.target.dataset.v)});
document.addEventListener('input',e=>{if(e.target.id==='search'){query=norm(e.target.value);render()}if(e.target.id==='inventorySearch'){inventoryQuery=e.target.value;renderInventory()}});
document.addEventListener('change',e=>{if(e.target.id==='sort')sortMode=e.target.value;if(e.target.id==='rarityFilter')rarityFilter=e.target.value;if(e.target.id==='typeFilter')typeFilter=e.target.value;if(e.target.id==='classFilter')classFilter=e.target.value;if(e.target.id==='categoryFilter')categoryFilter=e.target.value;if(e.target.id==='linkFilter')linkFilter=e.target.value;if(e.target.id==='ezaFilter')ezaFilter=e.target.value;if(e.target.id==='leaderSelect'){teamLeader=e.target.value;localStorage.setItem('dokkanos-team-leader',teamLeader);if(teamLeader&&!selectedTeam.includes(teamLeader)){if(selectedTeam.length>=6)selectedTeam.pop();selectedTeam.unshift(teamLeader);localStorage.setItem('dokkanos-team',JSON.stringify(selectedTeam))}renderTeam()}render()});
window.addEventListener('online',()=>document.body.classList.remove('offline'));window.addEventListener('offline',()=>document.body.classList.add('offline'));if(!navigator.onLine)document.body.classList.add('offline');
boot().catch(()=>{document.body.innerHTML='<div class="fatal"><h2>DokkanOS</h2><p>Impossible de charger la Box. Réessaie avec une connexion internet.</p><button onclick="location.reload()">Réessayer</button></div>'});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
