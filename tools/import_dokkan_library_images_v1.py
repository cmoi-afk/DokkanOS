#!/usr/bin/env python3
"""Importe les miniatures exact-ID depuis l'archive DokkanBattleLibrary."""
import json,os,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; CAT=ROOT/"catalog-v1.draft.json"; OUT=ROOT/"assets/cards"; SRC=Path(os.environ["THUMB_DIR"])
d=json.loads(CAT.read_text(encoding="utf-8")); byid={str(c["id"]):c for c in d["cards"]}
audit_path=ROOT/"docs/IMAGE-AUDIT-FINAL.json"
broken=set()
if audit_path.exists():
 audit=json.loads(audit_path.read_text(encoding="utf-8")); broken={str(x["id"]) for x in audit.get("brokenImages",[])}
pending={cid for cid,c in byid.items() if cid in broken or not (c.get("image") or "").startswith("assets/cards/")}
found={}
for p in SRC.rglob("*"):
 if not p.is_file(): continue
 stem=p.stem
 import re
 m=re.search(r"(\\d{7})",stem); key=m.group(1) if m else stem
 if key in pending and p.suffix.lower() in {".png",".jpg",".jpeg",".webp"}:
  found.setdefault(key,p)
ok=[]
for cid,p in found.items():
 ext=".jpg" if p.suffix.lower()==".jpeg" else p.suffix.lower()
 dest=OUT/(cid+ext); shutil.copy2(p,dest); byid[cid]["image"]=dest.relative_to(ROOT).as_posix()
 byid[cid]["imageSource"]="DokkanBattleLibrary exact card ID"; ok.append(cid)
",encoding="utf-8")
(ROOT/"docs/IMAGE-MIGRATION-v1-LIBRARY.json").write_text(json.dumps({"pendingBefore":len(pending),"recovered":len(ok),"remaining":len(remaining),"recoveredIds":sorted(ok),"remainingItems":sorted(remaining,key=lambda x:x["id"])},ensure_ascii=False,indent=2)+"
",encoding="utf-8")
print("pending",len(pending),"recovered",len(ok),"remaining",len(remaining))
