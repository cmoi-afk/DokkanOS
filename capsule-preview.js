/* Default Capsule Corp interface. Uses existing actions and never writes collection data. */
(function () {
  'use strict';
  document.documentElement.dataset.interface = 'capsule';
  const homeLabel = document.querySelector('.nav-primary [data-v="home"] > span');
  if (homeLabel) homeLabel.textContent = 'Accueil';
  const dialog = document.createElement('dialog'); dialog.className = 'capsule-filter-sheet';
  dialog.setAttribute('aria-labelledby', 'capsuleFilterTitle');
  dialog.innerHTML = '<div class="capsule-sheet-heading"><div><span class="eyebrow">MA BOX</span><h2 id="capsuleFilterTitle">Filtrer les cartes</h2></div><button type="button" aria-label="Fermer les filtres">×</button></div><div class="capsule-filter-body"></div><button type="button" class="primary capsule-filter-done">Voir les résultats</button>';
  document.body.append(dialog);
  let origin, opener;
  function closeFilters() { dialog.close(); }
  dialog.querySelector('.capsule-sheet-heading button').addEventListener('click', closeFilters);
  dialog.querySelector('.capsule-filter-done').addEventListener('click', closeFilters);
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientY<r.top || e.clientX<r.left || e.clientX>r.right || e.clientY>r.bottom) closeFilters(); } });
  dialog.addEventListener('close', () => {
    const controls = dialog.querySelector('.box-tools');
    if (controls && origin) { origin.replaceWith(controls); origin = null; }
    document.body.classList.remove('capsule-filters-open');
    opener?.focus({preventScroll:true});
  });
  function enhance() {
    const box = document.getElementById('box');
    if (!box || box.querySelector('.capsule-collection-tabs')) return;
    const tabs = document.createElement('div'); tabs.className = 'capsule-collection-tabs';
    tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Ma collection');
    for (const [title, view] of [['Mes cartes','box'],['À vérifier','verify'],['Manquantes','catalog'],['Potentiel','duplicates']]) {
      const b=document.createElement('button'); b.textContent=title;
      b.setAttribute('data-open-view',view); if(view==='box')b.setAttribute('aria-current','page'); tabs.append(b);
    }
    box.querySelector('.collection-heading')?.after(tabs);
  }
  document.addEventListener('click', e => {
    if (!e.target.closest?.('.ux-search-dock [data-ux-scroll="boxTools"]')) return;
    const controls = document.querySelector('#box .box-tools');
    if (!controls || typeof dialog.showModal !== 'function') return;
    e.preventDefault(); e.stopImmediatePropagation(); opener=e.target.closest('button');
    origin=document.createComment('collection filters'); controls.before(origin);
    dialog.querySelector('.capsule-filter-body').append(controls);
    const details=controls.querySelector('details'); if(details)details.open=true;
    dialog.showModal(); document.body.classList.add('capsule-filters-open');
  }, true);
  window.addEventListener('dokkanos-view-change', () => { if(dialog.open)dialog.close(); enhance(); });
  const resize=()=>{const h=document.querySelector('.app-header').getBoundingClientRect().height; document.documentElement.style.setProperty('--capsule-header',h+'px');};
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(document.querySelector('.app-header'));
  window.addEventListener('resize',resize); resize(); enhance();
})();
