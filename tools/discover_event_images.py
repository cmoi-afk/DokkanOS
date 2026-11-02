import json,re,urllib.request,concurrent.futures
from pathlib import Path
urls=['https://www.dbz-dokkanbattle.com/event/challenge','https://www.dbz-dokkanbattle.com/event/story','https://www.dbz-dokkanbattle.com/quest/1707']
def get(u):
 try:
  req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 (compatible; DokkanOS event image catalogue)'})
  with urllib.request.urlopen(req,timeout=25) as r:s=r.read().decode()
  images=sorted(set(re.findall(r'''[^\s"'<>]*?(?:quest[^\s"'<>]*|zbattle[^\s"'<>]*|banner[^\s"'<>]*)\.(?:png|webp|jpg)''',s)))
  snippets=[s[max(0,m.start()-180):m.end()+250] for m in re.finditer(r'1707|quest_list|quest_event|background-image',s)]
  return {'url':u,'images':images[:80],'snippets':snippets[:25],'scripts':re.findall(r'<script[^>]+src=["\']([^"\']+)',s)}
 except Exception as e:return {'url':u,'error':str(e)}
results=list(concurrent.futures.ThreadPoolExecutor(max_workers=3).map(get,urls));Path('docs').mkdir(exist_ok=True);Path('docs/event-image-discovery.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False)[:18000])
