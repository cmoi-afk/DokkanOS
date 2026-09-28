#!/usr/bin/env python3
"""Inventaire neutre des images déjà présentes dans DokkanOS.
Ne dépend d'aucun ancien catalogue et ne modifie aucun asset.
"""
import json,re,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; A=ROOT/"assets/cards"
items=[]
for p in sorted(A.rglob("*")):
 if not p.is_file() or p.suffix.lower() not in {".png",".jpg",".jpeg",".webp",".gif"}: continue
 stem=p.stem
 m=re.fullmatch(r"(\d+)",stem)
 b=p.read_bytes()
 items.append({"file":p.relative_to(ROOT).as_posix(),"resourceId":m.group(1) if m else None,"ext":p.suffix.lower(),"bytes":len(b),"sha256":hashlib.sha256(b).hexdigest()})
ids={}
for x in items:
 if x["resourceId"]: ids.setdefault(x["resourceId"],[]).append(x["file"])
dupes={k:v for k,v in ids.items() if len(v)>1}
out={"files":len(items),"numericResourceIds":len(ids),"nonNumericFiles":sum(x["resourceId"] is None for x in items),"duplicateResourceIds":len(dupes),"duplicates":dupes,"items":items}
(ROOT/"v2/ASSET-INVENTORY.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print({k:out[k] for k in ("files","numericResourceIds","nonNumericFiles","duplicateResourceIds")})
