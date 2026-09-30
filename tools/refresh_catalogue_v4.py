#!/usr/bin/env python3
"""Refresh every released playable SSR/UR/LR by exact ID, including separate Z kits."""
import concurrent.futures as futures,gzip,html,io,json,re,subprocess,time,urllib.request
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE="https://glbfr.dokkaninfo.com"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36"
NOW=int(datetime.now(timezone.utc).timestamp())
CHECKED=datetime.now(timezone.utc).isoformat()
RAR={3:"SSR",4:"UR",5:"LR"};TYPES={0:"AGI",1:"TEC",2:"INT",3:"PUI",4:"END"}
CACHE=ROOT/"data-cache"/"catalogue-v4";CACHE.mkdir(parents=True,exist_ok=True)
def request(url,timeout=22,tries=2):
 for attempt in range(tries):
  try:
   req=urllib.request.Request(url,headers={"User-Agent":UA})
   with urllib.request.urlopen(req,timeout=timeout) as r:return r.read()
  except Exception:
   if attempt+1==tries:raise
   time.sleep(1+attempt*2)
def embedded(text,attr="datajson"):
 m=re.search(attr+'="([^"]*)"',text)
 if not m:raise ValueError("Source JSON absent: "+attr)
 return json.loads(html.unescape(m.group(1)))
def payload(cid,step=None,api=False,japan=False):
 key=str(cid)+("-jp" if japan else "")+("-api" if api else "")+("-z"+str(step) if step else "")
 path=CACHE/(key+".json.gz")
 if path.exists():
  with gzip.open(path,"rt",encoding="utf-8") as f:return json.load(f)
 url=("https://jpn.dokkaninfo.com" if japan else BASE)+("/api/cards/"+str(cid)+"/transformation" if api else "/cards/"+str(cid))
 if step:url+="?eza=true&step="+str(step)
 raw=request(url).decode("utf-8")
 d=json.loads(raw) if api else embedded(raw)
 with gzip.open(path,"wt",encoding="utf-8") as f:json.dump(d,f,ensure_ascii=False)
 return d
def clean(s):
 markers={"once":"1 fois","forever":"permanent","stun":"étourdissement","atk_down":"ATT réduite","def_down":"DÉF réduite"}
 return re.sub(r"\{passiveImg:([^}]+)\}",lambda m:" ["+markers[m[1]]+"]" if m[1] in markers else "",str(s or "")).strip()
def names(d,key):return [x["name"] for x in d.get(key,[]) if isinstance(x,dict) and x.get("name")]
def rank(c):return (int(c.get("rarity",0)) if isinstance(c.get("rarity"),int) else {"SSR":3,"UR":4,"LR":5}.get(c.get("rarity"),0),int(c.get("lv_max") or c.get("maxLevel") or c.get("level") or 0))
def kit(d,z=False):
 c=d.get("card") or {};leader=d.get("leader_skill") or {};passive=d.get("passive_skill") or {};active=d.get("active_skill") or {}
 supers=[];seen=set()
 for x in d.get("super_attacks") or []:
  a=x.get("attack") or {};name=a.get("name")
  if not name or int(x.get("lv_start") or 0)>=int(c.get("skill_lv_max") or 1):continue
  item={"name":name,"description":clean(a.get("description")),"ki":x.get("eball_num_start") or 0,"minSALevel":int(x.get("lv_start") or 0)+1,"condition":clean(a.get("causality_description"))}
  sig=json.dumps(item,ensure_ascii=False,sort_keys=True)
  if sig not in seen:supers.append(item);seen.add(sig)
 element=int(c.get("element",0))
 out={"name":c.get("name"),"title":leader.get("name"),"rarity":RAR.get(int(c.get("rarity",0))),"type":TYPES.get(element%10),"class":{1:"Super",2:"Extrême"}.get(element//10,""),"leader":clean(leader.get("description")),"passiveName":passive.get("name"),"passive":clean(passive.get("itemized_description") or passive.get("description")),"superAttack":supers[0] if supers else None,"ultraSuperAttack":next((s for s in supers if s["ki"]>=18),None),"supers":supers,"activeName":active.get("name"),"active":" — ".join(clean(active.get(k)) for k in ["effect_description","condition_description"] if active.get(k)),"categories":names(d,"categories"),"links":names(d,"links"),"cost":c.get("cost"),"maxLevel":c.get("lv_max"),"maxSALevel":c.get("skill_lv_max"),"maxHP":c.get("hp_max"),"maxATK":c.get("atk_max"),"maxDEF":c.get("def_max"),"potentialBonusHP":d.get("hp_hipo"),"potentialBonusATK":d.get("atk_hipo"),"potentialBonusDEF":d.get("def_hipo")}
 for prefix,label in [("hp","HP"),("atk","ATK"),("def","DEF")]:
  value=c.get(prefix+"_max")
  # DokkanInfo's published card component uses Math.round((max-init)*.4839).
  if z and int(c.get("rarity",0))==4 and int(c.get("lv_max",0))==140 and value is not None:
   value+=int((value-int(c.get(prefix+"_init",0)))*.4839+.5)
  out["max"+label]=value
  bonus=d.get(prefix+"_hipo")
  out["rainbow"+label]=value+bonus if value is not None and bonus is not None else None
 return out
def playable(row):
 if int(row.get("rarity",0)) not in RAR:return False
 if not 1000000<=int(row["id"])<4000000:return False
 if int(row.get("open_at") or 0)>NOW:return False
 if all(int(row.get(k,0))<=1 for k in ["hp_max","atk_max","def_max"]):return False
 return not re.search(r"statue|personnage à vendre|hercule statue",row.get("name",""),re.I)
def medals(items,super_z=False):
 amounts={}
 for x in items or []:
  m=x.get("awakening_medal") or {};name=m.get("name") or str(x.get("awakening_item_id"))
  is_super=m.get("rarity")==4 or "[SUPER]" in name
  if is_super!=super_z:continue
  amounts[name]=amounts.get(name,0)+int(x.get("quantity") or 0)
 return [{"name":n,"quantity":q} for n,q in amounts.items()]
def released(route):
 return isinstance(route,dict) and route.get("open_at") is not None and int(route["open_at"])<=NOW
def row_stats(row):
 element=int(row.get("element",0))
 return {"name":row.get("name",""),"rarity":RAR[int(row["rarity"])],"type":TYPES[element%10],"class":{1:"Super",2:"Extrême"}.get(element//10,""),"openAt":row.get("open_at"),"maxLevel":row.get("lv_max"),"maxSALevel":row.get("skill_lv_max"),"maxHP":row.get("hp_max"),"maxATK":row.get("atk_max"),"maxDEF":row.get("def_max"),"resourceId":str(row.get("resource_id") or row.get("icon_id") or row["id"])}
def one(item):
 cid,row=item;url=BASE+"/cards/"+cid
 try:
  d=payload(cid);original=d.get("card") or {};actual=str(original.get("id"))
  redirected=actual!=cid
  if redirected:
   api=payload(cid,api=True)
   if str((api.get("card") or {}).get("id"))!=cid:raise ValueError("ID exact absent de la page et de l'API")
   # Shared leader/category facts are retained only when source identity fields agree.
   same_leader=api["card"].get("leader_skill_set_id") is not None and api["card"].get("leader_skill_set_id")==original.get("leader_skill_set_id")
   same_character=all(api["card"].get(k)==original.get(k) for k in ["character_id","card_unique_info_id"])
   merged={**d,**api}
   for k in ["hp_hipo","atk_hipo","def_hipo"]:
    if k not in api:merged.pop(k,None)
   if "active_skill" not in api:merged.pop("active_skill",None)
   if not same_leader:merged.pop("leader_skill",None)
   if not same_character:merged.pop("categories",None)
   d=merged
  c=d["card"]
  if c.get("is_selling_only") or all(int(c.get(k,0))<=1 for k in ["hp_max","atk_max","def_max"]):return cid,{"excluded":True},None
  parsed=kit(d)
  if parsed.get("rarity") not in RAR.values():return cid,{"excluded":True},None
  if not row.get("_legacy") and parsed.get("rarity")!=RAR[int(row["rarity"])]:raise ValueError("Rareté contradictoire pour l'ID exact")
  rid=str(c.get("asset_id") or c.get("icon_id") or c.get("resource_id") or row.get("icon_id") or cid)
  parsed.update({"id":cid,"resourceId":rid,"categoriesComplete":True,"source":{"provider":"DokkanInfo GLOBAL FR","url":url,"verified":CHECKED,"exactId":cid},"zAwakenings":[],"eza":False,"seza":False,"ezaStep":None,"ezaAvailable":False,"openAt":row.get("open_at"),"dataStatus":{"identity":"verified","kit":"verified" if parsed.get("leader") and (parsed.get("passive") or c.get("passive_skill_set_id") is None) and parsed.get("superAttack") and (parsed.get("links") or not any(c.get("link_skill"+str(i)+"_id") for i in range(1,8))) else "partial","checkedAt":CHECKED}})
  if redirected:
   parsed["source"]["apiUrl"]=BASE+"/api/cards/"+cid+"/transformation"
   # This is a genuine pre-Z-awakening stage, not an alias to upgrade silently.
   if original.get("character_id")==c.get("character_id") and original.get("card_unique_info_id")==c.get("card_unique_info_id") and rank(original)>rank(c):
    parsed["awakensTo"]=actual;parsed["awakeningSource"]=url
  else:
   route=d.get("eza_open_date");super_route=d.get("seza_open_date")
   available=[]
   if released(route):available.append((int(route.get("optimal_awakening_step") or (3 if parsed["rarity"]=="LR" else 7)),False))
   if released(super_route):available.append((int(super_route.get("optimal_awakening_step") or (4 if parsed["rarity"]=="LR" else 8)),True))
   for step,is_super in available:
    kind=("superZlr" if is_super else "zlr") if parsed["rarity"]=="LR" else ("superZtur" if is_super else "ztur")
    try:
     z=payload(cid,step=step)
     if str(z.get("card",{}).get("id"))!=cid:raise ValueError("ID incorrect sur le kit Z")
     if not z.get("super_attacks"):
      jp=payload(cid,step=step,japan=True)
      if str(jp.get("card",{}).get("id"))!=cid :raise ValueError("Référence SP alternative contradictoire")
      translated={x.get("special_set_id"):x.get("attack") for x in d.get("super_attacks",[]) if x.get("attack")}
      fixed=[]
      for attack in jp.get("super_attacks",[]):
       if str(attack.get("card_id"))!=cid or attack.get("special_set_id") not in translated:raise ValueError("SP alternative absente de la référence Global")
       fixed.append({**attack,"attack":translated.get(attack.get("special_set_id")) or attack.get("attack")})
      z={**z,"super_attacks":fixed}
      z["specialAttackSource"]="https://glbfr.dokkaninfo.com/cards/"+cid
      z["specialAttackVerification"]="Exact Global special_set_id and source lv_start; Z max SA verified separately."
     zkit=kit(z,z=True)
     if z.get("specialAttackSource"):zkit["specialAttackSource"]=z["specialAttackSource"]
     if not zkit.get("passive") or not zkit.get("superAttack"):raise ValueError("Kit Z incomplet")
     parsed["zAwakenings"].append({"kind":kind,"step":step,"available":True,"verified":True,"kit":zkit,"medals":medals(d.get("eza_medals"),is_super),"source":{"provider":"DokkanInfo GLOBAL FR","url":url+"?eza=true&step="+str(step),"verified":CHECKED}})
    except Exception as e:parsed.setdefault("zErrors",[]).append({"kind":kind,"reason":str(e)[:160]})
   parsed["eza"]=any(v["kind"] in ["ztur","zlr"] for v in parsed["zAwakenings"])
   parsed["seza"]=any(v["kind"] in ["superZtur","superZlr"] for v in parsed["zAwakenings"])
   parsed["ezaAvailable"]=bool(available);parsed["ezaStep"]=d.get("max_eza_step")
   prior=[x for x in (d.get("awakening_cards") or []) if isinstance(x,dict) and int(x.get("rarity",0)) in RAR]
   if prior:
    parsed["awakeningOrigins"]=[{"id":str(x["id"]),"rarity":RAR[int(x["rarity"])],"name":x.get("name"),"level":x.get("lv_max")} for x in prior]
  parsed["transformations"]=[{"id":str(x["id"]),"name":x.get("name","")} for x in (d.get("transformations") or []) if isinstance(x,dict) and str(x.get("id"))!=cid]
  return cid,parsed,None
 except Exception as e:return cid,None,str(e)[:180]
def local_image(rid):
 out=ROOT/"assets"/"cards";out.mkdir(parents=True,exist_ok=True)
 # Identity comes from explicit resource_id / asset_id / icon_id, never from changing an ID suffix.
 for ext in [".webp",".png",".jpg",".jpeg"]:
  existing=out/(rid+ext)
  if existing.is_file():
   try:
    with Image.open(existing) as im:
     im.load()
     if min(im.size)<40:raise ValueError("image trop petite")
     return rid,existing.relative_to(ROOT).as_posix(),None,"existing-local"
   except Exception:pass
 templates=["https://dokkaninfo.com/assets/global/en/character/thumb/card_{id}_thumb/card_{id}_thumb.png","https://www.dbz-dokkanbattle.com/img/character/thumb/card_{id}_thumb/card_{id}_thumb.png","https://dokkaninfo.com/assets/japan/character/thumb/card_{id}_thumb/card_{id}_thumb.png"]
 errors=[]
 for template in templates:
  url=template.format(id=rid)
  try:
   raw=request(url,timeout=12,tries=1)
   with Image.open(io.BytesIO(raw)) as im:
    im.load()
    if min(im.size)<40 or max(im.size)>2000:raise ValueError("miniature invalide")
    path=out/(rid+".webp");im.convert("RGBA").save(path,"WEBP",lossless=True,method=4)
   return rid,path.relative_to(ROOT).as_posix(),None,url
  except Exception as e:errors.append(str(e)[:80])
 return rid,None,"; ".join(errors),None
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
def main():
 cat=json.loads((ROOT/"catalog.json").read_text());meta=json.loads((ROOT/"card-meta.json").read_text());old={str(c["id"]):c for c in cat["cards"]}
 fr=embedded(request(BASE+"/cards?sort=open_at",timeout=65).decode("utf-8"),"cardsjson")
 en=embedded(request("https://dokkaninfo.com/cards?sort=open_at",timeout=65).decode("utf-8"),"cardsjson")
 if len(fr)<10000 or len(en)<10000:raise ValueError("Index tronqué")
 en_by={str(c["id"]):c for c in en};rows={str(c["id"]):c for c in fr if playable(c)}
 conflicts=[cid for cid,c in rows.items() if cid not in en_by or any(str(c.get(k))!=str(en_by[cid].get(k)) for k in ["rarity","element","icon_id"])]
 if conflicts:raise ValueError("Index FR/Global contradictoires: "+str(conflicts[:20]))
 # Keep genuine legacy SSR/UR/LR stages for the user's captures; verify each via the exact API.
 legacy={cid:c for cid,c in old.items() if c.get("rarity") in RAR.values() and cid not in rows and 1000000<=int(cid)<4000000}
 jobs={**rows}
 for cid,c in legacy.items():
  jobs[cid]={"_legacy":True,"id":int(cid),"name":c.get("name",""),"rarity":{v:k for k,v in RAR.items()}[c["rarity"]],"element":en_by.get(cid,{}).get("element",{"Super":10,"Extrême":20}.get(c.get("class"),0)+{v:k for k,v in TYPES.items()}[c["type"]]),"icon_id":c.get("resourceId") or cid,"open_at":en_by.get(cid,{}).get("open_at",0)}
 previous_report=json.loads((ROOT/"docs"/"CATALOG-AUDIT-v4.json").read_text()) if (ROOT/"docs"/"CATALOG-AUDIT-v4.json").exists() else {}
 report={"checkedAt":CHECKED,"status":"running","reference":{"provider":"DokkanInfo GLOBAL FR + GLOBAL","totalRows":len(fr),"releasedPlayableSourceIds":len(rows),"verifiedIds":sorted(rows)},"before":previous_report.get("before") if previous_report.get("before",{}).get("srRemoved") else {"cards":2045,"srRemoved":159},"errors":[],"zErrors":[],"excluded":[]}
 results={};processed=0
 def checkpoint(publish=False):
  report["processed"]=processed;report["requested"]=len(jobs);write(ROOT/"docs"/"CATALOG-AUDIT-v4.json",report)
  if publish:
   try:
    for args in [["git","config","user.name","DokkanOS Bot"],["git","config","user.email","actions@users.noreply.github.com"],["git","add","docs/CATALOG-AUDIT-v4.json"],["git","commit","-m","Catalogue progress: "+str(processed)+"/"+str(len(jobs))+" exact card checks"],["git","pull","--rebase","origin","feat/catalogue-v4"],["git","push","origin","HEAD:feat/catalogue-v4"]]:subprocess.run(args,cwd=ROOT,check=True)
   except Exception as e:print("Progress checkpoint could not be published",str(e),flush=True)
 with futures.ThreadPoolExecutor(max_workers=4) as ex:
  for cid,parsed,error in ex.map(one,jobs.items()):
   processed+=1
   if error:report["errors"].append({"id":cid,"reason":error})
   elif parsed.get("excluded"):report["excluded"].append(cid)
   else:results[cid]=parsed
   if processed%100==0:checkpoint(publish=processed%1000==0);print("Fiches",processed,"/",len(jobs),"erreurs",len(report["errors"]),flush=True)
   if processed==100 and len(report["errors"])>80:raise RuntimeError("Sources indisponibles : arrêt avant collecte massive")
 checkpoint()
 # Build only source-confirmed edges. Do not identify chains from adjacent IDs or identical names.
 edges={}
 for cid,c in results.items():
  if c.get("awakensTo") in results:edges[cid]=c["awakensTo"]
  prior=[x for x in c.get("awakeningOrigins",[]) if x["id"]!=cid and rank(x)<rank(c)]
  path=[x["id"] for x in sorted(prior,key=lambda x:({"SSR":3,"UR":4,"LR":5}[x["rarity"]],x.get("level") or 0)) if x["id"] in results]+[cid]
  for a,b in zip(path,path[1:]):
   if a!=b and (a not in edges or edges[a]==b):edges[a]=b
 # Ensure monotonic chains; reject conflicting cycles without corrupting the rest of the catalogue.
 for start in list(edges):
  seen=set();x=start
  while x in edges:
   if x in seen:report["errors"].append({"id":start,"reason":"Chaîne cyclique rejetée"});edges.pop(start,None);break
   seen.add(x);x=edges[x]
 for a,b in edges.items():results[a]["awakensTo"]=b;results[b].setdefault("awakensFrom",a)
 for cid,c in results.items():
  report["zErrors"].extend({"id":cid,**e} for e in c.pop("zErrors",[]))
  previous=meta["cards"].get(cid,{})
  m={**previous,**c};
  for key in ["awakensTo","awakensFrom","awakeningOrigins","awakeningSource"]:
   if key not in c:m.pop(key,None)
  m["fr"]={k:v for k,v in c.items() if k in ["name","title","leader","passiveName","passive","superAttack","ultraSuperAttack","supers","activeName","active","categories","links","transformations","type","class"]};m["fr"]["_official"]=True
  meta["cards"][cid]=m
 # Failed historical entries remain explicit partial records; fresh source IDs are still all present.
 catalogue=[]
 for cid,row in jobs.items():
  if cid in report["excluded"]:continue
  c=results.get(cid)
  if c:
   entry={k:v for k,v in c.items() if k in ["id","name","title","rarity","type","class","resourceId","openAt","awakensTo","awakensFrom","dataStatus","source"]};entry["id"]=cid
  else:entry={**old.get(cid,{}),**row_stats(row),"id":cid,"dataStatus":{"identity":"verified" if cid in rows else "pending","kit":"partial","checkedAt":CHECKED}}
  catalogue.append(entry)
 images={};resources=sorted({c["resourceId"] for c in catalogue if str(c.get("resourceId","")).isdigit()})
 with futures.ThreadPoolExecutor(max_workers=4) as ex:
  for n,(rid,path,error,url) in enumerate(ex.map(local_image,resources),1):
   images[rid]={"path":path,"error":error,"url":url}
   if n%100==0:print("Images",n,"/",len(resources),"manquantes",sum(bool(x["error"]) for x in images.values()),flush=True)
 image_errors=[]
 for c in catalogue:
  image=images.get(c["resourceId"],{})
  if image.get("path"):c["image"]=image["path"];c["dataStatus"]["image"]="verified";meta["cards"].setdefault(c["id"],{})["image"]=c["image"];meta["cards"][c["id"]]["resourceId"]=c["resourceId"]
  else:
   c["dataStatus"]["image"]="missing";c["image"]=old.get(c["id"],{}).get("image","") or "https://dokkaninfo.com/assets/global/en/character/thumb/card_"+c["resourceId"]+"_thumb/card_"+c["resourceId"]+"_thumb.png";image_errors.append({"id":c["id"],"resourceId":c["resourceId"],"reason":image.get("error","Identifiant de ressource absent")})
 missing=sorted(set(rows)-{c["id"] for c in catalogue}-set(report["excluded"]))
 report.update({"after":{"cards":len(catalogue),"rarities":dict(Counter(c["rarity"] for c in catalogue)),"kitsVerified":sum(c["dataStatus"]["kit"]=="verified" for c in catalogue),"imagesVerified":len(catalogue)-len(image_errors),"zKits":dict(Counter(v["kind"] for c in results.values() for v in c["zAwakenings"]))},"imageErrors":image_errors,"missingSourceIds":missing,"indexConflicts":conflicts})
 report["status"]="complete" if not missing and not image_errors and not report["errors"] and not report["zErrors"] and report["after"]["kitsVerified"]==len(catalogue) else "partial"
 cat.update({"version":"4.0-catalogue","provider":"DokkanInfo GLOBAL FR","cards":sorted(catalogue,key=lambda c:int(c["id"])),"audit":{"count":len(catalogue),"uniqueIds":len(catalogue),"duplicateIds":0,"status":report["status"],"checkedAt":CHECKED,"rarityCounts":report["after"]["rarities"]},"reference":report["reference"]})
 meta.setdefault("generated",{})["catalogueV4"]={k:report[k] for k in ["checkedAt","status","after"]};meta["version"]="4.0-catalogue"
 write(ROOT/"catalog.json",cat);write(ROOT/"card-meta.json",meta);write(ROOT/"docs"/"CATALOG-AUDIT-v4.json",report)
 public={k:report[k] for k in ["checkedAt","status","before","after"]};public["note"]="Contrôle complet effectué." if report["status"]=="complete" else "Collecte effectuée ; "+str(len(report["errors"]))+" fiches, "+str(len(report["zErrors"]))+" kits Z et "+str(len(image_errors))+" images à reprendre."
 write(ROOT/"catalogue-report.json",public)
 print(json.dumps(public,ensure_ascii=False,indent=2),flush=True)
if __name__=="__main__":main()
