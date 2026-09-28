#!/usr/bin/env python3
"""Passe 5: prépare les 241 cartes restantes en lots parallèles pour recherche externe vérifiée."""
import json,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; CAT=ROOT/"catalog-v1.draft.json"
SHARD=int(os.environ.get("SHARD","0")); TOTAL=int(os.environ.get("TOTAL_SHARDS","8"))
d=json.loads(CAT.read_text(encoding="utf-8"))
pending=[c for c in d["cards"] if not (c.get("image") or "").startswith("assets/cards/")]
batch=[c for i,c in enumerate(pending) if i%TOTAL==SHARD]
items=[{"id":str(c["id"]),"name":c.get("name") or "","rarity":c.get("rarity"),"type":c.get("type"),"title":c.get("title") or "","status":"external_search_required"} for c in batch]
p=ROOT/f"docs/IMAGE-MIGRATION-v1-PASS5-SHARD-{SHARD}.json"
p.write_text(json.dumps({"shard":SHARD,"cards":len(items),"items":items},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("shard",SHARD,"cards",len(items))
