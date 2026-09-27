let DB={cards:[]}, META={cards:{}}, CATALOG={cards:[]}, OVERLAP={conflicts:[]}, filter='all', query='', sortMode='box', selectedTeam=[], verifyLimit=30, inventory={}, inventoryFilter='review', inventoryQuery='';
const norm=s=>(s??'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
async function boot(){
  DB=await fetch('collection.json').then(r=>r.ok?r.json():fetch('data.json').then(x=>x.json()));
  try{META=await fetch('card-meta.json').then(r=>r.ok?r.json():({cards:{}}))}catch(e){META={cards:{}}}
  try{CATALOG=await fetch('catalog.json').then(r=>r.ok?r.json():({cards:[]}))}catch(e){CATALOG={cards:[]}}
  try{OVERLAP=await fetch('overlap-conflicts.json').then(r=>r.ok?r.json():({conflicts:[]}))}catch(e){OVERLAP={conflicts:[]}}
  applyMetadata(); restoreEdits();
  render(); stats(); renderDuplicates(); renderMissing(); renderInventory(); renderManualOwned(); renderTeam(); renderAnalysis();
}
function localized(m){if(!m)return null;let fr=m.fr||{};return {...m,name:fr.name||m.name,title:fr.title||m.title,type:fr.type||m.type,class:fr.class||m.class,categories:fr.categories||m.categories,links:fr.links||m.links,leader:fr.leader||m.leader,passive:fr.passive||m.passive,superAttack:fr.superAttack||m.superAttack,active:fr.active||m.active}}
function applyMetadata(){DB.cards.forEach(c=>{let m=localized(META.cards?.[String(c.candidateId)]);if(m)Object.assign(c,m)})}
function confClass(c){return c==='Très forte'?'tf':c==='Forte'?'f':c==='Moyenne'?'m':c==='Validée manuellement'?'manual':'v'}
function restoreEdits(){
  let edits=[]; try{edits=JSON.parse(localStorage.getItem('dokkanos-edits')||'[]')}catch(e){}
  edits.forEach(a=>{let c=DB.cards.find(x=>x.boxId===a.boxId);if(!c)return;Object.assign(c,a);if(a.candidateId){c.image='assets/cards/'+a.candidateId+'.webp';let m=localized(META.cards?.[String(a.candidateId)]);if(m)Object.assign(c,m)}});
  try{selectedTeam=JSON.parse(localStorage.getItem('dokkanos-team')||'[]').filter(id=>DB.cards.some(c=>c.boxId===id)).slice(0,6)}catch(e){selectedTeam=[]}
  try{inventory=JSON.parse(localStorage.getItem('dokkanos-inventory')||'{}')}catch(e){inventory={}}
}
function searchText(c){return norm([c.boxId,c.candidateId,c.name,c.title,c.rarity,c.type,c.class,c.leader,c.passive,c.superAttack,c.active,...(c.categories||[]),...(c.links||[])].join(' '))}
function visibleCards(){
  let a=DB.cards.filter(c=>(filter==='all'||(filter==='valid'&&c.validated)||(filter==='check'&&!c.validated))&&(!query||searchText(c).includes(query)));
  if(sortMode==='confidence')a.sort((x,y)=>(y.inliers||0)-(x.inliers||0));
  if(sortMode==='id')a.sort((x,y)=>String(x.candidateId).localeCompare(String(y.candidateId)));
  return a;
}
function render(){
  let a=visibleCards();
  $('#grid').innerHTML=a.map(c=>`<article class="unit" onclick="openCard('${c.boxId}')"><i class="dot ${confClass(c.confidence)}"></i><img loading="lazy" src="${c.image}" onerror="this.classList.add('imgfail')"><div class="meta"><strong>${c.name||'ID '+(c.candidateId||'—')}</strong><small>${c.boxId} · ${c.confidence}</small></div></article>`).join('')||'<div class="empty">Aucune carte</div>';
  $('#resultCount').textContent=a.length+' résultat'+(a.length>1?'s':'');
  renderVerify();
}
function stats(){
  let v=DB.cards.filter(c=>c.validated).length, unique=new Set(DB.cards.filter(c=>c.candidateId).map(c=>c.candidateId)).size;
  $('#nAll').textContent=DB.cards.length;$('#nVal').textContent=v;$('#nCheck').textContent=DB.cards.length-v;$('#nUnique').textContent=unique;
  $('#progressBar').style.width=(DB.cards.length?Math.round(v/DB.cards.length*100):0)+'%';
  $('#progressText').textContent=(DB.cards.length?Math.round(v/DB.cards.length*100):0)+'% validé';
}
function renderVerify(){
  let priority=new Set((OVERLAP.conflicts||[]).flatMap(x=>x.observations||[])), pending=DB.cards.filter(c=>!c.validated).sort((a,b)=>(priority.has(b.boxId)?1:0)-(priority.has(a.boxId)?1:0)), a=pending.slice(0,verifyLimit);
  $('#verifyList').innerHTML=a.map(c=>`<div class="panel"><b>${c.boxId}</b><p class="muted">${c.capture} · ${c.position} · ${c.confidence}</p><div class="verify"><div><img src="${c.crop}"><label>Ta capture</label></div><div><img src="${c.image}"><label>ID ${c.candidateId}</label></div><div><img src="${c.runnerImage}"><label>ID ${c.runnerId}</label></div><button onclick="choose('${c.boxId}','${c.candidateId}')">Choisir 1</button><button onclick="choose('${c.boxId}','${c.runnerId}')">Choisir 2</button><button onclick="choose('${c.boxId}','')">Aucun</button></div></div>` ).join('')+(pending.length>verifyLimit?`<button class="loadmore" onclick="loadMoreVerify()">Afficher ${Math.min(30,pending.length-verifyLimit)} de plus · ${pending.length-verifyLimit} restantes</button>`:'')||'<div class="empty">Tout est validé 🎉</div>';
}
function loadMoreVerify(){verifyLimit+=30;renderVerify()}
function saveEdits(){localStorage.setItem('dokkanos-edits',JSON.stringify(DB.cards.filter(x=>x._edited).map(x=>({boxId:x.boxId,candidateId:x.candidateId,validated:x.validated,confidence:x.confidence,_edited:true}))))}
function choose(id,val){
  let c=DB.cards.find(x=>x.boxId===id);if(!c)return;c._edited=true;
  if(val){c.candidateId=val;c.image='assets/cards/'+val+'.webp';let m=localized(META.cards?.[String(val)]);if(m)Object.assign(c,m);c.validated=true;c.confidence='Validée manuellement'}
  else{c.candidateId='';c.validated=false;c.confidence='À revoir'}
  saveEdits();render();stats();renderAnalysis();
}
function openCard(id){
  let c=DB.cards.find(x=>x.boxId===id), inTeam=selectedTeam.includes(id);
  $('#sheet').innerHTML=`<button onclick="closeSheet()" class="close">Fermer</button><div class="hero"><img src="${c.image}"><div><h2>${c.name||'Carte '+(c.candidateId||'—')}</h2><div>${c.title||'Fiche à enrichir'}</div><p class="muted">${c.confidence}</p><button class="primary" onclick="toggleTeam('${id}')">${inTeam?'Retirer de l’équipe':'Ajouter à l’équipe'}</button></div></div>${[['ID Dokkan',c.candidateId||'—'],['Capture',c.capture+' '+c.position],['Rareté',c.rarity||'—'],['Type',c.type||'—'],['Classe',c.class||'—'],['EZA / SEZA',(c.eza||'—')+' / '+(c.seza||'—')],['Leader',c.leader||'—'],['Passif',c.passive||'—'],['SP',c.superAttack||'—'],['Active',c.active||'—'],['Catégories',(c.categories||[]).join(', ')||'—'],['Liens',(c.links||[]).join(', ')||'—']].map(x=>`<div class="kv"><span>${x[0]}</span><span>${x[1]}</span></div>`).join('')}`;
  $('#sheet').classList.add('on')
}
function closeSheet(){$('#sheet').classList.remove('on')}
function toggleTeam(id){
  if(selectedTeam.includes(id))selectedTeam=selectedTeam.filter(x=>x!==id);else if(selectedTeam.length<6)selectedTeam.push(id);else return alert('Équipe complète : 6 cartes maximum.');
  localStorage.setItem('dokkanos-team',JSON.stringify(selectedTeam));renderTeam();openCard(id);
}
function commonValues(cards,key){if(cards.length<2)return[];let count={};cards.forEach(c=>new Set(c[key]||[]).forEach(v=>count[v]=(count[v]||0)+1));return Object.entries(count).filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,8)}
function teamInsights(){let cards=selectedTeam.map(id=>DB.cards.find(c=>c.boxId===id)).filter(Boolean),cats=commonValues(cards,'categories'),links=commonValues(cards,'links');if(!cards.length)return '<p class="muted">Ajoute des cartes pour analyser les synergies.</p>';return `<div class="team-insights"><h3>Synergies détectées</h3><p class="muted">${cards.filter(c=>c.name||c.categories?.length||c.links?.length).length}/${cards.length} cartes avec données enrichies</p>${cats.length?`<h4>Catégories communes</h4><div class="tags">${cats.map(([x,n])=>`<span>${x} · ${n}</span>`).join('')}</div>`:''}${links.length?`<h4>Liens communs</h4><div class="tags">${links.map(([x,n])=>`<span>${x} · ${n}</span>`).join('')}</div>`:''}${!cats.length&&!links.length?'<p class="muted">Les synergies apparaîtront automatiquement à mesure que les fiches seront enrichies.</p>':''}</div>`}
function renderDuplicates(){let el=$('#duplicateList');if(!el)return;let groups={};DB.cards.filter(c=>c.candidateId).forEach(c=>(groups[c.candidateId]??=[]).push(c));let d=Object.entries(groups).filter(([,a])=>a.length>1).sort((a,b)=>b[1].length-a[1].length);$('#dupCount').textContent=d.length+' IDs';el.innerHTML=d.map(([id,a])=>`<div class="panel dup-row"><img src="${a[0].image}"><div><b>${a[0].name||'ID '+id}</b><p class="muted">${a.length} exemplaires · ${a.length-1} doublon(s)</p><small>${a.map(x=>x.boxId).join(' · ')}</small></div></div>`).join('')||'<div class="empty">Aucun doublon détecté.</div>'}
function renderMissing(){let el=$('#missingList');if(!el)return;let owned=ownedIds(),allowed=new Set(['SSR','UR','LR']);let a=(CATALOG.cards||[]).filter(c=>allowed.has(c.rarity)&&inventory[String(c.id)]==='missing');$('#missingCount').textContent=a.length;el.innerHTML=a.slice(0,300).map(c=>`<article class="unit"><img loading="lazy" src="${c.image||''}"><div class="meta"><strong>${c.name||'ID '+c.id}</strong><small>${c.rarity||''} · ${c.type||''}</small></div></article>`).join('')||'<div class="empty">Le catalogue global est en cours de génération.</div>'}
function inventoryState(card){let id=String(card.id||card.candidateId||'');if(inventory[id])return inventory[id];return DB.cards.some(c=>c.validated&&String(c.candidateId)===id)?'owned':'review'}
function ownedIds(){let s=new Set(DB.cards.filter(c=>c.validated&&c.candidateId).map(c=>String(c.candidateId)));Object.entries(inventory).forEach(([id,state])=>{if(state==='owned')s.add(id);if(state==='missing')s.delete(id)});return s}
function setInventory(id,state){id=String(id);inventory[id]=state;localStorage.setItem('dokkanos-inventory',JSON.stringify(inventory));renderInventory();renderMissing();renderManualOwned();renderDuplicates();stats()}
function renderInventory(){let el=$('#inventoryList');if(!el)return;let base=(CATALOG.cards||[]).filter(c=>['SSR','UR','LR'].includes(c.rarity));if(!base.length)base=Object.entries(META.cards||{}).map(([id,c])=>({id,name:c.fr?.name||c.name,title:c.fr?.title||c.title,rarity:c.rarity,type:c.fr?.type||c.type,image:'assets/cards/'+id+'.webp'}));let q=norm(inventoryQuery),a=base.filter(c=>(inventoryFilter==='all'?true:inventoryState(c)===inventoryFilter)&&(!q||norm(`${c.id} ${c.name} ${c.title} ${c.rarity} ${c.type}`).includes(q))).slice(0,300);$('#inventoryCount').textContent=a.length;el.innerHTML=a.map(c=>{let id=String(c.id||''),st=inventoryState(c);return `<div class="panel inventory-row"><img src="${c.image||('assets/cards/'+id+'.webp')}" onerror="this.classList.add('imgfail')"><div class="inventory-info"><b>${c.name||'ID '+id}</b><small>${c.rarity||''} · ${c.type||''} · ID ${id}</small><div class="inventory-actions"><button class="${st==='owned'?'selected':''}" onclick="setInventory('${id}','owned')">✓ Je possède</button><button class="${st==='missing'?'selected':''}" onclick="setInventory('${id}','missing')">✕ Non</button><button class="${st==='review'?'selected':''}" onclick="setInventory('${id}','review')">? À vérifier</button></div></div></div>`}).join('')||'<div class="empty">Aucune carte dans ce filtre.</div>'}
function renderManualOwned(){let el=$('#manualOwned');if(!el)return;let ids=Object.entries(inventory).filter(([,s])=>s==='owned').map(([id])=>id),cards=ids.map(id=>{let m=localized(META.cards?.[id])||{},cat=(CATALOG.cards||[]).find(x=>String(x.id)===id)||{};return {id,...cat,...m,image:cat.image||('assets/cards/'+id+'.webp')}});el.innerHTML=cards.map(x=>`<article class="unit manual-owned"><i class="dot manual"></i><img loading="lazy" src="${x.image}" onerror="this.classList.add('imgfail')"><div class="meta"><strong>${x.name||'ID '+x.id}</strong><small>${x.rarity||''} · confirmé manuellement</small></div></article>`).join('');$('#manualOwnedTitle').style.display=cards.length?'flex':'none'}
function renderTeam(){
  let el=$('#teamSlots');if(!el)return;
  el.innerHTML=[0,1,2,3,4,5].map(i=>{let id=selectedTeam[i],c=DB.cards.find(x=>x.boxId===id);return c?`<button class="slot filled" onclick="openCard('${id}')"><img src="${c.image}"><small>${c.name||c.candidateId}</small></button>`:`<div class="slot"><b>+</b><small>Slot ${i+1}</small></div>`}).join('');
  $('#teamCount').textContent=selectedTeam.length+'/6';let ins=$('#teamInsights');if(ins)ins.innerHTML=teamInsights();
}
function renderAnalysis(){
  let el=$('#analysisContent');if(!el)return;
  let valid=DB.cards.filter(c=>c.validated), manual=valid.filter(c=>c.confidence==='Validée manuellement').length, enriched=valid.filter(c=>c.name||c.title||c.rarity||c.type).length;
  let conf={};DB.cards.forEach(c=>conf[c.confidence]=(conf[c.confidence]||0)+1);
  el.innerHTML=`<div class="analysis-grid"><div class="panel"><h3>Qualité de la Box</h3><b class="big">${valid.length} / ${DB.cards.length}</b><p class="muted">positions validées · ${manual} correction(s) manuelle(s) · ${enriched} fiche(s) enrichie(s)</p></div><div class="panel"><h3>Identifiants uniques</h3><b class="big">${new Set(valid.map(c=>c.candidateId).filter(Boolean)).size}</b><p class="muted">IDs différents parmi les positions validées</p></div></div><div class="panel"><h3>Confiance des détections</h3>${Object.entries(conf).map(([k,v])=>`<div class="row"><span><i class="legend ${confClass(k)}"></i>${k}</span><b>${v}</b></div>`).join('')}</div><div class="panel"><h3>Prochaine étape</h3><p class="muted">Les fiches Dokkan détaillées (nom, rareté, type, leader, passif, liens et catégories) seront enrichies à partir des IDs validés. Le moteur de synergies utilisera ensuite ces données.</p></div>`;
}
function switchView(v){$$('.view').forEach(x=>x.classList.remove('on'));$('#'+v).classList.add('on');$$('nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));if(v==='duplicates')renderDuplicates();if(v==='inventory')renderInventory();if(v==='catalog')renderMissing();if(v==='teams')renderTeam();if(v==='analysis')renderAnalysis()}
document.addEventListener('click',e=>{if(e.target.matches('.invchip')){$('.invchip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');inventoryFilter=e.target.dataset.invf;renderInventory()}if(e.target.matches('.chip')){$$('.chip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');filter=e.target.dataset.f;render()}if(e.target.matches('nav button'))switchView(e.target.dataset.v)});
document.addEventListener('input',e=>{if(e.target.id==='search'){query=norm(e.target.value);render()}if(e.target.id==='inventorySearch'){inventoryQuery=e.target.value;renderInventory()}});
document.addEventListener('change',e=>{if(e.target.id==='sort'){sortMode=e.target.value;render()}});
window.addEventListener('online',()=>document.body.classList.remove('offline'));window.addEventListener('offline',()=>document.body.classList.add('offline'));if(!navigator.onLine)document.body.classList.add('offline');
boot().catch(()=>{document.body.innerHTML='<div class="fatal"><h2>DokkanOS</h2><p>Impossible de charger la Box. Réessaie avec une connexion internet.</p><button onclick="location.reload()">Réessayer</button></div>'});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
