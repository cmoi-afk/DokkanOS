const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../tournament-model.js'),C=require('../companion-model.js');
const result={id:'sample',edition:1,date:'2026-01-03T12:00:00Z',period:'1–3 janvier',notes:'Exemple <test>',rewardReceipt:'unknown',rankings:[{scope:'local',rank:2,completeRewards:false,rewards:[{name:'Ticket <SSR>',amount:3}]}]};
const data={format:'DokkanOS',version:1,createdAt:result.date,entries:{[T.key]:JSON.stringify([result]),'dokkanos-inventory':'{"1234567":"missing"}'}};
C.parseBackup(JSON.stringify(data));
const map=new Map();const storage={get length(){return map.size},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
C.restore(storage,data);assert.deepEqual(C.backup(storage,result.date),data);assert.equal(C.summary(data).tournaments,1);
assert.equal(map.get('dokkanos-inventory'),'\{"1234567":"missing"}');
for(const alter of [r=>r.rankings[0].rank=0,r=>r.rankings.push(structuredClone(r.rankings[0])),r=>r.rankings[0].rewards[0].amount=-1,r=>r.rewardReceipt='assumed']){const bad=structuredClone(result);alter(bad);assert.throws(()=>T.validate([bad]));}
assert.throws(()=>T.validate([result,result]));
const context={window:{DokkanTournamentModel:T},storageRead:k=>storage.getItem(k)};
vm.runInNewContext(fs.readFileSync('tournaments.js','utf8'),context);let html=context.window.DokkanTournaments.render();assert(html.includes('Ticket &lt;SSR&gt;'));assert(html.includes('liste partielle'));assert(html.includes('non confirmée'));assert(!context.window.DokkanTournaments.render(2).includes('Ticket'));
map.set(T.key,'bad');assert(context.window.DokkanTournaments.render().includes('role="alert"'));
// A quota failure rolls back the entire import, including this new state key.
map.clear();map.set('dokkanos-inventory','{}');let fail=true;const broken={...storage,setItem(k,v){if(fail&&k===T.key){fail=false;throw Error('quota')}map.set(k,v)}};
assert.throws(()=>C.restore(broken,data));assert.equal(map.get('dokkanos-inventory'),'{}');assert(!map.has(T.key));
const index=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');for(const f of ['tournament-model.js','tournaments.js']){assert(index.includes(f));assert(sw.includes('./'+f));}
console.log('Tenkaichi: strict ranks/rewards, unknown receipt, escaping, edition isolation, backup round trip and rollback OK');
