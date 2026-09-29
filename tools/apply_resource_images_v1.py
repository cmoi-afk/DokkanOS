#!/usr/bin/env python3
"""Apply only previously validated resource-ID image mappings to current broken cards."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
catp=ROOT/"catalog-v1.draft.json"
repp=ROOT/"docs/IMAGE-MIGRATION-v1-PASS4.json"
auditp=ROOT/"docs/IMAGE-AUDIT-FINAL.json"
d=json.loads(catp.read_text(encoding="utf-8"))
rep=json.loads(repp.read_text(encoding="utf-8"))
broken={str(x["id"]) for x in json.loads(auditp.read_text(encoding="utf-8")).get("brokenImages",[])} if auditp.exists() else set()
byid={str(c["id"]):c for c in d["cards"]}
applied=[]; errors=[]
for x in rep["items"]:
    if x.get("decision")!="validated_resource_pattern": continue
    cid=str(x["id"])
    if cid not in broken: continue
    img=x["image"]; rid=str(x["resourceId"]); p=ROOT/img
    if not p.is_file(): errors.append({"id":cid,"reason":"asset absent","image":img}); continue
    if not (cid.endswith("1") and rid==str(int(cid)-1)):
        errors.append({"id":cid,"reason":"relation resource-ID inattendue","resourceId":rid}); continue
    card=byid.get(cid)
    if not card: errors.append({"id":cid,"reason":"carte absente du draft"}); continue
    card["image"]=img; card["resourceId"]=rid; applied.append(cid)
catp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+chr(10),encoding="utf-8")
remaining=[str(c["id"]) for c in d["cards"] if not (c.get("image") or "").startswith("assets/cards/")]
out={"applied":len(applied),"errors":len(errors),"remainingExternal":len(remaining),"appliedIds":applied,"errorsItems":errors,"remainingIds":remaining}
(ROOT/"docs/IMAGE-MIGRATION-v1-APPLY.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+chr(10),encoding="utf-8")
print("applied",len(applied),"errors",len(errors),"remaining",len(remaining))
if errors: raise SystemExit(1)
