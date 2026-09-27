#!/usr/bin/env python3
"""Enrichissement principal DokkanOS depuis les pages GLOBAL DokkanInfo.
Travaille uniquement sur les IDs déjà reconnus dans card-meta.json.
Cache local réutilisable; reprise possible; aucune donnée existante n'est effacée.
"""
import html,json,re,time,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; CACHE=ROOT/"data-cache"/"dokkaninfo"; BASE="https://dokkaninfo.com"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
RAR={2:"SR",3:"SSR",4:"UR",5:"LR"}; TYPES={0:"AGL",1:"TEQ",2:"INT",3:"STR",4:"PHY"}
def get(url):
 req=urllib.request.Request(url,headers={"User-Agent":UA}); return urllib.request.urlopen(req,timeout=30).read().decode("utf-8","ignore")
def payload(cid):
 CACHE.mkdir(parents=True,exist_ok=True); p=CACHE/f"{cid}.json"
 if p.exists(): return json.loads(p.read_text(encoding="utf-8"))
 txt=get(f"{BASE}/cards/{cid}"); m=re.search(r'datajson="([^"]*)"',txt)
 if not m: raise ValueError("datajson absent")
 d=json.loads(html.unescape(m.group(1))); p.write_text(json.dumps(d,ensure_ascii=False),encoding="utf-8"); return d
def clean(s): return re.sub(r"\{passiveImg:[^}]+\}","",s or "").strip()
def names(d,k): return [x.get("name") for x in d.get(k,[]) if x.get("name")]
def supers(d):
 out=[];seen=set()
 for x in d.get("super_attacks") or []:
  a=x.get("attack") or {}; name=a.get("name")
  if not name: continue
  desc=clean(a.get("description")).replace("\n"," ");ki=x.get("eball_num_start") or 0;k=(name,desc,ki)
  if k in seen:continue
  seen.add(k);out.append({"name":name,"description":desc,"ki":ki,"condition":(a.get("causality_description") or "").replace("\n"," ")})
 return out
def parse(cid,d):
 card=d.get("card") or {}; leader=d.get("leader_skill") or {}; passive=d.get("passive_skill") or {}; active=d.get("active_skill") or {}
 element=card.get("element",-1); cls={1:"Super",2:"Extreme"}.get(int(element)//10,""); typ=TYPES.get(int(element)%10,"")
 s=supers(d); forms=[{"id":str(x.get("id")),"name":x.get("name","")} for x in d.get("transformations") or [] if str(x.get("id"))!=str(cid)]
 active_text=" — ".join(clean(x).replace("\n"," ") for x in [active.get("effect_description"),active.get("condition_description")] if x)
 return {"name":card.get("name"),"title":leader.get("name"),"rarity":RAR.get(card.get("rarity"),str(card.get("rarity",""))),"type":typ,"class":cls,"leader":clean(leader.get("description")),"passiveName":passive.get("name",""),"passive":clean(passive.get("itemized_description")),"supers":s,"superAttack":s[0] if s else None,"ultraSuperAttack":next((x for x in s if (x.get("ki") or 0)>=18),None),"activeName":active.get("name",""),"active":active_text,"categories":names(d,"categories"),"links":names(d,"links"),"transformations":forms,"eza":bool(d.get("eza_medals")),"ezaStep":d.get("max_eza_step"),"source":{"provider":"DokkanInfo GLOBAL","url":f"{BASE}/cards/{cid}","level":"kit"}}
def main():
 p=ROOT/"card-meta.json"; meta=json.loads(p.read_text(encoding="utf-8"));ids=list(meta.get("cards",{}));ok=fail=0
 for n,cid in enumerate(ids,1):
  try:
   kit=parse(cid,payload(cid)); c=meta["cards"][cid]
   for k,v in kit.items():
    if v not in (None,"",[],{}):c[k]=v
   ok+=1
  except Exception as e:
   meta["cards"][cid].setdefault("enrichmentErrors",[]).append(str(e)[:160]);fail+=1
  if n%25==0:
   p.write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding="utf-8");print(n,ok,fail,flush=True);time.sleep(.2)
 meta.setdefault("generated",{}).update({"dokkanInfoMatches":ok,"dokkanInfoFailures":fail,"requestedIds":len(ids)})
 p.write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding="utf-8");print("DONE",ok,fail)
if __name__=="__main__":main()
