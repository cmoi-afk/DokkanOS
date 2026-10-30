"""Enrich only stages introduced by the reviewed 29 October snapshot."""
import json,subprocess,sys,re,concurrent.futures as cf
from pathlib import Path
from datetime import datetime,timezone
from bs4 import BeautifulSoup
import refresh_catalogue_v4 as C
import refresh_events as E
R=Path(sys.argv[1]);D=json.loads(Path('events.json').read_text());B=json.loads(Path('boss-profiles.json').read_text());old=json.loads(subprocess.check_output(['git','show','517a835f90391d4ceb09aee5f63884a407641110:events.json']));known={s.get('source') for e in old['events'] for s in e.get('stages',[])}
stages=[s for e in D['events'] for s in e.get('stages',[]) if s.get('source') and s['source'] not in known]
def collect(st):
 url=st['source'];p=R/('boss_'+url.rsplit('/',1)[1]+'.html')
 if not p.exists():p.write_bytes(C.request(url,timeout=25))
 soup=BeautifulSoup(p.read_text(),'html.parser');phases=[]
 for phase in soup.select('.boss-round'):
  bosses=[]
  for boss in phase.select('.boss-card'):
   stats={E.txt(t.select_one('.boss-stat-label')):E.txt(t.select_one('.boss-stat-value')) for t in boss.select('.boss-stat-tile')}
   effects=list(dict.fromkeys(E.txt(x) for x in boss.select('.boss-skill-text')))
   supers=[{'name':E.txt(x.select_one('.boss-special-title')),'description':E.txt(x.select_one('.boss-special-desc')),'damage':E.txt(x.select_one('.boss-special-damage')),'multiplier':E.txt(x.select_one('.boss-special-dmg')),'conditions':[E.txt(t) for t in x.select('.boss-condition-tag')]} for x in boss.select('.boss-special-card')]
   bosses.append({'name':E.txt(boss.select_one('.boss-card-name')),'stats':stats,'effects':effects,'supers':supers})
  if bosses:phases.append({'name':E.txt(phase.select_one('.boss-round-badge')),'bosses':bosses})
 if not phases:raise ValueError('No boss phases: '+url)
 notes=[x.get('data-tip') for x in soup.select('[data-tip]') if x.get('data-tip')]+[b['name']+' : '+t for p in phases for b in p['bosses'] for t in b['effects']]
 st['notes']=list(dict.fromkeys(st.get('notes',[])+notes));st['rulesVerified']=True;st['disableDodge']=any(re.search(r'(?:annule|empêche|désactive).*esquive',x,re.I) for x in notes)
 return url,{'source':url,'verifiedAt':datetime.now(timezone.utc).isoformat(),'phases':phases,'status':'verified'}
with cf.ThreadPoolExecutor(max_workers=6) as pool:
 for i,(url,b) in enumerate(pool.map(collect,stages),1):B['profiles'][url]=b;print('Boss',i,'/',len(stages),flush=True)
B['collected']=len(B['profiles']);B['requested']=max(B['collected'],B['requested']);B['verifiedAt']=datetime.now(timezone.utc).isoformat();C.write(Path('events.json'),D);C.write(Path('boss-profiles.json'),B)
a=json.loads(Path('docs/data-download-2026-10-29-audit.json').read_text());a['verifiedNewBossProfiles']=len(stages);C.write(Path('docs/data-download-2026-10-29-audit.json'),a)
for script in ['build_event_preview.py','build_progress_data.py']:subprocess.run([sys.executable,'tools/'+script],check=True)
