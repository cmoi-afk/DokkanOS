/* Shared navigation: no dependency, no changes to collection or mission data. */
(function(){
'use strict';
const more=document.getElementById('moreNav'),drawer=document.getElementById('moreViews'),backdrop=document.getElementById('navBackdrop');
const mobile=window.matchMedia('(max-width: 899px)');
const labels={home:'Aujourd’hui',tools:'Mes outils',copilot:'Copilote',box:'Ma Box',teams:'Équipes',events:'Événements',catalog:'Catalogue',duplicates:'Potentiel',inventory:'Inventaire',analysis:'Analyse',verify:'À vérifier'};
function setMenu(open,restoreFocus=false){
 open=!!open&&mobile.matches;
 more.classList.toggle('on',open||['catalog','duplicates','inventory','analysis','verify','tools','copilot'].includes(document.body.dataset.view));
 drawer.classList.toggle('is-open',open);more.setAttribute('aria-expanded',String(open));backdrop.hidden=!open;document.body.classList.toggle('menu-open',open);
 drawer.inert=mobile.matches&&!open;
 if(mobile.matches){drawer.setAttribute('role','dialog');drawer.setAttribute('aria-label','Explorer DokkanOS');drawer.setAttribute('aria-modal','true');}else{drawer.removeAttribute('role');drawer.removeAttribute('aria-label');drawer.removeAttribute('aria-modal');}
 if(open)document.getElementById('closeMore').focus();else if(restoreFocus)more.focus();
}
function sync(){const view=document.body.dataset.view||'home';document.getElementById('currentViewLabel').textContent=labels[view]||'DokkanOS';more.classList.toggle('on',['catalog','duplicates','inventory','analysis','verify','tools','copilot'].includes(view));setMenu(false);}
more.addEventListener('click',()=>setMenu(more.getAttribute('aria-expanded')!=='true',true));
document.getElementById('closeMore').addEventListener('click',()=>setMenu(false,true));backdrop.addEventListener('click',()=>setMenu(false,true));
document.addEventListener('click',e=>{const shortcut=e.target.closest?.('[data-open-view]');if(shortcut)switchView(shortcut.dataset.openView);});
document.addEventListener('keydown',e=>{if(more.getAttribute('aria-expanded')!=='true')return;if(e.key==='Escape'){e.preventDefault();setMenu(false,true);}if(e.key==='Tab'){const buttons=[...drawer.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.addEventListener('dokkanos-view-change',()=>{sync();const heading=document.querySelector('.view.on h2');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}});
mobile.addEventListener('change',()=>setMenu(false));sync();
})();
