import html,json,re,urllib.request
from pathlib import Path
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36"
report={"sources":{},"cards":{}}
def fetch(url):
 req=urllib.request.Request(url,headers={"User-Agent":UA});return urllib.request.urlopen(req,timeout=55).read().decode("utf-8","ignore")
def embedded(text,attr):
 m=re.search(attr+'="([^"]*)"',text)
 if not m:raise ValueError("missing "+attr)
 return json.loads(html.unescape(m.group(1)))
for host in ["https://glbfr.dokkaninfo.com","https://dokkaninfo.com"]:
 try:
  text=fetch(host+"/cards?sort=open_at");rows=embedded(text,"cardsjson")
  report["sources"][host]={"bytes":len(text),"count":len(rows),"examples":rows[:2],"recent":sorted(rows,key=lambda c:str(c.get("open_at") or ""),reverse=True)[:5],"keys":sorted(set().union(*(r.keys() for r in rows[:100]))),"targeted":[r for r in rows if r.get("id") in [1003210,1003211,1010070,1010071,1034200,1034201]],"counts":{"releasedSSRUR_LR_base":sum(int(r.get("rarity",0))>=3 and 1000000<=int(r["id"])<4000000 and int(r.get("open_at") or 0)<=1790784000 for r in rows)}}
 except Exception as e:report["sources"][host]={"error":str(e)}
for cid in ["1003210","1003211","1010070","1034201"]:
 try:
  url="https://glbfr.dokkaninfo.com/cards/"+cid;text=fetch(url);d=embedded(text,"datajson")
  report["cards"][cid]={"keys":list(d),"card":d.get("card"),"max_eza_step":d.get("max_eza_step"),"eza_medals":d.get("eza_medals"),"eza":d.get("eza"),"awake":{k:v for k,v in d.items() if any(t in k for t in ["awak","resource","image","stat","open","asset"])},"images":re.findall(r'https?[^"<>\\s]+(?:thumb|card_)[^"<>\\s]+',html.unescape(text))[:12],"passive":d.get("passive_skill"),"leader":d.get("leader_skill")}
  try:\n   api=json.loads(fetch("https://glbfr.dokkaninfo.com/api/cards/"+cid+"/transformation"));report["cards"][cid]["api"]={"keys":list(api),"card":api.get("card"),"passive":api.get("passive_skill")}\n  except Exception as e:report["cards"][cid]["api"]={"error":str(e)}\n  step=d.get("max_eza_step")
  if step:
   alt=embedded(fetch(url+"?eza=true&step="+str(step)),"datajson");report["cards"][cid]["alt"]={"card":alt.get("card"),"passive":alt.get("passive_skill"),"keys":list(alt)}
 except Exception as e:report["cards"][cid]={"error":str(e)}
Path("docs/CATALOG-SOURCES-PROBE-v4.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(report,ensure_ascii=False,indent=2))
