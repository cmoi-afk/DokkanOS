let DB={cards:[]}, filter='all', query='', sortMode='box', selectedTeam=[];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
async function boot(){
  DB=await fetch('data.json').then(r=>r.json());
  restoreEdits();
  render(); stats(); renderTeam(); renderAnalysis();
}
function confClass(c){return c==='Très forte'?'tf':c==='Forte'?'f':c==='Moyenne'?'m':c==='Validée manuellement'?'manual':'v'}
function restoreEdits(){
  let edits=[]; try{edits=JSON.parse(localStorage.getItem('dokkanos-edits')||'[]')}catch(e){}
  edits.forEach(a=>{let c=DB.cards.find(x=>x.boxId===a.boxId);if(!c)return;Object.assign(c,a);if(a.candidateId)c.image='assets/cards/'+a.candidateId+'.webp';});
  try{selectedTeam=JSON.parse(localStorage.getItem('dokkanos-team')||'[]').filter(id=>DB.cards.some(c=>c.boxId===id)).slice(0,6)}catch(e){selectedTeam=[]}
}
function visibleCards(){
  let a=DB.cards.filter(c=>(filter==='all'||(filter==='valid'&&c.validated)||(filter==='check'&&!c.validated))&&(!query||(`${c.boxId} ${c.candidateId} ${c.name} ${c.title} ${c.rarity} ${c.type}`).toLowerCase().includes(query)));
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
  let a=DB.cards.filter(c=>!c.validated).slice(0,30);
  $('#verifyList').innerHTML=a.map(c=>`<div class="panel"><b>${c.boxId}</b><p class="muted">${c.capture} · ${c.position} · ${c.confidence}</p><div class="verify"><div><img src="${c.crop}"><label>Ta capture</label></div><div><img src="${c.image}"><label>ID ${c.candidateId}</label></div><div><img src="${c.runnerImage}"><label>ID ${c.runnerId}</label></div><button onclick="choose('${c.boxId}','${c.candidateId}')">Choisir 1</button><button onclick="choose('${c.boxId}','${c.runnerId}')">Choisir 2</button><button onclick="choose('${c.boxId}','')">Aucun</button></div></div>`).join('')||'<div class="empty">Tout est validé 🎉</div>';
}
function saveEdits(){localStorage.setItem('dokkanos-edits',JSON.stringify(DB.cards.filter(x=>x._edited).map(x=>({boxId:x.boxId,candidateId:x.candidateId,validated:x.validated,confidence:x.confidence,_edited:true}))))}
function choose(id,val){
  let c=DB.cards.find(x=>x.boxId===id);if(!c)return;c._edited=true;
  if(val){c.candidateId=val;c.image='assets/cards/'+val+'.webp';c.validated=true;c.confidence='Validée manuellement'}
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
function renderTeam(){
  let el=$('#teamSlots');if(!el)return;
  el.innerHTML=[0,1,2,3,4,5].map(i=>{let id=selectedTeam[i],c=DB.cards.find(x=>x.boxId===id);return c?`<button class="slot filled" onclick="openCard('${id}')"><img src="${c.image}"><small>${c.name||c.candidateId}</small></button>`:`<div class="slot"><b>+</b><small>Slot ${i+1}</small></div>`}).join('');
  $('#teamCount').textContent=selectedTeam.length+'/6';
}
function renderAnalysis(){
  let el=$('#analysisContent');if(!el)return;
  let valid=DB.cards.filter(c=>c.validated), manual=valid.filter(c=>c.confidence==='Validée manuellement').length;
  let conf={};DB.cards.forEach(c=>conf[c.confidence]=(conf[c.confidence]||0)+1);
  el.innerHTML=`<div class="analysis-grid"><div class="panel"><h3>Qualité de la Box</h3><b class="big">${valid.length} / ${DB.cards.length}</b><p class="muted">positions validées · ${manual} correction(s) manuelle(s)</p></div><div class="panel"><h3>Identifiants uniques</h3><b class="big">${new Set(valid.map(c=>c.candidateId).filter(Boolean)).size}</b><p class="muted">IDs différents parmi les positions validées</p></div></div><div class="panel"><h3>Confiance des détections</h3>${Object.entries(conf).map(([k,v])=>`<div class="row"><span><i class="legend ${confClass(k)}"></i>${k}</span><b>${v}</b></div>`).join('')}</div><div class="panel"><h3>Prochaine étape</h3><p class="muted">Les fiches Dokkan détaillées (nom, rareté, type, leader, passif, liens et catégories) seront enrichies à partir des IDs validés. Le moteur de synergies utilisera ensuite ces données.</p></div>`;
}
function switchView(v){$$('.view').forEach(x=>x.classList.remove('on'));$('#'+v).classList.add('on');$$('nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));if(v==='teams')renderTeam();if(v==='analysis')renderAnalysis()}
document.addEventListener('click',e=>{if(e.target.matches('.chip')){$$('.chip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');filter=e.target.dataset.f;render()}if(e.target.matches('nav button'))switchView(e.target.dataset.v)});
document.addEventListener('input',e=>{if(e.target.id==='search'){query=e.target.value.toLowerCase();render()}});
document.addEventListener('change',e=>{if(e.target.id==='sort'){sortMode=e.target.value;render()}});
boot();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
