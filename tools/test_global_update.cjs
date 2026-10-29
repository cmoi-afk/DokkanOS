const fs=require('fs'),assert=require('assert'),vm=require('vm');
const M=require('../mission-migration.js'),C=require('../catalog-model.js'),E=require('../event-model.js'),B=require('../team-battle-model.js');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),events=read('events.json'),meta=read('card-meta.json').cards;
const event=events.events.find(e=>e.id==='quest-1778');
assert(event&&event.permanent);assert.equal(event.stages[0].id,'17780015');assert.equal(event.missions.length,8);
assert.deepEqual(event.missions.map(m=>Number(m.title.match(/\d+/)[0])).sort((a,b)=>a-b),[5,10,15,16,17,18,19,20]);
const boss=read('boss-profiles.json').profiles[event.stages[0].source];assert.equal(boss.phases.length,20);
for(const id of ['1034741','1034761','1012901','1012931']){const c=meta[id];assert(C.variants(c).some(v=>v.kind==='superZlr'));assert(fs.existsSync(c.image));assert(C.selectKit(c,'superZlr').passive);}
const linked=E.linkMissions(events.events),gluttons=linked.find(e=>e.id==='quest-1218');assert(gluttons.missions.some(m=>m.title.includes('Saiyans gloutons')));
const f=read('frontier-data.json');for(const id of ['cell-8','cell-9','cell-10','cell-11','cell-11-1','namek-11-2']){const n=f.nodes.find(n=>n.id===id);assert(n&&n.phases.length);assert(n.missions.length);}
const a=events.missionAliases,old='capture-1778-phase-20',target=a[old];assert(target);
const settings={event:'quest-1778',mission:old,eventMissions:[old,target]},team={id:'sample-team',name:'Victoire',cards:['sample-card'],leader:'sample-card',settings,objective:{event:'quest-1778',stage:'17780015',missions:[{id:old,title:'Termine la phase 20'}]}};
const row=B.add([],team,{id:'sample-victory',date:'2026-10-17T15:50:00Z',count:10,result:'victory',validated:[old],note:'Une dizaine, voire davantage'})[0];
const entries={'dokkanos-events-progress-v1':JSON.stringify({[old]:{done:true,claimed:false},[target]:{done:true,claimed:true},untouched:{done:false,claimed:false}}),'dokkanos-saved-teams-v2':JSON.stringify([team]),'dokkanos-team-battles-v1':JSON.stringify([row]),['dokkanos-mission-done-'+old]:'yes','dokkanos-progression-v1':JSON.stringify({other:['A','A']})};
const next=M.plan(entries,a),p=JSON.parse(next['dokkanos-events-progress-v1']);assert(p[target].done&&p[target].claimed);assert(!p.untouched.done);assert.equal(next['dokkanos-progression-v1'],entries['dokkanos-progression-v1']);
const teams=JSON.parse(next['dokkanos-saved-teams-v2']),rows=JSON.parse(next['dokkanos-team-battles-v1']);B.validate(rows);assert.equal(B.summary(rows,teams[0]).status,'works');assert.equal(rows[0].count,10);assert.equal(rows[0].note,row.note);assert.equal(teams[0].settings.eventMissions.length,1);assert.deepEqual(M.plan(next,a),next);
const noProof=M.plan({'dokkanos-events-progress-v1':'{}'},a);assert.equal(noProof['dokkanos-events-progress-v1'],'{}');
const map=new Map(Object.entries(entries));let fail=true;const storage={getItem:k=>map.get(k)??null,setItem(k,v){if(fail&&k==='dokkanos-team-battles-v1'){fail=false;throw Error('quota');}map.set(k,v);},removeItem:k=>map.delete(k)};
assert.throws(()=>M.apply(storage,a));for(const [k,v]of Object.entries(entries))assert.equal(map.get(k),v);M.apply(storage,a);assert.equal(map.get('dokkanos-mission-done-'+target),'yes');assert.deepEqual(M.apply(storage,a),[]);
const source=fs.readFileSync('data-download.js','utf8'),ctx={window:{},document:{addEventListener(){}},fetch:()=>new Promise(()=>{}),Date};vm.runInNewContext(source,ctx);assert(source.includes('data.awakenings'));
assert(fs.readFileSync('index.html','utf8').includes('mission-migration.js?v=21400'));assert(fs.readFileSync('sw.js','utf8').includes('./mission-migration.js'));
console.log('GLOBAL 17 October: new LR and Super Z-LR, 20 phases, 8 missions, linked daily mission, six Frontier nodes, migration integrity/idempotency/rollback: OK');
