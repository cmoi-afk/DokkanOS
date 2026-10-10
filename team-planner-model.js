/* Transparent comparisons and legal opening turns, never a damage simulator. */
(function(root){'use strict';
const instance=c=>String(c.boxId||c.id),sum=(a,f)=>a.reduce((n,x)=>n+f(x),0);
function metrics(e){return {defense:Math.round(sum(e.profiles||[],p=>p.defense||0)),offense:Math.round(sum(e.profiles||[],p=>p.offense||0)),anchors:(e.profiles||[]).filter(p=>p.slot1>=32).length,links:e.synergy?.linkTotal||0,covered:(e.cover||[]).filter(p=>p.covered).length,leader:Math.round(sum(e.cover||[],p=>(p.atk||0)+(p.def||0)+(p.hp||0))),boss:Math.round(sum(e.bossFits||[],p=>p.score||0)),incomplete:(e.profiles||[]).filter(p=>!p.complete).length,deficit:e.check?.deficit||0};}
function compare(a,b){const A=metrics(a),B=metrics(b),deltas=Object.keys(A).map(key=>({key,a:A[key],b:B[key],delta:B[key]-A[key]}));let preferred='equal',reason='Les évaluations sont proches : compare les conditions en combat.';
 if(A.deficit!==B.deficit){preferred=A.deficit<B.deficit?'A':'B';reason='Cette composition remplit davantage de contraintes de mission.';}else if(A.covered!==B.covered){preferred=A.covered>B.covered?'A':'B';reason='Davantage de cartes bénéficient du leader.';}else if(Number.isFinite(a.score)&&Number.isFinite(b.score)&&Math.abs(a.score-b.score)>1){preferred=a.score>b.score?'A':'B';reason='Le score heuristique la préfère pour le boss et la priorité actuellement sélectionnés.';}
 return {A,B,deltas,preferred,reason,uncertain:!!(A.incomplete||B.incomplete)};
}
function replacement(E,before,after,oldCard,newCard,context={}){const diff=compare(before,after),reasons=[];const oldRot=before.rotations?.find(r=>[r.a,r.b,r.third].some(c=>c&&instance(c)===instance(oldCard))),newRot=after.rotations?.find(r=>[r.a,r.b,r.third].some(c=>c&&instance(c)===instance(newCard)));
 const protect=(card,rot)=>E.placementProfile(card,1,rot?[rot.a,rot.b,rot.third].filter(Boolean):[card],context,rot?[rot.a,rot.b,rot.third].filter(Boolean):[card]).guaranteedProtection;
 if(protect(newCard,newRot)&&!protect(oldCard,oldRot))reasons.push('Protection avant sa propre attaque détectée en première position : vérifie ses conditions.');
 if(!protect(newCard,newRot)&&protect(oldCard,oldRot))reasons.push('Perte d’une protection détectée avant attaque : attention au premier slot.');
 for(const x of diff.deltas.filter(x=>x.delta&&['defense','offense','anchors','links','covered','boss'].includes(x.key))){const labels={defense:'Indice défensif',offense:'Indice offensif',anchors:'Profils pour le slot 1',links:'Liens partagés',covered:'Cartes sous le leader',boss:'Adaptation au boss'};reasons.push(labels[x.key]+' : '+x.a+' → '+x.b+' ('+(x.delta>0?'+':'')+x.delta+').');}
 return reasons.length?reasons:['Indicateurs similaires : le choix dépend des conditions et synergies du passif.'];
}
function opening(E,cards,order,rotations=[],context={}){if(cards.length!==7||new Set(cards.map(instance)).size!==7||order.length!==7||new Set(order).size!==7||order.some(k=>!cards.some(c=>instance(c)===k)))throw Error('Indique une fois chacune des sept cartes, ami compris.');
 const byId=new Map(cards.map(c=>[instance(c),c])),queue=order.map((id,i)=>({id,due:i<3?1:i<6?2:3})),turns=[];
 for(let turn=1;turn<=3;turn++){const drawn=queue.filter(x=>x.due<=turn).slice(0,3);if(drawn.length!==3)throw Error('Ordre de retour incohérent.');drawn.forEach(x=>queue.splice(queue.indexOf(x),1));const units=drawn.map(x=>byId.get(x.id)),perms=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];let best=null;
  for(const perm of perms){const row=perm.map(i=>units[i]),placements=row.map((c,i)=>E.placementProfile(c,i+1,cards,context,row)),duo=rotations.some(r=>[instance(r.a),instance(r.b)].every(k=>row.slice(0,2).some(c=>instance(c)===k))),score=sum(placements,p=>p.score)+E.links(row[0],row[1]).length*8+E.links(row[1],row[2]).length*4+(duo?80:0);if(!best||score>best.score)best={cards:row,placements,score,duo};}
  best.cards.forEach((c,i)=>queue.push({id:instance(c),due:turn+(i===2?3:2)}));turns.push({turn,...best,returns:best.cards.map((c,i)=>({id:instance(c),turn:turn+(i===2?3:2)}))});
 }return turns;
}
function validate(x){if(!x||typeof x!=='object'||x.version!==1||typeof x.signature!=='string'||x.signature.length>50000||!Array.isArray(x.order)||![0,7].includes(x.order.length)||new Set(x.order).size!==x.order.length||x.order.some(k=>typeof k!=='string'||k.length>120))throw Error('Plan de départ invalide.');return x;}
const API={metrics,compare,replacement,opening,validate};if(typeof module!=='undefined')module.exports=API;root.DokkanTeamPlannerModel=API;
})(typeof window!=='undefined'?window:globalThis);
