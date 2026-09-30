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
for cid in ["1003210","1003211","1010070","1034201","1010900","1023631","1028551","1015691","1015831","1030360"]:
 try:
  url="https://glbfr.dokkaninfo.com/cards/"+cid;text=fetch(url);d=embedded(text,"datajson")
  report["cards"][cid]={"keys":list(d),"card":d.get("card"),"max_eza_step":d.get("max_eza_step"),"eza_medals":d.get("eza_medals"),"eza":d.get("eza"),"awake":{k:v for k,v in d.items() if any(t in k for t in ["awak","resource","image","stat","open","asset","growth","hipo"])},"images":re.findall(r'https?[^"<>\\s]+(?:thumb|card_)[^"<>\\s]+',html.unescape(text))[:12],"passive":d.get("passive_skill"),"leader":d.get("leader_skill")}
  try:
   api=json.loads(fetch("https://glbfr.dokkaninfo.com/api/cards/"+cid+"/transformation"));report["cards"][cid]["api"]={"keys":list(api),"card":api.get("card"),"passive":api.get("passive_skill")}
  except Exception as e:report["cards"][cid]["api"]={"error":str(e)}
  scripts=re.findall(r'<script[^>]+src="([^"]+)"',text)
  report["cards"][cid]["scripts"]=scripts
  if cid=="1003211":
   for script in scripts:
    if "app.js" in script or "/app." in script:
     try:
      bundle=fetch(script if script.startswith("http") else "https://glbfr.dokkaninfo.com"+script)
      snippets=[]
      for pattern in ["card_growth_coef","card_growth_lv","hp_max","growthCoef","0.4839"]:
       i=bundle.find(pattern)
       if i>=0:snippets.append(bundle[max(0,i-400):i+1200])
      report["cards"][cid]["statFormulaSnippets"]=snippets
      report["cards"][cid]["allGrowthSnippets"]=[bundle[max(0,m.start()-500):m.start()+1600] for m in list(re.finditer(r"hp_max|growth|0\\.4839",bundle,re.I))[:50]]
      chunks=re.findall(r'["\x27](?:\./)?([^"\x27/]+\.js)["\x27]',bundle)
      chosen=[x for x in chunks if "card" in x.lower() or "stat" in x.lower()]
      report["cards"][cid]["statChunks"]=chosen
      report["cards"][cid]["bundleImports"]=bundle[:12000]
      child_snippets=[]
      for chunk in list(dict.fromkeys(chosen))[:10]:
       try:
        child=fetch("https://glbfr.dokkaninfo.com/build/assets/"+chunk)
        for pattern in ["hp_max","Math.pow","cardGrowth","growth","0.4839"]:
         start=0
         for unused in range(3):
          i=child.find(pattern,start)
          if i<0:break
          child_snippets.append({"chunk":chunk,"pattern":pattern,"code":child[max(0,i-300):i+1100]});start=i+len(pattern)
       except Exception:pass
      report["cards"][cid]["childStatSnippets"]=child_snippets
     except Exception as e:report["cards"][cid]["scriptError"]=str(e)
  step=d.get("max_eza_step")
  if step:
   alt=embedded(fetch(url+"?eza=true&step="+str(step)),"datajson");report["cards"][cid]["alt"]={"card":alt.get("card"),"passive":alt.get("passive_skill"),"growth":{k:v for k,v in alt.items() if "growth" in k or "hipo" in k},"keys":list(alt),"raw":alt}
 except Exception as e:report["cards"][cid]={"error":str(e)}
for cid in ["1023631","1028551","1010900"]:
 report["cards"].setdefault(cid,{})["fallbacks"]={}
 for host in ["https://dokkaninfo.com","https://jpn.dokkaninfo.com"]:
  for suffix in ["/cards/"+cid+"?eza=true&step=7","/api/cards/"+cid+"/transformation","/cards/"+cid+"?eza=true&step=6"]:
   try:
    raw=fetch(host+suffix);dd=json.loads(raw) if "/api/" in suffix else embedded(raw,"datajson")
    report["cards"][cid]["fallbacks"][host+suffix]={"card":dd.get("card"),"passive":dd.get("passive_skill"),"supers":dd.get("super_attacks"),"keys":list(dd)}
   except Exception as e:report["cards"][cid]["fallbacks"][host+suffix]={"error":str(e)}
Path("docs/CATALOG-SOURCES-PROBE-v4.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(report,ensure_ascii=False,indent=2))
