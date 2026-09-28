#!/usr/bin/env python3
"""Seconde passe: récupère les images manquantes depuis les pages dbz.space par ID exact."""
import json,re,urllib.request,urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; CAT=ROOT/"catalog-v1.draft.json"; OUT=ROOT/"assets/cards"
def ext(b):
 if b.startswith(b"\x89PNG"): return ".png"
 if b[:3]==b"\xff\xd8\xff": return ".jpg"
 if b.startswith((b"GIF87a",b"GIF89a")): return ".gif"
 if b.startswith(b"RIFF") and b[8:12]==b"WEBP": return ".webp"
def fetch(url):
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=18) as r:return r.read()
d=json.loads(CAT.read_text(encoding="utf-8")); ok=[]; failed=[]
for c in d["cards"]:
 cid=str(c["id"])
 if (c.get("image") or "").startswith("assets/cards/"): continue
 found=False; errs=[]
 for host in ("https://dbz.space/cards/","https://jpn.dbz.space/cards/"):
  try:
   page=host+cid; html=fetch(page).decode("utf-8","ignore")
   urls=re.findall(r'''https?://[^"'<> ]+''',html)
   cand=[u.replace("&amp;","&") for u in urls if cid in u and re.search(r"\.(?:png|jpe?g|webp)(?:\?|$)",u,re.I)]
   for u in cand:
    try:
     data=fetch(u); e=ext(data[:32])
     if not e: continue
     p=OUT/(cid+e); p.write_bytes(data); c["image"]=p.relative_to(ROOT).as_posix(); ok.append({"id":cid,"source":u}); found=True; break
    except Exception as x: errs.append(str(x)[:80])
   if found: break
  except Exception as x: errs.append(str(x)[:80])
 if not found: failed.append({"id":cid,"reason":"; ".join(errs[-3:]) or "aucun asset exact trouvé"})
CAT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"docs/IMAGE-MIGRATION-v1-PASS2.json").write_text(json.dumps({"recovered":len(ok),"failed":len(failed),"recoveredItems":ok,"failedItems":failed},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("recovered",len(ok),"failed",len(failed))
