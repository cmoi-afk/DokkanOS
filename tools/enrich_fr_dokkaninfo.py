#!/usr/bin/env python3
"""Localisation française officielle via le serveur GLOBAL FR de DokkanInfo.
Récupère les mêmes IDs que la fiche anglaise et place le kit sous card.fr.
Fallback: la couche lexicale locale reste disponible si une page FR manque.
"""
import concurrent.futures,html,json,re,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];BASE="https://glbfr.dokkaninfo.com"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
def get(cid):
 req=urllib.request.Request(f"{BASE}/cards/{cid}",headers={"User-Agent":UA})
 txt=urllib.request.urlopen(req,timeout=30).read().decode("utf-8","ignore")
 m=re.search(r'datajson="([^"]*)"',txt)
 if not m:raise ValueError("datajson FR absent")
 return json.loads(html.unescape(m.group(1)))
def clean(s):return re.sub(r"\{passiveImg:[^}]+\}","",s or "").strip()
def names(d,k):return [x.get("name") for x in d.get(k,[]) if x.get("name")]
def parse(cid,d):
 card=d.get("card") or {};leader=d.get("leader_skill") or {};passive=d.get("passive_skill") or {};active=d.get("active_skill") or {}
 supers=[]
 for x in d.get("super_attacks") or []:
  a=x.get("attack") or {}
  if a.get("name"):supers.append({"name":a["name"],"description":clean(a.get("description")).replace("\n"," "),"ki":x.get("eball_num_start") or 0,"condition":(a.get("causality_description") or "").replace("\n"," ")})
 active_text=" — ".join(clean(x).replace("\n"," ") for x in [active.get("effect_description"),active.get("condition_description")] if x)
 return {"name":card.get("name"),"title":leader.get("name"),"leader":clean(leader.get("description")),"passiveName":passive.get("name",""),"passive":clean(passive.get("itemized_description")),"supers":supers,"superAttack":supers[0] if supers else None,"ultraSuperAttack":next((x for x in supers if (x.get("ki") or 0)>=18),None),"activeName":active.get("name",""),"active":active_text,"categories":names(d,"categories"),"links":names(d,"links"),"transformations":[{"id":str(x.get("id")),"name":x.get("name","")} for x in d.get("transformations") or [] if str(x.get("id"))!=str(cid)]}
def one(cid):
 try:return cid,parse(cid,get(cid)),None
 except Exception as e:return cid,None,str(e)[:160]
def main():
 p=ROOT/"card-meta.json";d=json.loads(p.read_text(encoding="utf-8"));ids=list(d.get("cards",{}));ok=fail=0
 # 4 connexions max: accélère le build sans marteler le serveur communautaire.
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
  for cid,fr,err in ex.map(one,ids):
   if fr:
    d["cards"][cid]["fr"]={k:v for k,v in fr.items() if v not in (None,"",[],{})};ok+=1
   else:
    d["cards"][cid].setdefault("localizationErrors",[]).append(err);fail+=1
 d.setdefault("generated",{})["officialFrench"]={"requested":len(ids),"success":ok,"failed":fail,"provider":"DokkanInfo GLOBAL FR"}
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding="utf-8");print("FR officiel",ok,fail)
if __name__=="__main__":main()
