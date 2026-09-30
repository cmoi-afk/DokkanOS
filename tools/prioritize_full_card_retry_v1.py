#!/usr/bin/env python3
"""Prioritize the existing retry queue for useful max-awakening card artwork."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
q=json.loads((R/"docs/FULL-CARD-ASSET-RETRY-v1.json").read_text(encoding="utf-8"))
cat=json.loads((R/"catalog-v1.draft.json").read_text(encoding="utf-8"))
cards={str(c.get("id","")):c for c in cat.get("cards",[])}
priority=[]; deferred=[]
for row in q.get("items",[]):
    c=cards.get(str(row.get("id","")),{})
    rarity=str(c.get("rarity","")).upper().strip()
    enriched={**row,"name":c.get("name",""),"rarity":rarity,"type":c.get("type",""),"class":c.get("class","")}
    # The active image recovery focuses on final high-rarity playable forms.
    # SR/R/N and unknown/non-card rows remain documented but do not consume retry workers.
    if rarity in {"LR","UR","TUR","SSR"}:
        priority.append(enriched)
    else:
        enriched["deferReason"]="low-or-unknown-rarity"
        deferred.append(enriched)
out={"policy":"priority artwork recovery: LR/UR/TUR/SSR only; lower/unknown rarity deferred","cards":len(priority),"items":priority}
defer={"policy":"not deleted; excluded from active artwork retry","cards":len(deferred),"items":deferred}
(R/"docs/FULL-CARD-ASSET-RETRY-PRIORITY-v1.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(R/"docs/FULL-CARD-ASSET-DEFERRED-v1.json").write_text(json.dumps(defer,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"retryTotal":len(q.get("items",[])),"priority":len(priority),"deferred":len(deferred)}))
