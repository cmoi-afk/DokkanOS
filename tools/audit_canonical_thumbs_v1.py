#!/usr/bin/env python3
"""Audit whether catalogue artwork is a canonical Dokkan card thumbnail.
Exact-ID existence alone is insufficient: provenance must identify a thumbnail
asset, otherwise the card is queued for visual/provenance replacement.
"""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
cat=json.loads((R/"catalog-v1.draft.json").read_text(encoding="utf-8"))
bad=[]; good=[]
for c in cat.get("cards",[]):
    src=str(c.get("imageSource") or "").lower()
    img=str(c.get("image") or "")
    canonical=("_thumb" in img.lower() or "thumbnail" in src or "thumb" in src)
    row={"id":str(c.get("id","")),"name":c.get("name",""),"image":img,"imageSource":c.get("imageSource","")}
    (good if canonical else bad).append(row)
report={"cards":len(cat.get("cards",[])),"canonicalThumbEvidence":len(good),"needsCanonicalThumbVerification":len(bad),"items":bad}
(R/"docs/CANONICAL-THUMB-AUDIT-v1.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k!="items"},ensure_ascii=False))
