"""Small first-screen preview; full missions remain in events.json and load on demand."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
d=json.loads((root/'events.json').read_text()); out={k:v for k,v in d.items() if k!='events'};out['preview']=True;out['events']=[]
for e in d['events']:
    item={k:v for k,v in e.items() if k not in ('missions','stages','rewards','notes')}
    item['missions']=e['missions'] if e['kind']=='Missions quotidiennes' else [m for m in e['missions'] if m.get('requirements')][:2]
    item['stages']=[];item['missionCount']=len(e['missions']);out['events'].append(item)
(root/'events-preview.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print('Event preview:',(root/'events-preview.json').stat().st_size,'bytes')
