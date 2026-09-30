#!/usr/bin/env python3
"""Build exact-ID canonical thumbnail targets for every DokkanOS card."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
cat=json.loads((R/"catalog-v1.draft.json").read_text(encoding="utf-8"))
items=[]
for c in cat.get("cards",[]):
    cid=str(c.get("id",""))
    items.append({
      "id":cid,"name":c.get("name",""),
      "targetFilename":cid+".png",
      "canonicalAssetName":"card_"+cid+"_thumb.png",
      "sourcePage":"https://www.dbz-dokkanbattle.com/card/"+cid,
      "state":"pending-download-or-proof"
    })
out={"cards":len(items),"policy":"exact card ID -> card_<ID>_thumb.png only","items":items}
(R/"docs/CANONICAL-THUMB-TARGETS-v1.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("targets",len(items))
