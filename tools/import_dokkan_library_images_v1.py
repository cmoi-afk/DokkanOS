#!/usr/bin/env python3
"""Importe les miniatures exact-ID depuis l'archive DokkanBattleLibrary."""
import json,os,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; CAT=ROOT/"catalog-v1.draft.json"; OUT=ROOT/"assets/cards"; SRC=Path(os.environ["THUMB_DIR"])
d=json.loads(CAT.read_text(encoding="utf-8")); byid={str(c["id"]):c for c in d["cards"]}
pending={cid for cid,c in byid.items() if not (c.get("image") or "").startswith("assets/cards/")}
found={}
for p in SRC.rglob("*"):
 if not p.is_file(): continue
 stem=p.stem
 if stem in pending and p.suffix.lower() in {".png",".jpg",".jpeg",".webp"}:
  found.setdefault(stem,p)
ok=[]
for cid,p in found.items():
 ext=".jpg" if p.suffix.lower()==".jpeg" else p.suffix.lower()
 dest=OUT/(cid+ext); shutil.copy2(p,dest); byid[cid]["image"]=dest.relative_to(ROOT).as_posix()
 byid[cid]["imageSource"]="DokkanBattleLibrary exact card ID"; ok.append(cid)
CAT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
remaining=[{"id":cid,"name":byid[cid].get("name")} for cid in pending if cid not in found]
(ROOT/"docs/IMAGE-MIGRATION-v1-LIBRARY.json").write_text(json.dumps({"pendingBefore":len(pending),"recovered":len(ok),"remaining":len(remaining),"recoveredIds":sorted(ok),"remainingItems":sorted(remaining,key=lambda x:x["id"])},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("pending",len(pending),"recovered",len(ok),"remaining",len(remaining))
