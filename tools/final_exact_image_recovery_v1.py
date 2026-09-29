#!/usr/bin/env python3
"""Passe finale: récupère uniquement les assets exact-ID depuis des sources explicitement validées."""
import json,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; CAT=ROOT/"catalog-v1.draft.json"; OUT=ROOT/"assets/cards"; OUT.mkdir(parents=True,exist_ok=True)
# Correspondances exactes confirmées dans le dépôt DokkanArt.
SOURCES={"1028061":"https://raw.githubusercontent.com/dokkanart/dokkanart/master/1028061_artwork.png"}
# Only attempt entries still reported broken by the exhaustive audit.
auditp=ROOT/"docs/IMAGE-AUDIT-FINAL.json"
broken={str(x["id"]) for x in json.loads(auditp.read_text(encoding="utf-8")).get("brokenImages",[])} if auditp.exists() else set()
def fetch(u):
 req=urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=30) as r:return r.read()
def valid(b): return b.startswith(b"\x89PNG") or b[:3]==b"\xff\xd8\xff" or (b.startswith(b"RIFF") and b[8:12]==b"WEBP")
d=json.loads(CAT.read_text(encoding="utf-8")); byid={str(c["id"]):c for c in d["cards"]}; ok=[]; fail=[]
for cid,url in SOURCES.items():
 if broken and cid not in broken: continue
 try:
  b=fetch(url)
  if not valid(b[:32]): raise ValueError("format invalide")
  p=OUT/(cid+".png"); p.write_bytes(b); byid[cid]["image"]=p.relative_to(ROOT).as_posix(); ok.append({"id":cid,"source":url})
 except Exception as e: fail.append({"id":cid,"reason":str(e)})
CAT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"
",encoding="utf-8")
remaining=[{"id":str(c["id"]),"name":c.get("name")} for c in d["cards"] if not (c.get("image") or "").startswith("assets/cards/")]
(ROOT/"docs/IMAGE-MIGRATION-v1-FINAL.json").write_text(json.dumps({"recovered":len(ok),"failed":len(fail),"remaining":len(remaining),"recoveredItems":ok,"failedItems":fail,"remainingItems":remaining},ensure_ascii=False,indent=2)+"
",encoding="utf-8")
print("recovered",len(ok),"remaining",len(remaining))
