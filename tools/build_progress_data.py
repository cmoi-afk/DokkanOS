#!/usr/bin/env python3
"""Index only existing source-labelled medal rewards; never infer drops from card names."""
import json,re,unicodedata,hashlib
from pathlib import Path
E=json.loads(Path('events.json').read_text());C=json.loads(Path('card-meta.json').read_text())
def norm(s):
 s=unicodedata.normalize('NFD',s).lower();s=''.join(c for c in s if not unicodedata.combining(c));s=re.sub(r'[\[\]()]',' ',s);return re.sub(r'\s+',' ',s).strip()
rewards={};levels={}
for e in E['events']:
 for s in e.get('stages',[]):
  for r in s.get('rewards',[]):
   if r.get('identified') and '/awaken/' in r.get('image',''):
    key=hashlib.sha256((e['id']+'|'+str(s['id'])+'|'+r['name']).encode()).hexdigest()[:12];levels[key]={'event':e['id'],'stage':s['id'],'eventName':e['name'],'stageName':s['name'],'rewardName':r['name'],'amount':r['amount'],'source':s.get('source') or e['source'],'verifiedAt':E['verifiedAt']};rewards.setdefault(norm(r['name']),[]).append(key)
medals={}
for cid,c in C['cards'].items():
 for v in c.get('zAwakenings',[]):
  for m in v.get('medals',[]):
   match=rewards.get(norm(m['name']),[])
   if match:medals.setdefault(cid,{}).setdefault(v['kind'],{})[m['name']]=norm(m['name'])
used={name for card in medals.values() for variant in card.values() for name in variant.values()};rewards={k:v for k,v in rewards.items() if k in used};used_levels={k for refs in rewards.values() for k in refs};levels={k:v for k,v in levels.items() if k in used_levels}
for c in json.loads(Path('recent-cards.json').read_text())['cards']:
 if str(c['id']) in C['cards']:C['cards'][str(c['id'])]={**C['cards'][str(c['id'])],**c}
cards={k:hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:16] for k,v in C['cards'].items()}
d={'version':1,'fingerprint':hashlib.sha256((Path('events.json').read_text()+json.dumps(cards,sort_keys=True)).encode()).hexdigest(),'cardsGenerated':C.get('generated',{}).get('catalogueV4',{}).get('checkedAt'),'eventsVerified':E['verifiedAt'],'cards':cards,'eventCount':len([e for e in E['events'] if not e.get('hidden')]),'missionCount':sum(len(e.get('missions',[])) for e in E['events'] if not e.get('hidden')),'incomplete':[str(c['id']) for c in json.loads(Path('catalog.json').read_text())['cards'] if c.get('dataStatus',{}).get('kit')!='verified'],'medals':medals,'levels':levels,'matches':rewards}
Path('progress-data.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n');print('Exact sourced medal mappings:',len(medals))
