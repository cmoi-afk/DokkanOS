#!/usr/bin/env python3
"""Build a bulk exact-ID verification queue for EZA/SEZA enrichment.
This does not guess status: it exports every rarity-derived TUR/LR so external
ID-indexed sources can be reconciled in one pass, while preserving provenance.
"""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
cat=json.loads((R/"catalog-v1.draft.json").read_text(encoding="utf-8"))
rows=[]
for c in cat.get("cards",[]):
    if c.get("awakeningStatus") in {"TUR","LR"} and c.get("awakeningStatusProof")=="rarity":
        rows.append({
          "id":str(c.get("id","")),"name":c.get("name",""),"rarity":c.get("rarity",""),
          "type":c.get("type",""),"class":c.get("class",""),"currentStatus":c.get("awakeningStatus",""),
          "dokkanStatsUrl":"https://dokkanstats.com/en/cards/"+str(c.get("id",""))+"/",
          "dokkanWikiUrl":"https://dokkan.wiki/cards/"+str(c.get("id",""))
        })
out={"count":len(rows),"policy":"exact-ID only; no name-based inference","items":rows}
(R/"docs/EZA-BULK-VERIFICATION-QUEUE-v1.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("queued",len(rows))
