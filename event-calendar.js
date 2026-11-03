/* Reviewed Global campaign windows. IDs match the existing event catalogue. */
(function(root){
  const source='https://www.dbz-dokkanbattle.com/announcement/107378';
  const windows={
    'zbattle-215':{end:'2026-11-20T08:59:00+01:00',name:'Aventures pour réaliser de nombreux vœux · Bulma (enfant)',kind:'Battle Z suprême',path:'/zbattle/215'},
    'quest-1208':{end:'2026-11-13T08:59:00+01:00'},
    'quest-1723':{permanent:true},
    'event-rmbattle-110':{end:'2026-11-27T08:59:00+01:00',name:'106e VIRTUAL DOKKAN · Bataille royale',kind:'Bataille Royale',path:'/event/rmbattle/110'},
    'sd-character-49':{end:'2026-11-16T08:59:00+01:00',name:'49e Paper Battle',kind:'Pettan Battle',path:'/sd-character/49'},
    'burst-quest-1524':{start:'2026-11-05T06:00:00+01:00',end:'2026-11-19T08:59:00+01:00',name:'Mode Burst · C’est parti ! La justice dans toute sa splendeur',kind:'Burst Mode',path:'/quest/1524',artId:'quest-1524'}
  };
  function apply(events,verifiedAt){
    if(Date.parse(verifiedAt)>=Date.parse('2026-11-02T09:00:00+01:00'))return events;
    const byId=new Map(events.map(e=>[e.id,e]));
    for(const [id,window] of Object.entries(windows)){
      const original=byId.get(id);
      if(!original&&!window.path)continue;
      const event=original||{id,name:window.name,kind:window.kind,source:new URL(window.path,source).href,missions:[],stages:[],teamMode:'special'};
      byId.set(id,{...event,start:window.start||'2026-11-02T09:00:00+01:00',end:window.end,
        datePrecision:'minute',permanent:!!window.permanent,status:window.permanent?'permanent':'active',
        calendarSource:source,artId:window.artId||event.artId});
    }
    return [...byId.values()];
  }
  const api={apply};
  if(typeof module!=='undefined')module.exports=api;
  root.DokkanEventCalendar=api;
})(typeof window==='undefined'?globalThis:window);
