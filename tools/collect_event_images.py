"""Local French event banners matched by observed source links, never by similar names."""
import concurrent.futures,hashlib,io,json,re,time,urllib.request,os
from pathlib import Path
from urllib.parse import urljoin,urlparse
from datetime import datetime,timezone
from bs4 import BeautifulSoup
from PIL import Image
BASE='https://www.dbz-dokkanbattle.com'
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/events';OUT.mkdir(parents=True,exist_ok=True)
events=json.loads((ROOT/'events.json').read_text())['events'];by_path={urlparse(e.get('source','')).path.rstrip('/'):e['id'] for e in events};by_id={e['id']:e for e in events};observed={};errors=[]
indexes=['/event/challenge','/event/story','/event/growth','/event/limited','/zbattles','/db-stories','/quests','/origin/series','/burst-modes','/tenkaichi-budokais','/event/rmbattles','/limited-missions-categories','/board-missions']
def fetch(url):
 for attempt in range(2):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 DokkanOS French event banner catalogue'}),timeout=25) as r:return r.read()
  except Exception:
   if attempt:raise
   time.sleep(1)
def read_index(path):
 try:return path,BeautifulSoup(fetch(BASE+path),'html.parser')
 except Exception as e:return path,str(e)
for path,soup in concurrent.futures.ThreadPoolExecutor(max_workers=4).map(read_index,indexes):
 if isinstance(soup,str):errors.append({'page':path,'error':soup});continue
 for a in soup.select('a[href]'):
  target=urlparse(urljoin(BASE,a['href'])).path.rstrip('/');eid=by_path.get(target)
  if not eid:continue
  candidates=[i.get('src') or i.get('data-src') for i in a.select('img')]
  for src in candidates:
   if not src:continue
   url=urljoin(BASE,src)
   if urlparse(url).netloc==urlparse(BASE).netloc and any(t in src for t in ['/img/events/','/img/missions/','/img/zbattle','/img/db_story','/img/db-stor']):
    observed.setdefault(eid,{'url':url,'page':BASE+path});break
# The quest hero is a verified alternative to its list banner, for key challenges.
priority=[e for e in events if e['id'].startswith('quest-') and any(t in e['name'].lower() for t in ['festival de combats','red zone','zone rouge','bataille suprême','cell game','daima'])][:18]
for e in priority:
 if e['id'] in observed:continue
 try:
  soup=BeautifulSoup(fetch(e['source']),'html.parser');hero=soup.select_one('.quest-hero[style]');match=re.search(r"url\(['\"]?([^)'\"]+)",hero.get('style','')) if hero else None
  if match:observed[e['id']]={'url':urljoin(BASE,match[1]),'page':e['source']}
 except Exception as x:errors.append({'page':e['source'],'error':str(x)})
urls={x['url'] for x in observed.values()}
def download(url):
 try:
  name=hashlib.sha256(url.encode()).hexdigest()[:20]+'.webp';p=OUT/name
  if p.exists() and os.environ.get('EVENT_IMAGES_REFRESH')!='1':
   im=Image.open(p);return url,{'src':'assets/events/'+name,'sourceUrl':url,'width':im.width,'height':im.height,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'locale':'fr'}
  raw=fetch(url);im=Image.open(io.BytesIO(raw));w,h=im.size
  if w<180 or h<45 or w/h<1.2:raise ValueError('Not a recognisable event banner: '+str(im.size))
  im=im.convert('RGBA');im.thumbnail((960,400));name=hashlib.sha256(url.encode()).hexdigest()[:20]+'.webp';p=OUT/name;im.save(p,'WEBP',quality=87,method=6)
  return url,{'src':'assets/events/'+name,'sourceUrl':url,'width':im.width,'height':im.height,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'locale':'fr'}
 except Exception as e:return url,{'error':str(e)}
assets=dict(concurrent.futures.ThreadPoolExecutor(max_workers=6).map(download,sorted(urls)));mapping={}
for eid,row in observed.items():
 asset=assets[row['url']]
 if 'error' not in asset:mapping[eid]={**asset,'sourcePage':row['page']}
 else:errors.append({'event':eid,'url':row['url'],'error':asset['error']})
# Mission lists inherit only an explicit, unambiguous linked combat.
for e in events:
 if e['id'] in mapping:continue
 targets={m.get('combatEventId') for m in e.get('missions',[]) if m.get('combatEventId') and m['combatEventId']!=e['id']}
 if e.get('relatedEventId'):targets.add(e['relatedEventId'])
 if len(targets)==1:
  target=next(iter(targets))
  if target in mapping:mapping[e['id']]={'eventId':target,'relation':'explicit-linked-combat'}
manifest={'schema':'dokkanos-event-images-v1','checkedAt':datetime.now(timezone.utc).isoformat(),'source':BASE,'images':mapping,'coverage':{'total':len(events),'withImage':len(mapping),'downloadedFiles':len({v['src'] for v in mapping.values() if 'src'in v}),'bytes':sum(p.stat().st_size for p in OUT.glob('*.webp'))},'missing':[e['id'] for e in events if e['id'] not in mapping]}
(ROOT/'event-images.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
(ROOT/'docs/event-images-audit.json').write_text(json.dumps({'coverage':manifest['coverage'],'observedPages':indexes,'errors':errors},ensure_ascii=False,indent=2));print(json.dumps(manifest['coverage']),flush=True)
assert len(mapping)>100,'Too little verified coverage to publish'
