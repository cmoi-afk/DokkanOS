const fs=require('fs'),E=require('../team-engine.js');
const meta=JSON.parse(fs.readFileSync('card-meta.json')).cards;
const pool=Object.entries(meta).map(([id,c])=>({...c,id,boxId:'CATALOG-'+id}));
const leader=pool.find(c=>c.id==='1034201');
const known=[...new Set(pool.flatMap(c=>c.categories||[]))];
const start=performance.now();
const result=E.build(pool,leader,{known,friend:{...leader,boxId:'friend'},context:{useZA:true,combat:'synergy',searchMode:process.argv[2]||'deep'}});
console.log(JSON.stringify({mode:process.argv[2]||'deep',ms:Math.round(performance.now()-start),cards:result.team.map(c=>c.id),deficit:result.check.deficit,score:result.score}));
