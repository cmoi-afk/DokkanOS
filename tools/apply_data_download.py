#!/usr/bin/env python3
"""Apply a reviewed GLOBAL download without replacing historical progress IDs."""
import json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/name).read_text())
def write(name,d): (ROOT/name).write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
p=read('docs/data-download-2026-10-02.json');assert p['region']=='GLOBAL' and not p['errors'],p['errors']
e=read('events.json');lookup={x['id']:x for x in e['events']}
for row in p['events']:
 row=dict(row);merge=row.pop('mergeStages',False);old=lookup.get(row['id'])
 if merge and old:
  # An additional level does not change the opening of the whole event.
  for key in ['start','end','status','permanent','datePrecision']:
   if key in old:row[key]=old[key]
  for key in ['missions','stages']:
   incoming={str(x['id']):x for x in row[key]};row[key]=[incoming.pop(str(x['id']),x) for x in old[key]]+list(incoming.values())
 if old:e['events'][e['events'].index(old)]=row
 else:e['events'].append(row);e['sourceInventory'].append(row['id'])
e['targetedVerifiedAt']=p['verifiedAt'];e['coverage']['events']=len([x for x in e['events'] if not x.get('hidden')]);e['coverage']['missions']=sum(len(x['missions']) for x in e['events'] if not x.get('hidden'));e['lastDownload']=p['id'];write('events.json',e)
m=read('card-meta.json');a=p['awakening'];card=m['cards'][a['cardId']]
card['upcomingAwakenings']=[{k:v for k,v in a.items() if k!='cardId'}];m['targetedVerifiedAt']=p['verifiedAt'];write('card-meta.json',m)
b=read('boss-profiles.json');b['profiles'].update(p['bossProfiles']);b['collected']=len(b['profiles']);b['requested']=max(b['requested'],b['collected']);write('boss-profiles.json',b)
summary={k:v for k,v in p.items() if k in ['version','id','region','verifiedAt','awakening','supportItems','announced']};summary['events']=[{k:v for k,v in row.items() if k in ['id','name','kind','start','end','stonesTotal','notes']}|{'missionCount':len(row['missions']),'stageCount':len(row['stages'])} for row in p['events']];write('data-download.json',summary)
subprocess.run([sys.executable,str(ROOT/'tools/build_event_preview.py')],cwd=ROOT,check=True);subprocess.run([sys.executable,str(ROOT/'tools/build_progress_data.py')],cwd=ROOT,check=True)
print('Applied',p['id'],'with stable existing IDs')
