#!/usr/bin/env python3
"""Migre les illustrations du catalogue v1 vers des assets locaux, sans modifier le catalogue actif."""
import json, mimetypes, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CAT=ROOT/"catalog-v1.draft.json"; OUT=ROOT/"assets/cards"; OUT.mkdir(parents=True,exist_ok=True)
REPORT=ROOT/"docs/IMAGE-MIGRATION-v1.json"
SIGS=[(b"\x89PNG",".png"),(b"\xff\xd8\xff",".jpg"),(b"GIF87a",".gif"),(b"GIF89a",".gif")]
def ext(data):
    for sig,e in SIGS:
        if data.startswith(sig): return e
    if data.startswith(b"RIFF") and data[8:12]==b"WEBP": return ".webp"
    if len(data)>=12 and data[4:12] in (b"ftypavif",b"ftypavis"): return ".avif"
def main():
 d=json.loads(CAT.read_text(encoding="utf-8")); ok=[]; reused=[]; failed=[]
 for n,c in enumerate(d["cards"],1):
  cid=str(c["id"]); current=c.get("image") or ""
  existing=next((p for p in OUT.glob(cid+".*") if p.is_file()),None)
  if existing:
   c["image"]=existing.relative_to(ROOT).as_posix(); reused.append(cid); continue
  if not current.startswith(("http://","https://")):
   failed.append({"id":cid,"reason":"aucune URL source exploitable","source":current}); continue
  try:
   req=urllib.request.Request(current,headers={"User-Agent":"Mozilla/5.0"})
   with urllib.request.urlopen(req,timeout=20) as r: data=r.read()
   e=ext(data[:32])
   if not e: raise ValueError("format image non reconnu")
   p=OUT/(cid+e); p.write_bytes(data); c["image"]=p.relative_to(ROOT).as_posix(); ok.append(cid)
  except Exception as ex: failed.append({"id":cid,"reason":str(ex)[:160],"source":current})
  if n%100==0: print(n,"/",len(d["cards"]))
 CAT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 REPORT.write_text(json.dumps({"cards":len(d["cards"]),"downloaded":len(ok),"reused":len(reused),"failed":len(failed),"failedItems":failed},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("downloaded",len(ok),"reused",len(reused),"failed",len(failed))
if __name__=="__main__": main()
