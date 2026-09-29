#!/usr/bin/env python3
"""Applique au draft V1 uniquement les associations resource-ID déjà validées par PASS4."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
catp=ROOT/"catalog-v1.draft.json"; repp=ROOT/"docs/IMAGE-MIGRATION-v1-PASS4.json"
d=json.loads(catp.read_text(encoding="utf-8")); rep=json.loads(repp.read_text(encoding="utf-8"))
byid={str(c["id"]):c for c in d["cards"]}; applied=[]; errors=[]
for x in rep["items"]:
 if x.get("decision")!="validated_resource_pattern": continue
 cid=str(x["id"]); img=x["image"]; rid=str(x["resourceId"])
 p=ROOT/img
 if not p.is_file(): errors.append({"id":cid,"reason":"asset absent","image":img}); continue
 if not (cid.endswith("1") and rid==str(int(cid)-1)):
  errors.append({"id":cid,"reason":"relation resource-ID inattendue","resourceId":rid}); continue
 c=byid.get(cid)
 if not c: errors.append({"id":cid,"reason":"carte absente du draft"}); continue
 c["image"]=img; c["resourceId"]=rid; applied.append(cid)
catp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"
",encoding="utf-8")
remaining=[str(c["id"]) for c in d["cards"] if not (c.get("image") or "").startswith("assets/cards/")]
out={"applied":len(applied),"errors":len(errors),"remainingExternal":len(remaining),"appliedIds":applied,"errorsItems":errors,"remainingIds":remaining}
(ROOT/"docs/IMAGE-MIGRATION-v1-APPLY.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"
",encoding="utf-8")
print("applied",len(applied),"errors",len(errors),"remaining",len(remaining))
if errors: raise SystemExit(1)
