/* Applying an update is explicit while DokkanOS is open. */
(function(){
'use strict';
const version='3.0.0';
let registration, latest='', message='', checking=false, applying=false;

function render(){
 const panel=document.getElementById('releaseStatus');
 if(!panel)return;
 const available=!!registration?.waiting||!!latest&&latest!==version;
 panel.innerHTML='<section class="plan-card"><h3>Version '+version+'</h3><p>Ma session Dokkan, galeries de leaders, carnet de farming et reprise de combat.</p>'
  +(available?'<p>Une mise à jour est disponible'+(latest&&latest!==version?' · '+teamEsc(latest):'')+'.</p>':'')
  +'<div class="companion-actions"><button data-release-check '+(checking||applying?'disabled':'')+'>Vérifier la version</button>'
  +(available?'<button class="primary" data-release-apply '+(applying?'disabled':'')+'>Appliquer et recharger</button>':'')+'</div><p role="status">'+teamEsc(message)+'</p></section>';
}

async function check(){
 checking=true;message='Vérification en cours…';render();
 try{
  const response=await fetch('./release.json',{cache:'no-store'});
  if(!response.ok)throw Error();
  const data=await response.json();
  if(!/^\d+\.\d+\.\d+$/.test(data.version))throw Error();
  latest=data.version;
  await registration?.update();
  message=latest===version&&!registration?.waiting?'Tu as la dernière version.':'Version publiée · '+latest;
 }catch(e){message='Impossible de vérifier la version. Réessaie avec une connexion.';}
 finally{checking=false;render();}
}
function apply(){
 if(applying)return;
 if(document.querySelector('dialog[open], #sheet.on')||typeof teamBusy!=='undefined'&&teamBusy){
  message='Ferme la fiche ouverte ou termine la recherche d’équipe avant de recharger.';render();return;
 }
 if(registration?.waiting){
  applying=true;message='Installation en cours…';render();
  registration.waiting.postMessage({type:'APPLY_UPDATE'});
  setTimeout(()=>{if(applying){applying=false;message='Installation en attente. Tu peux réessayer.';render();}},12000);
 }else location.reload();
}

document.addEventListener('click',event=>{
 const data=event.target.closest?.('button')?.dataset;
 if(data?.releaseCheck!==undefined)check();
 if(data?.releaseApply!==undefined)apply();
});
if('serviceWorker' in navigator){
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(applying)location.reload();else render();});
 navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{
  registration=reg;
  reg.addEventListener('updatefound',()=>{
   const worker=reg.installing;
   worker?.addEventListener('statechange',render);
  });
  render();
 }).catch(()=>{message='Le mode hors ligne n’a pas pu être préparé.';render();});
}
window.DokkanRelease={render};
})();
