#!/usr/bin/env python3
"""Passe 3: assets DokkanInfo par ID exact, uniquement pour les cartes encore distantes."""
import json,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; CAT=ROOT/"catalog-v1.draft.json"; OUT=ROOT/"assets/cards"
TEMPLATES=[
 "https://dokkaninfo.com/assets/global/en/character/thumb/card_{id}_thumb/card_{id}_thumb.png",
 "https://dokkaninfo.com/assets/global/en/character/thumb/card_{id}thumb/card{id}_thumb.png",
 "https://dokkaninfo.com/assets/japan/character/thumb/card_{id}_thumb/card_{id}_thumb.png",
 "https://dokkaninfo.com/assets/japan/character/thumb/card_{id}thumb/card{id}_thumb.png",
]
def fetch(url):
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=15) as r:
  if r.status!=200:return None
  return r.read()
def ext(b):
 if b.startswith(b"\x89PNG"):return ".png"
 if b[:3]==b"\xff\xd8\xff":return ".jpg"
 if b.startswith(b"RIFF") and b[8:12]==b"WEBP":return ".webp"
 if b.startswith((b"GIF87a",b"GIF89a")):return ".gif"
d=json.loads(CAT.read_text(encoding="utf-8")); ok=[]; failed=[]
for c in d["cards"]:
 cid=str(c["id"])
 if (c.get("image") or "").startswith("assets/cards/"):continue
 found=False
 for t in TEMPLATES:
  url=t.format(id=cid)
  try:
   data=fetch(url)
   if not data:continue
   e=ext(data[:32])
   if not e:continue
   p=OUT/(cid+e);p.write_bytes(data);c["image"]=p.relative_to(ROOT).as_posix()
   ok.append({"id":cid,"source":url});found=True;break
  except Exception:pass
 if not found:failed.append({"id":cid})
CAT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"docs/IMAGE-MIGRATION-v1-PASS3.json").write_text(json.dumps({"recovered":len(ok),"failed":len(failed),"recoveredItems":ok,"failedItems":failed},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("recovered",len(ok),"failed",len(failed))
