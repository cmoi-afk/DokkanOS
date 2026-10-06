#!/usr/bin/env python3
"""Read phase names/statistics directly from existing GLOBAL FR source URLs."""
import json,re,urllib.request,concurrent.futures,sys
from pathlib import Path
from datetime import datetime,timezone
from bs4 import BeautifulSoup
E=json.loads(Path('events.json').read_text());urls=[]
for e in E['events']:
 if e['kind'] in ['Défi','Zone Z suprême','Dokkan Event','Combat éminent','Combat Z suprême','Burst Mode']:
  for s in e['stages']:
   if s.get('source') and s['source'] not in urls:urls.append(s['source'])
# Prioritize user's Saga Boo stage, then newest event entries; coverage stays explicit.
priority='https://www.dbz-dokkanbattle.com/quest/1769/17690045'
urls=[priority]+list(reversed([u for u in urls if u!=priority]));limit=int(sys.argv[1]) if len(sys.argv)>1 else len(urls)
text=lambda n:re.sub(r'\s+',' ',n.get_text(' ',strip=True)).strip() if n else ''
def collect(url):
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 DokkanOS sourced boss profiles'})
  raw=urllib.request.urlopen(req,timeout=10).read().decode();soup=BeautifulSoup(raw,'html.parser');phases=[]
  for phase in soup.select('.boss-round'):
   bosses=[]
   for boss in phase.select('.boss-card'):
    stats={text(t.select_one('.boss-stat-label')):text(t.select_one('.boss-stat-value')) for t in boss.select('.boss-stat-tile')}
    effects=[text(x) for x in boss.select('.boss-skill-text')];effects=list(dict.fromkeys(effects))
    supers=[{'name':text(x.select_one('.boss-special-title')),'description':text(x.select_one('.boss-special-desc')),'damage':text(x.select_one('.boss-special-damage')),'multiplier':text(x.select_one('.boss-special-dmg')),'conditions':[text(t) for t in x.select('.boss-condition-tag')]} for x in boss.select('.boss-special-card')]
    bosses.append({'name':text(boss.select_one('.boss-card-name')),'stats':stats,'effects':effects,'supers':supers})
   if bosses:phases.append({'name':text(phase.select_one('.boss-round-badge')),'bosses':bosses})
  return url,{'source':url,'verifiedAt':datetime.now(timezone.utc).isoformat(),'phases':phases,'status':'verified' if phases else 'not-extracted'}
 except Exception as ex:return url,{'source':url,'status':'unavailable','error':str(ex)}
result=json.loads(Path('boss-profiles.json').read_text()).get('profiles',{}) if Path('boss-profiles.json').exists() else {}
failures={}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
 for i,(url,row) in enumerate(pool.map(collect,urls[:limit])):
  if row['status']=='verified':result[url]=row
  else:failures[url]=row['status']
  if i%10==0:print('Boss pages',i+1,flush=True)
D={'version':1,'requested':len(urls),'collected':len(result),'verifiedAt':datetime.now(timezone.utc).isoformat(),'failures':failures,'profiles':result}
Path('boss-profiles.json').write_text(json.dumps(D,ensure_ascii=False,separators=(',',':'))+'\n');print('Verified',sum(r['status']=='verified' for r in result.values()),'of',len(result),flush=True)
