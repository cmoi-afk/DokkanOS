const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync('index.html','utf8'));
const storage=new Map();
window.HTMLElement.prototype.scrollIntoView=function(){};
const context=vm.createContext({
 console,document,window,Date,setTimeout,clearTimeout,
 navigator:{onLine:true},
 location:{reload(){}},
 localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))},
 fetch:async file=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))})
});
const run=code=>vm.runInContext(code,context);
for(const file of ['team-engine.js','app.js','event-model.js','team-search.js','teams.js','events.js','catalog-model.js','catalogue.js','teams-ui.js','team-locker.js']){
 run(fs.readFileSync(file,'utf8').split('boot().catch(')[0]);
}
const click=selector=>{
 const button=document.querySelector(selector);
 assert(button,selector);
 button.click();
};

(async()=>{
 await run('boot()');
 click('nav [data-v="teams"]');
 assert(document.querySelector('.locker-heading').textContent.includes('Mes équipes'));
 assert(!document.querySelector('#teamObjective'));
 click('[data-locker="create"]');
 assert(document.querySelector('[data-locker="event"]'));
 click('[data-locker="free"]');
 assert.equal(run('teamSettings.pool'),'owned');
 assert.equal(run('teamSettings.event'),'');
 assert(document.querySelector('#lockerSettings'));
 assert(!document.querySelector('#lockerSettings').open);
 click('[data-locker="leader"]');
 assert(document.querySelector('#lockerSettings').open);

 run("inventory['1034201']='owned';chooseTeamLeader('1034201')");
 assert(document.querySelector('.locker-unit'));
 assert(document.querySelector('#lockerStrategy').textContent.includes('Stratégie et synergies'));
 assert(!document.querySelector('#lockerStrategy').open);
 click('[data-team-action="save"]');
 click('[data-locker="back"]');
 assert.equal(document.querySelectorAll('.locker-card .locker-portraits .visual-card').length,1);
 click('[data-locker-resume]');
 assert(document.querySelector('#lockerPlan'));

 click('[data-locker="back"]');
 click('[data-locker="create"]');
 click('[data-locker="event"]');
 assert.equal(document.body.dataset.view,'events');
 run(`teamEvents={events:[{id:'locker-event',name:'Combat test',kind:'Défi',permanent:true,stages:[],missions:[
  {id:'locker-mission',title:'Mission test',requirements:[{kind:'types',count:5}],rewards:[]}
 ]}]};`);
 await run("eventPrepareTeam('locker-event',['locker-mission'])");
 assert.equal(document.body.dataset.view,'teams');
 assert.equal(run('teamSettings.event'),'locker-event');
 assert.equal(run('teamSettings.mission'),'locker-mission');
 assert.equal(run('teamSettings.pool'),'owned');
 assert.equal(run('selectedTeam.length'),0);
 assert.equal(run('teamSaved().length'),1);
 assert(document.querySelector('[data-team-action="bestLeader"]').textContent.includes('Proposer une équipe'));
 console.log('Team locker: landing, creation, saved portraits, compact strategy, resume and mission hand-off: OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
