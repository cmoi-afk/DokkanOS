const assert=require('node:assert/strict'),fs=require('fs'),E=require('../team-engine');
const p=JSON.parse(fs.readFileSync('boss-profiles.json')).profiles['https://www.dbz-dokkanbattle.com/quest/1769/17690045'];
const all=E.bossAnalysis(p),boss=name=>{const x=all.entries.find(b=>b.name===name);assert(x);return E.bossAnalysis(p,[],x.key)};
const majin=boss('Majin Vegeta'),m=E.bossTips(majin);assert(!majin.growth);assert(m.some(t=>t.title.includes('baisse d’ATT propre')));assert(m.some(t=>t.title.includes('seuil de PV')));assert(!m.some(t=>t.title.includes('esquive')));
const g=boss('Son Goku'),tips=E.bossTips(g);assert(g.disableDodge&&g.bossDodge);assert(tips.some(t=>t.title.includes('sans compter sur l’esquive')));assert(tips.some(t=>t.title.includes('attaques esquivées')));assert(tips.some(t=>t.detail.includes('Super')));
const dabra=boss('Dabra');assert(E.bossTips(dabra).some(t=>t.title.includes('Saiyan de sang-mêlé')));
const incomplete=E.bossTips(E.bossAnalysis(null));assert.equal(incomplete.length,1);assert(incomplete[0].title.includes('incomplet'));assert(!incomplete[0].detail.includes('annuler l’esquive'));
assert(E.bossTips(dabra,{requirements:[{kind:'category'}]}).some(t=>t.title==='Respecter l’objectif choisi'));
console.log('Sourced boss tips, changing threats, per-hit ATK decrease, HP thresholds, dodge counters, category hazards and missing-data limits: OK');
