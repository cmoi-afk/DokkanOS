#!/usr/bin/env python3
"""Passe 4B shardée: détecte les candidats d'assets locaux voisins sans jamais les affecter automatiquement."""
import json,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; CAT=ROOT/"catalog-v1.draft.json"; OUT=ROOT/"assets/cards"
SHARD=int(os.environ.get("SHARD","0")); TOTAL=int(os.environ.get("TOTAL_SHARDS","8"))
d=json.loads(CAT.read_text(encoding="utf-8"))
pending=[c for c in d["cards"] if not (c.get("image") or "").startswith("assets/cards/")]
batch=[c for i,c in enumerate(pending) if i%TOTAL==SHARD]
rows=[]
for c in batch:
 cid=str(c["id"]); n=int(cid); candidates=[]
 for delta in (-10,-1,1,10):
  nid=str(n+delta)
  for p in OUT.glob(nid+".*"):
   if p.is_file(): candidates.append({"resourceCandidateId":nid,"path":p.relative_to(ROOT).as_posix(),"delta":delta})
 rows.append({"id":cid,"name":c.get("name") or "","rarity":c.get("rarity"),"awakensFrom":c.get("awakensFrom"),"awakensTo":c.get("awakensTo"),"candidates":candidates,"status":"needs_resource_id_confirmation" if candidates else "needs_external_source"})
out=ROOT/f"docs/IMAGE-MIGRATION-v1-PASS4-SHARD-{SHARD}.json"
out.write_text(json.dumps({"shard":SHARD,"cards":len(rows),"items":rows},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("shard",SHARD,"cards",len(rows),"with candidates",sum(bool(x["candidates"]) for x in rows))
