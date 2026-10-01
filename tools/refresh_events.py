#!/usr/bin/env python3
"""Collect public GLOBAL FR source pages for the event catalogue."""
import concurrent.futures,json,time,urllib.request
from pathlib import Path
BASE='https://www.dbz-dokkanbattle.com'
PATHS=['/','/event/challenge','/event/story','/event/growth','/event/limited','/zbattles','/mission/1','/announcement/107279','/quest/1769','/quest/1776','/zbattle/728','/quests','/db-stories','/origin/series','/burst-modes','/tenkaichi-budokais','/event/rmbattles','/sd-characters','/limited-missions-categories','/board-missions','/dokkan-frontier-missions','/burst-mode-missions','/mission/6','/mission/1000']
OUT=Path('event-source');OUT.mkdir(exist_ok=True)
def fetch(path):
 url=BASE+path
 for attempt in range(3):
  try:
   request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 DokkanOS event catalogue audit'})
   with urllib.request.urlopen(request,timeout=40) as response:raw=response.read()
   name=(path.strip('/').replace('/','_') or 'home')+'.html';(OUT/name).write_bytes(raw)
   return {'path':path,'url':url,'file':name,'bytes':len(raw)}
  except Exception as e:
   if attempt==2:return {'path':path,'url':url,'error':str(e)}
   time.sleep(attempt+1)
rows=list(concurrent.futures.ThreadPoolExecutor(max_workers=4).map(fetch,PATHS))
(OUT/'manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print(json.dumps(rows,ensure_ascii=False))
if not any(r.get('bytes',0)>50000 for r in rows):raise SystemExit('Source pages unavailable')
