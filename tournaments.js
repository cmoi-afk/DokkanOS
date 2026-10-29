(function(){'use strict';
const M=window.DokkanTournamentModel;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rows(){try{return M.validate(JSON.parse(storageRead(M.key)||'[]'));}catch(_){return null;}}
function render(edition){
 const data=rows();if(data===null)return '<p role="alert">Le suivi Tenkaichi est illisible. Conserve ta sauvegarde avant de le modifier.</p>';
 const selected=data.filter(r=>!edition||r.edition===Number(edition)).sort((a,b)=>b.edition-a.edition);
 return '<section class="tournament-results"><h2>Mes Tenkaichi Budokai</h2>'+selected.map(r=>'<article class="plan-card"><span class="eyebrow">'+r.edition+'e TENKAICHI BUDOKAI</span><p>'+esc(r.period)+'</p><div class="companion-columns">'+r.rankings.map(s=>'<section><h3>'+ (s.scope==='local'?'Classement local':'Classement général')+' : '+s.rank+(s.rank===1?'er':'e')+'</h3><ul>'+s.rewards.map(a=>'<li>'+esc(a.name)+' ×'+a.amount+'</li>').join('')+'</ul>'+(!s.completeRewards?'<p class="muted">Récompenses visibles sur la capture ; liste partielle.</p>':'')+'</section>').join('')+'</div><p class="muted">'+(r.rewardReceipt==='received'?'Réception confirmée.':'Récompenses attribuées ; récupération dans la boîte à cadeaux non confirmée.')+'</p>'+(r.notes?'<p class="journal-text">'+esc(r.notes)+'</p>':'')+'</article>').join('')+(selected.length?'':'<p class="muted">Aucun résultat de tournoi enregistré.</p>')+'<p class="muted">Ces résultats sont inclus dans ta sauvegarde complète. Ils ne modifient pas les quantités de ton inventaire.</p></section>';
}
window.DokkanTournaments={rows,render};
})();
