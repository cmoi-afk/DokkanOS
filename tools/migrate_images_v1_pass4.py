#!/usr/bin/env python3
"""Passe 4 shardée. Produit uniquement un rapport par lot; aucune association approximative."""
import json,os,re,urllib.request,urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; CAT=ROOT/"catalog-v1.draft.json"
SHARD=int(os.environ.get("SHARD","0")); TOTAL=int(os.environ.get("TOTAL_SHARDS","8"))
d=json.loads(CAT.read_text(encoding="utf-8"))
pending=[c for c in d["cards"] if not (c.get("image") or "").startswith("assets/cards/")]
batch=[c for i,c in enumerate(pending) if i%TOTAL==SHARD]
rows=[]
for c in batch:
 cid=str(c["id"]); name=c.get("name") or ""
 rows.append({"id":cid,"name":name,"status":"pending_verified_source"})
out=ROOT/f"docs/IMAGE-MIGRATION-v1-PASS4-SHARD-{SHARD}.json"
out.write_text(json.dumps({"shard":SHARD,"totalShards":TOTAL,"cards":len(rows),"items":rows},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("shard",SHARD,"cards",len(rows))
