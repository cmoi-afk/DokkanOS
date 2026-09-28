#!/usr/bin/env python3
"""Découverte V2 des IDs par validation directe des routes /card/<id>.
Ne modifie pas le catalogue: produit seulement un index de fiches confirmées.
"""
import concurrent.futures,json,os,re,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
# Plage moderne testée en premier; élargissement après mesure de densité.
START=int(os.environ.get("START_ID","1030000")); END=int(os.environ.get("END_ID","1034999"))
def probe(i):
 u=f"https://dokkanbattle.net/card/{i}"
 try:
  req=urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"})
  with urllib.request.urlopen(req,timeout=8) as r:
   if r.status!=200:return None
   s=r.read(180000).decode("utf-8","ignore")
  # Une vraie fiche contient Card Info/Card Stats; évite les soft-404.
  if "Card Info" not in s and "Card Stats" not in s:return None
  title=re.search(r"<title>(.*?)</title>",s,re.I|re.S)
  return {"id":str(i),"url":u,"titleHtml":re.sub("<.*?>","",title.group(1)).strip() if title else ""}
 except Exception:return None
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
 hits=[x for x in ex.map(probe,range(START,END+1)) if x]
out={"range":[START,END],"tested":END-START+1,"confirmed":len(hits),"items":hits}
(ROOT/"v2/ID-DISCOVERY-103.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("tested",out["tested"],"confirmed",out["confirmed"])
